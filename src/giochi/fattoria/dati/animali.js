/* ═══════════════════════════════════════════════════════════════════
   LE BESTIE CHE SI POSSONO COMPRARE

   ── SI VENDE SOLO QUELLO CHE SI SA DISEGNARE ──────────────────────
   L'elenco vero non è questa tabella: è questa tabella **incrociata con
   `BESTIE`**, cioè con gli attori che l'atlante contiene davvero. Una
   riga qui che non ha lo sprite non compare in negozio, e non fa
   chiedere a un bambino perché la sua gallina è invisibile.

   Vale anche al contrario, ed è la regola che rende il travaso
   indolore: una bestia **già comprata** che oggi non si sa disegnare
   viene semplicemente **ignorata** — non sparisce dal salvataggio, non
   fa cadere niente, semplicemente non entra in scena. Finché non si
   pubblica, il travaso dalla cameretta è a senso unico e non c'è niente
   da riportare indietro.

   ── UNA BESTIA SI SPOSTA COME UN OGGETTO ──────────────────────────
   *Questa riga ribalta quella di prima*, che diceva «una bestia non si
   posa, non si sposta, non si mette via»: si compra e basta, poi gira
   per il prato per conto suo. Provato col dito, non reggeva — un
   recinto costruito con tanta pazienza restava vuoto, perché non c'era
   nessun modo di metterci dentro il cane.

   Adesso si prende e si posa come una panchina. Siccome una bestia non
   attraversa la staccionata, **spostarla è il modo di metterla nel
   recinto**: non serve inventare un recinto che si chiude, basta il
   gesto che c'era già. Resta vero il resto — una bestia non si mette
   via in magazzino e non sta nel catalogo con le panchine, perché
   quello che si compra qui non è un oggetto ma un impegno (i bisogni,
   in `bisogni.js`).

   La conseguenza che si scorda: **dove sta una bestia va salvata**
   (`x`, `y` nel record della bestia, vedi `motore/fattoria.js`). Se
   rinascessero in mezzo al prato a ogni apertura, quello che la bambina
   aveva chiuso nel recinto se ne sarebbe uscito da solo durante la
   notte, e la colpa sembrerebbe del recinto.
   ═══════════════════════════════════════════════════════════════════ */
import { BESTIE } from './atlante.js'
import { cibiPer } from './bisogni.js'

/* nome dello sprite → come si presenta, quanto costa e a che livello
   della fattoria arriva (`dati/livelli.js`). I prezzi sono
   alti rispetto agli oggetti apposta: una bestia è la cosa che si
   desidera per giorni, non quella che si compra per riempire un angolo. */
export const ANIMALI = {
  'cane-bobtail': { nome: 'Bobtail', emoji: '🐕', prezzo: 90, liv: 2 },
  'cane-beagle':  { nome: 'Beagle',  emoji: '🐶', prezzo: 90, liv: 13 },
  'gatto-tuxedo': { nome: 'Gatto bianco e nero', emoji: '🐈', prezzo: 75, liv: 7 },
  'gatto-nero':   { nome: 'Gatto nero',   emoji: '🐈‍⬛', prezzo: 75, liv: 20 },
  'gatto-giallo': { nome: 'Gatto rosso',  emoji: '🐈', prezzo: 75, liv: 30 },
  'pappagallo':   { nome: 'Pappagallo',   emoji: '🦜', prezzo: 120, liv: 42 },
}

/* Quelli che si possono davvero comprare oggi: dichiarati **e**
   disegnabili. Si ricava, non si scrive. */
export const IN_VENDITA = BESTIE
  .filter(n => ANIMALI[n])
  .map(n => ({ chi: n, ...ANIMALI[n] }))

/* ── I NOMI DA TOCCARE ────────────────────────────────────────────
   Un animale senza nome è «il cane». Con un nome è **il tuo cane**, ed
   è tutta lì la differenza fra una figurina comprata e una bestia di
   casa. Il nome sta nel profilo e non qui: questa è solo la lista di
   quelli che si possono toccare invece di scrivere.

   Perché una lista, e non solo la tastiera: questo gioco lo apre anche
   un bambino di quattro anni, che scrivere non sa. Toccare un nome è
   una scelta vera fatta da solo; una casella di testo vuota è un muro,
   e chi arriva lì chiama il cane «aaa» o chiama la mamma. La casella
   c'è lo stesso, per chi sa scrivere e vuole il nome suo. */
export const NOMI = {
  cane: ['Watson', 'Birba', 'Fiocco', 'Pepe', 'Nuvola', 'Biscotto',
         'Rocky', 'Luna', 'Ciccio', 'Zorro'],
  gatto: ['Micio', 'Ombra', 'Zenzero', 'Perla', 'Briciola', 'Pallino',
          'Neve', 'Tigro', 'Mimì', 'Fumo'],
  pappagallo: ['Coco', 'Arcobaleno', 'Kiwi', 'Cielo', 'Rio', 'Sole'],
}

/* La famiglia si ricava dal nome dello sprite — `cane-beagle` è un cane
   — ed è la stessa chiave con cui `bisogni.js` dice chi mangia cosa: si
   scrive una volta qui e non si tiene allineato nessun elenco. */
export const famigliaDi = chi => String(chi).split('-')[0]

/* Chi non ha una famiglia sua prende i nomi di tutti: meglio dieci nomi
   un po' generici che una casella vuota. */
export function nomiPer(chi) {
  return NOMI[famigliaDi(chi)] || [...new Set(Object.values(NOMI).flat())]
}

export const siDisegna = chi => BESTIE.includes(chi)
export const animale = chi => ANIMALI[chi] || null

export function guastiDegliAnimali() {
  const g = []
  for (const [chi, a] of Object.entries(ANIMALI)) {
    if (!a.nome) g.push(`${chi}: senza nome`)
    if (!(a.prezzo > 0)) g.push(`${chi}: prezzo impossibile`)
    /* non è un guasto: è il promemoria che una riga sta aspettando lo
       sprite, e senza questo non se ne accorgerebbe nessuno */
    if (!BESTIE.includes(chi)) g.push(`nota: ${chi} è dichiarato e non ancora disegnabile`)
    /* Una bestia senza cibi suoi è una bestia che non si può nutrire:
       la ciotola sarebbe piena di roba che rifiuta, e sembrerebbe un
       guasto del gioco invece di una tabella dimenticata. */
    if (cibiPer(famigliaDi(chi)).length < 2)
      g.push(`${chi}: la famiglia «${famigliaDi(chi)}» ha meno di due cibi suoi`)
  }
  if (!IN_VENDITA.length) g.push('nessuna bestia in vendita: il negozio sarebbe vuoto')
  return g
}
