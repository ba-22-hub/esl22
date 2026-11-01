import { defineConfig } from 'vite'
import path from 'path';
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Serveur de développement uniquement (npm run dev) : accepte les adresses
    // du tunnel Pinggy, pour tester sur un vrai téléphone. Sans effet sur le
    // site construit par npm run build.
    allowedHosts: true,
  },
  resolve: {
    alias: {
      '@lib': path.resolve(__dirname, 'src/lib'),
      '@common': path.resolve(__dirname, 'src/common'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@context': path.resolve(__dirname, 'src/context'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  base: './'
})
