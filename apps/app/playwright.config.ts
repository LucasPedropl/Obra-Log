import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './e2e',
	timeout: 60000,
	use: {
		baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3005',
		headless: true,
	},
	webServer: process.env.CI
		? {
				command: 'npm run start',
				url: 'http://localhost:3005',
				reuseExistingServer: false,
				timeout: 120000,
			}
		: undefined,
});
