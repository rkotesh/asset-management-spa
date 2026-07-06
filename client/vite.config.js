import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const isSsr = process.argv.includes('--ssr');
  const aliasPath = isSsr
    ? path.resolve(__dirname, 'src/AppRoutes.server.jsx')
    : path.resolve(__dirname, 'src/AppRoutes.jsx');
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@/AppRoutes': aliasPath,
        '@': path.resolve(__dirname, 'src')
      }
    }
  };
})
