/* ═══════════════════════════════════════════════════════════════════
   UN PIANO DEL SOTTERRANEO — generato tutto in una volta

   Si genera **contenuti compresi**: quando l'eroe entra in una stanza
   non si decide niente lì per lì, si accende soltanto la luce su cose
   già decise. È la differenza fra un posto e un distributore di
   sorprese, e si sente: un posto lo si può *ricordare*, e tornarci con
   l'ascia in mano dopo esserne scappati.

   Il metodo è quello classico: si taglia il rettangolo in due, e ancora
   in due, finché non restano ritagli della misura giusta (BSP); dentro
   ogni ritaglio si scava una stanza più piccola, e i due lati di ogni
   taglio si uniscono con un corridoio a elle. Dove il corridoio buca il
   muro di una stanza nasce una porta.

   ── IL SEME ───────────────────────────────────────────────────────
   Stesso seme, stesso piano. Serve a poter dire «riaprilo col seme 812 e
   guarda la stanza in basso a destra» invece di «fidati», e serve al
   banco di prova, che gioca seicento piani e conta le domande.

   ── IL CONTROLLO È UNA CAMMINATA, NON UN'OCCHIATA ─────────────────
   `guasti()` cammina davvero dall'ingresso fino alla scala. Le porte
   chiuse **non sono muri**: si aprono rispondendo, e sbagliando si
   riprova quante volte si vuole — è il forziere l'unica cosa che si
   perde per sempre. Quello che si controlla è che la strada esista.

   Prima si camminava trattandole come muri, ed era giusto finché di
   ogni stanza se ne chiudeva una sola: allora la porta era un pedaggio
   *facoltativo* e la scala doveva restare libera. Da quando si chiude
   la stanza intera (vedi `chiudiPorte`) quel controllo bocciava piani
   perfettamente giocabili — dove alla scala si arriva passando per la
   fonte, e per entrare nella fonte c'è da rispondere a una domanda
   facile. Il piano dice comunque **quanto costa arrivarci**
   (`serveUnaPorta`), perché è la differenza fra una discesa e l'altra e
   il banco la conta.

   Non c'è niente di grafico qui dentro: gira in Node, e infatti è lì che
   si prova.
   ═══════════════════════════════════════════════════════════════════ */
import { ROCCIA, PAVIMENTO, PORTA } from '../dati/mondo.js'
import { MOSTRI, BRANCO } from '../dati/mostri.js'
import { raggiungibili } from '../../../motore/passi.js'

/* Il caso che non cambia: xorshift, un numero da 0 a 1. */
export function seminato(seme) {
  let s = (seme >>> 0) || 1
  return () => {
    s ^= s << 13; s >>>= 0
    s ^= s >> 17
    s ^= s << 5; s >>>= 0
    return s / 4294967296
  }
}

export class Livello {
  /* `piano` è da 0. `guardiano` è chi porta la chiave della scala, e lo
     dichiara la tappa: è l'unica cosa che non si può aggirare, quindi
     non la si lascia al caso. */
  constructor({ seme = 1, piano = 0, largo = 52, alto = 52, giri = 4,
                guardiano = 'scheletro' } = {}) {
    this.seme = seme
    this.piano = piano
    this.largo = largo
    this.alto = alto
    this.giri = giri
    this.chiGuarda = guardiano
    this.celle = new Uint8Array(largo * alto)
    this.stanze = []
    this.robe = []                    // tutto ciò che sta su una cella e si tocca
    this.rnd = seminato(seme + piano * 7919)
    this.scava()
    this.arreda()
  }

  get stanzeMin() { return this.giri <= 2 ? 4 : 6 }

  a(x, y) {
    return (x < 0 || y < 0 || x >= this.largo || y >= this.alto)
      ? ROCCIA : this.celle[y * this.largo + x]
  }

  metti(x, y, v) {
    if (x >= 0 && y >= 0 && x < this.largo && y < this.alto) this.celle[y * this.largo + x] = v
  }

  calpestabile(x, y) { const c = this.a(x, y); return c === PAVIMENTO || c === PORTA }

