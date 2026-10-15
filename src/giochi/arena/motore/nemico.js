// Il nemico: gioca con le stesse regole e le stesse monete del giocatore, e
// non bara (non vede niente che a schermo non si veda). Segue una SCALETTA — una
// serie di mosse buone, scelta a caso fra poche all'inizio — e la interrompe
// quando serve: la bomba e la riparazione se lo stanno schiacciando, il castello
// e le difese se vede che l'avversario sta vincendo. Spende quello che ha:
// finite le mosse della scaletta continua con una regola sola, senza lasciare
// monete ferme. Con la «furbizia» (da 0 a 1, della tappa) ragiona invece di seguire
// la scaletta: la truppa che batte la tua, i potenziamenti concentrati, l'attacco a chi
// prende la miniera scoperto. È più bravo, non più ricco. Ogni partita ha un CARATTERE diverso
// (più aggressivo, più prudente, più minatore, meno riparatore…). Perché così: docs/arena/nemico.md.
import { TRUPPE, LIV_MAX, BOMBA, CAMPO, EDIFICIO_DI, POSTI } from '../dati/regole.js'

// quante caserme al più: le piazzole meno una, che resta per la miniera
const CASERME = POSTI.length - 1

/* Una scaletta parla di ruoli, non di truppe: per ogni tappa il ruolo diventa la
   prima truppa che c'è (quelle di una tappa sono poche). */
const RUOLI = {
  base: ['scheletri', 'guardiano'],
  tank: ['guardiano', 'golem'],
  veloce: ['lupi', 'bestie'],            // le bestie sono la tana di neve e lava, dove i lupi non ci sono
  splash: ['negromante', 'diavoletto'],
  volo: ['pipistrelli', 'drago'],
}

const SCALETTE = {
  // tante truppe e presto: chi non si difende bene perde la corsa
  assalto: [['costruisci', 'tank'], ['costruisci', 'veloce'], ['potenzia', 'base'], ['costruisci', 'splash'],
            ['potenzia', 'tank'], ['costruisci', 'volo'], ['castello'], ['miniera'], ['potenzia', 'veloce']],
  // prima le monete, poi tutto insieme
  economia: [['miniera'], ['costruisci', 'tank'], ['miniera'], ['costruisci', 'splash'], ['castello'],
             ['costruisci', 'veloce'], ['miniera'], ['costruisci', 'volo'], ['potenzia', 'splash']],
  // il castello e chi ferisce a gruppi: resiste, poi rovescia
  bastione: [['castello'], ['costruisci', 'splash'], ['costruisci', 'tank'], ['castello'], ['miniera'],
             ['costruisci', 'volo'], ['potenzia', 'splash'], ['costruisci', 'veloce']],
  // quasi solo monete: poche truppe, e tardi
  minatore: [['miniera'], ['miniera'], ['costruisci', 'tank'], ['miniera'], ['miniera'], ['costruisci', 'splash'],
             ['castello'], ['miniera'], ['costruisci', 'veloce'], ['costruisci', 'volo']],
  // chi vola passa sopra i muri, chi ferisce a gruppi pulisce
  volante: [['costruisci', 'volo'], ['costruisci', 'splash'], ['potenzia', 'volo'], ['costruisci', 'veloce'],
            ['castello'], ['miniera'], ['potenzia', 'splash'], ['costruisci', 'tank']],
  // pochi edifici, tutti alti, dietro un castello solido
  muraglia: [['castello'], ['costruisci', 'tank'], ['potenzia', 'tank'], ['castello'], ['costruisci', 'splash'],
             ['miniera'], ['potenzia', 'tank'], ['potenzia', 'splash']],
  // una caserma dopo l'altra, senza potenziare: tante squadre piccole
  sciame: [['costruisci', 'veloce'], ['costruisci', 'tank'], ['costruisci', 'volo'], ['costruisci', 'splash'],
           ['costruisci', 'base'], ['potenzia', 'veloce'], ['castello']],
}

/* Il carattere: una scaletta e quattro manopole. Mai gli stessi numeri di una partita all'altra.
   - riparaSotto: sotto quale frazione di vita ripara un edificio (il muro crollato lo ripara chi ripara di più)
   - miniere: quanto conta l'economia (1 = come prima: fino a 4 miniere nei primi 100 s)
   - prudenza: quanto presto si sente in svantaggio e smette la scaletta per rafforzare (1 = come prima)
   - bomba: quanto fitto deve essere l'ammasso perché la lanci (peso) */
