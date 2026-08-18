/* ═══════════════════════════════════════════════════════════════════
   I PAESAGGI — i posti dove vivono gli animali, dipinti col codice.

   Servono a una domanda che a scuola dura mesi — dove vive il leone,
   dove vive il pinguino — e che senza figure non si può fare a un
   bambino che non legge ancora bene. Il testo sotto lo mette
   `conNome` (vedi `nucleo/domanda.js`): qui c'è solo il disegno.

   PERCHÉ COL CODICE E NON CON DEGLI SPRITE. Il resto del repo va nella
   direzione opposta — il castello e il sotterraneo sono passati ai
   fogli generati — ma la divisione è sempre stata la stessa: le
   *figure* si disegnano, i *terreni* si generano. Un leone dipinto a
   poligoni è povero; una savana dipinta a poligoni è una savana. E qui
   servono dieci posti, non dieci bestie: le bestie restano emoji, che
   il telefono disegna meglio di chiunque.

   IL VINCOLO CHE COMANDA TUTTO È LA TAGLIA. Un riquadro di risposta è
   largo da 52 a 118 pixel (`.qz-telo` in `Domanda.vue`), e a 52 non
   esiste nessun dettaglio: sopravvivono solo **la massa di colore e
   una silhouette**. Per questo ogni posto è costruito per essere
   riconoscibile spegnendo la testa — il giallo con la macchia scura
   dell'acacia, il bianco e blu della banchisa, il verde pieno senza
   cielo della giungla — e non per essere un bel paesaggio. Dove ho
   dovuto scegliere fra «più vero» e «più diverso dagli altri nove», ho
   scelto più diverso: la domanda si gioca fra quattro riquadri
   affiancati, e due che si somigliano sono un errore del disegno che il
   bambino paga come se fosse ignoranza sua.

   Niente sfumature, tutto a tinte piatte: un gradiente a 52 pixel
   diventa una macchia sporca, e il resto dei pittori dei quiz è piatto.

     { che: 'ambiente', dove: 'savana' }

   Una sola voce nella tabella dei pittori e il posto nel dato, come fa
   `figure.js` con le sue celle: dieci voci separate vorrebbero dire
   dieci righe da ricordare ogni volta che si tocca un modulo.
   ═══════════════════════════════════════════════════════════════════ */

import { seminato } from '../../../grafica/tela.js'

const G = 100                    // il lato del mondo dei pittori
const GIRO = Math.PI * 2

/* ── i posti ──
   `nome` è la parola che va sotto il disegno, ed è quella che il
   bambino deve imparare a dire: si scrive qui e non nel modulo, perché
   il disegno e il suo nome sono la stessa cosa e separarli vuol dire
   ritrovarsi un giorno con la palude disegnata e lo stagno scritto. */
export const AMBIENTI = [
  { id: 'savana',   nome: 'savana' },
  { id: 'deserto',  nome: 'deserto' },
  { id: 'giungla',  nome: 'giungla' },
  { id: 'banchisa', nome: 'ghiacci' },
  { id: 'mare',     nome: 'mare' },
  { id: 'bosco',    nome: 'bosco' },
  { id: 'montagna', nome: 'montagna' },
  { id: 'stagno',   nome: 'stagno' },
  { id: 'fattoria', nome: 'fattoria' },
  { id: 'citta',    nome: 'città' },
]

export const NOMI_AMBIENTI = Object.fromEntries(AMBIENTI.map(a => [a.id, a.nome]))
export const CHIAVI_AMBIENTI = AMBIENTI.map(a => a.id)

/* ── attrezzi comuni ── */

/* il cielo e la terra: due bande piatte separate da un orizzonte */
function fondo(p, cielo, terra, oriz) {
  p.rett(0, 0, G, oriz, cielo)
  p.rett(0, oriz, G, G - oriz, terra)
}

/* una banda ondulata che scende fino in fondo al riquadro: colline,
   dune, onde. `giri` è quante gobbe stanno nei cento pixel. */
function onda(p, y, amp, giri, col, fase = 0) {
  const punti = []
  for (let x = 0; x <= G; x += 3.5) punti.push([x, y + Math.sin((x / G) * giri * GIRO + fase) * amp])
  punti.push([G, G], [0, G])
  p.figura(punti, col)
}

/* l'acacia: tronco sottile e chioma a ombrello. È **la** silhouette
   della savana — a 52 pixel il piatto scuro sopra il gambo è tutto
   quello che resta, ed è già abbastanza per non confonderla col
   deserto. */
function acacia(p, x, base, h, tronco, chioma) {
  p.rett(x - h * 0.035, base - h, h * 0.07, h, tronco)
  p.ellisse(x, base - h * 0.98, h * 0.46, h * 0.14, chioma)
  p.ellisse(x - h * 0.2, base - h * 0.86, h * 0.22, h * 0.09, chioma)
  p.ellisse(x + h * 0.18, base - h * 0.88, h * 0.2, h * 0.085, chioma)
}

