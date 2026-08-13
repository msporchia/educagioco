/* ═══════════════════════════════════════════════════════════════════
   LA VETRINA — tutto il catalogo grafico del Generale, in fila

   `banco.js` risponde a «come viene questa stanza mentre si gioca».
   `catalogo.js` risponde a «come viene questa tessitura, da sola». Qui
   la domanda è una terza, e prima non aveva un posto dove farsi fare:
   **esiste un pittore per ogni cosa che i dati possono nominare, e lo
   sa disegnare in ogni stato?**

   Non è un test — CLAUDE.md è esplicito sul perché: nessuna prova del
   Generale guarda i pixel, quindi una porta che si apre e resta
   dipinta chiusa non fa scattare niente di rosso. Questa pagina non
   controlla, **mostra**: mette in fila ogni figura, in ogni stato, con
   sotto il nome esatto (`che: '…'`) con cui la nomina un livello, e un
   occhio umano fa il resto.

   ── il patto con `che si vede qui è vero` ──
   Si chiamano `PITTORI` di `grafica/generale.js` — la stessa tabella
   che usa `CampoLivello.vue` — passando descrittori fatti a mano. Non
   c'è un disegno rifatto per l'occasione: se un cavaliere qui viene
   storto, viene storto anche in partita.

   ── e quello che manca si vede da sé ──
   Un nome nel catalogo (`PERSONAGGI`, `OGGETTI`) che non ha un pittore
   funzionante finisce nel riquadro «mancano», invece di lasciare un
   buco muto nella griglia. È metà del valore di questa pagina: senza,
   un pittore mancante è un silenzio, ed è il silenzio la cosa più
   difficile da notare guardando.
   ═══════════════════════════════════════════════════════════════════ */
import { pennello } from '../../src/grafica/tela.js'
import {
  PITTORI, PERSONAGGI, OGGETTI,
  COLORI_CHIAVE, COLORI_GEMMA, COLORI_POZIONE, COLORI_ALLARME, STILI_PORTA,
} from '../../src/grafica/generale.js'
import { MANTI as MANTI_GATTO } from '../../src/grafica/personaggi/gatto.js'
import { MANTI as MANTI_ORSO } from '../../src/grafica/personaggi/orso.js'
import { MANTI as MANTI_PAPERA } from '../../src/grafica/personaggi/papera.js'
import { SIGILLI } from '../../src/grafica/oggetti/attrezzi.js'
import { creaFondale } from '../../src/grafica/mappa.js'
import { NOMI_AMBIENTI } from '../../src/grafica/ambienti/indice.js'

const dove = () => document.getElementById('tavola')

/* ═══════════ un riquadro con dentro un canvas, e la sua etichetta ═══════════
   `figuraCanvas` è il mattone di tutta la pagina: un canvas alla misura
   vera (dpr compreso, come fa il gioco), un titolo grosso — di solito il
   nome del personaggio o dell'oggetto — e sotto, in monospace, la
   chiave coi dati che l'hanno prodotta: è la parte che risponde a «come
   si chiama questo pittore». */
function figuraCanvas({ larg, alto, titolo, dettaglio, disegna, manca = false, guasto = null }) {
  const fig = document.createElement('figure')
  if (manca) fig.className = 'manca'
  const cv = document.createElement('canvas')
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  cv.width = Math.round(larg * dpr); cv.height = Math.round(alto * dpr)
  cv.style.width = larg + 'px'; cv.style.height = alto + 'px'
  const ctx = cv.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  if (manca || guasto) {
    ctx.fillStyle = '#2a1414'; ctx.fillRect(0, 0, larg, alto)
    ctx.strokeStyle = '#ff7a7a'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(6, 6); ctx.lineTo(larg - 6, alto - 6)
    ctx.moveTo(larg - 6, 6); ctx.lineTo(6, alto - 6); ctx.stroke()
    ctx.fillStyle = '#ff9a9a'; ctx.font = '600 11px ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.fillText(manca ? 'manca il pittore' : 'errore', larg / 2, alto / 2 + 26)
  } else {
    try {
      const p = pennello(ctx, { W: larg, H: alto, S: 1 })
      disegna(p)
    } catch (e) {
      ctx.fillStyle = '#2a1414'; ctx.fillRect(0, 0, larg, alto)
      ctx.fillStyle = '#ff9a9a'; ctx.font = '600 10px ui-monospace, monospace'
      ctx.textAlign = 'center'
      ctx.fillText(String(e.message || e).slice(0, 34), larg / 2, alto / 2, larg - 10)
      guastiTrovati.push({ titolo, dettaglio, errore: String(e.message || e) })
    }
  }
  fig.appendChild(cv)
  const cap = document.createElement('figcaption')
  cap.innerHTML = `<b>${titolo}</b>${dettaglio || ''}`
  fig.appendChild(cap)
  return fig
}

