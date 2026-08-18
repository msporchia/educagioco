/* ═══════════════════════════════════════════════════════════════════
   L'EDITOR DEI RITAGLI — il foglio prima che diventi atlante

   Il banco dei mondi guarda quello che **esce**: l'atlante generato, le
   voci, come stanno insieme sul prato. Questa metà guarda quello che
   **entra**: il foglio sorgente e il suo foglietto, cioè i quattro
   numeri che dicono dove finisce un albero e dove comincia quello
   accanto.

   Serve perché quei fogli li disegna un generatore che la griglia non la
   capisce fino in fondo. I difetti sono sempre gli stessi quattro:

     · il rettangolo taglia — «albero_verde è tagliato a destra»
     · il rettangolo prende troppo — «sotto casa_albero c'è un intruso»
     · due cose diverse finiscono in un gruppo solo, e il gioco le fa
       lampeggiare una nell'altra credendole i fotogrammi di un'unica
       cosa — «casa grande sono due case diverse»
     · dentro il ritaglio giusto resta della roba che non c'entra

   I primi tre si correggono spostando numeri, il quarto dichiarando un
   `cancella`. Tutti e quattro si correggono **guardando il foglio**, ed
   è il motivo per cui contarli a mano non funzionava: si conta un pixel
   di troppo, si rigenera, si riguarda, e passa un quarto d'ora per
   spostare un bordo di tre pixel.

   ── quello che questa pagina NON fa ──
   Non tocca il PNG. `STANDARD.md` dice che la sorgente è la verità: non
   si modifica e non si butta, e tutto si rigenera da lì. Un PNG
   ritoccato a mano è un PNG di cui non si sa più cosa gli è stato fatto
   sopra, e il giorno che arriva un foglio migliore la correzione è
   perduta. Qui si scrive **solo il foglietto** — che è dato, sta accanto
   al foglio che descrive, si rilegge, e buttare via tutto il generato e
   rifarlo dà lo stesso risultato al pixel.

   ── e quello che mostra senza che nessuno lo chieda ──
   «Quello che nessuno prende»: i pixel del foglio che non stanno dentro
   nessun rettangolo, tinti. Su un foglio disegnato a mano da un modello
   è la domanda che non si pensa a fare — non «questo ritaglio è
   storto?», ma «quanta roba c'è lì dentro che non ho mai ritagliato?».
   ═══════════════════════════════════════════════════════════════════ */

/* I foglietti e i fogli, presi da Vite. `?raw` invece dell'import JSON
   perché il testo originale serve intero: è quello che si confronta per
   sapere se c'è qualcosa da salvare, e non passa da un parse e un
   serialize che potrebbero perdere per strada una chiave che non
   conosciamo. */
const FOGLIETTI = import.meta.glob('/strumenti/sprite/sorgenti/**/*.json',
                                   { eager: true, query: '?raw', import: 'default' })
const IMMAGINI = import.meta.glob('/strumenti/sprite/sorgenti/**/*.{png,jpg,jpeg}',
                                  { eager: true, query: '?url', import: 'default' })

const $ = s => document.querySelector(s)

const R = {
  fogli: [],          // { chiave, nome, testo, immagine }
  aperto: null,       // { chiave, fg, testo, img, vera, cw, ch }
  scelto: null,       // il nome della voce in fg.sprite
  segnati: [],        // quelle spuntate per essere unite, **in ordine**
  cerca: '',
  zoom: 2,
  pan: [0, 0],        // in pixel del foglio, angolo in alto a sinistra
  modo: 'ritaglio',   // 'ritaglio' | 'cancella'
  scoperti: false,    // tingi quello che nessun rettangolo prende
  trascina: null,     // { che, da, partenza }
  sporco: false,
}

/* ═══════════ i fogli disponibili ═══════════ */
function raduna() {
  for (const [chiave, testo] of Object.entries(FOGLIETTI)) {
    let fg
    try { fg = JSON.parse(testo) } catch { continue }
    const base = chiave.replace(/\.json$/, '')
    const immagine = ['.png', '.jpg', '.jpeg'].map(e => IMMAGINI[base + e]).find(Boolean)
    if (!immagine) continue        // `atlante.json` e `pezzi.json`: non sono fogli
    /* Un foglio che non dichiara i suoi ritagli entra lo stesso
       nell'elenco, spento. Sono quelli del castello, che `terreni.py`
       **misura** dall'alfa invece di farseli dire: qui non c'è nessun
       rettangolo da spostare, e la ragione va scritta dove uno la cerca
       — se no si scorre l'elenco, non si trova il castello, e si
       conclude che il banco è a metà. */
    R.fogli.push({ chiave, nome: chiave.replace('/strumenti/sprite/sorgenti/', ''),
                   testo, immagine, misurato: !fg.sprite && !fg.ritagli })
  }
  R.fogli.sort((a, b) => a.nome.localeCompare(b.nome))
}

/* ═══════════ leggere un foglio ═══════════ */
async function apriFoglio(chiave) {
  const f = R.fogli.find(x => x.chiave === chiave) || R.fogli[0]
  const fg = JSON.parse(f.testo)
  const grezza = await new Promise((ok, no) => {
    const i = new Image()
    i.onload = () => ok(i); i.onerror = no; i.src = f.immagine
  })

  /* alla misura vera, come fa `atlante.py`: il foglietto dice quante
     celle è largo il foglio, e il resto è una divisione. Qui il
     ridimensionamento lo fa il canvas invece di PIL — non è lo stesso
     filtro (BOX fa la media di ogni blocco), ma per decidere dove
     cadono i bordi di un ritaglio la differenza non si vede. */
  const cw = (fg.cella || [1, 1])[0], ch = (fg.cella || [1, 1])[1]
  const [col, rig] = fg.foglio || [Math.floor(grezza.width / cw), Math.floor(grezza.height / ch)]
  const vera = [col * cw, rig * ch]
  const tela = document.createElement('canvas')
  tela.width = vera[0]; tela.height = vera[1]
  const c = tela.getContext('2d')
  c.imageSmoothingEnabled = true
  c.imageSmoothingQuality = 'high'
  c.drawImage(grezza, 0, 0, vera[0], vera[1])

  R.aperto = { chiave: f.chiave, nome: f.nome, fg, testo: f.testo, img: tela, vera, cw, ch }
  R.scelto = null
  R.segnati = []
  R.sporco = false
  R.pan = [0, 0]
  R.zoom = adattaZoom()
  scopertiInvalida()
  costruisciElenco()
  dettaglio()
  ridisegna()
  const quante = Object.keys(fg.sprite || {}).filter(n => !n.startsWith('__')).length
  dillo(fg.ritagli
    ? `${f.nome}: i ritagli li dichiara «${fg.ritagli}», scritto dall'autore del set — qui si guardano, non si toccano`
    : `${f.nome}: ${quante} voci, foglio ${vera[0]}×${vera[1]}` +
      (fg.fondo && fg.fondo !== 'trasparente'
        ? ` — attenzione: «fondo: ${JSON.stringify(fg.fondo)}» qui non è tolto, il generatore lo toglie` : ''))
}