export const CARATTERI = {
  assalto:  { scaletta: 'assalto',  riparaSotto: 0.35, riparaMuro: false, miniere: 0.5, prudenza: 0.4, bomba: 450 },
  sciame:   { scaletta: 'sciame',   riparaSotto: 0.25, riparaMuro: false, miniere: 0.4, prudenza: 0.6, bomba: 500 },
  economia: { scaletta: 'economia', riparaSotto: 0.5,  riparaMuro: true,  miniere: 1.2, prudenza: 1,   bomba: 600 },
  minatore: { scaletta: 'minatore', riparaSotto: 0.5,  riparaMuro: true,  miniere: 2,   prudenza: 1,   bomba: 600 },
  bastione: { scaletta: 'bastione', riparaSotto: 0.7,  riparaMuro: true,  miniere: 0.8, prudenza: 1.6, bomba: 700 },
  muraglia: { scaletta: 'muraglia', riparaSotto: 0.85, riparaMuro: true,  miniere: 0.7, prudenza: 2,   bomba: 750 },
  volante:  { scaletta: 'volante',  riparaSotto: 0.45, riparaMuro: true,  miniere: 1,   prudenza: 0.8, bomba: 550 },
}

/* sale a ogni ritocco del modo di giocare del nemico: entra nella firma dell'equilibrio (`firma.js`),
   così un'IA cambiata senza ritarare è un test rosso */
export const VERSIONE_IA = 10

/* `evita`: il carattere dell'ultima partita, per non giocare due volte di fila contro lo stesso */
export function creaIA(rnd, evita = null) {
  const nomi = Object.keys(CARATTERI).filter(n => n !== evita)
  const nome = nomi[Math.floor(rnd() * nomi.length)]
  return { nome, passo: 0, ...CARATTERI[nome] }
}

/* il ruolo di un passo → per costruire la truppa (meglio una che non ha ancora), per potenziare la
   piazzola della sua caserma più indietro con quel ruolo */
function truppaDel(p, ruolo, costruire) {
  const mie = p.casermeDi('nem')
  if (costruire) {
    const buone = RUOLI[ruolo].filter(id => p.truppeAmmesse.includes(id) && p.prezzo('nem', 'costruisci', id) !== null)
    return buone.find(id => !mie.some(c => c.id === id)) || buone[0] || null
  }
  const sue = mie.filter(c => RUOLI[ruolo].includes(c.id)).sort((a, b) => a.liv - b.liv)
  return sue.length ? sue[0].posto : null
}

/* una mossa si può fare adesso? */
const si = (p, azione, id) => p.puoFare('nem', azione, id)

/* il nemico si sente in svantaggio quando il suo castello sta peggio di quello dell'avversario,
   l'avversario ha molte più caserme o gliene ha abbattute di più (il castello cade per ultimo) */
function sottoPressione(p) {
  const a = p.vitaBase('nem'), b = p.vitaBase('io'), k = p.ia.prudenza
  const livelli = lato => p.casermeDi(lato).reduce((s, c) => s + c.liv, 0)
  return a < b - 0.1 / k || livelli('io') > livelli('nem') * (1 + 0.3 / k) + 1 / k ||
         p.lati.io.abbattuti > p.lati.nem.abbattuti + (k >= 1 ? 1 : 2)
}

/* una mossa dall'emergenza: la bomba su un ammasso che arriva, o una riparazione */
function emergenza(p) {
  const l = p.lati.nem
  const colpo = l.bombe > 0 ? p.puntoDellaBomba('nem') : null
  if (colpo && colpo.peso >= p.ia.bomba && p.fai('nem', 'bomba')) return true
  const messi = p.riparabili('nem')
  const muro = p.muro('nem')
  const crollato = !!muro && muro.hp <= 0 && p.ia.riparaMuro
  const quasiMorti = messi.some(e => e.hp < e.max * p.ia.riparaSotto)
  if ((crollato || quasiMorti) && si(p, 'ripara') && p.fai('nem', 'ripara')) return true
  return false
}