/* ═══════════ chiamare un pittore, con la rete sotto ═══════════
   `chiama(che, cosa)` prova `PITTORI[che]`: se non c'è, il riquadro lo
   dice invece di restare bianco, e la mancanza finisce anche nel
   riquadro riassuntivo in cima alla pagina. */
const mancantiTrovati = new Set()
const guastiTrovati = []

function cardPittore(che, cosa, { larg = 96, alto = 108, titolo, dettaglio } = {}) {
  const pittore = PITTORI[che]
  if (!pittore) {
    mancantiTrovati.add(che)
    return figuraCanvas({ larg, alto, titolo: titolo || che, dettaglio, manca: true })
  }
  return figuraCanvas({
    larg, alto, titolo: titolo || che, dettaglio,
    disegna: p => pittore(p, cosa, S_OGGETTI),
  })
}

/* ═══════════ le sezioni ═══════════ */
function sezione (titoloTesto, nota) {
  const s = document.createElement('section')
  s.className = 'gruppo'
  const h = document.createElement('h2'); h.textContent = titoloTesto; s.appendChild(h)
  if (nota) { const p = document.createElement('p'); p.className = 'nota'; p.textContent = nota; s.appendChild(p) }
  return s
}
const sottotitolo = (s, testo) => { const h = document.createElement('h3'); h.className = 'sotto'; h.textContent = testo; s.appendChild(h) }
const striscia = s => { const d = document.createElement('div'); d.className = 'strip'; s.appendChild(d); return d }

/* ── LE MISURE ──
   36 px è la cella vera del gioco (vedi `banco.js`, `catalogo.js`): a
   quella scala si giudica, non ingrandita. `S_OGGETTI` è l'unità che
   ricevono i pittori — una cella vale 20 unità. */
const LATO = 36
const S_OGGETTI = LATO / 20

/* ═══════════════════════════════════════════════════════════════════
   1 ─ LE PORTE — cinque stili, e ogni stato che sanno fare
   ═══════════════════════════════════════════════════════════════════ */
function sezionePorte () {
  const s = sezione('Le porte', 'Un pittore solo (`porta`), cinque stili dichiarati con `stile:`. '
    + 'Chiusa, aperta, e chiusa con un sigillo — la placca colorata che abbina la porta alla sua '
    + 'chiave — in ognuna delle cinque tinte di `SIGILLI`.')
  for (const stile of STILI_PORTA) {
    sottotitolo(s, stile)
    const strip = striscia(s)
    const base = { x: 44, y: 62, stile }
    strip.appendChild(cardPittore('porta', { ...base, apertura: 0 },
      { titolo: 'chiusa', dettaglio: `stile: '${stile}'` }))
    strip.appendChild(cardPittore('porta', { ...base, apertura: 1 },
      { titolo: 'aperta', dettaglio: `stile: '${stile}'` }))
    for (const colore of Object.keys(SIGILLI))
      strip.appendChild(cardPittore('porta', { ...base, apertura: 0, sigillo: colore },
        { titolo: 'sigillo ' + colore, dettaglio: `stile: '${stile}', sigillo: '${colore}'` }))
  }
  return s
}

/* ═══════════════════════════════════════════════════════════════════
   2 ─ I CONGEGNI — leva e totem, ogni stato che contano
   ═══════════════════════════════════════════════════════════════════ */
