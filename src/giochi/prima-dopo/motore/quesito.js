// Una storia diventa una domanda: sei modi diversi di chiedere «cosa
// viene prima, cosa viene dopo» a partire da una storia e un verbo.
// Nessun DOM, nessun Vue — solo lo stato di una domanda, con `tocca()`
// che la fa avanzare, come `motore/partita.js` del Codice Segreto con
// `posa()`. Tre forme, tre classi (QuesitoOrdina, QuesitoScelta,
// QuesitoIntruso), tutte con la stessa lingua verso fuori: `tipo`,
// `verbo`, `storia`, `finita`, `esito`, `tocca(id)`.

function mescola(lista, rnd) {
  const a = lista.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Le vignette sparse non devono mai arrivare già in ordine: sarebbe un
// regalo, si vincerebbe senza aver ragionato.
function mescolaSenzaOrdine(lista, rnd) {
  if (lista.length < 2) return lista.slice()
  let a = mescola(lista, rnd)
  let tentativi = 0
  while (a.every((v, i) => v.id === i) && tentativi++ < 30) a = mescola(lista, rnd)
  return a
}

// I distrattori vengono da altre storie idonee alla stessa tappa,
// escludendo ogni emoji che compare già nella storia in corso.
function distrattori(storia, pool, quanti, rnd) {
  const evita = new Set(storia.passi)
  const prendi = liste => [...new Set(liste.flatMap(s => s.passi).filter(e => !evita.has(e)))]

  // prima della stessa famiglia (disegnata o a emoji): in una fila di
  // vignette disegnate un'emoji si riconoscerebbe per come è fatta
  // invece che per quello che racconta. Se non bastano si completa col
  // resto — una domanda meno pulita è meglio di una che non si può fare.
  const stessaFamiglia = pool.filter(s => !!s.disegnata === !!storia.disegnata)
  const scelti = mescola(prendi(stessaFamiglia), rnd).slice(0, quanti)
  if (scelti.length >= quanti) return scelti

  const resto = mescola(prendi(pool).filter(e => !scelti.includes(e)), rnd)
  return scelti.concat(resto.slice(0, quanti - scelti.length))
}

export class QuesitoOrdina {
  constructor(storia, verboDef, rnd = Math.random) {
    this.tipo = 'ordina'
    this.verbo = verboDef.chiave
    this.storia = storia
    this.sequenza = storia.passi.slice(0, verboDef.n)          // la fila corretta
    this.sparse = mescolaSenzaOrdine(
      this.sequenza.map((emoji, id) => ({ id, emoji })), rnd)
    this.posate = Array(this.sequenza.length).fill(null)       // id nella buca i, o null
    this.esito = null                                          // null | 'giusta' | 'sbagliata'
  }

  get piena() { return this.posate.every(x => x !== null) }
  get finita() { return this.esito !== null }
  get vignetteLibere() { return this.sparse.filter(v => !this.posate.includes(v.id)) }

  // Niente trascinamento: si tocca e va nella prima buca libera, o torna
  // su se era già posata. Piena la striscia, la consegna è automatica.
  tocca(id) {
    if (this.finita) return false
    const dove = this.posate.indexOf(id)
    if (dove >= 0) { this.posate[dove] = null; return 'tolta' }
    const buca = this.posate.indexOf(null)
    if (buca < 0) return false
    this.posate[buca] = id
    if (this.piena) this.esito = this.posate.every((v, i) => v === i) ? 'giusta' : 'sbagliata'
    return 'posata'
  }

  // il tasto «salta» dei grandi (docs/core/comandi.md): la fila giusta, senza che nessuno l'abbia fatta
  risolvi() {
    if (this.finita) return false
    this.posate = this.sequenza.map((_, i) => i)
    this.esito = 'giusta'
    return true
  }
}

export class QuesitoScelta {
  constructor(storia, verboDef, pool, rnd = Math.random) {
    this.tipo = 'scegli'
    this.verbo = verboDef.chiave                    // 'manca' | 'dopo' | 'prima'
    this.storia = storia
    const passi = storia.passi

    // sempre tre posizioni contigue, una delle quali è il buco: una
    // finestra non contigua (primo, ultimo, un passo qualunque in mezzo)
    // farebbe vedere, nella spiegazione, una fila che nella storia non esiste
    if (this.verbo === 'manca') {
      const da = Math.floor(rnd() * (passi.length - 2))
      this.corretta = passi[da + 1]
      this.mostrati = [passi[da], null, passi[da + 2]]
    } else if (this.verbo === 'dopo') {
      this.corretta = passi[2]
      this.mostrati = [passi[0], passi[1], null]
    } else { // 'prima'
      this.corretta = passi[passi.length - 3]
      this.mostrati = [null, passi[passi.length - 2], passi[passi.length - 1]]
    }

    const altre = distrattori(storia, pool, 2, rnd)
    this.opzioni = mescola(
      [{ emoji: this.corretta, giusta: true }, ...altre.map(emoji => ({ emoji, giusta: false }))],
      rnd)
    this.scelta = null
    this.esito = null
  }

  get finita() { return this.esito !== null }

  tocca(emoji) {
    if (this.finita) return false
    this.scelta = emoji
    const opzione = this.opzioni.find(o => o.emoji === emoji)
    this.esito = opzione?.giusta ? 'giusta' : 'sbagliata'
    return this.esito
  }

  // il tasto «salta» dei grandi: vedi QuesitoOrdina.risolvi
  risolvi() {
    if (this.finita) return false
    this.scelta = this.corretta
    this.esito = 'giusta'
    return true
  }
}

export class QuesitoIntruso {
  constructor(storia, pool, rnd = Math.random) {
    this.tipo = 'intruso'
    this.verbo = 'intruso'
    this.storia = storia
    const veri = storia.passi.slice(0, 4)
    const [intruso] = distrattori(storia, pool, 1, rnd)
    const posizione = Math.floor(rnd() * veri.length)
    this.vignette = veri.map((emoji, id) => ({
      id, emoji: id === posizione ? intruso : emoji, intruso: id === posizione,
    }))
    this.scelta = null
    this.esito = null
  }

  get finita() { return this.esito !== null }

  tocca(id) {
    if (this.finita) return false
    this.scelta = id
    const vignetta = this.vignette.find(v => v.id === id)
    this.esito = vignetta?.intruso ? 'giusta' : 'sbagliata'
    return this.esito
  }

  // il tasto «salta» dei grandi: vedi QuesitoOrdina.risolvi
  risolvi() {
    if (this.finita) return false
    this.scelta = this.vignette.find(v => v.intruso).id
    this.esito = 'giusta'
    return true
  }
}

// La spiegazione: cosa far vedere quando si è sbagliato. Sta qui e non
// nella vista perché è una regola (qual è la fila vera, dove stava la
// domanda, cosa ha risposto il bambino), non un disegno. Torna sempre
// una fila vera e contigua della storia, mai una fila di comodo.
//   titolo    il nome della storia, per chi legge ad alta voce
//   passi     la fila giusta, in ordine
//   esatti    per «ordina»: quali posizioni erano al posto giusto
//   buco      per «manca/dopo/prima»: l'indice di quello che si chiedeva
//   scelta    il passo sbagliato che è stato toccato, se ce n'è uno
//   intruso   per «intruso»: la vignetta che non c'entrava
export function spiegazione(q) {
  const base = { titolo: q.storia.nome, passi: [], esatti: null, buco: null,
                 scelta: null, intruso: null }

  if (q.tipo === 'ordina') return { ...base,
    passi: q.sequenza,
    esatti: q.posate.map((id, i) => id === i) }

  if (q.tipo === 'intruso') {
    const sbagliata = q.vignette.find(v => v.id === q.scelta)
    return { ...base,
      passi: q.storia.passi.slice(0, q.vignette.length),
      intruso: q.vignette.find(v => v.intruso)?.emoji ?? null,
      scelta: sbagliata && !sbagliata.intruso ? sbagliata.emoji : null }
  }

  return { ...base,
    passi: q.mostrati.map(e => e ?? q.corretta),
    buco: q.mostrati.indexOf(null),
    scelta: q.scelta && q.scelta !== q.corretta ? q.scelta : null }
}

// La sola porta d'ingresso: `pool` sono le altre storie idonee alla
// stessa tappa, la fonte dei distrattori.
export function generaQuesito(verboDef, storia, pool, rnd = Math.random) {
  if (verboDef.tipo === 'ordina') return new QuesitoOrdina(storia, verboDef, rnd)
  if (verboDef.tipo === 'scegli') return new QuesitoScelta(storia, verboDef, pool, rnd)
  if (verboDef.tipo === 'intruso') return new QuesitoIntruso(storia, pool, rnd)
  throw new Error(`prima e dopo: verbo "${verboDef.chiave}" sconosciuto`)
}
