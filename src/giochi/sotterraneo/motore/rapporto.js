// Il rapporto della taratura (docs/sotterraneo/giocatori-tipo.md): dalle storie giocate (motore/storie.js) alle misure per giocatore tipo e
// discesa, i bersagli (dati/giocatori-tipo.js) con ✅/❌, e per ogni scostamento il perché. Funzioni pure sui dati: le chiama lo strumento
// (strumenti/sotterraneo-taratura.mjs) e le prova un'unità. Gira in Node.
import { GIOCATORI_TIPO, NOMI_TIPO, MOSTRI_DEL_GROSSO, DI_MOLTO, CODA } from '../dati/giocatori-tipo.js'
import { CAMPAGNA } from '../dati/campagna.js'
import { COSE, baseDi } from '../dati/cose.js'
import { NODI } from '../dati/abilita.js'
import { MOSTRI } from '../dati/mostri.js'
import { livelloAtteso, robaAttesa } from './storia.js'

const media = v => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null)
const mediana = v => { if (!v.length) return null; const s = [...v].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }
const perc = v => (v == null ? '  - ' : `${Math.round(v * 100)}%`)
const nome = k => (COSE[k] ? COSE[k].nome : k)
const nomeMostro = t => (MOSTRI[t] ? MOSTRI[t].nome : t)

/* ═══════════ dalle storie alle partite ═══════════
   Una «partita» è la prima volta che un giocatore tipo scende in una discesa: chi e dove (eroe, seme, discesa k), com'è entrato, cosa è successo. */
export function partite(passi) {
  const per = {}   // per[tipo][k] = [partita]
  const aggiungi = (tipo, k, p) => { ((per[tipo] = per[tipo] || {})[k] = (per[tipo] || {})[k] || []).push(p) }
  for (const s of passi) {
    if (s.k >= CAMPAGNA.length) continue
    const attesa = livelloAtteso(s.k)
    const base = { eroe: s.eroe, seme: s.seme, k: s.k, ing: s.ingresso, scarto: s.ingresso.forza - attesa,
                   potere: s.ingresso.forza * 1000 + s.ingresso.att + 2 * s.ingresso.dif + s.ingresso.vita / 100 }
    aggiungi(s.tipo, s.k, { ...base, rec: s.tentativi[0], tent: s.tentativi })
    for (const [t, regs] of Object.entries(s.sonde || {})) if (regs.length) aggiungi(t, s.k, { ...base, rec: regs[0], tent: regs })
  }
  const rifatte = {}   // rifatte[k] = [registro]
  for (const s of passi) if (s.tipo === 'curioso') for (const [j, r] of Object.entries(s.rifatte || {})) (rifatte[j] = rifatte[j] || []).push({ eroe: s.eroe, seme: s.seme, rec: r })
  // le storie finite: tutte le sette discese vinte, ognuna in al più TENTATIVI giri
  const storie = {}
  for (const s of passi) if (s.k < CAMPAGNA.length && s.tipo === 'curioso') {
    const c = `${s.eroe}|${s.seme}`
    storie[c] = (storie[c] === undefined ? true : storie[c]) && s.tentativi.some(t => t.v)
  }
  const tutte = Object.values(storie)
  return { per, rifatte, finite: tutte.length ? tutte.filter(Boolean).length / tutte.length : null }
}

/* ═══════════ le misure ═══════════ */
const grosso = c => c.n >= MOSTRI_DEL_GROSSO || c.g
// uno scontro pesante: il grosso (3+ mostri o il grosso) o un caporale in campo (docs/sotterraneo/giocatori-tipo.md, «Quanto chiede un mostro»)
export const pesante = c => grosso(c) || c.cap > 0
// i colpi che ha chiesto ogni mostro caduto, per ruolo (0 di strada, 1 caporale, 2 grosso)
const colpiDi = (sc, ruolo) => sc.flatMap(c => (c.mc || []).filter(m => m[0] === ruolo).map(m => m[1]))
// le cure raccolte in una discesa, tutte le provenienze insieme
export const cureRaccolte = rec => Object.values(rec.ct || {}).reduce((a, b) => a + b, 0)
const scontriDi = P => P.flatMap(p => p.rec.sc.map(c => ({ c, p })))