function modificabile() { return R.aperto && !R.aperto.fg.ritagli }
function adattaZoom() {
  const casa = $('#foglio-casa')
  if (!casa || !R.aperto) return 2
  const z = Math.min((casa.clientWidth - 20) / R.aperto.vera[0],
                     (casa.clientHeight - 20) / R.aperto.vera[1])
  return Math.max(0.25, Math.min(8, Math.round(z * 4) / 4))
}

/* ═══════════ dove cade una voce ═══════════
   La stessa aritmetica di `ritagli_di` in `atlante.py`, e non è un
   doppione da togliere: è l'unico punto in cui questa pagina deve essere
   d'accordo col generatore, ed è quattro righe. Se qui si legge un
   rettangolo diverso da quello che il generatore ritaglia, tutto il
   resto della pagina mente. */
function voci() {
  const { fg } = R.aperto
  return Object.keys(fg.sprite || {}).filter(n => !n.startsWith('__'))
}

function rettangoli(nome) {
  const { fg, cw, ch } = R.aperto
  const d = fg.sprite[nome]
  if (!d) return []
  const [pw, ph] = d.cella || [cw, ch]
  const quanti = d.quanti || 1
  const passo = d.passo || [Math.max(1, Math.floor(pw / cw)), 0]
  const fuori = []
  for (let i = 0; i < quanti; i++)
    fuori.push([(d.da[0] + passo[0] * i) * cw, (d.da[1] + passo[1] * i) * ch, pw, ph])
  return fuori
}

/* ── famiglia e permutazioni: due strati, e si vedono tutti e due ──
   Di regola si dichiarano **per prefisso** nel foglietto — `"famiglie":
   {"albero": "figura"}` vale per tutti gli alberi — e va bene così: una
   riga per prefisso invece di duecento righe gemelle da tenere
   allineate.

   Ma un foglio disegnato da un modello ha sempre l'eccezione: il pezzo
   che il prefisso pesca e che quella famiglia non ce l'ha. Per quello
   `atlante.py` accetta già l'eccezione sul singolo sprite (`famiglia`,
   `giri`, `specchia` dentro la riga), e il pannello la lascia mettere.

   Perciò questa funzione torna il valore **e da dove viene**: chi
   guarda deve poter distinguere «figura perché l'ho deciso io per
   questo pezzo» da «figura perché comincia per albero». Sono due cose
   diverse, e confonderle vuol dire cambiare il prefisso credendo di
   cambiare un pezzo. */
const FAMIGLIE = ['attore', 'oggetto', 'tessera', 'fondo', 'figura']

function comeFinisce(nome) {
  const { fg } = R.aperto
  const d = fg.sprite[nome] || {}
  let famiglia = d.famiglia, daPrefisso = null
  if (!famiglia)
    for (const [p, che] of Object.entries(fg.famiglie || {}))
      if (nome.startsWith(p)) { famiglia = che; daPrefisso = p; break }
  const suaFamiglia = !!d.famiglia
  famiglia = famiglia || fg.famiglia || 'oggetto'

  let giri = d.giri, specchia = d.specchia, daTrasforma = null
  const suoGiri = d.giri !== undefined, suoSpecchia = d.specchia !== undefined
  if (!suoGiri && !suoSpecchia)
    for (const [p, che] of Object.entries(fg.trasforma || {}))
      if (nome.startsWith(p)) {
        giri = che.giri; specchia = che.specchia; daTrasforma = p; break
      }
  /* il ripiego finale è quello di `catalogo.py`: gira solo il terreno.
     Va mostrato come valore vero, se no il pannello dice «—» dove il
     gioco farà una scelta precisa. */
  if (giri === undefined) giri = (famiglia === 'tessera' || famiglia === 'fondo') ? 4 : 1
  if (specchia === undefined) specchia = true
  return { famiglia, giri, specchia, suaFamiglia, suoGiri, suoSpecchia, daPrefisso, daTrasforma }
}

/* ── scorrono, o sono alternative ──
   Più pezzi sotto un nome sono due cose opposte. I **fotogrammi** di
   una bandiera si scorrono sull'orologio; le **varianti** — ventisei
   cespugli diversi — no: si pesca sempre la stessa, dal posto in cui
   sta. Confonderle non dà nessun errore, dà un campo che lampeggia.

   Il ripiego è «alternative», perché su questi fogli le alternative
   sono la stragrande maggioranza (dei quarantadue gruppi della fattoria
   le animazioni vere sono cinque), e chi cammina è animato comunque.
   Quindi l'animazione **si dichiara**, e si dichiara col nome della
   COSA: `"anima": ["bandiera"]`, non `bandiera0`. Se il nome finisce
   con una cifra è un fotogramma di un gruppo e la dichiarazione va
   sullo stelo — così non dipende da quale dei tre pezzi si è toccato,
   che è l'ordine con cui `catalogo.py` li incontra. */
const stelo = n => n.replace(/[-_]?\d+$/, '')

function comeAnima(nome) {
  const { fg } = R.aperto
  const d = fg.sprite[nome] || {}
  const gruppo = stelo(nome) !== nome
  let anima = d.anima === undefined ? null : d.anima
  if (anima === null && gruppo && (fg.anima || []).includes(stelo(nome))) anima = true
  const { famiglia } = comeFinisce(nome)
  return { anima, animaVera: anima === null ? famiglia === 'attore' : anima, gruppo }
}

function metteAnima(nome, valore) {
  const { fg } = R.aperto
  const d = fg.sprite[nome]
  const { gruppo } = comeAnima(nome)
  if (gruppo) {
    const lista = fg.anima || []
    const i = lista.indexOf(stelo(nome))
    if (valore === true && i < 0) lista.push(stelo(nome))
    if (valore !== true && i >= 0) lista.splice(i, 1)
    if (lista.length) fg.anima = lista; else delete fg.anima
    /* «no» su un gruppo va scritto lo stesso sul pezzo: se la famiglia
       è `attore` il ripiego lo rianimerebbe, e togliere lo stelo non
       basterebbe */
    if (valore === false) d.anima = false; else delete d.anima
  } else {
    if (valore === null) delete d.anima; else d.anima = valore
  }
}

/* ═══════════ il disegno ═══════════ */
const tela = () => $('#foglio')

