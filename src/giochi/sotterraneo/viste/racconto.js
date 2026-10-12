// Il racconto di un turno (docs/sotterraneo/scontro.md, «La vista»): il motore fa tutto dentro `rispondi` e consegna le azioni
// in ordine (`esito.azioni`); qui si rifanno una alla volta, perché chi guarda capisca chi ha fatto cosa a chi. Non calcola
// niente: ogni numero è già nell'azione. Quello che si vede passa da `fx`, un oggetto reattivo che `Scontro.vue` legge:
// le ossa mostrate (le vere sono già scese), chi è caduto, chi scatta e chi prende, i numeri che salgono, gli effetti
// dell'abilità (`scene`, dati/effetti.js) e la fila dei turni che scorre. Un tocco accorcia (`accorcia`); la domanda dopo
// compare a racconto finito (`fx.attivo`). Come si sceglie e si disegna l'effetto: docs/sotterraneo/scontro-effetti.md.
import { reactive } from 'vue'
import { ELEMENTI, STATI } from '../dati/elementi.js'
import { schedaDi, motoDell, effettoDi, aureDelNodo, statiDelNodo, tintaDelColpo } from '../dati/effetti.js'
import { colpisce } from '../dati/abilita.js'
import { statoNuovo, statiDel } from './campo.js'

// i tempi, in ms (un mostro ~0,45 s; l'eroe quanto dura il suo effetto, mai oltre ~0,8 s)
export const TEMPI = { passo: 170, mostro: 450, nota: 300, veleno: 380, bevi: 520, riga: 1100, tetto: 860 }
const VELOCE = 6   // quante volte più in fretta, dopo un tocco
const IN_PIU = 340  // quanto al più aspetta chi sta lontano dal bersaglio (ms)
const STAGGIO = 420  // quanto dura un segno sul mostro (ms)

// Come colpisce l'eroe in un'azione: l'effetto (dall'abilità, o dall'arma in mano per l'attacco solito), il colore, se colpisce
// davvero. `nodo`: l'abilità (NODI), `famiglia`: la famiglia dell'arma in mano, `tinta`: il colore del ramo (per il nome)
export function modoDelColpo({ nodo = null, famiglia = null, tinta = '#ffe39a' } = {}) {
  return { colpisce: !nodo || colpisce(nodo), effetto: effettoDi(nodo, famiglia), nodo, tinta, luce: tintaDelColpo(nodo ? nodo.elemento : null) }
}
const MODO_SOLITO = { colpisce: true, effetto: 'taglio', nodo: null, tinta: '#ffe39a', luce: tintaDelColpo(null) }

const nuovo = () => ({
  attivo: false, veloce: false,
  ossa: {}, morti: {},            // per posto: le ossa mostrate, chi è caduto
  stati: {},                      // per posto: gli stati addosso mostrati adesso (la verità arriva a racconto finito)
  effetto: {},                    // per posto o 'eroe': { tipo, n } (scatta, colpito, protegge…): riavvia l'animazione di quella figura
  numeri: [], scene: [],          // { id, su, testo, tipo, riga?, glifo? } · gli effetti dell'abilità (dati/effetti.js, viste/Scene.vue)
  nome: null,                     // l'abilità che l'eroe sta usando { glifo, nome, tinta }
  fila: null,                     // la fila dei turni mentre si racconta (null: quella vera)
  riga: null,                     // la riga d'apertura («Alle spalle!»)
  scuote: 0,                      // il palco trema (un terremoto, un'esplosione grossa): si riavvia a ogni numero nuovo
})

