// La discesa lasciata a metà, che è anche il portale lasciato aperto (docs/sotterraneo/regole.md, "Lasciare a
// metà"). Il piano non si salva, si rifà dal seme; si salva quello che è cambiato, cosa per cosa, rispetto al
// piano appena nato, più le cose nuove (bottino, roba buttata). Si riprende nel punto esatto, coi mostri dove
// erano. La roba dell'avventuriero sta nell'avventura, non qui. Se la forma cambia (VERSIONE sale) un
// salvataggio vecchio non si legge più: si ricomincia — un campo che non torna è un gioco rotto.
import { Corsa } from './corsa.js'
import { CALMA } from '../dati/mondo.js'
import { INDICE_ABISSO, L_ABISSO } from '../dati/campagna.js'

// la 4: i cambiamenti invece delle cose intere, e niente roba (sta nell'avventura). Le soste di prima si buttano
export const VERSIONE = 4

// `visto`: si contano le lunghezze dei tratti (cominciando dagli spenti), non i 2600 zero/uno per cella:
// "120.30.8" vuol dire 120 celle mai viste, 30 viste, 8 no
export function stringaDi(visto) {
  const pezzi = []
  let quanti = 0, valore = 0
  for (let i = 0; i < visto.length; i++) {
    const v = visto[i] ? 1 : 0
    if (v === valore) { quanti++; continue }
    pezzi.push(quanti)
    valore = v
    quanti = 1
  }
  pezzi.push(quanti)
  return pezzi.join('.')
}

export function vistoDa(stringa, quante) {
  const visto = new Uint8Array(quante)
  if (!stringa) return visto
  let i = 0, valore = 0
  for (const p of stringa.split('.')) {
    const n = Number(p) || 0
    if (valore) for (let k = 0; k < n && i + k < quante; k++) visto[i + k] = 1
    i += n
    valore = valore ? 0 : 1
  }
  return visto
}

// quello che un mostro rifà da sé a ogni fotogramma: riparte dalla cella dove stava
const DI_PASSAGGIO = new Set(['fx', 'fy', 'calmo', 'sveglio', 'detto', 'casa'])
const pulita = r => Object.fromEntries(Object.entries(r).filter(([k]) => !DI_PASSAGGIO.has(k)))
const diverso = (a, b) => a !== b && JSON.stringify(a) !== JSON.stringify(b)

// le cose del piano rispetto a come sono nate dal seme (`nate`, Corsa.robeDelSeme): per indice i campi che
// sono cambiati, e in fondo quelle che non c'erano. `n` dice quante ne nascono: se il generatore cambia, non torna
export function cambiDelPiano(robe, nate) {
  const cambi = {}
  nate.forEach((n, i) => {
    const d = {}
    for (const [k, v] of Object.entries(robe[i])) if (!DI_PASSAGGIO.has(k) && diverso(v, n[k])) d[k] = v
    if (Object.keys(d).length) cambi[i] = d
  })
  return { n: nate.length, cambi, nuove: robe.slice(nate.length).map(pulita) }
}

const centesimi = v => Math.round(v * 100) / 100

// `tappa` è l'indice nella campagna (l'abisso è −1, INDICE_ABISSO). Una discesa finita non si salva, tranne
// l'abisso: là non finisce mai, finisce solo la sera, e chi vuole scriverlo comunque lo chiede per nome
// (`anchePerFinite`)
export function scrivi(corsa, tappa, { anchePerFinite = false } = {}) {
  if (!corsa || (corsa.finita && !anchePerFinite)) return null
  return {
    v: VERSIONE,
    tappa,
    seme: corsa.seme,
    piano: corsa.piano,
    eroe: corsa.chiEro,
    vita: corsa.vita,
    vitaBase: corsa.vitaBase,
    chiave: corsa.chiaveDelPiano,
    // il punto esatto, anche a metà di un passo
    dove: { x: centesimi(corsa.eroe.x), y: centesimi(corsa.eroe.y) },
    guarda: corsa.guarda,
    visto: stringaDi(corsa.visto),
    stanze: [...corsa.stanzeDentro],
    conti: {
      domande: corsa.domande, giuste: corsa.giuste, mostri: corsa.mostriBattuti, tesori: corsa.tesori,
      stanzeViste: corsa.stanzeViste, piani: corsa.pianiFatti,
      svenimenti: corsa.svenimenti, chieste: corsa.contaChieste,
      qui: corsa.svenimentiQui,   // spese su QUESTO piano (solo l'abisso)
    },
    robe: cambiDelPiano(corsa.livello.robe, corsa.robeDelSeme),
  }
}

