import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'))
const appVersion = packageJson.version
let commitHash = 'unknown'
try {
  commitHash = execSync('git rev-parse --short HEAD', { cwd: __dirname }).toString().trim()
} catch (_e) {
  // Git not available
}

export default defineConfig({
  base: '/subscription/',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
    'import.meta.env.VITE_COMMIT_HASH': JSON.stringify(commitHash),
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5176,
  },
})
