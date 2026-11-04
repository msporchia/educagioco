/* I soldi disegnati: monete e banconote come le vede il bambino alla
   bancarella, un solo disegno per tutti. Niente canvas: sono pezzetti di
   HTML coi colori in CSS, e li usano la bancarella (`components/Soldo.vue`),
   le domande dei soldi (`components/MazzoSoldi.vue`, in scena da
   `quiz/Domanda.vue`) e il gemello imperativo `quiz/grafica/scheda.js`
   (`mazzoDom`). Qui stanno i fatti (che faccia ha un taglio, in che ordine
   si posano) e lo stile; chi li mostra non ne ha una copia.
   Vedi docs/core/grafica.md («I soldi disegnati»). */

// la faccia di un taglio, in centesimi: la classe di colore, il numero stampato, l'unità
export function soldoDi(cents) {
  const carta = cents >= 500
  return {
    cents,
    carta,
    classe: carta ? 'carta b' + cents / 100
      : cents === 200 ? 'due' : cents === 100 ? 'uno' : cents >= 10 ? 'oro' : 'rame',
    faccia: cents >= 100 ? cents / 100 : cents,
    unita: cents >= 100 ? '€' : 'c',
  }
}

/* Le tre file di un mazzo in mano: prima le banconote, poi le monete da
   euro, poi i centesimi; in ogni fila dal valore più alto, con i pezzi
   uguali attaccati (`nuovo` segna il primo di un valore nuovo, per staccarlo
   un poco dal precedente). Una fila vuota non c'è. `pezzi` sono
   `{ cents }` (quelli di `scena({ che: 'monete' })`), in qualunque ordine. */
export function fileDeiSoldi(pezzi) {
  const per = (da, a) => pezzi.map(p => p.cents).filter(c => c >= da && c < a).sort((x, y) => y - x)
  const fila = (nome, valori) => ({
    nome,
    soldi: valori.map((c, i) => ({ ...soldoDi(c), nuovo: i > 0 && valori[i - 1] !== c })),
  })
  return [fila('carte', per(500, Infinity)), fila('monete', per(100, 500)), fila('centesimi', per(0, 100))]
    .filter(f => f.soldi.length)
}

// i pezzi di una scena da mostrare come soldi, o `null` se la scena è un'altra
export const pezziDelMazzo = scena => (scena?.che === 'monete' ? scena.pezzi || [] : null)

// a voce, per chi non vede: lo stesso elenco della versione scritta
export const descrizioneDeiSoldi = pezzi =>
  fileDeiSoldi(pezzi).flatMap(f => f.soldi.map(s => (s.carta ? `banconota da ${s.faccia} €`
    : s.unita === '€' ? `moneta da ${s.faccia} €` : `moneta da ${s.faccia} centesimi`))).join(', ')

/* I disegni dentro i soldi, in SVG dentro lo stile: niente file esterni. La corona di
   stelle delle monete, e sulle banconote l'arco con le colonne. */
const inUrl = svg => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
const stella = (x, y, r) => {
  const p = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.42 : r
    return `${(x + q * Math.cos(a)).toFixed(1)},${(y + q * Math.sin(a)).toFixed(1)}`
  })
  return `<polygon points="${p.join(' ')}"/>`
}
const CORONA = inUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="#00000040">${
  Array.from({ length: 12 }, (_, i) => {
    const a = i * Math.PI / 6
    return stella(50 + 42 * Math.cos(a), 50 + 42 * Math.sin(a), 4.6)
  }).join('')}</svg>`)
const ARCO = inUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 60" fill="none" stroke="#ffffffd0" stroke-width="2.4">
  <path d="M4 58V24a16 16 0 0 1 32 0v34"/><path d="M12 58V26a8 8 0 0 1 16 0v32"/><path d="M1 58h38M3 16h34" stroke-width="3"/></svg>`)

/* Lo stile. `.soldo` da solo prende la misura dal contenitore (i
   comparti del cassetto); `.mini` è quello in mano al cliente, `.medio`
   quello della domanda, che si deve leggere a un braccio di distanza. */