// le misure di un gruppo di partite
export function misure(P) {
  const sc = scontriDi(P).map(x => x.c)
  const gr = sc.filter(grosso)
  const sopra = sc.filter(c => c.vf >= 0.9)
  return { n: P.length, scontri: sc.length, grossi: gr.length,
    vinte: media(P.map(p => p.rec.v)), svenuto: media(P.map(p => (p.rec.sv > 0 ? 1 : 0))), sv: media(P.map(p => p.rec.sv)),
    pozioni: media(P.map(p => p.rec.pz)), domande: media(P.map(p => p.rec.dom)), mostri: media(P.map(p => p.rec.mo)),
    vitaGrosso: gr.length ? media(gr.map(c => c.vf)) : null, vitaScontri: sc.length ? media(sc.map(c => c.vf)) : null,
    sopra90: sc.length ? sopra.length / sc.length : null,
    colpiStrada: media(colpiDi(sc, 0)), colpiCaporale: media(colpiDi(sc, 1)), colpiGrosso: media(colpiDi(sc, 2)),
    persaNormale: media(sc.filter(c => !pesante(c)).map(c => c.pe)), persaPesante: media(sc.filter(pesante).map(c => c.pe)),
    cureTrovate: media(P.map(p => cureRaccolte(p.rec))), tetto: media(P.map(p => p.rec.tc || 0)),
    muri: media(P.map(p => (p.tent.filter(t => !t.v).length >= 2 ? 1 : 0))),
    svPerVincere: media(P.map(p => p.tent.reduce((a, t) => a + (t.sv || 0), 0))), volte: media(P.filter(p => p.tent.some(t => t.v)).map(p => p.tent.length)) }
}

// le code della fortuna: le partite entrate con la roba più debole e più forte (almeno 3 per coda)
export function code(P) {
  const o = [...P].sort((a, b) => a.potere - b.potere)
  const q = Math.max(3, Math.round(P.length * CODA))
  return { sfortunato: o.slice(0, q), fortunato: o.slice(-q) }
}

/* ═══════════ quanto costa vincere ═══════════
   Il curioso e le sonde (SONDE) dallo stesso ingresso, ognuno fino a vincere: quante volte rifà la discesa, quante volte sviene, quante domande e
   pozioni ci mette in tutto, e se ne esce più ricco o più povero (docs/sotterraneo/giocatori-tipo.md, «Quanto costa vincere») */
