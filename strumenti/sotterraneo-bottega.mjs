// Il banco di un mercante di sopra stampato per un eroe: cosa ha addosso, e per ogni linguetta i pezzi in vista col
// livello, la rarità, il prezzo, di quanto alzano (il punteggio con cui il gioco dice «meglio») e se l'eroe li regge già.
// È lo strumento per guardare il banco senza aprire il gioco (docs/sotterraneo/bottega.md). La roba addosso è quella
// attesa dalla storia a quella discesa, o con --raro un pezzo raro di ogni posto al livello dell'eroe.
//
//   npm run bottega -- --eroe cavaliere --livello 12 --raro      # i mercanti che vestono (fabbro, incantatrice, mercante), il cavaliere al 12 con roba rara
//   npm run bottega -- --eroe mago --livello 5 --finite 2        # con la roba attesa dopo due discese
//   npm run bottega -- --livello 12 --raro --poi 13              # e il banco dopo essere salito al 13 (si rinnova solo se serve)
//   npm run bottega -- --livello 12 --raro --giro                # e dopo una discesa finita (il banco ruota)
//   npm run bottega -- --eroe elfa --livello 1 --nudo            # un eroe senza niente addosso
//   npm run bottega -- --seme 7 --gemme 500 --mercante incantatrice
import { COSE } from '../src/giochi/sotterraneo/dati/cose.js'
import { MERCANTI, schedaDi, schedeDi } from '../src/giochi/sotterraneo/dati/mercanti.js'
import { Bottega, alGiroNuovo, robaRaraDi } from '../src/giochi/sotterraneo/motore/bottega.js'
import { ROBA_VUOTA } from '../src/giochi/sotterraneo/motore/corredo.js'
import { robaAttesa, crescitaAttesa } from '../src/giochi/sotterraneo/motore/storia.js'
import { eroeDi } from '../src/giochi/sotterraneo/dati/eroi.js'
import { crescitaA } from '../src/giochi/sotterraneo/motore/crescita.js'
import { seminato } from '../src/giochi/sotterraneo/motore/livello.js'

const arg = (nome, difetto) => {
  const i = process.argv.indexOf(`--${nome}`)
  if (i < 0) return difetto
  const v = process.argv[i + 1]
  return v === undefined || v.startsWith('--') ? true : v
}
const eroe = arg('eroe', 'cavaliere')
const livello = Number(arg('livello', 12))
const finite = Number(arg('finite', 3))
const seme = Number(arg('seme', 1))
const gemme = Number(arg('gemme', 0))
const poi = arg('poi', null)
const soloMercante = arg('mercante', null)

const roba = arg('nudo', false) ? { ...ROBA_VUOTA(), gemme } : arg('raro', false) ? robaRaraDi(eroe, livello, { gemme, rnd: seminato(seme) }) : { ...robaAttesa(eroe, finite), gemme }
const crescita = arg('livello', null) != null ? crescitaA(eroeDi(eroe), livello) : crescitaAttesa(eroe, finite)

function stampa(b, titolo) {
  console.log(`\n=== ${titolo} · ${eroe} livello ${b.livelloEroe} · ${b.gemme} gemme ===`)
  const nome = k => (k ? `${COSE[k].nome} (${COSE[k].rarita || 'comune'} L${COSE[k].liv || 1})` : '—')
  console.log(`addosso: mano ${nome(b.mano)} · mancina ${nome(b.mancina)} · corpo ${nome(b.corpo)} · dito ${nome(b.dito)}`)
  for (const m of MERCANTI.filter(x => x.passo && (!soloMercante || x.chiave === soloMercante))) {
    const vista = b.mercanziaVista(m.chiave)
    for (const s of schedeDi(m, eroeDi(eroe)).filter(x => x.dove)) {
      const qui = vista.filter(r => COSE[r.chiave].dove && schedaDi(m, r.chiave) === s)
      console.log(`\n${m.nome} · ${s.nome} (${qui.length} pezzi)`)
      for (const r of qui) {
        const c = COSE[r.chiave], conf = b.confronto(r.chiave)
        const nota = [b.posso(r.chiave) ? '' : `🔒 ${b.perchéNo(r.chiave)}`, r.ruolo || ''].filter(Boolean).join(' · ')
        console.log(`  ${c.nome.padEnd(34)} L${String(c.liv || 1).padStart(2)} ${(c.rarita || 'comune').padEnd(7)} 💎${String(b.quantoCosta(r.chiave)).padStart(6)}  meglio ${String(conf ? conf.meglio : '-').padStart(6)}  ${nota}`)
      }
    }
    // quello che sta sempre in cima (l'energia dell'incantatrice), uguale per tutti
    if (m.sempre.length) console.log(`\n${m.nome} · sempre sul banco: ${m.sempre.map(k => `${COSE[k].nome} 💎${b.quantoCosta(k)}`).join(' · ')}`)
  }
}

const dati = { eroe, finite, roba, crescita }
const b = new Bottega({ ...dati, rnd: seminato(seme) })
stampa(b, 'banco')

if (poi != null && poi !== true) {
  // salito di livello: stesso banco, scritto e riletto come fa il gioco, ma con l'eroe più su
  const registro = JSON.parse(JSON.stringify(b.botteghe))
  const su = new Bottega({ ...dati, roba: b.roba, crescita: crescitaA(eroeDi(eroe), Number(poi)), ...registro, rnd: seminato(seme + 100) })
  stampa(su, `dopo essere salito al ${poi}`)
}
if (arg('giro', false)) {
  const registro = JSON.parse(JSON.stringify(b.botteghe))
  const dopo = new Bottega({ ...dati, ...alGiroNuovo(registro), rnd: seminato(seme + 200) })
  stampa(dopo, 'a discesa finita')
}
