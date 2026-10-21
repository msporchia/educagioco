/* Le mosse dei mostri (docs/sotterraneo/mosse.md): il comune ha l'attacco e basta, il caporale e il grosso due mosse, il super boss
   tre. Ogni specie e ogni grosso ha le sue; la scelta (pesi, condizioni, mai due volte di fila, i tetti); la cura del 12% e del 15%
   solo sotto la metà; l'incantesimo che passa lo scudo ma non la schivata; l'urlo che scade dopo tre mosse; l'attacco forte che fa
   aspettare; la mossa annunciata nella minaccia; il comune che gioca lo stesso scontro di prima.
   `node test/esegui.mjs sotterraneo-mosse --niente-build` */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { MOSTRI } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { GROSSI } from '../../src/giochi/sotterraneo/dati/grossi.js'
import { mosseDi, ruoloDi, N_MOSSE, scegliMossa, statoDelleMosse, registra, pesoMossa, guastiDelleMosse, curaDella, TIPI } from '../../src/giochi/sotterraneo/dati/mosse.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { Livello, seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

Livello.prototype.piazzaIRelitti = function () {}
Livello.prototype.scavaLeNicchie = function () {}
const roba = () => ({ v: 1, gemme: 0, zaino: [], mano: 'spada', mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 })

// una stanza della tappa 5 coi mostri messi a mano, veloci come l'eroe (a parità tocca all'eroe: un turno per uno)
function scena(mostri) {
  const c = new Corsa(CAMPAGNA[5], { seme: 11, rnd: seminato(11), eroe: 'cavaliere', roba: roba() })
  for (const r of c.livello.robe) if (r.che === 'mostro') r.morto = true
  c.vitaPiu += 200
  c.vita = c.vitaMax
  const st = c.livello.stanze.reduce((a, b) => (b.w > a.w ? b : a))
  c.eroe = { x: st.x + 0.5, y: st.y + 1.5 }
  c.verso = { dx: 1, dy: 0 }
  const m = mostri.map((d, i) => {
    const x = c.livello.mostro(d.tipo || 'goblin', st.x + 1 + i, st.y + 1)
    Object.assign(x, { ossa: 50, ossaMax: 50, att: 5, dif: 0, velocita: c.velocita, sveglio: true, stati: null }, d)
    c.livello.robe.push(x)
    return x
  })
  c.scontro(m[0])
  return { c, m, f: c.foglio }
}
// il mostro `i` farà `id` al suo turno; l'eroe sbaglia (il colpo va a vuoto) e i mostri agiscono
const forza = (f, i, id) => { f.mosse[i].prossima = mosseDi(f.campo[i]).find(x => x.id === id) }
const turno = c => c.rispostaScontro(c.foglio.chi, false).azioni.filter(a => a.chi !== 'eroe')

/* ══════════ 1. chi ha quante mosse ══════════ */
{
  stessaLista('nessun guasto nei dati', guastiDelleMosse(), [])
  for (const k of Object.keys(MOSTRI)) {
    uguale(`${k} comune: una mossa, l'attacco`, mosseDi({ tipo: k }).map(x => x.id).join(), 'attacco')
    const cap = mosseDi({ tipo: k, caporale: true })
    uguale(`${k} caporale: due mosse`, cap.length, N_MOSSE.forte)
    controlla(`${k} caporale: la prima è l'attacco di sempre`, cap[0].id === 'attacco' && cap[0].mod === 1)
  }
  for (const [k, G] of Object.entries(GROSSI)) {
    const r = ruoloDi({ grosso: k })
    uguale(`${k}: ${r}`, mosseDi({ grosso: k, tipo: G.tipo }).length, N_MOSSE[r])
    for (const x of mosseDi({ grosso: k, tipo: G.tipo })) controlla(`${k}/${x.id}: icona e colore`, TIPI[x.tipo] && x.icona && x.colore > 0)
  }
  uguale('il signore di sopra è forte', ruoloDi({ tipo: 'lupo', signore: true }), 'forte')
  uguale('Carbonchio è super boss', ruoloDi({ grosso: 'carbonchio' }), 'superboss')
}

