'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toaster';

interface ImportModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	description: string;
	onImportLines: (lines: string[]) => Promise<void>;
}

export function ImportModal({
	isOpen,
	onClose,
	title,
	description,
	onImportLines,
}: ImportModalProps) {
	const { addToast } = useToast();
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	if (!isOpen) return null;

	const handleFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// Validation to only allow txt
		if (!file.name.endsWith('.txt') && file.type !== 'text/plain') {
			addToast('Por favor, selecione um arquivo .txt', 'error');
			if (fileInputRef.current) fileInputRef.current.value = '';
			return;
		}

		setIsUploading(true);

		try {
			const text = await file.text();
			const lines = text
				.split('\n')
				.map((line) => line.trim())
				.filter((line) => line.length > 0);

			if (lines.length === 0) {
				addToast('O arquivo informado não possui dados.', 'error');
				return;
			}

			await onImportLines(lines);
			addToast(
				`${lines.length} linhas processadas com sucesso.`,
				'success',
			);
			onClose();
		} catch (error) {
			console.error('Error importing file:', error);
			addToast('Não foi possível processar o arquivo.', 'error');
		} finally {
			setIsUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = '';
		}
	};

	return (
		<div
			className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-left h-[100dvh]"
			onClick={onClose}
		>
			<div
				className="w-full max-w-lg bg-white rounded-xl shadow-2xl flex flex-col border border-gray-100 overflow-hidden outline-none"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white min-h-[72px]">
					<div className="flex flex-col gap-1">
						<h2 className="text-xl font-bold text-[#101828] leading-tight">
							{title}
						</h2>
						<p className="text-sm text-gray-500 font-medium">
							{description}
						</p>
					</div>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 -mr-2 transition-colors flex-shrink-0"
						onClick={onClose}
					>
						<X className="w-5 h-5" />
					</Button>
				</div>

				<div className="p-8 flex flex-col items-center justify-center gap-6">
					<div className="w-16 h-16 rounded-full bg-blue-50 flex flex-col items-center justify-center">
						{isUploading ? (
							<Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
						) : (
							<UploadCloud className="w-8 h-8 text-blue-600" />
						)}
					</div>

					<div className="text-center max-w-sm">
						<p className="text-base font-semibold text-gray-900 mb-1">
							{isUploading
								? 'Processando e importando...'
								: 'Clique para selecionar seu arquivo .txt'}
						</p>
						<p className="text-sm text-gray-500">
							No momento, a importação suporta apenas arquivos no
							formato TXT, separados por ponto e vírgula (;) e sem
							cabeçalho.
						</p>
					</div>

					<input
						type="file"
						accept=".txt"
						ref={fileInputRef}
						onChange={handleFileChange}
						className="hidden"
						disabled={isUploading}
					/>

					<Button
						onClick={() => fileInputRef.current?.click()}
						disabled={isUploading}
						className="bg-[#101828] hover:bg-[#1b263b] text-white w-full max-w-[200px] h-11"
					>
						Selecionar Arquivo
					</Button>
				</div>
			</div>
		</div>
	);
}
