import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	resolve: {
		alias: {
			'@gtmap': resolve(__dirname, '../../packages/gtmap/src')
		}
	},
	server: {
		fs: {
			allow: [
				resolve(__dirname, '..'),
				resolve(__dirname, '../..'),
				resolve(__dirname, '../../packages/gtmap'),
				resolve(__dirname, '../../packages/gtmap/src')
			]
		},
		watch: { usePolling: true, interval: 100 }
	},
	optimizeDeps: {
		exclude: ['@gtmap']
	}
});