export function costoDiVincere(P) {
  const vinta = p => p.tent.some(t => t.v)
  const somma = (p, f) => p.tent.reduce((a, t) => a + (t[f] || 0), 0)
  const ultimo = p => p.tent[p.tent.length - 1]
  return { n: P.length, vinte: media(P.map(p => (vinta(p) ? 1 : 0))),
    tentativi: media(P.filter(vinta).map(p => p.tent.length)), svenimenti: media(P.map(p => somma(p, 'sv'))),
    domande: media(P.map(p => somma(p, 'dom'))), pozioni: media(P.map(p => somma(p, 'pz'))),
    gemme: media(P.map(p => (ultimo(p).ge || 0) - (p.ing.gemme || 0))), tasche: media(P.map(p => (ultimo(p).pt ?? 0) - (p.ing.poz || 0))) }
}
export function tabellaCosto(P) {
  const ks = CAMPAGNA.map((_, k) => k)
  const tipi = ['curioso', ...Object.keys(P.per).filter(t => t !== 'curioso' && t !== 'bravo')]
  const righe = [`Quanto costa vincere, dallo stesso ingresso fino a vincere (al più ${Math.max(...tipi.flatMap(t => ks.flatMap(k => ((P.per[t] || {})[k] || []).map(p => p.tent.length))), 0)} volte): a discesa, in media`,
    ''.padEnd(28) + ks.map(k => CAMPAGNA[k].chiave.slice(0, 6).padStart(8)).join('')]
  const voci = [['vinte', 'vinta alla fine', v => `${Math.round(v * 100)}%`], ['tentativi', 'volte per vincerla', v => v.toFixed(1)],
    ['svenimenti', 'svenimenti in tutto', v => v.toFixed(1)], ['domande', 'domande in tutto', v => String(Math.round(v))],
    ['pozioni', 'pozioni bevute', v => v.toFixed(1)], ['gemme', 'gemme uscendo − entrando', v => String(Math.round(v))],
    ['tasche', 'pozioni in tasca, − entrando', v => (v > 0 ? '+' : '') + v.toFixed(1)]]
  for (const t of tipi) {
    const c = ks.map(k => costoDiVincere((P.per[t] || {})[k] || []))
    righe.push(`${GIOCATORI_TIPO[t].nome} (${Math.round(GIOCATORI_TIPO[t].bravura * 10)}/10)`)
    for (const [f, nome, fmt] of voci) righe.push(`  ${nome}`.padEnd(28) + c.map(x => (x[f] == null ? '-' : fmt(x[f])).padStart(8)).join(''))
  }
  return righe.join('\n')
}

/* ═══════════ i bersagli e le celle ═══════════ */
export const MISURE = {
  vinte: { nome: 'discese vinte alla prima', u: 'perc' },
  storiaFinita: { nome: 'storie finite (7 discese)', u: 'perc' },
  svenuto: { nome: 'discese con uno svenimento', u: 'perc' },
  pozioni: { nome: 'pozioni bevute a discesa', u: 'uno' },
  vitaGrosso: { nome: 'vita dopo lo scontro grosso', u: 'perc' },
  vitaScontri: { nome: 'vita a fine scontro', u: 'perc' },
  sopra90: { nome: 'scontri finiti sopra il 90%', u: 'perc' },
  domande: { nome: 'domande a discesa', u: 'zero' },
  rifatteSvenute: { nome: 'rifatte con uno svenimento', u: 'perc' },
  colpiStrada: { nome: 'colpi per un mostro di strada', u: 'uno' },
  colpiCaporale: { nome: 'colpi per un caporale', u: 'uno' },
  colpiGrosso: { nome: 'colpi per il grosso', u: 'uno' },
  persaNormale: { nome: 'vita persa in uno scontro normale', u: 'perc' },
  persaPesante: { nome: 'vita persa in uno scontro pesante', u: 'perc' },
  cureTrovate: { nome: 'cure trovate a discesa', u: 'uno' },
  tetto: { nome: 'discese col tetto delle cure toccato', u: 'perc' },
  muri: { nome: 'muri (2 sconfitte di fila)', u: 'perc' },
  svPerVincere: { nome: 'svenimenti per vincerla, in tutto', u: 'uno' },
  volte: { nome: 'volte per vincerla', u: 'uno' },
}
const fmt = (v, u) => (v == null ? '-' : u === 'perc' ? `${Math.round(v * 100)}` : u === 'uno' ? v.toFixed(1) : String(Math.round(v)))
export const unitaDi = chiave => MISURE[chiave.split('.').pop()].u
export const nomeDi = chiave => (chiave.includes('.') ? `${chiave.split('.')[0]}: ` : '') + MISURE[chiave.split('.').pop()].nome

// il bersaglio di una misura in una discesa (la cripta ha il suo, se lo dichiara)
export function bersaglioDi(b, k) { return b && b.cripta && k === 0 ? { ...b, ...b.cripta, cripta: undefined } : b }