export function nuovoRacconto({ suono = () => {}, colpitoEroe = () => {}, finito = () => {} } = {}) {
  const fx = reactive(nuovo())
  let passi = [], i = 0, timer = 0, vel = 1, n = 0

  const reset = () => Object.assign(fx, nuovo())
  const tocca = (chi, tipo) => { fx.effetto[chi] = { tipo, n: ++n } }
  const numero = (su, testo, tipo, extra = {}) => fx.numeri.push({ id: ++n, su, testo, tipo, ...extra })

  function avanti() {
    if (i >= passi.length) { chiudi(); return }
    const { dopo, fa } = passi[i++]
    timer = setTimeout(() => { fa(); avanti() }, dopo / vel)
  }
  function chiudi() {
    clearTimeout(timer)
    reset()
    finito()
  }
  const ferma = () => { clearTimeout(timer); passi = []; if (fx.attivo) reset() }

  // un tocco: il resto va in fretta (i passi restano, i tempi no)
  function accorcia() {
    if (!fx.attivo || fx.veloce) return
    fx.veloce = true
    vel = VELOCE
    clearTimeout(timer)
    avanti()
  }

  // Racconta le `azioni` di un turno. `campo`: i mostri in campo (gli indici sono i posti); `prima`: com'era prima, le ossa
  // di ognuno, la fila dei turni e gli stati; `modo(a)`: come colpisce l'eroe in quell'azione (`modoDelColpo`); `riga`: la riga d'apertura
  function racconta({ campo, prima, azioni, modo = () => MODO_SOLITO, riga = null }) {
    ferma()
    reset()
    vel = 1
    passi = []
    i = 0
    const posto = x => (x === 'eroe' ? 'eroe' : campo.indexOf(x))
    const p = (dopo, fa) => passi.push({ dopo, fa })
    p(0, () => {
      fx.attivo = true
      campo.forEach((m, k) => {
        fx.ossa[k] = prima.ossa[k]; fx.morti[k] = !!prima.morti[k]
        if (prima.stati && prima.stati[k]) fx.stati[k] = prima.stati[k]
      })
      fx.fila = prima.turni ? prima.turni.map((t, id) => ({ ...t, id })) : null
      fx.riga = riga
    })
    const fineTurno = chi => p(0, () => { if (fx.fila && fx.fila[0] && fx.fila[0].chi === chi) fx.fila = fx.fila.slice(1) })
    const cade = k => { fx.morti[k] = true; if (fx.fila) fx.fila = fx.fila.filter(t => t.chi !== k) }
    // le righe piccole sotto il numero: «resiste», «lo teme!», «non gela». Una riga sotto l'altra
    const note = (k, c) => {
      const el = c && c.elemento && ELEMENTI[c.elemento]
      let riga = 0
      if (c && c.effetto === 'resiste') numero(k, 'resiste', 'segno', { riga: riga++, glifo: 'scudo', tono: 'resiste' })
      else if (c && c.effetto === 'teme') numero(k, 'lo teme!', 'segno', { riga: riga++, glifo: el && el.glifo, tono: 'teme' })
      for (const s of (c && c.rifiutati) || []) if (STATI[s]) numero(k, STATI[s].non, 'segno', { riga: riga++, glifo: STATI[s].glifo, tono: 'immune', barrato: true })
    }
    // un colpo che arriva su un mostro: scende la barra, sale il numero (più piccolo se resiste, più grande se teme), trema
    const colpo = (k, dato, c) => () => {
      const e = c && c.effetto
      fx.ossa[k] = Math.max(0, fx.ossa[k] - dato)
      numero(k, `−${dato}`, e === 'teme' ? 'teme' : e === 'resiste' ? 'resiste' : 'dato')
      note(k, c)
      tocca(k, e === 'teme' ? 'colpito-forte' : e === 'resiste' ? 'colpito-debole' : 'colpito')
    }
    // un colpo da dietro il sipario: un mostro rimanda il colpo (specchio)
    const ferisci = (k, dato, tipo, caduto) => {
      p(0, () => { fx.ossa[k] = Math.max(0, fx.ossa[k] - dato); numero(k, `−${dato}`, tipo); tocca(k, 'colpito') })
      if (caduto) { p(300, () => suono('bottino')); p(0, () => cade(k)) }
    }

    for (const a of azioni) {
      if (a.chi === 'eroe') {
        const m = modo(a)
        if (a.che === 'bevi') {
          p(0, () => { fx.nome = null; tocca('eroe', 'cura'); suono('bevuto') })
          p(TEMPI.bevi, () => {})
        } else if (a.che === 'sbaglia') {
          p(0, () => { tocca('eroe', 'vuoto'); if (a.bersaglio) numero(posto(a.bersaglio), 'a vuoto', 'nota'); suono('ahia') })
          p(620 * 0.7, () => {})
        } else {
          eroeAgisce(a, m)
        }
        p(0, () => { fx.nome = null })
        fineTurno('eroe')
        continue
      }
      // un mostro: veleno che brucia, turno saltato, colpo
      const k = posto(a.chi)
      if (a.che === 'veleno' || a.che === 'sanguina') {
        p(0, () => { numero(k, `−${a.dato}`, 'veleno'); fx.ossa[k] = Math.max(0, fx.ossa[k] - a.dato); tocca(k, 'colpito') })
        if (a.caduto) { p(TEMPI.nota, () => {}); p(0, () => cade(k)); fineTurno(k) }
        else p(TEMPI.veleno, () => {})
      } else if (a.che === 'salta') {
        p(0, () => { numero(k, 'stordito', 'nota'); tocca(k, 'stordito') })
        p(TEMPI.nota, () => {})
        p(0, () => { if (fx.stati[k]) fx.stati[k] = fx.stati[k].filter(x => x.chiave !== 'fermo') })
        fineTurno(k)
      } else {
        // il colpo: chi colpisce scatta verso l'eroe, e a metà scatto l'eroe incassa
        p(0, () => tocca(k, 'scatta'))
        p(TEMPI.passo, () => {
          if (a.preso > 0) { numero('eroe', `−${a.preso}`, 'preso'); tocca('eroe', 'colpito'); colpitoEroe(); suono('graffio') }
          else if (a.schivato) numero('eroe', 'schivato', 'nota')
          else if (a.assorbito > 0) { numero('eroe', 'parato', 'nota'); tocca('eroe', 'protegge') }
          else if (a.salvo) numero('eroe', '0', 'nota')
        })
        if (a.rimandato) {
          p(120, () => {})
          ferisci(k, a.rimandato, 'dato', a.caduto)
          p(250, () => {})
        } else p(TEMPI.mostro - TEMPI.passo, () => {})
        fineTurno(k)
      }
    }

    // L'azione dell'eroe che colpisce, o che mette qualcosa addosso a qualcuno, o che protegge lui: una scena (dati/effetti.js) di
    // cose che si muovono e di colpi che arrivano ognuno a suo tempo. Si costruisce tutta insieme: gli effetti partono con un
    // ritardo (CSS), le ossa, i numeri e gli stati con un passo del racconto allo stesso istante
    function eroeAgisce(a, m) {
      const nodo = m.nodo || null
      const s = schedaDi(m.effetto)
      const usata = a.usata
      p(0, () => { fx.nome = usata ? { glifo: usata.glifo, nome: usata.nome, tinta: m.tinta } : null })
      // chi prende l'abilità, anche senza danno (Rovi, Ninna nanna); l'ordine: la catena in fila, gli altri per distanza dal bersaglio
      const presi = a.presi && a.presi.length ? a.presi : a.colpiti.map(c => ({ chi: c.chi, rifiutati: c.rifiutati || [] }))
      const lista = s.via === 'su-me' ? [] : presi.map((x, j) => ({ k: posto(x.chi), c: a.colpiti.find(c => c.chi === x.chi) || null, j, rifiutati: x.rifiutati || [] }))
      const jb = Math.max(0, lista.findIndex(e => e.k === posto(a.bersaglio)))
      lista.forEach(e => { e.ord = a.forma === 'catena' ? e.j : Math.abs(e.j - jb) })
      const dopo = e => Math.min(IN_PIU, e.ord * (s.passo || 0))
      const quando = e => (s.arrivo || 0) + dopo(e)
      const verso = lista.map(e => e.k)
      const scena = (corpo, modo, da, aa, ritardo, durata, extra = {}) =>
        fx.scene.push({ id: ++n, corpo, modo, da, a: aa, ritardo: Math.round(ritardo), durata: Math.round(durata), tinta: m.luce, piu: !!s.piu, ...extra })

      // 1. quello che si muove o nasce
      const posa = []   // [ritardo, fa]
      posa.push([0, () => tocca('eroe', motoDell(m.effetto))])
      const corpi = () => {
        switch (s.via) {
          case 'vicino': break
          case 'attorno': scena(s.corpo, 'qui', null, 'eroe', 0, s.arrivo + 100); break
          case 'lancio':
            if (s.oltre) scena(s.corpo, 'volo', 'eroe', lista[lista.length - 1].k, 0, quando(lista[lista.length - 1]), { verso })
            else if (s.alBersaglio) scena(s.corpo, 'volo', 'eroe', posto(a.bersaglio), 0, s.arrivo)
            else lista.forEach(e => scena(s.corpo, 'volo', 'eroe', e.k, dopo(e), s.arrivo))
            break
          case 'fascio': lista.forEach(e => scena(s.corpo, 'volo', 'eroe', e.k, dopo(e), s.arrivo + 220)); break
          case 'cielo': lista.forEach(e => scena(s.corpo, 'alto', null, e.k, dopo(e), s.arrivo)); break
          case 'catena': lista.forEach((e, j) => scena(s.corpo, 'volo', j ? lista[j - 1].k : 'eroe', e.k, e.j * (s.passo || 0), s.passo ? s.passo + 120 : s.arrivo)); break
          case 'terra': case 'su-chi': lista.forEach(e => scena(s.corpo, 'qui', null, e.k, dopo(e), s.dura - dopo(e) - 40)); break
          case 'onda': scena(s.corpo, 'qui', null, 'eroe', 0, s.dura - 100, { verso }); break
          case 'su-me': scena(s.corpo, 'qui', null, 'eroe', 0, s.dura - 40); break
        }
        // quello che resta addosso all'eroe: lo scudo, la pietra, la cura (anche se l'abilità colpisce pure)
        for (const c of aureDelNodo(nodo)) if (!(s.via === 'su-me' && c === s.corpo)) scena(c, 'qui', null, 'eroe', 80, 700)
      }
      posa.push([0, corpi])

      // 2. quello che arriva sul mostro, a suo tempo: il segno, il colpo, gli stati
      let ultimo = 0
      for (const e of lista) {
        const t = quando(e)
        ultimo = Math.max(ultimo, t, e.c && e.c.caduto ? t + 300 : 0)
        const c = e.c
        posa.push([t, () => {
          if (s.segno && s.via !== 'su-me') {
            scena(s.segno, 'qui', null, e.k, 0, STAGGIO, { ord: e.ord, forte: !!(c && c.effetto === 'teme') })
          }
          if (c) { suono('colpo'); colpo(e.k, c.dato, c)() }
          else { note(e.k, { rifiutati: e.rifiutati }); tocca(e.k, 'colpito-debole') }
          if (c && c.effetto === 'teme') scena('colpo', 'qui', null, e.k, 0, STAGGIO, { piu: true })
          if (c && c.effetto === 'resiste') scena('rimbalzo', 'qui', null, e.k, 0, STAGGIO)
          // gli stati che mette addosso
          const nuovi = statiDelNodo(nodo, e.rifiutati)
          if (nuovi.length && campo[e.k]) {
            const ora = (fx.stati[e.k] || statiDel(campo[e.k])).filter(x => !nuovi.includes(x.chiave))
            fx.stati[e.k] = [...ora, ...nuovi.map(ch => statoNuovo(ch, campo[e.k], nodo))]
          }
        }])
        if (c && c.caduto) posa.push([t + 300, () => { suono('bottino'); cade(e.k) }])
      }
      if (s.scuote && lista.length) posa.push([s.arrivo, () => { fx.scuote = ++n }])
      posa.sort((x, y) => x[0] - y[0])
      let ora = 0
      for (const [t, fa] of posa) { p(t - ora, fa); ora = t }
      const totale = Math.min(TEMPI.tetto, Math.max(s.dura, ultimo + 200, 0))
      p(Math.max(0, totale - ora), () => {})
    }

    // la riga d'apertura resta un poco anche a colpi finiti; senza colpi (la sorpresa) è tutto quello che si vede
    if (riga) p(azioni.length ? 450 : TEMPI.riga, () => {})
    p(0, () => {})
    fx.attivo = true   // da subito: la domanda non deve comparire fra questa chiamata e il primo passo
    avanti()
  }

  return { fx, racconta, accorcia, ferma }
}
