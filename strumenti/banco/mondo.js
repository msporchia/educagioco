/* ═══════════════════════════════════════════════════════════════════
   IL BANCO DEI MONDI — una pagina sola, per tutti gli sprite

   Prima ce n'erano quattro, e nessuna faceva il giro completo:
   `strumenti/sprite/anteprima.html` mostrava solo la fattoria,
   `poc/fattoria-gfx.html`, `poc/sotterraneo-gfx.html` e
   `poc/castello-gfx.html` erano prototipi congelati al giorno in cui
   sono stati scritti. Il sotterraneo e il castello non avevano nessun
   posto dove guardarsi gli sprite accostati.

   Questa pagina ne fa una. Non sa niente dei giochi: chiede a un mondo
   (`mondi.js`) le sue **voci** — la bambina, la fontana, una tessera di
   bosco, ognuna con le sue pose e i suoi fotogrammi — e da lì in poi si
   comporta uguale per tutti. È quello che ha comprato la
   standardizzazione degli atlanti: prima ogni foglio nominava i pezzi a
   modo suo e chi voleva mostrarli doveva conoscere tre convenzioni.

   ── cosa ci si fa ──
   · si guarda **la cosa, non il pezzo**: la fontana è una voce sola,
     grande in mezzo, coi suoi tre fotogrammi piccoli di fianco. Chi
     cammina si muove nel riquadro.
   · si **posa roba sulla mappa**: si tocca una voce, si tocca il campo.
     Quello che si può girare si gira (`R`), quello che si può
     specchiare si specchia (`F`) — e la manopola compare **solo** dove
     ha senso, perché è la voce a dire quanto regge.
   · si **compone una strada** col risolutore vero, se quel mondo ha
     tessere con gli attacchi misurati.
   · si tira lo **zoom**, che è la domanda vera: uno sprite che tiene a
     ingrandimento intero può sfrangiarsi a 1,4, e non si scopre
     guardandolo da solo su fondo neutro.

   ── le prove automatiche ──
   Tre scene che si costruiscono da sole, perché sono quelle in cui i
   difetti si vedono e che nessuno ha voglia di rifare a mano ogni
   volta: **tutto accostato** (i bordi litigano solo se si toccano),
   **una strada che gira** (i giunti), **tutti quelli che camminano** in
   fila (i tempi e il piede).
   ═══════════════════════════════════════════════════════════════════ */
import { MONDI, apri, netto } from './mondi.js'

const S = {
  mondo: null,
  zoom: 3,
  scelta: null,         // la voce che si sta per posare
  posa: 'fermo',
  gira: 0,
  specchia: false,
  griglia: true,
  posate: [],           // { voce, posa, x, y, gira, specchia }
  fondo: new Map(),     // "cx,cy" → voce di famiglia fondo
  cerca: '',            // filtro sul nome
  da: '',               // filtro sulla provenienza
  raggruppa: 'famiglia',// famiglia | da
}

const CELLE_X = 16, CELLE_Y = 12

/* ── scorrere o scegliere ──
   Più pezzi sotto lo stesso nome sono due cose opposte, e la voce lo
   dice (`anima`). I **fotogrammi** di una fontana si scorrono
   sull'orologio; le **varianti** — ventisei cespugli diversi — no: si
   pesca sempre la stessa, dal posto in cui sta, se no il campo
   lampeggia e ogni cespuglio si trasforma nel successivo venticinque
   volte al secondo. Era quello che faceva questa pagina, ed è il motivo
   per cui il difetto si è visto qui prima che in partita. */
function fotogrammaDi(p, t) {
  const quanti = (p.voce.pose[p.posa] || []).length || 1
  if (quanti < 2) return 0
  if (p.voce.anima) return Math.floor(t * 6) % quanti
  return Math.abs(Math.round(p.x * 7 + p.y * 13)) % quanti
}
const $ = s => document.querySelector(s)

/* ═══════════ il campo ═══════════ */
const tela = $('#campo')
const ctx = tela.getContext('2d')

function misureCampo() {
  const T = S.mondo.tessera
  return { T, L: CELLE_X * T, A: CELLE_Y * T }
}