// quanto è fuori, in margini: 0 se dentro, positivo sopra il massimo, negativo sotto il minimo
export function scostamento(v, b) {
  if (v == null || !b) return 0
  const scala = b.min != null && b.max != null ? (b.max - b.min) : Math.max(0.25 * Math.abs(b.min != null ? b.min : b.max), 0.1)
  if (b.max != null && v > b.max) return (v - b.max) / scala
  if (b.min != null && v < b.min) return (v - b.min) / scala
  return 0
}
export const fuori = (v, b) => v != null && scostamento(v, b) !== 0

// le righe di un giocatore tipo: una per bersaglio, con il suo sottoinsieme di partite
function righeDi(tipo) {
  const bs = GIOCATORI_TIPO[tipo].bersagli
  const righe = []
  for (const [chiave, b] of Object.entries(bs)) {
    if (chiave === 'sfortunato' || chiave === 'fortunato') for (const [m, bb] of Object.entries(b)) righe.push({ chiave: `${chiave}.${m}`, b: bb, coda: chiave, misura: m })
    else righe.push({ chiave, b, misura: chiave })
  }
  return righe
}

/* Il rapporto: per ogni giocatore tipo, per ogni riga, una cella per discesa { v, b, ok, fuori, n }. `P` viene da `partite` */
export function rapporto(P) {
  const out = {}
  for (const tipo of NOMI_TIPO) {
    const righe = righeDi(tipo).map(r => ({ ...r, celle: [] }))
    for (let k = 0; k < CAMPAGNA.length; k++) {
      const gruppo = (P.per[tipo] || {})[k] || []
      const m = misure(gruppo)
      const c = gruppo.length ? code(gruppo) : { sfortunato: [], fortunato: [] }
      for (const r of righe) {
        let v
        if (r.coda) v = misure(c[r.coda])[r.misura]
        else if (r.chiave === 'storiaFinita') v = k === 0 ? P.finite : undefined
        else if (r.chiave === 'rifatteSvenute') { const rf = P.rifatte[k] || []; v = rf.length ? media(rf.map(x => (x.rec.sv > 0 ? 1 : 0))) : null }
        else v = m[r.misura]
        const b = bersaglioDi(r.b, k)
        r.celle.push({ k, v: v === undefined ? null : v, b, n: r.coda ? c[r.coda].length : m.n, fuori: v != null && fuori(v, b), scosta: scostamento(v, b) })
      }
    }
    out[tipo] = righe
  }
  return out
}

export const fuoriBersaglio = R => Object.entries(R).flatMap(([tipo, righe]) => righe.flatMap(r => r.celle.filter(c => c.fuori).map(c => ({ tipo, riga: r, cella: c }))))

/* ═══════════ il perché ═══════════
   «Ogni deviazione è sospetta»: per ogni cella fuori bersaglio, se è di tutti o di uno, e cosa fa la differenza. Un caso isolato
   e molto lontano dagli altri non si media: si segnala come possibile difetto del gioco. */
const EROI = ['cavaliere', 'elfa', 'mago', 'nano']
// le misure che salgono quando il gioco è facile (le altre, oltre il massimo, vogliono dire troppo duro)
const FACILI = new Set(['vinte', 'vitaGrosso', 'vitaScontri', 'sopra90'])

function metricaDi(misura) { return P => misure(P)[misura] }

// la misura di una storia sola, per cercare gli isolati (solo le misure continue)
function perStoria(p, misura) {
  const sc = p.rec.sc
  if (misura === 'vitaGrosso') { const g = sc.filter(grosso); return g.length ? media(g.map(c => c.vf)) : null }
  if (misura === 'vitaScontri') return sc.length ? media(sc.map(c => c.vf)) : null
  if (misura === 'sopra90') return sc.length ? sc.filter(c => c.vf >= 0.9).length / sc.length : null
  if (misura === 'domande') return p.rec.dom
  if (misura === 'pozioni') return p.rec.pz
  return null
}