function ridisegna() {
  const cv = tela()
  if (!cv || !R.aperto) return
  const casa = $('#foglio-casa')
  cv.width = casa.clientWidth
  cv.height = casa.clientHeight
  const c = cv.getContext('2d')
  const z = R.zoom
  c.setTransform(1, 0, 0, 1, 0, 0)
  c.fillStyle = '#0b0d11'
  c.fillRect(0, 0, cv.width, cv.height)
  c.setTransform(z, 0, 0, z, -R.pan[0] * z, -R.pan[1] * z)
  c.imageSmoothingEnabled = false

  /* la scacchiera sotto: senza, una zona trasparente e una zona nera
     sono la stessa cosa, ed è metà del lavoro */
  const q = 8
  c.fillStyle = '#1a1e26'
  c.fillRect(0, 0, R.aperto.vera[0], R.aperto.vera[1])
  c.fillStyle = '#20252e'
  for (let y = 0; y < R.aperto.vera[1]; y += q)
    for (let x = ((y / q) % 2) * q; x < R.aperto.vera[0]; x += q * 2)
      c.fillRect(x, y, q, q)
  c.drawImage(R.aperto.img, 0, 0)
  if (R.scoperti && scoperti()) c.drawImage(scoperti(), 0, 0)

  /* ── il velo del modo «buca» ──
     Si può bucare **solo dentro il ritaglio scelto**, perché le
     coordinate di `cancella` sono locali a lui. Dirlo con un cartello
     non basta: si prova a trascinare fuori, non succede niente, e
     sembra rotto. Spegnendo tutto il resto la regola non va spiegata,
     si vede. */
  if (R.modo === 'cancella' && R.scelto) {
    const [x, y, w, h] = rettangoli(R.scelto)[0]
    c.save()
    c.beginPath()
    c.rect(0, 0, R.aperto.vera[0], R.aperto.vera[1])
    c.rect(x, y, w, h)
    c.fillStyle = 'rgba(11,13,17,.72)'
    c.fill('evenodd')
    c.restore()
  }

  c.lineWidth = 1 / z
  for (const nome of voci()) {
    const scelto = nome === R.scelto
    c.strokeStyle = scelto ? '#7fe0c0' : 'rgba(255,255,255,.28)'
    if (scelto) c.lineWidth = 2 / z
    for (const [x, y, w, h] of rettangoli(nome)) c.strokeRect(x, y, w, h)
    if (scelto) c.lineWidth = 1 / z
  }

  if (R.trascina && R.trascina.che === 'nuovo-ritaglio') {
    const [x, y, w, h] = R.trascina.rett
    c.strokeStyle = '#ffd24a'
    c.lineWidth = 2 / z
    c.strokeRect(x, y, w, h)
    c.lineWidth = 1 / z
  }

  if (R.scelto) {
    const rr = rettangoli(R.scelto)
    const [x, y, w, h] = rr[0]
    /* i cancella, in rosso e **dentro il ritaglio**: sono coordinate
       locali, e disegnarli dove cadono davvero è l'unico modo di
       vedere che ne è avanzato uno di ieri fuori posto */
    c.fillStyle = 'rgba(255,90,90,.35)'
    c.strokeStyle = '#ff5a5a'
    for (const r of R.aperto.fg.sprite[R.scelto].cancella || [])
      for (const [bx, by] of rr) {
        c.fillRect(bx + r[0], by + r[1], r[2], r[3])
        c.strokeRect(bx + r[0], by + r[1], r[2], r[3])
      }
    if (R.modo === 'ritaglio') {
      c.fillStyle = '#7fe0c0'
      for (const [hx, hy] of maniglie(x, y, w, h))
        c.fillRect(hx - 3 / z, hy - 3 / z, 6 / z, 6 / z)
    }
    if (R.trascina && R.trascina.che === 'nuovo-cancella') {
      const r = R.trascina.rett
      c.strokeStyle = '#ff5a5a'
      c.strokeRect(x + r[0], y + r[1], r[2], r[3])
    }
  }
}

function maniglie(x, y, w, h) {
  return [[x, y], [x + w / 2, y], [x + w, y],
          [x, y + h / 2], [x + w, y + h / 2],
          [x, y + h], [x + w / 2, y + h], [x + w, y + h]]
}
const VERSI_MANIGLIA = ['no', 'n', 'ne', 'o', 'e', 'so', 's', 'se']

/* ── quello che nessuno prende ──
   Si calcola una volta e si tiene: è una passata su tutto il foglio, e
   rifarla a ogni fotogramma vorrebbe dire una pagina che scatta. */
let _scoperti = null
function scopertiInvalida() { _scoperti = null }
function scoperti() {
  if (_scoperti || !R.aperto) return _scoperti
  const [L, A] = R.aperto.vera
  const dati = R.aperto.img.getContext('2d').getImageData(0, 0, L, A)
  const preso = new Uint8Array(L * A)
  for (const nome of voci())
    for (const [x, y, w, h] of rettangoli(nome))
      for (let b = Math.max(0, y); b < Math.min(A, y + h); b++)
        preso.fill(1, b * L + Math.max(0, x), b * L + Math.min(L, x + w))
  const fuori = document.createElement('canvas')
  fuori.width = L; fuori.height = A
  const im = fuori.getContext('2d').createImageData(L, A)
  for (let i = 0; i < L * A; i++) {
    if (preso[i] || dati.data[i * 4 + 3] < 24) continue
    im.data[i * 4] = 255; im.data[i * 4 + 1] = 190; im.data[i * 4 + 2] = 40
    im.data[i * 4 + 3] = 120
  }
  fuori.getContext('2d').putImageData(im, 0, 0)
  return (_scoperti = fuori)
}

/* ═══════════ l'elenco ═══════════ */
function costruisciElenco() {
  const dove = $('#ritagli-voci')
  dove.innerHTML = ''
  const q = R.cerca.trim().toLowerCase()
  const viste = voci().filter(n => !q || n.toLowerCase().includes(q))
  for (const nome of viste) {
    const box = document.createElement('div')
    box.className = 'voce' + (nome === R.scelto ? ' scelta' : '')
    box.dataset.voce = nome
    const rr = rettangoli(nome)
    const [, , w, h] = rr[0]
    const testa = document.createElement('div')
    testa.className = 'testa'
    /* il numero del segno, non una spunta: unire vuol dire mettere in
       fila dei fotogrammi, e **l'ordine è il dato** — la bandiera che
       sventola al contrario è un difetto che si vede e non si spiega.
       Il numero dice in che ordine finiranno, ed è l'ordine in cui li
       hai toccati. */
    const i = R.segnati.indexOf(nome)
    testa.innerHTML = `<b>${nome}</b><span>${w}×${h}${rr.length > 1 ? ` · ${rr.length}` : ''}</span>`
    const segno = document.createElement('button')
    segno.className = 'segno' + (i >= 0 ? ' acceso' : '')
    segno.textContent = i >= 0 ? String(i + 1) : '+'
    segno.title = 'segna per unire'
    segno.addEventListener('click', e => {
      e.stopPropagation()
      if (i >= 0) R.segnati.splice(i, 1); else R.segnati.push(nome)
      costruisciElenco(); dettaglio()
    })
    testa.appendChild(segno)
    box.appendChild(testa)
    const riga = document.createElement('div')
    riga.className = 'riga'
    for (const r of rr.slice(0, 4)) riga.appendChild(provino(r, nome, rr.length > 1 ? 2 : 3))
    box.appendChild(riga)
    box.addEventListener('click', () => scegli(nome))
    dove.appendChild(box)
  }
  $('#ritagli-quante').textContent = viste.length === voci().length
    ? `${viste.length} voci` : `${viste.length} di ${voci().length}`
}

