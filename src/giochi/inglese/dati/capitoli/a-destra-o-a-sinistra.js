// In quinta, dopo «Gira a sinistra»: Leo e Tom vanno da soli a raggiungere
// Laura, il papà dà la strada, e all'angolo uno dei due confonde la destra
// con la sinistra. Li rimette in strada il dottore. Quattro pagine, sei
// domande. Formato in docs/lingue/libro.md.
const ragazzo = (en, altro) => ({ en, altro })
const vicino = (id, en, it) => ({ id, en, it })

export default {
  id: 'a-destra-o-a-sinistra',
  mondo: 'quinta',
  dopo: 'quinta-gira',
  titolo: 'A destra o a sinistra?',
  nuove: ['laugh'],
  variabili: {
    posto: { da: 'luoghi', fra: ['cinema', 'museum', 'zoo', 'library'] },
    ora: { da: 'numeri', fra: ['three', 'four', 'five'] },
    sbaglia: { fra: [ragazzo('Tom', 'Leo'), ragazzo('Leo', 'Tom')] },
    dove: { fra: [vicino('stazione', 'next to the station', 'Accanto alla stazione'),
                  vicino('parco', 'opposite the park', 'Di fronte al parco')] },
  },
  pagine: [
    [
      { en: 'It is Saturday afternoon, and Leo and Tom are in the kitchen with Father.', forma: 'presente' },
      { en: 'Laura is at the {posto} with Mother.', forma: 'presente' },
      { en: 'At {ora} o’clock Leo and Tom go there on foot, and Father is not with them!', forma: 'ora' },
      { id: 'strada', chi: 'papa', en: 'Go straight on, then turn left at the bank.', forma: 'strada' },
      { chi: 'papa', en: 'The {posto} is {dove}.', forma: 'strada' },
    ],
    [
      { en: 'Leo and Tom walk on the pavement and go straight on.', forma: 'presente' },
      { en: 'At the corner there is a big bank.', forma: 'there-is' },
      { en: '{sbaglia} looks at his hands.', forma: 'terza-s' },
      { id: 'mano', chi: v => v.sbaglia.en, en: 'Left? This is my left hand!', forma: 'this-is-my' },
      { en: 'But it is his right hand, and the two friends turn right.', forma: 'strada' },
    ],
    [
      { en: 'They walk and walk, but there is no station and no park: there is a big white hospital.',
        forma: 'there-is' },
      { chi: v => v.sbaglia.altro, en: 'This is not the {posto}, it is the hospital!', forma: 'this-is' },
      { en: 'Suddenly the doctor is at the door of the hospital.', forma: 'presente' },
      { chi: 'dottore', en: 'Hello, boys! Where are you going?', forma: 'ing' },
      { chi: 'Leo', en: 'We are going to the {posto}, but where is it?', forma: 'ing' },
      { chi: 'dottore', en: 'Go to the bank and go straight on. The {posto} is {dove}.',
        forma: 'strada' },
    ],
    [
      { se: v => v.dove.id === 'stazione', en: 'At the bank they go straight on, and there is the station.',
        forma: 'strada' },
      { se: v => v.dove.id === 'parco', en: 'At the bank they go straight on, and there is the park.',
        forma: 'strada' },
      { en: 'The {posto} is {dove}, and Laura and Mother are at the door.', forma: 'strada' },
      { chi: 'Laura', en: 'Leo, Tom, you are very late!', forma: 'presente' },
      { id: 'scrivi', chi: 'mamma', en: '{sbaglia}, write left on your left hand!', forma: 'presente' },
      { en: 'Laura, Leo and Tom laugh.', forma: 'presente' },
    ],
  ],
  domande: [
    { testo: 'Dove vanno Leo e Tom?', risposta: v => v.posto.al },
    { tipo: 'frase', testo: 'Dove bisogna girare a sinistra, secondo il papà?', frase: 'strada' },
    { testo: 'Perché Leo e Tom sbagliano strada?',
      risposta: v => `${v.sbaglia.en} confonde la destra con la sinistra`,
      anche: ['Il papà sbaglia la strada', 'All’angolo non c’è la banca'] },
    { tipo: 'chi', frase: 'mano' },
    { tipo: 'ordine', fatti: ['Il papà dà la strada', 'Leo e Tom girano a destra alla banca',
                              'Il dottore dà la strada', 'Leo e Tom trovano Laura e la mamma'] },
    { testo: v => `Dov’è ${v.posto.il}?`, risposta: v => v.dove.it, anche: ['Fra la banca e la scuola'] },
  ],
}