export function natura(P, misura, b, dir) {
  const per = EROI.map(e => ({ e, v: metricaDi(misura)(P.filter(p => p.eroe === e)) })).filter(x => x.v != null)
  const dentro = x => (dir > 0 ? !(b.max != null && x.v > b.max) : !(b.min != null && x.v < b.min))
  const fuoriEroi = per.filter(x => !dentro(x))
  const vals = P.map(p => ({ p, v: perStoria(p, misura) })).filter(x => x.v != null)
  let isolati = []
  if (vals.length >= 8) {
    const m = mediana(vals.map(x => x.v)), mad = mediana(vals.map(x => Math.abs(x.v - m))) || 0
    const soglia = Math.max(3 * 1.4826 * mad, misura === 'domande' ? 25 : misura === 'pozioni' ? 2 : 0.25)
    isolati = vals.filter(x => Math.abs(x.v - m) > soglia).sort((a, b2) => Math.abs(b2.v - m) - Math.abs(a.v - m)).slice(0, 3)
    if (isolati.length > Math.max(1, vals.length * 0.1)) isolati = []   // se sono tanti non sono isolati: è la regola
  }
  const senza = isolati.length ? metricaDi(misura)(P.filter(p => !isolati.some(x => x.p === p))) : null
  const dopo = senza != null && !fuori(senza, b)
  const tipo = dopo ? 'isolato' : fuoriEroi.length >= 3 ? 'uniforme' : fuoriEroi.length ? 'eroe' : 'uniforme'
  return { tipo, fuoriEroi: fuoriEroi.map(x => x.e), perEroe: per, isolati }
}

// il gruppo e il dettaglio di un'etichetta: chi, di quante partite
function gruppi(lista, chiave, valore, minimo = 8) {
  const m = new Map()
  for (const x of lista) { const k = chiave(x); if (k == null) continue; const e = m.get(k) || { n: 0, s: 0 }; e.n++; e.s += valore(x); m.set(k, e) }
  return [...m].filter(([, e]) => e.n >= minimo).map(([k, e]) => ({ k, n: e.n, v: e.s / e.n }))
}

