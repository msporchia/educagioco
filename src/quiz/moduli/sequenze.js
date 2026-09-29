// «cosa viene dopo» e «chi non c'entra»: stessa cosa, trova la regola nascosta su una figura a cinque attributi (forma/colore/quante/grande/ruota). Sull'intrusa vedi "l'intrusa dev'essere una sola" in docs/apprendimento/quiz-moduli.md. I falsi delle sequenze sono il passo sbagliato (un posto prima o dopo): quello preso a caso si scarta senza capire niente.
import { Modulo } from '../nucleo/modulo.js'
import { domanda, scena } from '../nucleo/domanda.js'
import { PITTORI_FIGURE, FORME_FIGURE } from '../grafica/pittori/figure.js'
import { COLORI } from '../grafica/pittori/tinte.js'

/* ── l'universo delle figure ── */
const VALORI = {
  forma: FORME_FIGURE.filter(f => f !== 'freccia'),   // la freccia solo dove si gira
  colore: COLORI,
  quante: [1, 2, 3, 4],
  grande: [true, false],
  ruota: [0, 90, 180, 270],
}
const ATTRIBUTI = ['forma', 'colore', 'quante', 'grande']

const chiaveFig = f => `${f.forma}/${f.colore}/${f.quante}/${f.grande}/${f.ruota || 0}`
const copia = (f, cambi) => ({ ...f, ...cambi })

const DICE = {
  forma: v => `le forme tornano a turno: ${v.join(', ')}`,
  colore: v => `i colori tornano a turno: ${v.join(', ')}`,
  quante: v => `le quantità tornano a turno: ${v.join(', ')}`,
  grande: () => 'grande e piccolo si danno il cambio',
}

// ciclo e passo sono due difficoltà diverse (il ciclo si vede, il passo si conta): un bambino può vedere l'uno e non l'altro
const TIPI = [
  { chiave: 'seq:ciclo', nome: 'Il ritmo che si ripete', sa: 'sequenze', gradi: { 1: 1, 3: 1, 5: 0.2 } },
  { chiave: 'seq:passo', nome: 'Il passo che cresce o gira', sa: 'sequenze', gradi: { 5: 0.8 } },
  { chiave: 'seq:intrusa', nome: "Chi non c'entra", sa: 'sequenze', gradi: { 2: 1, 4: 1 } },
]

class Sequenze extends Modulo {
  constructor() {
    super({
      id: 'sequenze',
      nome: 'Sequenze',
      icona: '➡️',
      materia: 'logica',
      chiaro: 'trovare la regola nascosta: cosa viene dopo in una fila, e quale figura non c\'entra',
      scaletta: [
        'cosa viene dopo: una cosa sola che cambia',
        'chi non c\'entra: il colore e la forma',
        'cosa viene dopo: due cose che cambiano insieme',
        'chi non c\'entra: quante sono e quanto sono grandi',
        'cosa viene dopo: le figure che girano e crescono',
      ],
      livelli: [12, 20, 29, 42, 56], // scala 0-100 comune a tutte le materie (vedi docs/apprendimento/quiz-livelli.md)
      tipi: TIPI, // non c'è una lezione da aver fatto: il gruppo isola le sequenze, non copre una lacuna
      pittori: PITTORI_FIGURE,
    })
  }

  genera(grado, sorte, tipo) {
    switch (grado) {
      // al grado 1 niente «grande» fra gli assi: ha due soli valori, si indovina senza vedere il ritmo
      case 1: return this.sequenza(sorte, { assi: 1, lunga: 4, fra: ['colore', 'forma'], vuoi: tipo })
      case 2: return this.intrusa(sorte, { dove: ['colore', 'forma'], rumore: 2 })
      case 3: return this.sequenza(sorte, { assi: 2, lunga: 5, fra: ['colore', 'forma', 'grande'], vuoi: tipo })
      case 4: return this.intrusa(sorte, { dove: ['quante', 'grande'], rumore: 3 })
      default: return this.sequenza(sorte, { assi: 2, lunga: 5, passo: true, fra: ['quante', 'colore', 'forma'], vuoi: tipo })
    }
  }

