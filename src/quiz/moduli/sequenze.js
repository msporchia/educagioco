/* ═══════════════════════════════════════════════════════════════════
   SEQUENZE — la regola nascosta: cosa viene dopo, e chi non c'entra.

   Viene da due prototipi che stavano fermi in `poc/` — `indovinelli.html`
   (le sequenze) e `la-regola.html` (l'intrusa): due giochi interi,
   bellissimi da provare e invisibili a chi gioca, perché un file in
   `poc/` non è un modulo e nessun gioco gli chiede mai niente. Qui
   dentro c'è la parte che vale per tutti: una FIGURA con cinque
   attributi, e una regola che ne muove uno o due.

   forma · colore · quante · grande o piccola · come è girata

   PERCHÉ SONO LO STESSO MODULO. «Cosa viene dopo» e «chi non c'entra»
   sembrano due giochi e sono due domande sulla stessa cosa: c'è una
   regola, trovala. Cambia solo dove si nasconde — nel ritmo di una fila
   o in quello che tre figure hanno in comune — e infatti si alternano
   grado dopo grado, sempre più difficili tutte e due.

   L'INTRUSA DEVE ESSERE UNA SOLA, e questo è il punto delicato del
   file. Se sulle quattro figure due attributi diversi facessero 3+1
   (tre rosse e una blu, ma anche tre grandi e una piccola), ci sarebbero
   due intruse difendibili e il bambino che sbaglia avrebbe ragione. La
   ricetta che lo impedisce viene dal prototipo: gli attributi che fanno
   rumore si distribuiscono 2+2 sulle quattro carte, quelli fermi valgono
   uguale per tutte e quattro, e solo l'attributo della regola fa 3+1.
   Poi lo si **verifica lo stesso**, contando: una domanda ambigua non la
   prende nessun controllo di forma, la vede solo il bambino che perde.

   I FALSI DELLE SEQUENZE SONO IL PASSO SBAGLIATO: il valore che la
   regola darebbe un posto prima o un posto dopo. È lì che casca chi ha
   visto il ritmo ma non l'ha contato — e un falso preso a caso, invece,
   si scarta senza aver capito niente.
   ═══════════════════════════════════════════════════════════════════ */

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

/* come si legge una regola, per la dritta di fine domanda */
const DICE = {
  forma: v => `le forme tornano a turno: ${v.join(', ')}`,
  colore: v => `i colori tornano a turno: ${v.join(', ')}`,
  quante: v => `le quantità tornano a turno: ${v.join(', ')}`,
  grande: () => 'grande e piccolo si danno il cambio',
}

