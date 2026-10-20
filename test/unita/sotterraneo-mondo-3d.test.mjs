/* ═══════════════════════════════════════════════════════════════════
   IL MONDO DI SOPRA IN 3D, LE PARTI PURE — docs/sotterraneo/grafica-3d.md

   Il mondo generato si disegna a pezzi (32×28 celle): si costruiscono i
   nove attorno all'eroe, uno per fotogramma, e si buttano a due pezzi di
   distanza; ogni cosa sta in un pezzo solo. La nebbia è due trame, un
   texel per cella. Il dito: una persona vince sul prato, col suo
   rettangolo di almeno 72×96 px. Il suolo dove si cammina e dove cade
   il tocco. Il cartello indica i passaggi coi posti oltre.
   ═══════════════════════════════════════════════════════════════════ */
import { ilMondo, frecceDelCartello, postiDi } from '../../src/giochi/sotterraneo/motore/mondo-sopra-anelli.js'
import { PEZZO, grigliaDi, pezzoDi, rettangoloDi, pezziAttorno, lavoroDeiPezzi, dividiPerPezzo, distanzaPezzi } from '../../src/giochi/sotterraneo/scena3d/mondo/pezzi.js'
import { rettangoloPersona, rettangoloPosto, sceltaDelTocco, personaVicina, aTerra, PERSONA } from '../../src/giochi/sotterraneo/scena3d/mondo/dito.js'
import { quotaA, quotaTerreno, pontiDi } from '../../src/giochi/sotterraneo/scena3d/mondo/suolo.js'
import { trameDellaNebbia, segnaScoperte, MAI } from '../../src/giochi/sotterraneo/scena3d/mondo/nebbia.js'
import { istanzeDelMondo } from '../../src/giochi/sotterraneo/scena3d/mondo/natura.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const m = ilMondo()

/* ── i pezzi ── */
const { nx, nz, n } = grigliaDi(m)
uguale('il mondo è 5×5 pezzi', `${nx}×${nz}`, '5×5')
uguale('un pezzo è una regione di misura', `${PEZZO.largo}×${PEZZO.alto}`, `${m.W / 5}×${m.H / 5}`)
uguale('l\'angolo in alto a sinistra è il pezzo 0', pezzoDi(m, 0.5, 0.5), 0)
uguale('quello in basso a destra l\'ultimo', pezzoDi(m, m.W - 0.5, m.H - 0.5), n - 1)
{
  const x = m.partenza.x + 0.5, z = m.partenza.y + 0.5, qui = pezzoDi(m, x, z)
  const attorno = pezziAttorno(m, x, z)
  uguale('attorno alla piazza ci sono nove pezzi', attorno.length, 9)
  uguale('il primo da costruire è quello dove sta l\'eroe', attorno[0], qui)
  const costruiti = new Set()
  let giri = 0
  for (; giri < 20; giri++) { const l = lavoroDeiPezzi(m, costruiti, x, z); if (l.costruisci == null) break; costruiti.add(l.costruisci) }
  uguale('uno per fotogramma: in nove giri ci sono tutti', giri, 9)
  // l'eroe va all'angolo: i pezzi lontani due o più si buttano, e se ne costruisce uno solo
  const l = lavoroDeiPezzi(m, costruiti, 3, 3)
  controlla('andando lontano si butta quello che sta a due pezzi', l.butta.length > 0 && l.butta.every(p => distanzaPezzi(m, p, 0) >= 2))
  uguale('e si costruisce il pezzo dell\'eroe per primo', l.costruisci, 0)
  const r = rettangoloDi(m, n - 1)
  uguale('l\'ultimo pezzo finisce col mondo', `${r.x1},${r.z1}`, `${m.W},${m.H}`)
}
{
  const parti = dividiPerPezzo(m)
  const conta = k => parti.reduce((s, p) => s + p[k].length, 0)
  uguale('ogni casa sta in un pezzo solo', conta('case'), m.case.length)
  uguale('ogni campo', conta('campi'), m.campi.length)
  uguale('ogni cosa del decoro', conta('decoro'), m.decoro.length)
  uguale('ogni posto (le città no: sono una zona)', conta('posti'), m.posti.filter(p => p.tipo !== 'citta').length)
  uguale('ogni ponte', conta('ponti'), m.passaggi.filter(q => q.tipo === 'ponte' && q.celle && q.celle.length).length)
  uguale('ogni grata', conta('grate'), m.passaggi.filter(q => q.conGrata && q.celle && q.celle.length).length)
  controlla('una casa sta nel pezzo del suo centro', parti.every((p, i) => p.case.every(c => pezzoDi(m, c.x + c.w / 2, c.y + c.h / 2) === i)))
}
{
  const ist = istanzeDelMondo(m)
  uguale('le istanze sono divise nei 25 pezzi', ist.length, n)
  let fuori = 0, tot = 0
  ist.forEach((l, p) => { for (const v of Object.values(l)) for (let i = 0; i < v.n; i++) { tot++; if (pezzoDi(m, v.m[i * 16 + 12], v.m[i * 16 + 14]) !== p) fuori++ } })
  uguale('ogni istanza sta nel suo pezzo (la nebbia la legge alla sua base)', fuori, 0)
  nota(`${tot} istanze di natura in tutto il mondo`)
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
  const gente = [{ chiave: 'a', piede: { x: 10, y: 10 } }]
  uguale('un tocco sul prato vicino ai piedi è un tocco su di lei', (personaVicina({ x: 11.2, z: 10.6 }, gente) || {}).chiave, 'a')
  uguale('più in là no', personaVicina({ x: 13, z: 10.5 }, gente), null)
  const p = aTerra({ x: 5, y: 10, z: 0 }, { x: 0, y: -Math.SQRT1_2, z: Math.SQRT1_2 }, () => 0)
  controlla('il raggio del dito cade sul terreno', Math.abs(p.x - 5) < 0.01 && Math.abs(p.z - 10) < 0.05, JSON.stringify(p))
}

/* ── il suolo: sui ponti si cammina sul piano, non nell'acqua ── */
{
  const ponti = [...pontiDi(m).values()]
  controlla('ci sono i ponti', ponti.length >= 10, ponti.length)
  let sotto = 0
  for (const p of ponti) for (const c of p.q.celle) {
    const y = quotaA(m, c.x + 0.5, c.y + 0.5)
    if (y < p.quota - 0.01 || y > p.quota + p.arco + 0.01) sotto++
  }
  uguale('sul ponte l\'altezza è quella del piano (fra la riva e la cima dell\'arco)', sotto, 0)
  const casa = m.case[0]
  dentro('una casa sta sul terreno spianato', quotaTerreno(m, casa.x + 1, casa.y + 1), -1, 3)
}

/* ── il cartello: una freccia per passaggio, coi posti che ci stanno oltre ── */
{
  const f = frecceDelCartello(m, 'villaggio')
  uguale('il villaggio ha due ponti: due frecce', f.map(x => x.verso).sort().join(''), ['↑', '↓'].sort().join(''))
  const tutte = f.flatMap(x => x.regioni)
  uguale('fra le due, tutte le regioni fuori dal villaggio', new Set(tutte).size, m.regioni.length - 1)
  controlla('la cripta dei re sta oltre il ponte del nord', f.find(x => x.verso === '↑').posti.includes('altare'))
  for (const c of ['forte', 'rifugio']) controlla(`il cartello del ${c} ha almeno due frecce`, frecceDelCartello(m, c).length >= 2)
  uguale('tre cartelli, uno per città', postiDi(m, 'cartello').length, 3)
}

riassunto('il mondo di sopra in 3D')
