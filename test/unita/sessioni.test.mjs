/* ═══════════════════════════════════════════════════════════════════
   IL REGISTRO DELLE SESSIONI — i conti che i grafici mostrano

   Quanto ha giocato, a cosa, e quando. Le funzioni che contano stanno
   fuori dal componente perché è lì che si sbaglia: il confine dei
   giorni (una partita delle 23:40 è di oggi, anche se in UTC è già
   domani), i giorni vuoti che devono comparire lo stesso, il telefono
   posato col gioco aperto.

   `node test/esegui.mjs sessioni --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { chiaveGiorno, perGioco, perGiorno, oggiDi, potate,
         MINIMA, MAX_SESSIONE, GIORNI_TENUTI } from '../../src/store/sessioni.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

/* un pomeriggio finto, costruito su un'ora locale nota */
const alle = (giorno, ora, minuti = 0) => new Date(2026, 7, giorno, ora, minuti).getTime()
const OGGI = alle(22, 18, 0)

const VOCI = [
  { g: 'sotterraneo', t: alle(22, 15, 48), s: 8 * 60 },
  { g: 'survivors', t: alle(22, 13, 24), s: 5 * 60 },
  { g: 'fattoria', t: alle(22, 16, 30), s: 22 * 60 },
  { g: 'fattoria', t: alle(21, 17, 10), s: 12 * 60 },
  { g: 'sotterraneo', t: alle(20, 9, 5), s: 30 * 60 },
  /* la partita di ieri sera tardi: in UTC sarebbe già il giorno dopo,
     e contarla domani vorrebbe dire dire a un genitore che ieri il
     bambino non ha giocato */
  { g: 'corsa', t: alle(21, 23, 40), s: 6 * 60 },
]

/* ══════════ 1. il giorno è quello di casa ══════════ */
uguale('una partita delle 23:40 appartiene al suo giorno',
       chiaveGiorno(alle(21, 23, 40)), '2026-08-21')
uguale('e una delle 00:20 al giorno dopo', chiaveGiorno(alle(22, 0, 20)), '2026-08-22')

/* ══════════ 2. a cosa gioca ══════════ */
{
  const g = perGioco(VOCI, { da: alle(22, 0), a: alle(22, 23, 59) })
  uguale('oggi ha giocato a tre giochi', g.length, 3)
  uguale('e il primo è quello a cui ha giocato di più', g[0].gioco, 'fattoria')
  uguale('coi minuti tondi', g[0].minuti, 22)
  uguale('l\'ultimo è quello da cinque minuti', g[g.length - 1].gioco, 'survivors')

  const tutto = perGioco(VOCI)
  uguale('senza intervallo si contano tutte', tutto.length, 4)
  uguale('e la fattoria somma i due giorni', tutto.find(x => x.gioco === 'fattoria').minuti, 34)
}

/* ══════════ 3. i giorni, vuoti compresi ══════════ */
{
  const d = perGiorno(VOCI, { quanti: 7, oggi: OGGI })
  uguale('sette barre', d.length, 7)
  uguale('l\'ultima è oggi', d[6].giorno, '2026-08-22')
  uguale('oggi sono trentacinque minuti', d[6].minuti, 35)
  uguale('ieri diciotto', d[5].minuti, 18)
  /* i giorni senza partite ci sono e valgono zero: un grafico che li
     salta mente sulla forma della settimana — tre giorni di fila a
     zero sono l'informazione, non il nulla da nascondere */
  uguale('il 19 non ha giocato, e la barra c\'è lo stesso', d[3].minuti, 0)
  controlla('nessun giorno manca all\'appello',
            d.every(x => x.giorno && x.secondi >= 0))
}

/* ══════════ 4. il conto che servirà al tetto ══════════
   Il tetto giornaliero per gioco non esiste ancora, ed è deliberato: qui
   si raccoglie solo quello che gli servirebbe. Questa è la sua metà. */
uguale('la fattoria oggi: ventidue minuti', oggiDi(VOCI, 'fattoria', OGGI), 22 * 60)
uguale('il dungeon oggi: niente', oggiDi(VOCI, 'dungeon', OGGI), 0)
/* ieri la fattoria l'ha giocata, ma «oggi» chiede oggi */
uguale('e ieri non conta', oggiDi(VOCI, 'corsa', OGGI), 0)

/* ══════════ 5. la potatura ══════════ */
{
  const vecchia = { g: 'mate', t: OGGI - (GIORNI_TENUTI + 5) * 86400000, s: 600 }
  const dopo = potate([...VOCI, vecchia], { oggi: OGGI })
  uguale('quella di quattro mesi fa se ne va', dopo.length, VOCI.length)
  controlla('e le altre restano tutte', dopo.every(v => VOCI.includes(v)))
}

nota(`sotto ${MINIMA}s non è una partita; nessuna sessione oltre ` +
     `${MAX_SESSIONE / 3600}h; si tengono ${GIORNI_TENUTI} giorni`)
riassunto('il registro delle sessioni')
