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

   ── i quattro attrezzi ──
   Sono quattro perché sono quattro le domande diverse che si fanno a un
   foglio di sprite, e ognuna vuole un gesto diverso:

     posa       si tocca una voce e si tocca il campo. Quello che si può
                girare si gira (`R`), quello che si può specchiare si
                specchia (`F`) — e la manopola compare **solo** dove ha
                senso, perché è la voce a dire quanto regge.
     pennello   si trascina, e l'erba si stende. Un fondo non si posa un
                pezzo per volta: si dipinge una zona, e le varianti le
                sceglie il posto (`fotogrammaDi`) invece del dito.
     strada     si traccia il cammino col dito e il **risolutore vero**
                sceglie le tessere. È il verso giusto: una strada non è
                una sequenza di pezzi da scegliere a mano, è un percorso
                — i gomiti, gli innesti e i doppioni li deve trovare chi
                sa leggere gli attacchi, che è `componiPercorso`.
     guida      si sceglie qualcuno già posato e gli si dice dove
                andare. Serve perché **le pose stanno insieme solo in
                movimento**: un attore fermo mostra tre fotogrammi in
                fila, e da lì non si vede se il piede tocca terra nello
                stesso punto girandosi.

   ── le prove automatiche ──
   Tre scene che si costruiscono da sole, perché sono quelle in cui i
   difetti si vedono e che nessuno ha voglia di rifare a mano ogni
   volta: **tutto accostato** (i bordi litigano solo se si toccano),
   **una serpentina** (i giunti, tutti e quattro i gomiti), **tutti
   quelli che camminano** in fila (i tempi e il piede).

   ── e l'altra metà ──
   `ritagli.js` è la stessa pagina dall'altra parte del tubo: il foglio
   sorgente prima che diventi atlante. Si carica solo quando la si
   chiede, perché tira dentro tutti i PNG delle sorgenti e chi vuole
   solo guardare la fattoria non ha motivo di aspettarli.
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
  attrezzo: 'posa',     // posa | pennello | tracciato | guida
  raggio: 0,            // quanto è largo il pennello, in caselle attorno
  posate: [],           // { voce, posa, x, y, gira, specchia, meta? }
  fondo: new Map(),     // "cx,cy" → { voce, gira, specchia }
  tracciato: [],        // le celle toccate col dito, in ordine
  guidato: null,        // chi sta aspettando che gli si dica dove andare
  trascina: false,
  ultimo: null,         // dov'era il dito al movimento prima
  cerca: '',            // filtro sul nome
  da: '',               // filtro sulla provenienza
  raggruppa: 'famiglia',// famiglia | da
}

const CELLE_X = 16, CELLE_Y = 12
const $ = s => document.querySelector(s)

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
  /* chi ha finito di camminare si ferma sul primo piede: un attore che
     continua a muovere le gambe da fermo è la cosa che fa sembrare
     sbagliati dei fotogrammi giusti */
  if (p.fermo) return 0
  if (p.voce.anima) return Math.floor(t * 6) % quanti
  return Math.abs(Math.round(p.x * 7 + p.y * 13)) % quanti
}

/* ═══════════ il campo ═══════════ */
const tela = $('#campo')
const ctx = tela.getContext('2d')

function misureCampo() {
  const T = S.mondo.tessera
  return { T, L: CELLE_X * T, A: CELLE_Y * T }
}

