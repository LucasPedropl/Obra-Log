/**
 * Triggers print for the full folha report or a single section.
 * Relies on CSS in FrequencyReport PrintStyles + data-print-section attribute.
 */
export type FolhaPrintSection = 'all' | 'freq' | 'payment';

export function printFolhaSection(section: FolhaPrintSection = 'all'): void {
	const root = document.documentElement;
	root.dataset.printSection = section;
	const cleanup = () => {
		delete root.dataset.printSection;
		window.removeEventListener('afterprint', cleanup);
	};
	window.addEventListener('afterprint', cleanup);
	window.print();
}
