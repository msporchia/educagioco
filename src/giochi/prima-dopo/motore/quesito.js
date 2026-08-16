/* ═══════════════════════════════════════════════════════════════════
   IL QUESITO — una storia diventa una domanda

   Sei modi diversi di chiedere «cosa viene prima, cosa viene dopo» a
   partire dagli stessi due ingredienti: una storia (`dati/storie.js`)
   e un verbo (`dati/verbi.js`). Qui non c'è DOM, non c'è Vue — solo lo
   stato di una domanda, con `tocca()` che la fa avanzare, esattamente
   come `motore/partita.js` del Codice Segreto fa con `posa()`.

   Tre forme, tre classi:
     QuesitoOrdina    le vignette sparse, da posare buca per buca
     QuesitoScelta    manca / dopo / prima: si sceglie fra tre
     QuesitoIntruso   quattro vignette in fila, una non c'entra

   Tutte e tre parlano la stessa lingua verso fuori — `tipo`, `verbo`,
   `storia`, `finita`, `esito`, `tocca(id)` — così `viste/Storia.vue` e
   il banco di prova possono trattarle quasi allo stesso modo, e solo il
   disegno cambia da un tipo all'altro.

   Il caso si passa da fuori (`rnd`), o il banco di prova non potrebbe
   rifare la stessa domanda due volte per misurarla.
   ═══════════════════════════════════════════════════════════════════ */

function mescola(lista, rnd) {
  const a = lista.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* Le vignette sparse non devono mai arrivare già in ordine: sarebbe un
   regalo, e un bambino che le tocca nell'ordine in cui le vede
   vincerebbe senza aver ragionato. */
function mescolaSenzaOrdine(lista, rnd) {
  if (lista.length < 2) return lista.slice()
  let a = mescola(lista, rnd)
  let tentativi = 0
  while (a.every((v, i) => v.id === i) && tentativi++ < 30) a = mescola(lista, rnd)
  return a
}

/* I distrattori vengono da altre storie idonee alla stessa tappa (di
   solito la stessa categoria, o poche categorie vicine): un passo preso
   da un mondo lontanissimo si riconosce troppo facilmente, uno preso
   dalla storia giusta sarebbe anche lui giusto. Si esclude perciò ogni
   emoji che compare nella storia in corso, ovunque essa stia. */
function distrattori(storia, pool, quanti, rnd) {
  const evita = new Set(storia.passi)
  const prendi = liste => [...new Set(liste.flatMap(s => s.passi).filter(e => !evita.has(e)))]

  /* ── E DELLA STESSA FAMIGLIA ──
     Da quando esistono le storie disegnate (`disegnata: true`) un
     distrattore va cercato prima fra le storie fatte come quella in
     corso. Non è un vezzo estetico: in una fila di tre vignette
     disegnate, un'emoji si riconosce **per come è fatta** invece che
     per quello che racconta, e la domanda smette di essere «cosa viene
     dopo» per diventare «quale non è un disegno». Se non ce ne sono
     abbastanza si completa con quello che c'è — una domanda un po'
     meno pulita è meglio di una domanda che non si può fare. */
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

  /* Le vignette non ancora nella striscia, nell'ordine sparso in cui
     sono nate: è quello che la scena mostra nella zona di pesca. */
  get vignetteLibere() { return this.sparse.filter(v => !this.posate.includes(v.id)) }

  /* Si tocca una vignetta: se è già in una buca torna su, altrimenti va
     nella prima buca libera. Niente trascinamento — è tutto il gesto
     che un bambino di quattro anni deve imparare. Quando la striscia si
     riempie la consegna è automatica: non c'è un tasto in più da capire. */
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
}

export class QuesitoScelta {
  constructor(storia, verboDef, pool, rnd = Math.random) {
    this.tipo = 'scegli'
    this.verbo = verboDef.chiave                    // 'manca' | 'dopo' | 'prima'
    this.storia = storia
    const passi = storia.passi

    /* cosa si vede: sempre tre posizioni, una delle quali è un buco.
       Le storie più lunghe non mostrano tutti i loro passi: bastano tre
       tappe per chiedere «cosa viene dopo/prima/nel mezzo». */
    if (this.verbo === 'manca') {
      const meta = 1 + Math.floor(rnd() * (passi.length - 2))   // un indice in mezzo
      this.corretta = passi[meta]
      this.mostrati = [passi[0], null, passi[passi.length - 1]]
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
}

/* La sola porta d'ingresso: chi chiama non deve sapere quale delle tre
   classi sta ricevendo, solo che verboDef.tipo lo decide. `pool` sono
   le altre storie idonee alla stessa tappa — la fonte dei distrattori. */
export function generaQuesito(verboDef, storia, pool, rnd = Math.random) {
  if (verboDef.tipo === 'ordina') return new QuesitoOrdina(storia, verboDef, rnd)
  if (verboDef.tipo === 'scegli') return new QuesitoScelta(storia, verboDef, pool, rnd)
  if (verboDef.tipo === 'intruso') return new QuesitoIntruso(storia, pool, rnd)
  throw new Error(`prima e dopo: verbo "${verboDef.chiave}" sconosciuto`)
}
