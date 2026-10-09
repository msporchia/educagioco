/* Le due strade, una per protagonista: quella del coniglio e quella del
   cane, ricavate dai dati (una tappa con le pecore è del cane). Ognuna va
   avanti da sola; le stelle restano sotto l'indice della campagna: qui si
   decide solo chi viene dopo chi e cosa apre cosa. Puro, gira in Node.
   Vedi «Le due strade» in docs/passo-passo/livelli.md. */
import { CAMPAGNA, SCALINI, delCane } from '../dati/campagna.js'

export { delCane }

/* Le isole delle due strade: per ogni scalino quella del coniglio (la
   chiave è lo scalino) e quella del cane (`<scalino>-cane`). Dove stanno
   sul fondale lo dice il foglietto della valle (scena/valle.js), non qui:
   le due strade possono passare sulla stessa isola dipinta, ognuna con le
   sue caselle. */
export function disegnaStrade(campagna = CAMPAGNA, scalini = SCALINI) {
  const animale = campagna.map(t => (delCane(t) ? 'cane' : 'coniglio'))
  const coniglio = animale.map((a, i) => i).filter(i => animale[i] === 'coniglio')

  const perScalino = new Map(scalini.map(s => [s.chiave, { coniglio: [], cane: [] }]))
  campagna.forEach((t, i) => perScalino.get(t.scalino)?.[animale[i]].push(i))
  const conigli = [], rami = []
  for (const s of scalini) {
    const { coniglio: c, cane: d } = perScalino.get(s.chiave)
    if (c.length) conigli.push({ chiave: s.chiave, scalino: s.chiave, animale: 'coniglio', tappe: c })
    if (d.length) rami.push({ chiave: `${s.chiave}-cane`, scalino: s.chiave, animale: 'cane', tappe: d })
  }
  /* la strada del cane va di isola in isola, nell'ordine degli scalini: una
     tappa aggiunta in coda alla campagna viene dopo quelle della sua isola */
  const cane = rami.flatMap(r => r.tappe)
  const isole = [...conigli, ...rami]

  const isolaDi = []
  isole.forEach((s, k) => s.tappe.forEach(i => { isolaDi[i] = k }))
  // chi viene prima sulla propria strada
  const prima = [], dopo = []
  for (const strada of [coniglio, cane])
    strada.forEach((i, k) => { prima[i] = k ? strada[k - 1] : null; dopo[i] = strada[k + 1] ?? null })
  /* il numero sulla casella: il posto sulla sua strada, da 1 */
  const numero = []
  for (const strada of [coniglio, cane]) strada.forEach((i, k) => { numero[i] = k + 1 })
  // la strada del cane comincia quando il coniglio arriva qui (la fine dei piccoli)
  const apreIlCane = cane.length ? (coniglio.filter(i => i < cane[0]).at(-1) ?? null) : null
  return { animale, coniglio, cane, isole, isolaDi, prima, dopo, numero, apreIlCane, quante: campagna.length }
}

export const STRADE = disegnaStrade()

/* Cosa apre una tappa. `fatta` dice se è vinta (o ereditata), `daFuori`
   se l'età o i grandi la aprono comunque, `perEta` se l'età la chiude
   comunque (vince su tutto, come in data/portata-giochi.js); `eredita` è
   il cursore di prima delle due strade: quello che era aperto resta
   aperto.
   - su ogni strada: fatta la tappa prima;
   - la prima del coniglio è aperta sempre, la prima del cane quando il
     coniglio ha fatto `apreIlCane`;
   - e una tappa fatta resta aperta. */
export function aperture(S, { fatta, daFuori = () => false, perEta = () => false, eredita = 0 }) {
  const caneAperto = () => S.apreIlCane === null || fatta(S.apreIlCane)
  const perStrada = i => {
    const p = S.prima[i]
    if (p !== null) return fatta(p)
    return S.animale[i] === 'coniglio' || caneAperto()
  }
  const aperta = i => {
    if (!(i >= 0 && i < S.quante)) return false
    if (perEta(i)) return false
    // una tappa già fatta resta aperta anche se le si mette davanti una tappa nuova
    return daFuori(i) || i <= eredita || fatta(i) || perStrada(i)
  }
  return { aperta, caneAperto, perStrada }
}