function provino([x, y, w, h], nome, z) {
  const d = R.aperto.fg.sprite[nome] || {}
  /* il provino mostra il pezzo **come uscirà**, non com'è sul foglio:
     con `misura` dichiarata il ritaglio viene ridotto a quella, ed è
     tutto il senso di quel campo — un provino che ignorasse la misura
     farebbe sembrare giusto proprio il caso che si sta correggendo */
  const [ow, oh] = d.misura && d.misura.length === 2 ? d.misura : [w, h]
  const cv = document.createElement('canvas')
  cv.className = 'provino'
  const zz = Math.min(z, Math.max(1, Math.floor(120 / Math.max(ow, oh))))
  cv.width = Math.max(8, ow * zz); cv.height = Math.max(8, oh * zz)
  const c = cv.getContext('2d')
  c.imageSmoothingEnabled = ow !== w || oh !== h
  c.drawImage(R.aperto.img, x, y, w, h, 0, 0, ow * zz, oh * zz)
  /* i cancella si vedono anche qui, e in rosso: il provino deve dire
     com'è il pezzo **dopo** la correzione, se no si corregge alla cieca */
  c.fillStyle = 'rgba(255,90,90,.55)'
  for (const r of d.cancella || [])
    c.fillRect(r[0] * zz * ow / w, r[1] * zz * oh / h, r[2] * zz * ow / w, r[3] * zz * oh / h)
  cv.title = `${nome} · ${x},${y} ${w}×${h}` + (ow !== w ? ` → ${ow}×${oh}` : '')
  return cv
}

function scegli(nome) {
  R.scelto = nome
  for (const el of document.querySelectorAll('#ritagli-voci .voce'))
    el.classList.toggle('scelta', el.dataset.voce === nome)
  const el = document.querySelector(`#ritagli-voci .voce[data-voce="${CSS.escape(nome)}"]`)
  if (el) el.scrollIntoView({ block: 'nearest' })
  inquadra(nome)
  dettaglio()
  ridisegna()
}

/* ── la lente ──
   Scegliere una voce **ci va sopra e ingrandisce**, non si limita a
   centrarla. È la differenza fra un attrezzo che si può usare e uno
   che no: a foglio intero un ritaglio di 52×57 px sta in mezzo
   centimetro, le maniglie sono sei pixel e tirarci dentro un buco non
   è un lavoro che una mano umana possa fare.

   Il margine attorno non è decorazione: è **la cosa più importante da
   vedere**. Un rettangolo si allarga fin dove comincia il vicino, e il
   vicino va tenuto nell'inquadratura — il ritaglio dell'albero era
   sbagliato proprio perché qualcuno l'aveva stretto a mano per non
   mordere la panchina accanto, e la panchina bisogna vederla. */
function inquadra(nome) {
  const rr = rettangoli(nome)
  const x0 = Math.min(...rr.map(r => r[0])), y0 = Math.min(...rr.map(r => r[1]))
  const x1 = Math.max(...rr.map(r => r[0] + r[2])), y1 = Math.max(...rr.map(r => r[1] + r[3]))
  const cv = tela()
  const margine = 2.1                       // il ritaglio occupa metà dell'inquadratura
  const z = Math.min(cv.width / ((x1 - x0) * margine), cv.height / ((y1 - y0) * margine))
  R.zoom = Math.max(0.25, Math.min(16, z))
  R.pan = [(x0 + x1) / 2 - cv.width / R.zoom / 2, (y0 + y1) / 2 - cv.height / R.zoom / 2]
}

/* e il contrario, perché ogni tanto si vuole rivedere dov'è tutto */
function tuttoIlFoglio() {
  R.zoom = adattaZoom()
  R.pan = [0, 0]
  ridisegna()
}

