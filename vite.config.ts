import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
<<<<<<< HEAD
import { VitePWA } from 'vite-plugin-pwa'
=======
>>>>>>> 5fc062c51a3af11bd81c504d1c75f444d2f4beaa

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Fix: Cast process to any to resolve TypeScript error "Property 'cwd' does not exist on type 'Process'"
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
<<<<<<< HEAD
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg'],
        manifest: {
          name: 'KisanBot - Smart Farm Assistant',
          short_name: 'KisanBot',
          description: 'AI-powered agriculture assistant for disease analysis and robot control.',
          theme_color: '#15803d',
          background_color: '#f0fdf4',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            {
              src: 'icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
=======
    plugins: [react()],
>>>>>>> 5fc062c51a3af11bd81c504d1c75f444d2f4beaa
    define: {
      // Expose API_KEY to the client. We check for both API_KEY and GEMINI_API_KEY.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.GEMINI_API_KEY),
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  }
})