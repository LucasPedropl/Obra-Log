'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Save, Loader2, Check } from 'lucide-react';
import { STATUS_CONFIG, STATUS_OPTIONS } from '../lib/attendanceConfig';
import type { DayColumn } from '../lib/dateRange';
import { cellKey } from '../hooks/useSiteAttendance';
import type { AttendanceRecord, AttendanceStatus } from '../schemas/attendanceSchema';
import type { GridCollaborator } from './attendanceTypes';
import {
	isScheduledDayOff,
	type WorkdaySchedule,
} from '../lib/workdaySchedule';

export type { GridCollaborator } from './attendanceTypes';

interface AttendanceGridProps {
	collaborators: GridCollaborator[];
	days: DayColumn[];
	records: Record<string, AttendanceRecord>;
	onCellClick: (collaboratorId: string, date: string) => void;
	onlyToday?: boolean;
	/** Site workday schedule — inactive days show as Folga Programada when empty. */
	workdaySchedule?: WorkdaySchedule | null;
	onSaveInline?: (
		collaboratorId: string,
		date: string,
		data: {
			status: AttendanceStatus;
			clockIn: string | null;
			clockOut: string | null;
			lunchStart: string | null;
			lunchEnd: string | null;
			notes: string | null;
		},
	) => Promise<boolean>;
}

