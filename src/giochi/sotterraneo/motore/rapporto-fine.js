// Le tabelle di «a che punto è l'eroe alla fine di ogni discesa» e delle strade di spesa (docs/sotterraneo/fine-discesa-e-strade.md): dai passi di
// una linea (motore/storie.js) alla mediana e alle code accanto all'atteso, dove si ferma, chi vince bevendo. Funzioni pure. Gira in Node.
import { CAMPAGNA } from '../dati/campagna.js'
import { QUOTA_CHE_SI_FERMA, POZIONI_DA_BEONE } from '../dati/giocatori-tipo.js'
import { attesoA } from './fine.js'

const mediana = v => { if (!v.length) return null; const s = [...v].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }
const media = v => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null)
const quantile = (v, p) => { const s = [...v].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null }

// le righe della tabella; le percentuali sono dell'eroe atteso della stessa classe (100 è l'atteso)
export const RIGHE_FINE = [
  { chiave: 'liv', nome: 'livello', segno: false },
  { chiave: 'scarto', nome: 'forza sull\'atteso', segno: true },
  { chiave: 'dpa', nome: 'danno a risposta %', segno: false },
  { chiave: 'dif', nome: 'difesa %', segno: false },
  { chiave: 'vita', nome: 'vita massima %', segno: false },
  { chiave: 'valore', nome: 'valore roba %', segno: false },
  { chiave: 'gemme', nome: 'gemme non spese', segno: false },
  { chiave: 'poz', nome: 'pozioni rimaste', segno: false },
  { chiave: 'bevute', nome: 'pozioni bevute', segno: false },
  { chiave: 'ris', nome: 'risalite a discesa', segno: false },
  { chiave: 'spRis', nome: 'gemme spese in salita', segno: false },
  { chiave: 'pezRis', nome: 'pezzi comprati in salita', segno: false },
  { chiave: 'pozRis', nome: 'pozioni comprate in salita', segno: false },
  { chiave: 'camRis', nome: 'passi per il portale', segno: false },
]

/* Le letture a fine discesa di una linea: `passi` sono i suoi passi (uno per storia e per discesa k; k = 7 è la spesa in uscita). La fine
   della discesa j è l'ingresso della j+1: l'eroe com'è tornato su, dopo la spesa. Torna una voce per discesa con il valore di ogni storia. */
export function fineDi(passi) {
  const storie = new Map()
  for (const p of passi) { const c = `${p.eroe}|${p.seme}`; if (!storie.has(c)) storie.set(c, []); storie.get(c)[p.k] = p }
  const nuovo = () => ({ n: 0, passa: [], allaPrima: [], dopoAllaPrima: [], comprati: [], trovati: [], inutili: [], domande: [], forzaAlla: [], ...Object.fromEntries(RIGHE_FINE.map(r => [r.chiave, []])) })
  const per = CAMPAGNA.map(nuovo)
  for (const s of storie.values()) CAMPAGNA.forEach((_, j) => {
    const dentro = s[j], dopo = s[j + 1]
    if (!dentro || !dopo) return
    const a = attesoA(dopo.eroe, j + 1), i = dopo.ingresso, f = per[j]
    f.n++
    f.passa.push(dentro.tentativi.some(t => t.v) ? 1 : 0)
    f.allaPrima.push(dentro.tentativi[0] && dentro.tentativi[0].v ? 1 : 0)
    f.liv.push(i.liv)
    f.scarto.push(i.forza - a.liv)
    f.dpa.push(100 * i.dpa / a.dpa)
    f.dopoAllaPrima.push(s[j + 2] && s[j + 2].tentativi[0] ? (s[j + 2].tentativi[0].v ? 1 : 0) : null)
    f.dif.push(100 * i.dif / a.dif)
    f.vita.push(100 * i.vita / a.vita)
    f.valore.push(100 * i.valore / a.valore)
    f.gemme.push(i.gemme)
    f.poz.push(dopo.prima.poz)
    f.bevute.push(dentro.tentativi.reduce((x, t) => x + t.pz, 0))
    const somma = (dove, campo) => dentro.tentativi.reduce((x, t) => x + (t.ri || []).reduce((y, r) => y + (typeof campo === 'function' ? campo(r) : r[campo]), 0), 0)
    f.ris.push(dentro.tentativi.reduce((x, t) => x + (t.ri || []).length, 0))
    f.spRis.push(somma(null, 'sp'))
    f.pezRis.push(somma(null, r => r.pz.length))
    f.pozRis.push(somma(null, 'po'))
    f.camRis.push(somma(null, 'ca'))
    f.comprati.push((dentro.pre || 0) + somma(null, r => r.ut || 0))
    f.trovati.push(dentro.tentativi.reduce((x, t) => x + ((t.ar && t.ar.trovati) || 0), 0))
    f.inutili.push(dentro.tentativi.reduce((x, t) => x + ((t.ar && t.ar.inutili) || 0), 0))
    f.domande.push(dentro.tentativi.length ? dentro.tentativi[dentro.tentativi.length - 1].dom : null)
  })
  return per
}