/* ══════════ 2. la scelta (pura) ══════════ */
{
  const lista = mosseDi({ tipo: 'mostro-verde', caporale: true })   // attacco, cura
  const s = statoDelleMosse()
  uguale('sopra la metà la cura non si può', pesoMossa(lista[1], s, { vita: 30, vitaMax: 50 }), 0)
  uguale('sotto la metà sì, e pesa 6', pesoMossa(lista[1], s, { vita: 24, vitaMax: 50 }), 6)
  uguale('un comune non chiede il tiro', scegliMossa(mosseDi({ tipo: 'goblin' }), s, {}, () => { throw new Error('tirato') }).id, 'attacco')
  uguale('col tiro alto, sotto la metà, si cura', scegliMossa(lista, s, { vita: 10, vitaMax: 50, ruolo: 'forte' }, () => 0.99).id, 'radici')
  registra(s, lista[1])
  uguale('una volta sola a scontro', scegliMossa(lista, s, { vita: 5, vitaMax: 50, ruolo: 'forte' }, () => 0.99).id, 'attacco')
  // mai due di fila: l'urlo di un orco, appena fatto, non torna anche se il rinforzo fosse finito
  const orco = mosseDi({ tipo: 'orco', caporale: true })
  const so = { ...statoDelleMosse(), ultima: 'urlo-guerra' }
  uguale('mai due volte di fila', scegliMossa(orco, so, { vita: 50, vitaMax: 50 }, () => 0.99).id, 'attacco')
  uguale('l\'urlo non si ripete da rinforzato', pesoMossa(orco[1], { ...statoDelleMosse(), rinforzo: 2 }, { vita: 50, vitaMax: 50 }), 0)
  uguale('l\'attacco di sempre può ripetersi', scegliMossa(orco, { ...statoDelleMosse(), ultima: 'attacco' }, { vita: 50, vitaMax: 50 }, () => 0).id, 'attacco')
  // l'incantesimo pesa di più contro chi è protetto
  const tart = mosseDi({ tipo: 'tartaruga', caporale: true })
  uguale('l\'incantesimo ×2,5 contro lo scudo', pesoMossa(tart[1], statoDelleMosse(), { vita: 50, vitaMax: 50, protetto: true }), 5)
  // il super boss si cura due volte, non tre
  const fal = mosseDi({ grosso: 'falcenera', tipo: 'gigante' }), sf = statoDelleMosse(), cura = fal.find(x => x.tipo === 'cura')
  registra(sf, cura); registra(sf, fal[0]); controlla('la seconda cura del super boss', pesoMossa(cura, sf, { vita: 5, vitaMax: 50, ruolo: 'superboss' }) > 0)
  registra(sf, cura); uguale('la terza no', pesoMossa(cura, sf, { vita: 5, vitaMax: 50, ruolo: 'superboss' }), 0)
  uguale('il 12%', curaDella(mosseDi({ tipo: 'scheletro-scudo', caporale: true })[1], 10, 50), 6)
  uguale('il 15%', curaDella(cura, 10, 40), 6)
  uguale('mai oltre la vita massima', curaDella(cura, 38, 40), 2)
  // tanti tiri in uno scontro: l'orco urla, mai due volte di fila, e al più due volte
  const sc = statoDelleMosse()
  let urli = 0, fila = 0
  const tiro = seminato(5)
  for (let i = 0; i < 3000; i++) {
    const x = scegliMossa(orco, sc, { vita: 50, vitaMax: 50 }, tiro)
    if (x.id === 'urlo-guerra') { urli++; if (sc.ultima === 'urlo-guerra') fila++ }
    registra(sc, x)
  }
  uguale('l\'urlo mai di fila', fila, 0)
  uguale('al più due urli a scontro', urli, 2)
}

