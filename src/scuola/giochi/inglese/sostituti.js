// English a scuola (docs/lingue/scuola.md): la mappa, il libro e il gioco di prima non si aprono, e il registro dell'audio
// non scrive nel libretto dei guasti di casa. Percorsi dalla radice del repo.
export default {
  sostituti: {
    'src/giochi/inglese/viste/Mappa.vue': 'src/scuola/sostituti/Vuoto.vue',
    'src/views/LinguaGame.vue': 'src/scuola/sostituti/Vuoto.vue',
    'src/audio-log.js': 'src/scuola/sostituti/inglese-audio-log.js',
    // il libro: le storie si raccolgono con import.meta.glob, e senza mappa non si apre
    'src/giochi/inglese/dati/capitoli.js': 'src/scuola/sostituti/inglese-capitoli.js',
  },
  // cosa del gioco di casa può entrare nel pacchetto dei bambini (la guardia vieta gli altri giochi)
  ammessi: ['src/giochi/inglese/'],
}
