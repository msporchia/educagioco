/* ═══════════════════════════════════════════════════════════════════
   I NOMI NUOVI DEI DUNGEON — docs/sotterraneo/mondo-aperto-progetto.md (la regola dei nomi), mondo-aperto-fasi.md (fase 8)

   I sette dungeon e l'abisso hanno gli stessi nomi nel mondo 3D (dati/mondo-aperto.js) e nelle tappe che il minatore, i capitoli,
   le missioni e i dialoghi nominano (dati/campagna.js): i nomi dicono l'interno e valgono anche per il Sotterraneo di sempre, la
   geografia no (LUOGHI per la mappa dipinta, LUOGHI_MONDO per il mondo aperto). Le chiavi non cambiano mai. Nessun testo del
   gioco dice più un nome di prima.
   ═══════════════════════════════════════════════════════════════════ */
import { INGRESSI_DEL_MONDO } from '../../src/giochi/sotterraneo/dati/mondo-aperto.js'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { LUOGHI, LUOGHI_MONDO, POSTO_DI, POZZO_VECCHIO, luogoDi } from '../../src/giochi/sotterraneo/dati/terra.js'
import { CAPITOLI, STORIA } from '../../src/giochi/sotterraneo/dati/storia.js'
import { VOLTI } from '../../src/giochi/sotterraneo/dati/zone.js'
import { DIALOGHI } from '../../src/giochi/sotterraneo/dati/dialoghi.js'
import { MISSIONI } from '../../src/giochi/sotterraneo/dati/missioni.js'
import { NOVITA_DI } from '../../src/giochi/sotterraneo/dati/novita.js'
import { GROSSI } from '../../src/giochi/sotterraneo/dati/grossi.js'
import { strada } from '../../src/giochi/sotterraneo/motore/dialoghi.js'
import { storiaDelDiario } from '../../src/giochi/sotterraneo/motore/missioni.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const NUOVI = ['La cripta dei re', 'Le cantine dei goblin', 'La torre bruciata', 'La tana dei ragni', 'Le sale allagate',
               'La porta dell\'inferno', 'Le miniere di brace']
stessaLista('le sette tappe hanno i nomi nuovi', CAMPAGNA.map(t => t.nome), NUOVI)
stessaLista('le chiavi non sono cambiate', CAMPAGNA.map(t => t.chiave), ['altare', 'cantine', 'torre', 'gallerie', 'cisterna', 'labirinto', 'fondo'])
for (const t of CAMPAGNA) uguale(`${t.chiave}: lo stesso nome nel mondo 3D e nelle tappe`, INGRESSI_DEL_MONDO[t.chiave].nome, t.nome)
uguale('il pozzo ha lo stesso nome chiuso e nel mondo', POZZO_VECCHIO.nome, INGRESSI_DEL_MONDO.abisso.nome)

// nessun testo nomina un posto con il nome di prima
const VECCHI = /scalinata|torre in rovina|grotta della scaletta|scala sommersa|botola segreta|miniera abbandonata|pozzo vecchio|cripta dell'altare|vecchia miniera/i
const testi = []
const raccogli = (x, via) => { if (typeof x === 'string') testi.push([via, x]); else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) raccogli(v, `${via}.${k}`) }
raccogli(CAPITOLI, 'CAPITOLI'); raccogli(STORIA, 'STORIA'); raccogli(VOLTI, 'VOLTI'); raccogli(DIALOGHI, 'DIALOGHI'); raccogli(NOVITA_DI, 'NOVITA')
raccogli(MISSIONI.map(m => ({ dice: m.dice, grazie: m.grazie, ritorno: m.ritorno })), 'MISSIONI'); raccogli(GROSSI, 'GROSSI')
raccogli(LUOGHI, 'LUOGHI'); raccogli(LUOGHI_MONDO, 'LUOGHI_MONDO'); raccogli(CAMPAGNA.map(t => [t.nome, t.dove, t.dritta]), 'CAMPAGNA')
const vecchi = testi.filter(([, t]) => VECCHI.test(t))
controlla('nessun testo dice un nome di prima', vecchi.length === 0, vecchi.map(([v, t]) => `${v}: ${t.slice(0, 60)}`).join(' | '))

// la geografia: la mappa dipinta e il mondo aperto, una strada per ogni discesa e per l'abisso
for (const k of [...CAMPAGNA.map(t => t.chiave), 'abisso']) {
  controlla(`${k}: la strada della mappa dipinta`, !!LUOGHI[POSTO_DI[k]])
  controlla(`${k}: la strada del mondo aperto`, !!LUOGHI_MONDO[k] && LUOGHI_MONDO[k] !== LUOGHI[POSTO_DI[k]])
  stessaLista(`${k}: luogoDi sceglie la geografia`, [luogoDi(k), luogoDi(k, true)], [LUOGHI[POSTO_DI[k]], LUOGHI_MONDO[k]])
  controlla(`${k}: la strada del mondo non usa i punti cardinali`, !/\b(nord|sud|est|ovest)\b/i.test(LUOGHI_MONDO[k]), LUOGHI_MONDO[k])
}

// il minatore: nel mondo 3D la strada è del mondo aperto, nel 2D della mappa dipinta
const tappe = CAMPAGNA.map((t, i) => ({ ...t, indice: i, adesso: i === 2, aperta: true, fatta: i < 2 }))
const detto = ctx => strada({ stati: {}, tappe, ...ctx }).find(p => p.dato === 'detto').testo
uguale('2D: la strada dipinta', detto({}), `La torre bruciata: ${LUOGHI.torre}.`)
uguale('3D: la strada del mondo aperto', detto({ mondo: true }), `La torre bruciata: ${LUOGHI_MONDO.torre}.`)
uguale('il diario 3D', storiaDelDiario(tappe, null, true).corrente.luogo, LUOGHI_MONDO.torre)
uguale('il diario 2D', storiaDelDiario(tappe).corrente.luogo, LUOGHI.torre)

riassunto('i nomi nuovi dei dungeon')