/* ═══════════ il pannello del dettaglio ═══════════ */
function dettaglio() {
  const dove = $('#ritagli-dettaglio')
  if (!R.scelto) { dove.innerHTML = '<p class="tenue">nessuna voce scelta</p>'; return }
  const d = R.aperto.fg.sprite[R.scelto]
  const rr = rettangoli(R.scelto)
  const q = comeFinisce(R.scelto)
  const { famiglia, giri, specchia } = q
  const { anima, animaVera } = comeAnima(R.scelto)
  const [pw, ph] = d.cella || [R.aperto.cw, R.aperto.ch]
  const bloc = modificabile() ? '' : ' disabled'
  dove.innerHTML = `
    <label class="campo">nome <input id="r-nome" value="${R.scelto}"${bloc}></label>
    <div class="numeri">
      <label>da x <input id="r-dax" type="number" value="${d.da[0]}"${bloc}></label>
      <label>da y <input id="r-day" type="number" value="${d.da[1]}"${bloc}></label>
      <label>largo <input id="r-larg" type="number" min="1" value="${pw}"${bloc}></label>
      <label>alto <input id="r-alto" type="number" min="1" value="${ph}"${bloc}></label>
      <label>quanti <input id="r-quanti" type="number" min="1" value="${d.quanti || 1}"${bloc}></label>
      <label>passo x <input id="r-passox" type="number" value="${(d.passo || [Math.max(1, Math.floor(pw / R.aperto.cw)), 0])[0]}"${bloc}></label>
      <label>passo y <input id="r-passoy" type="number" value="${(d.passo || [0, 0])[1]}"${bloc}></label>
    </div>
    ${R.aperto.cw > 1 ? `<p class="tenue">«da» è in celle da ${R.aperto.cw}×${R.aperto.ch} px</p>` : ''}

    <h3>com'è fatto</h3>
    <div class="numeri flag">
      <label>famiglia <select id="r-famiglia"${bloc}>
        <option value=""${q.suaFamiglia ? '' : ' selected'}>come il prefisso (${famiglia})</option>
        ${FAMIGLIE.map(f => `<option${d.famiglia === f ? ' selected' : ''}>${f}</option>`).join('')}
      </select></label>
      <label>gira <select id="r-giri"${bloc}>
        <option value=""${q.suoGiri ? '' : ' selected'}>come il prefisso (×${giri})</option>
        <option value="1"${d.giri === 1 ? ' selected' : ''}>×1 — ha una faccia</option>
        <option value="2"${d.giri === 2 ? ' selected' : ''}>×2 — ha un asse</option>
        <option value="4"${d.giri === 4 ? ' selected' : ''}>×4 — visto dall'alto</option>
      </select></label>
      <label>specchia <select id="r-specchia"${bloc}>
        <option value=""${q.suoSpecchia ? '' : ' selected'}>come il prefisso (${specchia ? 'sì' : 'no'})</option>
        <option value="si"${d.specchia === true ? ' selected' : ''}>sì</option>
        <option value="no"${d.specchia === false ? ' selected' : ''}>no</option>
      </select></label>
      <label>misura <span class="tenue">— quanto deve venire, se il foglio l'ha disegnata fuori taglia</span>
        <span class="due">
          <input id="r-misx" type="number" min="1" placeholder="${pw}" value="${(d.misura || [])[0] ?? ''}"${bloc}>
          <input id="r-misy" type="number" min="1" placeholder="${ph}" value="${(d.misura || [])[1] ?? ''}"${bloc}>
        </span></label>
      <label>i pezzi <select id="r-anima"${bloc}>
        <option value=""${anima === null ? ' selected' : ''}>come il ripiego (${animaVera ? 'scorrono' : 'sono alternative'})</option>
        <option value="si"${anima === true ? ' selected' : ''}>scorrono — è un'animazione</option>
        <option value="no"${anima === false ? ' selected' : ''}>sono alternative — si sceglie dal posto</option>
      </select></label>
    </div>
    <p class="tenue" id="r-spiega"></p>

    <div id="r-anteprima"></div>
    <div id="r-cancella"></div>
    <div class="bottoni">
      <button id="r-unisci"${R.segnati.length > 1 && modificabile() ? '' : ' disabled'}>${
        R.segnati.length > 1 ? `unisci i ${R.segnati.length} segnati in una cosa sola`
                             : 'unisci — segna col + quelli che sono la stessa cosa'}</button>
      <button id="r-sdoppia"${rr.length > 1 && modificabile() ? '' : ' disabled'}>${
        rr.length > 1 ? `sdoppia: sono ${rr.length} cose diverse` : 'un fotogramma solo, niente da sdoppiare'}</button>
      <button id="r-butta"${bloc}>butta la voce</button>
    </div>`

  /* cosa diventerà davvero: quanti pezzi finiranno sotto un nome solo,
     e se scorreranno. Il conto dei fratelli è la stessa regola di
     `catalogo_di` — un numero in fondo al nome raggruppa **solo se ci
     sono almeno due fratelli** — ed è quella che spiega perché
     `barile2` resta un secondo barile e non il terzo fotogramma. */
  const fratelli = stelo(R.scelto) === R.scelto ? []
    : voci().filter(n => stelo(n) === stelo(R.scelto) && stelo(n) !== n)
  const quantiPezzi = fratelli.length >= 2 ? fratelli.length : rr.length
  $('#r-spiega').innerHTML = quantiPezzi < 2
    ? 'un pezzo solo'
    : `diventerà <b>${fratelli.length >= 2 ? stelo(R.scelto) : R.scelto}</b> con ${quantiPezzi} pezzi, che ` +
      (animaVera ? '<b>scorrono</b> sull\'orologio' : 'sono <b>alternative</b>: si sceglie dal posto')

  const ant = $('#r-anteprima')
  for (const r of rr) ant.appendChild(provino(r, R.scelto, 4))

  const canc = $('#r-cancella')
  const elenco = d.cancella || []
  canc.innerHTML = `<h3>buchi <span class="tenue">${elenco.length || 'nessuno'}</span></h3>`
  elenco.forEach((r, i) => {
    const riga = document.createElement('div')
    riga.className = 'canc'
    riga.innerHTML = `<code>${r.join(', ')}</code>`
    const b = document.createElement('button')
    b.textContent = '×'
    b.disabled = !modificabile()
    b.addEventListener('click', () => {
      d.cancella.splice(i, 1)
      if (!d.cancella.length) delete d.cancella
      cambiato()
    })
    riga.appendChild(b)
    canc.appendChild(riga)
  })

  if (!modificabile()) return
  const leggi = () => {
    const nuovo = {
      dax: +$('#r-dax').value, day: +$('#r-day').value,
      larg: Math.max(1, +$('#r-larg').value), alto: Math.max(1, +$('#r-alto').value),
      quanti: Math.max(1, +$('#r-quanti').value),
      passox: +$('#r-passox').value, passoy: +$('#r-passoy').value,
    }
    d.da = [nuovo.dax, nuovo.day]
    if (nuovo.larg === R.aperto.cw && nuovo.alto === R.aperto.ch) delete d.cella
    else d.cella = [nuovo.larg, nuovo.alto]
    if (nuovo.quanti > 1) d.quanti = nuovo.quanti; else delete d.quanti
    const predefinito = [Math.max(1, Math.floor(nuovo.larg / R.aperto.cw)), 0]
    if (nuovo.passox === predefinito[0] && nuovo.passoy === predefinito[1]) delete d.passo
    else d.passo = [nuovo.passox, nuovo.passoy]
    cambiato()
  }
  for (const id of ['r-dax', 'r-day', 'r-larg', 'r-alto', 'r-quanti', 'r-passox', 'r-passoy'])
    $('#' + id).addEventListener('change', leggi)

  /* i flag. Il valore vuoto vuol dire «non dichiarare niente e lasciare
     decidere al prefisso»: è importante che si possa **tornare
     indietro**, se no la prima correzione sbagliata resta scritta per
     sempre e il prefisso non conta più niente. */
  $('#r-famiglia').addEventListener('change', e => {
    if (e.target.value) d.famiglia = e.target.value; else delete d.famiglia
    cambiato()
  })
  $('#r-giri').addEventListener('change', e => {
    if (e.target.value) d.giri = +e.target.value; else delete d.giri
    cambiato()
  })
  $('#r-specchia').addEventListener('change', e => {
    if (e.target.value) d.specchia = e.target.value === 'si'; else delete d.specchia
    cambiato()
  })
  $('#r-anima').addEventListener('change', e => {
    metteAnima(R.scelto, e.target.value === '' ? null : e.target.value === 'si')
    cambiato()
  })
  /* `misura` non è il rettangolo: il rettangolo dice **dove tagliare**,
     questa dice **quanto deve venire**. Servono tutte e due o nessuna,
     quindi un campo vuoto le cancella entrambe invece di lasciare
     un'altezza orfana che il generatore scarterebbe con un avviso. */
  const leggiMisura = () => {
    const w = +$('#r-misx').value, h = +$('#r-misy').value
    if (w >= 1 && h >= 1) d.misura = [Math.round(w), Math.round(h)]
    else delete d.misura
    cambiato()
  }
  $('#r-misx').addEventListener('change', leggiMisura)
  $('#r-misy').addEventListener('change', leggiMisura)

  $('#r-nome').addEventListener('change', e => rinomina(R.scelto, e.target.value.trim()))
  $('#r-unisci').addEventListener('click', unisci)
  $('#r-sdoppia').addEventListener('click', sdoppia)
  $('#r-butta').addEventListener('click', () => {
    delete R.aperto.fg.sprite[R.scelto]
    R.scelto = null
    cambiato()
  })
}

/* ═══════════ le correzioni che spostano nomi ═══════════ */

/* Rinominare **tenendo il posto**: un `delete` più un assegnamento
   sposterebbe la voce in fondo, e un foglietto in cui l'ordine salta
   a ogni correzione non si rilegge più in diff. */
function riordina(vecchio, coppie) {
  const s = R.aperto.fg.sprite
  const fuori = {}
  for (const k of Object.keys(s)) {
    if (k !== vecchio) { fuori[k] = s[k]; continue }
    for (const [n, v] of coppie) fuori[n] = v
  }
  R.aperto.fg.sprite = fuori
}

function rinomina(vecchio, nuovo) {
  if (!nuovo || nuovo === vecchio) return
  if (R.aperto.fg.sprite[nuovo]) return dillo(`«${nuovo}» esiste già`)
  riordina(vecchio, [[nuovo, R.aperto.fg.sprite[vecchio]]])
  R.scelto = nuovo
  cambiato()
  dillo(`«${vecchio}» adesso si chiama «${nuovo}»`)
}

