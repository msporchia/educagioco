/* ═══════════════════════════════════════════════════════════════════
   LE IMPALCATURE — un mondo finto per provare una cosa alla volta

   Provare `Vai` costruendo un livello vero, leggendo una mappa ASCII e
   facendo girare una partita è un cane che si morde la coda: se il test
   diventa rosso non si sa se ha sbagliato `Vai`, la BFS, il campo o il
   livello. E soprattutto non si può provare `Prendi` finché non esiste
   `Oggetto`, né `Apri` finché non esiste `Porta`.

   Qui il mondo è finto, e ogni cosa risponde quello che le si dice di
   rispondere. Un test dura microsecondi, fallisce per una ragione sola,
   e si scrive prima che il pezzo accanto esista.

   ── COSA RESTA VERO ──
   Le azioni, le domande, i raggi, i messaggi: quelli sono i pezzi in
   prova, e non si fingono mai. Si finge tutto quello che sta INTORNO.
   Giocare le partite vere resta il lavoro del banco dei livelli
   (`aiuto/livello.mjs`), ed è un di più che dice un'altra cosa: che i
   pezzi montati insieme fanno un gioco.
   ═══════════════════════════════════════════════════════════════════ */
import { Contesto } from '../../src/motore/generale/contesto.js'

/* ── UN CAMPO FINTO ──
   Una stanza rettangolare vuota, con i muri dove li metti. Basta a far
   camminare qualcuno e a chiudergli una strada. */
export function campoFinto ({ larghezza = 9, altezza = 5, muri = [] } = {}) {
  const celle = []
  for (let y = 0; y < altezza; y++) {
    const riga = []
    for (let x = 0; x < larghezza; x++)
      riga.push({ muro: muri.some(m => m.x === x && m.y === y), porta: null })
    celle.push(riga)
  }
  return { w: larghezza, h: altezza, celle }
}

/* ── UNA COSA FINTA ──
   Risponde quello che le hai detto di rispondere. `risposte` è una
   tabella comando → esito (o funzione), e `sentite` raccoglie quello
   che le è stato detto, così un test può controllare che il verbo abbia
   consegnato il comando giusto. */
export function cosaFinta ({ id = 'cosa', nome = 'la cosa', tipo = 'oggetto',
                             x = 0, y = 0, risposte = {}, stato = {} } = {}) {
  return {
    id, nome, tipo, x, y, stato,
    sentite: [],
    dove () { return { x: this.x, y: this.y } },
    bordi () {
      return [{ x: this.x + 1, y: this.y }, { x: this.x - 1, y: this.y },
              { x: this.x, y: this.y + 1 }, { x: this.x, y: this.y - 1 }]
    },
    chiedi (q) { return this.stato[q] ?? null },
    ricevi (comando, chi) {
      this.sentite.push({ comando, chi: chi && chi.id })
      const r = risposte[comando]
      return typeof r === 'function' ? r(chi, this) : (r ?? null)
    },
  }
}

/* ── UN CARTELLINO ──
   Non tutte le cose che si nominano sono cose del campo: un'unità, una
   schiera, un segnale hanno un nome e un tipo e basta. Non rispondono a
   `dove()` — dove sta un'unità lo sa il mondo, non l'unità nominata. */
export const cartellino = (id, tipo, nome) => ({ id, tipo, nome: nome || id, em: '❓' })

/* ── QUALCUNO CHE CAMMINA ──
   L'`Unita` vera è troppo grossa per i test dei verbi (si porta dietro
   arma, raggi, fili). Qui c'è il minimo che un'azione le chiede. */
export function chiFinto ({ id = 'eroe', nome = "l'eroe", x = 0, y = 0,
                            fazione = 'nostri', vede = () => true,
                            danno = 1, colpisce = () => true, zaino = [] } = {}) {
  return {
    id, nome, fazione, x, y, dir: 2, zaino, danno,
    emoji: '🙂', inPiedi: true, ordineOra: null, attesa: null, visti: {},
    get comeSiChiama () { return this.nome },
    eInPiedi () { return this.inPiedi },
    vede (mondo, altro) { return vede(mondo, altro) },
    ricorda (z) { this.visti[z.id] = { x: z.x, y: z.y } },
    ricordoDi (...chiavi) {
      for (const k of chiavi) if (k && this.visti[k]) return this.visti[k]
      return null
    },
    ha (id) { return this.zaino.includes(id) },
    metteInZaino (id) { if (!this.ha(id)) this.zaino.push(id) },
    togliDaZaino (id) { const k = this.zaino.indexOf(id); if (k >= 0) this.zaino.splice(k, 1) },
    puoiColpire (mondo, preda) { return colpisce(mondo, preda) },
    subisci (quanto) {
      this.vita = (this.vita ?? 3) - quanto
      const mortale = this.vita <= 0
      if (mortale) this.inPiedi = false
      return { mortale, vita: Math.max(0, this.vita), vitaMax: 3, a: this.id }
    },
    mettiInAscolto (segnale, fila, come) { this.ascolti = [...(this.ascolti || []), { segnale, fila, come }] },
  }
}

/* ── UN REGISTRO CHE NON SCRIVE NIENTE, MA RICORDA TUTTO ──
   Un test non guarda la formattazione di una riga: guarda **che una
   riga ci sia**, e con che esito. */