function sezioneCongegni () {
  const s = sezione('I congegni', 'Leva e totem: lo stesso comando (`premi`), due risposte diverse. '
    + 'Il totem conta le tacche — quante ne servano lo decide il livello (`tacche:`), e la '
    + 'variabile che cresce è quella che deve leggersi a colpo d\'occhio.')

  sottotitolo(s, 'leva')
  const leve = striscia(s)
  leve.appendChild(cardPittore('leva', { x: 44, y: 62, premuta: false }, { titolo: 'non premuta', dettaglio: 'premuta: false' }))
  leve.appendChild(cardPittore('leva', { x: 44, y: 62, premuta: true }, { titolo: 'premuta', dettaglio: 'premuta: true' }))

  sottotitolo(s, 'totem — tacche 3, 4 e 5 (i valori usati nei livelli), ogni conteggio')
  for (const tacche of [3, 4, 5]) {
    const riga = striscia(s)
    for (let accese = 0; accese <= tacche; accese++)
      riga.appendChild(cardPittore('totem', { x: 44, y: 62, tacche, accese },
        { titolo: `${accese}/${tacche}`, dettaglio: `tacche: ${tacche}, accese: ${accese}` }))
  }

  const altriCongegni = [
    ['pulsante', [{ premuto: false }, { premuto: true }], c => `premuto: ${c.premuto}`],
    ['ruota', [{ giro: 0 }, { giro: Math.PI / 2 }], c => `giro: ${c.giro.toFixed(2)}`],
    ['argano', [{ avvolta: 0 }, { avvolta: 0.5 }, { avvolta: 1 }], c => `avvolta: ${c.avvolta}`],
    ['botola', [{ apertura: 0 }, { apertura: 1 }], c => `apertura: ${c.apertura}`],
    ['ponteLevatoio', [{ abbassato: 0 }, { abbassato: 1 }], c => `abbassato: ${c.abbassato}`],
    ['forziere', [{ apertura: 0 }, { apertura: 0.5 }, { apertura: 1 }], c => `apertura: ${c.apertura}`],
    ['fontana', [{}], () => ''],
  ]
  for (const [che, stati, dett] of altriCongegni) {
    sottotitolo(s, che)
    const riga = striscia(s)
    for (const extra of stati)
      riga.appendChild(cardPittore(che, { x: 44, y: 62, ...extra }, { titolo: che, dettaglio: dett(extra) }))
  }

  sottotitolo(s, 'campanello — un colore per allarme, suonato e no')
  const camp = striscia(s)
  for (const colore of COLORI_ALLARME) for (const suona of [false, true])
    camp.appendChild(cardPittore('campanello', { x: 44, y: 62, colore, suona },
      { titolo: colore + (suona ? ' (suona)' : ''), dettaglio: `colore: '${colore}', suona: ${suona}` }))

  return s
}

/* ═══════════════════════════════════════════════════════════════════
   3 ─ DA PRENDERE — i raccoglibili, con le loro tinte dichiarate
   ═══════════════════════════════════════════════════════════════════ */
const DA_PRENDERE = ['chiave', 'gemma', 'moneta', 'mappa', 'pergamena', 'pozione', 'libro',
  'bacchetta', 'scudo', 'elmo', 'stivali', 'pane', 'corda', 'secchio', 'martello', 'piccone',
  'campana', 'corno', 'lanterna', 'torciaMano']