/* ── sdoppiare ──
   È la correzione del difetto più insidioso dei fogli generati: due
   disegni diversi affiancati, che una `quanti: 2` dichiara fotogrammi
   di una cosa sola. In gioco non si presenta come un errore — si
   presenta come una casa che si trasforma in un'altra casa sei volte al
   secondo, e chi guarda pensa «bello, è animata».

   Le voci nuove finiscono in `nome_a`, `nome_b`: **lettere e non
   numeri**, perché un numero in fondo al nome è esattamente quello che
   `catalogo_di` rilegge come «sono la stessa cosa», e si tornerebbe al
   punto di partenza. Poi si rinominano, che è il lavoro vero. */
function sdoppia() {
  const nome = R.scelto
  const rr = rettangoli(nome)
  const d = R.aperto.fg.sprite[nome]
  const { cw, ch } = R.aperto
  const lettere = 'abcdefghijklmnopqrstuvwxyz'
  const coppie = rr.map(([x, y, w, h], i) => {
    const q = { da: [Math.round(x / cw), Math.round(y / ch)] }
    if (w !== cw || h !== ch) q.cella = [w, h]
    if (d.cancella) q.cancella = d.cancella.map(r => [...r])
    if (d.famiglia) q.famiglia = d.famiglia
    return [`${nome}_${lettere[i] || i}`, q]
  })
  riordina(nome, coppie)
  R.scelto = coppie[0][0]
  cambiato()
  dillo(`${coppie.length} voci separate: ${coppie.map(c => c[0]).join(', ')} — adesso vanno chiamate col loro nome`)
}

/* ── un ritaglio che non c'era ──
   Il nome provvisorio va a **lettere** e mai a cifre: `nuovo_a`,
   `nuovo_b`. Due ritagli nuovi chiamati `nuovo1` e `nuovo2` sarebbero,
   per `catalogo_di`, i due fotogrammi di una cosa sola — si
   ritroverebbero uniti senza che nessuno l'abbia chiesto, e il difetto
   comparirebbe a schermo come un lampeggio.

   Si infila **in ordine alfabetico** se il foglietto è già ordinato
   (lo sono tutti, li scrive un generatore): un file che si ordina da sé
   resta leggibile in diff dopo cento correzioni. */
function creaRitaglio(x, y, w, h) {
  const s = R.aperto.fg.sprite, { cw, ch } = R.aperto
  const lettere = 'abcdefghijklmnopqrstuvwxyz'
  let nome = ''
  for (let i = 0; !nome || s[nome]; i++)
    nome = 'nuovo_' + (lettere[i % 26].repeat(Math.floor(i / 26) + 1))

  const dax = Math.round(x / cw), day = Math.round(y / ch)
  const q = { da: [dax, day] }
  const larg = Math.max(1, Math.round(x + w - dax * cw)), alto = Math.max(1, Math.round(y + h - day * ch))
  if (larg !== cw || alto !== ch) q.cella = [larg, alto]

  const chiavi = Object.keys(s)
  const ordinato = chiavi.every((k, i) => !i || chiavi[i - 1].localeCompare(k) <= 0)
  const dopo = ordinato ? chiavi.find(k => k.localeCompare(nome) > 0) : null
  if (!dopo) s[nome] = q
  else {
    const fuori = {}
    for (const k of chiavi) { if (k === dopo) fuori[nome] = q; fuori[k] = s[k] }
    R.aperto.fg.sprite = fuori
  }

  R.scelto = nome
  R.modo = 'ritaglio'
  accendiModo()
  cambiato()
  dillo(`ritaglio nuovo «${nome}», ${larg}×${alto} — adesso dagli il nome giusto qui a destra`)
}

/* ── unire ──
   Il difetto opposto, e capita ancora più spesso: `bandiera0`,
   `bandiera1` e `bandiera_asta` sono la stessa cosa, ma il terzo non ha
   il numero e quindi `catalogo_di` lo lascia fuori dal gruppo — la
   bandiera esce a due fotogrammi e l'asta come un oggetto a sé, che poi
   qualcuno posa sul prato per sbaglio.

   Unire vuol dire una cosa sola: **dargli lo stesso stelo e numerarli
   in fila**. È tutta lì la convenzione — `nome0`, `nome1`, `nome2` con
   almeno due fratelli — e il fatto che la si possa applicare col dito
   invece che rinominando tre righe a mano è la differenza fra
   accorgersene e lasciar perdere.

   L'ordine è quello in cui li hai segnati, non quello dell'elenco: una
   bandiera che sventola al contrario è un difetto che si vede subito e
   non si spiega, e l'unico che sa qual è il verso giusto è chi guarda.

   Il nome esce dallo stelo del primo, e va cambiato dopo: qui il lavoro
   è dire *quali* sono la stessa cosa, e battere un nome mentre lo si
   dice è un secondo lavoro che si può fare con calma. */
function unisci() {
  const s = R.aperto.fg.sprite
  const quali = R.segnati.filter(n => s[n])
  if (quali.length < 2) return dillo('segnane almeno due col +')
  const { cw, ch } = R.aperto

  const pezzi = []
  for (const n of quali) {
    const d = s[n]
    for (const [x, y, w, h] of rettangoli(n)) {
      const q = { da: [Math.round(x / cw), Math.round(y / ch)] }
      if (w !== cw || h !== ch) q.cella = [w, h]
      if (d.cancella) q.cancella = d.cancella.map(r => [...r])
      for (const k of ['famiglia', 'giri', 'specchia'])
        if (d[k] !== undefined) q[k] = d[k]
      pezzi.push(q)
    }
  }

  let base = stelo(quali[0]) || quali[0]
  const libero = n => !s[n] || quali.includes(n)
  if (pezzi.some((_, i) => !libero(`${base}${i}`))) base += '_unito'
  if (pezzi.some((_, i) => !libero(`${base}${i}`)))
    return dillo(`«${base}0» esiste già: rinomina prima quello`)

  /* si ricostruisce l'oggetto in un colpo: i nuovi pezzi al posto del
     primo segnato, e gli altri segnati saltati. Farlo in due passate —
     prima inserire, poi cancellare — vorrebbe dire che un nome nuovo
     uguale a un segnato vecchio si pesta i piedi da solo. */
  const fuori = {}
  for (const k of Object.keys(s)) {
    if (k === quali[0]) pezzi.forEach((q, i) => { fuori[`${base}${i}`] = q })
    else if (!quali.includes(k)) fuori[k] = s[k]
  }
  R.aperto.fg.sprite = fuori

  R.segnati = []
  R.scelto = `${base}0`
  cambiato()
  dillo(`${quali.length} voci unite in «${base}», ${pezzi.length} pezzi in fila — ` +
        'adesso decidi se scorrono o sono alternative, e dagli il nome giusto')
}

function cambiato() {
  R.sporco = true
  scopertiInvalida()
  costruisciElenco()
  dettaglio()
  ridisegna()
  $('#r-salva').disabled = false
}

/* ═══════════ il dito sul foglio ═══════════ */
function dovePunta(e) {
  const cv = tela(), r = cv.getBoundingClientRect()
  return [R.pan[0] + (e.clientX - r.left) / R.zoom, R.pan[1] + (e.clientY - r.top) / R.zoom]
}

