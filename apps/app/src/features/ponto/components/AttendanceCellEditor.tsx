'use client';

import React, { useState } from 'react';
import { Loader2, Trash2, X } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { STATUS_CONFIG, STATUS_OPTIONS } from '../lib/attendanceConfig';
import type {
	AttendanceRecord,
	AttendanceStatus,
	UpsertAttendanceInput,
} from '../schemas/attendanceSchema';
import { hasPartialClockTimes } from '../lib/workdaySchedule';
import { IncompleteHoursWarning } from './IncompleteHoursWarning';

interface AttendanceCellEditorProps {
	collaboratorName: string;
	dateLabel: string;
	record?: AttendanceRecord;
	onSave: (
		data: Pick<UpsertAttendanceInput, 'status' | 'clockIn' | 'clockOut' | 'lunchStart' | 'lunchEnd' | 'notes'>,
	) => Promise<boolean>;
	onClear: () => Promise<boolean>;
	onClose: () => void;
}

export function AttendanceCellEditor({
	collaboratorName,
	dateLabel,
	record,
	onSave,
	onClear,
	onClose,
}: AttendanceCellEditorProps) {
	const [status, setStatus] = useState<AttendanceStatus>(
		record?.status || 'PRESENT',
	);
	const [clockIn, setClockIn] = useState(record?.clock_in?.slice(0, 5) || '');
	const [clockOut, setClockOut] = useState(record?.clock_out?.slice(0, 5) || '');
	const [lunchStart, setLunchStart] = useState(record?.lunch_start?.slice(0, 5) || '');
	const [lunchEnd, setLunchEnd] = useState(record?.lunch_end?.slice(0, 5) || '');
	const [notes, setNotes] = useState(record?.notes || '');
	const [isBusy, setIsBusy] = useState(false);

	const isPresence = STATUS_CONFIG[status].isPresence;
	const incompleteTimes =
		isPresence &&
		hasPartialClockTimes(clockIn, clockOut, lunchStart, lunchEnd);

	const handleSave = async () => {
		setIsBusy(true);
		const ok = await onSave({
			status,
			clockIn: isPresence ? clockIn || null : null,
			clockOut: isPresence ? clockOut || null : null,
			lunchStart: isPresence ? lunchStart || null : null,
			lunchEnd: isPresence ? lunchEnd || null : null,
			notes: notes || null,
		});
		setIsBusy(false);
		if (ok) onClose();
	};

	const handleClear = async () => {
		setIsBusy(true);
		const ok = await onClear();
		setIsBusy(false);
		if (ok) onClose();
	};

	return (
		<div
			className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
			onClick={onClose}
		>
			<div
				className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
					<div>
						<h3 className="text-base font-bold text-slate-900">
							{collaboratorName}
						</h3>
						<p className="text-sm text-slate-500">{dateLabel}</p>
					</div>
					<button
						onClick={onClose}
						className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
					>
						<X size={18} />
					</button>
				</div>

				<div className="px-6 py-5 space-y-4">
					<div>
						<label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
							Situação do dia
						</label>
						<SearchableSelect
							options={STATUS_OPTIONS}
							value={status}
							onChange={(val) => setStatus(val as AttendanceStatus)}
							placeholder="Selecione a situação..."
						/>
					</div>

					{isPresence && (
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
										Entrada
									</label>
									<input
										type="time"
										value={clockIn}
										onChange={(e) => setClockIn(e.target.value)}
										className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-gray-900"
									/>
								</div>
								<div>
									<label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
										Saída Almoço
									</label>
									<input
										type="time"
										value={lunchStart}
										onChange={(e) => setLunchStart(e.target.value)}
										className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-gray-900"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
										Volta Almoço
									</label>
									<input
										type="time"
										value={lunchEnd}
										onChange={(e) => setLunchEnd(e.target.value)}
										className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-gray-900"
									/>
								</div>
								<div>
									<label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
										Saída
									</label>
									<input
										type="time"
										value={clockOut}
										onChange={(e) => setClockOut(e.target.value)}
										className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-gray-900"
									/>
								</div>
							</div>

							{incompleteTimes && <IncompleteHoursWarning />}
						</div>
					)}

					<div>
						<label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
							Observação (opcional)
						</label>
						<input
							type="text"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Ex: atestado, meio período..."
							className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
						/>
					</div>
				</div>

				<div className="flex items-center justify-between gap-3 px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
					{record ? (
						<button
							type="button"
							onClick={handleClear}
							disabled={isBusy}
							className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
						>
							<Trash2 size={16} /> Limpar
						</button>
					) : (
						<span />
					)}
					<button
						type="button"
						onClick={handleSave}
						disabled={isBusy}
						className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
					>
						{isBusy && <Loader2 className="w-4 h-4 animate-spin" />}
						Salvar
					</button>
				</div>
			</div>
		</div>
	);
}
