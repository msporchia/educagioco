/* I dieci paesaggi per «dove vive l'animale», dipinti col codice (i
   terreni si generano, le figure si disegnano — le bestie restano
   emoji). Il vincolo è la taglia: un riquadro va da 52 a 118px, a 52 non
   c'è nessun dettaglio, solo massa di colore e silhouette. Dove «più
   vero» e «più diverso dagli altri nove» sono in conflitto vince il
   secondo: due riquadri che si somigliano sono un errore di disegno che
   il bambino paga come ignoranza sua. Niente sfumature, solo tinte piatte. */

import { seminato } from '../../../grafica/tela.js'

const G = 100                    // il lato del mondo dei pittori
const GIRO = Math.PI * 2

// nome sta qui e non nel modulo: disegno e nome sono la stessa cosa, separarli rischierebbe di farli divergere
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

// il cielo e la terra: due bande piatte separate da un orizzonte
function fondo(p, cielo, terra, oriz) {
  p.rett(0, 0, G, oriz, cielo)
  p.rett(0, oriz, G, G - oriz, terra)
}

// una banda ondulata che scende fino in fondo al riquadro: colline, dune, onde; `giri` è quante gobbe nei 100px
function onda(p, y, amp, giri, col, fase = 0) {
  const punti = []
  for (let x = 0; x <= G; x += 3.5) punti.push([x, y + Math.sin((x / G) * giri * GIRO + fase) * amp])
  punti.push([G, G], [0, G])
  p.figura(punti, col)
}

// l'acacia: tronco sottile e chioma a ombrello, la silhouette della savana (basta a non confonderla col deserto)
function acacia(p, x, base, h, tronco, chioma) {
  p.rett(x - h * 0.035, base - h, h * 0.07, h, tronco)
  p.ellisse(x, base - h * 0.98, h * 0.46, h * 0.14, chioma)
  p.ellisse(x - h * 0.2, base - h * 0.86, h * 0.22, h * 0.09, chioma)
  p.ellisse(x + h * 0.18, base - h * 0.88, h * 0.2, h * 0.085, chioma)
}

// tre gonne sovrapposte, come si disegna un albero da quando esistono i bambini
function abete(p, x, base, h, col, tronco) {
  p.rett(x - h * 0.05, base - h * 0.24, h * 0.1, h * 0.24, tronco)
  for (let i = 0; i < 3; i++) {
    const cy = base - h * 0.22 - i * h * 0.24
    const w = h * 0.32 * (1 - i * 0.2)
    p.figura([[x, cy - h * 0.36], [x + w, cy], [x - w, cy]], col)
  }
}

// un ciuffo d'erba: tre steli che si aprono
function ciuffo(p, x, base, h, col) {
  p.figura([[x, base - h], [x + h * 0.22, base], [x - h * 0.22, base]], col)
}