/* l'abete: tre gonne sovrapposte, che è come si disegna un albero da
   quando esistono i bambini */
function abete(p, x, base, h, col, tronco) {
  p.rett(x - h * 0.05, base - h * 0.24, h * 0.1, h * 0.24, tronco)
  for (let i = 0; i < 3; i++) {
    const cy = base - h * 0.22 - i * h * 0.24
    const w = h * 0.32 * (1 - i * 0.2)
    p.figura([[x, cy - h * 0.36], [x + w, cy], [x - w, cy]], col)
  }
}

/* un ciuffo d'erba: tre steli che si aprono */
function ciuffo(p, x, base, h, col) {
  p.figura([[x, base - h], [x + h * 0.22, base], [x - h * 0.22, base]], col)
}

/* ── i dieci posti ──
   Ognuno è una funzione sola, e si legge dall'alto in basso come si
   dipinge: cielo, terra, e sopra le cose. */

const POSTI = {

  /* SAVANA — giallo caldo, terra ocra e l'acacia. Il sole è basso e
     grosso perché è la seconda cosa che la racconta. */
  savana(p) {
    fondo(p, '#f4c85f', '#c9903e', 56)
    p.cerchio(74, 34, 13, '#ffe9a8')
    onda(p, 56, 3, 1.2, '#b87c33', 2)
    onda(p, 72, 2.5, 1.6, '#a96c2b', 0.6)
    const r = seminato(7)
    for (let i = 0; i < 14; i++) {
      const x = r() * G, y = 62 + r() * 34
      ciuffo(p, x, y, 4 + r() * 3, '#8d5a24')
    }
    acacia(p, 30, 60, 30, '#5b3c1c', '#3f5622')
    acacia(p, 66, 66, 17, '#5b3c1c', '#3f5622')
  },

  /* DESERTO — la stessa famiglia di colori della savana, e per questo è
     il confronto più difficile dei dieci: quello che li separa è che
     qui **non c'è niente di verde e niente in piedi**. Dune tonde, sole
     a picco e bianco, cielo pallido di caldo. */
  deserto(p) {
    fondo(p, '#a9d8ee', '#eccf92', 44)
    p.cerchio(24, 20, 10, '#fff6d8')
    onda(p, 46, 5, 0.9, '#e3c07e', 1.2)
    onda(p, 60, 6, 1.3, '#d3ab63', 3.4)
    onda(p, 78, 5, 1.1, '#c1954f', 0.4)
    /* le creste chiare: una duna si legge dal filo di luce in cima */
    const r = seminato(3)
    p.velo(0.5, q => {
      for (let i = 0; i < 3; i++) {
        const y = 52 + i * 14 + r() * 4
        q.rett(6 + r() * 20, y, 30 + r() * 40, 1.4, '#fff1cd')
      }
    })
  },

  /* GIUNGLA — l'unico posto senza cielo: verde su verde fino al bordo,
     con la luce che entra a fatica. A taglia piccola è una macchia
     verde scura, e va benissimo così: nessun altro dei dieci lo è. */
  giungla(p) {
    p.rett(0, 0, G, G, '#123a1f')
    p.velo(0.5, q => q.cerchio(62, 28, 26, '#4f8f3a'))
    const r = seminato(11)
    /* le foglie: ellissi girate, chiare in alto e scure in basso, così
       il riquadro ha un sopra anche senza orizzonte */
    for (let i = 0; i < 26; i++) {
      const x = r() * G, y = r() * G
      const scuro = y > 55
      const col = scuro ? '#1c5c2c' : ['#2f7a3f', '#3d9147', '#256b33'][i % 3]
      p.in(x, y, q => q.ellisse(0, 0, 11 + r() * 9, 4 + r() * 3, col), (r() - 0.5) * 2.2)
    }
    /* due liane verticali, che sono la firma della foresta pluviale */
    p.rett(22, 0, 2, 62, '#2a6b34')
    p.rett(79, 0, 1.6, 48, '#2a6b34')
    p.ellisse(23, 62, 4, 2.4, '#3d9147')
  },

  /* BANCHISA — bianco e blu freddo, lastre spezzate sull'acqua. Il
     ghiaccio non è mai bianco puro: sull'azzurro sparirebbe il bordo. */
  banchisa(p) {
    fondo(p, '#cfe4f0', '#1f5f8e', 34)
    p.rett(0, 34, G, 3, '#174b73')
    /* due iceberg, e uno grosso: la punta bianca contro il cielo è la
       cosa che si vede da lontano */
    p.figura([[54, 37], [72, 6], [92, 37]], '#f4fbff')
    p.figura([[72, 6], [92, 37], [77, 37]], '#c6dded')
    p.figura([[6, 37], [17, 20], [30, 37]], '#eaf5ff')
    p.figura([[17, 20], [30, 37], [21, 37]], '#bcd9ea')
    /* IL BANCO DI GHIACCIO, non le lastrine. Con poche lastre in mezzo
       all'acqua questo riquadro era «mare con dentro qualcosa di
       bianco», e a 52 px non si distingueva dal mare aperto: adesso il
       ghiaccio è il pavimento e l'acqua è la crepa che lo attraversa. */
    p.rett(0, 44, G, 56, '#f4fbff')
    p.figura([[0, 44], [26, 40], [58, 46], [82, 41], [100, 45], [100, 44], [0, 44]], '#f4fbff')
    for (const [x, y, w] of [[0, 40, 30], [40, 42, 26], [78, 39, 22]]) {
      p.figura([[x, 46], [x + w * 0.3, y], [x + w, 45], [x + w, 48], [x, 48]], '#f4fbff')
    }
    /* le crepe: acqua scura fra lastra e lastra, e l'ombra azzurra che
       fa capire che sono spesse */
    p.figura([[18, 44], [24, 62], [20, 84], [26, 100], [16, 100], [12, 78], [15, 60]], '#2f7ba8')
    p.figura([[62, 46], [70, 66], [66, 100], [58, 100], [61, 70]], '#2f7ba8')
    p.velo(0.5, q => {
      q.rett(0, 62, 12, 2.4, '#9fc6dd')
      q.rett(30, 74, 26, 2.4, '#9fc6dd')
      q.rett(74, 58, 22, 2.4, '#9fc6dd')
    })
  },

  /* MARE — l'acqua aperta con l'orizzonte alto, e le creste bianche.
     Si distingue dallo stagno per la stessa ragione per cui si
     distingue nella testa di un bambino: non si vede dove finisce. */
  mare(p) {
    fondo(p, '#63b8e8', '#1d6ea8', 26)
    p.rett(0, 26, G, 2.5, '#14527f')
    /* Il blu si fa via via più cupo scendendo: è l'acqua che diventa
       profonda, ed è la cosa che il mare ha e lo stagno no. Le creste
       sono ONDE E NON RIGHE — le righe bianche corte, a 52 px, erano
       identiche alle lastre della banchisa, che è il confronto più
       pericoloso dei dieci. */
    onda(p, 40, 3.5, 1.8, '#1a6099', 0.8)
    onda(p, 58, 4, 1.4, '#155081', 2.6)
    onda(p, 78, 4.5, 1.1, '#0f3f68', 1.4)
    const cresta = (y, x0, w, amp) => {
      const punti = []
      for (let x = 0; x <= w; x += 2) punti.push({ x: x0 + x, y: y - Math.sin((x / w) * Math.PI) * amp })
      p.linea(punti, '#dff1ff', 1.8)
    }
    cresta(46, 8, 30, 3.5)
    cresta(66, 44, 34, 4)
    cresta(88, 14, 40, 4.5)
  },

  /* BOSCO — abeti su collina, cielo sopra. Il verde è freddo e i
     tronchi si vedono: è l'opposto della giungla, dove il verde è caldo
     e non c'è cielo. */
  bosco(p) {
    fondo(p, '#a8d8ef', '#4e8a3f', 52)
    onda(p, 52, 4, 1.1, '#3f7534', 1.8)
    onda(p, 74, 3, 1.4, '#356429', 0.3)
    const alberi = [[14, 66, 30], [34, 60, 24], [52, 68, 32], [72, 62, 26], [90, 70, 28]]
    for (const [x, base, h] of alberi) abete(p, x, base, h, '#1f5b2c', '#5a3a1e')
    const r = seminato(13)
    for (let i = 0; i < 10; i++) ciuffo(p, r() * G, 78 + r() * 20, 4, '#2d5a24')
  },

  /* MONTAGNA — picchi di roccia con la neve in cima, e la parete in
     ombra da un lato: senza l'ombra sono triangoli grigi, con l'ombra
     sono montagne. */
  montagna(p) {
    fondo(p, '#bfe0f2', '#6a7c8f', 62)
    const picchi = [[8, 78, 30, 62], [42, 84, 34, 24], [74, 76, 32, 58]]
    for (const [x, base, h, luce] of picchi) {
      const cima = base - h
      p.figura([[x, base], [x + 26, cima], [x + 52, base]], '#7a8ba0')
      p.figura([[x + 26, cima], [x + 52, base], [x + 30, base]], '#5d6d80')
      /* la neve: un cappuccio con la punta seghettata */
      p.figura([[x + 26, cima], [x + 36, cima + 12], [x + 30, cima + 10],
        [x + 26, cima + 15], [x + 21, cima + 10], [x + 16, cima + 12]], '#f2f8ff')
      void luce
    }
    p.rett(0, 84, G, 16, '#55684f')
  },

  /* STAGNO — l'acqua chiusa: si vede tutta, ha il bordo, ha le canne.
     Questa è l'acqua dolce, ed è la differenza che a scuola conta —
     l'anatra ci vive, il delfino no. */
  stagno(p) {
    p.rett(0, 0, G, G, '#5c9e4a')
    onda(p, 16, 3, 1.2, '#4f8e40', 2)
    p.ellisse(52, 62, 40, 24, '#2f89b5')
    p.ellisse(52, 60, 34, 19, '#3fa2cc')
    p.velo(0.55, q => {
      q.rett(26, 55, 20, 1.6, '#d3f0ff')
      q.rett(48, 68, 26, 1.6, '#d3f0ff')
    })
    /* le ninfee: tonde, con lo spicchio tolto */
    for (const [x, y, r0] of [[36, 58, 5], [66, 70, 4], [56, 50, 3.4]]) {
      p.cerchio(x, y, r0, '#2f7a3f')
      p.figura([[x, y], [x + r0, y - r0 * 0.5], [x + r0, y + r0 * 0.5]], '#3fa2cc')
    }
    /* le canne, che stanno sul bordo e non in mezzo */
    for (const [x, h] of [[12, 30], [17, 22], [88, 26], [83, 18]]) {
      p.rett(x, 74 - h, 1.6, h, '#3d6b2a')
      p.ellisse(x + 0.8, 74 - h, 2.2, 4.5, '#7a5a2c')
    }
  },

  /* FATTORIA — il prato con la staccionata e il fienile rosso. Il rosso
     non c'è in nessuno degli altri nove, ed è per questo che questo
     riquadro si riconosce prima di essere guardato. */
  fattoria(p) {
    fondo(p, '#a8d8ef', '#6fb650', 46)
    onda(p, 46, 3, 1, '#5da443', 1)
    /* il fienile */
    p.rett(56, 26, 34, 26, '#c04b3a')
    p.figura([[54, 27], [73, 13], [92, 27]], '#8e3427')
    p.rett(68, 38, 10, 14, '#f0ddb8')
    p.rett(72.4, 38, 1.2, 14, '#8e3427')
    /* la staccionata: due traverse e i pali */
    p.rett(4, 62, 92, 2.4, '#f0ead8')
    p.rett(4, 70, 92, 2.4, '#f0ead8')
    for (let x = 6; x < 96; x += 13) p.rett(x, 56, 3, 22, '#fff8e8')
    const r = seminato(17)
    for (let i = 0; i < 12; i++) ciuffo(p, r() * G, 82 + r() * 16, 4, '#4f9a3c')
  },

  /* CITTÀ — palazzi e finestre accese. È il posto degli animali che i
     bambini vedono davvero (piccione, topo, gatto), e serve anche a
     dire che «dove vive» non vuol dire sempre lontano. */
  citta(p) {
    fondo(p, '#8fb7d8', '#5a5f6b', 74)
    const case_ = [[2, 34, 20], [20, 22, 18], [36, 44, 14], [48, 16, 22], [69, 38, 15], [83, 27, 15]]
    const tinte = ['#464e63', '#3a4256', '#525a70']
    case_.forEach(([x, top, w], i) => {
      p.rett(x, top, w, 74 - top, tinte[i % 3])
      const r = seminato(100 + i)
      for (let y = top + 4; y < 70; y += 8) {
        for (let fx = x + 2.5; fx < x + w - 3; fx += 6) {
          p.rett(fx, y, 3, 4, r() > 0.45 ? '#ffd775' : '#2b3244')
        }
      }
    })
    p.rett(0, 74, G, 26, '#4a4f5a')
    p.rett(0, 84, G, 3, '#6b7180')
    for (let x = 4; x < G; x += 18) p.rett(x, 91, 10, 2.4, '#e8e4d8')
  },
}

/* ── la tabella che il modulo dichiara ──
   Una voce sola: il posto sta nel dato, non nel nome della scena. Un
   `dove` che non esiste lascia il riquadro vuoto invece di far saltare
   la pagina — la stessa scelta di `riquadro.js`. */
export const PITTORI_AMBIENTI = {
  ambiente(p, scena) {
    const posto = POSTI[scena?.dove]
    if (posto) posto(p, scena)
  },
}

/* comodo per chi scrive il modulo: la risposta già pronta, disegno e
   parola insieme */
export const scenaAmbiente = dove => ({ che: 'ambiente', dove })
