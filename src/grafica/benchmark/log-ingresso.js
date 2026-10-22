// Le righe dell'ingresso nel log coi modelli veri (log-veri.js; docs/core/vecchio-telefono-veri.md, «L'ingresso»): ogni prova fatta tre
// volte da capo, i tre valori in fila; la LETTURA confronta col riscaldamento e senza.
import { SOGLIE_VERI } from './log-veri.js'   // usato solo dentro le funzioni: il giro di import fra i due file non dà noia

const LENTO_INGRESSO = 100        // ms: un fotogramma che si vede fermarsi
const segnoVero = p => (p <= SOGLIE_VERI.liscio ? 'ok ' : p <= SOGLIE_VERI.scatti ? '~  ' : 'XX ')
const mediano = l => { const o = l.filter(x => x != null).sort((a, b) => a - b); return o.length ? o[Math.floor(o.length / 2)] : null }
// un attacco (0, 1, 2) in tutti i giri: i valori uno dopo l'altro
const colonna = (righe, k) => (righe ? righe.map(g => g[k]) : [])

export function rigaIngresso(r) {
  const att = r.att ? r.att[0].map((_, k) => `${k + 1}° ${colonna(r.att, k).join('/')}${r.sh ? ` +${colonna(r.sh, k).join('/')}sh` : ''}`).join(' ') : ''
  const sc = r.scaldato && r.scaldato.some(x => x != null) ? ` scaldato ${r.scaldato.map(x => (x == null ? '-' : (x / 1000).toFixed(1))).join('/')}s` : ''
  return `${segnoVero(mediano(r.max))}${r.nome}: max ${r.max.join('/')} ms, >100ms ${r.lenti.join('/')}, prog ${r.p1.join('/')}→${r.p3.join('/')}` +
    (r.daScaldare && r.daScaldare.some(x => x) ? ` da scaldare ${r.daScaldare.join('/')}` : '') + sc + (att ? `; attacchi ${att}` : '')
}


/** Cosa dicono le prove dell'ingresso (i dati crudi: il calore non c'entra, è un fermo di un fotogramma). */
export function letturaIngresso(crudi) {
  // l'ingresso: il fermo all'entrata e ai primi attacchi, col riscaldamento e senza
  const righe = []
  const ing = id => { const r = crudi.find(x => x.id === id); return r && r.tipo === 'ingresso' && !r.errore ? r : null }
  const guadagno = (con, senza) => {
    const g = senza - con
    return Math.abs(g) < Math.max(20, 0.15 * Math.max(con, senza)) ? `non serve (${g >= 0 ? 'toglie' : 'aggiunge'} ${Math.abs(g)} ms, nel rumore)` : g > 0 ? `toglie ${g} ms` : `aggiunge ${-g} ms`
  }
  const s1 = ing('ing-sot'), s1x = ing('ing-sot-x')
  if (s1) {
    const a1 = s1.att ? mediano(colonna(s1.att, 0)) : null, a1x = s1x && s1x.att ? mediano(colonna(s1x.att, 0)) : null
    righe.push(`INGRESSO in un piano: fotogramma più lungo ${mediano(s1.max)} ms (giri ${s1.max.join('/')})` + (s1x ? `, senza riscaldamento ${mediano(s1x.max)}` : '') +
      (a1 != null ? `; primo attacco ${a1} ms` + (a1x != null ? `, senza ${a1x}: il riscaldamento ${guadagno(a1, a1x)} dal primo attacco` : '') : '') +
      (s1.sh ? `; shader nuovi ai tre attacchi ${[0, 1, 2].map(k => mediano(colonna(s1.sh, k))).join('/')}` + (s1x && s1x.sh ? ` (senza ${[0, 1, 2].map(k => mediano(colonna(s1x.sh, k))).join('/')})` : '') : '') + '.')
  }
  const pr = ing('ing-presto'), prx = ing('ing-presto-x')
  if (pr && pr.att) {
    const a = mediano(colonna(pr.att, 0)), ax = prx && prx.att ? mediano(colonna(prx.att, 0)) : null
    righe.push(`Attacco a 0,5 s dall'ingresso (prima del riscaldamento): ${a} ms` + (ax != null ? `, senza riscaldamento ${ax}` : '') + `${a > LENTO_INGRESSO ? ' = si vede il fermo' : ''}.`)
  }
  const mo = ing('ing-mondo'), mox = ing('ing-mondo-x')
  if (mo) righe.push(`Ingresso nel mondo di sopra: fotogramma più lungo ${mediano(mo.max)} ms, ${mediano(mo.lenti)} sopra 100 ms` +
    (mox ? `; senza riscaldamento ${mediano(mox.max)} ms: ${guadagno(mediano(mo.max), mediano(mox.max))}` : '') + '.')
  const zi = ing('ing-zaino')
  if (zi) righe.push(`Entrare e aprire subito lo zaino: fotogramma più lungo ${mediano(zi.max)} ms, ${mediano(zi.lenti)} fotogrammi sopra 100 ms nei primi 3 s.`)
  return righe
}