function ridisegna(t = 0) {
  if (!S.mondo) return
  const { T, L, A } = misureCampo()
  const z = S.zoom
  tela.width = Math.round(L * z)
  tela.height = Math.round(A * z)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = '#0e1014'
  ctx.fillRect(0, 0, tela.width, tela.height)
  ctx.setTransform(z, 0, 0, z, 0, 0)
  netto(ctx)

  for (const [k, voce] of S.fondo) {
    const [cx, cy] = k.split(',').map(Number)
    S.mondo.disegna(ctx, { voce, x: (cx + 0.5) * T, y: (cy + 0.5) * T })
  }

  if (S.griglia) {
    ctx.strokeStyle = 'rgba(255,255,255,.10)'
    ctx.lineWidth = 1 / z
    for (let x = 0; x <= CELLE_X; x++) {
      ctx.beginPath(); ctx.moveTo(x * T, 0); ctx.lineTo(x * T, A); ctx.stroke()
    }
    for (let y = 0; y <= CELLE_Y; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * T); ctx.lineTo(L, y * T); ctx.stroke()
    }
  }

  /* chi sta più in basso si disegna dopo: è l'unica regola che fa
     sembrare un mondo dall'alto un posto invece che un collage */
  for (const p of [...S.posate].sort((a, b) => a.y - b.y))
    S.mondo.disegna(ctx, { ...p, fotogramma: fotogrammaDi(p, t) })
}

/* ═══════════ il pannello delle voci ═══════════
   Una voce è **una cosa**: grande in mezzo, e i suoi fotogrammi
   piccoli di fianco. Chi ha più pose le mostra tutte, una riga per
   posa, perché un attore senza il verso «su» si vede solo così. */
function riquadroVoce(voce) {
  const box = document.createElement('div')
  box.className = 'voce'
  box.dataset.voce = voce.id

  const testa = document.createElement('div')
  testa.className = 'testa'
  const pose = Object.keys(voce.pose)
  const quanti = Math.max(...pose.map(p => voce.pose[p].length))
  testa.innerHTML = `<b>${voce.id}</b><span>${voce.famiglia}` +
    (voce.giri > 1 ? ` · gira ×${voce.giri}` : '') +
    (voce.materia ? ' · ' + voce.materia : '') +
    (quanti > 1 ? (voce.anima ? ` · ${quanti} fotogrammi` : ` · ${quanti} varianti`) : '') +
    '</span>'
  if (voce.da) {
    const d = document.createElement('div')
    d.className = 'da'
    d.textContent = voce.da
    testa.appendChild(d)
  }
  box.appendChild(testa)

  for (const posa of pose) {
    const riga = document.createElement('div')
    riga.className = 'riga'
    if (pose.length > 1 || posa !== 'fermo') {
      const et = document.createElement('span')
      et.className = 'posa'
      et.textContent = posa
      riga.appendChild(et)
    }
    /* il primo grande, gli altri piccoli di fianco: si guarda la cosa,
       e i pezzi restano lì per chi deve controllarli */
    const fotogrammi = voce.pose[posa]
    riga.appendChild(provino(voce, posa, 0, 'grande'))
    for (let i = 1; i < fotogrammi.length; i++)
      riga.appendChild(provino(voce, posa, i, 'piccolo'))
    box.appendChild(riga)
  }

  box.addEventListener('click', () => {
    S.scelta = voce
    S.posa = pose[0]
    S.gira = 0
    S.specchia = false
    aggiornaScelta()
  })
  return box
}

function provino(voce, posa, fr, classe) {
  const m = S.mondo.misura(voce, posa) || { w: S.mondo.tessera, h: S.mondo.tessera }
  const z = classe === 'grande' ? 3 : 2
  const cv = document.createElement('canvas')
  cv.className = 'provino ' + classe
  cv.width = Math.max(8, m.w) * z
  cv.height = Math.max(8, m.h) * z
  const c = cv.getContext('2d')
  c.setTransform(z, 0, 0, z, 0, 0)
  netto(c)
  c.fillStyle = 'rgba(255,255,255,.05)'
  c.fillRect(0, 0, cv.width, cv.height)
  S.mondo.disegna(c, {
    voce, posa, fotogramma: fr,
    x: m.w / 2,
    y: (voce.famiglia === 'tessera' || voce.famiglia === 'fondo')
      ? m.h / 2 : m.h - S.mondo.tessera / 2,
  })
  cv.title = `${voce.id} · ${posa} · ${fr}`
  return cv
}

