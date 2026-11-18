// Quello che Survivors porta con sé e a scuola non si apre o pesa troppo (docs/survivors/scuola.md). Percorsi dalla radice del repo.
export default {
  sostituti: {
    'src/giochi/survivors/viste/Mappa.vue': 'src/scuola/sostituti/Vuoto.vue',
    'src/giochi/survivors/viste/Finale.vue': 'src/scuola/sostituti/Vuoto.vue',
  },
  // il gioco, e le figure che prende in prestito: i mostri dal castello, l'eroe (con la vespa e il fungo) dal sotterraneo
  ammessi: ['src/giochi/survivors/', 'src/giochi/castello/dati/figure.js', 'src/giochi/castello/dati/vestiti.js', 'src/giochi/sotterraneo/dati/atlante.js'],
}