/* le mosse da fare in ordine di priorità quando non c'è una scaletta da seguire (o è finita) */
function candidate(p, difesa) {
  const l = p.lati.nem
  const castello = p.castello('nem')
  const mie = p.casermeDi('nem')
  const mediaLiv = mie.length ? mie.reduce((s, c) => s + c.liv, 0) / mie.length : 1
  const lista = []
  const aggiungi = (azione, id) => { const pr = p.prezzo('nem', azione, id); if (pr !== null) lista.push({ azione, id, prezzo: pr }) }
  const ha = id => mie.some(c => c.id === id)
  const costruibili = Object.keys(TRUPPE).filter(id => p.prezzo('nem', 'costruisci', id) !== null)
    .sort((a, b) => ha(a) - ha(b) || TRUPPE[a].costo - TRUPPE[b].costo)   // prima quelle che non ha
  const bassa = [...mie].filter(c => c.liv < LIV_MAX).sort((a, b) => a.liv - b.liv)

  if (difesa) {
    // chi sta perdendo rafforza: castello, riparazioni, poi chi ferisce a gruppi e chi vola
    if (castello.liv <= mediaLiv + 2) aggiungi('castello')
    if (p.riparabili('nem').some(e => e.hp < e.max * Math.min(0.85, p.ia.riparaSotto + 0.15))) aggiungi('ripara')
    for (const c of bassa.slice(0, 2)) aggiungi('potenzia', c.posto)
    for (const id of costruibili.slice(0, 2)) aggiungi('costruisci', id)
  } else {
    if (costruibili.length && mie.length < CASERME) aggiungi('costruisci', costruibili[0])
    if (castello.liv < mediaLiv - 0.5) aggiungi('castello')
    if (l.miniera < 1 + 3 * p.ia.miniere && p.t < 100 * p.ia.miniere) aggiungi('miniera')
    for (const c of bassa.slice(0, 2)) aggiungi('potenzia', c.posto)
    for (const id of costruibili.slice(0, 1)) aggiungi('costruisci', id)
    aggiungi('castello')
  }
  return lista
}

/* Una sola mossa; torna true se l'ha fatta. Le monete non restano ferme: se la prima scelta
   costa più di quanto ha e non è lontana, aspetta; se è lontana, passa alla successiva. */
function mossa(p) {
  if (emergenza(p)) return true
  const l = p.lati.nem
  // senza caserme la prima cosa è la cripta (all'inizio, o se gliele hanno abbattute tutte)
  if (!p.casermeDi('nem').length) {
    const id = truppaDel(p, 'base', true)
    if (id && si(p, 'costruisci', id)) return p.fai('nem', 'costruisci', id)
  }
  const difesa = sottoPressione(p)

  if (!difesa && p.ia.passo < SCALETTE[p.ia.scaletta].length) {
    const passo = SCALETTE[p.ia.scaletta][p.ia.passo]
    const [azione, ruolo] = passo
    let id = null
    if (ruolo) id = truppaDel(p, ruolo, azione === 'costruisci')
    const possibile = azione === 'miniera' || azione === 'castello' ? p.prezzo('nem', azione) !== null : id !== null && p.prezzo('nem', azione, id) !== null
    if (!possibile) { p.ia.passo++; return true }           // questo passo non c'è in questa tappa: si salta
    if (si(p, azione, id)) { p.fai('nem', azione, id); p.ia.passo++; return true }
    return false                                            // si aspetta di avere le monete per il passo
  }

  const lista = candidate(p, difesa)
  if (!lista.length) return false
  const prima = lista[0]
  if (l.monete >= prima.prezzo) return p.fai('nem', prima.azione, prima.id)
  if (l.monete >= prima.prezzo * 0.6) return false          // ci siamo quasi: si risparmia
  const altra = lista.find(o => l.monete >= o.prezzo)
  return altra ? p.fai('nem', altra.azione, altra.id) : false
}

/* ── la testa: quando la furbizia vince il tiro, si ragiona invece di seguire la scaletta ── */

/* chi batte chi: i duelli di docs/arena/regole.md (gli arcieri fermano chi vola, chi colpisce
   da vicino batte chi tira, chi tira ad area le file, chi vola chi colpisce solo a terra) */
const BATTE = {
  scheletri: ['pipistrelli', 'drago'],
  guardiano: ['scheletri', 'negromante', 'diavoletto', 'golem', 'bestie'],
  lupi: ['scheletri', 'negromante', 'diavoletto', 'golem'],
  bestie: ['scheletri', 'negromante', 'diavoletto'],
  negromante: ['scheletri', 'guardiano', 'lupi', 'pipistrelli'],
  diavoletto: ['scheletri', 'guardiano', 'lupi'],
  pipistrelli: ['guardiano', 'lupi', 'bestie', 'diavoletto', 'golem'],
  drago: ['guardiano', 'lupi', 'bestie', 'diavoletto', 'golem'],
  golem: [],
}

/* quanto conviene una truppa contro quello che ha l'avversario: chi batte, meno chi la batte,
   pesati sul livello delle sue caserme e sulle sue truppe che stanno già entrando */
