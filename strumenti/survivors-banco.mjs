// Il banco di Survivors: per ogni tappa, quante partite vince chi risponde
// bene e chi schiva a sprazzi, e com'è l'inizio (ferite e mostri in campo
// ai secondi di --soste). Senza browser, coi giocatori finti di
// motore/banco.js. Vedi docs/core/comandi.md.
//
//   node strumenti/survivors-banco.mjs                     tutte le tappe
//   node strumenti/survivors-banco.mjs --tappe 7,8,9 --volte 48 --seme 1000
//   node strumenti/survivors-banco.mjs --soste 20,40,60 --libero
//   node strumenti/survivors-banco.mjs --tappe 9 --carte    e le carte prese a fine partita
import { CAMPAGNA, LIBERO } from '../src/giochi/survivors/dati/campagna.js'
import { Regole, Partita } from '../src/giochi/survivors/motore/partita.js'
import { Pilota, caso } from '../src/giochi/survivors/motore/banco.js'

const arg = (nome, base) => {
  const i = process.argv.indexOf(`--${nome}`)
  return i < 0 ? base : process.argv[i + 1]
}
const volte = Number(arg('volte', 24))
const seme = Number(arg('seme', 0))
const soste = String(arg('soste', '30,60,90')).split(',').map(Number)
const scelte = arg('tappe', null)?.split(',').map(n => Number(n) - 1)
const tappe = [...CAMPAGNA.entries()].filter(([i]) => !scelte || scelte.includes(i))
const carte = process.argv.includes('--carte')
if (process.argv.includes('--libero')) tappe.push(['L', LIBERO])
const campo = { larghezza: 390, altezza: 620 }     // un telefono vero, come in misure/survivors

const PROFILI = {
  sa: { bravura: 1, esattezza: 0.95, mira: 0.65 },
  schiva: { bravura: 0.55, esattezza: 0.7, mira: 0.3 },
}

// una partita intera; alle soste si annotano ferite e folla
function partita(r, profilo, rnd) {
  const p = new Partita(r, { rnd, campo })
  const pilota = new Pilota({ rnd, ...profilo })
  const fine = Number.isFinite(r.durata) ? r.durata : Math.max(...soste)
  const viste = []
  while (!p.finita && p.tempo < fine) {
    if (p.inPausa) { pilota.rispondi(p); continue }
    pilota.guida(p, 1 / 30)
    p.avanza(1 / 30)
    p.svuotaEventi()
    while (viste.length < soste.length && p.tempo >= soste[viste.length])
      viste.push({ ferite: p.ferite, folla: p.nemici.length })
  }
  while (viste.length < soste.length) viste.push({ ferite: p.ferite, folla: 0, morto: true })
  return { vinta: p.vinta, viste, ferite: p.ferite, carte: { ...p.potenziamenti } }
}

const testa = ['tappa'.padEnd(26), 'cuori']
for (const nome of Object.keys(PROFILI)) {
  testa.push(`${nome}:vinte`)
  for (const s of soste) testa.push(`fer@${s}`)
  for (const s of soste) testa.push(`folla@${s}`)
}
console.log(testa.join('  '))
for (const [i, t] of tappe) {
  const r = new Regole(t)
  const fogli = []
  const riga = [`${i === 'L' ? 'L' : i + 1}. ${t.nome}`.padEnd(26), String(r.cuori).padStart(5)]
  for (const [k, profilo] of Object.entries(PROFILI)) {
    const rnd = caso(seme + 100 * (i === 'L' ? 99 : i) + (k === 'sa' ? 1 : 2))
    const tutte = Array.from({ length: volte }, () => partita(r, profilo, rnd))
    const media = f => tutte.reduce((a, x) => a + f(x), 0) / volte
    if (carte) {
      const somma = {}
      for (const x of tutte) for (const [c, n] of Object.entries(x.carte)) somma[c] = (somma[c] || 0) + n
      fogli.push(`  ${k}: ` + Object.entries(somma).sort((a, b) => b[1] - a[1])
        .map(([c, n]) => `${c} ${(n / volte).toFixed(1)}`).join(' · '))
    }
    riga.push(`${(media(x => x.vinta ? 1 : 0) * 100).toFixed(0)}%`.padStart(k.length + 6))
    for (let s = 0; s < soste.length; s++) riga.push(media(x => x.viste[s].ferite).toFixed(2).padStart(`fer@${soste[s]}`.length))
    for (let s = 0; s < soste.length; s++) riga.push(media(x => x.viste[s].folla).toFixed(0).padStart(`folla@${soste[s]}`.length))
  }
  console.log(riga.join('  '))
  for (const f of fogli) console.log(f)
}