function sezioneRaccoglibili () {
  const s = sezione('Da prendere', 'I venti oggetti che ondeggiano e si raccolgono. Quelli con una '
    + 'tavolozza dichiarata (`COLORI_*`) la mostrano tutta; gli altri hanno un colore libero e '
    + 'basta un esemplare. `chiave` ha in più il sigillo — la gemma nell\'anello che l\'abbina alla '
    + 'sua porta.')
  const strip = striscia(s)
  for (const che of DA_PRENDERE) {
    if (che === 'chiave') {
      for (const colore of COLORI_CHIAVE)
        strip.appendChild(cardPittore('chiave', { x: 48, y: 60, colore },
          { titolo: 'chiave', dettaglio: `colore: '${colore}'` }))
      strip.appendChild(cardPittore('chiave', { x: 48, y: 60, colore: 'oro', sigillo: 'rosso' },
        { titolo: 'chiave + sigillo', dettaglio: `colore: 'oro', sigillo: 'rosso'` }))
      continue
    }
    if (che === 'gemma') {
      for (const colore of COLORI_GEMMA)
        strip.appendChild(cardPittore('gemma', { x: 48, y: 60, colore },
          { titolo: 'gemma', dettaglio: `colore: '${colore}'` }))
      continue
    }
    if (che === 'pozione') {
      for (const colore of COLORI_POZIONE)
        strip.appendChild(cardPittore('pozione', { x: 48, y: 60, colore },
          { titolo: 'pozione', dettaglio: `colore: '${colore}'` }))
      continue
    }
    if (che === 'secchio') {
      for (const pieno of [true, false])
        strip.appendChild(cardPittore('secchio', { x: 48, y: 60, pieno },
          { titolo: 'secchio', dettaglio: `pieno: ${pieno}` }))
      continue
    }
    if (che === 'campana') {
      for (const suona of [false, true])
        strip.appendChild(cardPittore('campana', { x: 48, y: 60, suona },
          { titolo: 'campana', dettaglio: `suona: ${suona}` }))
      continue
    }
    if (che === 'torciaMano' || che === 'lanterna') {
      for (const accesa of [true, false])
        strip.appendChild(cardPittore(che, { x: 48, y: 60, accesa },
          { titolo: che, dettaglio: `accesa: ${accesa}` }))
      continue
    }
    strip.appendChild(cardPittore(che, { x: 48, y: 60 }, { titolo: che }))
  }
  return s
}

/* ═══════════════════════════════════════════════════════════════════
   4 ─ DI SCENA — l'arredo, e i due stati di chi ne ha uno
   ═══════════════════════════════════════════════════════════════════ */
const DI_SCENA_STATI = {
  torcia: ['accesa', [true, false]],
  falo: ['acceso', [true, false]],
  braciere: ['acceso', [true, false]],
  altare: ['acceso', [true, false]],
  cassa: ['aperta', [false, true]],
  botte: ['coricata', [false, true]],
  barile: ['coricata', [false, true]],
  albero: ['secco', [false, true]],
  cespuglio: ['bacche', [true, false]],
  carrello: ['pieno', [true, false]],
  ragnatela: ['ragno', [false, true]],
}
const DI_SCENA = ['cassa', 'botte', 'barile', 'sacco', 'pozzo', 'colonna', 'cartello', 'bandiera',
  'tenda', 'carrello', 'binario', 'ponte', 'scala', 'catena', 'albero', 'cespuglio', 'roccia',
  'stalagmite', 'ossa', 'fungo', 'cristallo', 'ragnatela', 'acqua', 'pozzanghera', 'falo', 'torcia']

function sezioneScena () {
  const s = sezione('Di scena', 'L\'arredo che non si prende: sta lì per dire che una stanza è '
    + 'abitata. Molti hanno due stati (acceso/spento, aperto/chiuso, in piedi/coricato) perché '
    + 'serviranno tutti e due, ed è la coppia che qui si vede insieme.')
  const strip = striscia(s)
  for (const che of DI_SCENA) {
    const variante = DI_SCENA_STATI[che]
    if (variante) {
      const [campo, valori] = variante
      for (const v of valori)
        strip.appendChild(cardPittore(che, { x: 48, y: 60, [campo]: v },
          { titolo: che, dettaglio: `${campo}: ${v}` }))
    } else {
      strip.appendChild(cardPittore(che, { x: 48, y: 60 }, { titolo: che }))
    }
  }
  return s
}

/* ═══════════════════════════════════════════════════════════════════
   5 ─ LE MACCHIE D'INFORMAZIONE — vista e ronda
   ═══════════════════════════════════════════════════════════════════ */
