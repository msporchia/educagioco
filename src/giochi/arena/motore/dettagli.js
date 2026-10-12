// Cosa dice la schermata dei dettagli: per ogni cosa che si può costruire o
// potenziare, come sta adesso e come starebbe al livello dopo, con numeri che un
// bambino può confrontare («una squadra ogni 9 secondi → ogni 8»). Gira in Node,
// non sa che esista uno schermo: restituisce righe `{ nome, ora, dopo }` e chi la
// mostra decide come. Tutto viene da `dati/regole.js`, niente numeri qui.
import { TRUPPE, CRESCITA, CASTELLO, AZIONI, LIV_MAX, MINIERA_MAX, RIPARA, MURO, GIOCATORE } from '../dati/regole.js'

const secondi = n => `${(Math.round(n * 10) / 10).toString().replace('.', ',')} s`
const num = n => String(Math.round(n))
const dec = n => (Math.round(n * 10) / 10).toString().replace('.', ',')

/* Chi colpisce una truppa, in parole. */
export function ruoloDi(id) {
  const k = TRUPPE[id]
  const colpisce = k.bers === 'torri' ? 'solo le costruzioni (ignora le truppe)'
    : k.bers === 'terra' ? 'chi cammina (non chi vola)' : 'chi cammina e chi vola'
  const dove = k.gitt <= 20 ? 'da vicino' : 'da lontano'
  return [
    `colpisce ${colpisce}, ${dove}`,
    k.vola ? 'vola: scavalca i muri' : 'cammina: si ferma ai muri',
    k.splash ? 'il suo colpo scoppia: ferisce anche chi sta intorno' : 'colpisce un bersaglio per volta',
    k.n > 1 ? `arriva in ${k.n} per squadra` : 'arriva da sola',
  ]
}

/* Una truppa al livello `liv` (1..10): numeri semplici per i bambini. */
export function numeriTruppa(id, liv) {
  const k = TRUPPE[id]
  const f = CRESCITA.forza(liv)
  return {
    squadra: CRESCITA.squadraOgni(liv),
    vita: k.hp * f,
    danno: k.dmg * f,
    colpi: 1 / k.rate,
    vitaCaserma: CRESCITA.vitaCaserma(liv),
  }
}

/* Le righe «ora → dopo» di una caserma. `liv` 0 = ancora da costruire (si mostra solo il livello 1). */
export function dettaglioTruppa(id, liv) {
  const ora = numeriTruppa(id, Math.max(1, liv))
  const costruita = liv >= 1
  const fine = liv >= LIV_MAX
  const dopo = costruita && !fine ? numeriTruppa(id, liv + 1) : null
  const riga = (nome, v, d, fmt) => ({ nome, ora: fmt(v), dopo: d === null ? null : fmt(d) })
  return {
    livello: liv,
    prezzo: costruita ? (fine ? null : CRESCITA.salita(liv)) : TRUPPE[id].costo,
    righe: [
      riga('Una squadra ogni', ora.squadra, dopo && dopo.squadra, secondi),
      riga('Vita di ogni truppa', ora.vita, dopo && dopo.vita, num),
      riga('Danno di ogni colpo', ora.danno, dopo && dopo.danno, num),
      riga('Vita della caserma', ora.vitaCaserma, dopo && dopo.vitaCaserma, num),
    ],
  }
}

/* Le righe di una scelta che non è una truppa. `stato` porta i livelli di adesso. */
export function dettaglioAzione(azione, { miniera = 1, castello = 1 } = {}) {
  if (azione === 'miniera') {
    const fine = miniera >= MINIERA_MAX
    const r = l => CRESCITA.miniera.resa(l)
    const base = GIOCATORE.moneteAlSecondo
    return {
      livello: miniera,
      prezzo: fine ? null : CRESCITA.miniera.prezzo[miniera],
      righe: [{ nome: 'Monete al secondo', ora: dec(r(miniera) * base), dopo: fine ? null : dec(r(miniera + 1) * base) },
              { nome: 'Rende', ora: `×${dec(r(miniera))}`, dopo: fine ? null : `×${dec(r(miniera + 1))}` }],
    }
  }
  if (azione === 'castello') {
    const fine = castello >= LIV_MAX
    const c = CRESCITA.castello
    const dmg = l => CASTELLO.dmg * c.danno(l)
    const colpi = l => c.cadenza(l) / CASTELLO.rate
    return {
      livello: castello,
      prezzo: fine ? null : c.prezzo(castello),
      righe: [
        { nome: 'Danno di ogni colpo', ora: num(dmg(castello)), dopo: fine ? null : num(dmg(castello + 1)) },
        { nome: 'Colpi al secondo', ora: dec(colpi(castello)), dopo: fine ? null : dec(colpi(castello + 1)) },
        { nome: 'Fin dove arriva', ora: num(CASTELLO.gitt + c.gittata(castello)), dopo: fine ? null : num(CASTELLO.gitt + c.gittata(castello + 1)) },
        { nome: 'Vita del castello', ora: num(CASTELLO.hp + c.vita * (castello - 1)), dopo: fine ? null : num(CASTELLO.hp + c.vita * castello) },
      ],
    }
  }
  // ripara: non ha livelli
  return {
    livello: 0,
    prezzo: AZIONI.ripara.prezzo,
    righe: [{ nome: 'Rimette in sesto', ora: `${Math.round(RIPARA * 100)}% della vita`, dopo: null },
            { nome: 'Il muro crollato', ora: `torna in piedi con ${num(MURO.hp * RIPARA)} di vita`, dopo: null }],
  }
}

/* Il testo che spiega cosa cambia salendo. */
export function cosaCambia(id) {
  return `Ogni livello: la caserma manda una squadra più spesso (−${Math.round((1 - 1 / 1.12) * 100)}% circa di attesa) e le sue truppe sono più forti (+25% di vita e di danno rispetto al livello 1). Costa sempre di più.`
}

export function guastiDeiDettagli() {
  const g = []
  for (const id of Object.keys(TRUPPE)) {
    for (const liv of [0, 1, 5, LIV_MAX]) {
      const d = dettaglioTruppa(id, liv)
      if (!d.righe.length || d.righe.some(r => !r.nome || r.ora === undefined)) g.push(`${id} liv ${liv}: righe storte`)
      if (liv >= 1 && liv < LIV_MAX && d.righe.some(r => r.dopo === null)) g.push(`${id} liv ${liv}: manca il «dopo»`)
    }
    if (ruoloDi(id).length < 4) g.push(`${id}: ruolo incompleto`)
  }
  return g
}
