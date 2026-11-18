// Passo passo a scuola (docs/passo-passo/scuola.md): la mappa delle isole, coi fondali dipinti e gli amici, non si apre. Percorsi dalla radice del repo.
export default {
  sostituti: {
    'src/giochi/passo-passo/viste/Mappa.vue': 'src/scuola/sostituti/Vuoto.vue',
  },
  // cosa del gioco di casa può entrare nel pacchetto dei bambini (la guardia vieta gli altri giochi)
  ammessi: [
    'src/giochi/passo-passo/',
    // le soglie del dito, che la fila trascinata prende dalla fattoria: costanti e basta
    'src/giochi/fattoria3d/viste/dito-soglie.js',
  ],
}
