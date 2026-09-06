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
  /* Un pappagallo **non porta niente sulla schiena**: ha le ali, e una
     copertina addosso a un uccello non si sa disegnare. È l'unica riga
     che si scosta dal ripiego, ed è il caso per cui `porta` esiste — se
     no il catalogo degli addobbi avrebbe dovuto tenere un elenco di
     eccezioni per specie, allineato a mano per sempre. */
  pappagallo:     { nome: 'Pappagallo',   emoji: '🦜', prezzo: 120, liv: 42,
                    porta: ['testa', 'muso', 'collo'] },
}

/* ── DOVE SI ATTACCA UN ADDOBBO ───────────────────────────────────
   *Dove sta la testa dentro lo sprite*, e non «al centro in alto»: un
   cappellino posato a occhio finisce mezzo dentro il muso da davanti e
   in mezzo alla schiena di lato. Questi quattro punti sono **misurati
   dall'alfa del foglio**, riquadro per riquadro, e stanno qui — nella
   scheda dell'animale — perché sono un fatto del disegno: la scena li
   riceve già risolti e non sa cosa voglia dire «testa»
   (`dati/addobbi.js`, `scena/tela.js`).

   Sono **frazioni del riquadro**, non pixel: un attore nuovo con un
   foglio di un'altra misura resta a posto senza riscrivere niente. In
   pixel, sui riquadri di oggi (16×32 di fronte e di spalle, 32×32 di
   lato), valgono così:

     di fronte   testa (8,8) · muso (8,12) · collo (8,15) · schiena (8,19)
     di lato     testa (23,7) · muso (27,11) · collo (21,13) · schiena (15,12)
     di spalle   testa (8,4) · collo (8,12) · schiena (8,16)

   **Le pose di lato guardano a destra** (`dati/atlante.js`), quindi lì
   la testa sta a destra: quando l'animale va a sinistra è lo *specchio*
   a portarla dall'altra parte, e chi disegna non deve fare nessun
   conto — l'addobbo sta dentro la stessa trasformazione dello sprite.

   **Di spalle il muso non c'è**, e non è una dimenticanza: un paio di
   occhialini visto da dietro non si vede, e disegnarlo sulla nuca
   sarebbe peggio che non disegnarlo. Un aggancio che quel verso non ha
   vuol dire «adesso non si vede». */
export const AGGANCI = {
  giu:  { testa: [0.50, 0.25],  muso: [0.50, 0.375], collo: [0.50, 0.48], schiena: [0.50, 0.59] },
  lato: { testa: [0.72, 0.22],  muso: [0.84, 0.34],  collo: [0.66, 0.41], schiena: [0.47, 0.38] },
  su:   { testa: [0.50, 0.125],                      collo: [0.50, 0.375], schiena: [0.50, 0.50] },
}

/* ── E IL PASSO ───────────────────────────────────────────────────
   Camminando la testa **si abbassa** su due fotogrammi su quattro: è
   misurato sul foglio (di fronte 1 pixel, di spalle 2, di lato niente —
   di lato il disegno resta incollato in alto e a muoversi sono le
   zampe). Senza questa riga il cappello resta fermo mentre il cane
   ondeggia sotto, ed è la cosa che fa sembrare un addobbo appiccicato
   sopra invece che indossato.

   In frazioni dell'altezza del riquadro, come gli agganci. */
export const BOB = {
  giu:  [0, 0.031, 0, 0.031],
  lato: [0, 0, 0, 0],
  su:   [0, 0.062, 0, 0.062],
}

/* Quali agganci ha questa bestia. Il ripiego è **tutti e quattro**, e
   una riga si scosta solo quando su quel punto lì non ci si può
   mettere niente (il pappagallo e la schiena). */
export const AGGANCI_TUTTI = ['testa', 'muso', 'collo', 'schiena']
export const portaDi = chi => (ANIMALI[chi] || {}).porta || AGGANCI_TUTTI

/* Il punto di un aggancio, verso per verso, già pronto per chi disegna.
   Torna `null` per un verso in cui quell'aggancio non si vede. */
export const puntiDi = (chi, dove) => {
  if (!portaDi(chi).includes(dove)) return null
  const agganci = (ANIMALI[chi] || {}).agganci || AGGANCI
  const punti = {}
  for (const verso of Object.keys(agganci))
    if (agganci[verso][dove]) punti[verso] = agganci[verso][dove]
  return Object.keys(punti).length ? punti : null
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
  /* Un aggancio dichiarato che nessun verso sa disegnare è un addobbo
     che si compra, si mette e non si vede da nessuna parte — cioè un
     acquisto che sembra non aver funzionato. */
  for (const verso of Object.keys(AGGANCI))
    if (!AGGANCI[verso].testa)
      g.push(`il verso «${verso}» non sa dove sta la testa`)
  for (const chi of Object.keys(ANIMALI)) {
    for (const dove of portaDi(chi)) {
      if (!AGGANCI_TUTTI.includes(dove))
        g.push(`${chi}: l'aggancio «${dove}» non esiste`)
      else if (!puntiDi(chi, dove))
        g.push(`${chi}: porta «${dove}» e nessun verso lo sa disegnare`)
    }
  }
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
