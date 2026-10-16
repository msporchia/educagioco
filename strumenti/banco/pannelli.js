/* ═══════════════════════════════════════════════════════════════════
   IL BANCO DEI PANNELLI — la griglia: una riga per pannello, una colonna
   per tema, e sopra la larghezza (telefono, tablet, scrivania), la scala
   e quali temi mostrare. Ogni riquadro è `pannello.html` in un iframe.
   Le scelte restano nell'indirizzo (`?larghezza=390&solo=zaino`), così
   una vista si rimanda a qualcuno o si fotografa con scatta-app.
   Docs: docs/sotterraneo/tema-pannelli.md
   ═══════════════════════════════════════════════════════════════════ */
const PANNELLI = [
  ['domanda', 'La domanda, da rispondere', 'quiz/Domanda.vue in un foglio (la porta chiusa)'],
  ['domanda-giusta', 'La domanda, risposta giusta', 'il segno, il bagliore'],
  ['domanda-sbagliata', 'La domanda, risposta sbagliata', 'il segno, il tremolio, il perché e come si fa'],
  ['scontro', 'Lo scontro: cosa fare, col pericolo', 'CaselleAbilita.vue nella cornice del duello, la fila dei turni sul palco'],
  ['scontro-domanda', 'Lo scontro: la domanda del colpo', 'la scelta fatta sopra, la domanda sotto'],
  ['scontro-3d', 'Lo scontro nel 3D: cosa fare', 'Pannello3d.vue in fondo, sopra la barra; la scena è un fondo finto (quella vera: scatta-app sotterraneo3d=1)'],
  ['scontro-3d-domanda', 'Lo scontro nel 3D: la domanda', 'la scelta fatta e la domanda nel pannello in fondo'],
  ['zaino', 'Lo zaino', 'Zaino.vue con le schede dell\'eroe'],
  ['bottega', 'La bottega', 'Bottega.vue, l\'armaiolo'],
  ['eroe', 'La pagina dell\'eroe', 'PaginaEroe.vue'],
  ['abilita', 'L\'albero delle abilità', 'PaginaAbilita.vue'],
  ['pozione', 'Quale pozione', 'ScegliPozione.vue'],
  ['dialogo', 'Il dialogo', 'Dialogo.vue, il minatore'],
  ['barra', 'La barra in basso', 'BarraDiSotto.vue'],
  ['fine', 'Il cartello di fine', 'Fine.vue'],
  ['pausa', 'La pausa', 'giochi/VeloPausa.vue col suo slot'],
]
const TEMI = [['attuale', 'attuale'], ['legno', 'A · legno'], ['rilievo', 'B · rilievo']]
const LARGHEZZE = [[390, 'telefono 390'], [320, 'stretto 320'], [768, 'tablet 768'], [1100, 'scrivania 1100']]
const SCALE = [[1, '100%'], [0.75, '75%'], [0.5, '50%']]

const q = new URLSearchParams(location.search)
const scelte = {
  larghezza: Number(q.get('larghezza')) || 390,
  alto: Number(q.get('alto')) || 760,
  scala: Number(q.get('scala')) || 1,
  temi: (q.get('temi') || 'attuale,legno,rilievo').split(','),
  solo: q.get('solo') ? q.get('solo').split(',') : null,
}
function scrivi() {
  const u = new URLSearchParams({ larghezza: scelte.larghezza, alto: scelte.alto, scala: scelte.scala, temi: scelte.temi.join(',') })
  if (scelte.solo) u.set('solo', scelte.solo.join(','))
  history.replaceState(null, '', '?' + u)
}

function gruppo(titolo, voci, attiva, scegli, multiplo = false) {
  const g = document.createElement('span')
  g.innerHTML = `<b>${titolo}</b>`
  for (const [v, nome] of voci) {
    const l = document.createElement('label')
    const i = document.createElement('input')
    i.type = multiplo ? 'checkbox' : 'radio'
    i.name = titolo
    i.checked = attiva(v)
    i.addEventListener('change', () => { scegli(v, i.checked); scrivi(); disegna() })
    l.append(i, ' ' + nome + ' ')
    g.append(l)
  }
  return g
}

const comandi = document.getElementById('comandi')
comandi.append(
  gruppo('larghezza', LARGHEZZE, v => v === scelte.larghezza, v => { scelte.larghezza = v }),
  gruppo('scala', SCALE, v => v === scelte.scala, v => { scelte.scala = v }),
  gruppo('temi', TEMI, v => scelte.temi.includes(v), (v, si) => {
    scelte.temi = TEMI.map(t => t[0]).filter(t => (t === v ? si : scelte.temi.includes(t)))
  }, true),
)

function disegna() {
  const righe = document.getElementById('righe')
  righe.textContent = ''
  for (const [p, nome, dice] of PANNELLI) {
    if (scelte.solo && !scelte.solo.includes(p)) continue
    const riga = document.createElement('section')
    riga.className = 'riga'
    riga.innerHTML = `<h2>${nome}<small>${dice}</small></h2>`
    const colonne = document.createElement('div')
    colonne.className = 'colonne'
    for (const [t, etichetta] of TEMI) {
      if (!scelte.temi.includes(t)) continue
      const [pannello, stato] = p.startsWith('domanda-') ? ['domanda', p.slice(8)] : [p, '']
      const fig = document.createElement('figure')
      const L = scelte.larghezza, A = scelte.alto, S = scelte.scala
      fig.innerHTML = `<figcaption>${etichetta}</figcaption>`
      const box = document.createElement('div')
      box.className = 'cornice'
      box.style.width = L * S + 'px'
      box.style.height = A * S + 'px'
      const f = document.createElement('iframe')
      f.loading = 'lazy'
      f.width = L
      f.height = A
      f.style.transform = `scale(${S})`
      f.src = `./pannello.html?p=${pannello}&tema=${t}${stato ? '&stato=' + stato : ''}`
      box.append(f)
      fig.append(box)
      colonne.append(fig)
    }
    riga.append(colonne)
    righe.append(riga)
  }
}
disegna()
