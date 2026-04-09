import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
}

export function Pagination({
	currentPage,
	totalPages,
	onPageChange,
}: PaginationProps) {
	if (totalPages <= 1) return null;

	return (
		<div className="flex items-center justify-between px-2 py-4">
			<div className="text-sm text-gray-500">
				Página{' '}
				<span className="font-medium text-gray-900">{currentPage}</span>{' '}
				de{' '}
				<span className="font-medium text-gray-900">{totalPages}</span>
			</div>
			<div className="flex items-center space-x-2">
				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(currentPage - 1)}
					disabled={currentPage === 1}
					className="text-gray-600 bg-white"
				>
					<ChevronLeft className="h-4 w-4" />
					<span className="sr-only">Anterior</span>
				</Button>
				<div className="flex -space-x-px">
					{Array.from({ length: totalPages }, (_, i) => i + 1).map(
						(page) => (
							<Button
								key={page}
								variant={
									currentPage === page ? 'default' : 'outline'
								}
								size="sm"
								onClick={() => onPageChange(page)}
								className={
									currentPage === page
										? 'bg-slate-900 text-white hover:bg-slate-800'
										: 'bg-white text-gray-700 hover:bg-gray-50'
								}
							>
								{page}
							</Button>
						),
					)}
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(currentPage + 1)}
					disabled={currentPage === totalPages}
					className="text-gray-600 bg-white"
				>
					<ChevronRight className="h-4 w-4" />
					<span className="sr-only">Próxima</span>
				</Button>
			</div>
		</div>
	);
}