// l'atteso in assoluto: la media dei quattro eroi attesi all'ingresso della discesa dopo
export function attesoDellaFine(j, eroi = ['cavaliere', 'elfa', 'mago', 'nano']) {
  const l = eroi.map(e => attesoA(e, j + 1))
  return { liv: l[0].liv, dpa: media(l.map(x => x.dpa)), dif: media(l.map(x => x.dif)), vita: media(l.map(x => x.vita)), valore: media(l.map(x => x.valore)) }
}

// 10° · mediana · 90° percentile di una riga, per ogni discesa
export const quantili = (F, chiave) => F.map(f => [quantile(f[chiave], 0.1), mediana(f[chiave]), quantile(f[chiave], 0.9)])
const cifra = (x, segno) => (x == null ? '-' : Math.abs(x) >= 1000 ? `${(x / 1000).toFixed(1)}k` : `${segno && x > 0 ? '+' : ''}${Math.round(x)}`)
const intestazione = () => ' '.repeat(22) + CAMPAGNA.map(t => t.chiave.slice(0, 6).padStart(14)).join('')

// la tabella di una linea: una riga per misura, tre numeri per discesa (le code e la mediana); `solo` sceglie le righe
export function tabellaFine(F, nome, { solo = null } = {}) {
  const righe = [`${nome} (a fine discesa, dopo la spesa: 10° · mediana · 90° percentile di ${Math.max(...F.map(f => f.n))} storie)`, intestazione()]
  for (const r of RIGHE_FINE.filter(x => !solo || solo.includes(x.chiave)))
    righe.push(r.nome.padEnd(22) + quantili(F, r.chiave).map(v => v.map(x => cifra(x, r.segno)).join('·').padStart(14)).join(''))
  // gemme non spese oltre il valore della roba attesa: il giocatore non sfrutta il personaggio (un sospetto da spiegare, non un dato)
  const sospetti = F.map((f, j) => (f.n && mediana(f.gemme) > attesoDellaFine(j).valore ? '⚠' : ''))
  if (sospetti.some(Boolean) && (!solo || solo.includes('gemme'))) righe.push('gemme non spese: sospetto'.padEnd(22) + sospetti.map(x => x.padStart(14)).join(''))
  return righe.join('\n')
}

// Le armi nuove che migliorano davvero l'eroe, per discesa: comprate (fra una discesa e l'altra e in salita) · trovate · totale, la mediana del totale e i pezzi trovati che non servivano
// (l'utente: circa 3 utili a discesa fra comprati e trovati; molti di più è troppa generosità, molti di meno un fabbro troppo caro o drop avari)
export function tabellaArmi(F, nome) {
  const m = v => (v.length ? media(v) : null), d = x => (x == null ? '-' : x.toFixed(1))
  const riga = (n, f) => n.padEnd(22) + F.map((g, j) => (g.n ? f(g, j) : '-').padStart(14)).join('')
  return [`${nome} (armi nuove che migliorano l'eroe, per discesa)`, intestazione(),
    riga('comprate', g => d(m(g.comprati))), riga('trovate', g => d(m(g.trovati))),
    riga('utili in tutto', g => d(m(g.comprati.map((c, i) => c + g.trovati[i])))),
    riga('mediana utili', g => String(mediana(g.comprati.map((c, i) => c + g.trovati[i])))),
    riga('trovate e inutili', g => d(m(g.inutili)))].join('\n')
}