/* Le tipologie. Il ciclo e il passo sono due difficoltà diverse della
   stessa fila — il ciclo si vede, il passo si conta — e stanno in due
   voci separate perché un bambino può benissimo leggere «rosso, blu,
   rosso, blu» e non vedere che le frecce girano sempre dalla stessa
   parte. L'intrusa è il gioco al contrario: non cosa continua la
   regola, ma cosa la rompe. */
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
      /* QUANTO È COMPLICATO OGNI GRADO, da 0 a 100 — la scala è una
         sola per tutte le materie, e serve a confrontare questa riga
         con quelle di tutti gli altri moduli. Zero è il primo giorno
         di materna, cento la fine della primaria: dodici punti e mezzo
         per anno di scuola. Non dice a chi arriva — quello lo decide
         la finestra dell'età di chi gioca (`nucleo/classi.js`). */
      livelli: [12, 20, 29, 42, 56],
      /* non c'è una lezione da aver fatto, si guarda: il gruppo serve a
         isolare le sequenze, non a coprire una lacuna */
      tipi: TIPI,
      pittori: PITTORI_FIGURE,
    })
  }

  genera(grado, sorte, tipo) {
    switch (grado) {
      /* al grado 1 gli assi sono due — colore e forma — e non tre:
         «grande, piccolo, grande, …» ha due soli valori, quindi la
         risposta si indovina anche senza aver visto il ritmo */
      case 1: return this.sequenza(sorte, { assi: 1, lunga: 4, fra: ['colore', 'forma'], vuoi: tipo })
      case 2: return this.intrusa(sorte, { dove: ['colore', 'forma'], rumore: 2 })
      case 3: return this.sequenza(sorte, { assi: 2, lunga: 5, fra: ['colore', 'forma', 'grande'], vuoi: tipo })
      case 4: return this.intrusa(sorte, { dove: ['quante', 'grande'], rumore: 3 })
      default: return this.sequenza(sorte, { assi: 2, lunga: 5, passo: true, fra: ['quante', 'colore', 'forma'], vuoi: tipo })
    }
  }

  /* ── una figura qualunque, ferma ── */
  base(sorte) {
    return {
      forma: sorte.uno(VALORI.forma),
      colore: sorte.uno(VALORI.colore),
      quante: 1,
      grande: true,
      ruota: 0,
    }
  }

  /* ── cosa viene dopo ──
     Ogni asse scelto si porta una regola: quasi sempre un CICLO (i
     valori tornano a turno), e nei gradi alti un PASSO — la quantità
     che cresce di uno, la freccia che gira sempre dalla stessa parte.
     Il ciclo si vede, il passo si conta: sono due difficoltà diverse. */
  sequenza(sorte, { assi, lunga, passo = false, fra, vuoi }) {
    /* `vuoi` è la tipologia chiesta: il passo si fa con la freccia che
       gira o con la quantità che cresce, il ciclo con tutto il resto.
       Senza, si tira a sorte come sempre. */
    const conFreccia = passo && (vuoi ? vuoi === 'seq:passo' && sorte.forse(0.5) : sorte.forse(0.5))
    const scelti = conFreccia
      ? ['ruota', ...sorte.alcuni(['colore', 'quante', 'grande'], assi - 1)]
      : vuoi === 'seq:passo'
        ? ['quante', ...sorte.alcuni(fra.filter(a => a !== 'quante'), assi - 1)]
        : sorte.alcuni(vuoi === 'seq:ciclo' && passo ? fra.filter(a => a !== 'quante') : fra, assi)
    /* le quantità sono quattro: una fila che «cresce di uno» più lunga
       di quattro sbatterebbe contro il tetto e ripeterebbe l'ultima —
       la regola smetterebbe di valere proprio sulla risposta */
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

    /* i falsi: la stessa fila letta un posto avanti o un posto indietro */
    const visti = new Set([chiaveFig(buona)])
    const falsi = []
    const metti = (f, perche) => {
      /* «un posto dopo» su una fila che cresce dà cinque figurine, e
         cinque non esistono: un falso fuori dal mondo si vedrebbe
         disegnato storto, non sbagliato */
      if (!VALORI.quante.includes(f.quante) || !VALORI.ruota.includes(f.ruota || 0)) return
      if (visti.has(chiaveFig(f)) || falsi.length >= 3) return
      visti.add(chiaveFig(f))
      falsi.push(scena({ che: 'cella', fig: f }, perche))
    }
    for (const r of sorte.mescola(regole))
      for (const k of [lunga - 2, lunga, lunga - 3, lunga + 1])
        metti(copia(buona, { [r.asse]: r.valore(Math.max(0, k)) }),
          'hai visto il ritmo ma hai contato un posto in più (o in meno): guarda dove tocca esattamente all\'ultima')
    /* se il ciclo è corto i passi vicini si esauriscono: si riempie con
       figure che cambiano un attributo qualunque fra quelli in gioco */
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

  /* ── chi non c'entra ──
     Tre figure hanno una cosa in comune, la quarta no. Vedi
     l'intestazione per il perché della ricetta: qui la difficoltà non
     sta nella regola ma nel RUMORE — quanti altri attributi cambiano
     senza voler dire niente, e quanto è appariscente quello che conta. */
  intrusa(sorte, { dove, rumore }) {
    for (let giro = 0; giro < 60; giro++) {
      const attr = sorte.uno(dove)
      /* «quante» e «grande» non stanno mai in ballo insieme. Quattro
         stelle stanno in una cella solo rimpicciolendosi, quindi una
         figura grande in quattro copie si vede più piccola di una
         piccola in due: la taglia si può confrontare solo a parità di
         numero. Chi non è la regola resta fermo — uguale su tutte e
         quattro le carte — e il confronto torna onesto. */
      const litiga = attr === 'quante' ? 'grande' : attr === 'grande' ? 'quante' : null
      const altri = ATTRIBUTI.filter(a => a !== attr && a !== litiga)
      /* meno di due attributi rumorosi e due delle tre buone sarebbero
         la stessa identica figura */
      const rumorosi = sorte.alcuni(altri, Math.max(2, Math.min(rumore, altri.length)))
      /* chi litiga con la regola entra fra i fermi: un valore solo per
         tutte e quattro, così c'è ma non dice niente */
      const fermi = altri.filter(a => !rumorosi.includes(a)).concat(litiga ? [litiga] : [])

      const via = { ruota: 0 }
      for (const a of fermi) via[a] = sorte.uno(VALORI[a])
      /* ogni attributo rumoroso ha due valori: uno lo tengono due delle
         tre buone, l'altro la terza — e l'intrusa prende quello spaiato,
         così sulle quattro carte fa 2+2 e non accusa nessuno */
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
      if (new Set(tutte.map(chiaveFig)).size !== 4) continue      // due gemelle
      if (!unaSola(tutte, attr)) continue                          // due intruse

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
    /* la rete di sicurezza: tre uguali e una col colore cambiato. Non è
       una bella domanda, ma è una domanda onesta */
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

/* Un solo attributo può fare 3+1: se ne facesse due, ci sarebbero due
   intruse difendibili. Gli attributi fermi (4+0) e quelli rumorosi
   (2+2) vanno bene, sono le distribuzioni che non accusano nessuno. */
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
