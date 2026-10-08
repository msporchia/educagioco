/* Le due strade della mappa: la strada maestra del coniglio e i rami del
   cane, ricavati dai dati (una tappa con le pecore è del cane). Le stelle
   restano sotto l'indice della campagna: qui si decide solo chi viene
   dopo chi e cosa apre cosa. Puro, gira in Node.
   Vedi «Le due strade» in docs/passo-passo/livelli.md. */
import { CAMPAGNA, SCALINI, delCane } from '../dati/campagna.js'

export { delCane }

/* Le isole nell'ordine della mappa: per ogni scalino quella del coniglio,
   e subito dopo il ramo del cane che parte da lei. Il ramo ha il suo
   `attacco`, la tappa del coniglio da cui si apre la tana: la prima dello
   stesso scalino (quella che insegna la carta), o se lo scalino è tutto
   del cane l'ultima del coniglio prima di lui (la fine dei massi). */
export function disegnaStrade(campagna = CAMPAGNA, scalini = SCALINI) {
  const animale = campagna.map(t => (delCane(t) ? 'cane' : 'coniglio'))
  const coniglio = animale.map((a, i) => i).filter(i => animale[i] === 'coniglio')

  const perScalino = new Map(scalini.map(s => [s.chiave, { coniglio: [], cane: [] }]))
  campagna.forEach((t, i) => perScalino.get(t.scalino)?.[animale[i]].push(i))
  const conigli = [], rami = []
  for (const s of scalini) {
    const { coniglio: c, cane: d } = perScalino.get(s.chiave)
    if (c.length) conigli.push({ chiave: s.chiave, scalino: s.chiave, animale: 'coniglio', tappe: c })
    if (d.length) {
      const attacco = c.length ? c[0] : (coniglio.filter(i => i < d[0]).at(-1) ?? null)
      rami.push({ chiave: `${s.chiave}-cane`, scalino: s.chiave, animale: 'cane', tappe: d, attacco,
                  carta: c.length && attacco !== null })
    }
  }
  /* la strada del cane va di isola in isola: una tappa aggiunta in coda
     alla campagna viene dopo quelle della sua isola, non dopo tutte */
  const cane = rami.flatMap(r => r.tappe)
  // un ramo sta subito dopo l'isola della sua tana; senza tana, in cima
  const isole = []
  for (const r of rami.filter(r => r.attacco === null)) isole.push(r)
  for (const isola of conigli) {
    isole.push(isola)
    for (const r of rami) if (r.attacco !== null && isola.tappe.includes(r.attacco)) isole.push({ ...r, da: isola.chiave })
  }

  const isolaDi = []
  isole.forEach((s, k) => s.tappe.forEach(i => { isolaDi[i] = k }))
  // chi viene prima sulla propria strada
  const prima = [], dopo = []
  for (const strada of [coniglio, cane])
    strada.forEach((i, k) => { prima[i] = k ? strada[k - 1] : null; dopo[i] = strada[k + 1] ?? null })
  return { animale, coniglio, cane, isole, isolaDi, prima, dopo, quante: campagna.length }
}

export const STRADE = disegnaStrade()

const isolaDella = (S, i) => S.isole[S.isolaDi[i]]

/* Cosa apre una tappa. `fatta` dice se è vinta (o ereditata), `daFuori`
   se l'età o i grandi la aprono comunque, `perEta` se l'età la chiude
   comunque (vince su tutto, come in data/portata-giochi.js); `eredita` è
   il cursore di prima delle due strade: quello che era aperto resta
   aperto.
   - il coniglio: fatta la tappa del coniglio prima;
   - il cane: fatta la tappa del cane prima, e fatta la tappa del
     coniglio da cui si apre la sua tana;
   - e una tappa fatta resta aperta. */
export function aperture(S, { fatta, daFuori = () => false, perEta = () => false, eredita = 0 }) {
  const tanaAperta = i => {
    const a = (isolaDella(S, i) || {}).attacco
    return a === null || a === undefined || fatta(a)
  }
  const perStrada = i => {
    const p = S.prima[i]
    if (p !== null && !fatta(p)) return false
    return S.animale[i] === 'coniglio' || tanaAperta(i)
  }
  const aperta = i => {
    if (!(i >= 0 && i < S.quante)) return false
    if (perEta(i)) return false
    // una tappa già fatta resta aperta anche se le si mette davanti una tappa nuova
    return daFuori(i) || i <= eredita || fatta(i) || perStrada(i)
  }
  return { aperta, tanaAperta, perStrada }
}

