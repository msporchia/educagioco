// Originale → sostituto (percorsi dalla radice del repo): lo leggono vite.scuola.config.js e i test. docs/scuola/architettura.md
export const SOSTITUTI = {
  'src/store/giudizi.js': 'src/scuola/sostituti/giudizi.js',
  'src/store/salto.js': 'src/scuola/sostituti/salto.js',
  'src/quiz/memoria.js': 'src/scuola/sostituti/memoria.js',
  'src/components/Giudizio.vue': 'src/scuola/sostituti/Giudizio.vue',
  'src/quiz/nucleo/registro.js': 'src/scuola/sostituti/registro.js',
  // i giochi veri (docs/scuola/architettura.md): l'archivio in memoria, e una barra e una pausa da cui non si esce
  'src/store/storage.js': 'src/scuola/sostituti/storage.js',
  'src/components/Barra.vue': 'src/scuola/sostituti/Barra.vue',
  'src/giochi/VeloPausa.vue': 'src/scuola/sostituti/VeloPausa.vue',
  // e il peso: quello che il profilo e gli Asteroidi tirano dentro per la home, le mappe, gli amici e i traguardi
  'src/store/progressi.js': 'src/scuola/sostituti/progressi.js',
  'src/giochi/indice.js': 'src/scuola/sostituti/indice.js',
  'src/data/portata-giochi.js': 'src/scuola/sostituti/portata-giochi.js',
  'src/guide/novita-bambini.js': 'src/scuola/sostituti/novita-bambini.js',
  'src/amici/servizio.js': 'src/scuola/sostituti/amici-servizio.js',
  'src/amici/usaAmici.js': 'src/scuola/sostituti/usaAmici.js',
  // le pagine attorno agli Asteroidi, che a scuola non si aprono (docs/asteroidi/scuola.md)
  'src/components/RottaAsteroidi.vue': 'src/scuola/sostituti/Vuoto.vue',
  'src/components/MappaTabelline.vue': 'src/scuola/sostituti/Vuoto.vue',
  'src/components/MappaConcetti.vue': 'src/scuola/sostituti/Vuoto.vue',
  'src/components/HangarAsteroidi.vue': 'src/scuola/sostituti/Vuoto.vue',
  'src/components/RegaloHangar.vue': 'src/scuola/sostituti/Vuoto.vue',
}
