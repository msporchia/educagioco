// Quello che Castle Battle porta con sé e a scuola non si apre (docs/arena/scuola.md). Percorsi dalla radice del repo. Il gioco
// in due sta nei sostituti comuni (giochi/insieme.js), gli amici in quelli della scuola.
export default {
  sostituti: {
    // la mappa della campagna: col limite si parte nella tappa
    'src/giochi/arena/viste/Mappa.vue': 'src/scuola/sostituti/Vuoto.vue',
  },
  ammessi: ['src/giochi/arena/'],
}
