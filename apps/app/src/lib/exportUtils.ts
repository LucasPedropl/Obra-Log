/**
 * Exports tabular data to CSV and triggers browser download.
 */
export function exportToCsv<T extends Record<string, unknown>>(
	rows: T[],
	columns: { key: keyof T; label: string }[],
	filename: string,
): void {
	if (rows.length === 0) return;

	const neutralizeFormula = (value: string): string => {
		if (/^[=+\-@]/.test(value)) {
			return `'${value}`;
		}
		return value;
	};

	const escape = (value: unknown): string => {
		const str = value == null ? '' : neutralizeFormula(String(value));
		if (str.includes('"') || str.includes(',') || str.includes('\n')) {
			return `"${str.replace(/"/g, '""')}"`;
		}
		return str;
	};

	const header = columns.map((c) => escape(c.label)).join(',');
	const body = rows
		.map((row) => columns.map((c) => escape(row[c.key])).join(','))
		.join('\n');

	const blob = new Blob([`${header}\n${body}`], {
		type: 'text/csv;charset=utf-8;',
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
	link.click();
	URL.revokeObjectURL(url);
}