function collega() {
  const cv = tela()

  cv.addEventListener('wheel', e => {
    e.preventDefault()
    const [px, py] = dovePunta(e)
    const prima = R.zoom
    R.zoom = Math.max(0.25, Math.min(16, R.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15)))
    /* si ingrandisce **dove sta il dito**, non al centro: altrimenti a
       ogni scatto di rotella quello che si stava guardando scappa */
    R.pan = [px - (px - R.pan[0]) * prima / R.zoom, py - (py - R.pan[1]) * prima / R.zoom]
    ridisegna()
  }, { passive: false })

  cv.addEventListener('pointerdown', e => {
    if (!R.aperto) return
    const [px, py] = dovePunta(e)
    /* il tasto di mezzo, o lo spazio premuto, spostano il foglio: sono
       le due mani che chiunque abbia usato un editor di immagini prova
       per prime */
    if (e.button === 1 || R.spazio) {
      /* il trascinamento del foglio si segna **in coordinate schermo**:
         `dovePunta` misura a partire da `pan`, e usarlo per muovere
         `pan` sarebbe un metro che si accorcia mentre lo si usa */
      R.trascina = { che: 'pan', schermo: [e.clientX, e.clientY], pan: [...R.pan] }
      cv.setPointerCapture(e.pointerId)
      return
    }
    if (e.button !== 0) return

    /* un ritaglio nuovo si tira dove si vuole, anche sopra gli altri:
       la spia «quello che nessuno prende» serve a trovare la roba mai
       ritagliata, e senza un gesto per prenderla resterebbe una spia
       che accusa e basta */
    if (R.modo === 'nuovo' && modificabile()) {
      R.trascina = { che: 'nuovo-ritaglio', partenza: [px, py], rett: [px, py, 0, 0] }
      cv.setPointerCapture(e.pointerId)
      return
    }

    if (R.scelto && modificabile()) {
      const [x, y, w, h] = rettangoli(R.scelto)[0]
      if (R.modo === 'cancella') {
        if (px >= x && px < x + w && py >= y && py < y + h) {
          R.trascina = { che: 'nuovo-cancella', partenza: [px, py], base: [x, y], rett: [0, 0, 0, 0] }
          cv.setPointerCapture(e.pointerId)
          return
        }
      } else {
        const vicino = 6 / R.zoom
        const i = maniglie(x, y, w, h)
          .findIndex(([hx, hy]) => Math.abs(px - hx) < vicino && Math.abs(py - hy) < vicino)
        if (i >= 0) {
          R.trascina = { che: 'maniglia', verso: VERSI_MANIGLIA[i], partenza: [px, py], rett: [x, y, w, h] }
          cv.setPointerCapture(e.pointerId)
          return
        }
        if (px >= x && px < x + w && py >= y && py < y + h) {
          R.trascina = { che: 'sposta', partenza: [px, py], da: [...R.aperto.fg.sprite[R.scelto].da] }
          cv.setPointerCapture(e.pointerId)
          return
        }
      }
    }
    /* fuori da quella scelta: si sceglie quella sotto il dito. Il
       `findLast` perché una voce piccola dentro una grande sta sotto
       nell'elenco e sopra a schermo. */
    const sotto = voci().filter(n =>
      rettangoli(n).some(([x, y, w, h]) => px >= x && px < x + w && py >= y && py < y + h))
    if (sotto.length) scegli(sotto[sotto.length - 1])
  })

  cv.addEventListener('pointermove', e => {
    if (!R.trascina) return
    const [px, py] = dovePunta(e)
    const t = R.trascina
    const { cw, ch } = R.aperto
    if (t.che === 'pan') {
      R.pan = [t.pan[0] - (e.clientX - t.schermo[0]) / R.zoom,
               t.pan[1] - (e.clientY - t.schermo[1]) / R.zoom]
      return ridisegna()
    }
    const d = R.aperto.fg.sprite[R.scelto]
    if (t.che === 'sposta') {
      d.da = [t.da[0] + Math.round((px - t.partenza[0]) / cw),
              t.da[1] + Math.round((py - t.partenza[1]) / ch)]
      return ridisegna()
    }
    if (t.che === 'maniglia') {
      let [x, y, w, h] = t.rett
      let x2 = x + w, y2 = y + h
      const v = t.verso
      if (v.includes('o')) x = px
      if (v.includes('e')) x2 = px
      if (v.includes('n')) y = py
      if (v.includes('s')) y2 = py
      /* l'angolo si allinea alla cella (è quello che `da` sa dire), la
         misura resta al pixel (è quello che `cella` sa dire) */
      const dax = Math.round(x / cw), day = Math.round(y / ch)
      d.da = [dax, day]
      const larg = Math.max(1, Math.round(x2 - dax * cw)), alto = Math.max(1, Math.round(y2 - day * ch))
      if (larg === cw && alto === ch) delete d.cella; else d.cella = [larg, alto]
      return ridisegna()
    }
    if (t.che === 'nuovo-cancella') {
      const x = Math.min(px, t.partenza[0]) - t.base[0], y = Math.min(py, t.partenza[1]) - t.base[1]
      t.rett = [Math.round(x), Math.round(y),
                Math.round(Math.abs(px - t.partenza[0])), Math.round(Math.abs(py - t.partenza[1]))]
      return ridisegna()
    }
    if (t.che === 'nuovo-ritaglio') {
      t.rett = [Math.min(px, t.partenza[0]), Math.min(py, t.partenza[1]),
                Math.abs(px - t.partenza[0]), Math.abs(py - t.partenza[1])]
      return ridisegna()
    }
  })

  const finito = () => {
    const t = R.trascina
    R.trascina = null
    if (!t) return
    if (t.che === 'nuovo-cancella') {
      const [x, y, w, h] = t.rett
      if (w < 1 || h < 1) return ridisegna()
      const d = R.aperto.fg.sprite[R.scelto]
      ;(d.cancella ||= []).push([Math.max(0, x), Math.max(0, y), w, h])
      dillo(`cancella [${x}, ${y}, ${w}, ${h}] su «${R.scelto}»`)
    }
    if (t.che === 'nuovo-ritaglio') {
      const [x, y, w, h] = t.rett
      if (w < 2 || h < 2) { dillo('troppo piccolo: tira un rettangolo attorno alla cosa'); return ridisegna() }
      creaRitaglio(x, y, w, h)
      return
    }
    if (t.che === 'pan') return ridisegna()
    cambiato()
  }
  cv.addEventListener('pointerup', finito)
  cv.addEventListener('pointercancel', finito)
  cv.addEventListener('contextmenu', e => e.preventDefault())
}

/* ═══════════ scrivere il foglietto ═══════════ */

/* JSON scritto come lo scriverebbe una persona: un array di numeri sta
   su una riga, e una voce corta sta tutta su una riga. Non è vezzo —
   duecento sprite con ogni numero a capo fanno un file di ottocento
   righe in cui un diff non si legge, e il diff è il modo in cui si
   controlla che una correzione abbia toccato quello che doveva. */
