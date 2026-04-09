import React from 'react';
import { FileQuestion } from 'lucide-react';

interface EmptyStateProps {
	title: string;
	description: string;
	icon?: React.ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
	return (
		<div className="bg-white rounded-xl border border-gray-100 flex flex-col items-center justify-center py-20 px-4 text-center w-full shadow-sm">
			<div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
				{icon || <FileQuestion className="w-8 h-8" />}
			</div>
			<h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
			<p className="text-gray-500 max-w-sm">{description}</p>
		</div>
	);
}
