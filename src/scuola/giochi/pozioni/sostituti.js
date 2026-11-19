// Le pozioni a scuola (docs/pozioni/scuola.md): la mappa delle tappe, con la ripresa e gli amici, non si apre. Percorsi dalla radice del repo.
export default {
  sostituti: {
    'src/giochi/pozioni/viste/Mappa.vue': 'src/scuola/sostituti/Vuoto.vue',
  },
  // cosa del gioco di casa può entrare nel pacchetto dei bambini (la guardia vieta gli altri giochi)
  ammessi: ['src/giochi/pozioni/'],
}