  base(sorte) { // una figura qualunque, ferma
    return {
      forma: sorte.uno(VALORI.forma),
      colore: sorte.uno(VALORI.colore),
      quante: 1,
      grande: true,
      ruota: 0,
    }
  }

  sequenza(sorte, { assi, lunga, passo = false, fra, vuoi }) {
    // `vuoi`: il passo si fa con freccia o quantità, il ciclo con tutto il resto; senza, a sorte
    const conFreccia = passo && (vuoi ? vuoi === 'seq:passo' && sorte.forse(0.5) : sorte.forse(0.5))
    const scelti = conFreccia
      ? ['ruota', ...sorte.alcuni(['colore', 'quante', 'grande'], assi - 1)]
      : vuoi === 'seq:passo'
        ? ['quante', ...sorte.alcuni(fra.filter(a => a !== 'quante'), assi - 1)]
        : sorte.alcuni(vuoi === 'seq:ciclo' && passo ? fra.filter(a => a !== 'quante') : fra, assi)
    // le quantità sono quattro: più lunga di quattro, «cresce di uno» sbatterebbe contro il tetto proprio sulla risposta
    const cresce = passo && !conFreccia && scelti.includes('quante')
    if (cresce) lunga = 4

    const regole = scelti.map(a => {
      if (a === 'ruota') {
        const verso = sorte.forse(0.5) ? 90 : -90
        const via = sorte.uno(VALORI.ruota)
        return { asse: a, valore: i => (((via + verso * i) % 360) + 360) % 360, dice: verso > 0 ? 'la freccia gira sempre verso destra' : 'la freccia gira sempre verso sinistra' }
      }
      if (a === 'quante' && cresce) {
        const su = sorte.forse(0.7)
        const via = su ? 1 : 4
        return { asse: a, valore: i => via + (su ? i : -i), dice: su ? "ogni volta ce n'è uno in più" : "ogni volta ce n'è uno in meno" }
      }
      const periodo = a === 'grande' ? 2 : (lunga >= 5 && sorte.forse(0.45) ? 3 : 2)
      const valori = sorte.alcuni(VALORI[a], periodo)
      return { asse: a, valore: i => valori[i % periodo], dice: DICE[a](valori.map(v => (v === true ? 'grande' : v === false ? 'piccolo' : v))) }
    })

    const via = this.base(sorte)
    if (conFreccia) via.forma = 'freccia'
    const celle = []
    for (let i = 0; i < lunga; i++) {
      const f = copia(via)
      for (const r of regole) f[r.asse] = r.valore(i)
      celle.push(f)
    }
    const buona = celle[lunga - 1]

    // i falsi: la stessa fila letta un posto avanti o indietro
    const visti = new Set([chiaveFig(buona)])
    const falsi = []
    const metti = (f, perche) => {
      // fuori dal mondo (es. cinque figurine) si vedrebbe disegnato storto, non sbagliato: si scarta
      if (!VALORI.quante.includes(f.quante) || !VALORI.ruota.includes(f.ruota || 0)) return
      if (visti.has(chiaveFig(f)) || falsi.length >= 3) return
      visti.add(chiaveFig(f))
      falsi.push(scena({ che: 'cella', fig: f }, perche))
    }
    for (const r of sorte.mescola(regole))
      for (const k of [lunga - 2, lunga, lunga - 3, lunga + 1])
        metti(copia(buona, { [r.asse]: r.valore(Math.max(0, k)) }),
          'hai visto il ritmo ma hai contato un posto in più (o in meno): guarda dove tocca esattamente all\'ultima')
    // se il ciclo è corto i passi vicini si esauriscono: si riempie cambiando un attributo qualunque in gioco
    for (let g = 0; g < 40 && falsi.length < 3; g++) {
      const a = sorte.uno(scelti.length ? scelti : ATTRIBUTI)
      metti(copia(buona, { [a]: sorte.uno(VALORI[a].filter(v => v !== buona[a])) }),
        'questa non continua la regola della fila')
    }

    return domanda({
      testo: 'Cosa viene dopo?',
      soggetto: scena({ che: 'fila', celle: celle.slice(0, lunga - 1), buco: true, colore: via.colore }),
      buona: scena({ che: 'cella', fig: buona }),
      falsi,
      chiave: regole.some(r => r.asse === 'ruota') || (passo && regole.some(r => r.asse === 'quante'))
        ? 'seq:passo' : 'seq:ciclo',
      aiuto: 'la regola: ' + regole.map(r => r.dice).join(' · '),
      sorte,
    })
  }

