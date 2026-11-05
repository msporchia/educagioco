// La battaglia di prova, per guardare il campo senza giocare mezz'ora: `#arena=lava&battaglia=40` apre quel
// terreno con le sei piazzole piene da tutte e due le parti, dopo tanti secondi di scontro, `&vuota` senza edifici (docs/core/comandi.md).
import { POSTI, truppeDelTerreno } from '../dati/regole.js'
import { Partita } from './partita.js'

const LENTO = { moneteAlSecondo: 0, pensa: 9999, forza: 1 }

/* il terreno e i secondi dall'indirizzo; null se il cheat non c'è */
export function chiesta(frammento) {
  const q = new URLSearchParams(String(frammento || '').replace(/^#/, ''))
  if (!q.has('battaglia')) return null
  return { terreno: q.get('arena') || 'bosco', secondi: Number(q.get('battaglia')) || 0, vuota: q.has('vuota') }
}

export function battagliaDiProva({ terreno, secondi, vuota }) {
  const truppe = truppeDelTerreno(terreno)
  const p = new Partita({ registra: true, sfida: { nemico: LENTO, truppe, durata: Infinity, monete: 9999 } })
  if (vuota) { p.lati.io.monete = p.lati.nem.monete = 40; return p }
  for (const lato of ['io', 'nem']) {
    POSTI.forEach((_, posto) => {
      p.costruisci(lato, posto % 3 === 2 ? 'miniera' : truppe[(posto + (lato === 'nem' ? 2 : 0)) % truppe.length], 0, posto)
      if (posto % 2) p.edificioIn(lato, posto).liv = 6
    })
  }
  p.avanza(secondi)
  p.prendiEventi()
  return p
}
