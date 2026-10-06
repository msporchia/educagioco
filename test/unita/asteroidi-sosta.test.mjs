/* Il volo e la tappa degli asteroidi lasciati a metà: si scrive, si rilegge,
   ed è la stessa partita — vite, livello, punti, serie, gettoni, monete e la
   domanda aperta. Quello che non torna non si legge. Vedi docs/asteroidi/sosta.md.
   `node test/esegui.mjs asteroidi-sosta --niente-build` */
import { SCALETTA } from '../../src/data/asteroidi.js'
import { scrivi, leggi, dice, recordDi, chiaveDi, voceDi, VERSIONE }
  from '../../src/motore/asteroidi/sosta.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const hud = (o = {}) => ({ vite: 2, punti: 130, giuste: 14, mirate: 6, sbagliate: 3, livello: 3,
                           partenza: 1, serie: 4, serieMax: 9, ...o })
const aperta = (o = {}) => ({ chiave: 'math:7x8', a: 8, b: 7, ris: 56, testo: '8 × 7 = ?',
                              peso: 1, difficile: true, esercizio: null, boss: false,
                              anticipo: false, gelo: true, tolti: 2, quota: 0.4137, ms: 1234.6, ...o })
const partita = (chiave, o = {}) => ({
  chiave, hud: hud(), tasca: { gelo: 1, mirino: 2 }, ultimoGettone: 'mirino', chieste: 17,
  magazzino: 'mente', monete: { chiesto: 3, dato: 2, mostrate: 2 }, aperta: aperta(), ...o })
const viaJSON = x => JSON.parse(JSON.stringify(x))

/* ══════════ 1. una tappa a metà ══════════ */
{
  const v = SCALETTA.find(x => x.tipo === 'mente' && x.i === 3)
  const chiave = chiaveDi(v)
  uguale('la chiave di una stazione', chiave, 'm3')
  uguale('si ritrova per chiave', voceDi(chiave), v)

  const dato = viaJSON(scrivi(partita(chiave)))
  uguale('il salvataggio dice la sua versione', dato.v, VERSIONE)
  controlla('e sta in poche centinaia di byte', JSON.stringify(dato).length < 900,
            `${JSON.stringify(dato).length} byte`)
  const l = leggi(dato, {})
  controlla('si rilegge', !!l)
  uguale('sulla stessa voce', l.voce, v)
  uguale('con le stesse vite, livello e punti',
         JSON.stringify([l.hud.vite, l.hud.livello, l.hud.punti, l.hud.giuste, l.hud.mirate]),
         JSON.stringify([2, 3, 130, 14, 6]))
  uguale('la serie e il filotto più lungo', JSON.stringify([l.hud.serie, l.hud.serieMax]), '[4,9]')
  uguale('i gettoni in tasca', JSON.stringify(l.tasca), '{"gelo":1,"mirino":2}')
  uguale('e quale è uscito per ultimo', l.ultimoGettone, 'mirino')
  uguale('le domande già fatte (il boss ogni otto)', l.chieste, 17)
  uguale('le monete già prese', JSON.stringify(l.monete), '{"chiesto":3,"dato":2,"mostrate":2}')
  uguale('la domanda aperta è la stessa', l.aperta.testo, '8 × 7 = ?')
  uguale('col gelo già speso', l.aperta.gelo, true)
  uguale('e i falsi già tolti', l.aperta.tolti, 2)
  uguale('il sasso giusto a un po\' più di un terzo della strada', l.aperta.quota, 0.414)
  uguale('il cronometro di prima, tondo', l.aperta.ms, 1235)

  const d = dice(dato, {})
  uguale('la mappa dice la tappa', d.nome, v.T.nome)
  uguale('e a che punto era', JSON.stringify([d.livello, d.vite, d.giuste, d.bersaglio]),
         JSON.stringify([3, 2, 14, v.T.bersaglio]))
  uguale('il lucchetto dell\'età chiude la tappa', dice(dato, { aperta: () => false }), null)
}

