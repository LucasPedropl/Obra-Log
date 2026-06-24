import { describe, expect, it } from 'vitest';
import { maskCEP, maskCPF, maskDate, maskPhone, unmask } from './maskUtils';

describe('maskUtils', () => {
	describe('maskCPF', () => {
		it('formats digits as CPF display mask', () => {
			expect(maskCPF('12345678901')).toBe('123.456.789-01');
		});

		it('strips non-digits before masking', () => {
			expect(maskCPF('123.456.789-01')).toBe('123.456.789-01');
		});

		it('limits to 11 digits', () => {
			expect(maskCPF('123456789012345')).toBe('123.456.789-01');
		});
	});

	describe('maskPhone', () => {
		it('formats mobile numbers', () => {
			expect(maskPhone('11987654321')).toBe('(11) 98765-4321');
		});
	});

	describe('maskCEP', () => {
		it('formats CEP', () => {
			expect(maskCEP('01310100')).toBe('01310-100');
		});
	});

	describe('maskDate', () => {
		it('formats date as DD/MM/YYYY', () => {
			expect(maskDate('23062026')).toBe('23/06/2026');
		});
	});

	describe('unmask', () => {
		it('removes all non-digit characters', () => {
			expect(unmask('123.456.789-01')).toBe('12345678901');
			expect(unmask('(11) 98765-4321')).toBe('11987654321');
		});
	});
});
