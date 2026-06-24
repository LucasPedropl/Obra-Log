import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exportToCsv } from './exportUtils';

describe('exportToCsv', () => {
	let capturedCsv = '';

	beforeEach(() => {
		capturedCsv = '';

		vi.stubGlobal(
			'Blob',
			class MockBlob {
				constructor(parts: BlobPart[]) {
					capturedCsv = parts.map(String).join('');
				}
			},
		);

		vi.stubGlobal('URL', {
			createObjectURL: vi.fn(() => 'blob:mock'),
			revokeObjectURL: vi.fn(),
		});

		const link = { href: '', download: '', click: vi.fn() };
		vi.spyOn(document, 'createElement').mockReturnValue(
			link as unknown as HTMLAnchorElement,
		);
	});

	it('returns early when rows are empty', () => {
		exportToCsv([], [{ key: 'name', label: 'Nome' }], 'export');
		expect(capturedCsv).toBe('');
	});

	it('neutralizes CSV formula injection prefixes', () => {
		exportToCsv(
			[
				{ name: '=SUM(A1)' },
				{ name: '+cmd' },
				{ name: '-10' },
				{ name: '@import' },
			],
			[{ key: 'name', label: 'Nome' }],
			'export',
		);

		expect(capturedCsv).toContain("'=SUM(A1)");
		expect(capturedCsv).toContain("'+cmd");
		expect(capturedCsv).toContain("'-10");
		expect(capturedCsv).toContain("'@import");
	});

	it('escapes commas, quotes and newlines', () => {
		exportToCsv(
			[{ note: 'a,b', text: 'line\nbreak', quote: 'say "hi"' }],
			[
				{ key: 'note', label: 'Nota' },
				{ key: 'text', label: 'Texto' },
				{ key: 'quote', label: 'Citação' },
			],
			'export',
		);

		expect(capturedCsv).toContain('"a,b"');
		expect(capturedCsv).toContain('"line\nbreak"');
		expect(capturedCsv).toContain('"say ""hi"""');
	});

	it('appends .csv extension when missing', () => {
		const link = { href: '', download: '', click: vi.fn() };
		vi.spyOn(document, 'createElement').mockReturnValue(
			link as unknown as HTMLAnchorElement,
		);

		exportToCsv([{ name: 'ok' }], [{ key: 'name', label: 'Nome' }], 'relatorio');

		expect(link.download).toBe('relatorio.csv');
	});
});