// i dieci posti: una funzione ciascuno, letta come si dipinge (cielo, terra, sopra le cose)
const POSTI = {

  savana(p) { // giallo caldo, terra ocra, l'acacia; il sole basso e grosso è la seconda cosa che la racconta
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

  // il confronto più difficile con la savana: qui niente di verde e niente in piedi
  deserto(p) {
    fondo(p, '#a9d8ee', '#eccf92', 44)
    p.cerchio(24, 20, 10, '#fff6d8')
    onda(p, 46, 5, 0.9, '#e3c07e', 1.2)
    onda(p, 60, 6, 1.3, '#d3ab63', 3.4)
    onda(p, 78, 5, 1.1, '#c1954f', 0.4)
    // le creste chiare: una duna si legge dal filo di luce in cima
    const r = seminato(3)
    p.velo(0.5, q => {
      for (let i = 0; i < 3; i++) {
        const y = 52 + i * 14 + r() * 4
        q.rett(6 + r() * 20, y, 30 + r() * 40, 1.4, '#fff1cd')
      }
    })
  },

  // l'unico posto senza cielo: verde su verde fino al bordo, macchia verde scura a taglia piccola
  giungla(p) {
    p.rett(0, 0, G, G, '#123a1f')
    p.velo(0.5, q => q.cerchio(62, 28, 26, '#4f8f3a'))
    const r = seminato(11)
    // le foglie: chiare in alto e scure in basso, così il riquadro ha un sopra anche senza orizzonte
    for (let i = 0; i < 26; i++) {
      const x = r() * G, y = r() * G
      const scuro = y > 55
      const col = scuro ? '#1c5c2c' : ['#2f7a3f', '#3d9147', '#256b33'][i % 3]
      p.in(x, y, q => q.ellisse(0, 0, 11 + r() * 9, 4 + r() * 3, col), (r() - 0.5) * 2.2)
    }
    // due liane verticali, la firma della foresta pluviale
    p.rett(22, 0, 2, 62, '#2a6b34')
    p.rett(79, 0, 1.6, 48, '#2a6b34')
    p.ellisse(23, 62, 4, 2.4, '#3d9147')
  },

  banchisa(p) { // bianco e blu freddo; il ghiaccio non è mai bianco puro, sull'azzurro sparirebbe il bordo
    fondo(p, '#cfe4f0', '#1f5f8e', 34)
    p.rett(0, 34, G, 3, '#174b73')
    p.figura([[54, 37], [72, 6], [92, 37]], '#f4fbff')
    p.figura([[72, 6], [92, 37], [77, 37]], '#c6dded')
    p.figura([[6, 37], [17, 20], [30, 37]], '#eaf5ff')
    p.figura([[17, 20], [30, 37], [21, 37]], '#bcd9ea')
    // il banco di ghiaccio, non lastrine sparse: a 52px si distinguerebbe poco dal mare aperto
    p.rett(0, 44, G, 56, '#f4fbff')
    p.figura([[0, 44], [26, 40], [58, 46], [82, 41], [100, 45], [100, 44], [0, 44]], '#f4fbff')
    for (const [x, y, w] of [[0, 40, 30], [40, 42, 26], [78, 39, 22]]) {
      p.figura([[x, 46], [x + w * 0.3, y], [x + w, 45], [x + w, 48], [x, 48]], '#f4fbff')
    }
    // le crepe: acqua scura fra lastra e lastra
    p.figura([[18, 44], [24, 62], [20, 84], [26, 100], [16, 100], [12, 78], [15, 60]], '#2f7ba8')
    p.figura([[62, 46], [70, 66], [66, 100], [58, 100], [61, 70]], '#2f7ba8')
    p.velo(0.5, q => {
      q.rett(0, 62, 12, 2.4, '#9fc6dd')
      q.rett(30, 74, 26, 2.4, '#9fc6dd')
      q.rett(74, 58, 22, 2.4, '#9fc6dd')
    })
  },

  // si distingue dallo stagno come nella testa di un bambino: non si vede dove finisce
  mare(p) {
    fondo(p, '#63b8e8', '#1d6ea8', 26)
    p.rett(0, 26, G, 2.5, '#14527f')
    // creste a onda e non a riga: righe corte a 52px erano identiche alle lastre della banchisa
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

  // l'opposto della giungla: verde freddo, tronchi visibili, cielo sopra
  bosco(p) {
    fondo(p, '#a8d8ef', '#4e8a3f', 52)
    onda(p, 52, 4, 1.1, '#3f7534', 1.8)
    onda(p, 74, 3, 1.4, '#356429', 0.3)
    const alberi = [[14, 66, 30], [34, 60, 24], [52, 68, 32], [72, 62, 26], [90, 70, 28]]
    for (const [x, base, h] of alberi) abete(p, x, base, h, '#1f5b2c', '#5a3a1e')
    const r = seminato(13)
    for (let i = 0; i < 10; i++) ciuffo(p, r() * G, 78 + r() * 20, 4, '#2d5a24')
  },

  // picchi con neve e ombra: senza l'ombra sono triangoli grigi, con l'ombra sono montagne
  montagna(p) {
    fondo(p, '#bfe0f2', '#6a7c8f', 62)
    const picchi = [[8, 78, 30, 62], [42, 84, 34, 24], [74, 76, 32, 58]]
    for (const [x, base, h, luce] of picchi) {
      const cima = base - h
      p.figura([[x, base], [x + 26, cima], [x + 52, base]], '#7a8ba0')
      p.figura([[x + 26, cima], [x + 52, base], [x + 30, base]], '#5d6d80')
      // la neve: un cappuccio con la punta seghettata
      p.figura([[x + 26, cima], [x + 36, cima + 12], [x + 30, cima + 10],
        [x + 26, cima + 15], [x + 21, cima + 10], [x + 16, cima + 12]], '#f2f8ff')
      void luce
    }
    p.rett(0, 84, G, 16, '#55684f')
  },

  // l'acqua chiusa: si vede tutta, ha il bordo, ha le canne (acqua dolce: l'anatra ci vive, il delfino no)
  stagno(p) {
    p.rett(0, 0, G, G, '#5c9e4a')
    onda(p, 16, 3, 1.2, '#4f8e40', 2)
    p.ellisse(52, 62, 40, 24, '#2f89b5')
    p.ellisse(52, 60, 34, 19, '#3fa2cc')
    p.velo(0.55, q => {
      q.rett(26, 55, 20, 1.6, '#d3f0ff')
      q.rett(48, 68, 26, 1.6, '#d3f0ff')
    })
    // le ninfee: tonde, con lo spicchio tolto
    for (const [x, y, r0] of [[36, 58, 5], [66, 70, 4], [56, 50, 3.4]]) {
      p.cerchio(x, y, r0, '#2f7a3f')
      p.figura([[x, y], [x + r0, y - r0 * 0.5], [x + r0, y + r0 * 0.5]], '#3fa2cc')
    }
    // le canne, sul bordo e non in mezzo
    for (const [x, h] of [[12, 30], [17, 22], [88, 26], [83, 18]]) {
      p.rett(x, 74 - h, 1.6, h, '#3d6b2a')
      p.ellisse(x + 0.8, 74 - h, 2.2, 4.5, '#7a5a2c')
    }
  },

  // il rosso del fienile non c'è in nessuno degli altri nove: si riconosce prima di essere guardato
  fattoria(p) {
    fondo(p, '#a8d8ef', '#6fb650', 46)
    onda(p, 46, 3, 1, '#5da443', 1)
    // il fienile
    p.rett(56, 26, 34, 26, '#c04b3a')
    p.figura([[54, 27], [73, 13], [92, 27]], '#8e3427')
    p.rett(68, 38, 10, 14, '#f0ddb8')
    p.rett(72.4, 38, 1.2, 14, '#8e3427')
    // la staccionata: due traverse e i pali
    p.rett(4, 62, 92, 2.4, '#f0ead8')
    p.rett(4, 70, 92, 2.4, '#f0ead8')
    for (let x = 6; x < 96; x += 13) p.rett(x, 56, 3, 22, '#fff8e8')
    const r = seminato(17)
    for (let i = 0; i < 12; i++) ciuffo(p, r() * G, 82 + r() * 16, 4, '#4f9a3c')
  },

  // palazzi e finestre accese: gli animali che i bambini vedono davvero, «dove vive» non vuol dire sempre lontano
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

// una voce sola: il posto sta nel dato, non nel nome della scena; un `dove` inesistente lascia il riquadro vuoto
export const PITTORI_AMBIENTI = {
  ambiente(p, scena) {
    const posto = POSTI[scena?.dove]
    if (posto) posto(p, scena)
  },
}

export const scenaAmbiente = dove => ({ che: 'ambiente', dove })