/* ══════════ 3. nel motore ══════════ */
{
  // la cura: il turno del mostro, niente colpo, il 12% della vita
  const { c, m, f } = scena([{ tipo: 'scheletro-scudo', caporale: true, ossa: 20 }])
  forza(f, 0, 'ricompone')
  const vita = c.vita
  const [e] = turno(c)
  uguale('la cura è un evento suo', e.che, 'cura')
  uguale('del 12% della vita massima', e.cura, 6)
  uguale('il mostro ha le ossa in più', m[0].ossa, 26)
  uguale('e non colpisce', c.vita, vita)
  uguale('la mossa sta nell\'evento', e.mossa.id, 'ricompone')
}
{
  // la scelta annunciata: sopra la metà niente cura, e la minaccia dice la mossa
  const { f } = scena([{ tipo: 'mostro-verde', caporale: true }])
  const mi = f.minaccia[0]
  controlla('la minaccia porta la mossa', mi.mossa && ['attacco', 'radici'].includes(mi.mossa.id))
  uguale('sano non si cura', mi.mossa.id, 'attacco')
  controlla('e colpisce', mi.colpisce > 0)
}
{
  // l'incantesimo passa lo scudo, l'attacco di sempre no
  const { c, f } = scena([{ tipo: 'tartaruga', caporale: true }])
  f.io.scudo = 999
  forza(f, 0, 'getto')
  controlla('l\'annuncio dice il colpo vero', f.minaccia[0].colpisce >= 0)
  const [e] = turno(c)
  controlla('l\'incantesimo arriva malgrado lo scudo', e.preso > 0 && e.assorbito === 0, e)
  f.io.scudo = 999
  forza(f, 0, 'attacco')
  const [e2] = turno(c)
  uguale('l\'attacco lo scudo lo prende', e2.preso, 0)
  // ma la schivata sì
  Object.defineProperty(c, 'schivata', { get: () => 100, configurable: true })
  forza(f, 0, 'getto')
  const [e3] = turno(c)
  controlla('l\'incantesimo si schiva', e3.schivato && e3.preso === 0)
}
{
  // l'urlo: le prossime tre mosse ×1,25, poi scade
  const { c, m, f } = scena([{ tipo: 'orco', caporale: true, att: 9 }])
  const base = c.botta(m[0])
  forza(f, 0, 'urlo-guerra')
  const [u] = turno(c)
  uguale('l\'urlo non colpisce', u.che, 'urlo')
  const presi = []
  for (let i = 0; i < 4; i++) { forza(f, 0, 'attacco'); presi.push(turno(c)[0].preso) }
  controlla('le tre mosse dopo pesano di più', presi.slice(0, 3).every(x => x >= Math.floor(base * 1.25) - 1 && x > base), presi)
  controlla('la quarta torna normale', presi[3] <= base + 1 && presi[3] < presi[0], presi)
}
{
  // l'attacco forte: ×1,4 e il mostro aspetta un turno e mezzo
  const { c, f } = scena([{ tipo: 'cinghiale', caporale: true, att: 9 }])
  const prima = f.coda.find(a => a.id === 0).fatti
  forza(f, 0, 'carica-testa')
  const [e] = turno(c)
  controlla('colpisce più forte', e.pieno > c.botta(f.campo[0]), e)
  uguale('e aspetta 1,5', f.coda.find(a => a.id === 0).fatti - prima, 1.5)
}
{
  // il comune: nessuna mossa annunciata, nessuna mossa nell'evento
  const { c, f } = scena([{ tipo: 'goblin' }, { tipo: 'goblin' }])
  uguale('niente annuncio per il comune', f.minaccia[0].mossa, null)
  const ev = turno(c)
  controlla('nessun evento porta una mossa', ev.every(e => !e.mossa && e.che === 'colpo'))
}

riassunto('le mosse dei mostri')
