'use client';

import React from 'react';
import { CalendarRange } from 'lucide-react';

interface PeriodPickerProps {
	startDate: string;
	endDate: string;
	onChange: (start: string, end: string) => void;
}

export function PeriodPicker({ startDate, endDate, onChange }: PeriodPickerProps) {
	return (
		<div className="flex flex-wrap items-end gap-4 rounded-[5px] border border-gray-200 bg-white p-4 shadow-sm">
			<div className="flex items-center gap-2 text-gray-500 mb-2.5">
				<CalendarRange size={18} />
				<span className="text-sm font-semibold text-gray-700">Período</span>
			</div>
			<div className="flex flex-col gap-1.5">
				<label className="text-xs font-semibold text-gray-700">Início</label>
				<input
					type="date"
					value={startDate}
					max={endDate || undefined}
					onChange={(e) => onChange(e.target.value, endDate)}
					className="h-10 rounded-[5px] border border-gray-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
				/>
			</div>
			<div className="flex flex-col gap-1.5">
				<label className="text-xs font-semibold text-gray-700">Fim</label>
				<input
					type="date"
					value={endDate}
					min={startDate || undefined}
					onChange={(e) => onChange(startDate, e.target.value)}
					className="h-10 rounded-[5px] border border-gray-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
				/>
			</div>
		</div>
	);
}
