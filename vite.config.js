import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Build in un unico .html: niente server, niente file accanto.
// Lo script inline resta un modulo ES, che da file:// viene eseguito
// regolarmente (a differenza di un modulo caricato da src esterno).
export default defineConfig({
  plugins: [vue(), viteSingleFile()],
  build: { target: 'es2020', assetsInlineLimit: 100000000, cssCodeSplit: false,
           reportCompressedSize: false, chunkSizeWarningLimit: 100000 },
})