/* ── quali voci si vedono ──
   Duecento voci in una lista sola non si guardano: si scorrono. Il
   filtro per nome serve a trovare, quello per **provenienza** serve a
   una domanda diversa e più importante — «questi due pezzi vengono
   dallo stesso foglio?». È la domanda che dice se un atlante ha un set
   arricchito o due set che si sovrappongono, e senza si scopre quando
   due panchine di stile diverso finiscono nello stesso prato. */
function vociDaMostrare() {
  const q = S.cerca.trim().toLowerCase()
  return S.mondo.voci.filter(v =>
    (!q || v.id.toLowerCase().includes(q)) &&
    (!S.da || v.da === S.da))
}

function costruisciPannello() {
  const dove = $('#voci')
  dove.innerHTML = ''
  const viste = vociDaMostrare()
  const per = {}
  for (const v of viste) (per[S.raggruppa === 'da' ? (v.da || 'senza foglio') : v.famiglia] ||= []).push(v)
  for (const gruppo of Object.keys(per).sort()) {
    const h = document.createElement('h2')
    h.textContent = `${gruppo} · ${per[gruppo].length}`
    dove.appendChild(h)
    for (const v of per[gruppo]) dove.appendChild(riquadroVoce(v))
  }
  $('#quante').textContent = viste.length === S.mondo.voci.length
    ? `${viste.length} voci` : `${viste.length} di ${S.mondo.voci.length}`
}

function aggiornaScelta() {
  for (const el of document.querySelectorAll('.voce'))
    el.classList.toggle('scelta', el.dataset.voce === (S.scelta && S.scelta.id))
  const v = S.scelta
  $('#scelta').textContent = v
    ? `${v.id} · ${S.posa}${v.giri > 1 ? ` · giro ${S.gira}` : ''}${S.specchia ? ' · specchiata' : ''}`
    : 'niente'
  $('#gira').disabled = !v || v.giri <= 1
  $('#specchia').disabled = !v || !v.specchia
}

/* ═══════════ posare ═══════════ */
tela.addEventListener('pointerdown', e => {
  if (!S.scelta) return
  const r = tela.getBoundingClientRect()
  const T = S.mondo.tessera
  const x = (e.clientX - r.left) / S.zoom
  const y = (e.clientY - r.top) / S.zoom
  if (S.scelta.famiglia === 'fondo') {
    const k = `${Math.floor(x / T)},${Math.floor(y / T)}`
    S.fondo.set(k, S.scelta)
  } else if (S.scelta.famiglia === 'tessera') {
    /* una tessera cade nella sua casella: posarla a mezzo pixel è il
       modo più veloce di credere che il foglio abbia un difetto */
    S.posate.push({ voce: S.scelta, posa: S.posa, gira: S.gira, specchia: S.specchia,
                    x: (Math.floor(x / T) + 0.5) * T, y: (Math.floor(y / T) + 0.5) * T })
  } else {
    S.posate.push({ voce: S.scelta, posa: S.posa, gira: S.gira, specchia: S.specchia, x, y })
  }
})

tela.addEventListener('contextmenu', e => {
  e.preventDefault()
  const r = tela.getBoundingClientRect()
  const x = (e.clientX - r.left) / S.zoom, y = (e.clientY - r.top) / S.zoom
  const T = S.mondo.tessera
  const i = S.posate.findLastIndex(p => Math.abs(p.x - x) < T && Math.abs(p.y - y) < T)
  if (i >= 0) S.posate.splice(i, 1)
  else S.fondo.delete(`${Math.floor(x / T)},${Math.floor(y / T)}`)
})

/* ═══════════ le prove che si fanno da sole ═══════════ */
function provaAccostate() {
  svuota()
  const tessere = S.mondo.voci.filter(v => v.famiglia === 'tessera' || v.famiglia === 'fondo')
  if (!tessere.length) return avviso('questo mondo non ha tessere')
  const T = S.mondo.tessera
  tessere.forEach((v, i) => {
    const cx = i % CELLE_X, cy = Math.floor(i / CELLE_X)
    if (cy >= CELLE_Y) return
    S.posate.push({ voce: v, posa: 'fermo', gira: 0, specchia: false,
                    x: (cx + 0.5) * T, y: (cy + 0.5) * T })
  })
  avviso(`${Math.min(tessere.length, CELLE_X * CELLE_Y)} tessere accostate: i bordi litigano solo se si toccano`)
}

