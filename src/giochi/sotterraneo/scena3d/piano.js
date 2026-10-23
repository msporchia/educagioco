// Un piano in 3D: quando il motore ne fa uno nuovo (si scende, si sale, si riprende), si costruisce qui tutto quello che sta
// fermo — il terreno, i relitti, le pozze, le fiamme delle torce e dei bracieri, la fonte e il portale modellati, le botti, la
// nebbia — e le cose che fanno luce (`sorgenti`, per la riserva fissa di scena3d/luci.js). Si butta tutto col piano dopo.
import { Vector3, Color } from 'three'
import { aspettoDi, paesaggioDi } from './aspetti.js'
import { piantaDi } from './pianta.js'
import { nuovaVisibilita } from './visibilita.js'
import { conMaschera } from './maschera.js'
import { creaTerreno } from './terreno.js'
import { creaRelitti } from './relitti.js'
import { creaPozze } from './acqua.js'
import { creaFiamme } from './segni.js'
import { creaFontana } from './fontana.js'
import { creaPortale } from './portale.js'
import { creaBotti } from './botti.js'
import { BOTTI_PER_PAESAGGIO } from '../dati/botti.js'
import { creaNebbia } from './particelle.js'
import { creaArredo3d } from './arredo3d.js'
import { creaRaggi, postiDeiRaggi } from './raggi.js'
import { FETTE, ACCESI } from './costanti.js'
import { profilo } from '../../../store/qualita.js'
import { segnaNuovi } from '../../../grafica/elementi3d.js'

