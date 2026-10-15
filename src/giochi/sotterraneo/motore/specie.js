// Le specie di una discesa viste dalla taratura (docs/sotterraneo/giocatori-tipo.md, «Tanti mostri che picchiano poco»): per ogni specie (e
// ruolo: di strada, caporale, grosso) quanto picchia contro la vita dell'eroe atteso, in quanti colpi un mostro solo lo stende, in quanti
// colpi lo si abbatte, e cosa porta (potenza, esperienza, gemme). Si leggono i mostri dei piani veri, generati dal seme: con la forza, la
// spinta, i gradi e le varianti della discesa. Gira in Node.
import { CAMPAGNA } from '../dati/campagna.js'
import { COLPO_DEL_MOSTRO } from '../dati/mondo.js'
import { MOSTRI } from '../dati/mostri.js'
import { difeseDi } from '../dati/grossi.js'
import { esperienzaDi, gemmeDi } from '../dati/livelli.js'
import { COLPI_PER_STENDERE } from '../dati/giocatori-tipo.js'
import { Corsa } from './corsa.js'
import { potenzaDelMostro } from './potenza.js'
import { eroeAtteso } from './forza.js'
import { livelloAtteso } from './storia.js'
import { seminato } from './livello.js'

const EROI = ['cavaliere', 'elfa', 'mago', 'nano']
const media = v => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0)

const ruoloDi = m => (m.grosso ? 'grosso' : m.caporale ? 'caporale' : 'comune')

// i mostri di tutti i piani di una discesa, su qualche seme
function mostriDella(k, semi) {
  const tutti = []
  for (const seme of semi) {
    const c = new Corsa(CAMPAGNA[k], { seme, rnd: seminato(seme) })
    for (let p = 0; p < CAMPAGNA[k].piani; p++) {
      tutti.push(...c.livello.robe.filter(r => r.che === 'mostro'))
      if (p < CAMPAGNA[k].piani - 1) { c.piano++; c.nuovoPiano() }
    }
  }
  return tutti
}

/* Le specie della discesa `k`: una riga per specie e ruolo. `eroi`: gli eroi attesi con cui si confronta (la media dei quattro).
   Torna [{ tipo, nome, ruolo, n, ossa, att, dif, colpo, vita, colpiPerStendere, colpiPerAbbatterlo, protezioni, armati, gradi, potenza, esp, gemme, fuoriMisura }] */
export function specieDella(k, { semi = [1, 2, 3], eroi = EROI } = {}) {
  const attesi = eroi.map(e => eroeAtteso(e, livelloAtteso(k)))
  const vita = media(attesi.map(c => c.vitaConLaRoba))
  const mostri = mostriDella(k, semi)
  const righe = new Map()
  for (const m of mostri) {
    const ch = `${m.tipo}|${ruoloDi(m)}`
    const r = righe.get(ch) || { tipo: m.tipo, ruolo: ruoloDi(m), lista: [] }
    r.lista.push(m)
    righe.set(ch, r)
  }
  return [...righe.values()].map(({ tipo, ruolo, lista }) => {
    const ossa = media(lista.map(m => m.ossaMax)), att = media(lista.map(m => m.att)), dif = media(lista.map(m => m.dif))
    // il colpo contro ciascun eroe atteso, senza arrotondare (il danno è continuo), la media dei quattro
    const colpo = media(lista.flatMap(m => attesi.map(c => Math.max(1, COLPO_DEL_MOSTRO * (m.att - c.dif)))))
    const abbatterlo = media(lista.flatMap(m => attesi.map(c => Math.ceil(m.ossaMax / Math.max(1, c.att - m.dif)))))
    const potenza = media(lista.map(potenzaDelMostro))
    const colpiPerStendere = vita / colpo
    return { tipo, nome: (MOSTRI[tipo] || {}).nome || tipo, ruolo, n: lista.length, ossa, att, dif, colpo, vita, colpoSuVita: colpo / vita,
             colpiPerStendere, colpiPerAbbatterlo: abbatterlo,
             protezioni: media(lista.map(m => { const d = difeseDi(m); return d.resiste.length + d.immune.length })),
             armati: media(lista.map(m => (m.arma ? 1 : 0))), gradi: media(lista.map(m => (m.grado && m.grado !== 'comune' ? 1 : 0))),
             potenza, esp: media(lista.map(m => esperienzaDi(potenzaDelMostro(m)))), gemme: media(lista.map(m => gemmeDi(potenzaDelMostro(m)))),
             fuoriMisura: colpiPerStendere < COLPI_PER_STENDERE[ruolo] }
  }).sort((a, b) => ['comune', 'caporale', 'grosso'].indexOf(a.ruolo) - ['comune', 'caporale', 'grosso'].indexOf(b.ruolo) || b.n - a.n)
}