export const STILE_SOLDI = `
.soldo { position:relative; width:100%; height:auto; max-width:78px; max-height:100%;
         aspect-ratio:1; border-radius:50%; display:flex; align-items:center;
         justify-content:center; font-size:clamp(15px,5.2vw,27px); font-weight:900;
         line-height:1; border:0; box-shadow:0 3px 0 #00000052, 0 6px 7px #00000033;
         text-shadow:0 1px 0 #ffffff8c, 0 -1px 0 #00000026 }
/* il bordo zigrinato: lo stesso per tutte le monete */
.soldo:not(.carta)::before { content:''; position:absolute; inset:0; border-radius:50%; pointer-events:none;
      background:repeating-conic-gradient(#ffffff66 0 3deg, #00000033 3deg 6deg);
      -webkit-mask:radial-gradient(closest-side, #0000 89%, #000 91%);
      mask:radial-gradient(closest-side, #0000 89%, #000 91%) }
/* il cerchio inciso, la corona di stelle e il riflesso */
.soldo:not(.carta)::after { content:''; position:absolute; inset:9%; border-radius:50%; pointer-events:none;
      box-shadow:inset 0 0 0 1px #ffffff5c, inset 0 2px 3px #00000026;
      background:radial-gradient(ellipse at 32% 20%, #ffffffa6, #fff0 48%), ${CORONA} center/100% no-repeat }
.soldo .u { font-style:normal; font-size:.5em; align-self:center; margin-top:.5em; margin-left:1px }
.soldo.mini { width:34px; height:34px; max-width:none; aspect-ratio:auto; font-size:13px;
              align-items:baseline; padding-top:11px; box-shadow:0 2px 0 #00000052 }
.soldo.mini::after { background:radial-gradient(ellipse at 32% 20%, #ffffffa6, #fff0 48%) }
.soldo.mini .u { font-size:8px; margin-top:0; align-self:auto }
.soldo.medio { width:48px; height:48px; max-width:none; aspect-ratio:auto; font-size:19px }

.soldo.rame { background:radial-gradient(circle at 36% 28%, #f7cfae, #d98a55 38%, #b5622e 72%, #8f4a22); color:#4a220c }
.soldo.oro  { background:radial-gradient(circle at 36% 28%, #fff4c4, #f3cc5c 38%, #d3a021 72%, #a97c12); color:#5a4008 }
/* le bimetalliche vanno disegnate come anelli concentrici: 1 € e 2 € si
   riconoscono proprio da lì */
.soldo.uno { background:radial-gradient(circle, #f9dc8a 0 40%, #e6b945 56%, #9a8a55 56.5% 58%, #f1f3f5 58.5%, #c4cad0 80%, #a4acb4); color:#5a4008 }
.soldo.due { background:radial-gradient(circle, #f4f6f8 0 40%, #c7cdd3 56%, #8f8a6a 56.5% 58%, #fbe39c 58.5%, #ecc04e 80%, #c2931f); color:#3d4448 }

.soldo.carta { width:100%; max-width:136px; aspect-ratio:1.7; height:auto; border-radius:6px;
               padding:0; overflow:hidden; align-items:center; text-shadow:0 1px 0 #ffffff66;
               box-shadow:0 3px 0 #00000052, 0 6px 7px #00000033, inset 0 0 0 2px #ffffff66, inset 0 0 0 3px #00000014 }
/* la trama della carta filigranata: due fasci di righe sottili */
.soldo.carta::before { content:''; position:absolute; inset:0; pointer-events:none;
      background:repeating-linear-gradient(112deg, #ffffff1f 0 1.5px, #fff0 1.5px 5px),
                 repeating-linear-gradient(68deg, #00000012 0 1.5px, #0000 1.5px 7px),
                 radial-gradient(ellipse at 72% 50%, #ffffff40, #fff0 62%) }
.soldo.carta .finestra { position:absolute; left:7%; top:11%; width:23%; height:78%; background:${ARCO} center/contain no-repeat }
/* la striscia che cambia colore */
.soldo.carta .banda { position:absolute; right:6%; top:0; bottom:0; width:11%;
      background:linear-gradient(170deg,#ffffffb0,#ffe9a8b0 30%,#a8e6ffb0 55%,#ffb8e0b0 78%,#ffffffb0);
      box-shadow:0 0 0 1px #ffffff66 }
.soldo.carta .cifra { position:relative; font-size:clamp(19px,5.4vw,30px); font-weight:900; line-height:1 }
.soldo.carta .cifra::after { content:'€'; font-size:.55em; margin-left:1px }
.soldo.b5  { background:linear-gradient(150deg,#ece7d8,#c4bda9 55%,#9b9483); color:#3f3a2b }
.soldo.b10 { background:linear-gradient(150deg,#f8c0b6,#e0776a 55%,#b84a3f); color:#4f150f }
.soldo.b20 { background:linear-gradient(150deg,#cbe0f5,#7fabdc 55%,#4a7cb8); color:#0f3154 }
.soldo.b50 { background:linear-gradient(150deg,#fbdcae,#eca94f 55%,#cf7f22); color:#512b05 }
.soldo.carta.mini { width:52px; height:31px; max-width:none; aspect-ratio:auto;
                    border-radius:3px; padding:0 }
.soldo.carta.mini .cifra { font-size:15px }
.soldo.carta.mini .cifra::after { font-size:8px }
.soldo.carta.mini .finestra { left:6%; top:12%; width:22%; height:76% }
.soldo.carta.mini .banda { right:5%; width:11% }
.soldo.carta.medio { width:80px; height:47px; max-width:none; aspect-ratio:auto; border-radius:5px }
.soldo.carta.medio .cifra { font-size:22px }

/* il mazzo di una domanda: file ben staccate, i pezzi mai uno sull'altro (l'ombra sotto è 4 px) */
.mazzo-soldi { display:flex; flex-direction:column; align-items:center; gap:14px; width:100%; padding:4px 0 6px }
.mazzo-soldi .fila { display:flex; flex-wrap:wrap; justify-content:center; gap:12px 10px }
.mazzo-soldi .fila .nuovo { margin-left:8px }
`

