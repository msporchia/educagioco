// Nella sesta isola, dopo «Sono andato al castello»: Tom va a vedere un castello, al passato.
// Quattro pagine, sei domande — andata e ritorno da non confondere,
// l'ordine della giornata, il perché, e un vero/falso che vuole due frasi.
// Formato in docs/lingue/libro.md.
const grande = s => s[0].toUpperCase() + s.slice(1)
const chi = (en, con) => ({ en, con })

export default {
  id: 'la-gita-al-castello',
  mondo: 'sesta',
  dopo: 'quinta-andai',
  titolo: 'La gita al castello',
  variabili: {
    chi: { fra: [chi('grandfather', 'Con suo nonno'), chi('grandmother', 'Con sua nonna'),
                 chi('father', 'Con suo papà')] },
    andata: { da: 'mezzi', fra: ['train', 'bus', 'car'] },
    ritorno: { da: 'mezzi', fra: ['train', 'bus', 'car'] },
    cibo: { da: 'cibi', fra: ['pizza', 'pasta', 'soup'] },
    altro: { da: 'cibi', fra: ['pizza', 'pasta', 'soup', 'salad'] },
    cavallo: { fra: [true, false] },
    giusto: { fra: [true, false] },
  },
  vincoli: [v => v.cibo !== v.altro],
  pagine: [
    [
      { en: 'Tom was ten, and he liked castles.', forma: 'passato-ed' },
      { en: 'Last summer he went to a small village with his {chi}.', forma: 'passato' },
      { en: 'They went there by {andata}.', forma: 'passato' },
      { en: 'The village was small, but it had a big castle.', forma: 'passato' },
    ],
    [
      { en: 'In the morning they walked to the castle on a long bridge.', forma: 'passato-ed' },
      { en: 'In the castle there were ten big beds and a very long table.', forma: 'was-were' },
      { en: 'Tom liked the castle, and he played there with his {chi}.', forma: 'passato-ed' },
    ],
    [
      { en: 'At one o’clock they ate lunch in a restaurant.', forma: 'passato' },
      { en: 'Tom ate {cibo}, and his {chi} ate {altro}.', forma: 'passato' },
      { en: 'Then they walked to a farm near the village.', forma: 'passato-ed' },
      { en: 'There were cows, pigs and a big horse.', forma: 'was-were' },
      { se: v => v.cavallo, en: 'Tom climbed on the horse, and his {chi} helped him.', forma: 'passato-ed' },
    ],
    [
      { en: 'In the afternoon there was a storm. The sky was black, and it was very cold.', forma: 'was-were' },
      { en: 'They ran to the church, and they listened to the storm there.', forma: 'passato' },
      { en: 'At six o’clock they went home by {ritorno}.', forma: 'passato' },
      { en: 'Tom was tired, but he was very happy.', forma: 'was-were' },
    ],
  ],
  domande: [
    { testo: 'Con chi è andato Tom al villaggio?', risposta: v => v.chi.con },
    { testo: 'Come sono andati al villaggio?', risposta: v => grande(v.andata.in) },
    { testo: 'Come sono tornati a casa?', risposta: v => grande(v.ritorno.in) },
    { tipo: 'ordine', fatti: ['Hanno visto il castello', 'Hanno mangiato al ristorante',
                              'Sono andati in una fattoria', 'Sono corsi in chiesa'] },
    { testo: 'Perché sono corsi in chiesa?', risposta: () => 'Per il temporale',
      anche: ['Per mangiare', 'Per prendere il treno', 'Per vedere i cavalli'] },
    { testo: v => `Al ristorante Tom ha mangiato ${(v.giusto ? v.cibo : v.altro).il}.`,
      tipo: 'vf', vero: v => v.giusto },
  ],
}
