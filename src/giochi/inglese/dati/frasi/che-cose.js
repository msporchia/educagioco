// Le frasi componibili del mondo «Che cos'è». `en` in forma lunga e senza
// «?» (la contrazione la fa la tappa, il «?» la fila); gli `id` delle frasi
// di data/frasi.js restano quelli: sono la chiave SRS. Formato in
// docs/lingue/mondi.md («Le trappole sono il dato»).
export default {
  mondo: 'che-cose',
  frasi: [
    /* ── 1. it is a … ── */
    { id: 'm-dog', tappa: 'che-cose-1', forma: 'it-is', it: 'è un cane', en: 'it is a dog' },
    { id: 'm-cat', tappa: 'che-cose-1', forma: 'it-is', it: 'è un gatto', en: 'it is a cat' },
    { id: 'm-cow', tappa: 'che-cose-1', forma: 'it-is', it: 'è una mucca', en: 'it is a cow' },
    { id: 'm-rabbit', tappa: 'che-cose-1', forma: 'it-is', it: 'è un coniglio', en: 'it is a rabbit' },
    { id: 'm-mouse', tappa: 'che-cose-1', forma: 'it-is', it: 'è un topo', en: 'it is a mouse',
      trappole: [{ en: 'it is a horse', it: 'è un cavallo', parola: 'mouse',
                   perche: 'mouse è il topo, horse è il cavallo' }] },
    { id: 'm-not-fish', tappa: 'che-cose-1', forma: 'it-is', it: 'non è un pesce', en: 'it is not a fish' },

    /* ── 2. is it …? ── */
    { id: 'm-is-pig', tappa: 'che-cose-2', forma: 'is-it', it: 'è un maiale?', en: 'is it a pig' },
    { id: 'm-is-duck', tappa: 'che-cose-2', forma: 'is-it', it: 'è un’anatra?', en: 'is it a duck' },
    { id: 'm-is-elephant', tappa: 'che-cose-2', forma: 'is-it', it: 'è un elefante?', en: 'is it an elephant' },
    { id: 'm-is-frog', tappa: 'che-cose-2', forma: 'is-it', it: 'è una rana?', en: 'is it a frog' },
    { id: 'm-is-sheep', tappa: 'che-cose-2', forma: 'is-it', it: 'è una pecora?', en: 'is it a sheep' },
    { id: 'm-monkey', tappa: 'che-cose-2', forma: 'it-is', it: 'è una scimmia', en: 'it is a monkey' },

    /* ── 3. i colori ── */
    { id: 'e-cat-black', tappa: 'che-cose-3', forma: 'colore-prima', it: 'il gatto è nero', en: 'the cat is black' },
    { id: 'e-dog-big', tappa: 'che-cose-3', forma: 'colore-prima', it: 'il cane è grande', en: 'the dog is big' },
    { id: 'd-dog-big', tappa: 'che-cose-3', forma: 'colore-prima', it: 'il cane è grande?', en: 'is the dog big' },
    { id: 'm-red-fish', tappa: 'che-cose-3', forma: 'colore-prima', it: 'è un pesce rosso', en: 'it is a red fish' },
    { id: 'm-small-mouse', tappa: 'che-cose-3', forma: 'colore-prima', it: 'è un topo piccolo', en: 'it is a small mouse' },
    { id: 'm-green-frog', tappa: 'che-cose-3', forma: 'colore-prima', it: 'è una rana verde?', en: 'is it a green frog' },
    { id: 'm-white-sheep', tappa: 'che-cose-3', forma: 'colore-prima', it: 'la pecora è bianca', en: 'the sheep is white' },

    /* ── 4. numeri e plurale ── */
    { id: 'e-cats-are-black', tappa: 'che-cose-4', forma: 'plurale', it: 'i gatti sono neri', en: 'the cats are black' },
    { id: 'm-two-dogs', tappa: 'che-cose-4', forma: 'plurale', it: 'sono due cani', en: 'they are two dogs' },
    { id: 'm-three-cats', tappa: 'che-cose-4', forma: 'plurale', it: 'sono tre gatti neri', en: 'they are three black cats' },
    { id: 'm-are-rabbits', tappa: 'che-cose-4', forma: 'plurale', it: 'sono conigli?', en: 'are they rabbits' },
    { id: 'm-five-ducks', tappa: 'che-cose-4', forma: 'plurale', it: 'sono cinque anatre', en: 'they are five ducks' },
    { id: 'm-four-birds', tappa: 'che-cose-4', forma: 'plurale', it: 'sono quattro uccelli rossi', en: 'they are four red birds' },
    { id: 'm-cat-and-dog', tappa: 'che-cose-4', forma: 'plurale', it: 'sono un gatto e un cane', en: 'they are a cat and a dog' },

    /* ── 5. this is … ── */
    { id: 'e-cat-1', tappa: 'che-cose-5', forma: 'this-is', it: 'questo è un gatto', en: 'this is a cat' },
    { id: 'd-cat-1', tappa: 'che-cose-5', forma: 'this-is', it: 'questo è un gatto?', en: 'is this a cat' },
    { id: 'e-not-dog', tappa: 'che-cose-5', forma: 'this-is', it: 'questo non è un cane', en: 'this is not a dog' },
    { id: 'm-pen', tappa: 'che-cose-5', forma: 'this-is', it: 'questa è una penna', en: 'this is a pen',
      trappole: [{ en: 'this is a pencil', it: 'questa è una matita', parola: 'pen',
                   perche: 'pen è la penna, pencil è la matita' }] },
    { id: 'm-blue-book', tappa: 'che-cose-5', forma: 'this-is', it: 'questo è un libro blu', en: 'this is a blue book' },
    { id: 'm-is-ruler', tappa: 'che-cose-5', forma: 'this-is', it: 'questo è un righello?', en: 'is this a ruler' },
    { id: 'm-not-map', tappa: 'che-cose-5', forma: 'this-is', it: 'questa non è una mappa', en: 'this is not a map' },
  ],
}
