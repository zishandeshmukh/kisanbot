import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // This allows Vercel environment variables to be read during build.
  // Cast process to any to avoid TS errors in strict mode if @types/node isn't perfect
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // This exposes process.env.API_KEY to the client-side code
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env': JSON.stringify(env) 
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  }
})