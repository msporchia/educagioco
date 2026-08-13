/* ═══════════════════════════════════════════════════════════════════
   MONDO — quello che c'è, e a chi arriva cosa

   Riceve una scena già montata (`allestimento.js`) e da lì in poi
   risponde a domande. Non costruisce niente: costruire è un altro
   tempo, e tenerli insieme voleva dire che per provare «questo rumore
   arriva fin lì» bisognava leggere una mappa ASCII.

   Tre mestieri, e non uno di più:

     LE COSE      cosa si chiama così, dov'è, dove credi che sia
     CHI C'È      chi è vivo, chi è tuo, come si chiama
     I MESSAGGI   li accoda, e basta — a chi arrivino lo sa il messaggio,
                  e se interessino lo sa chi li riceve

   ── IL MONDO NON TIENE UN ELENCO DI CHI ASCOLTA COSA ──
   Quello è roba del personaggio, come il suo piano. Qui si propaga e
   basta: è la ragione per cui un modo nuovo di comunicare è una classe
   in `messaggi/`, non un ramo in più dentro il battito.

   ── E NON SI FRUGA NEI SUOI REGISTRI ──
   Nessuna azione scrive `mondo.cose[id]`: si chiede `laCosa(id, chi)`.
   Sembra un dettaglio e non lo è — il giorno che una cosa non dovrà
   essere nominabile da tutti, la regola si scrive in quel metodo e non
   in dodici verbi che avevano imparato dove si guarda.
   ═══════════════════════════════════════════════════════════════════ */
import { allestisci } from './allestimento.js'
import { mappaDi } from './mappa.js'
import { VERBI, saFare, nonRiesce } from './vocabolario.js'
import { Rumore } from './messaggi/rumore.js'
import { Voce } from './messaggi/voce.js'
import { compilaFila } from './azioni/indice.js'

/* ── QUANTO LONTANO SI SENTE ──
   `voce` è il raggio in linea d'aria. Una parola detta a voce alta
   attraversa una stanza e mezza; un fracasso sveglia mezzo castello; un
   cigolio lo sente solo chi è dietro la porta. È la manopola che rende
   il rumore una cosa da *dosare* invece che un interruttore: aprire con
   la chiave o sfondare a spallate diventano due mosse diverse anche
   quando la porta si apre uguale. */
const VOCE_NORMALE = 20
export const SEGNALI = {
  nemico:  { nome: 'nemico in vista', em: '👁️', col: '#e0554d' },
  libero:  { nome: 'tutto libero',    em: '✅', col: '#3fb872' },
  aperta:  { nome: 'porta aperta',    em: '🚪', col: '#c9853f' },
  aiuto:   { nome: 'aiuto',           em: '🆘', col: '#e8703f', voce: 30 },
  ora:     { nome: 'al mio segnale',  em: '⭐', col: '#f0c04a' },
  viaLibera: { nome: 'via libera',   em: '⚔️', col: '#3fb872' },
  bottino: { nome: 'tesoro trovato',  em: '💰', col: '#b06be0' },
  chiave:  { nome: 'ho la chiave',    em: '🔑', col: '#4a86e8' },
  richiamo: { nome: 'un rumore',    em: '🔔', col: '#e8a33f' },
  fracasso: { nome: 'un fracasso',   em: '💥', col: '#e8703f', voce: 40 },
  cigolio: { nome: 'un cigolio',     em: '🚪', col: '#8b97b4', voce: 5 },
  /* la variante di `cigolio` per chi apre una porta a comando: stesso
     raggio (una porta lontana non deve poter avvertire), voce diversa —
     serve a chi ha PIÙ porte a congegno nella stessa scena e deve poter
     dire quale ha sentito senza vederla (`Porta.cigolio` in
     `elementi/porta.js`, e il perché in `domande/sentito.js`: la
     domanda che lo controlla oggi guarda solo SE un segnale è mai
     arrivato, non da dove). */
  scatto: { nome: 'uno scatto',      em: '⚙️', col: '#6b7a99', voce: 5 },
  tramontana: { nome: 'libero a tramontana', em: '⬆️', col: '#4a86e8' },
  mezzogiorno: { nome: 'libero a mezzogiorno', em: '⬇️', col: '#e8a33f' },
}
export const ilSegnale = k => SEGNALI[k] || { nome: k, em: '📣', col: '#8b97b4' }
export const segnaleDi = (m, k) => (m && m.vocabolario && m.vocabolario[k]) || ilSegnale(k)

const CASELLA = /^(\d+),(\d+)$/
/* `suona`, `parla` e `quando senti` sono i due capi dello stesso filo:
   da soli sul campo il filo non ha l'altro capo */
