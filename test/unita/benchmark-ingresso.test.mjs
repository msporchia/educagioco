/* L'ingresso nella misura coi modelli veri (docs/core/vecchio-telefono-veri.md, «L'ingresso»): la riga tiene i tre giri in fila
   (fotogramma più lungo, sopra 100 ms, programmi, riscaldamento, i tre attacchi e i loro shader), la LETTURA confronta col
   riscaldamento e senza e dice se serve, la riga DATI li porta allo strumento. */
import { componiVeri, letturaVeri } from '../../src/grafica/benchmark/log-veri.js'
import { rigaIngresso } from '../../src/grafica/benchmark/log-ingresso.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const ing = (id, extra) => ({ id, gruppo: 'ingresso', nome: id, tipo: 'ingresso', giri: 3, p1: [38, 38, 38], p3: [52, 52, 52], daScaldare: [0, 0, 0], scaldato: [null, null, null], att: null, sh: null, ...extra })
const risultati = [
  ing('ing-sot', { max: [2300, 1900, 2100], lenti: [6, 5, 5], daScaldare: [9, 9, 9], scaldato: [2400, 2600, 2300], att: [[60, 55, 50], [70, 50, 48], [65, 52, 49]], sh: [[0, 1, 0], [0, 0, 0], [1, 0, 0]] }),
  ing('ing-sot-x', { max: [2200, 2000, 2050], lenti: [6, 6, 5], att: [[900, 300, 60], [850, 280, 55], [700, 260, 58]], sh: [[14, 6, 1], [14, 6, 1], [14, 6, 1]] }),
  ing('ing-presto', { max: [2500, 2400, 2300], lenti: [7, 7, 6], att: [[800], [760], [820]], sh: [[14], [13], [14]] }),
  ing('ing-presto-x', { max: [2500, 2450, 2350], lenti: [7, 7, 6], att: [[810], [770], [800]], sh: [[14], [14], [14]] }),
  ing('ing-mondo', { max: [1500, 1400, 1450], lenti: [8, 7, 7] }),
  ing('ing-mondo-x', { max: [1480, 1420, 1460], lenti: [8, 8, 7] }),
  ing('ing-zaino', { max: [2600, 2500, 2700], lenti: [12, 11, 12] }),
]
const righe = letturaVeri({ risultati }).join('\n')
const testo = componiVeri({ risultati, info: {}, gruppi: { ingresso: { carica: [100], dpr: [], programmi: 0 } } })

controlla('la riga ha i tre giri e i tre attacchi', /XX ing-sot: max 2300\/1900\/2100 ms, >100ms 6\/5\/5, prog 38\/38\/38→52\/52\/52 da scaldare 9\/9\/9 scaldato 2\.4\/2\.6\/2\.3s; attacchi 1° 60\/70\/65 \+0\/0\/1sh 2° 55\/50\/52 \+1\/0\/0sh 3° 50\/48\/49 \+0\/0\/0sh/.test(testo),
  testo.split('\n').find(r => /ing-sot:/.test(r)))
controlla('senza attacchi né riscaldamento la riga è corta', rigaIngresso(risultati[4]) === 'XX ing-mondo: max 1500/1400/1450 ms, >100ms 8/7/7, prog 38/38/38→52/52/52')
controlla('il riscaldamento toglie dal primo attacco', /INGRESSO in un piano: fotogramma più lungo 2100 ms \(giri 2300\/1900\/2100\), senza riscaldamento 2050; primo attacco 65 ms, senza 850: il riscaldamento toglie 785 ms dal primo attacco; shader nuovi ai tre attacchi 0\/0\/0 \(senza 14\/6\/1\)/.test(righe), righe)
controlla('l\'attacco presto si vede', /Attacco a 0,5 s dall'ingresso \(prima del riscaldamento\): 800 ms, senza riscaldamento 800 = si vede il fermo/.test(righe), righe)
controlla('nel mondo il riscaldamento non serve', /Ingresso nel mondo di sopra: fotogramma più lungo 1450 ms, 7 sopra 100 ms; senza riscaldamento 1460 ms: non serve \(toglie 10 ms, nel rumore\)/.test(righe), righe)
controlla('lo zaino appena entrati', /Entrare e aprire subito lo zaino: fotogramma più lungo 2600 ms, 12 fotogrammi sopra 100 ms/.test(righe), righe)
const dd = JSON.parse(testo.split('DATI ')[1])
uguale('la riga DATI dell\'ingresso', JSON.stringify(dd.r.find(r => r[0] === 'ing-presto')), JSON.stringify(['ing-presto', 'ing', [2500, 2400, 2300], [7, 7, 6], [[800], [760], [820]], [[14], [13], [14]], [38, 38, 38], [52, 52, 52]]))
riassunto("l'ingresso nella misura coi modelli veri")