function InlineAttendanceRow({
	collaboratorId,
	date,
	record,
	onSave,
}: {
	collaboratorId: string;
	date: string;
	record?: AttendanceRecord;
	onSave: (data: {
		status: AttendanceStatus;
		clockIn: string | null;
		clockOut: string | null;
		lunchStart: string | null;
		lunchEnd: string | null;
		notes: string | null;
	}) => Promise<void>;
}) {
	const [status, setStatus] = useState<AttendanceStatus>(record?.status || 'PRESENT');
	const [clockIn, setClockIn] = useState(record?.clock_in?.slice(0, 5) || '');
	const [clockOut, setClockOut] = useState(record?.clock_out?.slice(0, 5) || '');
	const [lunchStart, setLunchStart] = useState(record?.lunch_start?.slice(0, 5) || '');
	const [lunchEnd, setLunchEnd] = useState(record?.lunch_end?.slice(0, 5) || '');
	const [notes, setNotes] = useState(record?.notes || '');
	const [isSaving, setIsSaving] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);
	const [savedRecently, setSavedRecently] = useState(false);

	useEffect(() => {
		if (record) {
			setStatus(record.status);
			setClockIn(record.clock_in?.slice(0, 5) || '');
			setClockOut(record.clock_out?.slice(0, 5) || '');
			setLunchStart(record.lunch_start?.slice(0, 5) || '');
			setLunchEnd(record.lunch_end?.slice(0, 5) || '');
			setNotes(record.notes || '');
		} else {
			setStatus('PRESENT');
			setClockIn('');
			setClockOut('');
			setLunchStart('');
			setLunchEnd('');
			setNotes('');
		}
		setHasChanges(false);
	}, [record]);

	const isPresence = STATUS_CONFIG[status]?.isPresence ?? true;

	const handleFieldChange = () => {
		setHasChanges(true);
		setSavedRecently(false);
	};

	const handleSave = async () => {
		setIsSaving(true);
		try {
			await onSave({
				status,
				clockIn: isPresence ? clockIn || null : null,
				clockOut: isPresence ? clockOut || null : null,
				lunchStart: isPresence ? lunchStart || null : null,
				lunchEnd: isPresence ? lunchEnd || null : null,
				notes: notes || null,
			});
			setHasChanges(false);
			setSavedRecently(true);
			setTimeout(() => setSavedRecently(false), 2000);
		} catch (err) {
			console.error(err);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="flex flex-wrap items-center gap-3 py-1 justify-start text-left">
			<div className="flex flex-col gap-0.5">
				<select
					value={status}
					onChange={(e) => {
						setStatus(e.target.value as AttendanceStatus);
						handleFieldChange();
					}}
					className="h-9 rounded-[5px] border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[130px]"
				>
					{STATUS_OPTIONS.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>
			</div>

			{isPresence && (
				<div className="flex flex-wrap items-center gap-2">
					<div className="flex items-center gap-1.5">
						<span className="text-[10px] text-gray-500 font-bold uppercase">Ent:</span>
						<input
							type="time"
							value={clockIn}
							onChange={(e) => {
								setClockIn(e.target.value);
								handleFieldChange();
							}}
							className="h-9 w-20 rounded-[5px] border border-gray-300 bg-white px-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>

					<div className="flex items-center gap-1.5">
						<span className="text-[10px] text-gray-500 font-bold uppercase">S. Almoço:</span>
						<input
							type="time"
							value={lunchStart}
							onChange={(e) => {
								setLunchStart(e.target.value);
								handleFieldChange();
							}}
							className="h-9 w-20 rounded-[5px] border border-gray-300 bg-white px-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>

					<div className="flex items-center gap-1.5">
						<span className="text-[10px] text-gray-500 font-bold uppercase">V. Almoço:</span>
						<input
							type="time"
							value={lunchEnd}
							onChange={(e) => {
								setLunchEnd(e.target.value);
								handleFieldChange();
							}}
							className="h-9 w-20 rounded-[5px] border border-gray-300 bg-white px-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>

					<div className="flex items-center gap-1.5">
						<span className="text-[10px] text-gray-500 font-bold uppercase">Sai:</span>
						<input
							type="time"
							value={clockOut}
							onChange={(e) => {
								setClockOut(e.target.value);
								handleFieldChange();
							}}
							className="h-9 w-20 rounded-[5px] border border-gray-300 bg-white px-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>
				</div>
			)}

			<div className="flex items-center gap-1.5 flex-1 min-w-[120px]">
				<span className="text-[10px] text-gray-500 font-bold uppercase">Obs:</span>
				<input
					type="text"
					value={notes}
					onChange={(e) => {
						setNotes(e.target.value);
						handleFieldChange();
					}}
					placeholder="Anotações..."
					className="h-9 w-full rounded-[5px] border border-gray-300 bg-white px-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
				/>
			</div>

			<button
				type="button"
				onClick={handleSave}
				disabled={isSaving || (!hasChanges && !savedRecently)}
				className={cn(
					"h-9 px-3 rounded-[5px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all",
					savedRecently 
						? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
						: hasChanges 
							? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm" 
							: "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
				)}
			>
				{isSaving ? (
					<Loader2 className="w-3.5 h-3.5 animate-spin" />
				) : savedRecently ? (
					<>
						<Check className="w-3.5 h-3.5" />
						Salvo
					</>
				) : (
					<>
						<Save className="w-3.5 h-3.5" />
						Salvar
					</>
				)}
			</button>

			{record && record.status === 'PRESENT' && (
				<span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-[4px] shrink-0">
					Diária: {record.day_fraction.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
				</span>
			)}
		</div>
	);
}

const formatFraction = (value: number) =>
	value.toLocaleString('pt-BR', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});

/** Period grid: one row per collaborator, one clickable cell per day. */
export function AttendanceGrid({
	collaborators,
	days,
	records,
	onCellClick,
	onlyToday,
	onSaveInline,
	workdaySchedule,
}: AttendanceGridProps) {
	return (
		<div className="overflow-x-auto rounded-xl border border-border bg-card custom-scrollbar">
			<table className="w-full border-collapse text-sm">
				<thead>
					<tr className="bg-muted/60">
						<th className="sticky left-0 z-10 bg-muted/60 px-4 py-3 text-left font-semibold text-foreground min-w-[200px] border-b border-border">
							Colaborador
						</th>
						{days.map((day) => (
							<th
								key={day.date}
								className={cn(
									'px-2 py-2 text-center font-medium border-b border-border min-w-[64px]',
									day.isWeekend ? 'bg-muted text-muted-foreground' : 'text-foreground',
								)}
							>
								<div className="text-xs font-bold">{day.dayLabel}</div>
								<div className="text-[10px] uppercase text-muted-foreground">
									{day.weekdayLabel}
								</div>
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{collaborators.map((c) => (
						<tr key={c.collaboratorId} className="hover:bg-muted/30">
							<td className="sticky left-0 z-10 bg-card px-4 py-2 border-b border-border">
								<div className="font-medium text-foreground">{c.name}</div>
								<div className="text-xs text-muted-foreground">{c.role_title}</div>
							</td>
							{days.map((day) => {
								const rec = records[cellKey(c.collaboratorId, day.date)];
								const scheduledOff =
									!rec &&
									(day.isScheduledOff === true ||
										isScheduledDayOff(day.date, workdaySchedule));
								const displayStatus = rec
									? rec.status
									: scheduledOff
										? ('SCHEDULED_DAY_OFF' as AttendanceStatus)
										: null;

								return (
									<td
										key={day.date}
										className={cn(
											'px-1.5 py-2 border-b border-border',
											day.isWeekend && 'bg-muted/30',
										)}
									>
										{onlyToday && onSaveInline ? (
											<InlineAttendanceRow
												collaboratorId={c.collaboratorId}
												date={day.date}
												record={rec}
												onSave={async (data) => {
													await onSaveInline(c.collaboratorId, day.date, data);
												}}
											/>
										) : (
											<button
												type="button"
												onClick={() => onCellClick(c.collaboratorId, day.date)}
												title={
													displayStatus
														? STATUS_CONFIG[displayStatus]?.label
														: 'Registrar ponto'
												}
												className={cn(
													'w-full min-h-[40px] rounded-md border text-[10px] leading-tight font-semibold px-0.5 py-1 transition-colors',
													displayStatus === 'PRESENT'
														? 'bg-emerald-50 text-emerald-700 border-emerald-200'
														: displayStatus
															? cn(
																	STATUS_CONFIG[displayStatus]?.badgeClass ||
																		'bg-gray-50 text-gray-500',
																	'border-transparent',
																)
															: 'border-dashed border-slate-200 text-slate-300 hover:border-slate-400 hover:text-slate-500',
												)}
											>
												{displayStatus === 'PRESENT' && rec
													? formatFraction(Number(rec.day_fraction))
													: displayStatus
														? STATUS_CONFIG[displayStatus]?.short || displayStatus
														: '+'}
											</button>
										)}
									</td>
								);
							})}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