function ridisegna(t, dt) {
  if (!S.mondo) return
  cammina(dt)
  const { T, L, A } = misureCampo()
  const z = S.zoom
  tela.width = Math.round(L * z)
  tela.height = Math.round(A * z)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = '#0e1014'
  ctx.fillRect(0, 0, tela.width, tela.height)
  ctx.setTransform(z, 0, 0, z, 0, 0)
  netto(ctx)

  for (const [k, f] of S.fondo) {
    const [cx, cy] = k.split(',').map(Number)
    const q = { voce: f.voce, gira: f.gira, specchia: f.specchia,
                x: (cx + 0.5) * T, y: (cy + 0.5) * T }
    S.mondo.disegna(ctx, { ...q, posa: 'fermo', fotogramma: fotogrammaDi({ ...q, posa: 'fermo' }, t) })
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

  /* il cammino che si sta tracciando: si vede mentre lo si disegna, se
     no si sta scrivendo a occhi chiusi e il risultato arriva alla fine */
  if (S.tracciato.length) {
    ctx.fillStyle = 'rgba(127,224,192,.28)'
    for (const [cx, cy] of S.tracciato) ctx.fillRect(cx * T, cy * T, T, T)
  }

  /* chi sta più in basso si disegna dopo: è l'unica regola che fa
     sembrare un mondo dall'alto un posto invece che un collage */
  for (const p of [...S.posate].sort((a, b) => a.y - b.y))
    S.mondo.disegna(ctx, { ...p, fotogramma: fotogrammaDi(p, t) })

  if (S.guidato) {
    ctx.strokeStyle = '#7fe0c0'
    ctx.lineWidth = 2 / z
    ctx.beginPath()
    ctx.arc(S.guidato.x, S.guidato.y, T * 0.45, 0, Math.PI * 2)
    ctx.stroke()
  }
}

/* ═══════════ chi cammina ═══════════
   Muove chi ha una meta, e mentre lo muove **sceglie la posa dal
   verso**. È la parte che un elenco di fotogrammi in fila non sa
   mostrare: se `lato` guarda dalla parte sbagliata, o se il piede di
   `su` cade due pixel più in basso di quello di `giu`, si vede solo
   qui, quando la figura si gira mentre cammina. */
function cammina(dt) {
  if (!dt) return
  const T = S.mondo.tessera
  for (const p of S.posate) {
    if (!p.meta) continue
    const dx = p.meta[0] - p.x, dy = p.meta[1] - p.y
    const d = Math.hypot(dx, dy)
    const v = T * 2.4                       // due caselle e mezzo al secondo
    if (d <= v * dt) {
      p.x = p.meta[0]; p.y = p.meta[1]; p.meta = null; p.fermo = true
      const ferma = Object.keys(p.voce.pose).find(n => n === 'fermo' || n === 'giu')
      if (ferma) p.posa = ferma
      continue
    }
    p.x += dx / d * v * dt
    p.y += dy / d * v * dt
    const scelta = posaVerso(p.voce, dx, dy)
    p.posa = scelta.posa
    p.specchia = scelta.specchia
    p.fermo = false
  }
}

/* La convenzione dei versi è quella di `FORMATO.md`: `giu`, `lato`,
   `su`, e `lato` guarda **sempre** a destra — la sinistra la fa lo
   specchio a schermo, non un secondo disegno nel foglio. Chi non ha i
   tre versi (il sotterraneo dichiara `fermo` e `corsa`) si arrangia con
   quello che ha: qui non c'è un elenco di pose scritto a mano, si
   guarda cosa la voce dichiara. */
function posaVerso(voce, dx, dy) {
  const pose = Object.keys(voce.pose)
  const ha = n => pose.includes(n)
  const dilato = { posa: 'lato', specchia: dx < 0 }
  if (Math.abs(dx) > Math.abs(dy) && ha('lato')) return dilato
  if (dy < 0 && ha('su')) return { posa: 'su', specchia: false }
  if (dy > 0 && ha('giu')) return { posa: 'giu', specchia: false }
  if (ha('lato')) return dilato
  const corre = pose.find(n => n === 'corsa' || n === 'cammina') || pose[0]
  return { posa: corre, specchia: voce.specchia && dx < 0 }
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
  for (const el of document.querySelectorAll('#voci .voce'))
    el.classList.toggle('scelta', el.dataset.voce === (S.scelta && S.scelta.id))
  const v = S.scelta
  $('#scelta').textContent = v
    ? `${v.id} · ${S.posa}${v.giri > 1 ? ` · giro ${S.gira}` : ''}${S.specchia ? ' · specchiata' : ''}`
    : 'niente'
  $('#gira').disabled = !v || v.giri <= 1
  $('#specchia').disabled = !v || !v.specchia
}

/* ═══════════ il dito sul campo ═══════════ */
function dovePunta(e) {
  const r = tela.getBoundingClientRect()
  return [(e.clientX - r.left) / S.zoom, (e.clientY - r.top) / S.zoom]
}
const inCella = (x, y) => [Math.floor(x / S.mondo.tessera), Math.floor(y / S.mondo.tessera)]
const dentroIlCampo = (cx, cy) => cx >= 0 && cx < CELLE_X && cy >= 0 && cy < CELLE_Y

/* i punti da a a b, uno ogni `passo`: b compreso */
function tratto([ax, ay], [bx, by], passo) {
  const d = Math.hypot(bx - ax, by - ay)
  const quanti = Math.max(1, Math.ceil(d / passo))
  return Array.from({ length: quanti }, (_, i) =>
    [ax + (bx - ax) * (i + 1) / quanti, ay + (by - ay) * (i + 1) / quanti])
}

tela.addEventListener('pointerdown', e => {
  if (!S.mondo || e.button === 2) return
  S.trascina = true
  S.ultimo = null
  tela.setPointerCapture(e.pointerId)
  usaAttrezzo(...dovePunta(e), true)
})
tela.addEventListener('pointermove', e => { if (S.trascina) usaAttrezzo(...dovePunta(e), false) })
const molla = () => {
  if (!S.trascina) return
  S.trascina = false
  if (S.attrezzo === 'tracciato') componiTracciato()
}
tela.addEventListener('pointerup', molla)
tela.addEventListener('pointercancel', molla)

/* ── il dito va più veloce degli eventi ──
   Un `pointermove` arriva ogni tanti pixel, non ogni pixel: un tratto
   svelto salta caselle, e il pennello lascia un prato coi buchi mentre
   il tracciato si spezza. Quindi non si guarda **dove è arrivato** il
   dito, si guarda **da dove a dove è passato** e si riempie in mezzo.
   È un difetto che col mouse lento non si vede mai e col dito si vede
   sempre. */
function usaAttrezzo(x, y, primo) {
  const T = S.mondo.tessera
  const [cx, cy] = inCella(x, y)

  if (S.attrezzo === 'pennello') {
    const passi = tratto(S.ultimo || [x, y], [x, y], T / 2)
    S.ultimo = [x, y]
    for (const [a, b] of passi) if (dentroIlCampo(...inCella(a, b))) dipingi(...inCella(a, b))
    return
  }

  if (S.attrezzo === 'tracciato') {
    if (!dentroIlCampo(cx, cy)) return
    /* a passi ortogonali, uno per volta: una diagonale non è un pezzo di
       strada, e un salto in mezzo lo si chiude a squadra invece di
       buttarlo via — chi traccia sta indicando un cammino, non
       digitando delle coordinate */
    let ultimo = S.tracciato[S.tracciato.length - 1]
    while (!ultimo || ultimo[0] !== cx || ultimo[1] !== cy) {
      if (!ultimo) { S.tracciato.push([cx, cy]); break }
      const [ax, ay] = ultimo
      const p = ax !== cx ? [ax + Math.sign(cx - ax), ay] : [ax, ay + Math.sign(cy - ay)]
      if (S.tracciato.some(([q, w]) => q === p[0] && w === p[1])) return
      S.tracciato.push(p)
      ultimo = p
    }
    return
  }

  if (!dentroIlCampo(cx, cy)) return

  if (S.attrezzo === 'guida') {
    if (!primo) return
    if (S.guidato) { S.guidato.meta = [x, y]; S.guidato = null; return avviso('in cammino') }
    const chi = [...S.posate].reverse().find(p =>
      p.voce.famiglia === 'attore' && Math.abs(p.x - x) < T && Math.abs(p.y - y) < T)
    if (!chi) return avviso('tocca prima qualcuno che cammina, poi dove deve andare')
    S.guidato = chi
    return avviso(`${chi.voce.id}: adesso tocca dove deve andare`)
  }

  if (!primo || !S.scelta) return
  if (S.scelta.famiglia === 'fondo') return dipingi(cx, cy)
  if (S.scelta.famiglia === 'tessera')
    /* una tessera cade nella sua casella: posarla a mezzo pixel è il
       modo più veloce di credere che il foglio abbia un difetto */
    S.posate.push({ voce: S.scelta, posa: S.posa, gira: S.gira, specchia: S.specchia,
                    x: (cx + 0.5) * T, y: (cy + 0.5) * T })
  else
    S.posate.push({ voce: S.scelta, posa: S.posa, gira: S.gira, specchia: S.specchia, x, y })
}

tela.addEventListener('contextmenu', e => {
  e.preventDefault()
  const [x, y] = dovePunta(e)
  const T = S.mondo.tessera
  const i = S.posate.findLastIndex(p => Math.abs(p.x - x) < T && Math.abs(p.y - y) < T)
  if (i >= 0) S.posate.splice(i, 1)
  else S.fondo.delete(inCella(x, y).join(','))
})

/* ── il pennello ──
   Un fondo non si posa un pezzo per volta. La domanda che si fa a
   ventisei erbe diverse è «come sta questa zona», non «quale metto in
   questa casella»: quindi si trascina, e **la variante la sceglie il
   posto** — la stessa regola che vale in partita (`fotogrammaDi`), così
   quello che si vede qui è quello che si vedrà lì. */
function dipingi(cx, cy) {
  const v = S.scelta && (S.scelta.famiglia === 'fondo' || S.scelta.famiglia === 'tessera')
    ? S.scelta
    : S.mondo.voci.find(q => q.famiglia === 'fondo')
  if (!v) return avviso('questo mondo non ha un fondo da stendere')
  const r = Math.floor(S.raggio || 0)
  for (let a = cx - r; a <= cx + r; a++)
    for (let b = cy - r; b <= cy + r; b++)
      if (dentroIlCampo(a, b)) S.fondo.set(`${a},${b}`, { voce: v, gira: S.gira, specchia: S.specchia })
}

/* ── il tracciato ──
   Il gesto è «dove passa la strada», non «quale tessera qui»: le
   tessere le sceglie `componiPercorso`, che legge gli attacchi e sa che
   una curva girata di novanta gradi è un altro gomito. È lo stesso
   risolutore che compone il campo del castello, quindi se una strada
   qui non chiude non chiude nemmeno lì — ed è il modo di scoprire che
   manca un pezzo al catalogo **prima** di trovarci un buco in partita. */
function componiTracciato() {
  const celle = S.tracciato
  S.tracciato = []
  if (celle.length < 2) return
  if (!S.mondo.strade) return avviso('questo mondo non ha tessere con gli attacchi misurati')
  const T = S.mondo.tessera
  const materia = $('#materia').value || S.mondo.strade.materie[0]
  const catalogo = S.mondo.strade.catalogoDi(materia)

  /* i capi si aprono verso il bordo solo se il tracciato ci arriva
     davvero: una strada che finisce in mezzo al campo è un vicolo
     cieco, e dichiararle un'uscita che non ha vuol dire chiedere al
     risolutore un pezzo che non esiste */
  const verso = ([ax, ay], [bx, by]) => bx > ax ? 'E' : bx < ax ? 'O' : by > ay ? 'S' : 'N'
  const opposto = { N: 'S', S: 'N', E: 'O', O: 'E' }
  const capi = {}
  const [px, py] = celle[0], [ux, uy] = celle[celle.length - 1]
  const alBordo = (cx, cy) => cx === 0 || cy === 0 || cx === CELLE_X - 1 || cy === CELLE_Y - 1
  if (alBordo(px, py)) capi.parte = opposto[verso(celle[0], celle[1])]
  if (alBordo(ux, uy)) capi.arriva = verso(celle[celle.length - 2], celle[celle.length - 1])

  /* `dentro` è il **campo**, non la strada: una casella dentro il campo
     e fuori dalla strada è prato, e quel lato va chiuso. Passargli la
     strada vorrebbe dire togliere ogni vincolo al bordo, e la strada
     sborderebbe nell'erba senza che niente risulti sbagliato. */
  const scelte = S.mondo.strade.componi(celle, catalogo, { dentro: dentroIlCampo, capi })
  if (!scelte)
    return avviso(`«${materia}»: il catalogo non chiude questa strada — ` +
      (capi.parte && capi.arriva ? 'manca un pezzo'
        : 'un capo non arriva al bordo, e un vicolo cieco vuole una tessera che di solito non c\'è'))

  celle.forEach(([cx, cy], i) => {
    const p = scelte[i]
    if (!p) return
    const voce = S.mondo.voci.find(v => v.pose.fermo && v.pose.fermo[0] === p.nome)
    if (!voce) return
    /* la strada sostituisce quello che c'era in quella casella: due
       tessere sovrapposte si vedono come una sola sbagliata */
    S.posate = S.posate.filter(q =>
      q.voce.famiglia !== 'tessera' || inCella(q.x, q.y).join(',') !== `${cx},${cy}`)
    S.posate.push({ voce, posa: 'fermo', gira: p.gira, specchia: p.specchia,
                    x: (cx + 0.5) * T, y: (cy + 0.5) * T })
  })
  avviso(`«${materia}»: ${celle.length} celle composte — girare permuta gli attacchi, non solo i pixel`)
}

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
  avviso(`${attori.length} che camminano, tutte le pose — con l'attrezzo «guida» si mandano in giro`)
}

