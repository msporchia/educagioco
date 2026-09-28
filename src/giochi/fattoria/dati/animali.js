/* Le bestie che si possono comprare: incrociate con BESTIE dell'atlante (si vende solo quello che si
   sa disegnare); si prendono e si spostano come un oggetto, e dove stanno si salva — vedi docs/fattoria/animali.md. */
import { BESTIE, AGGANCI as AGGANCI_DEL_FOGLIO } from './atlante.js'
import { cibiPer } from './bisogni.js'

// nome dello sprite → come si presenta, prezzo, liv; prezzi alti apposta (si desidera per giorni).
export const ANIMALI = {
  'cane-bobtail': { nome: 'Bobtail', emoji: '🐕', prezzo: 90, liv: 3 },
  'cane-beagle':  { nome: 'Beagle',  emoji: '🐶', prezzo: 90, liv: 15 },
  'gatto-tuxedo': { nome: 'Gatto bianco e nero', emoji: '🐈', prezzo: 75, liv: 10 },
  'gatto-nero':   { nome: 'Gatto nero',   emoji: '🐈‍⬛', prezzo: 75, liv: 19 },
  'gatto-giallo': { nome: 'Gatto rosso',  emoji: '🐈', prezzo: 75, liv: 35 },
  // Il coniglio: il nome dello sprite è anche la famiglia, finché ce n'è uno solo.
  coniglio:       { nome: 'Coniglio',     emoji: '🐰', prezzo: 85, liv: 12 },
  // Il pappagallo non porta niente sulla schiena: ha le ali (porta esiste per questo).
  pappagallo:     { nome: 'Pappagallo',   emoji: '🦜', prezzo: 120, liv: 49,
                    porta: ['testa', 'muso', 'collo'] },
}

// Esperienza, mai monete: un quindicesimo del prezzo (sotto l'ordine più piccolo del mercato) — vedi docs/fattoria/animali.md.
export const QUOTA_BENESSERE = 1 / 15
const PREZZO_MINIMO = Math.min(...Object.values(ANIMALI).map(a => a.prezzo))
export const premioBenessere = chi =>
  Math.max(1, Math.round(((ANIMALI[chi] || {}).prezzo || PREZZO_MINIMO) * QUOTA_BENESSERE))

// Dove sta la testa dentro lo sprite (frazioni del riquadro, non pixel), per verso: il foglietto della
// bestia vince (agganci in strumenti/sprite/…), questa tabella è solo il ripiego — vedi docs/fattoria/animali.md.
export const AGGANCI = {
  giu:  { testa: [0.50, 0.25],  muso: [0.50, 0.375], collo: [0.50, 0.48], schiena: [0.50, 0.59] },
  lato: { testa: [0.72, 0.22],  muso: [0.84, 0.34],  collo: [0.66, 0.41], schiena: [0.47, 0.38] },
  su:   { testa: [0.50, 0.125],                      collo: [0.50, 0.375], schiena: [0.50, 0.50] },
}

// Quanto la testa si abbassa camminando (misurato sul foglio): senza, il cappello resta fermo mentre il cane ondeggia.
export const BOB = {
  giu:  [0, 0.031, 0, 0.031],
  lato: [0, 0, 0, 0],
  su:   [0, 0.062, 0, 0.062],
}

// Il ripiego è tutti e quattro; una riga si scosta solo dove non ci si può mettere niente (il pappagallo).
export const AGGANCI_TUTTI = ['testa', 'muso', 'collo', 'schiena']
export const portaDi = chi => (ANIMALI[chi] || {}).porta || AGGANCI_TUTTI

// Precedenza: il foglietto dello sprite, poi la scheda, poi il ripiego comune.
export const agganciDi = chi => {
  if (AGGANCI_DEL_FOGLIO[chi]) return { agganci: AGGANCI_DEL_FOGLIO[chi], daDove: 'foglietto' }
  if ((ANIMALI[chi] || {}).agganci) return { agganci: ANIMALI[chi].agganci, daDove: 'scheda' }
  return { agganci: AGGANCI, daDove: 'ripiego' }
}

// Il punto di un aggancio, verso per verso; null dove quell'aggancio non si vede.
export const puntiDi = (chi, dove) => {
  if (!portaDi(chi).includes(dove)) return null
  const { agganci } = agganciDi(chi)
  const punti = {}
  for (const verso of Object.keys(agganci))
    if (agganci[verso][dove]) punti[verso] = agganci[verso][dove]
  return Object.keys(punti).length ? punti : null
}

// Quelli davvero comprabili oggi: dichiarati e disegnabili, ricavato e non scritto.
export const IN_VENDITA = BESTIE
  .filter(n => ANIMALI[n])
  .map(n => ({ chi: n, ...ANIMALI[n] }))

// I nomi da toccare (non da scrivere): un bambino di quattro anni non sa scrivere, e una casella vuota è un muro.
export const NOMI = {
  cane: ['Watson', 'Birba', 'Fiocco', 'Pepe', 'Nuvola', 'Biscotto',
         'Rocky', 'Luna', 'Ciccio', 'Zorro'],
  gatto: ['Micio', 'Ombra', 'Zenzero', 'Perla', 'Briciola', 'Pallino',
          'Neve', 'Tigro', 'Mimì', 'Fumo'],
  pappagallo: ['Coco', 'Arcobaleno', 'Kiwi', 'Cielo', 'Rio', 'Sole'],
  coniglio: ['Batuffolo', 'Carota', 'Saltino', 'Nuvola', 'Pallina', 'Trottola',
             'Cannella', 'Zucchero'],
}

// La famiglia si ricava dal nome dello sprite (cane-beagle è un cane), la stessa chiave di bisogni.js.
export const famigliaDi = chi => String(chi).split('-')[0]

// Chi non ha una famiglia sua prende i nomi di tutti.
export function nomiPer(chi) {
  return NOMI[famigliaDi(chi)] || [...new Set(Object.values(NOMI).flat())]
}

export const siDisegna = chi => BESTIE.includes(chi)
export const animale = chi => ANIMALI[chi] || null

export function guastiDegliAnimali() {
  const g = []
  // Un aggancio dichiarato che nessun verso sa disegnare è un addobbo che non si vede da nessuna parte.
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
    if (!(premioBenessere(chi) >= 1))
      g.push(`${chi}: rimessa a posto non pagherebbe niente`)
    // non è un guasto: è il promemoria che una riga sta aspettando lo sprite
    if (!BESTIE.includes(chi)) g.push(`nota: ${chi} è dichiarato e non ancora disegnabile`)
    // Una bestia disegnabile col ripiego porta il cappello quasi certamente storto.
    else if (agganciDi(chi).daDove === 'ripiego')
      g.push(`${chi}: gli agganci degli addobbi non sono nel foglietto (va col ripiego)`)
    // Una bestia senza cibi suoi è una bestia che non si può nutrire.
    if (cibiPer(famigliaDi(chi)).length < 2)
      g.push(`${chi}: la famiglia «${famigliaDi(chi)}» ha meno di due cibi suoi`)
  }
  if (!IN_VENDITA.length) g.push('nessuna bestia in vendita: il negozio sarebbe vuoto')
  return g
}
