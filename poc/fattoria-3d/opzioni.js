// Il pannello ⚙: i preset di qualità, gli interruttori che pesano, le prove di stress (tanti campi e pecore) e le
// statistiche vive, per capire se la fattoria gira bene su questo telefono. Non sa nulla del gioco: riceve da
// main.js le cose da accendere e spegnere (`ctx`). Vedi poc/fattoria-3d.md.
const CHIAVE = 'poc-fattoria-3d-opz'

export const PRESET = {
  basso: { scala: 1, ombre: false, ombraRes: 512, vento: false, erba: false, nuvole: false, particelle: false, alberi: true, nebbia: true },
  medio: { scala: 1.5, ombre: true, ombraRes: 1024, vento: true, erba: true, nuvole: true, particelle: true, alberi: true, nebbia: true },
  alto: { scala: 3, ombre: true, ombraRes: 2048, vento: true, erba: true, nuvole: true, particelle: true, alberi: true, nebbia: true },
}
const SCALE = [[0.75, '0,75×'], [1, '1×'], [1.5, '1,5×'], [2, '2×'], [3, 'nativa']]
const OMBRE = [[512, 'bassa'], [1024, 'media'], [2048, 'alta']]

export function creaOpzioni (ctx) {
  const Q = { preset: 'medio', ...PRESET.medio, camera: 22 }
  try { Object.assign(Q, JSON.parse(localStorage.getItem(CHIAVE) || '{}')) } catch (e) { /* senza archivio, i valori di serie */ }
  const salva = () => { try { localStorage.setItem(CHIAVE, JSON.stringify(Q)) } catch (e) { /* */ } }

  // ── la pagina ──
  const pannello = document.getElementById('opzioni')
  pannello.innerHTML = `
    <button class="chiudi" aria-label="Chiudi">✕</button>
    <button class="riduci" aria-label="Riduci">▾</button>
    <h2>Opzioni e prove</h2>
    <div class="stat" id="o-stat"></div>
    <canvas id="o-grafico" width="320" height="56"></canvas>
    <h3>Qualità</h3><div class="preset" id="o-preset"></div>
    <div id="o-righe"></div>
    <h3>Prova di stress</h3>
    <div class="preset" id="o-stress"></div>
    <p class="nota" id="o-conta"></p>
    <h3>Rapporto</h3>
    <button class="largo" id="o-rapporto">Mostra il rapporto da incollare</button>
    <textarea id="o-testo" readonly hidden rows="9"></textarea>`
  const $ = id => pannello.querySelector('#' + id)
  pannello.querySelector('.chiudi').onclick = () => { pannello.hidden = true }
  const riduci = pannello.querySelector('.riduci')
  riduci.onclick = () => { pannello.classList.toggle('piccolo'); riduci.textContent = pannello.classList.contains('piccolo') ? '▴' : '▾' }

  const righe = $('o-righe')
  const comandi = []
  function toggle (chiave, nome) {
    const r = document.createElement('label'); r.className = 'riga'
    r.innerHTML = `<span>${nome}</span><input type="checkbox">`
    const i = r.querySelector('input'); i.onchange = () => { Q[chiave] = i.checked; cambiato() }
    righe.appendChild(r); comandi.push(() => { i.checked = !!Q[chiave] })
  }
  function scelta (chiave, nome, opzioni) {
    const r = document.createElement('label'); r.className = 'riga'
    r.innerHTML = `<span>${nome}</span><select></select>`
    const s = r.querySelector('select')
    for (const [v, t] of opzioni) { const o = document.createElement('option'); o.value = v; o.textContent = t; s.appendChild(o) }
    s.onchange = () => { Q[chiave] = Number(s.value); cambiato() }
    righe.appendChild(r); comandi.push(() => { s.value = String(Q[chiave]) })
  }
  function cursore (chiave, nome, min, max, passo) {
    const r = document.createElement('label'); r.className = 'riga'
    r.innerHTML = `<span>${nome} <b></b></span><input type="range" min="${min}" max="${max}" step="${passo}">`
    const i = r.querySelector('input'), b = r.querySelector('b')
    i.oninput = () => { Q[chiave] = Number(i.value); b.textContent = i.value; cambiato(true) }
    righe.appendChild(r); comandi.push(() => { i.value = Q[chiave]; b.textContent = Q[chiave] })
  }
  scelta('scala', 'Risoluzione', SCALE)
  toggle('ombre', 'Ombre'); scelta('ombraRes', 'Qualità delle ombre', OMBRE)
  toggle('vento', 'Il grano ondeggia'); toggle('particelle', 'Particelle e fumo')
  toggle('alberi', 'Alberi'); toggle('erba', 'Ciuffi d\'erba'); toggle('nuvole', 'Nuvole'); toggle('nebbia', 'Nebbia in lontananza')
  cursore('camera', 'Distanza della telecamera', 12, 40, 1)

  const bp = $('o-preset')
  for (const nome of ['basso', 'medio', 'alto']) {
    const b = document.createElement('button'); b.textContent = nome[0].toUpperCase() + nome.slice(1); b.dataset.p = nome
    b.onclick = () => { Object.assign(Q, PRESET[nome], { preset: nome }); cambiato() }
    bp.appendChild(b)
  }
  const bs = $('o-stress')
  for (const [t, fn] of [['+10 campi', () => ctx.stress('campo', 10)], ['+3 recinti', () => ctx.stress('recinto', 3)], ['Tutto via', () => ctx.stress(null, 0)]]) {
    const b = document.createElement('button'); b.textContent = t; b.onclick = () => { fn(); aggiorna() }; bs.appendChild(b)
  }

  function aggiorna () {
    for (const c of comandi) c()
    for (const b of bp.children) b.classList.toggle('acceso', b.dataset.p === Q.preset)
    $('o-conta').textContent = `In scena: ${ctx.conta().cose} cose di cui ${ctx.conta().stress} di prova (non si salvano).`
  }
  function cambiato (senzaPreset) {
    if (!senzaPreset) { const uguale = Object.keys(PRESET.medio).every(k => Q[k] === PRESET[Q.preset]?.[k]); if (!uguale) Q.preset = 'personale' }
    salva(); ctx.applica(Q); aggiorna()
  }

  // ── le statistiche: l'ultimo secondo e il peggior fotogramma degli ultimi due ──
  const dts = new Float32Array(120), cpus = new Float32Array(120); let n = 0, ultimo = 0, nF = 0, tFps = 0, fps = 0
  const gr = $('o-grafico'), x = gr.getContext('2d')
  function disegna () {
    x.clearRect(0, 0, gr.width, gr.height)
    const alto = gr.height, scala = alto / 50                       // 50 ms in cima
    for (const [ms, col] of [[16.7, '#5fae3a'], [33.3, '#e6a030']]) { x.strokeStyle = col; x.globalAlpha = 0.6; x.beginPath(); x.moveTo(0, alto - ms * scala); x.lineTo(gr.width, alto - ms * scala); x.stroke() }
    x.globalAlpha = 1
    for (let k = 0; k < 120; k++) {
      const i = (n + k) % 120, h = Math.min(alto, dts[i] * scala), hc = Math.min(alto, cpus[i] * scala)
      x.fillStyle = dts[i] > 33 ? '#d8452a' : dts[i] > 18 ? '#e6a030' : '#5fae3a'
      x.fillRect(k * (gr.width / 120), alto - h, gr.width / 120 - 0.5, h)
      x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(k * (gr.width / 120), alto - hc, gr.width / 120 - 0.5, hc)
    }
  }
  let ultimaAperta = 0
  function frame (dtMs, cpuMs, info) {
    dts[n % 120] = dtMs; cpus[n % 120] = cpuMs; n++; nF++
    const t = performance.now()
    if (t - tFps > 500) { fps = nF * 1000 / (t - tFps); nF = 0; tFps = t; ultimo = info }
    if (pannello.hidden || t - ultimaAperta < 250) return fps
    ultimaAperta = t
    let peggio = 0, somma = 0, c = 0; for (let k = 0; k < Math.min(n, 120); k++) { peggio = Math.max(peggio, dts[k]); somma += cpus[k]; c++ }
    const ord = [...dts.slice(0, Math.min(n, 120))].sort((a, b) => b - a), p1 = ord[Math.floor(ord.length * 0.01)] || 0
    $('o-stat').innerHTML = `<b>${fps.toFixed(0)}</b> fps · fotogramma peggiore <b>${peggio.toFixed(0)}</b> ms (1%: ${p1.toFixed(0)}) · lavoro JS <b>${(somma / Math.max(1, c)).toFixed(1)}</b> ms<br>`
      + `${info.calls} draw call · ${(info.triangoli / 1000).toFixed(0)}k triangoli · ${info.geometrie} geometrie · ${info.texture} texture · ${info.dpr.toFixed(2)} px/px`
    disegna(); return fps
  }

  function rapporto () {
    const ord = [...dts.slice(0, Math.min(n, 120))].sort((a, b) => b - a)
    return [
      `Fattoria 3D — ${new Date().toISOString().slice(0, 16)}`,
      `Dispositivo: ${navigator.userAgent}`,
      `Schermo: ${innerWidth}×${innerHeight} @${devicePixelRatio} · pixel ratio usato ${ultimo?.dpr?.toFixed(2)}`,
      `GPU: ${ctx.gpu()}`,
      `fps ${fps.toFixed(0)} · peggiore ${(ord[0] || 0).toFixed(0)} ms · 1% ${(ord[Math.floor(ord.length * 0.01)] || 0).toFixed(0)} ms`,
      `draw call ${ultimo?.calls} · triangoli ${ultimo?.triangoli} · cose in scena ${ctx.conta().cose} (di prova ${ctx.conta().stress})`,
      `Impostazioni: ${JSON.stringify(Q)}`,
    ].join('\n')
  }
  $('o-rapporto').onclick = () => { const t = $('o-testo'); t.hidden = false; t.value = rapporto(); t.focus(); t.select(); try { navigator.clipboard.writeText(t.value) } catch (e) { /* si seleziona e basta */ } }

  aggiorna()
  return { Q, frame, apri: () => { pannello.hidden = !pannello.hidden; aggiorna(); ultimaAperta = 0 }, applica: () => ctx.applica(Q) }
}