function provaStrada() {
  svuota()
  if (!S.mondo.strade) return avviso('questo mondo non ha tessere con gli attacchi misurati')
  const materia = $('#materia').value || S.mondo.strade.materie[0]
  const fondi = S.mondo.strade.fondiDi(materia)
  for (let x = 0; x < CELLE_X; x++)
    for (let y = 0; y < CELLE_Y; y++)
      if (fondi.length)
        S.fondo.set(`${x},${y}`, { voce: fondi[(x * 7 + y * 3) % fondi.length], gira: 0, specchia: false })

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
  S.tracciato = celle
  componiTracciato()
}

function svuota() { S.posate = []; S.fondo.clear(); S.tracciato = []; S.guidato = null }

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
      S.fondo.set(`${x},${y}`, { voce: fondi[(x * 5 + y * 3) % fondi.length], gira: 0, specchia: false })
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

/* ═══════════ le due metà della pagina ═══════════ */
let ritagliAvviati = null
async function vaiA(parte) {
  for (const b of document.querySelectorAll('#modi button'))
    b.classList.toggle('acceso', b.dataset.parte === parte)
  const mondo = parte === 'mondo'
  $('#barra-mondo').style.display = mondo ? '' : 'none'
  $('#avviso').style.display = mondo ? '' : 'none'
  $('#scena-mondo').style.display = mondo ? '' : 'none'
  $('#barra-ritagli').style.display = mondo ? 'none' : ''
  $('#ritagli-avviso').style.display = mondo ? 'none' : ''
  $('#scena-ritagli').style.display = mondo ? 'none' : ''
  if (mondo) return
  /* si carica alla prima richiesta: `ritagli.js` tira dentro tutti i PNG
     delle sorgenti, e chi voleva solo guardare la fattoria non ha
     motivo di aspettarli */
  if (!ritagliAvviati) {
    const m = await import('./ritagli.js')
    ritagliAvviati = m
    await m.avviaRitagli()
  } else ritagliAvviati.rinfrescaRitagli()
}

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

