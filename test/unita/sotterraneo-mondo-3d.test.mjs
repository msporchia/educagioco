/* ═══════════════════════════════════════════════════════════════════
   IL MONDO DI SOPRA IN 3D, LE PARTI PURE — docs/sotterraneo/mondo-3d.md

   Il mondo a percorso (504×300) si disegna a pezzi di 32×28 celle: si
   costruiscono i nove attorno all'eroe, uno per fotogramma, solo dove le
   zone attorno all'eroe sono caricate, e si buttano a due pezzi di
   distanza o quando una loro zona si carica o si scarica; ogni cosa sta
   in un pezzo solo. Le celle di una zona mai caricata si disegnano dalla
   loro base. La nebbia è due trame, un texel per cella. Il dito: una
   persona vince sul prato, col suo rettangolo di almeno 72×96 px. Il
   suolo dove si cammina, i ponti dei confini, il cartello del villaggio.
   ═══════════════════════════════════════════════════════════════════ */
import { scheletroDelMondo, caricaZona, scaricaZona, caricaTutto, zonaDi, zoneAttorno, baseDi } from '../../src/giochi/sotterraneo/motore/mondo-percorso.js'
import { frecceDelCartello, postiDi } from '../../src/giochi/sotterraneo/motore/mondo-sopra.js'
import { PEZZO, grigliaDi, pezzoDi, rettangoloDi, pezziAttorno, lavoroDeiPezzi, dividiPerPezzo, dividiLaZona, contenutoDelPezzo, zoneDelPezzo,
         costruibile, ancoraUguale, distanzaPezzi } from '../../src/giochi/sotterraneo/scena3d/mondo/pezzi.js'
import { rettangoloPersona, rettangoloPosto, sceltaDelTocco, personaVicina, aTerra, spartisciPersone, PERSONA } from '../../src/giochi/sotterraneo/scena3d/mondo/dito.js'
import { quotaA, quotaTerreno, quotaDellaCella, cellaDaDisegnare, pontiDi } from '../../src/giochi/sotterraneo/scena3d/mondo/suolo.js'
import { trameDellaNebbia, segnaScoperte, MAI } from '../../src/giochi/sotterraneo/scena3d/mondo/nebbia.js'
import { istanzeDelPezzo } from '../../src/giochi/sotterraneo/scena3d/mondo/natura.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const m = scheletroDelMondo()
caricaZona(m, 0)
const x0 = m.partenza.x + 0.5, z0 = m.partenza.y + 0.5

