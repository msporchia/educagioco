// Le pozioni a scuola (docs/pozioni/scuola.md): la mappa delle tappe, con la ripresa e gli amici, non si apre. Percorsi dalla radice del repo.
export default {
  sostituti: {
    'src/giochi/pozioni/viste/Mappa.vue': 'src/scuola/sostituti/Vuoto.vue',
    'src/giochi/pozioni/motore/formule.js': 'src/scuola/giochi/pozioni/formule.js',   // in classe la formula si sussurra
  },
  // cosa del gioco di casa può entrare nel pacchetto dei bambini (la guardia vieta gli altri giochi)
  ammessi: ['src/giochi/pozioni/'],
}