function scegliAttrezzo(quale) {
  S.attrezzo = quale
  S.tracciato = []
  S.guidato = null
  for (const b of document.querySelectorAll('#attrezzi button'))
    b.classList.toggle('acceso', b.dataset.attrezzo === quale)
  avviso({
    posa: 'tocca una voce a sinistra, poi il campo. Tasto destro toglie.',
    pennello: 'trascina per stendere il fondo scelto — la variante la sceglie il posto, non il dito',
    tracciato: 'traccia col dito dove passa la strada: le tessere le sceglie il risolutore vero',
    guida: 'tocca qualcuno che cammina, poi dove deve andare — le pose si giudicano in movimento',
  }[quale])
}

export async function avvia() {
  $('#mondo').innerHTML = MONDI.map(m => `<option value="${m.id}">${m.nome}</option>`).join('')
  $('#mondo').addEventListener('change', e => scegliMondo(e.target.value))
  $('#zoom').addEventListener('input', e => { S.zoom = +e.target.value; $('#zoom-e').textContent = S.zoom + '×' })
  $('#griglia').addEventListener('change', e => { S.griglia = e.target.checked })
  $('#raggio').addEventListener('change', e => { S.raggio = +e.target.value })
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
  for (const b of document.querySelectorAll('#attrezzi button'))
    b.addEventListener('click', () => scegliAttrezzo(b.dataset.attrezzo))
  for (const b of document.querySelectorAll('#modi button'))
    b.addEventListener('click', () => vaiA(b.dataset.parte))
  addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return
    if (e.key === 'r' || e.key === 'R') { if (S.scelta && S.scelta.giri > 1) { S.gira = (S.gira + 1) % 4; aggiornaScelta() } }
    if (e.key === 'f' || e.key === 'F') { if (S.scelta && S.scelta.specchia) { S.specchia = !S.specchia; aggiornaScelta() } }
    const attrezzi = { 1: 'posa', 2: 'pennello', 3: 'tracciato', 4: 'guida' }
    if (attrezzi[e.key]) scegliAttrezzo(attrezzi[e.key])
  })

  await scegliMondo(MONDI[0].id)
  let prima = 0
  const passo = ms => {
    const t = ms / 1000
    const dt = prima ? Math.min(0.05, t - prima) : 0
    prima = t
    if ($('#scena-mondo').style.display !== 'none') ridisegna(t, dt)
    requestAnimationFrame(passo)
  }
  requestAnimationFrame(passo)
}