// i mostri, le abilità e i pezzi che stanno dietro una media alta o bassa (`alto`: cerca chi la fa salire)
function dietro(P, alto, tipo, k) {
  const righe = []
  const sc = scontriDi(P)
  if (!sc.length) return righe
  const ordina = a => a.sort((x, y) => (alto ? y.v - x.v : x.v - y.v))
  const mostri = ordina(gruppi(sc, x => x.c.tipi[0], x => x.c.vf)).slice(0, 3)
  if (mostri.length) righe.push(`mostri da cui si esce ${alto ? 'quasi interi' : 'a pezzi'}: ${mostri.map(g => `${nomeMostro(g.k)} ${perc(g.v)} (${g.n})`).join(', ')}`)
  const taglia = gruppi(sc, x => (x.c.g ? 'il grosso' : x.c.n >= MOSTRI_DEL_GROSSO ? `${Math.min(x.c.n, 5)}+ mostri` : x.c.n === 1 ? 'da solo' : '2 mostri'), x => x.c.vf, 5)
  if (taglia.length > 1) righe.push(`per gruppo: ${taglia.map(g => `${g.k} ${perc(g.v)} (${g.n})`).join(' · ')}`)
  // le abilità: quanto cambia la vita a fine scontro fra chi le ha usate e chi no
  const ids = [...new Set(sc.flatMap(x => Object.keys(x.c.ab)))]
  const ab = ids.map(id => {
    const con = sc.filter(x => x.c.ab[id]), senza = sc.filter(x => !x.c.ab[id])
    return con.length >= sc.length * 0.1 && senza.length >= 8 ? { id, quota: con.length / sc.length, con: media(con.map(x => x.c.vf)), senza: media(senza.map(x => x.c.vf)) } : null
  }).filter(Boolean).sort((a, b) => (alto ? (b.con - b.senza) - (a.con - a.senza) : (a.con - a.senza) - (b.con - b.senza)))
  if (ab.length && Math.abs(ab[0].con - ab[0].senza) > 0.08)
    righe.push(`abilità che pesa: ${NODI[ab[0].id] ? NODI[ab[0].id].nome : ab[0].id}, in ${perc(ab[0].quota)} degli scontri: ne esce al ${perc(ab[0].con)} contro ${perc(ab[0].senza)} senza`)
  const v0 = media(sc.map(x => x.c.v0)), pz = media(P.map(p => p.rec.pz)), fo = media(P.map(p => p.rec.fo || 0))
  righe.push(`entra negli scontri al ${perc(v0)} di vita (${(sc.length / P.length).toFixed(0)} scontri a discesa, ${pz.toFixed(1)} pozioni, ${fo.toFixed(1)} fonti)`)
  // i pezzi: chi li porta ne esce meglio o peggio? solo quelli fuori dalla tabella della roba attesa o non comuni
  const eroi = [...new Set(P.map(p => p.eroe))]
  const tabella = new Set(eroi.flatMap(e => Object.values(robaAttesa(e, k)).filter(x => typeof x === 'string').map(baseDi)))
  const pezzi = new Map()
  for (const p of P) for (const z of p.ing.pezzi) if (z) { const b = baseDi(z); const e = pezzi.get(b) || { n: 0, v: [], z }; e.n++; e.v.push(media(p.rec.sc.map(c => c.vf)) ?? 0); pezzi.set(b, e) }
  const tutti = media(P.map(p => media(p.rec.sc.map(c => c.vf)) ?? 0))
  const fuoriTabella = [...pezzi].map(([b, e]) => ({ b, ...e, ven: media(e.v), nuovo: !tabella.has(b), raro: COSE[e.z] && COSE[e.z].rarita && COSE[e.z].rarita !== 'comune' }))
    .filter(e => e.n >= 5 && e.n <= P.length * 0.8 && (e.nuovo || e.raro))
    .map(e => ({ ...e, d: e.ven - tutti })).sort((a, b) => (alto ? b.d - a.d : a.d - b.d))
  if (fuoriTabella.length && Math.abs(fuoriTabella[0].d) > 0.05) {
    const e = fuoriTabella[0]
    righe.push(`pezzo ${e.nuovo ? 'fuori dalla tabella' : 'raro'}: ${nome(e.z)} in ${e.n} partite su ${P.length}, scontri a ${perc(e.ven)} contro ${perc(tutti)} in media`)
  }
  const scarti = P.map(p => p.scarto)
  righe.push(`entra con la forza ${mediana(scarti) >= 0 ? '+' : ''}${mediana(scarti).toFixed(1)} sul livello atteso (mediana; dal ${Math.min(...scarti)} al ${Math.max(...scarti)})`)
  return righe
}

// chi uccide: dove cade chi perde la discesa o sviene
function chiUccide(P) {
  const cadute = scontriDi(P).filter(x => x.c.sv)
  if (!cadute.length) return []
  const g = new Map()
  for (const { c } of cadute) { const k = c.g ? 'il grosso' : `${Math.min(c.n, 5)}${c.n > 1 ? '+' : ''} ${nomeMostro(c.tipi[0])}`; g.set(k, (g.get(k) || 0) + 1) }
  const top = [...g].sort((a, b) => b[1] - a[1]).slice(0, 3)
  return [`si cade contro: ${top.map(([k, n]) => `${k} (${n})`).join(', ')}`]
}

const nomeCella = ({ tipo, riga, cella }) => `${CAMPAGNA[cella.k].chiave} · ${GIOCATORI_TIPO[tipo].nome.toLowerCase()} · ${nomeDi(riga.chiave)} ${fmt(cella.v, MISURE[riga.misura].u)}${MISURE[riga.misura].u === 'perc' ? '%' : ''}`
const bersaglioTesto = (b, u) => {
  const s = x => `${fmt(x, u)}${u === 'perc' ? '%' : ''}`
  return b.min != null && b.max != null ? `${s(b.min)}–${s(b.max)}` : b.min != null ? `≥ ${s(b.min)}` : `≤ ${s(b.max)}`
}

