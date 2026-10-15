// Un prototipo di poc/ in un solo file HTML (three compreso), da aprire col
// doppio click o da dare al telefono: POC=asteroidi-3d npx vite build -c strumenti/poc-file-unico.config.js
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import vue from '@vitejs/plugin-vue'   // i prototipi che montano i componenti veri del gioco (sotterraneo-luce)
import { resolve } from 'node:path'

const poc = process.env.POC
if (!poc) throw new Error('POC=<nome del prototipo in poc/>')

export default defineConfig({
  root: resolve('poc'),
  base: './',
  plugins: [vue(), viteSingleFile()],
  build: {
    outDir: resolve(process.env.FUORI || `dist-poc/${poc}`),
    emptyOutDir: true,
    rollupOptions: { input: resolve(`poc/${poc}.html`) },
  },
})
