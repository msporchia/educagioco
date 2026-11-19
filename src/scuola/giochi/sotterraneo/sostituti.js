// Quello che il sotterraneo porta con sé e a scuola non si apre (docs/sotterraneo/scuola.md). Percorsi dalla radice del repo.
const VUOTO = 'src/scuola/sostituti/Vuoto.vue'
export default {
  sostituti: {
    // il mondo di sopra (il villaggio, le botteghe, il tintore, gli scontri sul prato): col limite non si sale mai
    'src/giochi/sotterraneo/viste/Campagna.vue': VUOTO,
    'src/giochi/sotterraneo/viste/ScontroSopra.vue': VUOTO,
    'src/giochi/sotterraneo/viste/Bottega.vue': VUOTO,
    'src/giochi/sotterraneo/viste/Tintore.vue': VUOTO,
    // il gioco in due (gli altri pezzi sono comuni: giochi/insieme.js)
    'src/giochi/sotterraneo/viste/SceltaInDue.vue': VUOTO,
    'src/giochi/sotterraneo/sfida/regia.js': 'src/scuola/sostituti/sotterraneo-regia.js',
  },
  // il gioco, e il disegno puro delle anteprime che prende in prestito dalla fattoria
  ammessi: ['src/giochi/sotterraneo/', 'src/giochi/fattoria3d/scena3d/anteprime-pura.js'],
}