const SEGNALE = { suona: 1, quando: 1, parla: 1 }

export class Mondo {
  constructor (livello, variante) {
    Object.assign(this, allestisci(livello, variante))
    this.routine = {}
    this.azzeraPartita()
  }

  /* lo stato che dura una partita e non una scena */
  azzeraPartita () {
    this.passi = 0
    this.finita = false
    this.vinto = false
    this.motivo = ''
    this.colpevole = null
    this.segnaliMandati = []
    this.pendenti = []
    this.comandiPendenti = []
    this.eventi = []
    this.traccia = []
    this.colpi = []
    this.allarmi = []
    this.versioneMappa = 0
  }

  /* ═══════════ chi c'è ═══════════ */
  vivi () { return this.unita.filter(u => u.eInPiedi()) }
  /* Quanti dei SUOI sono rimasti sul campo. Non fa perdere la battaglia —
     a volte mandare avanti qualcuno è la mossa giusta — ma costa una
     stella, perché altrimenti l'esca sarebbe gratis e i personaggi
     diventerebbero pezzi di ricambio. */
  perdute () { return this.unita.filter(u => !u.eInPiedi() && u.fazione === this.mia).length }
  mio (id) { const u = this.perId[id]; return !!u && u.fazione === this.mia }
  nomeDi (id) { return (this.perId[id] && this.perId[id].comeSiChiama) || id }

  /* ═══════════ il buio e la luce ═══════════
     Il TETTO SULLA VISTA di questo livello: quanto lontano si vede
     anche senza nessuna luce. Un numero di celle, non un flag «è
     buio» — `Unita.limiteVista()` lo confronta con la propria `vista`
     e prende il più corto dei due (`Math.min`), esattamente come già
     succede per un muro in mezzo.

     ── PERCHÉ SUL LIVELLO, E NON SULL'AMBIENTE DI `grafica/ambienti/` ──
     Quell'ambiente dichiara già un `buio` — l'opacità del velo scuro
     disegnato sopra la scena, un numero fra 0 e 1 tarato a occhio per
     come si legge la stanza (`src/grafica/ambienti/cripta.js` e
     simili) — ma è un fatto del DISEGNO, non una regola di gioco: due
     stanze con la stessa oscurità a schermo possono chiedere due
     tetti di vista diversi, e il motore non deve importare
     `src/grafica/` per saperlo. Il tetto è quindi un dato del
     LIVELLO — `livello.vistaAlBuio`, in celle — con lo stesso spirito
     di `calcoli`/`cap` nel castello: un INPUT che chi scrive il
     livello dichiara apposta, non qualcosa derivato da un nome di
     stanza.

     ── E DI DEFAULT È INFINITO ──
     Un livello che non dichiara `vistaAlBuio` non ha nessun tetto: la
     vista resta quella che era sempre stata. È la condizione che
     rende sicuro questo lavoro — nessun livello di oggi lo dichiara,
     quindi nessuno cambia di un passo. */
  get vistaAlBuio () { return this.livello.vistaAlBuio ?? Infinity }

  /* ── È ILLUMINATA QUESTA COSA, ADESSO? ──
     Non un elenco di luci tenuto qui a mano: si chiede a OGNI cosa in
     `cose` se sa fare luce (`luce(mondo)` — oggi solo `Lanterna`,
     `elementi/lanterna.js`) e si guarda se il cerchio che risponde
     arriva fin qui. Una torcia a muro, domani, si aggiunge da sé,
     senza toccare questo metodo: lo stesso principio di `faccia()`. */
  illuminato (cosa) {
    if (!cosa || cosa.x == null) return false
    for (const k in this.cose) {
      const luce = typeof this.cose[k].luce === 'function' ? this.cose[k].luce(this) : null
      if (luce && luce.raggio.arriva(this, luce.da, cosa)) return true
    }
    return false
  }

