/* ═══════════════════════════════════════════════════════════════════
   LA STRADA E LA NEBBIA DEL MONDO DI SOPRA — motore/terra.js

   L'A* a otto direzioni che porta l'eroe dove si tocca, la lisciatura
   che lo fa camminare dritto, la riva più vicina quando si tocca dove
   non si cammina, e la nebbia che si apre camminando. Su una maschera
   piccola scritta qui: il mondo vero lo provano unita/sotterraneo-mondo-*
   e unita/sotterraneo-meta-sopra. docs/sotterraneo/mondo-3d.md
   ═══════════════════════════════════════════════════════════════════ */
import { creaTerra, scopri, nebbiaNuova } from '../../src/giochi/sotterraneo/motore/terra.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

// un prato con una casa in mezzo e uno stagno in basso a destra; si parte in alto a sinistra
const MASCHERA = [
  '....................',
  '....................',
  '......####..........',
  '......####..........',
  '......####..........',
  '....................',
  '....................',
  '.............#######',
  '.............#######',
  '.............#######',
]
const terra = creaTerra(MASCHERA)
const casa = { x: 0, y: 0 }

/* ── la strada ── */
{
  const meta = { x: 12, y: 9 }
  const via = terra.strada(casa, meta)
  controlla('dall\'angolo si arriva oltre la casa', Array.isArray(via) && via.length > 0)
  let angoli = 0, prima = casa
  for (const c of via) {
    const dx = c.x - prima.x, dy = c.y - prima.y
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) angoli += 100
    if (dx && dy && (!terra.passa(prima.x + dx, prima.y) || !terra.passa(prima.x, prima.y + dy))) angoli++
    prima = c
  }
  uguale('la strada va di cella in cella e non taglia gli angoli', angoli, 0)
  stessaLista('e arriva dove si è toccato', via.at(-1), meta)
  const liscia = terra.liscia(casa, via)
  controlla('lisciata, gira molte meno volte', liscia.length < via.length / 2, `${liscia.length} su ${via.length}`)
  stessaLista('e arriva nello stesso posto', liscia.at(-1), via.at(-1))
  uguale('già lì: nessun passo', terra.strada(casa, casa).length, 0)
  uguale('dentro la casa non c\'è strada', terra.strada(casa, { x: 7, y: 3 }), null)
}

/* ── chi sta fermo non si attraversa ── */
{
  const fermo = creaTerra(MASCHERA, { ostacoli: [[3, 0]] })
  controlla('una cella con qualcuno fermo non si cammina', !fermo.passa(3, 0) && terra.passa(3, 0))
  controlla('ma ci si gira attorno', !fermo.strada(casa, { x: 5, y: 0 }).some(c => c.x === 3 && c.y === 0))
}

/* ── toccare dove non si cammina porta alla riva ── */
{
  const acqua = { x: 17, y: 8 }
  controlla('nello stagno non si cammina', !terra.passa(acqua.x, acqua.y))
  const riva = terra.arrivo(casa, acqua)
  controlla('toccando l\'acqua si va alla riva più vicina', !!riva && terra.passa(riva.x, riva.y)
            && Math.hypot(riva.x - acqua.x, riva.y - acqua.y) < 3, JSON.stringify(riva))
  stessaLista('toccando un posto raggiungibile si va lì', terra.arrivo(casa, { x: 15, y: 5 }), { x: 15, y: 5 })
}

/* ── la nebbia ── */
{
  const L = MASCHERA[0].length, A = MASCHERA.length
  const n = nebbiaNuova(L, A)
  const nuove = scopri(n, L, A, 10.5, 5.5, 3)
  controlla('attorno all\'eroe si vede', nuove.length > 20 && n[5 * L + 10] === 1, `${nuove.length}`)
  controlla('lontano no', n[0] === 0)
  uguale('una cella vista non si scopre due volte', scopri(n, L, A, 10.5, 5.5, 3).length, 0)
}

riassunto('la strada e la nebbia del mondo di sopra')