// una volta sola per pagina: chi non ha Vue (scheda.js) e i componenti la chiamano allo stesso modo
export function iniettaStileSoldi() {
  if (typeof document === 'undefined' || document.getElementById('soldi-stile')) return
  const s = document.createElement('style')
  s.id = 'soldi-stile'
  s.textContent = STILE_SOLDI
  document.head.appendChild(s)
}

// un soldo in DOM, per chi non ha Vue: lo stesso markup di `components/Soldo.vue`
export function soldoDom(cents, { medio = false, nuovo = false } = {}) {
  const s = soldoDi(cents)
  const el = document.createElement('span')
  el.className = ['soldo', s.classe, medio && 'medio', nuovo && 'nuovo'].filter(Boolean).join(' ')
  el.dataset.cents = String(cents)
  if (s.carta) {
    const f = document.createElement('i'); f.className = 'finestra'
    const c = document.createElement('span'); c.className = 'cifra'; c.textContent = String(s.faccia)
    const b = document.createElement('i'); b.className = 'banda'
    el.append(f, c, b)
  } else {
    const u = document.createElement('i'); u.className = 'u'; u.textContent = s.unita
    el.append(document.createTextNode(String(s.faccia)), u)
  }
  return el
}

// il mazzo di una domanda in DOM: lo stesso di `components/MazzoSoldi.vue`
export function mazzoDom(pezzi) {
  iniettaStileSoldi()
  const m = document.createElement('div')
  m.className = 'mazzo-soldi'
  m.dataset.soldi = ''
  m.setAttribute('role', 'img')
  m.setAttribute('aria-label', descrizioneDeiSoldi(pezzi))
  for (const f of fileDeiSoldi(pezzi)) {
    const fila = document.createElement('div')
    fila.className = 'fila'
    fila.dataset.fila = f.nome
    for (const s of f.soldi) fila.appendChild(soldoDom(s.cents, { medio: true, nuovo: s.nuovo }))
    m.appendChild(fila)
  }
  return m
}