function sezioneMacchie () {
  const s = sezione('Le macchie d\'informazione', '`vista` e `ronda` non sono cose sul campo: sono '
    + 'quello che il gioco disegna SOTTO le cose, per dire «da qui si vede» o «questo posto conta». '
    + 'Non hanno tinte fisse: il colore lo sceglie chi le mette in scena.')
  const strip = striscia(s)
  strip.appendChild(cardPittore('vista',
    { x: 70, y: 70, raggio: 1.5, giro: true, colore: '#ff7a6a' },
    { larg: 140, alto: 140, titolo: 'vista (giro)', dettaglio: "raggio: 1.5, giro: true" }))
  strip.appendChild(cardPittore('vista',
    { x: 50, y: 70, raggio: 1.5, dir: 'dx', apertura: 0.85, colore: '#ff7a6a' },
    { larg: 140, alto: 140, titolo: 'vista (cono)', dettaglio: "dir: 'dx', apertura: 0.85" }))
  strip.appendChild(cardPittore('ronda',
    { celle: [{ x: 30, y: 60 }, { x: 90, y: 60 }], colore: '#ffd24a' },
    { larg: 120, alto: 120, titolo: 'ronda', dettaglio: "celle: 2, colore: '#ffd24a'" }))
  return s
}

/* ═══════════════════════════════════════════════════════════════════
   6 ─ I PERSONAGGI — le quattro direzioni, i sei stati, i manti
   ═══════════════════════════════════════════════════════════════════ */
const STATI = ['normale', 'attesa', 'errore', 'colpito', 'ko', 'lancia']
const DIREZIONI = ['giu', 'su', 'dx', 'sx']
const MANTI = { gatto: MANTI_GATTO, orso: MANTI_ORSO, papera: MANTI_PAPERA }

function cardPersonaggio (corpo, extra, { titolo, dettaglio, larg = 84, alto = 118 }) {
  const cosa = { che: corpo, x: larg / 2, y: alto * 0.78, dir: 'giu', passo: 1, stato: 'normale', ...extra }
  return cardPittore(corpo, cosa, { larg, alto, titolo, dettaglio })
}

function sezionePersonaggi () {
  const s = sezione('I personaggi', 'Gli eroi, i mostri e gli animali di `grafica/personaggi/`, uno '
    + 'schema di cammino a due gambe o a quattro zampe (`persona`/`bestia`) condiviso da tutti. '
    + 'Per ognuno: le quattro direzioni a passo intermedio, e i sei stati che lo schema sa fare '
    + '(sempre rivolto in giù).')
  for (const nome of PERSONAGGI) {
    sottotitolo(s, nome)
    const righe = document.createElement('div')

    const dirRiga = striscia(righe)
    for (const dir of DIREZIONI)
      dirRiga.appendChild(cardPersonaggio(nome, { dir }, { titolo: dir, dettaglio: `dir: '${dir}'` }))

    const statoRiga = striscia(righe)
    for (const stato of STATI)
      statoRiga.appendChild(cardPersonaggio(nome, { stato, passo: 0 },
        { titolo: stato, dettaglio: `stato: '${stato}'` }))

    if (MANTI[nome]) {
      const mantoRiga = striscia(righe)
      for (const manto of Object.keys(MANTI[nome]))
        mantoRiga.appendChild(cardPersonaggio(nome, { manto },
          { titolo: manto, dettaglio: `manto: '${manto}'` }))
    }
    s.appendChild(righe)
  }
  return s
}

/* ═══════════════════════════════════════════════════════════════════
   7 ─ I TERRENI — ogni ambiente, isolato, con la sua vera resa
   ═══════════════════════════════════════════════════════════════════ */
/* una stanzetta bordata: senza muri i pittori del buio (`A.buio`) e
   delle torce (`torce: true`) non hanno niente a cui appendersi, e un
   ambiente scuro verrebbe fuori tutto nero — non un difetto, ma non è
   nemmeno quello che un livello vero fa vedere. Con un bordo e un po'
   di fondo la torcia trova dove attaccarsi, come in ogni stanza vera. */
const MAPPA_AMBIENTE = [
  '##########',
  '#........#',
  '#..##....#',
  '#........#',
  '#....##..#',
  '#........#',
  '##########',
]

