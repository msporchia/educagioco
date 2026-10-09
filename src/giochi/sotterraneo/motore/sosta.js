// La discesa lasciata a metà, e come: dal portale (sopra c'è il gemello) o con la ✕ (si riprende giù) — vedi
// docs/sotterraneo/portale-e-sosta.md. Il piano non si salva, si rifà dal seme; si salva quello che è cambiato, cosa per cosa, rispetto al
// piano appena nato, più le cose nuove (bottino, roba buttata). Si riprende nel punto esatto, coi mostri dove
// erano. La roba dell'avventuriero sta nell'avventura, non qui. Se la forma cambia (VERSIONE sale) un
// salvataggio vecchio non si legge più: si ricomincia — un campo che non torna è un gioco rotto.
import { Corsa } from './corsa.js'
import { CALMA } from '../dati/mondo.js'
import { INDICE_ABISSO, L_ABISSO } from '../dati/campagna.js'
import { zonaPotenziata } from '../dati/zone.js'

// la 6: la vita in più della discesa (`vitaPiu`) al posto di quella intera (`vitaBase`), da quando l'eroe ha i livelli.
// La 5: ogni piano ha la scala che sale (una cosa in più nel piano: gli indici delle cose di una sosta di prima non
// tornerebbero). Prima, la 4: i cambiamenti invece delle cose intere, e niente roba (sta nell'avventura)
export const VERSIONE = 6

// quanti piani lasciati alle spalle si salvano (i più vicini a quello di adesso): le sette discese stanno tutte,
// l'abisso al piano 30 no, e quelli più su si rifanno dal seme quando ci si torna (docs/sotterraneo/scala-che-sale.md)
export const PIANI_ALLE_SPALLE = 8

// Come si è lasciata la discesa (docs/sotterraneo/portale-e-sosta.md, «Il portale e l'uscita»): 'portale' vuol dire salita
// dal portale vero (o risalita per stasera dall'abisso): sopra c'è il gemello, si fanno le spese e si torna giù da
// lui. 'uscita' è la ✕ o il telefono posato: nessun gemello, e rientrando nel sotterraneo si riprende giù, nel punto
// esatto, senza passare dalla terra di sopra. Una sosta senza `via` (quelle di prima) vale come uscita; un campo che
// non si conosce pure, perché è il caso che non regala una strada per tornare su
export const PORTALE = 'portale', USCITA = 'uscita'
export const viaDi = dato => (dato && dato.via === PORTALE ? PORTALE : USCITA)

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

// i mostri ripartono dalla cella dove stavano, con la casa di sempre e qualche secondo di calma: riaprire
// con l'orco addosso e un colpo già partito fa pentire di aver ripreso
function rimettiIMostri(robe, nate) {
  robe.forEach((m, i) => {
    if (m.che !== 'mostro' || m.morto) return
    const nato = nate[i] || m
    m.casa = { x: nato.x, y: nato.y }
    m.fx = m.x + 0.5; m.fy = m.y + 0.5
    m.calmo = CALMA
  })
}

// i piani lasciati (Corsa.piani) come differenza dal seme, ognuno col suo piano, la mappa girata e se la scala era aperta
function pianiAlleSpalle(corsa) {
  return [...corsa.piani.entries()]
    .sort((a, b) => Math.abs(a[0] - corsa.piano) - Math.abs(b[0] - corsa.piano))
    .slice(0, PIANI_ALLE_SPALLE)
    .sort((a, b) => a[0] - b[0])
    .map(([p, r]) => ({ p, robe: cambiDelPiano(r.livello.robe, r.robeDelSeme), visto: stringaDi(r.visto),
                        stanze: [...r.stanzeDentro], chiave: r.chiave }))
}

// `tappa` è l'indice nella campagna (l'abisso è −1, INDICE_ABISSO); `potenza` il livello di una zona potenziata
// (dati/zone.js), che rientrando si rifà uguale. Una discesa finita non si salva, tranne
// l'abisso: là non finisce mai, finisce solo la sera, e chi vuole scriverlo comunque lo chiede per nome
// (`anchePerFinite`)
export function scrivi(corsa, tappa, { anchePerFinite = false, via = USCITA } = {}) {
  if (!corsa || (corsa.finita && !anchePerFinite)) return null
  return {
    v: VERSIONE,
    via: via === PORTALE ? PORTALE : USCITA,
    tappa,
    ...(corsa.tappa && corsa.tappa.potenza ? { potenza: corsa.tappa.potenza } : {}),
    seme: corsa.seme,
    piano: corsa.piano,
    fondo: corsa.fondo,   // il più profondo toccato: scendere ancora è nuovo, rifare un piano no
    eroe: corsa.chiEro,
    vita: corsa.vita,
    vitaPiu: corsa.vitaPiu,
    energia: corsa.energia,   // l'energia delle abilità (docs/sotterraneo/abilita.md); senza, si riprende piena
    ...(corsa.fiatoUsato ? { fiato: true } : {}),
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
    // quelli di prima, che si può risalire a ritrovare: tolti se la discesa non ne ha lasciato nessuno
    ...(corsa.piani.size ? { dietro: pianiAlleSpalle(corsa) } : {}),
    missioni: [...corsa.missioniFatte],   // quelle fatte giù e non ancora portate su
  }
}