// perché una cella è fuori: la sua natura (uniforme, di un eroe, isolata) e i dati per capirla. `P`: le partite
export function spiega(f, P) {
  const { tipo, riga, cella } = f
  const gruppo = (P.per[tipo] || {})[cella.k] || []
  const sottoinsieme = riga.coda ? code(gruppo)[riga.coda] : gruppo
  const dir = cella.scosta > 0 ? 1 : -1
  const u = MISURE[riga.misura].u
  const testa = `${nomeCella(f)} (bersaglio ${bersaglioTesto(cella.b, u)})`
  const righe = []
  if (['vinte', 'storiaFinita'].includes(riga.misura) || riga.misura === 'muri') {
    const n = natura(sottoinsieme, riga.misura, cella.b, dir)
    righe.push(n.fuoriEroi.length ? `fuori per ${n.fuoriEroi.join(', ')} (${n.perEroe.map(x => `${x.e.slice(0, 3)} ${perc(x.v)}`).join(' · ')})` : 'di poco, per tutti')
    if (dir < 0) {
      righe.push(...chiUccide(sottoinsieme))
      const persi = sottoinsieme.filter(p => !p.rec.v), vinti = sottoinsieme.filter(p => p.rec.v)
      if (persi.length && vinti.length) righe.push(`chi perde entra con la forza ${mediana(persi.map(p => p.scarto)).toFixed(1)}, chi vince ${mediana(vinti.map(p => p.scarto)).toFixed(1)} sul livello atteso`)
      if (riga.misura === 'muri') for (const p of sottoinsieme.filter(p => p.tent.filter(t => !t.v).length >= 2).slice(0, 3))
        righe.push(`muro: ${p.eroe} seme ${p.seme}, entra con la forza ${p.scarto >= 0 ? '+' : ''}${p.scarto} e perde ${p.tent.filter(t => !t.v).length} volte`)
    } else {
      const vinti = sottoinsieme.filter(p => p.rec.v)
      righe.push(...dietro(vinti, true, tipo, cella.k))
    }
    return { testa, natura: n.tipo === 'isolato' ? 'misto' : n.fuoriEroi.length >= 3 || !n.fuoriEroi.length ? 'uniforme' : 'eroe', righe }
  }
  if (riga.misura === 'rifatteSvenute') {
    const rf = (P.rifatte[cella.k] || []).filter(x => x.rec.sv > 0)
    righe.push(`rifatte con uno svenimento: ${rf.map(x => `${x.eroe.slice(0, 3)} ${x.seme}`).slice(0, 5).join(', ')}`)
    return { testa, natura: 'misto', righe }
  }
  const n = natura(sottoinsieme, riga.misura, cella.b, dir)
  righe.push(`${n.tipo === 'uniforme' ? 'uniforme' : n.tipo === 'eroe' ? `di ${n.fuoriEroi.join(', ')}` : 'isolato'}: ${n.perEroe.map(x => `${x.e.slice(0, 3)} ${fmt(x.v, u)}`).join(' · ')}`)
  for (const i of n.isolati)
    righe.push(`! caso isolato, possibile difetto del gioco: ${i.p.eroe} seme ${i.p.seme} ${fmt(i.v, u)}${u === 'perc' ? '%' : ''}, la maggioranza sta altrove (entra con la forza ${i.p.scarto >= 0 ? '+' : ''}${i.p.scarto}; pezzi ${i.p.ing.pezzi.filter(Boolean).map(nome).join(', ') || 'nessuno'})`)
  if (riga.misura === 'svenuto') righe.push(...chiUccide(sottoinsieme))
  if (riga.misura === 'domande') {
    const piani = []
    for (const p of sottoinsieme) p.rec.pp.forEach((d, i) => { piani[i] = (piani[i] || []).concat(d) })
    righe.push(`domande per piano: ${piani.map((a, i) => `${i + 1}° ${Math.round(media(a))}`).join(' · ')}; ${(media(sottoinsieme.map(p => p.rec.sc.length))).toFixed(0)} scontri, ${media(sottoinsieme.map(p => p.rec.mo)).toFixed(0)} mostri battuti a discesa`)
  } else righe.push(...dietro(sottoinsieme, FACILI.has(riga.misura) ? dir > 0 : dir < 0, tipo, cella.k))
  return { testa, natura: n.tipo === 'isolato' ? 'isolato' : n.tipo, righe }
}