/* ── i pezzi ── */
const { nx, nz, n } = grigliaDi(m)
uguale('il mondo è 16×11 pezzi', `${nx}×${nz}`, '16×11')
uguale('un pezzo è 32×28 celle', `${PEZZO.largo}×${PEZZO.alto}`, '32×28')
uguale('l\'angolo in alto a sinistra è il pezzo 0', pezzoDi(m, 0.5, 0.5), 0)
uguale('quello in basso a destra l\'ultimo', pezzoDi(m, m.W - 0.5, m.H - 0.5), n - 1)
{
  const r = rettangoloDi(m, n - 1)
  uguale('l\'ultimo pezzo finisce col mondo', `${r.x1},${r.z1}`, `${m.W},${m.H}`)
  const attorno = pezziAttorno(m, x0, z0)
  uguale('attorno alla piazza ci sono nove pezzi', attorno.length, 9)
  uguale('il primo da costruire è quello dove sta l\'eroe', attorno[0], pezzoDi(m, x0, z0))
  const zone = zoneAttorno(m, zonaDi(m, m.partenza.x, m.partenza.y))
  const puo = p => costruibile(m, p, zone)
  // col bosco non caricato, i pezzi che lo toccano aspettano; quelli dei soli prati si fanno
  const costruiti = new Set()
  let giri = 0
  for (; giri < 20; giri++) { const l = lavoroDeiPezzi(m, costruiti, x0, z0, puo); if (l.costruisci == null) break; costruiti.add(l.costruisci) }
  controlla('uno per fotogramma, e solo quelli delle zone caricate', giri === costruiti.size && [...costruiti].every(p => zoneDelPezzo(m, p).filter(z => zone.includes(z)).every(z => m.zonaCaricata[z])))
  uguale('attorno alla piazza tutti e nove (oltre la cresta, la base)', costruiti.size, 9)
  const l = lavoroDeiPezzi(m, costruiti, 3, 3, puo)
  controlla('andando lontano si butta quello che sta a due pezzi', l.butta.length > 0 && l.butta.every(p => distanzaPezzi(m, p, 0) >= 2))
  uguale('e nell\'angolo, dove la sua zona non è caricata, non si costruisce niente', l.costruisci, null)
}
{
  // un pezzo dove il villaggio tocca i prati e il bosco: si costruisce solo col bosco caricato, e si rifà quando cambia
  const conBosco = [...Array(n).keys()].find(p => zoneDelPezzo(m, p).includes(0) && zoneDelPezzo(m, p).includes(1))
  controlla('c\'è un pezzo fra i prati e il bosco', conBosco != null)
  controlla('col bosco non caricato non si costruisce', !costruibile(m, conBosco, [0, 1]))
  const carichi = contenutoDelPezzo(m, conBosco).carichi
  caricaZona(m, 1)
  controlla('col bosco caricato sì', costruibile(m, conBosco, [0, 1]))
  controlla('e quello costruito prima va rifatto', !ancoraUguale(m, conBosco, carichi))
  const dopo = contenutoDelPezzo(m, conBosco).carichi
  controlla('rifatto, resta buono finché le zone non cambiano', ancoraUguale(m, conBosco, dopo))
  scaricaZona(m, 1)
  controlla('scaricato il bosco, si butta di nuovo', !ancoraUguale(m, conBosco, dopo))
}
{
  const parti = dividiPerPezzo(m)
  const conta = k => parti.reduce((s, p) => s + p[k].length, 0)
  uguale('ogni posto sta in un pezzo solo (il villaggio no: è un lotto intero)', conta('posti'), m.posti.filter(p => p.tipo !== 'citta').length)
  uguale('ogni ponte dei confini', conta('ponti'), m.confini.filter(q => q.tipo === 'ponte' && q.celle.length).length)
  controlla('i ponti sono quattro, i valichi due (nessuna grata)', conta('ponti') === 4 && m.confini.filter(q => q.tipo === 'valico').length === 2)
  const z = dividiLaZona(m, 0), c = m.carico[0]
  const tot = k => [...z.values()].reduce((s, q) => s + q[k].length, 0)
  uguale('ogni casa dei prati in un pezzo', tot('case'), c.case.length)
  uguale('ogni campo', tot('campi'), c.campi.length)
  uguale('ogni cosa del decoro', tot('decoro'), c.decoro.length)
  controlla('una casa sta nel pezzo del suo centro', [...z.entries()].every(([p, q]) => q.case.every(k => pezzoDi(m, k.x + k.w / 2, k.y + k.h / 2) === p)))
  uguale('una zona non caricata non mette niente', dividiLaZona(m, 4).size, 0)
}
{
  const p = pezzoDi(m, x0, z0), ist = istanzeDelPezzo(m, p, contenutoDelPezzo(m, p))
  let fuori = 0, tot = 0
  for (const v of Object.values(ist)) for (let i = 0; i < v.n; i++) { tot++; if (pezzoDi(m, v.m[i * 16 + 12], v.m[i * 16 + 14]) !== p) fuori++ }
  uguale('ogni istanza della natura sta nel suo pezzo (la nebbia la legge alla sua base)', fuori, 0)
  controlla('nel pezzo della piazza c\'è erba e qualche albero', (ist.erba || { n: 0 }).n > 100 && (ist.tondo || { n: 0 }).n > 0)
  nota(`${tot} istanze di natura nel pezzo della piazza`)
}

/* ── le celle non caricate si disegnano dalla base ── */
{
  const R = m.zone[4].rettangolo, x = Math.round((R.x0 + R.x1) / 2), y = Math.round((R.y0 + R.y1) / 2), k = y * m.W + x
  uguale('una cella delle ceneri non è scritta', m.zona[k], -1)
  dentro('la sua quota è quella della base', quotaDellaCella(m, k) - baseDi(m, x, y).quota, -1e-5, 1e-5)
  const c = cellaDaDisegnare(m, k)
  uguale('e il terreno pure', c.terreno, baseDi(m, x, y).terreno)
  controlla('con l\'habitat del suo luogo', typeof c.habitat === 'string' && c.habitat !== 'villaggio', c.habitat)
}

/* ── la nebbia: due trame, un texel per cella ── */
{
  const bit = new Uint8Array(m.W * m.H); bit[5] = 1
  const t = trameDellaNebbia(bit)
  uguale('una cella vista è piena', t.visto[5], 255)
  uguale('e vista da sempre (non risale)', t.quando[5] < 0, true)
  uguale('una mai vista è vuota', t.visto[6], 0)
  uguale('e «molto avanti»', t.quando[6], MAI)
  segnaScoperte([{ x: 6, y: 0 }], m.W, t, 12.5)
  uguale('scoperta adesso: piena', t.visto[6], 255)
  uguale('e col tempo della scoperta (sale dal terreno da lì)', t.quando[6], 12.5)
}