// l'atteso in assoluto, una riga per misura
export function tabellaAtteso() {
  const a = CAMPAGNA.map((_, j) => attesoDellaFine(j))
  const riga = (nome, f) => nome.padEnd(22) + a.map(x => f(x).padStart(14)).join('')
  return ['L\'atteso a fine discesa (la media dei quattro eroi attesi, all\'ingresso della discesa dopo)', intestazione(),
    riga('livello', x => String(x.liv)), riga('danno a risposta', x => x.dpa.toFixed(1)), riga('difesa', x => x.dif.toFixed(1)),
    riga('vita massima', x => x.vita.toFixed(0)), riga('valore roba', x => x.valore.toFixed(0))].join('\n')
}

/* La riga di una strada: per discesa quanti vincono alla prima e quanti restano bloccati (nessuna vittoria in TENTATIVI giri); dove si ferma
   (la prima discesa con almeno QUOTA_CHE_SI_FERMA bloccati), con che forza arriva lì e alla fine (l'ultima discesa giocata), il danno e il valore della roba */
export function rigaDellaStrada(F) {
  const bloccati = F.map(f => (f.n ? 1 - media(f.passa) : null))
  const ferma = bloccati.findIndex(b => b != null && b >= QUOTA_CHE_SI_FERMA)
  const fine = F.reduce((u, f, j) => (f.n ? j : u), -1)
  const ultima = F[Math.max(0, fine)]
  return { fine, allaPrima: F.map(f => (f.n ? media(f.allaPrima) : null)), bloccati, ferma: ferma >= 0 ? ferma : null,
           forzaLa: ferma >= 0 ? mediana(F[ferma].scarto) : null, forzaFine: mediana(ultima.scarto), dpaFine: mediana(ultima.dpa),
           valoreFine: mediana(ultima.valore), bevute: F.map(f => (f.n ? media(f.bevute) : null)) }
}

// Chi vince bevendo (almeno POZIONI_DA_BEONE pozioni nella discesa) contro chi vince bevendo meno: com'esce e come va la discesa dopo

export function chiVinceBevendo(F) {
  const beve = [], altri = []
  F.forEach(f => f.passa.forEach((p, i) => { if (p) (f.bevute[i] >= POZIONI_DA_BEONE ? beve : altri).push({ scarto: f.scarto[i], dpa: f.dpa[i], dopo: f.dopoAllaPrima[i] }) }))
  const riassunto = xs => ({ n: xs.length, scarto: mediana(xs.map(x => x.scarto)), dpa: mediana(xs.map(x => x.dpa)), dopo: media(xs.filter(x => x.dopo != null).map(x => x.dopo)) })
  return { quota: beve.length + altri.length ? beve.length / (beve.length + altri.length) : null, beve: riassunto(beve), altri: riassunto(altri) }
}

// Il riassunto di una linea per il «prima → dopo» (`--riassunto file` lo salva, `--contro file` lo legge): per discesa le mediane che contano
export function riassuntoDi(F) {
  return F.map(f => (f.n ? { allaPrima: media(f.allaPrima), domande: mediana(f.domande.filter(x => x != null)), scarto: mediana(f.scarto), dpa: mediana(f.dpa),
    valore: mediana(f.valore), gemme: mediana(f.gemme), utili: mediana(f.comprati.map((c, i) => c + f.trovati[i])), ris: media(f.ris) } : null))
}

// il confronto fra due riassunti della stessa linea: una riga per misura, «prima → dopo» per discesa
export function confrontoDi(nome, prima, dopo) {
  const cifraC = (x, d = 0) => (x == null ? '-' : Math.abs(x) >= 1000 ? `${(x / 1000).toFixed(1)}k` : x.toFixed(d))
  const righe = [`${nome} (prima → dopo)`, intestazione()]
  const mis = [['vinte alla prima %', x => x.allaPrima * 100, 0], ['domande (mediana)', x => x.domande, 0], ['forza sull\'atteso', x => x.scarto, 0], ['danno a risposta %', x => x.dpa, 0],
    ['gemme non spese', x => x.gemme, 0], ['armi utili (mediana)', x => x.utili, 0], ['risalite a discesa', x => x.ris, 1]]
  for (const [n, f, d] of mis)
    righe.push(n.padEnd(22) + CAMPAGNA.map((_, j) => (prima[j] && dopo[j] ? `${cifraC(f(prima[j]), d)}→${cifraC(f(dopo[j]), d)}` : '-').padStart(14)).join(''))
  return righe.join('\n')
}
