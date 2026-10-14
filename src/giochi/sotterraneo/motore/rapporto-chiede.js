// Quanto chiede un mostro e quante pozioni arrivano (docs/sotterraneo/giocatori-tipo.md, «Quanto chiede un mostro»): per il giocatore tipo, per discesa e per
// classe, i colpi che costa un mostro di strada, un caporale e il grosso, la vita che costa uno scontro normale e uno pesante, le cure trovate per provenienza,
// quelle bevute e quante volte le tasche toccano il tetto. Funzioni pure sulle partite di `partite` (motore/rapporto.js). Gira in Node.
import { CAMPAGNA } from '../dati/campagna.js'
import { misure, pesante, cureRaccolte } from './rapporto.js'

const EROI = ['cavaliere', 'elfa', 'mago', 'nano']
const media = v => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null)
const uno = v => (v == null ? '-' : v.toFixed(1))
const perc = v => (v == null ? '-' : String(Math.round(v * 100)))
const PROVENIENZE = ['strada', 'caporale', 'grosso', 'forziere', 'ampolla']

const intestazione = () => ' '.repeat(26) + CAMPAGNA.map(t => t.chiave.slice(0, 6).padStart(8)).join('')
const riga = (nome, f) => nome.padEnd(26) + CAMPAGNA.map((_, k) => String(f(k) ?? '-').padStart(8)).join('')

/* Le tabelle per un giocatore tipo (di solito il curioso): `P` viene da `partite`. Torna il testo */
export function tabellaChiede(P, tipo = 'curioso') {
  const g = k => (P.per[tipo] || {})[k] || []
  const di = (k, eroe) => g(k).filter(p => !eroe || p.eroe === eroe)
  const m = (k, eroe) => misure(di(k, eroe))
  const righe = [`Quanto chiede un mostro (${tipo}): i colpi che lo abbattono, in media (bersagli: di strada 2–3, caporale 4–6, il grosso di più)`, intestazione()]
  for (const [nome, chiave] of [['di strada', 'colpiStrada'], ['caporale', 'colpiCaporale'], ['grosso', 'colpiGrosso']]) {
    righe.push(riga(nome, k => uno(m(k)[chiave])))
    for (const e of EROI) righe.push(riga(`  ${e}`, k => uno(m(k, e)[chiave])))
  }
  const mediana = v => { if (!v.length) return null; const s = [...v].sort((a, b) => a - b); return s[s.length >> 1] }
  righe.push(riga('colpo di sempre (mediana)', k => uno(mediana(g(k).map(p => p.ing.col).filter(x => x != null)))))
  const unColpo = k => {
    const colpi = di(k).flatMap(p => p.rec.sc.flatMap(c => (c.mc || []).filter(x => x[0] === 0).map(x => x[1])))
    return colpi.length ? perc(colpi.filter(n => n === 1).length / colpi.length) : '-'
  }
  righe.push(riga('di strada a un colpo %', unColpo))
  righe.push('', `Quanto costa uno scontro (${tipo}): la vita persa, in % della vita massima, senza contare le pozioni (bersagli: normale 15–25, pesante 30–60)`, intestazione())
  for (const [nome, chiave] of [['normale', 'persaNormale'], ['pesante (3+, caporale, grosso)', 'persaPesante']]) {
    righe.push(riga(nome, k => perc(m(k)[chiave])))
    for (const e of EROI) righe.push(riga(`  ${e}`, k => perc(m(k, e)[chiave])))
  }
  // un branco di strada per dimensione: da solo, due, tre o più (senza caporali né grosso)
  for (const [nome, ok] of [['da solo', n => n === 1], ['due', n => n === 2], ['tre o più', n => n >= 3]])
    righe.push(riga(`  branco: ${nome}`, k => perc(media(g(k).flatMap(p => p.rec.sc.filter(c => !c.g && !c.cap && ok(c.n)).map(c => c.pe))))))
  righe.push(riga('scontri normali a discesa', k => uno(media(g(k).map(p => p.rec.sc.filter(c => !pesante(c)).length)))))
  righe.push(riga('scontri pesanti a discesa', k => uno(media(g(k).map(p => p.rec.sc.filter(pesante).length)))))
  righe.push('', `Le pozioni (${tipo}): cure raccolte a discesa per provenienza, rifiutate al tetto, bevute (bersagli: il tetto raramente, 1–3 bevute)`, intestazione())
  for (const pr of PROVENIENZE) righe.push(riga(pr, k => uno(media(g(k).map(p => (p.rec.ct || {})[pr] || 0)))))
  righe.push(riga('trovate in tutto', k => uno(media(g(k).map(p => cureRaccolte(p.rec))))))
  righe.push(riga('rifiutate al tetto', k => uno(media(g(k).map(p => p.rec.cr || 0)))))
  righe.push(riga('bevute', k => uno(media(g(k).map(p => p.rec.pz)))))
  righe.push(riga('in tasca all\'ingresso', k => uno(media(g(k).map(p => p.ing.poz)))))
  righe.push(riga('col tetto toccato %', k => perc(m(k).tetto)))
  for (const e of EROI) {
    righe.push(riga(`  ${e}: trovate`, k => uno(media(di(k, e).map(p => cureRaccolte(p.rec))))))
    righe.push(riga(`  ${e}: bevute`, k => uno(media(di(k, e).map(p => p.rec.pz)))))
    righe.push(riga(`  ${e}: tetto %`, k => perc(m(k, e).tetto)))
  }
  righe.push('', `Si torna su a curarsi? (${tipo}): risalite dal portale a discesa, quelle in cui si compra almeno una pozione, quelle partite sotto metà vita; discese in cui si scende una scala sotto metà vita`, intestazione())
  const risalite = k => g(k).map(p => p.rec.ri || [])
  righe.push(riga('risalite a discesa', k => uno(media(risalite(k).map(r => r.length)))))
  righe.push(riga('con pozioni comprate', k => uno(media(risalite(k).map(r => r.filter(x => x.po > 0).length)))))
  righe.push(riga('partite sotto metà vita', k => uno(media(risalite(k).map(r => r.filter(x => x.vi < 0.5).length)))))
  righe.push(riga('una scala sotto metà %', k => perc(media(g(k).map(p => ((p.rec.sl || []).some(v => v < 0.5) ? 1 : 0))))))
  righe.push(riga('l\'ultima scala sotto metà %', k => perc(media(g(k).map(p => ((p.rec.sl || []).length && p.rec.sl[p.rec.sl.length - 1] < 0.5 ? 1 : 0))))))
  righe.push(riga('vita alle scale %', k => perc(media(g(k).flatMap(p => p.rec.sl || [])))))
  righe.push('', `Il resto (${tipo}): vinte alla prima %, svenimenti %, domande a discesa`, intestazione())
  righe.push(riga('vinte alla prima %', k => perc(m(k).vinte)))
  righe.push(riga('con uno svenimento %', k => perc(m(k).svenuto)))
  righe.push(riga('domande', k => (m(k).domande == null ? '-' : Math.round(m(k).domande))))
  for (const e of EROI) righe.push(riga(`  ${e}: vinte %`, k => perc(m(k, e).vinte)))
  return righe.join('\n')
}