// torna una Corsa pronta a giocare, o null se il salvataggio non si può leggere. `roba`: quella dell'avventura
// (cfg.avventure[eroe].roba), che sopra può essere cambiata dai mercanti
export function leggi(dato, tappa, roba = null) {
  if (!dato || dato.v !== VERSIONE || !dato.robe || !dato.dove || typeof dato.eroe !== 'string') return null
  try {
    // la roba si indossa dopo, sul piano già rimesso: quello che la classe non porta può finire per terra
    const corsa = new Corsa(tappa, { seme: dato.seme, eroe: dato.eroe })
    corsa.piano = dato.piano || 0
    corsa.nuovoPiano()   // lo stesso piano di allora, dal seme

    const robe = corsa.livello.robe
    if (robe.length !== dato.robe.n) return null   // il piano non nasce più uguale: un altro generatore
    for (const [i, d] of Object.entries(dato.robe.cambi || {})) {
      if (!robe[i]) return null
      Object.assign(robe[i], d)
    }
    for (const r of dato.robe.nuove || []) robe.push({ ...r })
    // i mostri ripartono dalla cella dove stavano, con la casa di sempre e qualche secondo di calma: riaprire
    // con l'orco addosso e un colpo già partito fa pentire di aver ripreso
    robe.forEach((m, i) => {
      if (m.che !== 'mostro' || m.morto) return
      const nato = corsa.robeDelSeme[i] || m
      m.casa = { x: nato.x, y: nato.y }
      m.fx = m.x + 0.5; m.fy = m.y + 0.5
      m.calmo = CALMA
    })

    if (roba) corsa.indossa(roba)
    corsa.vitaBase = dato.vitaBase
    corsa.vita = dato.vita
    corsa.chiaveDelPiano = !!dato.chiave
    corsa.eroe = { x: dato.dove.x, y: dato.dove.y }
    corsa.guarda = dato.guarda || 'dx'
    corsa.visto = vistoDa(dato.visto, corsa.livello.largo * corsa.livello.alto)
    corsa.stanzeDentro = new Set(dato.stanze || [])

    const c = dato.conti || {}
    corsa.domande = c.domande || 0
    corsa.giuste = c.giuste || 0
    corsa.mostriBattuti = c.mostri || 0
    corsa.tesori = c.tesori || 0
    corsa.stanzeViste = c.stanzeViste || 0
    corsa.pianiFatti = c.piani || 0
    corsa.svenimenti = c.svenimenti || 0
    corsa.svenimentiQui = c.qui || 0
    corsa.contaChieste = c.chieste || 0

    corsa.aggiornaLuce()
    corsa.segnaLaStanza()   // riprendere non è entrare in una stanza, o il primo passo consumerebbe torcia
    corsa.sistemaIlCorredo()
    return corsa
  } catch (e) {
    return null   // un salvataggio storto non porta giù il gioco: si ricomincia
  }
}

// due righe per la carta "riprendi" e per il portale di sopra: cosa si sta lasciando in sospeso
export function dice(dato, campagna) {
  if (!dato || dato.v !== VERSIONE) return null
  // l'abisso non sta nella campagna: senza questa riga la carta "riprendi" sparirebbe in silenzio
  const t = dato.tappa === INDICE_ABISSO ? L_ABISSO : campagna[dato.tappa]
  if (!t) return null
  return {
    tappa: dato.tappa,
    chiave: t.abisso ? 'abisso' : t.chiave,
    nome: t.nome,
    icona: t.icona,
    piano: (dato.piano || 0) + 1,
    piani: t.abisso ? null : t.piani,   // l'abisso non lo sa: "piano 23" invece di "piano 23 di …"
    eroe: typeof dato.eroe === 'string' ? dato.eroe : null,
    vita: dato.vita,
  }
}