/* ── il dito ── */
{
  const r = rettangoloPersona(100, 300, 100, 270)
  controlla('il rettangolo di una persona è almeno 72×96', r.w >= PERSONA.largo && r.h >= PERSONA.alto, JSON.stringify(r))
  controlla('e tiene dentro i piedi', r.y + r.h >= 300 && r.x <= 100 && r.x + r.w >= 100)
  const posto = rettangoloPosto([[60, 320], [180, 320], [60, 200], [180, 200]])
  const b = [{ chiave: 'posto', tipo: 'posto', r: posto }, { chiave: 'persona', tipo: 'persona', r }]
  uguale('sopra un ingresso, la persona vince', sceltaDelTocco({ x: 100, y: 280 }, b).chiave, 'persona')
  uguale('fuori dalla persona, l\'ingresso', sceltaDelTocco({ x: 170, y: 210 }, b).chiave, 'posto')
  uguale('fuori da tutti, il prato', sceltaDelTocco({ x: 400, y: 600 }, b), null)
  // la ragazza del pozzo accanto alla bacheca: il «?» della bacheca resta della bacheca
  {
    const ragazza = { r: rettangoloPersona(322, 460, 322, 400), px: 322 }, bacheca = { r: { x: 321, y: 430, w: 56, h: 56 }, px: 349, cosa: true }
    spartisciPersone([bacheca, ragazza])
    controlla('una persona e la bacheca accanto si dividono a metà', ragazza.r.x + ragazza.r.w <= 335.5 && bacheca.r.x >= 335 && bacheca.r.x + bacheca.r.w === 377,
              JSON.stringify([ragazza.r, bacheca.r]))
    const davanti = { r: rettangoloPersona(349, 470, 349, 410), px: 349 }, dietro = { r: { x: 321, y: 430, w: 56, h: 56 }, px: 351, cosa: true }
    spartisciPersone([davanti, dietro])
    uguale('davanti alla bacheca la persona resta intera', davanti.r.w, PERSONA.largo)
  }
  const gente = [{ chiave: 'a', piede: { x: 10, y: 10 } }]
  uguale('un tocco sul prato vicino ai piedi è un tocco su di lei', (personaVicina({ x: 11.2, z: 10.6 }, gente) || {}).chiave, 'a')
  uguale('più in là no', personaVicina({ x: 13, z: 10.5 }, gente), null)
  const p = aTerra({ x: 5, y: 10, z: 0 }, { x: 0, y: -Math.SQRT1_2, z: Math.SQRT1_2 }, () => 0)
  controlla('il raggio del dito cade sul terreno', Math.abs(p.x - 5) < 0.01 && Math.abs(p.z - 10) < 0.05, JSON.stringify(p))
}

/* ── il suolo: sui ponti dei confini si cammina sul piano, non nell'acqua; anche prima di caricare la zona ── */
{
  const ponti = [...pontiDi(m).values()]
  uguale('i ponti sono quelli dei confini', ponti.length, 4)
  let sotto = 0
  for (const p of ponti) for (const c of p.q.celle) {
    const y = quotaA(m, c.x + 0.5, c.y + 0.5)
    if (y < p.quota - 0.01 || y > p.quota + p.arco + 0.01) sotto++
  }
  uguale('sul ponte l\'altezza è quella del piano (fra la riva e la cima dell\'arco)', sotto, 0)
  const casa = m.villaggio.case[0]
  dentro('una casa del villaggio sta sul terreno spianato', quotaTerreno(m, casa.x + 1, casa.y + 1), -1, 3)
  caricaTutto(m)
  let ora = 0
  for (const p of ponti) for (const c of p.q.celle) { const y = quotaA(m, c.x + 0.5, c.y + 0.5); if (y < p.quota - 0.01 || y > p.quota + p.arco + 0.01) ora++ }
  uguale('e così con tutte le zone caricate', ora, 0)
}

/* ── il cartello del villaggio: una freccia, la strada maestra ── */
{
  const f = frecceDelCartello(m, 'villaggio')
  uguale('una freccia sola', f.length, 1)
  uguale('con tutti i dungeon lungo la strada', f[0].posti.length, 14)
  uguale('un cartello, nel villaggio', postiDi(m, 'cartello').length, 1)
}

riassunto('il mondo di sopra in 3D')
