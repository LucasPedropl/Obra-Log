import { test, expect } from '@playwright/test';

const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;
const hasE2eCreds = Boolean(EMAIL && PASSWORD);

test.describe('ObraLog smoke', () => {
	test.beforeEach(({ }, testInfo) => {
		if (!hasE2eCreds) {
			testInfo.skip(true, 'E2E_EMAIL and E2E_PASSWORD are required');
		}
	});

	test('login redirects to empresa selection or dashboard', async ({ page }) => {

		await page.goto('/auth/login');
		await page.getByLabel(/e-mail/i).fill(EMAIL!);
		await page.getByLabel(/senha/i).fill(PASSWORD!);
		await page.getByRole('button', { name: /entrar/i }).click();
		await page.waitForURL(/\/(empresas|dashboard)/, { timeout: 15000 });
		expect(page.url()).toMatch(/\/(empresas|dashboard)/);
	});

	test('dashboard loads when authenticated', async ({ page }) => {

		await page.goto('/auth/login');
		await page.getByLabel(/e-mail/i).fill(EMAIL!);
		await page.getByLabel(/senha/i).fill(PASSWORD!);
		await page.getByRole('button', { name: /entrar/i }).click();
		await page.waitForURL(/\/(empresas|dashboard)/, { timeout: 15000 });

		if (page.url().includes('/empresas')) {
			const companyCard = page.locator('[data-company-card]').first();
			if (await companyCard.isVisible()) {
				await companyCard.click();
			}
		}

		await page.goto('/dashboard');
		await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({
			timeout: 15000,
		});
	});
});