/* ══════════ 2. il volo, e il conto a mente nella domanda aperta ══════════ */
{
  const e = { a: 96, b: 12, segno: ':', ris: 8, testo: '96 : 12 = ?', id: 'dividere', peso: 2 }
  const dato = viaJSON(scrivi(partita('volo', { magazzino: 'tabelline',
    aperta: aperta({ chiave: 'math:8x12', a: 96, b: 12, ris: 8, testo: '96 : 12 = ?',
                     peso: 2, esercizio: e, boss: true }) })))
  uguale('il volo non si apre a fila non finita', leggi(dato, { libera: false }), null)
  uguale('e la mappa non offre niente', dice(dato, { libera: false }), null)
  const l = leggi(dato, { libera: true })
  controlla('a fila finita si rilegge', !!l)
  uguale('è il volo', l.volo, true)
  uguale('con la posizione -1', l.posizione, -1)
  uguale('il conto girato torna con tutti i suoi campi', JSON.stringify(l.aperta.esercizio), JSON.stringify(e))
  uguale('e il boss resta boss', l.aperta.boss, true)
  const d = dice(dato, { libera: true })
  uguale('la carta dice i punti', JSON.stringify([d.volo, d.punti, d.livello]), '[true,130,3]')
  const r = recordDi(dato)
  uguale('il record di un volo a metà sono i suoi punti', r.punti, 130)
  uguale('con i dettagli del quaderno', JSON.stringify(r.dettagli), '{"livello":3,"centri":14,"serie":9}')
  uguale('letto anche se la versione è un\'altra', recordDi({ ...dato, v: VERSIONE + 7 }).punti, 130)
  uguale('una tappa non ha record', recordDi(viaJSON(scrivi(partita('p2')))), null)
}

/* ══════════ 3. la domanda che non torna non butta la partita ══════════ */
{
  const dato = viaJSON(scrivi(partita('p4')))
  const guasta = { ...dato, aperta: { ...dato.aperta, ris: 'cinquantasei' } }
  const l = leggi(guasta, {})
  controlla('la partita si legge lo stesso', !!l)
  uguale('ma senza la domanda: ne nasce una nuova', l.aperta, null)
  const senza = viaJSON(scrivi(partita('p4', { aperta: null })))
  uguale('una sosta fra una domanda e l\'altra non ha domanda', leggi(senza, {}).aperta, null)
}

/* ══════════ 4. quello che non torna non si legge ══════════ */
{
  const dato = viaJSON(scrivi(partita('p4')))
  const guasto = (cosa, d) => uguale(cosa, leggi(d, {}), null)
  guasto('una versione diversa', { ...dato, v: VERSIONE + 1 })
  guasto('una tappa che non c\'è più', { ...dato, chiave: 'p99' })
  guasto('le vite a zero', { ...dato, hud: { ...dato.hud, vite: 0 } })
  guasto('più vite del tetto', { ...dato, hud: { ...dato.hud, vite: 9 } })
  guasto('un punteggio che non è un numero', { ...dato, hud: { ...dato.hud, punti: 'molti' } })
  guasto('una partenza sopra il livello', { ...dato, hud: { ...dato.hud, partenza: 7 } })
  guasto('più gettoni del tetto', { ...dato, tasca: { gelo: 9, mirino: 0 } })
  guasto('un gettone che non esiste', { ...dato, ultimoGettone: 'scudo' })
  guasto('un magazzino che non esiste', { ...dato, magazzino: 'cucina' })
  guasto('monete negative', { ...dato, monete: { chiesto: -1, dato: 0, mostrate: 0 } })
  guasto('niente', null)
  uguale('e senza salvataggio nessuna carta', dice(null, {}), null)
}

/* ══════════ 5. una partita finita, o appena cominciata, non si scrive ══════════ */
{
  uguale('una partita finita non si scrive', scrivi(partita('p4', { finito: true })), null)
  uguale('senza una risposta data non c\'è niente da riprendere',
         scrivi(partita('p4', { hud: hud({ giuste: 0, sbagliate: 0, punti: 0 }) })), null)
  controlla('un sasso caduto conta come risposta',
            !!scrivi(partita('p4', { hud: hud({ giuste: 0, sbagliate: 1, punti: 0 }) })))
  uguale('niente di niente', scrivi(null), null)
}

riassunto('asteroidi — la partita lasciata a metà')