function scriviJson(v, ind = '') {
  if (Array.isArray(v)) {
    if (v.every(x => typeof x === 'number')) return '[' + v.join(', ') + ']'
    const pezzi = v.map(x => scriviJson(x, ind + '  '))
    /* anche una lista di liste corte sta su una riga: `cancella` sono
       tre rettangoli di quattro numeri, e spalmarli su quindici righe
       li fa sembrare la cosa più importante del foglietto */
    const riga = '[' + pezzi.join(', ') + ']'
    if (riga.length + ind.length <= 96 && !riga.includes('\n')) return riga
    return '[\n' + pezzi.map(p => ind + '  ' + p).join(',\n') + '\n' + ind + ']'
  }
  if (v && typeof v === 'object') {
    const chiavi = Object.keys(v)
    if (!chiavi.length) return '{}'
    const pezzi = chiavi.map(k => JSON.stringify(k) + ': ' + scriviJson(v[k], ind + '  '))
    const riga = '{' + pezzi.join(', ') + '}'
    if (riga.length + ind.length <= 96 && !riga.includes('\n')) return riga
    return '{\n' + pezzi.map(p => ind + '  ' + p).join(',\n') + '\n' + ind + '}'
  }
  return JSON.stringify(v)
}

async function salva() {
  const testo = scriviJson(R.aperto.fg) + '\n'
  try {
    const r = await fetch('/__foglietto', {
      method: 'POST',
      body: JSON.stringify({ file: R.aperto.chiave, testo }),
    })
    if (!r.ok) throw new Error(await r.text())
    R.sporco = false
    R.aperto.testo = testo
    $('#r-salva').disabled = true
    dillo(`${R.aperto.nome} scritto — adesso «python3 strumenti/sprite/atlante.py» per rigenerare`)
  } catch (e) {
    dillo(`non l'ho potuto scrivere (${e.message}) — te lo metto negli appunti`)
    navigator.clipboard.writeText(testo).catch(() => {})
  }
}

function dillo(t) { $('#ritagli-avviso').textContent = t }

function accendiModo() {
  for (const q of document.querySelectorAll('#ritagli-modo button'))
    q.classList.toggle('acceso', q.dataset.modo === R.modo)
  dillo({
    ritaglio: 'trascina il rettangolo per spostarlo, gli angoli per stringerlo — le frecce di un pixel',
    cancella: 'trascina DENTRO il ritaglio scelto per bucarlo: è dato nel foglietto, il PNG non si tocca',
    nuovo: 'tira un rettangolo attorno a qualcosa che nessuno ritagliava ancora',
  }[R.modo])
  ridisegna()
}

/* ── la scorciatoia dall'altra metà ──
   Da «il mondo» si guarda un pezzo sull'erba e si vede che è storto. La
   domanda dopo è sempre la stessa — «da dove viene, e dov'è il suo
   rettangolo?» — e finora voleva sapere a memoria in quale dei tredici
   fogli stesse. La voce se lo porta dietro (`da`), quindi lo può dire
   lei.

   Il nome del pezzo non è sempre il nome della riga nel foglietto: un
   `quanti: 3` dichiara `fontana` e produce `fontana0`. Si prova il nome
   pieno, poi lo stelo — le due sole forme che il generatore produce. */
export async function apriSu(foglio, pezzo) {
  if (!R.fogli.length) raduna()
  /* `da` porta il nome dell'**immagine** (`oggetti_2.png`), qui i fogli
     si chiamano col percorso del foglietto (`gfx/oggetti_2.json`): si
     confronta il gambo, che è l'unica parte che i due hanno in comune.
     Cercare `.json` dentro un `.png` è il genere di sbaglio che non dà
     nessun errore — non trova, e basta. */
  const gambo = s => s.split('/').pop().replace(/\.(json|png|jpe?g)$/i, '')
  const f = R.fogli.find(x => gambo(x.nome) === gambo(foglio))
  if (!f) return dillo(`«${foglio}»: non trovo quel foglio fra le sorgenti`)
  if (!R.aperto || R.aperto.chiave !== f.chiave) {
    $('#ritagli-foglio').value = f.chiave
    await apriFoglio(f.chiave)
  }
  const chiave = R.aperto.fg.sprite && (R.aperto.fg.sprite[pezzo] ? pezzo
    : R.aperto.fg.sprite[stelo(pezzo)] ? stelo(pezzo) : null)
  if (!chiave) return dillo(`«${pezzo}» sta in ${f.nome}, ma non come riga a sé — cercalo qui a sinistra`)
  R.cerca = ''
  $('#ritagli-cerca').value = ''
  costruisciElenco()
  scegli(chiave)
}

/* ═══════════ l'avvio ═══════════ */
export function avviaRitagli() {
  raduna()
  if (!R.fogli.length) return dillo('nessun foglio con foglietto sotto strumenti/sprite/sorgenti/')
  $('#ritagli-foglio').innerHTML = R.fogli
    .map(f => `<option value="${f.chiave}"${f.misurato ? ' disabled' : ''}>${f.nome}` +
              `${f.misurato ? ' — misurato da terreni.py, niente da spostare' : ''}</option>`).join('')
  $('#ritagli-foglio').addEventListener('change', e => {
    if (R.sporco && !confirm('ci sono correzioni non salvate: le butto?')) {
      e.target.value = R.aperto.chiave
      return
    }
    apriFoglio(e.target.value)
  })
  $('#ritagli-cerca').addEventListener('input', e => { R.cerca = e.target.value; costruisciElenco() })
  $('#ritagli-scoperti').addEventListener('change', e => { R.scoperti = e.target.checked; ridisegna() })
  for (const b of document.querySelectorAll('#ritagli-modo button'))
    b.addEventListener('click', () => { R.modo = b.dataset.modo; accendiModo() })
  $('#ritagli-tutto').addEventListener('click', tuttoIlFoglio)
  $('#r-salva').addEventListener('click', salva)
  addEventListener('keydown', e => {
    if (e.key === ' ') R.spazio = true
    if (!R.aperto || document.activeElement.tagName === 'INPUT') return
    if (e.key === 'Escape') { R.scelto = null; dettaglio(); ridisegna() }
    /* le frecce spostano di una cella: è come si mette a posto un bordo
       quando il trascinamento è arrivato vicino ma non esatto */
    const passi = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
    if (passi[e.key] && R.scelto && modificabile()) {
      e.preventDefault()
      const d = R.aperto.fg.sprite[R.scelto]
      if (e.shiftKey) {
        const [w, h] = d.cella || [R.aperto.cw, R.aperto.ch]
        d.cella = [Math.max(1, w + passi[e.key][0]), Math.max(1, h + passi[e.key][1])]
      } else d.da = [d.da[0] + passi[e.key][0], d.da[1] + passi[e.key][1]]
      cambiato()
    }
  })
  addEventListener('keyup', e => { if (e.key === ' ') R.spazio = false })
  addEventListener('resize', () => { if (R.aperto && $('#scena-ritagli').style.display !== 'none') ridisegna() })
  collega()
  const primo = R.fogli.find(f => !f.misurato) || R.fogli[0]
  $('#ritagli-foglio').value = primo.chiave
  return apriFoglio(primo.chiave)
}

export function rinfrescaRitagli() {
  if (!R.aperto) return
  R.zoom = adattaZoom()
  ridisegna()
}
