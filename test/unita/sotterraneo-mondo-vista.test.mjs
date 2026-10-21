/* ═══════════════════════════════════════════════════════════════════
   LA VISTA DEL MONDO DI SOPRA — docs/sotterraneo/mondo-3d-telecamera.md

   Un dito che oltre i 16 px scorre sposta la vista (l'eroe non la
   segue), due dita zoomano, un tocco cammina. La vista libera resta
   nel mondo e a 40 celle dall'eroe; lo zoom mostra da poco meno di
   quanto si vede di norma a non più di 28 celle in largo. Le zone e i
   pezzi si tengono anche attorno a dove si guarda, mai solo là.
   ═══════════════════════════════════════════════════════════════════ */
import { scheletroDelMondo, caricaZona } from '../../src/giochi/sotterraneo/motore/mondo-percorso.js'
import { creaVeduta, limitaVista, limitiZoom, zoomLimitato, larghezzaVista, VISTA, LONTANO, MARGINE } from '../../src/giochi/sotterraneo/scena3d/mondo/veduta.js'
import { eTrascinare, zoomDaPizzico } from '../../src/giochi/sotterraneo/scena3d/mondo/dito.js'
import { pezzoDi, lavoroDeiPezziVista, lavoroDeiPezzi, distanzaPezzi } from '../../src/giochi/sotterraneo/scena3d/mondo/pezzi.js'
import { Vector3 } from 'three'
import { controlla, uguale, dentro, riassunto } from '../aiuto/verifica.mjs'

const m = scheletroDelMondo()
caricaZona(m, 0)

/* ── il gesto: sotto i 16 px è un tocco, oltre è un trascinare ── */
controlla('15 px sono ancora un tocco', !eTrascinare(100, 100, 100, 115))
controlla('17 px sono un trascinare', eTrascinare(100, 100, 100, 117))
controlla('in diagonale conta la distanza vera', eTrascinare(0, 0, 12, 12) && !eTrascinare(0, 0, 10, 10))

/* ── il pizzico ── */
uguale('dita che si allontanano: la telecamera si avvicina', zoomDaPizzico(1, 100, 200), 0.5)
uguale('dita che si avvicinano: si allontana', zoomDaPizzico(1, 200, 100), 2)
controlla('due dita sullo stesso punto non dividono per zero', Number.isFinite(zoomDaPizzico(1, 100, 0)))

/* ── i limiti dello zoom ── */
{
  const l = limitiZoom(15)   // un telefono in piedi vede 15 celle a zoom 1
  uguale('il più vicino è 0,8', l.min, VISTA.zoomMin)
  dentro('il più lontano arriva a 28 celle in largo', 15 * l.max, 27.9, 28.1)
  uguale('uno schermo che già vede più di 28 non si allontana', limitiZoom(30).max, 1)
  uguale('sotto il minimo si ferma', zoomLimitato(0.1, 15), l.min)
  uguale('sopra il massimo si ferma', zoomLimitato(50, 15), l.max)
  uguale('in mezzo resta com\'è', zoomLimitato(1.2, 15), 1.2)
}

/* ── la vista libera sta nel mondo e vicino all'eroe ── */
{
  const eroe = { x: 100, z: 100 }
  const a = limitaVista(100 + LONTANO + 50, 100, eroe, m.W, m.H)
  uguale('non più di 40 celle dall\'eroe (x)', a.x, 100 + LONTANO)
  const b = limitaVista(100, 100 - LONTANO - 9, eroe, m.W, m.H)
  uguale('non più di 40 celle dall\'eroe (z)', b.z, 100 - LONTANO)
  const c = limitaVista(-30, -30, { x: 5, z: 5 }, m.W, m.H)
  uguale('non esce dal mondo: il margine a ovest', c.x, MARGINE)
  uguale('il margine a nord', c.z, MARGINE)
  const d = limitaVista(m.W + 30, m.H + 30, { x: m.W - 5, z: m.H - 5 }, m.W, m.H)
  uguale('il margine a est', d.x, m.W - MARGINE)
  uguale('il margine a sud', d.z, m.H - MARGINE)
  const e = limitaVista(110, 95, eroe, m.W, m.H)
  uguale('dentro i limiti non si tocca', `${e.x},${e.z}`, '110,95')
}

