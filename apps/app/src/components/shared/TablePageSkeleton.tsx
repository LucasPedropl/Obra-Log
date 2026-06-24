import { Skeleton } from '@/components/ui/skeleton';

interface TablePageSkeletonProps {
	rows?: number;
	columns?: number;
}

export function TablePageSkeleton({
	rows = 6,
	columns = 4,
}: TablePageSkeletonProps) {
	return (
		<div className="flex flex-col gap-4 animate-in fade-in duration-300">
			<Skeleton className="h-10 w-full rounded-[5px]" />
			<div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
				<div className="flex gap-4 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
					{Array.from({ length: columns }).map((_, i) => (
						<Skeleton key={`head-${i}`} className="h-4 flex-1" />
					))}
				</div>
				{Array.from({ length: rows }).map((_, row) => (
					<div
						key={`row-${row}`}
						className="flex gap-4 px-4 py-4 border-b border-gray-50 last:border-0"
					>
						{Array.from({ length: columns }).map((_, col) => (
							<Skeleton key={`cell-${row}-${col}`} className="h-4 flex-1" />
						))}
					</div>
				))}
			</div>
		</div>
	);
}
