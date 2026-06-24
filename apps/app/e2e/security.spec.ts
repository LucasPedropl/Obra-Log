import { test, expect } from '@playwright/test';

test.describe('ObraLog security', () => {
	test('unauthenticated user redirected to login', async ({ page, context }) => {
		await context.clearCookies();
		await page.goto('/dashboard');
		await page.waitForURL(/\/auth\/login/, { timeout: 15000 });
		expect(page.url()).toContain('/auth/login');
	});

	test('protected obra route redirects without session', async ({ page, context }) => {
		await context.clearCookies();
		await page.goto('/obras');
		await page.waitForURL(/\/auth\/login/, { timeout: 15000 });
		expect(page.url()).toContain('/auth/login');
	});
});
