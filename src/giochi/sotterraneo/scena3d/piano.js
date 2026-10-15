// Un piano in 3D: quando il motore ne fa uno nuovo (si scende, si sale, si riprende), si costruisce qui tutto quello che sta
// fermo — il terreno, i relitti, le pozze, le fiamme delle torce e dei bracieri, la fonte e il portale modellati, le botti, la
// nebbia — e le cose che fanno luce (`sorgenti`, per la riserva fissa di scena3d/luci.js). Si butta tutto col piano dopo.
import { Vector3, Color } from 'three'
import { aspettoDi } from './aspetti.js'
import { piantaDi } from './pianta.js'
import { nuovaVisibilita } from './visibilita.js'
import { conMaschera } from './maschera.js'
import { creaTerreno } from './terreno.js'
import { creaRelitti } from './relitti.js'
import { creaPozze } from './acqua.js'
import { creaFiamme } from './segni.js'
import { creaFontana } from './fontana.js'
import { creaPortale } from './portale.js'
import { creaBotti, postiDelleBotti } from './botti.js'
import { creaNebbia } from './particelle.js'
import { FETTE, ACCESI } from './costanti.js'

// `trameDi(aspetto)`: le trame dello scenario (si fanno una volta e si tengono), `legno`: quella delle botti
export function costruisciPiano(scena, corsa, { maschera, luci, trameDi, legno }) {
  const liv = corsa.livello
  const aspetto = aspettoDi(corsa.scenario)
  const trame = trameDi(aspetto)
  const pianta = piantaDi(liv)
  const vis = nuovaVisibilita(pianta.W, pianta.H, pianta.pavimento)
  maschera.metti(vis)
  luci.aspetto(aspetto)
  const via = []
  const terreno = creaTerreno(scena, { pianta, aspetto, trame, maschera }); via.push(terreno.via)
  via.push(creaRelitti(scena, liv.relitti || [], corsa.scenario, maschera).via)
  const pozze = creaPozze(scena, pianta.acqua, luci.condivise, maschera, aspetto); via.push(pozze.via)

  // i fuochi: le torce a muro e l'arredo che arde (bracieri, candelabri, lanterne). Una fiamma ciascuno e una luce che trema
  const colore = new Color(aspetto.torcia)
  const fuochi = []
  for (const t of pianta.torce) fuochi.push({ x: t.x + 0.5, y: 0.84, z: t.y + 1.14, scala: 1.4, cx: t.x, cz: t.y + 1, luce: new Vector3(t.x + 0.5, 1.0, t.y + 1.3), forza: 4.5, muro: true })
  for (const r of liv.robe) if (r.che === 'arredo' && r.arde) fuochi.push({ x: r.x + 0.5, y: 0.5, z: r.y + 0.55, scala: 1.2, cx: r.x, cz: r.y, luce: new Vector3(r.x + 0.5, 0.95, r.y + 0.6), forza: 5 })
  const fiamme = ACCESI.fiamme ? creaFiamme(scena, maschera, fuochi) : { aggiorna() {}, accesa() {}, via() {} }
  via.push(fiamme.via)
  const sorgenti = fuochi.map(f => ({ pos: f.luce, colore, forza: f.forza, vis: 0, seme: Math.random() * 100, trema: true, raggio: 7, cella: f.cz * pianta.W + f.cx }))

  // la fonte e il portale, modellati; il loro stato è del motore (la fonte bevuta resta secca)
  const fonte = liv.robe.find(r => r.che === 'fonte')
  const fontana = fonte ? creaFontana(scena, { cella: fonte, condivise: luci.condivise, trama: trame.pav, conMaschera, maschera, aspetto, vuota: !!fonte.morto }) : null
  if (fontana) { fontana.roba = fonte; via.push(fontana.via); sorgenti.push(fontana.luce) }
  const rp = liv.robe.find(r => r.che === 'portale')
  const portale = rp ? creaPortale(scena, { cella: rp, conMaschera, maschera, trama: trame.pav }) : null
  if (portale) { portale.roba = rp; via.push(portale.via); sorgenti.push(portale.luce) }

  if (ACCESI.botti && aspetto.botti) {
    const seme = (corsa.piano + 1) * 7919 + liv.largo * 31 + liv.alto
    via.push(creaBotti(scena, { posti: postiDelleBotti(pianta, liv.stanze || [], liv.robe, seme), legno: legno(), conMaschera, maschera }).via)
  }
  const nebbia = creaNebbia(scena, pianta.W, pianta.H, ACCESI.nebbia ? FETTE : 0, luci.condivise, maschera, aspetto); via.push(nebbia.via)

  // dove nello scontro non si mette nessuno: l'arredo, la fonte e il portale modellati (sono cose posate, non pavimento libero;
  // i relitti e l'acqua non sono pavimento già da sé)
  const ingombri = new Set()
  for (const r of liv.robe) if (r.che === 'arredo' || r.che === 'fonte' || r.che === 'portale') ingombri.add(pianta.id(r.x, r.y))
  return {
    liv, scenario: corsa.scenario, aspetto, pianta, vis, terreno, pozze, fiamme, fuochi, sorgenti, fontana, portale, nebbia, ingombri,
    // le torce che stanno su un muro abbassato per lo scontro si spengono, e tornano
    torcia(i, su) { fiamme.accesa(i, su); if (sorgenti[i]) sorgenti[i].forza = su ? fuochi[i].forza : 0 },
    via() { for (const f of via) f() },
  }
}
