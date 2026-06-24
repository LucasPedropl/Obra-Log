import { Info, Loader2, Upload, X } from 'lucide-react';

export interface RentedPhoto {
	name: string;
	url: string;
	path: string;
}

interface AddRentedPhotosSectionProps {
	photos: RentedPhoto[];
	isUploading: boolean;
	onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onRemove: (index: number) => void;
}

export function AddRentedPhotosSection({
	photos,
	isUploading,
	onUpload,
	onRemove,
}: AddRentedPhotosSectionProps) {
	return (
		<div className="col-span-2">
			<label className="block text-sm font-medium text-gray-700 mb-1">
				Anexo / Foto (Opcional)
			</label>
			<label className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-50 cursor-pointer transition-colors relative">
				{isUploading ? (
					<Loader2 className="w-6 h-6 mb-2 text-[#101828] animate-spin" />
				) : (
					<Upload className="w-6 h-6 mb-2 text-gray-400" />
				)}
				<span className="text-sm font-medium">
					{isUploading
						? 'Enviando arquivos...'
						: 'Clique ou arraste imagens aqui'}
				</span>
				<span className="text-xs mt-1">PNG, JPG ou PDF (Máx. 5MB)</span>
				<input
					type="file"
					className="hidden"
					accept="image/*,.pdf"
					multiple
					onChange={onUpload}
					disabled={isUploading}
				/>
			</label>

			{photos.length > 0 && (
				<div className="mt-3 space-y-2">
					<label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
						Arquivos Anexados ({photos.length})
					</label>
					<div className="grid grid-cols-1 gap-2">
						{photos.map((photo, idx) => (
							<div
								key={photo.path}
								className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg group"
							>
								<div className="flex items-center gap-3 overflow-hidden">
									<div className="w-8 h-8 bg-white rounded border border-gray-200 flex items-center justify-center text-gray-600 flex-shrink-0">
										<Info className="w-4 h-4" />
									</div>
									<div className="flex flex-col min-w-0">
										<a
											href={photo.url}
											target="_blank"
											rel="noopener noreferrer"
											className="text-xs font-bold text-gray-800 truncate hover:text-black hover:underline"
										>
											{photo.name}
										</a>
										<span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
											Ver arquivo
										</span>
									</div>
								</div>
								<button
									type="button"
									onClick={() => onRemove(idx)}
									className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
								>
									<X className="w-4 h-4" />
								</button>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
