// Gli incanti preparati dal campo (docs/sotterraneo/orologio.md): alcune abilità che proteggono (`preparabile` in dati/abilita.js) si
// lanciano anche fuori dallo scontro, pagando l'energia di sempre, e restano addosso per un numero di passi dell'orologio. Lo scontro
// comincia con loro già attive e un turno dell'eroe consuma PASSI_PER_TURNO passi. Il mana speso prima non c'è durante: è il prezzo.
// Sono metodi di Corsa (`Object.assign(Corsa.prototype, ...)` in fondo a corsa.js); gira in Node.
//
// `Corsa.preparati`: [{ id, passi, assorbe?, tick? }] — i passi che restano; `assorbe` quanti danni para ancora la barriera;
// `tick` quante volte ancora la linfa guarisce. Cosa fa ognuno lo dicono i campi del nodo (parato, scudo, intoccabile, specchio, linfa,
// debole), uguali a quelli dello scontro.
import { RAMI, NODI, aGrado, inVita, preparabile, apreLoScontro } from '../dati/abilita.js'
import { PASSI_PER_TURNO } from '../dati/mondo.js'

const turni = n => `${n} ${n === 1 ? 'turno' : 'turni'}`

export const MetodiDeiPreparati = {
  // le abilità imparate che si possono preparare, nell'ordine dei rami
  preparabili() {
    return (RAMI[this.chiEro] || []).flatMap(r => r.nodi).filter(n => preparabile(n) && this.grado(n.id)).map(n => NODI[n.id])
  },

  // quanti passi dura al grado che si ha
  passiDi(nodo) { return aGrado(nodo, 'preparabile', this.grado(nodo.id) || 1) },

  // perché adesso non si può preparare ('' se si può): come in scontro, più la regola del campo
  perchéNonPrepari(id) {
    const nodo = NODI[id]
    if (!preparabile(nodo)) return 'non si prepara'
    if (this.foglio) return 'adesso no'
    const motivo = this.perchéNonUsi(id)
    if (motivo) return motivo
    // già addosso e ancora in forze: un secondo tocco non butta via l'energia
    const c = this.preparati.find(p => p.id === id)
    if (c && c.passi * 2 > this.passiDi(nodo)) return 'ce l\'hai già'
    return ''
  },

  // lancia l'incanto dal campo: paga, e lo mette addosso (o lo rinnova). Torna se è riuscito
  preparaDalCampo(id) {
    if (this.perchéNonPrepari(id)) return false
    const nodo = NODI[id], g = this.grado(id)
    this.energia -= this.costoDi(nodo)
    const c = { id, passi: this.passiDi(nodo) }
    if (nodo.scudo) c.assorbe = inVita(aGrado(nodo, 'scudo', g), this.vitaMax)
    if (nodo.linfa) c.tick = aGrado(nodo, 'linfa', g)
    this.preparati = [...this.preparati.filter(p => p.id !== id), c]
    return true
  },

  // gli incanti di una sosta (motore/sosta.js): quelli che esistono, che l'eroe sa ancora, con numeri sensati. Un dato storto si butta
  rileggiIPreparati(dato) {
    const num = v => (Number.isFinite(v) ? v : 0)
    this.preparati = (Array.isArray(dato) ? dato : []).filter(p => p && preparabile(NODI[p.id]) && this.grado(p.id) && num(p.passi) > 0).map(p => {
      const nodo = NODI[p.id], c = { id: p.id, passi: Math.min(num(p.passi), this.passiDi(nodo)) }
      if (nodo.scudo) c.assorbe = Math.max(0, num(p.assorbe))
      if (nodo.linfa) c.tick = Math.max(0, num(p.tick))
      return c
    }).filter(c => c.assorbe == null || c.assorbe > 0)
  },

  // un passo, o PASSI_PER_TURNO: gli incanti calano, e quelli finiti se ne vanno
  consumaIPreparati(n) {
    if (!this.preparati.length) return
    for (const p of this.preparati) p.passi -= n
    if (this.preparati.some(p => p.passi <= 0)) this.preparati = this.preparati.filter(p => p.passi > 0)
  },

  // c'è addosso un incanto con quel campo (parato, intoccabile…)? Lo chiede il colpo di un mostro
  preparatoCon(campo) { return this.preparati.some(p => NODI[p.id][campo] != null) },

  // la barriera preparata para prima di quella dello scontro: torna quanto ha parato. Esaurita, se ne va
  assorbiConIPreparati(male) {
    let tolto = 0
    for (const p of this.preparati) {
      if (!(p.assorbe > 0) || male - tolto <= 0) continue
      const a = Math.min(p.assorbe, male - tolto)
      p.assorbe -= a
      tolto += a
    }
    if (tolto && this.preparati.some(p => p.assorbe != null && p.assorbe <= 0)) this.preparati = this.preparati.filter(p => !(p.assorbe != null && p.assorbe <= 0))
    return tolto
  },

  // lo specchio preparato: il suo moltiplicatore (0 se non c'è). Si consuma col primo colpo preso, `togliIPreparati('specchio')`
  specchioPreparato() {
    const p = this.preparati.find(x => NODI[x.id].specchio != null)
    return p ? aGrado(NODI[p.id], 'specchio', this.grado(p.id) || 1) : 0
  },
  togliIPreparati(campo) { this.preparati = this.preparati.filter(p => NODI[p.id][campo] == null) },

  // la linfa preparata cura all'inizio di ogni turno dell'eroe, finché dura e al più quante volte dice il nodo
  linfaPreparata() {
    let curato = 0
    for (const p of this.preparati) {
      if (!(p.tick > 0)) continue
      const q = Math.max(1, Math.round(this.vitaMax / 10))
      this.vita = Math.min(this.vitaMax, this.vita + q)
      curato += q
      p.tick--
    }
    if (this.preparati.some(p => p.tick != null && p.tick <= 0)) this.preparati = this.preparati.filter(p => !(p.tick != null && p.tick <= 0))
    return curato
  },

  // lo scontro comincia: Rovi, il Ruggito e il Grido partono, e i mostri in campo (tutti, o chi ha aperto lo scontro) cominciano
  // indeboliti per quanti turni dice il nodo. Si consumano: valgono per questo scontro. Torna i nomi, per dirlo a chi guarda
  apriConIPreparati(f) {
    const partono = this.preparati.filter(p => apreLoScontro(NODI[p.id]))
    if (!partono.length) return []
    for (const p of partono) {
      const nodo = NODI[p.id], quanti = aGrado(nodo, 'debole', this.grado(p.id) || 1)
      for (const x of nodo.forma === 'tutti' ? f.campo : [f.chi]) {
        if (this.effettiBloccati(x, nodo).debole) continue
        x.stati = { ...(x.stati || {}), debole: Math.max((x.stati || {}).debole || 0, quanti) }
      }
    }
    this.preparati = this.preparati.filter(p => !partono.includes(p))
    return partono.map(p => NODI[p.id].nome)
  },

  // cosa fa l'incanto, in parole da bambino e coi numeri veri (la riga della scelta, i passi di un turno in fondo)
  diceIlPreparato(nodo) {
    const g = this.grado(nodo.id) || 1
    const vale = c => aGrado(nodo, c, g)
    const passi = this.passiDi(nodo)
    const dura = `dura ${passi} passi, o ${Math.max(1, Math.floor(passi / PASSI_PER_TURNO))} turni di scontro`
    const cosa = nodo.intoccabile ? 'nessun colpo ti ferisce'
      : nodo.specchio ? 'il primo colpo che prendi torna al mostro'
      : nodo.scudo ? `una barriera che para ${inVita(vale('scudo'), this.vitaMax)} danni`
      : nodo.parato ? 'i colpi che subisci fanno metà'
      : nodo.linfa ? `guarisci di ${Math.max(1, Math.round(this.vitaMax / 10))} a ogni turno di scontro, fino a ${turni(vale('linfa'))}`
      : nodo.debole ? `${nodo.forma === 'tutti' ? 'tutti i mostri' : 'il primo mostro'} partono facendo metà danno per ${turni(vale('debole'))}`
      : ''
    return nodo.debole ? `${cosa} · pronto per ${passi} passi` : `${cosa} · ${dura}`
  },
}
