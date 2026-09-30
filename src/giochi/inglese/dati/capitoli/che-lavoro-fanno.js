// In quarta, dopo «I mestieri»: Leo racconta la sua famiglia davanti a un
// quadro. Il mestiere non è mai scritto: si capisce da quello che fanno.
// Quattro pagine, cinque domande. Formato in docs/lingue/libro.md.
const INDIZI = {
  pilota: ['{P} flies a big plane.', 'Every day {p} is in the sky!'],
  cuoco: ['{P} cooks pasta, soup and pizza.', '{P} is always in a big kitchen.'],
  cantante: ['Every evening {p} sings and dances.', 'Then {p} goes to bed at one o’clock!'],
  contadino: ['{P} has got ten cows, five pigs and a horse.', '{P} drinks milk from {pos} cows every morning.'],
}
const LAVORI = [
  { id: 'pilota', m: 'Pilota', f: 'Pilota' },
  { id: 'cuoco', m: 'Cuoco', f: 'Cuoca' },
  { id: 'cantante', m: 'Cantante', f: 'Cantante' },
  { id: 'contadino', m: 'Contadino', f: 'Contadina' },
]
// gli indizi del mestiere di `chi`, uno per mestiere: si accende quello giusto
const indizi = (chi, lavoro) => Object.entries(INDIZI).map(([id, righe]) => ({
  id: `${chi}-${id}`,
  se: v => v[lavoro].id === id,
  chi: 'Leo',
  en: righe.join(' ').replace(/\{(P|p|pos)\}/g, (_, k) => `{${chi}.${k}}`),
  forma: 'terza-s',
}))
const lui = en => ({ en, P: 'He', p: 'he', pos: 'his', f: false })
const lei = en => ({ en, P: 'She', p: 'she', pos: 'her', f: true })

export default {
  id: 'che-lavoro-fanno',
  mondo: 'quarta',
  dopo: 'quarta-mestieri',
  titolo: 'Che lavoro fanno?',
  variabili: {
    mamma: { fra: [lei('mother')] },
    papa: { fra: [lui('father')] },
    nonno: { fra: [lui('grandfather'), lei('grandmother')] },
    lMamma: { fra: LAVORI },
    lPapa: { fra: LAVORI },
    lNonno: { fra: LAVORI },
  },
  vincoli: [v => new Set([v.lMamma, v.lPapa, v.lNonno]).size === 3],
  pagine: [
    [
      { en: 'Tom is in the kitchen with Laura and Leo.', forma: 'presente' },
      { en: 'There is a big picture on the wall.', forma: 'there-is' },
      { chi: 'Tom', en: 'Who is this, Leo?', forma: 'presente' },
      { chi: 'Leo', en: 'This is my mother.', forma: 'this-is-my' },
      { chi: 'Tom', en: 'What does she do?', forma: 'terza-s' },
      ...indizi('mamma', 'lMamma'),
    ],
    [
      { chi: 'Tom', en: 'And who is this?', forma: 'presente' },
      { chi: 'Leo', en: 'This is my father.', forma: 'this-is-my' },
      { chi: 'Tom', en: 'What does he do?', forma: 'terza-s' },
      ...indizi('papa', 'lPapa'),
    ],
    [
      { chi: 'Leo', en: 'And this is my {nonno}.', forma: 'this-is-my' },
      { chi: 'Tom', en: 'What does {nonno.p} do?', forma: 'terza-s' },
      ...indizi('nonno', 'lNonno'),
    ],
    [
      { chi: 'Leo', en: 'And this is Pip!', forma: 'this-is' },
      { chi: 'Tom', en: 'What does Pip do?', forma: 'terza-s' },
      { chi: 'Laura', en: 'He eats, he plays and he sleeps. He is a dog!', forma: 'terza-s' },
      { en: 'Tom looks at the picture and he likes it.', forma: 'terza-s' },
    ],
  ],
  domande: [
    { testo: 'Che lavoro fa la mamma di Leo?', risposta: v => v.lMamma.f },
    { testo: 'Che lavoro fa il papà di Leo?', risposta: v => v.lPapa.m },
    { tipo: 'frase', testo: 'Da quale frase si capisce che lavoro fa la mamma di Leo?',
      frase: v => `mamma-${v.lMamma.id}` },
    { testo: v => (v.nonno.f ? 'La nonna di Leo ha delle mucche.' : 'Il nonno di Leo ha delle mucche.'),
      tipo: 'vf', vero: v => (v.lNonno.id === 'contadino' ? true : null) },
    { testo: 'Dov’è il quadro?', risposta: () => 'Sul muro della cucina',
      anche: ['Sul tavolo della cucina', 'In giardino', 'Sotto il letto'] },
    { testo: 'Che cosa fa Pip?', risposta: () => 'Mangia, gioca e dorme',
      anche: ['Vola su un aereo', 'Canta ogni sera', 'Cucina la pasta'] },
  ],
}
