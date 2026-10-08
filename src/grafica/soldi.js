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

/* Lo stile. `.soldo` da solo prende la misura dal contenitore (i
   comparti del cassetto); `.mini` è quello in mano al cliente, `.medio`
   quello della domanda, che si deve leggere a un braccio di distanza. */
export const STILE_SOLDI = `
.soldo { position:relative; width:100%; height:auto; max-width:78px; max-height:100%;
         aspect-ratio:1; border-radius:50%; display:flex; align-items:center;
         justify-content:center; font-size:clamp(15px,5.2vw,27px); font-weight:900;
         line-height:1; border:0; box-shadow:0 4px 0 #00000038, inset 0 2px 5px #ffffff66 }
.soldo .u { font-style:normal; font-size:.5em; align-self:center; margin-top:.5em; margin-left:1px }
.soldo.mini { width:34px; height:34px; max-width:none; aspect-ratio:auto; font-size:13px;
              align-items:baseline; padding-top:11px; box-shadow:0 2px 0 #00000038 }
.soldo.mini .u { font-size:8px; margin-top:0; align-self:auto }
.soldo.medio { width:48px; height:48px; max-width:none; aspect-ratio:auto; font-size:19px }

.soldo.rame { background:radial-gradient(circle at 35% 30%, #e8a882, #b8642f 70%); color:#4a220c }
.soldo.oro  { background:radial-gradient(circle at 35% 30%, #ffe9a3, #d3a021 70%); color:#5a4008 }
/* le bimetalliche vanno disegnate come anelli concentrici: 1 € e 2 € si
   riconoscono proprio da lì */
.soldo.uno { background:radial-gradient(circle at 50% 50%, #f7d377 0 57%, #dde1e4 57%); color:#5a4008 }
.soldo.due { background:radial-gradient(circle at 50% 50%, #dde1e4 0 57%, #f7d377 57%); color:#3d4448 }
.soldo.uno::after, .soldo.due::after { content:''; position:absolute; inset:3px; border-radius:50%;
      background:radial-gradient(circle at 34% 26%, #ffffff55, #ffffff00 60%); pointer-events:none }

.soldo.carta { width:100%; max-width:136px; aspect-ratio:1.7; height:auto; border-radius:6px;
               padding:0; overflow:hidden; align-items:center;
               box-shadow:0 4px 0 #00000038, inset 0 0 0 2px #ffffff55 }
.soldo.carta .finestra { position:absolute; left:8%; top:14%; width:20%; height:62%;
      border-radius:22% 22% 6% 6%; background:#ffffff5e; box-shadow:inset 0 0 0 1.5px #ffffff8c }
.soldo.carta .banda { position:absolute; right:6%; top:9%; bottom:9%; width:14%; border-radius:3px;
      background:linear-gradient(160deg,#fff8,#fff2,#fff8) }
.soldo.carta .cifra { font-size:clamp(19px,5.4vw,30px); font-weight:900; line-height:1 }
.soldo.carta .cifra::after { content:'€'; font-size:.55em; margin-left:1px }
.soldo.b5  { background:linear-gradient(150deg,#e6e1d2,#b3ac99); color:#4a4433 }
.soldo.b10 { background:linear-gradient(150deg,#f3b3ab,#d0655a); color:#5c1d16 }
.soldo.b20 { background:linear-gradient(150deg,#b6d2ee,#5f92c8); color:#153a5e }
.soldo.b50 { background:linear-gradient(150deg,#f7cf9a,#e0953a); color:#5a3208 }
.soldo.carta.mini { width:52px; height:31px; max-width:none; aspect-ratio:auto;
                    border-radius:3px; padding:0 }
.soldo.carta.mini .cifra { font-size:15px }
.soldo.carta.mini .cifra::after { font-size:8px }
.soldo.carta.mini .finestra { left:7%; top:14%; width:20%; height:64% }
.soldo.carta.mini .banda { right:5%; top:9%; bottom:9%; width:14% }
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