  /* ── il taglio ricorsivo ──
     Si ferma quando il pezzo è piccolo abbastanza: sotto quella misura
     le stanze diventano stanzini e i corridoi più lunghi di loro. */
  scava() {
    const foglie = []
    const taglia = (r, giri) => {
      const inAltezza = r.h > 15, inLarghezza = r.w > 15
      if (giri <= 0 || (!inAltezza && !inLarghezza)) { foglie.push(r); return }
      const orizzontale = inAltezza && (!inLarghezza || this.rnd() < 0.5)
      if (orizzontale) {
        const t = Math.floor(r.h * (0.35 + this.rnd() * 0.3))
        taglia({ x: r.x, y: r.y, w: r.w, h: t }, giri - 1)
        taglia({ x: r.x, y: r.y + t, w: r.w, h: r.h - t }, giri - 1)
      } else {
        const t = Math.floor(r.w * (0.35 + this.rnd() * 0.3))
        taglia({ x: r.x, y: r.y, w: t, h: r.h }, giri - 1)
        taglia({ x: r.x + t, y: r.y, w: r.w - t, h: r.h }, giri - 1)
      }
    }
    taglia({ x: 1, y: 1, w: this.largo - 2, h: this.alto - 2 }, this.giri)

    for (const f of foglie) {
      const w = Math.max(5, Math.min(f.w - 3, 5 + Math.floor(this.rnd() * 6)))
      const h = Math.max(4, Math.min(f.h - 3, 4 + Math.floor(this.rnd() * 5)))
      const x = f.x + 1 + Math.floor(this.rnd() * Math.max(1, f.w - w - 1))
      const y = f.y + 1 + Math.floor(this.rnd() * Math.max(1, f.h - h - 1))
      const st = { x, y, w, h, id: this.stanze.length, vicine: [], porte: [], ruolo: null }
      st.cx = x + (w >> 1); st.cy = y + (h >> 1)
      this.stanze.push(st)
      for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) this.metti(x + i, y + j, PAVIMENTO)
    }