function provaCamminata() {
  svuota()
  const attori = S.mondo.voci.filter(v => v.famiglia === 'attore')
  if (!attori.length) return avviso('questo mondo non ha nessuno che cammini')
  const T = S.mondo.tessera
  attori.forEach((v, i) => {
    Object.keys(v.pose).forEach((posa, k) => {
      S.posate.push({ voce: v, posa, gira: 0, specchia: false,
                     x: (2 + k * 3) * T, y: (1.5 + i * 1.6) * T })
    })
  })
  avviso(`${attori.length} che camminano, tutte le pose: si guardano i tempi e il piede`)
}

function provaStrada() {
  svuota()
  if (!S.mondo.strade) return avviso('questo mondo non ha tessere con gli attacchi misurati')
  const T = S.mondo.tessera
  const materia = $('#materia').value || S.mondo.strade.materie[0]
  const catalogo = S.mondo.strade.catalogoDi(materia)
  const fondi = S.mondo.strade.fondiDi(materia)

  for (let x = 0; x < CELLE_X; x++)
    for (let y = 0; y < CELLE_Y; y++)
      if (fondi.length) S.fondo.set(`${x},${y}`, fondi[(x * 7 + y * 3) % fondi.length])

  /* una serpentina: scende, gira, riscende. È la forma in cui un giunto
     sbagliato si vede subito, perché ci sono tutti e quattro i gomiti */
  const celle = []
  let x = 2, y = 0, verso = 1
  while (y < CELLE_Y) {
    celle.push([x, y])
    if (celle.length % 5 === 0 && x + verso * 4 > 0 && x + verso * 4 < CELLE_X) {
      for (let k = 1; k <= 4; k++) celle.push([x + verso * k, y])
      x += verso * 4
      verso = -verso
    }
    y++
  }
  const dentro = (a, b) => a >= 0 && a < CELLE_X && b >= 0 && b < CELLE_Y
  const scelte = S.mondo.strade.componi(celle, catalogo,
    { dentro, capi: { parte: 'N', arriva: 'S' } })
  if (!scelte) return avviso(`«${materia}»: il catalogo non chiude questa strada — manca un pezzo`)

  celle.forEach(([cx, cy], i) => {
    const p = scelte[i]
    if (!p) return
    const voce = S.mondo.voci.find(v => v.pose.fermo && v.pose.fermo[0] === p.nome)
    if (voce) S.posate.push({ voce, posa: 'fermo', gira: p.gira, specchia: p.specchia,
                             x: (cx + 0.5) * T, y: (cy + 0.5) * T })
  })
  avviso(`«${materia}»: strada composta, ${celle.length} celle — girare permuta gli attacchi, non solo i pixel`)
}

function svuota() { S.posate = []; S.fondo.clear() }

/* ── il prato sotto ──
   Uno sprite si giudica **sul fondo su cui starà**, non sul nero: sul
   nero qualunque cosa ha i bordi netti e la luce giusta, e i due
   difetti che si cercano — l'alone di scontorno e lo stile che non
   combacia — si vedono solo appoggiati sull'erba accanto a qualcos'altro.
   Per questo il campo si riempie con un vero `fondo` dell'atlante. */
function stendiFondo() {
  const fondi = S.mondo.voci.filter(v => v.famiglia === 'fondo')
  if (!fondi.length) return avviso('questo mondo non ha un fondo da stendere')
  for (let x = 0; x < CELLE_X; x++)
    for (let y = 0; y < CELLE_Y; y++)
      S.fondo.set(`${x},${y}`, fondi[(x * 5 + y * 3) % fondi.length])
  avviso(`prato steso con ${fondi.length} fondi: adesso i pezzi si guardano su qualcosa`)
}

/* ── il confronto ──
   Mette in fila quello che il filtro sta mostrando, **alla scala vera
   del gioco**, su una riga per provenienza. È il modo di rispondere a
   «questi vengono dallo stesso set?» senza uscire dal banco e senza
   scriversi uno script che poi si butta — che è esattamente quello che
   era successo la prima volta che è servito. */