/* ═══════════ la forbice della roba ═══════════ */
export function forbice(P, tipo = 'curioso') {
  return CAMPAGNA.map((_, k) => {
    const g = (P.per[tipo] || {})[k] || []
    const q = (v, p) => { const s = [...v].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null }
    const f = g.map(p => p.scarto), l = g.map(p => p.ing.liv)
    // le gemme: quante ne porta a casa la discesa e quante gliene restano dopo la spesa (il banco di sopra non ha più niente da vendergli)
    const prese = media(g.map(p => p.rec.ge)), avanzate = g.map(p => p.ing.gemme)
    return { k, n: g.length, scarto: [q(f, 0.1), q(f, 0.5), q(f, 0.9)], livello: [q(l, 0.1), q(l, 0.5), q(l, 0.9)], atteso: livelloAtteso(k),
             gemmePrese: prese, gemmeAvanzate: [q(avanzate, 0.1), q(avanzate, 0.5), q(avanzate, 0.9)],
             alTetto: media(g.map(p => p.rec.tt || 0)) }   // quote di discese col tetto delle pozioni (docs/sotterraneo/roba.md, «Le pozioni»)
  })
}

/* ═══════════ la stampa ═══════════ */
export function tabella(R, tipo) {
  const g = GIOCATORI_TIPO[tipo]
  const nomi = CAMPAGNA.map(t => t.chiave.slice(0, 6).padStart(9))
  const righe = [`${g.nome} — ${g.chi}  [${Math.round(g.bravura * 10)}/10, ${g.come === 'tutto' ? 'gira tutto' : 'dritto alla scala'}]`,
                 ' '.repeat(54) + nomi.join('')]
  for (const r of R[tipo]) {
    const u = MISURE[r.misura].u
    const celle = r.celle.map(c => (c.v == null ? '        -' : ` ${c.fuori ? '❌' : '✅'}${fmt(c.v, u).padStart(4)} `)).join('')
    righe.push(`${`${nomeDi(r.chiave)} [${bersaglioTesto(bersaglioDi(r.b, 1), u)}]`.padEnd(54)}${celle}`)
  }
  return righe.join('\n')
}

// i casi sospetti e il perché, in ordine di discesa; `max` righe di spiegazione per cella
export function scostamenti(R, P, { solo = null } = {}) {
  const lista = fuoriBersaglio(R).filter(f => !solo || solo.includes(f.cella.k)).sort((a, b) => a.cella.k - b.cella.k || a.tipo.localeCompare(b.tipo))
  return lista.map(f => ({ f, spiegazione: spiega(f, P) }))
}

// il primo bersaglio fuori di molto, in ordine di discesa (`--presto`), con la sua frase
export function primoFuoriDiMolto(R, margine = DI_MOLTO) {
  const l = fuoriBersaglio(R).filter(f => Math.abs(f.cella.scosta) > margine).sort((a, b) => a.cella.k - b.cella.k)
  if (!l.length) return null
  const f = l[0]
  const u = MISURE[f.riga.misura].u
  return { ...f, frase: `${CAMPAGNA[f.cella.k].chiave}: ${GIOCATORI_TIPO[f.tipo].nome.toLowerCase()}, ${nomeDi(f.riga.chiave)} al ${fmt(f.cella.v, u)}${u === 'perc' ? '%' : ''} (bersaglio ${bersaglioTesto(f.cella.b, u)}), ${f.cella.scosta > 0 ? 'troppo' : 'troppo poco'}` }
}
