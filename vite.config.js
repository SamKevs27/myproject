import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Firebase is large and changes rarely: give it its own long-cached chunks.
        manualChunks(id) {
          // auth and analytics stay lazy (admin / after load), so leave them out of shared chunks
          if (/node_modules\/(@firebase|firebase)\/(auth|analytics)/.test(id)) return undefined
          if (id.includes('node_modules/@firebase/firestore') || id.includes('node_modules/firebase/firestore')) return 'firestore'
          if (id.includes('node_modules/@firebase') || id.includes('node_modules/firebase')) return 'firebase'
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react'
        },
      },
    },
  },
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
})