/* La frase del fumetto su una tappa chiusa: chi tocca prima sulla stessa
   strada, e per il cane quando si apre la tana. `nome(i)` e `scalino(chiave)`
   vengono dalla campagna. */
export function cosaManca(S, i, { fatta, aperta, perEta = () => false }, campagna = CAMPAGNA, scalini = SCALINI) {
  if (perEta(i)) return 'Questa tappa per ora è chiusa.'
  const parti = []
  const tana = isola => {
    const a = campagna[isola.attacco]
    const s = scalini.find(x => x.chiave === a.scalino) || {}
    if (!isola.carta) return `si apre quando il coniglio finisce «${s.nome}»`
    // la carta si impara nel primo scalino che la porta; dopo ci si arriva e basta
    const nuova = s.carta && scalini.find(x => x.carta === s.carta) === s
    return `si apre quando il coniglio ${nuova ? 'impara' : 'arriva a'} ${s.icona} («${a.nome}»)`
  }
  const tanaChiusa = j => S.animale[j] === 'cane' && isolaDella(S, j).attacco !== null &&
    !fatta(isolaDella(S, j).attacco)
  // la prima non fatta della sua strada, andando indietro
  let k = i, altre = 0
  while (S.prima[k] !== null && !fatta(S.prima[k])) { k = S.prima[k]; altre++ }
  if (k !== i && aperta(k)) parti.push(`prima tocca a «${campagna[k].nome}»` +
    (altre === 2 ? ', poi a un\'altra tappa' : altre > 2 ? `, poi ad altre ${altre - 1} tappe` : ''))
  else if (k !== i && tanaChiusa(k)) parti.push(`prima tocca a «${campagna[k].nome}», che ${tana(isolaDella(S, k))}`)
  if (tanaChiusa(i) && !(k !== i && isolaDella(S, k) === isolaDella(S, i))) parti.push(tana(isolaDella(S, i)))
  if (!parti.length) return 'Questa tappa per ora è chiusa.'
  const frase = parti.join('; e ')
  return frase[0].toUpperCase() + frase.slice(1) + '.'
}

/* Chi viene dopo `i` sulla sua strada, aperta o no: il coniglio va avanti
   sulla strada maestra; il cane va avanti nella sua isola, e finita
   l'isola torna sulla strada maestra, alla tappa dopo la tana. */
export function seguente(S, i) {
  if (S.animale[i] === 'coniglio') return S.dopo[i]
  const isola = isolaDella(S, i)
  const k = isola.tappe.indexOf(i)
  if (k + 1 < isola.tappe.length) return isola.tappe[k + 1]
  return isola.attacco === null ? (S.coniglio[0] ?? null) : S.dopo[isola.attacco]
}

/* La tappa del ▶ a fine partita: la seguente se è aperta. Al bivio, se
   la strada maestra è chiusa (per l'età) e il ramo del cane no, il ramo. */
export function prossima(S, i, aperta) {
  const s = seguente(S, i)
  if (s !== null && aperta(s)) return s
  if (S.animale[i] === 'coniglio') {
    const ramo = S.isole.find(r => r.animale === 'cane' && r.attacco === i)
    if (ramo && aperta(ramo.tappe[0])) return ramo.tappe[0]
  }
  return null
}

/* La tappa di adesso, dove sta il segnalino: l'ultima giocata se non è
   ancora vinta; se no si va avanti da lei come col ▶ fino a una aperta e
   non fatta; senza un'ultima (un profilo di prima), il cursore di prima;
   se no la prima libera della strada maestra, poi del cane. `null` se
   non resta niente da fare. */
export function tappaDiAdesso(S, { ultima = null, cursore = 0, aperta, fatta }) {
  const libera = i => Number.isInteger(i) && i >= 0 && i < S.quante && aperta(i) && !fatta(i)
  if (Number.isInteger(ultima) && ultima >= 0 && ultima < S.quante) {
    if (libera(ultima)) return ultima
    const viste = new Set()
    for (let k = prossima(S, ultima, aperta); k !== null && !viste.has(k); k = prossima(S, k, aperta)) {
      if (libera(k)) return k
      viste.add(k)
    }
  }
  if (libera(cursore)) return cursore
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