// la tabella di tutte le discese, come testo: una per discesa, con le specie che picchiano fuori misura segnate per nome
export function tabellaDelleSpecie(opz = {}) {
  const f = (v, d = 1) => v.toFixed(d)
  const righe = []
  const fuori = []
  CAMPAGNA.forEach((t, k) => {
    const s = specieDella(k, opz)
    righe.push(`\n${t.nome} (eroe atteso al livello ${livelloAtteso(k)}, ${f(s[0].vita, 0)} di vita; fuori misura sotto ${COLPI_PER_STENDERE.comune} colpi per i mostri di strada, ${COLPI_PER_STENDERE.caporale} i caporali, ${COLPI_PER_STENDERE.grosso} il grosso)`)
    righe.push(`${''.padEnd(30)}${'ruolo'.padEnd(9)}${['n', 'ossa', 'att', 'dif', 'colpo', 'colpo/vita %', 'stende in', 'si abbatte in', 'potenza', 'esp', 'gemme'].map(x => x.padStart(13)).join('')}`)
    for (const r of s) {
      righe.push(`${r.nome.slice(0, 29).padEnd(30)}${r.ruolo.padEnd(9)}${[r.n, f(r.ossa), f(r.att), f(r.dif), f(r.colpo), f(100 * r.colpoSuVita, 0), f(r.colpiPerStendere), f(r.colpiPerAbbatterlo), f(r.potenza), f(r.esp, 0), f(r.gemme, 0)].map(x => String(x).padStart(13)).join('')}${r.fuoriMisura ? '  ! picchia fuori misura' : ''}`)
      if (r.fuoriMisura) fuori.push(`${r.nome} (${r.ruolo}, ${t.chiave}): ${f(r.colpo)} a colpo, stende in ${f(r.colpiPerStendere)}`)
    }
  })
  return { testo: righe.join('\n'), fuori }
}

/* Il grado pesa (docs/sotterraneo/varianti.md, «Il grado pesa»): per discesa, ruolo e grado, le ossa e l'attacco medi dei mostri dei piani veri e il colpo contro
   la vita dell'eroe atteso. Un nome epico deve essere un mostro più duro: la tabella lo dice con i numeri. */
export function tabellaDeiGradi({ semi = [1, 2, 3], eroi = EROI } = {}) {
  const f = (v, d = 1) => v.toFixed(d)
  const righe = []
  CAMPAGNA.forEach((t, k) => {
    const attesi = eroi.map(e => eroeAtteso(e, livelloAtteso(k)))
    const vita = media(attesi.map(c => c.vitaConLaRoba))
    const gruppi = new Map()
    for (const m of mostriDella(k, semi)) {
      const ch = `${ruoloDi(m)}|${m.grado || 'comune'}`
      if (!gruppi.has(ch)) gruppi.set(ch, [])
      gruppi.get(ch).push(m)
    }
    righe.push(`\n${t.nome} (${f(vita, 0)} di vita)`)
    for (const [ch, lista] of [...gruppi].sort((a, b) => a[0].localeCompare(b[0]))) {
      const colpo = media(lista.flatMap(m => attesi.map(c => Math.max(1, COLPO_DEL_MOSTRO * (m.att - c.dif)))))
      righe.push(`  ${ch.replace('|', ' ').padEnd(24)}n ${String(lista.length).padStart(4)}  ossa ${f(media(lista.map(m => m.ossaMax)), 1).padStart(6)}  att ${f(media(lista.map(m => m.att))).padStart(5)}  colpo ${f(colpo).padStart(5)} (${f(100 * colpo / vita, 0)}% della vita)`)
    }
  })
  return righe.join('\n')
}