function sezioneTerreni () {
  const s = sezione('I terreni', 'Ogni ambiente di `grafica/ambienti/`, dipinto da solo in una '
    + 'stanzetta di prova con `creaFondale` — la stessa funzione che dipinge il fondale vero, non '
    + 'un\'anteprima rifatta apposta.')
  const strip = striscia(s)
  for (const ambiente of NOMI_AMBIENTI) {
    const fondale = creaFondale({ mappa: MAPPA_AMBIENTE, ambiente, lato: LATO, seme: ambiente })
    const fig = document.createElement('figure')
    const cv = document.createElement('canvas')
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const larg = MAPPA_AMBIENTE[0].length * LATO, alto = MAPPA_AMBIENTE.length * LATO
    cv.width = larg * dpr; cv.height = alto * dpr
    cv.style.width = larg + 'px'; cv.style.height = alto + 'px'
    const ctx = cv.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    fondale.mostra(ctx, 0, 0, larg, alto)
    fig.appendChild(cv)
    const cap = document.createElement('figcaption')
    cap.innerHTML = `<b>${ambiente}</b>ambiente: '${ambiente}'`
    fig.appendChild(cap)
    strip.appendChild(fig)
  }
  return s
}

/* ═══════════════════════════════════════════════════════════════════
   IL RIQUADRO «MANCANO» — e quello, distinto, di un guasto più a monte
   ═══════════════════════════════════════════════════════════════════ */
function riquadroMancano () {
  if (!mancantiTrovati.size && !guastiTrovati.length) return null
  const box = document.createElement('div')
  box.className = 'riquadro guasto'
  const h = document.createElement('h2'); h.textContent = '⚠️ Mancano'; box.appendChild(h)
  if (mancantiTrovati.size) {
    const p = document.createElement('p')
    p.textContent = 'Nomi che compaiono in PERSONAGGI/OGGETTI o nei dati del motore, ma per cui ' +
      'PITTORI non ha una funzione: nel gioco quella cosa non si vede — non è dipinta sbagliata, ' +
      'è dipinta NIENTE, e nessun test se ne accorge.'
    box.appendChild(p)
    const ul = document.createElement('ul')
    for (const che of mancantiTrovati) {
      const li = document.createElement('li')
      li.innerHTML = `<code>che: '${che}'</code>`
      ul.appendChild(li)
    }
    box.appendChild(ul)
  }
  if (guastiTrovati.length) {
    const p = document.createElement('p')
    p.textContent = 'E questi pittori esistono ma sono andati in eccezione con i dati di prova qui sopra:'
    box.appendChild(p)
    const ul = document.createElement('ul')
    for (const g of guastiTrovati) {
      const li = document.createElement('li')
      li.innerHTML = `<code>${g.titolo}</code> — ${g.dettaglio || ''} — <i>${g.errore}</i>`
      ul.appendChild(li)
    }
    box.appendChild(ul)
  }
  return box
}

/* ═══════════════════════════════════════════════════════════════════
   AVVIO
   ═══════════════════════════════════════════════════════════════════ */
function costruisci () {
  mancantiTrovati.clear(); guastiTrovati.length = 0
  const t = dove()
  t.textContent = ''

  const sPorte = sezionePorte()
  const sCongegni = sezioneCongegni()
  const sRaccoglibili = sezioneRaccoglibili()
  const sScena = sezioneScena()
  const sMacchie = sezioneMacchie()
  const sPersonaggi = sezionePersonaggi()
  const sTerreni = sezioneTerreni()

  /* le sezioni sono già disegnate (le chiamate sopra hanno riempito
     `mancantiTrovati` e `guastiTrovati`): il riquadro riassuntivo si
     costruisce ADESSO e va in testa, prima di tutto il resto */
  const mancano = riquadroMancano()
  if (mancano) t.appendChild(mancano)
  t.appendChild(sPorte)
  t.appendChild(sCongegni)
  t.appendChild(sRaccoglibili)
  t.appendChild(sScena)
  t.appendChild(sMacchie)
  t.appendChild(sPersonaggi)
  t.appendChild(sTerreni)
}

export function avvia () {
  costruisci()
}

window.__vetrina = { PITTORI, PERSONAGGI, OGGETTI }