// torna una Corsa pronta a giocare, o null se il salvataggio non si può leggere. `roba`: quella dell'avventura
// (cfg.avventure[eroe].roba), che sopra può essere cambiata dai mercanti; `missioni`: quelle prese adesso per
// questa discesa (una presa sopra, passando dal portale, compare nel suo piano)
export function leggi(dato, tappa, roba = null, missioni = [], crescita = null) {
  if (!dato || dato.v !== VERSIONE || !dato.robe || !dato.dove || typeof dato.eroe !== 'string') return null
  try {
    // la roba si indossa dopo, sul piano già rimesso: quello che la classe non porta può finire per terra
    const corsa = new Corsa(tappa, { seme: dato.seme, eroe: dato.eroe, missioni, crescita })
    corsa.piano = dato.piano || 0
    corsa.nuovoPiano()   // lo stesso piano di allora, dal seme

    const robe = corsa.livello.robe
    if (robe.length !== dato.robe.n) return null   // il piano non nasce più uguale: un altro generatore
    for (const [i, d] of Object.entries(dato.robe.cambi || {})) {
      if (!robe[i]) return null
      Object.assign(robe[i], d)
    }
    for (const r of dato.robe.nuove || []) robe.push({ ...r })
    rimettiIMostri(robe, corsa.robeDelSeme)
    corsa.fondo = Math.max(corsa.piano, Number.isFinite(dato.fondo) ? dato.fondo : 0)
    // i piani alle spalle: un piano che non nasce più uguale non si ricorda, si rifà dal seme quando ci si torna
    for (const d of Array.isArray(dato.dietro) ? dato.dietro : []) {
      const livello = corsa.faiIlPiano(d.p)
      if (!d.robe || livello.robe.length !== d.robe.n) continue
      const nate = livello.robe.map(r => ({ ...r }))
      for (const [i, c] of Object.entries(d.robe.cambi || {})) if (livello.robe[i]) Object.assign(livello.robe[i], c)
      for (const r of d.robe.nuove || []) livello.robe.push({ ...r })
      rimettiIMostri(livello.robe, nate)
      corsa.piani.set(d.p, { livello, robeDelSeme: nate, visto: vistoDa(d.visto, livello.largo * livello.alto),
                             stanzeDentro: new Set(d.stanze || []), chiave: !!d.chiave })
    }

    if (roba) corsa.indossa(roba)
    corsa.vitaPiu = Number.isFinite(dato.vitaPiu) ? dato.vitaPiu : 0
    corsa.vita = dato.vita
    corsa.energia = Number.isFinite(dato.energia) ? Math.max(0, Math.min(corsa.energiaMax, dato.energia)) : corsa.energiaMax
    corsa.fiatoUsato = !!dato.fiato
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
    corsa.missioniFatte = new Set(Array.isArray(dato.missioni) ? dato.missioni : [])
    corsa.posaLeMissioni()

    corsa.aggiornaLuce()
    corsa.segnaLaStanza()   // riprendere non è entrare in una stanza, o il primo passo consumerebbe torcia
    corsa.sistemaIlCorredo()
    return corsa
  } catch (e) {
    return null   // un salvataggio storto non porta giù il gioco: si ricomincia
  }
}

// due righe per la carta "riprendi" e per il portale di sopra: cosa si sta lasciando in sospeso, e come (`via`)
export function dice(dato, campagna) {
  if (!dato || dato.v !== VERSIONE) return null
  // l'abisso non sta nella campagna: senza questa riga la carta "riprendi" sparirebbe in silenzio
  const t = dato.tappa === INDICE_ABISSO ? L_ABISSO
    : dato.potenza && campagna[dato.tappa] ? zonaPotenziata(dato.tappa, dato.potenza) : campagna[dato.tappa]
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
    via: viaDi(dato),
    potenza: t.potenza || null,
  }
}