  // tre figure in comune, la quarta no; difficoltà nel RUMORE, non nella regola (vedi docs/apprendimento/quiz-moduli.md)
  intrusa(sorte, { dove, rumore }) {
    for (let giro = 0; giro < 60; giro++) {
      const attr = sorte.uno(dove)
      const litiga = attr === 'quante' ? 'grande' : attr === 'grande' ? 'quante' : null // mai insieme: la taglia si confronta solo a parità di numero
      const altri = ATTRIBUTI.filter(a => a !== attr && a !== litiga)
      const rumorosi = sorte.alcuni(altri, Math.max(2, Math.min(rumore, altri.length))) // <2 e due delle tre buone sarebbero identiche
      const fermi = altri.filter(a => !rumorosi.includes(a)).concat(litiga ? [litiga] : [])

      const via = { ruota: 0 }
      for (const a of fermi) via[a] = sorte.uno(VALORI[a])
      // ogni rumoroso ha due valori: due buone tengono uno, la terza e l'intrusa l'altro (2+2, non accusa nessuno)
      const coppia = {}, spaiato = {}
      for (const a of rumorosi) {
        const due = sorte.alcuni(VALORI[a], 2)
        coppia[a] = due[0]
        spaiato[a] = due[1]
      }
      const tiene = rumorosi.map(() => sorte.fra(0, 2))
      const [buonoV, intrusoV] = sorte.alcuni(VALORI[attr], 2)

      const carte = [0, 1, 2].map(n => {
        const f = { ...via, [attr]: buonoV }
        rumorosi.forEach((a, i) => { f[a] = tiene[i] === n ? spaiato[a] : coppia[a] })
        return f
      })
      const intrusa = { ...via, [attr]: intrusoV }
      rumorosi.forEach(a => { intrusa[a] = spaiato[a] })

      const tutte = [...carte, intrusa]
      if (new Set(tutte.map(chiaveFig)).size !== 4) continue // due gemelle
      if (!unaSola(tutte, attr)) continue // due intruse

      const nome = { forma: 'la forma', colore: 'il colore', quante: 'quante sono', grande: 'la grandezza' }[attr]
      return domanda({
        testo: 'Tre figure hanno una cosa in comune. Qual è quella che non c\'entra?',
        buona: scena({ che: 'cella', fig: intrusa }),
        falsi: carte.map(f => scena({ che: 'cella', fig: f },
          `questa sta con le altre due: guarda ${nome}`)),
        chiave: 'seq:intrusa',
        aiuto: `quello che conta qui è ${nome}: tre figure vanno d'accordo, una no`,
        sorte,
      })
    }
    // rete di sicurezza: tre uguali, una col colore cambiato — non bella, ma onesta
    const f = this.base(sorte)
    const altro = { ...f, colore: sorte.uno(VALORI.colore.filter(c => c !== f.colore)) }
    return domanda({
      testo: 'Tre figure hanno una cosa in comune. Qual è quella che non c\'entra?',
      buona: scena({ che: 'cella', fig: altro }),
      falsi: [0, 1, 2].map(i => scena({ che: 'cella', fig: { ...f, ruota: i * 90 } }, 'questa ha il colore delle altre')),
      chiave: 'seq:intrusa',
      aiuto: 'quello che conta qui è il colore',
      sorte,
    })
  }
}

// un solo attributo può fare 3+1 (vedi docs/apprendimento/quiz-moduli.md); 4+0 e 2+2 vanno bene, non accusano nessuno
function unaSola(carte, attr) {
  for (const a of ATTRIBUTI) {
    const conto = new Map()
    for (const c of carte) conto.set(c[a], (conto.get(c[a]) || 0) + 1)
    const solitari = [...conto.values()].filter(n => n === 1).length
    const tre = [...conto.values()].some(n => n === 3)
    if (a === attr) { if (!tre || solitari !== 1) return false }
    else if (tre || solitari > 0) return false
  }
  return true
}

export default new Sequenze()