/* La frase del fumetto su una tappa chiusa: chi tocca prima sulla stessa
   strada, e per la prima del cane quando comincia. `campagna` dà i nomi. */
export function cosaManca(S, i, { fatta, aperta, perEta = () => false }, campagna = CAMPAGNA) {
  if (perEta(i)) return 'Questa tappa per ora è chiusa.'
  // la prima non fatta della sua strada, andando indietro
  let k = i, altre = 0
  while (S.prima[k] !== null && !fatta(S.prima[k])) { k = S.prima[k]; altre++ }
  if (k !== i && aperta(k)) return `Prima tocca a «${campagna[k].nome}»` +
    (altre === 2 ? ', poi a un\'altra tappa.' : altre > 2 ? `, poi ad altre ${altre - 1} tappe.` : '.')
  if (S.animale[k] === 'cane' && S.prima[k] === null && S.apreIlCane !== null)
    return `Il cane comincia quando il coniglio finisce «${campagna[S.apreIlCane].nome}».`
  return 'Questa tappa per ora è chiusa.'
}

// chi viene dopo `i` sulla sua strada, aperta o no; null in fondo
export const seguente = (S, i) => S.dopo[i]

// la tappa del ▶ a fine partita: la seguente, se è aperta
export function prossima(S, i, aperta) {
  const s = seguente(S, i)
  return s !== null && aperta(s) ? s : null
}

/* La tappa di adesso, dove sta il segnalino: l'ultima giocata se non è
   ancora vinta; se no si va avanti da lei come col ▶ fino a una aperta e
   non fatta; senza un'ultima (un profilo di prima), il cursore di prima;
   se no la prima libera del coniglio, poi del cane. Con `strada` solo su
   quella (la mappa di un protagonista). `null` se non resta niente da fare. */
export function tappaDiAdesso(S, { ultima = null, cursore = 0, aperta, fatta, strada = null }) {
  const sua = i => strada === null || S.animale[i] === strada
  const libera = i => Number.isInteger(i) && i >= 0 && i < S.quante && sua(i) && aperta(i) && !fatta(i)
  if (Number.isInteger(ultima) && ultima >= 0 && ultima < S.quante && sua(ultima)) {
    if (libera(ultima)) return ultima
    const viste = new Set()
    for (let k = prossima(S, ultima, aperta); k !== null && !viste.has(k); k = prossima(S, k, aperta)) {
      if (libera(k)) return k
      viste.add(k)
    }
  }
  if (libera(cursore)) return cursore
  if (strada !== null) return S[strada].find(libera) ?? null
  return S.coniglio.find(libera) ?? S.cane.find(libera) ?? null
}

/* Il cursore di prima delle due strade, come lo legge chi non ha ancora
   aperto il gioco (la home): finché Gioco.vue non lo scrive, è la tappa. */
export const ereditaDi = av => {
  const e = av && av.cfg && av.cfg.eredita
  return typeof e === 'number' ? e : ((av && av.tappa) || 0)
}

/* Le stesse cose lette da un avanzamento, senza l'età (la riga della
   home, i test): fatta = vinta o ereditata. */
export function stradeDi(av, S = STRADE, extra = {}) {
  const eredita = ereditaDi(av)
  const stelle = (av && av.stelle) || {}
  const fatta = i => (stelle[i] || 0) > 0 || i < eredita
  const { aperta } = aperture(S, { fatta, eredita, ...extra })
  const ultima = av && av.cfg && Number.isInteger(av.cfg.ultima) ? av.cfg.ultima : null
  return { fatta, aperta, adesso: () => tappaDiAdesso(S, { ultima, cursore: (av && av.tappa) || 0, aperta, fatta }) }
}