// `trameDi(aspetto)`: le trame dello scenario (si fanno una volta e si tengono), `legno`: quella delle botti
export function costruisciPiano(scena, corsa, { maschera, luci, trameDi, legno, polvere = null }) {
  const liv = corsa.livello
  const paesaggio = paesaggioDi(corsa)
  const aspetto = aspettoDi(paesaggio)
  const seme = (corsa.piano + 1) * 7919 + liv.largo * 31 + liv.alto
  const trame = trameDi(aspetto)
  const pianta = piantaDi(liv)
  const vis = nuovaVisibilita(pianta.W, pianta.H, pianta.pavimento)
  maschera.metti(vis)
  luci.aspetto(aspetto)
  if (polvere) polvere.aspetto(aspetto)
  const via = []
  const terreno = creaTerreno(scena, { pianta, aspetto, trame, maschera, seme }); via.push(terreno.via)
  // gli elementi (grafica/elementi3d.js): chi pesa si misura spegnendone uno alla volta; i relitti e l'acqua stanno col pavimento
  const el = (nome, fai) => segnaNuovi(scena, nome, fai)
  via.push(el('arredo', () => creaRelitti(scena, liv.relitti || [], corsa.scenario, maschera)).via)
  const pozze = el('pavimento', () => creaPozze(scena, pianta.acqua, luci.condivise, maschera, aspetto)); via.push(pozze.via)
  // il tempio sommerso: l'acqua bassa su tutto il pavimento
  const velo = aspetto.velo ? el('pavimento', () => creaPozze(scena, pianta.pavimento.filter(c => pianta.calpestabile(c.x, c.y)), luci.condivise, maschera, aspetto, aspetto.velo)) : null
  if (velo) via.push(velo.via)

  // i fuochi: le torce a muro e l'arredo che arde (bracieri, candelabri, lanterne). Una fiamma ciascuno e una luce che trema
  const colore = new Color(aspetto.torcia)
  const fuochi = []
  // sulla faccia vera del muro (le pareti di roccia rientrano e sporgono)
  pianta.torce.forEach((t, i) => { const f = terreno.facce[i]; fuochi.push({ x: f.x, y: 0.84, z: f.z + 0.14, scala: 1.4, cx: t.x, cz: t.y + 1, luce: new Vector3(f.x, 1.0, f.z + 0.3), forza: 4.5, muro: true }) })
  for (const r of liv.robe) if (r.che === 'arredo' && r.arde) fuochi.push({ x: r.x + 0.5, y: 0.5, z: r.y + 0.55, scala: 1.2, cx: r.x, cz: r.y, luce: new Vector3(r.x + 0.5, 0.95, r.y + 0.6), forza: 5 })
  const fiamme = ACCESI.fiamme ? el('fiamme', () => creaFiamme(scena, maschera, fuochi, aspetto.fiamma)) : { aggiorna() {}, accesa() {}, via() {} }
  via.push(fiamme.via)
  const sorgenti = fuochi.map(f => ({ pos: f.luce, colore, forza: f.forza, vis: 0, seme: Math.random() * 100, trema: true, raggio: 7, cella: f.cz * pianta.W + f.cx }))

  // la fonte e il portale, modellati; il loro stato è del motore (la fonte bevuta resta secca)
  const fonte = liv.robe.find(r => r.che === 'fonte')
  const fontana = fonte ? el('arredo', () => creaFontana(scena, { cella: fonte, condivise: luci.condivise, trama: trame.muro, conMaschera, maschera, aspetto, vuota: !!fonte.morto })) : null
  if (fontana) { fontana.roba = fonte; via.push(fontana.via); sorgenti.push(fontana.luce) }
  // i portali: quello fisso del piano, e quello della pergamena, che si apre (e se ne va) mentre si gioca: `sincronizzaPortali`
  const portali = []
  const nuovoPortale = (r, { apri = false } = {}) => {
    const p = el('arredo', () => creaPortale(scena, { cella: r, conMaschera, maschera, trama: trame.muro }))
    p.roba = r
    if (apri) p.apri()
    portali.push(p); sorgenti.push(p.luce)
    return p
  }
  for (const r of liv.robe) if (r.che === 'portale') nuovoPortale(r)
  via.push(() => { for (const p of portali) p.via() })

  // l'arredo del paesaggio (scena3d/arredo3d.js): chi fa luce entra nella riserva dei fuochi
  let arredo = null
  if (ACCESI.arredo) {
    arredo = el('arredo', () => creaArredo3d(scena, { pianta, liv, aspetto, seme, trame, legno: legno(), conMaschera, maschera, sposta: terreno.sposta }))
    via.push(arredo.via); sorgenti.push(...arredo.luci)
  }
  const raggi = aspetto.raggi ? el('arredo', () => creaRaggi(scena, { posti: postiDeiRaggi(pianta, liv.stanze, seme), maschera, colore: aspetto.raggi.colore, forza: aspetto.raggi.forza })) : null
  if (raggi) via.push(raggi.via)
  // le botti da rompere: le decide il motore (motore/botti.js), solo dove hanno senso e solo in alcune stanze
  const posti = ACCESI.botti && corsa.bottiQui ? corsa.bottiQui() : []
  const botti = el('arredo', () => creaBotti(scena, { posti, legno: posti.length ? legno() : null, conMaschera, maschera, regola: BOTTI_PER_PAESAGGIO[paesaggio] || null }))
  via.push(botti.via)
  // senza `nebbiaFitta` (la fascia bassa) una fetta sola
  // con la luce per vertice nessuna: la nebbia è un termine dei vertici del piano, densa quanto le fette che sostituisce
  const fitte = ACCESI.nebbia ? Math.min(FETTE, profilo('sotterraneo').fetteNebbia) : 0
  const fette = ACCESI.lucePerVertice ? 0 : ACCESI.nebbiaFitta ? fitte : Math.min(1, fitte)
  luci.vertice.nebbia(aspetto, fitte)
  const nebbia = el('nebbia', () => creaNebbia(scena, pianta.W, pianta.H, fette, luci.condivise, maschera, aspetto, fette ? fitte / fette : 1)); via.push(nebbia.via)

  // dove nello scontro non si mette nessuno: l'arredo, la fonte e il portale modellati (sono cose posate, non pavimento libero;
  // i relitti e l'acqua non sono pavimento già da sé)
  const ingombri = new Set()
  for (const r of liv.robe) if (r.che === 'arredo' || r.che === 'fonte' || r.che === 'portale') ingombri.add(pianta.id(r.x, r.y))
  for (const b of botti.botti) if (!b.rotta) ingombri.add(pianta.id(b.cella.x, b.cella.y))
  return {
    liv, scenario: corsa.scenario, paesaggio, aspetto, pianta, vis, terreno, pozze, velo, raggi, arredo, botti, fiamme, fuochi, sorgenti, fontana, portali, nebbia, ingombri,
    get portale() { return portali[0] || null },
    portaleDi(r) { return portali.find(p => p.roba === r) || null },
    // a ogni fotogramma: un portale nuovo nel motore (la pergamena) nasce accendendosi, uno sparito (lasciato il piano) se ne va
    sincronizzaPortali() {
      for (const r of liv.robe) if (r.che === 'portale' && !portali.some(p => p.roba === r)) nuovoPortale(r, { apri: true })
      for (let i = portali.length - 1; i >= 0; i--) {
        const p = portali[i]
        if (liv.robe.includes(p.roba)) continue
        p.via(); portali.splice(i, 1)
        const k = sorgenti.indexOf(p.luce); if (k >= 0) sorgenti.splice(k, 1)
      }
    },
    // le torce che stanno su un muro abbassato per lo scontro si spengono, e tornano
    torcia(i, su) { fiamme.accesa(i, su); if (sorgenti[i]) sorgenti[i].forza = su ? fuochi[i].forza : 0 },
    via() { for (const f of via) f() },
  }
}