function convenienza(id, sue, dentro) {
  let v = 0
  for (const c of sue) v += (BATTE[id].includes(c.id) ? c.liv : 0) - (BATTE[c.id].includes(id) ? c.liv : 0)
  for (const u of dentro) v += (BATTE[id].includes(u.id) ? 0.5 : 0) - (BATTE[u.id].includes(id) ? 0.5 : 0)
  if (id === 'golem') v += sue.length <= 1 ? 1 : 0          // contro chi non ha esercito si va alle mura
  return v
}

function testa(p) {
  const l = p.lati.nem, io = p.lati.io
  const mie = p.casermeDi('nem'), sue = p.casermeDi('io')
  // le truppe dell'avversario già nella sua metà (il nemico sta in alto)
  const dentro = p.unita.filter(u => u.lato === 'io' && u.hp > 0 && u.y < CAMPO.fiume.alto)
  const livelli = cs => cs.reduce((s, c) => s + c.liv, 0)
  // anche una truppa che ha già, se è quella che conviene (le piazzole sono libere)
  const nuove = p.truppeAmmesse.filter(id => p.prezzo('nem', 'costruisci', id) !== null)
    .sort((a, b) => convenienza(b, sue, dentro) - convenienza(a, sue, dentro) || TRUPPE[a].costo - TRUPPE[b].costo)
  const salibili = mie.filter(c => c.liv < LIV_MAX)
    .sort((a, b) => convenienza(b.id, sue, dentro) + b.liv * 0.3 - convenienza(a.id, sue, dentro) - a.liv * 0.3)
  const castello = p.castello('nem')
  // la prima mossa è la cripta, come nella scaletta: provato lasciar scegliere, e contro chi non ha
  // ancora niente il golem sembrava il migliore e il nemico restava fermo a risparmiare
  if (!mie.length) {
    const id = nuove.find(i => EDIFICIO_DI[i] === 'cripta')
    return !!id && si(p, 'costruisci', id) && p.fai('nem', 'costruisci', id)
  }

  const obiettivi = []
  const vuoi = (azione, id) => { const pr = p.prezzo('nem', azione, id); if (pr !== null) obiettivi.push({ azione, id, prezzo: pr }) }
  if (mie.length < 2 && nuove.length) vuoi('costruisci', nuove[0])
  // c'è qualcuno in casa: la truppa che lo batte, nuova o potenziata
  if (dentro.length) {
    if (nuove.length && convenienza(nuove[0], [], dentro) > 0 && mie.length < CASERME) vuoi('costruisci', nuove[0])
    if (salibili.length) vuoi('potenzia', salibili[0].posto)
    if (castello.liv < Math.max(...sue.map(c => c.liv), 1)) vuoi('castello')
  }
  // l'avversario fa economia (più miniera): la si fa anche noi, se non c'è nessuno in casa. Provato
  // ad attaccarlo, prima con una caserma sola e poi con tre: le squadre morivano sotto il suo
  // castello, che sotto casa picchia il triplo, e chi faceva economia vinceva sempre
  if (io.miniera > l.miniera && !dentro.length && p.ia.miniere >= 0.7) vuoi('miniera')
  // al sicuro: le monete crescono, anche se l'avversario ha più caserme (chi attacca subito lo può punire)
  if (!dentro.length && l.miniera < 1 + 2 * p.ia.miniere && p.t < 150 * p.ia.miniere) vuoi('miniera')
  if (mie.length < CASERME && nuove.length) vuoi('costruisci', nuove[0])
  if (castello.liv < Math.max(...sue.map(c => c.liv), 1) - 1) vuoi('castello')
  if (salibili.length) vuoi('potenzia', salibili[0].posto)
  if (l.miniera < 1 + 5 * p.ia.miniere && p.t < 200 * p.ia.miniere) vuoi('miniera')
  vuoi('castello')

  if (!obiettivi.length) return false
  const primo = obiettivi[0]
  if (l.monete >= primo.prezzo) return p.fai('nem', primo.azione, primo.id)
  if (l.monete >= primo.prezzo * 0.5) return false           // si risparmia per la cosa giusta
  const altro = obiettivi.find(o => l.monete >= o.prezzo && o.azione !== 'castello')
  return altro ? p.fai('nem', altro.azione, altro.id) : false
}

export function pensaNemico(p, dt) {
  p.pensa -= dt
  if (p.pensa > 0) return
  p.pensa = p.nemicoCfg.pensa
  const ragiona = p.rnd() < (p.nemicoCfg.furbizia || 0)
  for (let giro = 0; giro < 4; giro++) {                      // più mosse di fila se le monete ci sono
    if (ragiona ? !(emergenza(p) || testa(p)) : !mossa(p)) break
  }
}
