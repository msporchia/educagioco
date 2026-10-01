// In quarta, dopo «Lei gioca»: la maestra non trova gli occhiali, e tutta
// la classe li cerca. Dove sono lo vede chi ride per primo. Quattro pagine,
// sei domande (una frase da toccare, chi l'ha detto, i fatti in ordine).
// Formato in docs/lingue/libro.md.
const bambino = (en, altro) => ({ en, altro })

export default {
  id: 'gli-occhiali-della-maestra',
  mondo: 'quarta',
  dopo: 'quarta-lei-gioca',
  titolo: 'Gli occhiali della maestra',
  // school arriva nella quinta isola, laugh nella sesta; glasses, open e story stanno nei cassetti
  nuove: ['suddenly', 'school', 'laugh'],
  variabili: {
    giorno: { da: 'giorni', fra: ['Monday', 'Tuesday', 'Wednesday'] },
    ora: { da: 'numeri', fra: ['eight', 'nine'] },
    sotto: { fra: [bambino('Leo', 'Tom'), bambino('Tom', 'Leo')] },
    trova: { fra: ['Laura', 'Leo', 'Tom'] },
    storia: { fra: [{ en: 'a dog, a cat and a big red kite', it: 'Un cane, un gatto e un aquilone rosso' },
                    { en: 'a pilot, a small plane and a big storm', it: 'Un pilota, un aereo e un temporale' },
                    { en: 'a farmer and ten very hungry pigs', it: 'Un contadino e dieci maiali' }] },
  },
  pagine: [
    [
      { en: 'It is {giorno} morning, and it is {ora} o’clock.', forma: 'ora' },
      { en: 'Laura, Leo and Tom are at school with their teacher.', forma: 'presente' },
      { chi: 'maestra', en: 'Good morning! Today we read a story.', forma: 'presente' },
      { id: 'perche', en: 'She opens her big book, but she has not got her glasses, and she cannot read.',
        forma: 'terza-s' },
      { chi: 'maestra', en: 'Where are my glasses?', forma: 'dove' },
    ],
    [
      { en: 'Laura, Leo and Tom help her.', forma: 'presente' },
      { en: '{sotto} looks under the table, and {sotto.altro} looks in her backpack.', forma: 'terza-s' },
      { en: 'Laura looks near the window and behind the door.', forma: 'terza-s' },
      { chi: v => v.sotto.altro, en: 'They are not in the backpack!', forma: 'dove' },
      { chi: v => v.sotto.en, en: 'And they are not under the table!', forma: 'dove' },
      { en: 'The teacher is very sad.', forma: 'presente' },
    ],
    [
      { en: 'Suddenly {trova} looks at the teacher and laughs.', forma: 'terza-s' },
      { id: 'testa', chi: v => v.trova, en: 'Look! Your glasses are on your head!', forma: 'dove' },
      { en: 'The teacher looks in the mirror near the door.', forma: 'terza-s' },
      { en: 'Her glasses are on her head, in her hair!', forma: 'dove' },
      { en: 'She laughs, and Laura, Leo and Tom laugh with her.', forma: 'terza-s' },
    ],
    [
      { chi: 'maestra', en: 'Thank you, {trova}!', forma: 'saluti' },
      { en: 'Now the teacher can read, and she reads the story to them.', forma: 'terza-s' },
      { en: 'It is a story with {storia.en}.', forma: 'presente' },
      { en: 'At twelve o’clock Laura, Leo and Tom go home.', forma: 'ora' },
      { chi: 'mamma', en: 'How is school today, Leo?', forma: 'presente' },
      { chi: 'Leo', en: 'Very good! We laugh and laugh!', forma: 'presente' },
    ],
  ],
  domande: [
    { testo: 'Che cosa non trova la maestra?', risposta: () => 'I suoi occhiali',
      anche: ['Il suo libro', 'Il suo zaino', 'La sua penna'] },
    { tipo: 'frase', testo: 'Perché la maestra non riesce a leggere?', frase: 'perche' },
    { testo: 'Tom cerca sotto il tavolo.', tipo: 'vf', vero: v => v.sotto.en === 'Tom' },
    { tipo: 'chi', frase: 'testa' },
    { tipo: 'ordine', fatti: ['La maestra apre il libro', 'Laura, Leo e Tom cercano gli occhiali',
                              v => `${v.trova} ride`, 'La maestra legge una storia'] },
    { testo: 'Di che cosa parla la storia della maestra?', risposta: v => v.storia.it },
  ],
}
