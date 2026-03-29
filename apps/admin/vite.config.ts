import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, '.', '');
	return {
		plugins: [
			react(),
			tailwindcss(),
			VitePWA({
				registerType: 'autoUpdate',
				injectRegister: 'auto',
				devOptions: {
					enabled: false,
				},
				workbox: {
					globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
				},
				includeAssets: [
					'favicon.ico',
					'apple-touch-icon.png',
					'mask-icon.svg',
				],
				manifest: {
					name: 'ObraLog',
					short_name: 'ObraLog',
					description: 'Gerenciamento Inteligente de Obras',
					theme_color:
						'#0f172a' /* Cor do fundo da barra de título (slate-900) */,
					background_color: '#ffffff',
					display: 'standalone',
					display_override: ['window-controls-overlay'],
					start_url: '/',
					icons: [
						{
							src: 'pwa-192x192.png',
							sizes: '192x192',
							type: 'image/png',
						},
						{
							src: 'pwa-512x512.png',
							sizes: '512x512',
							type: 'image/png',
							purpose: 'any maskable',
						},
					],
				},
			}),
		],
		define: {
			'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
		},
		resolve: {
			alias: {
				'@': path.resolve(__dirname, '.'),
			},
		},
		server: {
			port: 3001,
			strictPort: true,
			open: true,
			proxy: {
				'/api': {
					target: env.VITE_API_URL || 'http://localhost:5005',
					changeOrigin: true,
					secure: false,
				},
			},
			// HMR is disabled in AI Studio via DISABLE_HMR env var.
			// Do not modifyâfile watching is disabled to prevent flickering during agent edits.
			hmr: process.env.DISABLE_HMR !== 'true',
		},
	};
});
