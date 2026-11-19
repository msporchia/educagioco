// Quello che il castello porta con sé e a scuola non si apre (docs/castello/scuola.md). Percorsi dalla radice del repo.
export default {
  sostituti: {
    // il regno: col limite si parte nella tappa, e senza di lui se ne vanno anche gli amici sugli scudi e il cavaliere del sotterraneo
    'src/components/castello/Regno.vue': 'src/scuola/sostituti/Vuoto.vue',
    // «salta le spiegazioni» sta in guide/aiuto.js, che legge localStorage
    'src/views/castello/spiegazioni.js': 'src/scuola/sostituti/castello-spiegazioni.js',
  },
  // il gioco intero, con le sue figure (gli sprite restano tutti, come a casa)
  ammessi: ['src/views/TowerDefense.vue', 'src/views/castello/', 'src/giochi/castello/'],
}