function confronta() {
  const viste = vociDaMostrare()
  if (!viste.length) return avviso('il filtro non lascia passare niente')
  svuota()
  stendiFondo()
  const T = S.mondo.tessera
  const fogli = [...new Set(viste.map(v => v.da || 'senza foglio'))].sort()
  let messi = 0
  fogli.forEach((foglio, riga) => {
    let x = 1.2
    for (const v of viste.filter(q => (q.da || 'senza foglio') === foglio)) {
      const m = S.mondo.misura(v) || { w: T, h: T }
      x += m.w / T / 2
      if (x > CELLE_X - 1) break
      S.posate.push({ voce: v, posa: Object.keys(v.pose)[0], gira: 0, specchia: false,
                      x: x * T, y: (2.4 + riga * 3.4) * T })
      x += m.w / T / 2 + 0.4
      messi++
    }
  })
  avviso(`${messi} pezzi in fila, una riga per foglio (${fogli.join(' · ')}) — ` +
         'alla scala vera, sul prato: se due righe non sembrano lo stesso gioco, non lo sono')
}
function avviso(t) { $('#avviso').textContent = t }

/* ═══════════ l'avvio ═══════════ */
async function scegliMondo(id) {
  S.mondo = await apri(id)
  svuota()
  S.scelta = null
  S.cerca = ''; S.da = ''
  $('#cerca').value = ''
  const fogli = [...new Set(S.mondo.voci.map(v => v.da).filter(Boolean))].sort()
  $('#da').innerHTML = '<option value="">ogni foglio</option>' +
    fogli.map(f => `<option value="${f}">${f}</option>`).join('')
  $('#da').disabled = fogli.length < 2
  costruisciPannello()
  aggiornaScelta()
  $('#materia').innerHTML = (S.mondo.strade ? S.mondo.strade.materie : [])
    .map(m => `<option>${m}</option>`).join('')
  $('#materia').disabled = !S.mondo.strade
  $('#prova-strada').disabled = !S.mondo.strade
  /* Lo zoom di partenza lo detta il mondo, non un numero scelto una
     volta: una tessera da 16 px va guardata a 4×, una da 64 a 1×, e
     aprire il castello a 3× vuol dire vedere un angolo di campo e
     credere che il banco sia rotto. */
  const largo = ($('#campo-casa').clientWidth || 900) - 40
  S.zoom = Math.max(0.5, Math.min(6, Math.round(2 * largo / (CELLE_X * S.mondo.tessera)) / 2))
  $('#zoom').value = S.zoom
  $('#zoom-e').textContent = S.zoom + '×'
  avviso(`${S.mondo.voci.length} voci · tessera ${S.mondo.tessera} px`)
}

export async function avvia() {
  $('#mondo').innerHTML = MONDI.map(m => `<option value="${m.id}">${m.nome}</option>`).join('')
  $('#mondo').addEventListener('change', e => scegliMondo(e.target.value))
  $('#zoom').addEventListener('input', e => { S.zoom = +e.target.value; $('#zoom-e').textContent = S.zoom + '×' })
  $('#griglia').addEventListener('change', e => { S.griglia = e.target.checked })
  $('#gira').addEventListener('click', () => { S.gira = (S.gira + 1) % 4; aggiornaScelta() })
  $('#specchia').addEventListener('click', () => { S.specchia = !S.specchia; aggiornaScelta() })
  $('#svuota').addEventListener('click', () => { svuota(); avviso('campo vuoto') })
  $('#prato').addEventListener('click', stendiFondo)
  $('#confronta').addEventListener('click', confronta)
  $('#cerca').addEventListener('input', e => { S.cerca = e.target.value; costruisciPannello() })
  $('#da').addEventListener('change', e => { S.da = e.target.value; costruisciPannello() })
  $('#raggruppa').addEventListener('change', e => { S.raggruppa = e.target.value; costruisciPannello() })
  $('#prova-accostate').addEventListener('click', provaAccostate)
  $('#prova-camminata').addEventListener('click', provaCamminata)
  $('#prova-strada').addEventListener('click', provaStrada)
  addEventListener('keydown', e => {
    if (e.key === 'r' || e.key === 'R') { if (S.scelta && S.scelta.giri > 1) { S.gira = (S.gira + 1) % 4; aggiornaScelta() } }
    if (e.key === 'f' || e.key === 'F') { if (S.scelta && S.scelta.specchia) { S.specchia = !S.specchia; aggiornaScelta() } }
  })

  await scegliMondo(MONDI[0].id)
  const passo = t => { ridisegna(t / 1000); requestAnimationFrame(passo) }
  requestAnimationFrame(passo)
}
