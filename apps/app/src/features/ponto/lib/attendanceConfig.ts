import type { AttendanceStatus } from '../schemas/attendanceSchema';

interface StatusMeta {
	label: string;
	/** Short label used inside grid cells / report. */
	short: string;
	/** Tailwind classes for the cell/badge fill (Excel frequency legend). */
	badgeClass: string;
	/** Whether this status counts as worked presence (uses clock in/out). */
	isPresence: boolean;
}

/**
 * Colors mirror the official frequency report legend (Excel).
 * Solid fills so print/PDF matches the spreadsheet.
 */
export const STATUS_CONFIG: Record<AttendanceStatus, StatusMeta> = {
	PRESENT: {
		label: 'Presença',
		short: 'Presença',
		badgeClass: 'bg-white text-slate-900',
		isPresence: true,
	},
	ABSENT: {
		label: 'Falta',
		short: 'Falta',
		badgeClass: 'bg-[#FF0000] text-white font-semibold',
		isPresence: false,
	},
	ABSENT_JUSTIFIED: {
		label: 'Falta Justificada',
		short: 'Falta J.',
		badgeClass: 'bg-[#38761D] text-white font-semibold',
		isPresence: false,
	},
	DAY_OFF: {
		label: 'Folga',
		short: 'Folga',
		badgeClass: 'bg-[#FFF2CC] text-black font-semibold',
		isPresence: false,
	},
	SCHEDULED_DAY_OFF: {
		label: 'Folga Programada',
		short: 'Folga Programada',
		badgeClass: 'bg-[#FFC000] text-black font-semibold',
		isPresence: false,
	},
	SCHEDULED_DISMISSAL: {
		label: 'Dispensa Programada',
		short: 'Dispensa Programada',
		badgeClass: 'bg-[#548235] text-white font-semibold',
		isPresence: false,
	},
	REQUESTED_DISMISSAL: {
		label: 'Dispensa Solicitada',
		short: 'Dispensa Solicitada',
		badgeClass: 'bg-[#2F5496] text-white font-semibold',
		isPresence: false,
	},
	NA: {
		label: 'N/A (não contratado)',
		short: 'N/A',
		badgeClass: 'bg-[#D9D9D9] text-black font-semibold',
		isPresence: false,
	},
};

export const STATUS_OPTIONS = (
	Object.keys(STATUS_CONFIG) as AttendanceStatus[]
).map((value) => ({ value, label: STATUS_CONFIG[value].label }));
