// Il banco di prova: un giocatore finto che compra, potenzia e ripara.
// `precisione` è quante volte il calcolo gli riesce (1 = mai sbagliato, 0.75 =
// il bambino che ci ragiona, 0.4 = quello che tira a indovinare); `ritmo` è
// ogni quanti secondi di partita riesce a fare una scelta (la domanda ruba
// tempo, e il campo va a un quarto di velocità mentre risponde: a 6 secondi
// veri sono 1,5 di partita). Non bara: legge quello che si vede a schermo.
import { Partita } from './partita.js'
import { TRUPPE, LIV_MAX } from '../dati/regole.js'

/* il caso che non cambia: stesso seme, stessa partita */
export function caso(seme) {
  let s = seme | 0
  return () => {
    s = (s + 0x6D2B79F5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* I giocatori finti con cui si tara: `misura` non sbaglia e ragiona in fretta,
   `bambino` sbaglia un conto su quattro e ci pensa il doppio, `lento` ne sbaglia
   quasi metà, `caso` tira a indovinare. Cambiarli rende vecchia la taratura
   (la firma li include). */
export const PILOTI = {
  misura: { precisione: 1, ritmo: 1.5 },
  bambino: { precisione: 0.75, ritmo: 2.5 },
  lento: { precisione: 0.55, ritmo: 3.5 },
  caso: { precisione: 0.25, ritmo: 3.5 },
}

// la fila in cui compra le caserme: prima chi tiene a bada gli altri, poi il resto
const ORDINE = ['scheletri', 'guardiano', 'pipistrelli', 'lupi', 'negromante', 'diavoletto', 'golem', 'drago']

export class Pilota {
  constructor({ rnd = Math.random, precisione = 0.9, ritmo = 2.5, caserme = 4 } = {}) {
    this.rnd = rnd
    this.precisione = precisione
    this.ritmo = ritmo
    this.caserme = caserme          // quante ne tiene prima di mettere tutto nelle salite
    this.attesa = ritmo
    this.giuste = 0
    this.sbagliate = 0
  }

  /* decide cosa vorrebbe fare adesso, o null. Il buon senso di un giocatore che
     ha capito il gioco: tiene in piedi quello che ha, prima il castello (da solo
     fa metà del lavoro), poi la miniera finché c'è tempo per ripagarsi, poi un
     esercito misto, poi tutto nelle salite. */
  voglia(p) {
    const mie = p.casermeDi('io')
    const puo = (a, id) => p.puoFare('io', a, id)
    const t = p.castello('io')

    // la bomba è un regalo: si usa appena c'è un ammasso che vale la pena spazzare
    const colpo = p.lati.io.bombe > 0 ? p.puntoDellaBomba('io') : null
    if (colpo && colpo.peso >= 700) return ['bomba']
    const ferite = p.riparabili('io').filter(e => e.hp < e.max * 0.5)
    if (ferite.length && puo('ripara')) return ['ripara']
    const muro = p.muro('io')
    const crollato = !!muro && muro.hp <= 0
    if (crollato && puo('ripara')) return ['ripara']
    if (t.hp > 0 && t.liv < 3 && puo('castello')) return ['castello']
    if (p.t < 45 && p.lati.io.miniera < 2 && puo('miniera')) return ['miniera']
    if (mie.length < this.caserme) {
      const id = ORDINE.find(i => puo('costruisci', i))
      if (id) return ['costruisci', id]
    }
    const media = Math.floor(mie.reduce((s, c) => s + c.liv, 0) / Math.max(1, mie.length))
    if (t.hp > 0 && t.liv < Math.max(3, media) && puo('castello')) return ['castello']
    const sale = mie.filter(c => c.liv < LIV_MAX && puo('potenzia', c.id) && !p.inRiposo('io', c.id))
    if (sale.length) {
      const minimo = Math.min(...sale.map(c => c.liv))
      return ['potenzia', sale.find(c => c.liv === minimo).id]
    }
    if (p.lati.io.miniera < 4 && p.t < 90 && puo('miniera')) return ['miniera']
    return null
  }

  gioca(p, dt) {
    this.attesa -= dt
    if (this.attesa > 0) return
    const v = this.voglia(p)
    if (!v) { this.attesa = 0.5; return }
    this.attesa = this.ritmo
    const [azione, id] = v
    if (this.rnd() < this.precisione) {
      this.giuste++
      p.fai('io', azione, id)
    } else {
      this.sbagliate++
      if (azione === 'potenzia') p.sbagliata('io', id)
    }
  }
}

/* Una partita fino in fondo. `pilota` e `sfida` si passano da fuori. */
export function gioca({ seme = 1, sfida = {}, pilota = {}, passo = 0.25 } = {}) {
  const rnd = caso(seme)
  const p = new Partita({ rnd, sfida })
  const g = new Pilota({ rnd, ...pilota })
  while (!p.fine) {
    p.avanza(passo)
    g.gioca(p, passo)
  }
  return {
    fine: p.fine, secondi: p.t,
    vitaBase: p.vitaBase('io'), giuste: g.giuste, sbagliate: g.sbagliate,
    caserme: p.casermeDi('io').length, miniera: p.lati.io.miniera, castello: p.castello('io').liv,
  }
}

export function misura({ volte = 50, seme = 1, ...resto } = {}) {
  const r = { volte, vinte: 0, perse: 0, pari: 0, secondi: 0 }
  for (let i = 0; i < volte; i++) {
    const g = gioca({ seme: seme + i * 7919, ...resto })
    if (g.fine === 'vinto') r.vinte++; else if (g.fine === 'perso') r.perse++; else r.pari++
    r.secondi += g.secondi
  }
  r.secondi = +(r.secondi / volte).toFixed(0)
  return r
}
