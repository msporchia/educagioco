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

// la fila in cui compra le caserme: prima chi tiene a bada gli altri, poi il resto
const ORDINE = ['guardiano', 'pipistrelli', 'negromante', 'lupi', 'golem', 'drago', 'diavoletto']

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

  /* decide cosa vorrebbe fare adesso, o null */
  voglia(p) {
    const mie = p.casermeDi('io')
    const puo = (a, id) => p.puoFare('io', a, id)

    const ferite = p.riparabili('io').filter(e => e.hp < e.max * 0.5)
    if (ferite.length && puo('ripara')) return ['ripara']
    const nemiciVicini = p.unita.filter(u => u.lato === 'nem' && !u.vola && u.y > p.t * 0 + 230)
    if (nemiciVicini.length >= 2 && p.muriDi('io').length < 2 && puo('muro')) return ['muro']
    if (p.t < 60 && p.lati.io.miniera < 3 && puo('miniera')) return ['miniera']
    if (mie.length < this.caserme) {
      const id = ORDINE.find(i => puo('costruisci', i))
      if (id) return ['costruisci', id]
    }
    const t = p.torretta('io')
    if (t.hp > 0 && t.liv < Math.max(2, Math.floor(mie.reduce((s, c) => s + c.liv, 0) / Math.max(1, mie.length))) && puo('torretta')) return ['torretta']
    const sale = mie.filter(c => c.liv < LIV_MAX && puo('potenzia', c.id) && !p.inRiposo('io', c.id))
    if (sale.length) {
      const minimo = Math.min(...sale.map(c => c.liv))
      return ['potenzia', sale.find(c => c.liv === minimo).id]
    }
    if (p.lati.io.miniera < 6 && p.t < 100 && puo('miniera')) return ['miniera']
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
    fine: p.fine, secondi: p.t, corone: p.corone('io'), coroneNemico: p.corone('nem'),
    vitaBase: p.re('io').hp / p.re('io').max, giuste: g.giuste, sbagliate: g.sbagliate,
    caserme: p.casermeDi('io').length, miniera: p.lati.io.miniera, torretta: p.torretta('io').liv,
  }
}

export function misura({ volte = 50, seme = 1, ...resto } = {}) {
  const r = { volte, vinte: 0, perse: 0, pari: 0, secondi: 0, corone: 0 }
  for (let i = 0; i < volte; i++) {
    const g = gioca({ seme: seme + i * 7919, ...resto })
    if (g.fine === 'vinto') r.vinte++; else if (g.fine === 'perso') r.perse++; else r.pari++
    r.secondi += g.secondi
    r.corone += g.corone
  }
  r.secondi = +(r.secondi / volte).toFixed(0)
  r.corone = +(r.corone / volte).toFixed(2)
  return r
}
