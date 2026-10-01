// Le frasi componibili del primo mondo, «Il prato in fiore». `en` in forma lunga e senza
// «?» (la contrazione la fa la tappa, il «?» la fila); gli `id` delle frasi
// di data/frasi.js e dei mondi di prima restano quelli: sono la chiave SRS.
// Una frase usa solo parole già viste e almeno un segno della struttura
// della sua tappa (dati/forme.js). Formato in docs/lingue/frasi.md.
export default {
  mondo: 'prima',
  frasi: [
    /* ── Ciao! Come ti chiami? ── */
    { id: 'e-my-name', tappa: 'prima-ciao', forma: 'saluti', it: 'mi chiamo Leo', en: 'my name is Leo' },
    { id: 'd-what-name', tappa: 'prima-ciao', forma: 'saluti', it: 'come ti chiami?', en: 'what is your name' },
    { id: 'e-i-am-leo', tappa: 'prima-ciao', forma: 'saluti', it: 'io sono Leo', en: 'I am Leo' },
    { id: 'd-how-are-you', tappa: 'prima-ciao', forma: 'saluti', it: 'come stai?', en: 'how are you' },
    { id: 'm-i-am-fine', tappa: 'prima-ciao', forma: 'saluti', it: 'sto bene, grazie', en: 'I am fine thank you' },
    { id: 'e-good-morning', tappa: 'prima-ciao', forma: 'saluti', it: 'buongiorno', en: 'good morning' },
    { id: 'e-good-night', tappa: 'prima-ciao', forma: 'saluti', it: 'buonanotte', en: 'good night' },
    { id: 'm-my-name-tom', tappa: 'prima-ciao', forma: 'saluti', it: 'mi chiamo Tom', en: 'my name is Tom' },
    { id: 'm-good-night-laura', tappa: 'prima-ciao', forma: 'saluti', it: 'buonanotte, Laura', en: 'good night Laura' },
    { id: 'm-merry-christmas', tappa: 'prima-ciao', forma: 'saluti', it: 'buon Natale', en: 'merry Christmas', varianti: ['happy Christmas'] },
    { id: 'm-happy-easter', tappa: 'prima-ciao', forma: 'saluti', it: 'buona Pasqua', en: 'happy Easter' },
    { id: 'm-happy-halloween', tappa: 'prima-ciao', forma: 'saluti', it: 'buon Halloween', en: 'happy Halloween' },

    /* ── Che cos'è? ── */
    { id: 'm-dog', tappa: 'prima-che-cose', forma: 'it-is', it: 'è un cane', en: 'it is a dog' },
    { id: 'm-cat', tappa: 'prima-che-cose', forma: 'it-is', it: 'è un gatto', en: 'it is a cat' },
    { id: 'm-cow', tappa: 'prima-che-cose', forma: 'it-is', it: 'è una mucca', en: 'it is a cow' },
    { id: 'm-rabbit', tappa: 'prima-che-cose', forma: 'it-is', it: 'è un coniglio', en: 'it is a rabbit' },
    { id: 'm-mouse', tappa: 'prima-che-cose', forma: 'it-is', it: 'è un topo', en: 'it is a mouse',
      trappole: [{ en: 'it is a horse', it: 'è un cavallo', parola: 'mouse',
                   perche: 'mouse è il topo, horse è il cavallo' }] },
    { id: 'm-not-fish', tappa: 'prima-che-cose', forma: 'it-is', it: 'non è un pesce', en: 'it is not a fish' },
    { id: 'm-kite', tappa: 'prima-che-cose', forma: 'it-is', it: 'è un aquilone', en: 'it is a kite' },
    { id: 'm-is-pig', tappa: 'prima-che-cose', forma: 'is-it', it: 'è un maiale?', en: 'is it a pig' },
    { id: 'm-is-duck', tappa: 'prima-che-cose', forma: 'is-it', it: 'è un’anatra?', en: 'is it a duck' },
    { id: 'm-is-doll', tappa: 'prima-che-cose', forma: 'is-it', it: 'è una bambola?', en: 'is it a doll' },
    { id: 'm-not-cow', tappa: 'prima-che-cose', forma: 'it-is', it: 'non è una mucca', en: 'it is not a cow' },
    { id: 'm-not-ball', tappa: 'prima-che-cose', forma: 'it-is', it: 'non è una palla', en: 'it is not a ball' },

    /* ── Di che colore è? ── */
    { id: 'm-red-fish', tappa: 'prima-colore', forma: 'colore-prima', it: 'è un pesce rosso', en: 'it is a red fish' },
    { id: 'e-cat-black', tappa: 'prima-colore', forma: 'colore-prima', it: 'il gatto è nero', en: 'the cat is black' },
    { id: 'm-yellow-duck', tappa: 'prima-colore', forma: 'colore-prima', it: 'è un’anatra gialla', en: 'it is a yellow duck' },
    { id: 'm-blue-car', tappa: 'prima-colore', forma: 'colore-prima', it: 'è una macchina blu?', en: 'is it a blue car' },
    { id: 'm-brown-horse', tappa: 'prima-colore', forma: 'colore-prima', it: 'il cavallo è marrone', en: 'the horse is brown' },
    { id: 'm-orange-ball', tappa: 'prima-colore', forma: 'colore-prima', it: 'è una palla arancione', en: 'it is an orange ball' },
    { id: 'm-pink-pig', tappa: 'prima-colore', forma: 'colore-prima', it: 'il maiale è rosa?', en: 'is the pig pink' },

    /* ── Quanti sono? ── */
    { id: 'm-two-dogs', tappa: 'prima-quanti', forma: 'plurale', it: 'sono due cani', en: 'they are two dogs' },
    { id: 'm-three-cats', tappa: 'prima-quanti', forma: 'plurale', it: 'sono tre gatti neri', en: 'they are three black cats' },
    { id: 'm-are-rabbits', tappa: 'prima-quanti', forma: 'plurale', it: 'sono conigli?', en: 'are they rabbits' },
    { id: 'm-five-ducks', tappa: 'prima-quanti', forma: 'plurale', it: 'sono cinque anatre', en: 'they are five ducks' },
    { id: 'm-four-birds', tappa: 'prima-quanti', forma: 'plurale', it: 'sono quattro uccelli rossi', en: 'they are four red birds' },
    { id: 'm-cat-and-dog', tappa: 'prima-quanti', forma: 'plurale', it: 'sono un gatto e un cane', en: 'they are a cat and a dog' },
    { id: 'e-cats-are-black', tappa: 'prima-quanti', forma: 'plurale', it: 'i gatti sono neri', en: 'the cats are black' },
    { id: 'm-six-crayons', tappa: 'prima-quanti', forma: 'plurale', it: 'sono sei pastelli verdi', en: 'they are six green crayons' },
    { id: 'm-are-ducks', tappa: 'prima-quanti', forma: 'plurale', it: 'sono anatre?', en: 'are they ducks' },
    { id: 'm-are-birds', tappa: 'prima-quanti', forma: 'plurale', it: 'sono uccelli?', en: 'are they birds' },

    /* ── Questo è… ── */
    { id: 'e-cat-1', tappa: 'prima-questo', forma: 'this-is', it: 'questo è un gatto', en: 'this is a cat' },
    { id: 'd-cat-1', tappa: 'prima-questo', forma: 'this-is', it: 'questo è un gatto?', en: 'is this a cat' },
    { id: 'e-not-dog', tappa: 'prima-questo', forma: 'this-is', it: 'questo non è un cane', en: 'this is not a dog' },
    { id: 'm-pen', tappa: 'prima-questo', forma: 'this-is', it: 'questa è una penna', en: 'this is a pen',
      trappole: [{ en: 'this is a pencil', it: 'questa è una matita', parola: 'pen',
                   perche: 'pen è la penna, pencil è la matita' }] },
    { id: 'm-blue-book', tappa: 'prima-questo', forma: 'this-is', it: 'questo è un libro blu', en: 'this is a blue book' },
    { id: 'm-is-ruler', tappa: 'prima-questo', forma: 'this-is', it: 'questo è un righello?', en: 'is this a ruler' },
    { id: 'm-not-map', tappa: 'prima-questo', forma: 'this-is', it: 'questa non è una mappa', en: 'this is not a map' },
    { id: 'm-my-backpack', tappa: 'prima-questo', forma: 'this-is', it: 'questo è il mio zaino', en: 'this is my backpack' },
    { id: 'm-is-book', tappa: 'prima-questo', forma: 'this-is', it: 'questo è un libro?', en: 'is this a book' },
    { id: 'm-not-pencil', tappa: 'prima-questo', forma: 'this-is', it: 'questa non è una matita', en: 'this is not a pencil' },
    { id: 'm-this-pumpkin', tappa: 'prima-questo', forma: 'this-is', it: 'questa è una zucca', en: 'this is a pumpkin' },
    { id: 'm-is-this-present', tappa: 'prima-questo', forma: 'this-is', it: 'questo è un regalo?', en: 'is this a present' },
    { id: 'm-not-ghost', tappa: 'prima-questo', forma: 'this-is', it: 'questo non è un fantasma', en: 'this is not a ghost' },
  ],
}