  /* ═══════════ le cose ═══════════ */
  laCosa (id, chi) {
    const c = this.cose[id]
    if (c) return c
    /* una casella libera vale SEMPRE: se il dito può indicarla, l'ordine
       deve poterla dire. Prima serviva un `celle: true` nel livello, e il
       risultato era che l'interfaccia lasciava comporre «vai a 2,10» e
       poi il motore rispondeva «qui non c'è niente che si chiami così» —
       cioè dava torto a chi aveva fatto quello che gli era stato detto. */
    const q = CASELLA.exec(id || '')
    if (!q) return null
    const x = +q[1], y = +q[2]
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || this.celle[y][x].muro) return null
    /* ── SI CHIAMA COL SUO NUMERO ──
       Era «la casella (4,8)», e in una pastiglia larga quanto due dita
       diventava una riga di testo dove tutto il senso stava in fondo.
       Un punto sulla mappa non ha un nome: ha due numeri, e quelli sono
       tutto quello che c'è da leggere — anche nel registro, dove «vado
       a [4,8]» si scorre meglio di «vado a la casella (4,8)». */
    return { id, tipo: 'cella', nome: `[${x},${y}]`, em: '⬚', x, y }
  }

  /* dov'è una cosa ADESSO. Per una cosa del campo lo dice lei — la porta
     sta ferma, un oggetto preso segue chi lo tiene; restano qui i due
     casi che riguardano il campo intero. */
  dove (chi, cosa) {
    if (!cosa) return null
    if (typeof cosa.dove === 'function') return cosa.dove(this)
    if (cosa.tipo === 'cella') return { x: cosa.x, y: cosa.y }
    if (cosa.tipo === 'unita') {
      const u = this.perId[cosa.id]
      return u && u.eInPiedi() ? u : null
    }
    if (cosa.tipo === 'fazione') {
      const schiera = this.vivi().filter(z => z.fazione === cosa.id && z !== chi)
      if (!schiera.length) return null
      const passi = mappaDi(this, chi)
      schiera.sort((p, q) => passi[p.y * this.w + p.x] - passi[q.y * this.w + q.x])
      return schiera[0]
    }
    return null
  }

  /* ── DOVE CREDI CHE SIA ──
     Non «dov'è»: nessuno è onnisciente. Una cosa ferma la trovi dov'è;
     una che si muove solo se la vedi, e se non la vedi hai al massimo un
     RICORDO. Da qui viene che non si va da chi non si è mai incrociato,
     ed è il motivo per cui una ronda serve davvero. */
  dovePensiCheSia (chi, cosa) {
    const adesso = this.dove(chi, cosa)
    if (!adesso || !adesso.id || !this.perId[adesso.id])
      return adesso ? { posto: adesso } : null
    if (chi.vede(this, adesso)) { chi.ricorda(adesso); return { posto: adesso } }
    const ricordo = chi.ricordoDi(adesso.id, cosa.id)
    return ricordo ? { posto: ricordo, ricordo: true } : null
  }

  /* ── LE AZIONI CHE HA SCRITTO CHI GIOCA ──
     Un posto, una porta, un segnale esistono prima del piano: stanno nel
     livello. Un'azione no — la scrive chi gioca, e il mondo la conosce
     solo perché gliela si dice. Da quel momento `esegui [azione 2]` è un
     ordine come tutti gli altri. */
  registraRoutine (piano) {
    const trovate = {}
    const giro = lista => (lista || []).forEach(o => {
      if (o && o.blocco === 'routine' && o.nome)
        trovate[o.nome] = Array.isArray(o.corpo) ? o.corpo : []
      if (o && o.blocco) for (const l of [o.corpo, o.vero, o.falso]) if (Array.isArray(l)) giro(l)
      else if (o && o.allora) giro(o.allora)
    })
    for (const id in (piano || {})) giro(piano[id])
    this.routine = trovate
    for (const k of Object.keys(this.cose))
      if (this.cose[k] && this.cose[k].tipo === 'routine') delete this.cose[k]
    for (const k in trovate) this.cose[k] = { id: k, tipo: 'routine', nome: k, em: '▶️' }
    return trovate
  }

  /* la fila compilata di un'azione con un nome: ognuno ne vuole una sua,
     perché due chiamate sono due esecuzioni */
  filaDellAzione (nome) {
    const corpo = this.routine[nome]
    return Array.isArray(corpo) ? compilaFila(corpo, []) : null
  }

  /* ═══════════ i messaggi ═══════════ */
  nomeDelSegnale (k) { return segnaleDi(this, k).nome }

  /* fare rumore: si sente fin dove arriva la sua voce */
  faiRumore (chi, segnale) {
    const suono = segnaleDi(this, segnale)
    this.pendenti.push(new Rumore(segnale, chi, suono.voce ?? VOCE_NORMALE))
    this.eventi.push('segnale')
    /* e SI VEDE: un segnale mandato è una cosa che succede sulla mappa,
       nel punto in cui succede. Finiva solo nel registro — cioè dietro un
       tasto — e chi guardava vedeva un personaggio fermarsi un battito
       senza motivo apparente. */
    this.allarmi.push({ x: chi.x, y: chi.y, seg: segnale, da: chi.id })
  }

  /* dirlo a chi si ha davanti: non fa rumore e non chiama nessuno */
  diciA (chi, segnale) {
    this.pendenti.push(new Voce(segnale, chi))
    this.eventi.push('parla')
  }

  /* ── IL GRIDO, che nessuno ha scritto ──
     Sta nella scheda (`grida`), non in un ordine, perché non è una cosa
     che qualcuno le ha detto: è come è fatta lei. Una volta sola — un
     grido che riparte a ogni colpo trascinerebbe mezza mappa avanti e
     indietro, e renderebbe la reazione imprevedibile, che è l'esatto
     contrario di quello che serve perché il diversivo sia una mossa. */
  gridaSe (chi, perche) {
    if (!chi || !chi.grida || !chi.eInPiedi() || chi.gridato) return
    chi.gridato = true
    this.faiRumore(chi, chi.grida)
    this.eventi.push('allarme')
  }

  /* ═══════════ cosa si può dire, qui ═══════════ */
  nominabili () {
    const suoi = (this.livello.complementi || Object.keys(this.cose)).filter(k => this.cose[k])
    const azioni = Object.keys(this.routine || {})
    return azioni.length ? [...new Set([...suoi, ...azioni])] : suoi
  }

  nomi (verbo) {
    const V = VERBI[verbo]
    if (!V) return []
    return this.nominabili().filter(k => V.accetta.includes(this.cose[k].tipo))
  }

  complementi (verbo) {
    const V = VERBI[verbo]
    if (!V) return []
    const nomi = this.nomi(verbo)
    return V.accetta.includes('cella') ? [...nomi, ...this.caselle] : nomi
  }

  /* ── QUANDO UN VERBO SI OFFRE ──
     Quando qui c'è qualcosa da mordere, e «qualcosa» dipende da cosa
     chiede: chi vuole una COSA si offre se quella cosa ha un nome in
     gioco; chi vive di caselle solo dove il livello le apre; chi vuole
     una DOMANDA si offre dove una domanda si può fare. */
  verbi (domandeQui) {
    return Object.keys(VERBI).filter(v =>
      (!this.livello.verbi || this.livello.verbi.includes(v)) &&
      (this.nomi(v).length ||
       (this.livello.celle && VERBI[v].accetta.includes('cella')) ||
       (VERBI[v].vuoleCond && (domandeQui || []).length)))
  }

  verbiPer (id, domandeQui) {
    const conQualcuno = this.unita.some(u => u.id !== id && u.eInPiedi())
    return this.verbi(domandeQui)
      .filter(v => saFare(this.perId[id], v) && (!SEGNALE[v] || conQualcuno))
  }

  nonSa (id, domandeQui) {
    const u = this.perId[id]
    return u && u.sa ? this.verbi(domandeQui).filter(v => !saFare(u, v)) : []
  }

  /* ── LE REAZIONI, LETTE COME UN PIANO ──
     Non una frase scritta a mano da qualche parte: gli ordini veri, gli
     stessi che il bambino sa già leggere perché li scrive lui. È quello
     che rende vero l'aiuto del livello — «una scheda si legge come un
     piano» — invece di una promessa. */
  reazioniDi (id) {
    const u = this.perId[id]
    if (!u) return []
    return (u.reagisce || []).map(r => ({
      che: r.quando,
      segnale: r.segnale || null,
      em: r.quando === 'senti' ? '👂' : r.quando === 'vedi' ? '👁' : '🛡',
      quando: r.quando === 'senti' ? `quando sente «${this.nomeDelSegnale(r.segnale)}»`
            : r.quando === 'vedi' ? `quando vede ${(this.cose[r.chi] || {}).nome || r.chi}`
            : 'quando le prende',
      ordini: r.fai || [],
    }))
  }

  /* ── LE FAMIGLIE, PER CHI DISEGNA ──
     Il disegno itera le cose e chiede a ognuna la sua `faccia()`: queste
     due restano perché la griglia deve sapere quale porta occupa una
     cella, e perché qualcuno vuole ancora l'elenco degli oggetti. */
  get posti () {
    const out = {}
    for (const k in this.cose) if (this.cose[k].tipo === 'posto') out[k] = this.cose[k]
    return out
  }
}

/* ═══════════════════════════════════════════════════════════════════
   GLI INVOLUCRI — la stessa cosa, chiamata come la chiama chi sta fuori
   ═══════════════════════════════════════════════════════════════════ */
export const creaMondo = (livello, variante) => new Mondo(livello, variante)
export const vive = m => m.vivi()
export const perdute = m => m.perdute()
export const laCosa = (m, id) => m.laCosa(id)
export const nominabili = m => m.nominabili()
export const nomiDi = (m, verbo) => m.nomi(verbo)
export const complementiDi = (m, verbo) => m.complementi(verbo)
export const raccogliRoutine = (m, piano) => m.registraRoutine(piano)
export const reazioniDi = (m, id) => m.reazioniDi(id)
export const scusaDi = (m, id, v) => nonRiesce(m && m.perId[id], v)