/* ── la telecamera: trascinare sposta il centro e non l'eroe; segui la riporta ── */
{
  const cam = creaVeduta(m, () => 0)
  cam.misura(390, 760)
  cam.copri(100, 140)
  const eroe = new Vector3(60, 0, 60)
  for (let i = 0; i < 60; i++) cam.aggiorna(0.05, eroe, false, null)
  controlla('di norma segue l\'eroe', !cam.libera.on)
  const x0 = cam.camera.position.x
  cam.trascina(-8, 0, eroe)   // il terreno scorre a sinistra di 8 celle: la vista va a destra
  controlla('trascinando la vista si stacca', cam.libera.on)
  dentro('e va dove il dito la porta', cam.libera.x, 67.9, 68.1)
  cam.aggiorna(0.001, eroe, false, null)
  dentro('la telecamera si sposta subito, senza ritardo', cam.camera.position.x - x0, 7.5, 8.5)
  for (let i = 0; i < 80; i++) cam.aggiorna(0.05, eroe, false, null)
  dentro('e resta lì mentre l\'eroe sta fermo', cam.camera.position.x - x0, 7.5, 8.5)
  cam.trascina(-200, 0, eroe)
  uguale('non va oltre i 40 celle', cam.libera.x, 60 + LONTANO)
  eroe.x = 400   // l'eroe cammina lontano: la vista libera lo segue a distanza, non resta indietro nel vuoto
  cam.aggiorna(0.05, eroe, false, null)
  dentro('se l\'eroe se ne va la vista non resta più di 40 celle indietro', eroe.x - cam.libera.x, 0, LONTANO + 0.01)
  cam.segui()
  controlla('segui riporta la vista all\'eroe', !cam.libera.on)
  cam.trascina(1, 1, eroe)
  cam.aggiorna(0.05, eroe, true, null)
  controlla('aprendo la veduta d\'insieme la vista libera si spegne', !cam.libera.on)
}

/* ── lo zoom: tra i limiti, e lo schermo girato li ricalcola ── */
{
  const cam = creaVeduta(m, () => 0)
  cam.misura(390, 760); cam.copri(100, 140)
  const eroe = new Vector3(60, 0, 60)
  cam.aggiorna(0.05, eroe, false, null)
  cam.salta(); cam.aggiorna(0.05, eroe, false, null)
  const l = cam.limitiZoom
  dentro('a zoom 1 un telefono in piedi vede almeno 15 celle', cam.celleInLargo, 15, 30)
  cam.zoom = 99
  controlla('lo zoom si ferma al massimo', cam.zoom === l.max && l.max > 1.2)
  for (let i = 0; i < 200; i++) cam.aggiorna(0.05, eroe, false, null)
  dentro('lontano al massimo non vede più di ~28 celle', cam.celleInLargo, 20, 29)
  cam.zoom = 0.01
  for (let i = 0; i < 200; i++) cam.aggiorna(0.05, eroe, false, null)
  dentro('vicino al minimo vede meno di prima', cam.celleInLargo, 8, 15)
  controlla('e il minimo non è sotto 0,8', cam.zoom === VISTA.zoomMin)
  cam.misura(900, 500)   // il telefono girato
  cam.aggiorna(0.05, eroe, false, null)
  controlla('girando lo schermo lo zoom resta nei limiti nuovi', cam.zoom >= cam.limitiZoom.min && cam.zoom <= cam.limitiZoom.max)
  dentro('larghezzaVista sa la geometria', larghezzaVista(40, 34, 1), 24, 25)
}

/* ── i pezzi e le zone seguono la vista, ma il pezzo dell'eroe non si butta ── */
{
  const eroe = { x: m.partenza.x + 0.5, z: m.partenza.y + 0.5 }
  const suo = pezzoDi(m, eroe.x, eroe.z)
  const fuoco = { x: Math.min(m.W - 5, eroe.x + 40), z: eroe.z }
  const lontano = pezzoDi(m, fuoco.x, fuoco.z)
  uguale('senza fuoco è come sempre', JSON.stringify(lavoroDeiPezziVista(m, new Set(), eroe, null)), JSON.stringify(lavoroDeiPezzi(m, new Set(), eroe.x, eroe.z)))
  const costruiti = new Set()
  for (let i = 0; i < 30; i++) { const l = lavoroDeiPezziVista(m, costruiti, eroe, fuoco); if (l.costruisci == null) break; costruiti.add(l.costruisci) }
  controlla('si costruisce il pezzo dell\'eroe', costruiti.has(suo))
  controlla('e quelli attorno a dove si guarda', costruiti.has(lontano))
  let l = lavoroDeiPezziVista(m, costruiti, eroe, fuoco)
  controlla('il pezzo dell\'eroe non si butta mai', !l.butta.includes(suo))
  controlla('nessuno di quelli attorno a dove si guarda si butta', l.butta.every(p => distanzaPezzi(m, p, lontano) >= 2))
  l = lavoroDeiPezziVista(m, new Set([...costruiti, 0]), eroe, fuoco)
  controlla('un pezzo lontano da tutti e due si butta', l.butta.includes(0) || distanzaPezzi(m, 0, lontano) < 2)
}

riassunto('la vista del mondo di sopra')
