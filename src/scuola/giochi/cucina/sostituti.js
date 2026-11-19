// La cucina a scuola (docs/bancarella/scuola.md): le scelte del gioco in due e quella delle cucine non si aprono. Percorsi dalla radice del repo.
// Il gioco in due (sfida, sala, cartello) lo spegne per tutti src/scuola/giochi/insieme.js
export default {
  sostituti: {
    'src/components/bancarella/SceltaInDue.vue': 'src/scuola/sostituti/Vuoto.vue',
    'src/components/bancarella/LeCucine.vue': 'src/scuola/sostituti/Vuoto.vue',
  },
  // cosa del gioco di casa può entrare nel pacchetto dei bambini (la guardia vieta gli altri giochi)
  ammessi: [
    'src/views/BancarellaGame.vue',
    // le soglie del dito e la creta del cibo e del cuoco, che la cucina prende dalla fattoria
    'src/giochi/fattoria3d/viste/dito-soglie.js',
    'src/giochi/fattoria3d/scena3d/creta.js',
  ],
}
