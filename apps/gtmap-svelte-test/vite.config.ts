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
	optimizeDeps: {
		exclude: ['@gtmap']
	}
});
