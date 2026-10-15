// La campagna: nove tappe in tre scalini. Ogni tappa parte da zero (campo
// vuoto, soli di partenza, le piante che dichiara): tarata una, è tarata, e
// una tappa nuova si aggiunge o si sposta senza toccare le altre. Le
// operazioni le portano le piante, quindi sono loro a dire quale conto si
// fa. Vedi docs/giardino/campagna.md.
import { PIANTE, guastiDellePiante } from './piante.js'
import { ZOMBI, guastiDegliZombi } from './zombi.js'
import { CAMPO, guastiDelleRegole } from './regole.js'

export const SCALINI = [
  { chiave: 'prato',    nome: 'Il prato',    icona: '🌱', dritta: 'Girasoli e tiratori: far soli e difendersi.' },
  { chiave: 'cortile',  nome: 'Il cortile',  icona: '🏡', dritta: 'Le noci tengono fermi, i doppi tiratori sparano forte.' },
  { chiave: 'cimitero', nome: 'Il cimitero', icona: '🪦', dritta: 'Il gelo rallenta, e in fondo c\'è il gigante.' },
]

const BASE = ['girasole', 'tiratore']
const CON_NOCE = [...BASE, 'noce']
const CON_DOPPIO = [...CON_NOCE, 'doppio']
const TUTTE = [...CON_DOPPIO, 'gelo']

/* `piante`: quali carte si hanno. `soli`: quanti si hanno all'inizio.
   `corsie`: quante delle cinque (le centrali) sono aperte.
   `zombi`: quanti, in quanti secondi (il primo arriva dopo 14) e quali tipi, in
   ordine di arrivo. `capo`: un gigante a due terzi. `portata` (0-100,
   docs/apprendimento/eta-e-portata.md): quanto è avanti chi la gioca. */
export const CAMPAGNA = [
  { chiave: 'aiuola', nome: 'La prima aiuola', scalino: 'prato', portata: 12,
    piante: BASE, soli: 150, corsie: 3, zombi: { n: 8, durata: 80, tipi: ['normale'] },
    racconto: 'Un girasole fa soli, il tiratore li spende bene.' },
  { chiave: 'vialetto', nome: 'Il vialetto', scalino: 'prato', portata: 16,
    piante: BASE, soli: 125, corsie: 4, zombi: { n: 12, durata: 95, tipi: ['normale'] },
    racconto: 'Una corsia in più da guardare.' },
  { chiave: 'cancello', nome: 'Il cancello', scalino: 'prato', portata: 20,
    piante: CON_NOCE, soli: 100, corsie: 5, zombi: { n: 14, durata: 100, tipi: ['normale', 'normale', 'cono'] },
    racconto: 'Arriva la noce, e col cono gli zombi durano il doppio.' },

  { chiave: 'pozzo', nome: 'Il pozzo', scalino: 'cortile', portata: 30,
    piante: CON_NOCE, soli: 100, corsie: 4, zombi: { n: 16, durata: 100, tipi: ['normale', 'cono'] },
    racconto: 'Il pozzo stringe il campo: meno corsie, più zombi.' },
  { chiave: 'legnaia', nome: 'La legnaia', scalino: 'cortile', portata: 34,
    piante: CON_DOPPIO, soli: 100, corsie: 5, zombi: { n: 20, durata: 110, tipi: ['normale', 'cono'] },
    racconto: 'Il doppio tiratore costa caro, ma spara due volte.' },
  { chiave: 'pollaio', nome: 'Il pollaio', scalino: 'cortile', portata: 38,
    piante: CON_DOPPIO, soli: 100, corsie: 5, zombi: { n: 24, durata: 115, tipi: ['normale', 'cono', 'veloce'] },
    racconto: 'Qualcuno corre: la noce serve davanti.' },

  { chiave: 'cipressi', nome: 'I cipressi', scalino: 'cimitero', portata: 45,
    piante: TUTTE, soli: 100, corsie: 5, zombi: { n: 24, durata: 115, tipi: ['normale', 'cono', 'veloce'] },
    racconto: 'Il gelo rallenta chi colpisce: ottimo contro i veloci.' },
  { chiave: 'lapidi', nome: 'Le lapidi', scalino: 'cimitero', portata: 50,
    piante: TUTTE, soli: 100, corsie: 5, zombi: { n: 30, durata: 125, tipi: ['normale', 'cono', 'veloce'] },
    racconto: 'Tanti, e tutti insieme.' },
  { chiave: 'cripta', nome: 'La cripta', scalino: 'cimitero', portata: 55,
    piante: TUTTE, soli: 100, corsie: 5, capo: true, zombi: { n: 30, durata: 130, tipi: ['normale', 'cono', 'veloce'] },
    racconto: 'Il gigante è lento, ma una noce non lo ferma a lungo.' },
]

export const QUANTE_TAPPE = CAMPAGNA.length

export const tappeDelloScalino = chiave =>
  CAMPAGNA.map((t, indice) => ({ ...t, indice })).filter(t => t.scalino === chiave)
export const scalinoDi = tappa => SCALINI.find(s => s.chiave === tappa.scalino)

// le corsie aperte: le centrali, `corsie` di cinque
export function corsieDi(tappa) {
  const da = Math.floor((CAMPO.colonne - tappa.corsie) / 2)
  return Array.from({ length: tappa.corsie }, (_, i) => da + i)
}

// i conti che la tappa chiede, nell'ordine in cui compaiono
export const operazioniDi = tappa =>
  [...new Set(tappa.piante.map(id => PIANTE[id].op))]

// cosa riceve il motore: la tappa, già pronta da giocare
export const sfidaDi = tappa => ({
  chiave: tappa.chiave, piante: tappa.piante, soli: tappa.soli, corsie: corsieDi(tappa),
  zombi: tappa.zombi, capo: !!tappa.capo,
})

// tre stelle se nessun carretto è partito, due con uno, una con di più
export const stellePer = ({ vinto, carretti = 0 }) => !vinto ? 0 : carretti === 0 ? 3 : carretti === 1 ? 2 : 1

export function guastiDellaCampagna() {
  const g = [...guastiDelleRegole(), ...guastiDellePiante(), ...guastiDegliZombi()]
  const viste = new Set()
  let prima = -1
  for (const t of CAMPAGNA) {
    if (viste.has(t.chiave)) g.push(`${t.chiave}: chiave doppia`)
    viste.add(t.chiave)
    if (!SCALINI.some(s => s.chiave === t.scalino)) g.push(`${t.chiave}: scalino «${t.scalino}» inesistente`)
    if (!(t.portata > prima)) g.push(`${t.chiave}: la portata deve salire (${t.portata} dopo ${prima})`)
    prima = t.portata
    for (const id of t.piante) if (!PIANTE[id]) g.push(`${t.chiave}: pianta «${id}» inesistente`)
    for (const id of t.zombi.tipi) if (!ZOMBI[id]) g.push(`${t.chiave}: zombi «${id}» inesistente`)
    if (!(t.corsie >= 1 && t.corsie <= CAMPO.colonne)) g.push(`${t.chiave}: corsie fuori dal campo`)
    if (!t.piante.includes('girasole')) g.push(`${t.chiave}: senza girasole i soli non arrivano`)
    if (!(t.zombi.n > 0 && t.zombi.durata > 14)) g.push(`${t.chiave}: zombi o durata impossibili`)
    if (!(t.soli >= 0)) g.push(`${t.chiave}: soli di partenza negativi`)
  }
  return g
}