export function registroFinto () {
  return {
    righe: [],
    scrivi (esito, penso, siVede) { this.righe.push({ esito, penso, siVede }) },
    fatto (c, a, penso, siVede) { this.scrivi('fa', penso, siVede) },
    aspetta (c, a, penso) { this.scrivi('aspetto', penso, 'resta fermo') },
    nonSiPuo (c, a, penso, siVede) { this.scrivi('no', penso, siVede) },
    siFerma (c, a, penso) { this.scrivi('no', penso, 'si ferma') },
    posto () { return { filo: 'prova', i: 0, ramo: null, j: null } },
    /* le comodità che usano i test */
    get ultima () { return this.righe[this.righe.length - 1] || null },
    get detto () { return this.righe.map(r => r.penso) },
    ha (pezzo) { return this.righe.some(r => (r.penso || '').includes(pezzo)) },
  }
}

/* ── UN MONDO FINTO ──
   Espone solo quello che le azioni gli chiedono davvero, ed è un elenco
   corto: è la prova che il confine fra un'azione e il mondo è stretto. */
export function mondoFinto ({ cose = [], campo = campoFinto(), unita = [], vistaAlBuio = Infinity } = {}) {
  const registro = {}
  cose.forEach(c => { registro[c.id] = c })
  const perId = {}
  unita.forEach(u => { perId[u.id] = u })
  return {
    ...campo,
    cose: registro,
    perId,
    unita,
    mia: 'nostri',
    versioneMappa: 0,
    porte: {},
    eventi: [], colpi: [], allarmi: [], pendenti: [], segnaliMandati: [],
    routine: {},
    /* il tetto sulla vista (`mondo.js`, `Mondo.vistaAlBuio`): di
       default INFINITO, come nel mondo vero, e un test lo passa solo
       quando vuole provare il buio davvero */
    vistaAlBuio,
    /* è illuminata questa cosa? Si chiede a ogni cosa in `cose` se sa
       fare luce (`luce(mondo)`, oggi solo `Lanterna`), come il mondo
       vero — qui non serve fingere: la domanda stessa e chi la
       implementa sono i pezzi in prova, non l'intorno. */
    illuminato (cosa) {
      if (!cosa || cosa.x == null) return false
      for (const k in registro) {
        const luce = typeof registro[k].luce === 'function' ? registro[k].luce(this) : null
        if (luce && luce.raggio.arriva(this, luce.da, cosa)) return true
      }
      return false
    },
    laCosa (id) {
      if (registro[id]) return registro[id]
      /* una casella libera è un bersaglio come gli altri, e il mondo
         vero la riconosce: se il finto non lo facesse, un `vai (5,4)`
         sembrerebbe rotto qui e funzionerebbe in partita */
      const q = /^(\d+),(\d+)$/.exec(id || '')
      if (!q) return null
      const x = +q[1], y = +q[2]
      if (x < 0 || y < 0 || x >= campo.w || y >= campo.h || campo.celle[y][x].muro) return null
      return { id, tipo: 'cella', nome: `la casella (${x},${y})`, em: '⬚', x, y }
    },
    vivi () { return unita.filter(u => u.eInPiedi()) },
    mio (id) { return !!perId[id] && perId[id].fazione === 'nostri' },
    nomeDi (id) { return (perId[id] && perId[id].nome) || id },
    dove (chi, cosa) {
      if (cosa && typeof cosa.dove === 'function') return cosa.dove(this)
      if (cosa && cosa.tipo === 'cella') return { x: cosa.x, y: cosa.y }
      if (cosa && perId[cosa.id]) return perId[cosa.id].eInPiedi() ? perId[cosa.id] : null
      if (cosa && cosa.tipo === 'fazione')
        return this.vivi().find(u => u.fazione === cosa.id && u !== chi) || null
      return null
    },
    dovePensiCheSia (chi, cosa) {
      const adesso = this.dove(chi, cosa)
      if (!adesso || !adesso.id || !perId[adesso.id]) return adesso ? { posto: adesso } : null
      if (chi.vede(this, adesso)) { chi.ricorda(adesso); return { posto: adesso } }
      const ricordo = chi.ricordoDi(adesso.id, cosa.id)
      return ricordo ? { posto: ricordo, ricordo: true } : null
    },
    faiRumore (chi, segnale) { this.pendenti.push({ tipo: 'rumore', segnale, da: chi.id }) },
    diciA (chi, segnale) { this.pendenti.push({ tipo: 'voce', segnale, da: chi.id }) },
    gridaSe () {},
    filaDellAzione (nome) { return this.routine[nome] || null },
  }
}

/* ── E IL CONTESTO CHE LE AZIONI RICEVONO ──
   Un test scrive `const q = banco({...})` e poi `azione.esegui(q.contesto)`. */
export function banco ({ cose = [], campo, unita = [], chi = chiFinto() } = {}) {
  const tutte = [...unita, chi]
  const mondo = mondoFinto({ cose, campo, unita: tutte })
  const registro = registroFinto()
  return { mondo, chi, registro, contesto: new Contesto(mondo, chi, registro, 'prova') }
}
