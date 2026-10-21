// Il pannello comandi: HTML semplice, si chiude. Legge e scrive lo stato `S` tramite `az` (le azioni di principale.js).
import { CATALOGO } from '../armi-3d/collezione.js'
import { TIPI } from '../armature-3d/armature.js'
import { CATALOGO_TESTA } from '../copricapi-3d/copricapi.js'
import { CHIAVI } from '../eroi-3d/eroi.js'
import { ELEMENTI, ABILITA, VIE_ORDINE, NOME_VIA, ELEM_ARMA } from './dati.js'

const h = (tag, attr = {}, ...figli) => {
  const e = document.createElement(tag)
  for (const [k, v] of Object.entries(attr)) { if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v) }
  for (const f of figli.flat()) if (f != null) e.append(f)
  return e
}
const FAM_NOME = { spada: 'Spade', ascia: 'Asce', arco: 'Archi (in mano sinistra)', bacchetta: 'Bacchette e staffe', scudo: 'Scudi' }

export function creaPannello ({ S, az, mostri }) {
  const sel = (chiave, gruppi, { onCambia } = {}) => {
    const s = h('select', { 'data-k': chiave })
    for (const g of gruppi) {
      const dove = g.nome ? s.appendChild(h('optgroup', { label: g.nome })) : s
      for (const [v, t] of g.voci) dove.append(h('option', { value: v }, t))
    }
    s.addEventListener('change', () => (onCambia ? onCambia(s.value) : az.scegli({ [chiave]: s.value })))
    return s
  }
  const riga = (etichetta, el) => h('label', { class: 'riga' }, h('span', {}, etichetta), el)
  const bottone = (testo, fn, cl = '') => h('button', { class: cl, onclick: fn, type: 'button' }, testo)
  const sezione = (titolo, aperta, ...figli) => { const d = h('details', {}, h('summary', {}, titolo), ...figli); if (aperta) d.open = true; return d }

  const armiDi = fam => CATALOGO.filter(a => a.famiglia === fam).map(a => [a.id, `${a.nome} · g${a.grado}${a.elemento !== 'nessuno' ? ' · ' + a.elemento : ''}`])
  const sArma = sel('arma', [{ voci: [['', '— a mani nude —']] }, ...['spada', 'ascia', 'arco', 'bacchetta'].map(f => ({ nome: FAM_NOME[f], voci: armiDi(f) }))])
  const sScudo = sel('scudo', [{ voci: [['', '— nessuno —']] }, { nome: FAM_NOME.scudo, voci: armiDi('scudo') }])
  const sEroe = sel('eroe', [{ voci: CHIAVI.map(c => [c, c[0].toUpperCase() + c.slice(1)]) }])
  const sArm = sel('armatura', [{ voci: [['nessuna', '— nessuna —'], ...TIPI.map(t => [t, t])] }])
  const sPre = sel('pregio', [{ voci: [['1', 'pregio 1'], ['2', 'pregio 2'], ['3', 'pregio 3']] }])
  const sTesta = sel('copricapo', [{ voci: [['serie', '— di serie —']] }, { nome: 'Elmi', voci: CATALOGO_TESTA.filter(c => c.classe === 'elmo').map(c => [c.id, `${c.nome} · g${c.grado}`]) }, { nome: 'Cappelli', voci: CATALOGO_TESTA.filter(c => c.classe === 'cappello').map(c => [c.id, `${c.nome} · g${c.grado}`]) }])

  const gruppiMostri = []
  for (const m of mostri) { let g = gruppiMostri.find(x => x.nome === m.gruppo); if (!g) gruppiMostri.push(g = { nome: m.gruppo, voci: [] }); g.voci.push([m.id, m.nome]) }
  const sMostro = sel('mostro', gruppiMostri)
  const sMArma = sel('mArma', [{ voci: [['', '— di serie —'], ['nessuna', '— mano vuota —']] }, ...['spada', 'ascia', 'bacchetta'].map(f => ({ nome: FAM_NOME[f], voci: armiDi(f) }))])
  const sMScudo = sel('mScudo', [{ voci: [['', '— di serie —'], ['nessuno', '— nessuno —']] }, { nome: FAM_NOME.scudo, voci: armiDi('scudo') }])
  const rigaSchel = h('div', { class: 'gruppo', id: 'rigaScheletro' }, riga('Arma del mostro', sMArma), riga('Scudo del mostro', sMScudo))

  // effetto dell'arma: automatico o uno qualsiasi tra i colpi da vicino e i proiettili
  const sEffArma = sel('effettoArma', [
    { voci: [['auto', 'automatico (secondo l\'arma)']] },
    ...['vicino', 'lancio'].map(via => ({ nome: NOME_VIA[via], voci: [...ABILITA.values()].filter(a => a.def.via === via).map(a => [a.id, a.chiave]) })),
  ])
  const gruppiAb = VIE_ORDINE.map(via => ({ nome: NOME_VIA[via], voci: [...ABILITA.values()].filter(a => a.def.via === via).map(a => [a.id, `${a.chiave} (${a.def.durata === Infinity ? '∞' : a.def.durata + 's'})`]) })).filter(g => g.voci.length)
  const sAb = sel('abilita', gruppiAb)
  const sElem = sel('elemento', [{ voci: [['auto', 'automatico']] , }, { voci: ELEMENTI.map(e => [e, e]) }])
  const sStatoSu = sel('statoSu', [{ voci: [['mostro', 'sul mostro'], ['eroe', 'sull\'eroe']] }])
  const sVar = sel('variante', [{ voci: [['', '(unico attacco)']] }])

  const velocita = h('input', { type: 'range', min: '0.1', max: '2', step: '0.05', value: '1', id: 'velocita' })
  const etVel = h('b', {}, '1.0×')
  velocita.addEventListener('input', () => { S.velocita = Number(velocita.value); etVel.textContent = S.velocita.toFixed(2) + '×' })
  const cFila = h('input', { type: 'checkbox', id: 'fila' }); cFila.addEventListener('change', () => az.scegli({ fila: cFila.checked }))
  const info = h('div', { class: 'info', id: 'info' })

  const pannello = h('aside', { id: 'pannello' },
    h('header', {}, h('b', {}, 'Arena di prova'), bottone('✕', () => az.pannello(false), 'chiudi')),
    h('p', { class: 'nota' }, 'Trascina per girare la vista, rotella o pizzico per lo zoom, doppio clic per riportarla.'),
    sezione('Eroe', true,
      riga('Eroe', sEroe), riga('Arma (destra)', sArma), riga('Scudo / mancina', sScudo),
      riga('Armatura', h('span', { class: 'due' }, sArm, sPre)), riga('Copricapo', sTesta)),
    sezione('Mostro (bersaglio)', true, riga('Mostro', sMostro), rigaSchel),
    sezione('Attacchi dell\'eroe', true,
      riga('Effetto dell\'arma', sEffArma),
      h('div', { class: 'bott' }, bottone('Attacca con l\'arma', () => az.eroeAttacca(), 'forte')),
      riga('Abilità', sAb), riga('Elemento', sElem), riga('Stato su', sStatoSu),
      h('div', { class: 'bott' }, bottone('Lancia l\'abilità', () => az.abilita(S.abilita, S.elemento), 'forte'), bottone('Togli stati', () => az.togliStati()))),
    sezione('Attacchi del mostro', true,
      riga('Variante', sVar),
      h('div', { class: 'bott' }, bottone('Il mostro attacca', () => az.mostroAttacca(S.variante || undefined), 'forte')),
      h('label', { class: 'riga' }, cFila, h('span', {}, 'mostra tutte le animazioni d\'attacco di fila'))),
    sezione('Duello e tempo', true,
      h('div', { class: 'bott' }, bottone('Duello', () => az.duello(!S.duello), 'forte'), bottone('Pausa / Riprendi', () => az.pausa(!S.pausa)), bottone('Passo', () => az.passo(1 / 30), '')),
      riga('Velocità', h('span', { class: 'due' }, velocita, etVel)),
      h('div', { class: 'bott' }, bottone('Passo 0,1 s', () => az.passo(0.1)), bottone('Vista iniziale', () => az.vista())),
      info))

  const campi = { eroe: sEroe, arma: sArma, scudo: sScudo, armatura: sArm, pregio: sPre, copricapo: sTesta, mostro: sMostro, mArma: sMArma, mScudo: sMScudo, effettoArma: sEffArma, abilita: sAb, elemento: sElem, statoSu: sStatoSu, variante: sVar }
  function sync (extra = {}) {
    for (const [k, el] of Object.entries(campi)) if (S[k] != null && el.value !== String(S[k])) el.value = String(S[k])
    cFila.checked = !!S.fila
    velocita.value = String(S.velocita); etVel.textContent = S.velocita.toFixed(2) + '×'
    rigaSchel.style.display = extra.impugna ? '' : 'none'
    if (extra.varianti) {
      sVar.textContent = ''
      const v = extra.varianti
      if (!v.length) sVar.append(h('option', { value: '' }, '(unico attacco)'))
      for (const x of v) sVar.append(h('option', { value: x }, x))
      sVar.value = S.variante || (v[0] ?? '')
    }
    sScudo.disabled = S.armaTipo === 'arco'
  }
  return { el: pannello, sync, info, campi }
}
