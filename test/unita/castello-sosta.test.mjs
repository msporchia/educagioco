/* La battaglia del castello lasciata a metà: si scrive, si rilegge, e
   ripresa è la stessa battaglia — torri, energia, chi è in campo e a che
   punto è l'ondata. Vedi docs/castello/sosta.md.
   `node test/esegui.mjs castello-sosta --niente-build` */
import { TAPPE, LIBERE, MONDO, prossimoAcquisto, sequenzaTorri } from '../../src/data/castello.js'
import { creaBattaglia } from '../../src/motore/battaglia.js'
import { scrivi, leggi, dice, tappaDi, VERSIONE } from '../../src/motore/castello/sosta.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const PASSO = 1 / 60

function nuova(tappa, regali = null) {
  const stato = { cuori: 0, onda: 0, uccisi: 0, torri: 0, energia: 0 }
  return creaBattaglia({ tappa, misure: { ...MONDO }, stato, regali })
}

/* un giocatore che compra appena può e chiama l'ondata appena il campo è
   pulito, fermato a metà dell'ondata `finoA` con i mostri sulla strada */
function aMeta(tappa, finoA, regali = null) {
  const b = nuova(tappa, regali)
  b.inizia()
  const sequenza = sequenzaTorri(tappa, Math.max(32, tappa.posti))
  for (let t = 0; t < 1200 && !b.finito; t += PASSO) {
    if (b.regaliDaScegliere > 0 && b.tabellone.onda < finoA) b.prendiRegalo('frecce')
    const m = prossimoAcquisto(b.torri.map(x => ({ tipo: x.tipo, lv: x.lv })), tappa,
                               { posti: tappa.posti, sequenza, onda: b.tabellone.onda })
    if (m && b.tabellone.energia >= m.costo && b.torri.length < tappa.posti) {
      if (m.che === 'salita') b.potenzia(b.torri[m.indice], { prezzo: m.costo })
      else b.costruisci(m.tipo, { prezzo: m.costo })
    }
    if (b.inAttesa()) b.chiamaOnda()
    b.avanza(PASSO)
    if (b.tabellone.onda >= finoA && b.nemici.length >= 3 && b.inArrivo > 0) return b
  }
  return b
}

const firma = b => JSON.stringify({
  stato: b.tabellone.foto(),
  torri: b.torri.map(t => [b.postoDi(t), t.tipo, t.lv, t.ramo]),
  nemici: b.nemici.map(n => [n.bestia, n.via, n.onda, +n.d.toFixed(2), +n.vita.toFixed(2),
                             n.capo, n.divisioni, n.aTerra > 0]),
  daGenerare: b.daGenerare, aperte: [...b.aperte], daScegliere: b.daScegliere,
})

/* ══════════ 1. quello che si è fatto non si perde ══════════ */
{
  const i = 5, tappa = TAPPE[i]
  const b = aMeta(tappa, 3)
  controlla('la prova parte da una battaglia a metà di un\'ondata',
            !b.finito && b.tabellone.onda >= 3 && b.nemici.length > 0 && b.torri.length > 0,
            `ondata ${b.tabellone.onda}, ${b.nemici.length} in campo, ${b.torri.length} torri`)

  // passa dall'archivio: quello che non sopravvive a JSON non c'è
  const dato = JSON.parse(JSON.stringify(scrivi(b, i, { velocita: 2 })))
  uguale('il salvataggio dice la sua versione', dato.v, VERSIONE)
  controlla('e sta in pochi chilobyte', JSON.stringify(dato).length < 20000,
            `${JSON.stringify(dato).length} byte`)
  uguale('la tappa si ritrova per chiave', tappaDi(dato), tappa)

  const r = nuova(tappaDi(dato))
  controlla('si rilegge', leggi(dato, r))
  uguale('ed è la stessa battaglia', firma(r), firma(b))
  uguale('l\'energia avanzata a metà di un punto non si perde', r.tabellone.resto,
         Math.round((b.tabellone.resto || 0) * 1000) / 1000)

  // e si gioca fino in fondo: niente campi che non tornano
  let esito = null
  for (let t = 0; t < 1200 && !esito; t += PASSO) {
    if (r.inAttesa()) r.chiamaOnda()
    esito = r.avanza(PASSO)
  }
  controlla('ripresa, la battaglia arriva a una fine', !!esito, esito || 'stallo')
}

/* ══════════ 2. la partita libera: regali e quale terreno ══════════ */
{
  const libera = LIBERE[1]
  const b = aMeta(libera, 6, {})
  b.daScegliere = 1                    // un regalo in sospeso, non ancora scelto
  const dato = JSON.parse(JSON.stringify(scrivi(b, -1)))
  uguale('una libera si ritrova per la sua chiave', tappaDi(dato), libera)
  const r = nuova(libera, { ...b.regali })
  controlla('si rilegge', leggi(dato, r))
  uguale('ed è la stessa partita', firma(r), firma(b))
  uguale('il regalo in sospeso aspetta ancora', r.regaliDaScegliere, 1)
  const d = dice(dato)
  uguale('la carta sulla mappa sa che è una libera', d.libera, true)
  uguale('e a che ondata si era', d.onda, b.tabellone.onda)
}

/* ══════════ 3. quello che non torna non si legge ══════════ */
{
  const tappa = TAPPE[2]
  const b = aMeta(tappa, 2)
  const dato = JSON.parse(JSON.stringify(scrivi(b, 2)))

  uguale('una versione diversa non si legge', leggi({ ...dato, v: VERSIONE + 1 }, nuova(tappa)), false)
  uguale('una tappa che non c\'è più non si ritrova', tappaDi({ ...dato, chiave: 'sparita/tappa' }), null)
  uguale('e la mappa non offre niente', dice({ ...dato, chiave: 'sparita/tappa' }), null)
  const fuori = { ...dato, torri: [...dato.torri, { posto: 999, tipo: 'add', lv: 1 }] }
  uguale('una torre su una piazzola che non c\'è non si legge', leggi(fuori, nuova(tappa)), false)

  b.chiudi('persa')
  uguale('una battaglia finita non si scrive', scrivi(b, 2), null)
  uguale('senza salvataggio nessuna carta', dice(null), null)
}

riassunto('castello — la battaglia lasciata a metà')