    /* ── i corridoi ──
       Ogni stanza si collega alla più vicina fra quelle già collegate
       (albero di copertura): si arriva ovunque senza fare una ragnatela.
       Poi due o tre scorciatoie in più, perché un sotterraneo ad albero
       costringe sempre a tornare dalla stessa strada, e tornare indietro
       deve poter essere una scelta e non una penitenza. */
    const dentro = [0], fuori = this.stanze.map((_, i) => i).slice(1)
    while (fuori.length) {
      let miglior = null
      for (const a of dentro) for (const b of fuori) {
        const d = Math.abs(this.stanze[a].cx - this.stanze[b].cx) +
                  Math.abs(this.stanze[a].cy - this.stanze[b].cy)
        if (!miglior || d < miglior.d) miglior = { a, b, d }
      }
      this.corridoio(this.stanze[miglior.a], this.stanze[miglior.b])
      dentro.push(miglior.b)
      fuori.splice(fuori.indexOf(miglior.b), 1)
    }
    for (let i = 0; i < 3; i++) {
      const a = this.stanze[Math.floor(this.rnd() * this.stanze.length)]
      const b = this.stanze[Math.floor(this.rnd() * this.stanze.length)]
      if (a && b && a !== b && !a.vicine.includes(b.id)) this.corridoio(a, b)
    }
    this.scavaPorte()
  }

  corridoio(a, b) {
    const prima = this.rnd() < 0.5
    const x0 = a.cx, y0 = a.cy, x1 = b.cx, y1 = b.cy
    const passo = (x, y) => { if (this.a(x, y) === ROCCIA) this.metti(x, y, PAVIMENTO) }
    if (prima) {
      for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) passo(x, y0)
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) passo(x1, y)
    } else {
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) passo(x0, y)
      for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) passo(x, y1)
    }
    a.vicine.push(b.id); b.vicine.push(a.id)
  }

  /* Una porta sta dove un corridoio tocca il bordo di una stanza: è
     l'unico posto dove ha senso, ed è quello che rende una stanza una
     stanza invece di uno slargo. Gli angoli no: una porta d'angolo si
     attraversa in diagonale e non chiude niente. */
  scavaPorte() {
    for (const st of this.stanze) {
      for (let i = -1; i <= st.w; i++) for (let j = -1; j <= st.h; j++) {
        const bordo = (i === -1 || j === -1 || i === st.w || j === st.h)
        if (!bordo) continue
        const angolo = (i === -1 || i === st.w) && (j === -1 || j === st.h)
        if (angolo) continue
        const x = st.x + i, y = st.y + j
        if (this.a(x, y) !== PAVIMENTO) continue
        this.metti(x, y, PORTA)
        st.porte.push({ x, y })
      }
    }
  }

  /* ── chi e cosa ci sta dentro ──
     Prima i ruoli delle stanze (ingresso, uscita, tesoro, mercante,
     fonte), poi si riempiono. L'ordine conta: spargendo prima la roba e
     scegliendo dopo l'uscita, l'uscita capiterebbe accanto all'ingresso
     e il piano si attraverserebbe in tre passi. */
  arreda() {
    const st = this.stanze
    const ingresso = st[0]
    ingresso.ruolo = 'ingresso'

    /* l'uscita è la stanza più lontana in linea d'aria: si vuole che il
       piano si attraversi, non che si sfiori */
    let uscita = st[1] || st[0], quanto = -1
    for (const s of st) {
      if (s === ingresso) continue
      const d = Math.hypot(s.cx - ingresso.cx, s.cy - ingresso.cy)
      if (d > quanto) { quanto = d; uscita = s }
    }
    uscita.ruolo = 'uscita'
    this.robe.push({ che: 'scala', x: uscita.cx, y: uscita.cy, em: '🕳️',
                     nome: 'La scala che scende' })

    /* ── quello che vale sta in fondo a un ramo ──
       Le stanze che portano un premio — il mercante, la fonte, i
       forzieri — si pescano **fra le foglie**: quelle con un solo
       collegamento, dove non si passa per andare altrove. È la
       condizione perché la loro porta chiusa possa chiudere davvero
       (vedi `chiudiPorte`): questo generatore fa passare i corridoi per
       il centro delle stanze, quindi una stanza di mezzo è un pezzo di
       strada, e sbarrarla vorrebbe dire mettere un pedaggio sulla via
       della scala. Le foglie no: chi non le vuole, gira al largo.

       Se le foglie finiscono si ripiega su una stanza qualunque — un
       piano senza mercante è peggio di un mercante in mezzo alla
       strada — e a quel punto è `chiudiPorte` a non chiuderla. */
    const foglia = s => s.vicine.length <= 1
    const libere = st.filter(s => !s.ruolo)
    const pesca = () => {
      if (!libere.length) return null
      const fra = libere.some(foglia) ? libere.filter(foglia) : libere
      const scelta = fra[Math.floor(this.rnd() * fra.length)]
      libere.splice(libere.indexOf(scelta), 1)
      return scelta
    }

    const mercante = pesca()
    if (mercante) {
      mercante.ruolo = 'mercante'
      this.robe.push({ che: 'mercante', x: mercante.cx, y: mercante.cy, em: '🧙',
                       nome: 'Il mercante', roba: null })
    }
    const fonte = pesca()
    if (fonte) {
      fonte.ruolo = 'fonte'
      this.robe.push({ che: 'fonte', x: fonte.cx, y: fonte.cy, em: '⛲', nome: 'Una fonte' })
    }
    /* due o tre stanze del tesoro: la cosa che si va a cercare */
    for (let i = 0; i < 2 + (this.rnd() < 0.5 ? 1 : 0); i++) {
      const s = pesca(); if (!s) break
      s.ruolo = 'tesoro'
      this.robe.push({ che: 'forziere', x: s.cx, y: s.cy, em: '🎁', nome: 'Un forziere',
                       aperto: false })
    }

    /* ── i mostri ──
       Più giù si è, più grossi. Nelle stanze del tesoro c'è la guardia:
       è il patto che rende leggibile il segno 💀 sopra la porta — se
       dietro un teschio non ci fosse niente, il segno diventerebbe una
       decorazione e non lo guarderebbe più nessuno. */
    const scala = Math.min(1, this.piano / 5)
    const tipoPer = forza => {
      const i = Math.min(BRANCO.length - 1,
        Math.floor((forza + scala) * BRANCO.length * 0.6 + this.rnd() * 1.4))
      return BRANCO[Math.max(0, i)]
    }
    for (const s of st) {
      if (s.ruolo === 'ingresso') continue
      const quanti = s.ruolo === 'tesoro' ? 1 : Math.floor(this.rnd() * 2.4)
      for (let i = 0; i < quanti; i++) {
        const x = s.x + Math.floor(this.rnd() * s.w), y = s.y + Math.floor(this.rnd() * s.h)
        if (this.robeSu(x, y).length) continue
        this.robe.push(this.mostro(tipoPer(s.ruolo === 'tesoro' ? 0.6 : 0.15), x, y))
      }
    }

    /* ── LA CHIAVE DEL PIANO ──────────────────────────────────────
       Senza questa riga il sotterraneo ha una falla che si vede solo
       giocando storto: i mostri si possono **aggirare tutti**, quindi un
       bambino sveglio scende di piano in piano senza rispondere a una
       sola domanda, e il gioco diventa una passeggiata al buio.

       La cura è quella di sempre: la scala è chiusa e la chiave ce l'ha
       qualcuno. Il minimo assoluto per scendere diventa **battere un
       guardiano**, e tutto il resto resta facoltativo — che è quello che
       si voleva. Il guardiano sta accanto alla scala: la chiave non deve
       capitare a due passi dalla partenza. */
    const guardiano = this.mostro(this.chiGuarda, uscita.cx, uscita.cy - 1)
    if (!this.calpestabile(guardiano.x, guardiano.y)) {
      guardiano.x = uscita.cx; guardiano.y = uscita.cy + 1
    }
    if (this.calpestabile(guardiano.x, guardiano.y) && !this.robeSu(guardiano.x, guardiano.y).length) {
      guardiano.chiave = true
      this.robe.push(guardiano)
    } else {
      /* nessun posto buono accanto alla scala: la chiave la porta il
         mostro già in mappa più lontano dall'ingresso */
      const lontano = this.robe.filter(r => r.che === 'mostro')
        .sort((a, b) => Math.hypot(b.x - ingresso.cx, b.y - ingresso.cy) -
                        Math.hypot(a.x - ingresso.cx, a.y - ingresso.cy))[0]
      if (lontano) lontano.chiave = true
    }

    /* gemme sparse: fanno tornare la pena di scostarsi dalla strada
       anche quando in una stanza non c'è niente di scritto */
    for (const s of st) {
      if (this.rnd() > 0.55) continue
      const x = s.x + Math.floor(this.rnd() * s.w), y = s.y + Math.floor(this.rnd() * s.h)
      if (!this.robeSu(x, y).length)
        this.robe.push({ che: 'gemme', x, y, em: '💎', quante: 2 + Math.floor(this.rnd() * 5) })
    }

    this.arredaLeStanze()
    this.chiudiPorte()
  }

  /* ── l'arredo ──
     Roba che non fa niente: barili, ossa, un braciere acceso. Non si
     tocca, non blocca, non vale gemme — **serve solo a far sembrare che
     qui sotto ci abbia vissuto qualcuno**. Un sotterraneo di stanze
     vuote e mostri si legge come un diagramma, e un diagramma non fa
     venire voglia di girare l'angolo.

     Sta **contro le pareti**, non in mezzo: al centro ci si cammina, e
     una cassa in mezzo al passaggio che si attraversa come se non ci
     fosse è peggio di nessuna cassa. Il braciere porta la sua luce, ed
     è l'unica cosa d'arredo che cambi qualcosa di quello che si vede. */
  arredaLeStanze() {
    /* Tre generi, e la differenza è **dove possono stare**: quello che
       si appende va contro la parete di fondo (uno stendardo in mezzo al
       pavimento non è arredo, è un errore che si vede subito), quello
       che si posa sta lungo un bordo qualunque, e il fuoco è l'unico che
       cambia quello che si vede. Uno solo acceso per stanza: due
       bracieri nella stessa cantina illuminano tutto, e il buio è metà
       del gioco. */
    const APPESO = ['stendardo', 'candelabro']
    const POSATO = ['barile', 'cassa', 'ossa', 'teschio-scena']
    const FUOCO = ['braciere', 'lanterna']
    const pesca = quali => quali[Math.floor(this.rnd() * quali.length)]

    for (const s of this.stanze) {
      const quanti = 1 + Math.floor(this.rnd() * 3)
      let acceso = false
      for (let i = 0; i < quanti; i++) {
        const appeso = this.rnd() < 0.35
        const fuoco = !appeso && !acceso && this.rnd() < 0.4
        /* appeso: sulla fila in alto, contro la parete che si vede di
           faccia. Posato: su un bordo qualunque della stanza. */
        const x = appeso || this.rnd() < 0.6
          ? s.x + Math.floor(this.rnd() * s.w)
          : (this.rnd() < 0.5 ? s.x : s.x + s.w - 1)
        const y = appeso ? s.y
          : (this.rnd() < 0.5 ? s.y : s.y + s.h - 1)
        if (!this.calpestabile(x, y) || this.robeSu(x, y).length) continue
        if (this.porteVicine(x, y)) continue
        if (fuoco) acceso = true
        this.robe.push({ che: 'arredo', x, y, em: fuoco ? '🔥' : appeso ? '🎌' : '📦',
                         pezzo: pesca(fuoco ? FUOCO : appeso ? APPESO : POSATO),
                         arde: fuoco })
      }
    }
  }

  /* Una porta chiede di poterci passare davanti: l'arredo si tiene a
     distanza, o si finisce col chiudere una stanza con una cassa. */
  porteVicine(x, y) {
    return this.stanze.some(s => s.porte.some(p =>
      Math.abs(p.x - x) <= 1 && Math.abs(p.y - y) <= 1))
  }

  /* Le ossa crescono col piano: lo stesso scheletro, più giù, costa più
     risposte — ed è l'unico modo perché scendere si senta. */
  mostro(tipo, x, y) {
    const m = MOSTRI[tipo]
    const su = 1 + this.piano * 0.22
    const ossa = Math.round(m.ossa * su)
    return { che: 'mostro', tipo, x, y, em: m.em, nome: m.nome,
             ossa, ossaMax: ossa,
             att: m.att + Math.floor(this.piano / 2), dif: m.dif,
             chiave: false, morto: false }
  }

  /* ── le porte chiuse, e il loro segno ──
     Non tutte le porte si chiudono: solo quelle che danno su qualcosa
     che vale. Una porta chiusa su una stanza vuota è una bugia, e le
     bugie qui costano care — il segno sopra la porta è l'unica cosa con
     cui si sceglie.

     ── SI CHIUDE LA STANZA, NON LA PORTA ──────────────────────────
     Prima se ne chiudeva **una sola** per stanza, per non far pagare
     due volte lo stesso posto a chi gira in tondo. Il ragionamento era
     giusto e la cura sbagliata: una stanza ha due, tre varchi, e con uno
     solo chiuso il segno 💀 sopra la porta prometteva una guardia che si
     scavalcava passando dall'altra parte. Peggio ancora dove due
     corridoi paralleli si affiancano — capita, e lì il varco è **largo
     due celle**: la porta ne copriva una e si passava letteralmente
     accanto al battente.

     Adesso si chiudono tutte le porte della stanza, e portano lo stesso
     `gruppo`: **rispondere ne apre una e con lei tutte le altre**
     (`Corsa.rispostaPorta`). Il pedaggio resta uno solo — la
     preoccupazione di prima era giusta — ma non si aggira più.

     Una cella, una porta: i bordi di due stanze vicine possono toccarsi,
     e due porte sovrapposte sulla stessa cella si aprirebbero una alla
     volta. */
  chiudiPorte() {
    const messe = new Map()
    for (const s of this.stanze) {
      if (!s.ruolo || s.ruolo === 'ingresso' || !s.porte.length) continue
      const segno = s.ruolo === 'tesoro'
        ? (this.robe.some(r => r.che === 'mostro' && this.dentroStanza(r, s)) ? 'guardia' : 'tesoro')
        : s.ruolo === 'mercante' ? 'mercante'
        : s.ruolo === 'fonte' ? 'fonte' : null
      if (!segno) continue
      /* ── e non si sbarra mai la strada ──
         Chiudere tutti i varchi di una stanza che sta **in mezzo** al
         cammino vuol dire mettere un pedaggio obbligatorio davanti alla
         scala, e trasformare il premio in un casello. Qui si prova
         prima: se chiudendola alla scala non si arriva più, la stanza
         resta aperta e senza segno. Meglio una stanza che si visita
         gratis di una promessa che è in realtà un obbligo. */
      if (this.taglierebbeLaStrada(s, messe)) continue
      for (const p of s.porte) {
        const k = p.x + ',' + p.y
        if (messe.has(k)) continue
        const porta = { che: 'porta', x: p.x, y: p.y, em: '🚪', nome: 'Una porta chiusa',
                        segno, aperta: false, gruppo: s.id }
        messe.set(k, porta)
        this.robe.push(porta)
      }
    }
    /* Un varco largo due celle è **un** portone, non due porte: quella di
       sinistra lo disegna intero (lo sprite del set è largo due celle
       apposta) e quella di destra sta sotto e non si disegna. Senza
       questo, due battenti si sovrappongono a metà e sembrano storti —
       che è come lo si nota, prima ancora di accorgersi che si passa in
       mezzo. */
    for (const [k, porta] of messe) {
      const destra = messe.get((porta.x + 1) + ',' + porta.y)
      if (destra && destra.gruppo === porta.gruppo && !porta.coperta) {
        porta.doppia = true
        destra.coperta = true
      }
    }
  }

  /* Si arriva ancora alla scala se si chiudono anche i varchi di questa
     stanza? Si cammina davvero, contando come muri le porte già chiuse
     più quelle che si sta per chiudere. */
  taglierebbeLaStrada(s, gia) {
    const scala = this.robe.find(r => r.che === 'scala')
    const partenza = this.stanze[0]
    if (!scala || !partenza) return false
    const mura = new Set([...gia.keys(), ...s.porte.map(p => p.x + ',' + p.y)])
    const visti = raggiungibili(
      (x, y) => this.calpestabile(x, y) && !mura.has(x + ',' + y),
      { x: partenza.cx, y: partenza.cy })
    return !visti.has(scala.x + ',' + scala.y)
  }

  dentroStanza(r, s) { return r.x >= s.x && r.y >= s.y && r.x < s.x + s.w && r.y < s.y + s.h }
  robeSu(x, y) { return this.robe.filter(r => r.x === x && r.y === y && !r.morto && !r.presa) }

  stanzaDi(x, y) {
    return this.stanze.find(s => x >= s.x - 1 && y >= s.y - 1 &&
                                 x < s.x + s.w + 1 && y < s.y + s.h + 1) || null
  }

  guasti() {
    const g = []
    const partenza = this.stanze[0]
    if (!partenza) return ['nessuna stanza']
    const da = { x: partenza.cx, y: partenza.cy }
    const chiuse = new Set(this.robe.filter(r => r.che === 'porta').map(r => r.x + ',' + r.y))
    /* si cammina come si camminerà davvero: le porte si aprono
       rispondendo, quindi si attraversano */
    const visti = raggiungibili((x, y) => this.calpestabile(x, y), da)
    /* e si guarda anche **senza** aprirle: non è un guasto, è quanto
       costa arrivare in fondo su questo piano qui */
    const senzaAprire = raggiungibili(
      (x, y) => this.calpestabile(x, y) && !chiuse.has(x + ',' + y), da)

    const scala = this.robe.find(r => r.che === 'scala')
    if (!scala) g.push('non c\'è nessuna scala che scende')
    else if (!visti.has(scala.x + ',' + scala.y))
      g.push('alla scala non si arriva affatto')
    this.serveUnaPorta = !!scala && !senzaAprire.has(scala.x + ',' + scala.y)
    if (this.stanze.length < this.stanzeMin)
      g.push(`solo ${this.stanze.length} stanze: il piano si gira in un minuto`)
    if (!this.robe.some(r => r.che === 'mostro' && r.chiave))
      g.push('nessuno porta la chiave della scala')
    for (const r of this.robe.filter(r => r.che === 'porta'))
      if (this.a(r.x, r.y) !== PORTA) g.push(`una porta chiusa non sta su una porta (${r.x},${r.y})`)
    return g
  }
}

/* Si genera finché non torna un piano sano: capita di rado, ma un piano
   senza uscita non si dà in mano a un bambino. Dopo venti tentativi si
   consegna l'ultimo — meglio un piano storto che una schermata bianca —
   e lo si dice, così in un test diventa rosso. */
export function generaPiano(opz) {
  let ultimo = null
  for (let i = 0; i < 20; i++) {
    ultimo = new Livello({ ...opz, seme: (opz.seme || 1) + i * 131 })
    if (!ultimo.guasti().length) return ultimo
  }
  ultimo.storto = ultimo.guasti()
  return ultimo
}
