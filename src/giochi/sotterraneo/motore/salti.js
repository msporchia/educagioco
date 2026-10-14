// Quanto costa un salto (docs/sotterraneo/fine-discesa-e-strade.md, «Le risalite»): per un livello, i prezzi dei pezzi che i mercanti mettono in cima alle
// linguette come «salto» e «sogno» (motore/bottega.js, ruoloDi) a un eroe con la roba attesa a quel livello. Serve a dare la soglia delle
// risalite (dati/giocatori-tipo.js) e a controllarla con `npm run taratura -- --salti`. Gira in Node.
import { Bottega } from './bottega.js'
import { robaAttesa } from './storia.js'
import { livelloAtteso } from './storia.js'
import { crescitaA } from './crescita.js'
import { eroeDi } from '../dati/eroi.js'
import { MERCANTI } from '../dati/mercanti.js'
import { CAMPAGNA } from '../dati/campagna.js'
import { seminato } from './livello.js'
import { COSE } from '../dati/cose.js'

const mediana = v => { if (!v.length) return null; const s = [...v].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }

// la discesa la cui roba attesa è quella di un eroe di livello L: l'ultima che si entra a quel livello o sotto
const discesaDel = L => CAMPAGNA.reduce((u, _, k) => (livelloAtteso(k) <= L ? k : u), 0)

// i prezzi dei salti e dei sogni di un eroe di livello L (la roba attesa della sua discesa), sommando i mercanti che vestono
export function prezziAlLivello(eroe, L, seme = 1) {
  const k = discesaDel(L)
  const b = new Bottega({ eroe, roba: robaAttesa(eroe, k), finite: k, crescita: crescitaA(eroeDi(eroe), L), rnd: seminato(seme) })
  const salti = [], sogni = []
  for (const m of MERCANTI.filter(x => x.passo)) for (const r of b.mercanziaVista(m.chiave)) {
    if (r.ruolo === 'salto') salti.push(b.quantoCosta(r.chiave))
    else if (r.ruolo === 'sogno') sogni.push(b.quantoCosta(r.chiave))
  }
  return { salti, sogni }
}

// la tabella: per ogni livello, i salti di tutti gli eroi su alcuni semi (minimo · mediana · massimo) e la mediana dei sogni
export function tabellaDeiSalti({ eroi = ['cavaliere', 'elfa', 'mago', 'nano'], livelli = Array.from({ length: 14 }, (_, i) => i + 1), semi = [1, 2, 3] } = {}) {
  return livelli.map(L => {
    const salti = [], sogni = []
    for (const e of eroi) for (const s of semi) { const p = prezziAlLivello(e, L, s); salti.push(...p.salti); sogni.push(...p.sogni) }
    const ordinati = [...salti].sort((a, b) => a - b)
    return { livello: L, n: salti.length, minimo: ordinati[0] ?? null, primoQuarto: ordinati[Math.floor(ordinati.length / 4)] ?? null,
             mediana: mediana(salti), massimo: ordinati[ordinati.length - 1] ?? null, sogno: mediana(sogni) }
  })
}

// quante pozioni costa un pezzo utile (docs/sotterraneo/bottega.md, «Una spada costa quanto uno zaino pieno di pozioni»): per ogni livello il salto mediano
// diviso il prezzo della cura più grande che la guaritrice ha già sul banco (`dalla` discese finite) e della Pozione di mezzo
export function rapportoPezzoPozione({ semi = [1], livelli } = {}) {
  const cure = Object.entries(COSE).filter(([, c]) => c.usa === 'cura' && c.prezzo && !c.rarissimo && c.dalla != null).map(([k, c]) => ({ k, nome: c.nome, prezzo: c.prezzo, dalla: c.dalla }))
  const piccola = cure.reduce((a, c) => (c.prezzo < a.prezzo ? c : a)), mezzo = cure.find(c => c.k === 'pozione') || piccola
  return tabellaDeiSalti({ semi, livelli }).map(r => {
    const grande = cure.filter(c => c.dalla <= discesaDel(r.livello)).reduce((a, c) => (c.prezzo > a.prezzo ? c : a), piccola)
    return { livello: r.livello, salto: r.mediana, grande, piccola, ognuna: r.mediana / grande.prezzo, dellaPozione: r.mediana / mezzo.prezzo, mezzo }
  })
}
