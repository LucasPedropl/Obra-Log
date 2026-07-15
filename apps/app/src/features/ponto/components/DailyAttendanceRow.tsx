'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { STATUS_CONFIG, STATUS_OPTIONS } from '../lib/attendanceConfig';
import type { AttendanceRecord, AttendanceStatus } from '../schemas/attendanceSchema';
import type { GridCollaborator } from './attendanceTypes';

export type DailyAttendanceSaveData = {
	status: AttendanceStatus;
	clockIn: string | null;
	clockOut: string | null;
	lunchStart: string | null;
	lunchEnd: string | null;
	notes: string | null;
};

const inputClass =
	'h-9 w-full min-w-[5.5rem] rounded-[5px] border border-gray-300 bg-white px-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500';

const AUTOSAVE_MS = 350;

interface DailyAttendanceRowProps {
	collaborator: GridCollaborator;
	record?: AttendanceRecord;
	onSave: (data: DailyAttendanceSaveData) => Promise<boolean>;
}

export function DailyAttendanceRow({
	collaborator,
	record,
	onSave,
}: DailyAttendanceRowProps) {
	const [status, setStatus] = useState<AttendanceStatus>(record?.status || 'PRESENT');
	const [clockIn, setClockIn] = useState(record?.clock_in?.slice(0, 5) || '');
	const [clockOut, setClockOut] = useState(record?.clock_out?.slice(0, 5) || '');
	const [lunchStart, setLunchStart] = useState(record?.lunch_start?.slice(0, 5) || '');
	const [lunchEnd, setLunchEnd] = useState(record?.lunch_end?.slice(0, 5) || '');
	const [notes, setNotes] = useState(record?.notes || '');
	const [saveHint, setSaveHint] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

	const skipNextAutosave = useRef(true);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const onSaveRef = useRef(onSave);
	onSaveRef.current = onSave;

	useEffect(() => {
		skipNextAutosave.current = true;
		setStatus(record?.status || 'PRESENT');
		setClockIn(record?.clock_in?.slice(0, 5) || '');
		setClockOut(record?.clock_out?.slice(0, 5) || '');
		setLunchStart(record?.lunch_start?.slice(0, 5) || '');
		setLunchEnd(record?.lunch_end?.slice(0, 5) || '');
		setNotes(record?.notes || '');
		setSaveHint('idle');
	}, [record]);

	useEffect(() => {
		if (skipNextAutosave.current) {
			skipNextAutosave.current = false;
			return;
		}

		const isPresence = STATUS_CONFIG[status]?.isPresence ?? true;
		const payload: DailyAttendanceSaveData = {
			status,
			clockIn: isPresence ? clockIn || null : null,
			clockOut: isPresence ? clockOut || null : null,
			lunchStart: isPresence ? lunchStart || null : null,
			lunchEnd: isPresence ? lunchEnd || null : null,
			notes: notes || null,
		};

		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(async () => {
			setSaveHint('saving');
			try {
				const ok = await onSaveRef.current(payload);
				setSaveHint(ok ? 'saved' : 'error');
			} catch (err) {
				console.error(err);
				setSaveHint('error');
			}
		}, AUTOSAVE_MS);

		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, [status, clockIn, clockOut, lunchStart, lunchEnd, notes]);

	const isPresence = STATUS_CONFIG[status]?.isPresence ?? true;

	return (
		<tr className="hover:bg-muted/30">
			<td className="sticky left-0 z-10 bg-card px-4 py-2 border-b border-border">
				<div className="font-medium text-foreground">{collaborator.name}</div>
				<div className="text-xs text-muted-foreground">{collaborator.role_title}</div>
				{saveHint === 'saving' && (
					<div className="text-[10px] text-slate-400 mt-0.5">Salvando…</div>
				)}
				{saveHint === 'saved' && (
					<div className="text-[10px] text-emerald-600 mt-0.5">Salvo</div>
				)}
				{saveHint === 'error' && (
					<div className="text-[10px] text-destructive mt-0.5">Erro ao salvar</div>
				)}
			</td>
			<td className="px-3 py-2 border-b border-border">
				<select
					value={status}
					onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
					className={cn(inputClass, 'min-w-[130px]')}
				>
					{STATUS_OPTIONS.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>
			</td>
			<td className="px-3 py-2 border-b border-border">
				{isPresence ? (
					<input
						type="time"
						value={clockIn}
						onChange={(e) => setClockIn(e.target.value)}
						className={inputClass}
					/>
				) : (
					<span className="text-xs text-muted-foreground">—</span>
				)}
			</td>
			<td className="px-3 py-2 border-b border-border">
				{isPresence ? (
					<input
						type="time"
						value={lunchStart}
						onChange={(e) => setLunchStart(e.target.value)}
						className={inputClass}
					/>
				) : (
					<span className="text-xs text-muted-foreground">—</span>
				)}
			</td>
			<td className="px-3 py-2 border-b border-border">
				{isPresence ? (
					<input
						type="time"
						value={lunchEnd}
						onChange={(e) => setLunchEnd(e.target.value)}
						className={inputClass}
					/>
				) : (
					<span className="text-xs text-muted-foreground">—</span>
				)}
			</td>
			<td className="px-3 py-2 border-b border-border">
				{isPresence ? (
					<input
						type="time"
						value={clockOut}
						onChange={(e) => setClockOut(e.target.value)}
						className={inputClass}
					/>
				) : (
					<span className="text-xs text-muted-foreground">—</span>
				)}
			</td>
			<td className="px-3 py-2 border-b border-border">
				<input
					type="text"
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					placeholder="Anotações..."
					className={cn(inputClass, 'min-w-[160px]')}
				/>
			</td>
		</tr>
	);
}
