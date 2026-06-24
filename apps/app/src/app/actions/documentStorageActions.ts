'use server';

import { z } from 'zod';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import { safeLogError } from '@/lib/safeLog';
import {
	assertCompanyResourcePermission,
	getAuthenticatedUserId,
	getValidatedCompanyId,
} from './_helpers';

const BUCKET_COLLABORATOR = 'collaborator-documents';
const BUCKET_RENTED = 'rented-equipments';

const ALLOWED_BUCKETS = [BUCKET_COLLABORATOR, BUCKET_RENTED] as const;

const ALLOWED_MIME = new Set([
	'application/pdf',
	'image/jpeg',
	'image/png',
	'image/webp',
]);

const MAX_BYTES = 5 * 1024 * 1024;
const SIGNED_URL_TTL_SEC = 3600;

const deleteSchema = z.object({
	bucket: z.enum(ALLOWED_BUCKETS),
	path: z.string().min(1),
});

type UploadResult =
	| { success: true; signedUrl: string; path: string }
	| { success: false; error: string };

type DeleteResult = { success: true } | { success: false; error: string };

function validateFile(file: File): void {
	if (!ALLOWED_MIME.has(file.type)) {
		throw new Error('Tipo de arquivo não permitido. Use PDF, JPG ou PNG.');
	}
	if (file.size > MAX_BYTES) {
		throw new Error('Arquivo excede o limite de 5 MB.');
	}
}

async function assertUploadPermission(
	userId: string,
	companyId: string,
	bucket: (typeof ALLOWED_BUCKETS)[number],
): Promise<void> {
	if (bucket === BUCKET_COLLABORATOR) {
		await assertCompanyResourcePermission(
			userId,
			companyId,
			'colaboradores',
			'create',
		);
		return;
	}
	await assertCompanyResourcePermission(userId, companyId, 'obras', 'edit');
}

/** Uploads a private document via service role; returns a short-lived signed URL. */
export async function uploadPrivateDocumentAction(
	formData: FormData,
): Promise<UploadResult> {
	try {
		const file = formData.get('file');
		const bucketRaw = formData.get('bucket');

		if (!(file instanceof File)) {
			return { success: false, error: 'Arquivo inválido' };
		}

		const bucket = z.enum(ALLOWED_BUCKETS).parse(bucketRaw);
		const userId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(userId);
		await assertUploadPermission(userId, companyId, bucket);

		validateFile(file);

		const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
		const filePath = `${companyId}/${crypto.randomUUID()}.${ext}`;
		const buffer = Buffer.from(await file.arrayBuffer());

		const { error: uploadError } = await supabaseAdmin.storage
			.from(bucket)
			.upload(filePath, buffer, {
				contentType: file.type,
				upsert: false,
			});

		if (uploadError) throw new Error(uploadError.message);

		const { data: signed, error: signError } = await supabaseAdmin.storage
			.from(bucket)
			.createSignedUrl(filePath, SIGNED_URL_TTL_SEC);

		if (signError || !signed?.signedUrl) {
			throw new Error(signError?.message ?? 'Falha ao gerar URL assinada');
		}

		return { success: true, signedUrl: signed.signedUrl, path: filePath };
	} catch (error: unknown) {
		safeLogError('uploadPrivateDocumentAction', error);
		const message =
			error instanceof z.ZodError
				? 'Bucket inválido'
				: error instanceof Error
					? error.message
					: 'Erro no upload';
		return { success: false, error: message };
	}
}

/** Deletes a private document after validating company scope in path. */
export async function deletePrivateDocumentAction(
	input: z.infer<typeof deleteSchema>,
): Promise<DeleteResult> {
	try {
		const data = deleteSchema.parse(input);
		const userId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(userId);
		await assertUploadPermission(userId, companyId, data.bucket);

		const pathCompanyId = data.path.split('/')[0];
		if (pathCompanyId !== companyId) {
			return { success: false, error: 'Arquivo fora do escopo da empresa' };
		}

		const { error } = await supabaseAdmin.storage
			.from(data.bucket)
			.remove([data.path]);

		if (error) throw new Error(error.message);
		return { success: true };
	} catch (error: unknown) {
		safeLogError('deletePrivateDocumentAction', error);
		const message =
			error instanceof Error ? error.message : 'Erro ao remover arquivo';
		return { success: false, error: message };
	}
}
