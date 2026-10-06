/* ═══════════════════════════════════════════════════════════════════
   LA TERRA DI SOPRA DEL SOTTERRANEO — la maschera e la strada

   La maschera (dove si cammina sulla mappa) è corretta a mano nel
   foglietto, e una cella sbagliata non dà errori: dà una discesa che
   l'eroe non raggiunge mai, o un tocco sull'acqua che non porta da
   nessuna parte. Qui si prova che da casa si arriva a ogni posto, che
   la strada non taglia gli angoli, che la nebbia torna com'era, e che
   il modulo generato è quello del foglietto (si è rilanciato lo
   strumento). docs/sotterraneo/terra-di-sopra.md
   ═══════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'node:fs'
import { MASCHERA, CELLA, POSTI, PARTENZA, MINATORE, CARTELLO, LARGO, ALTO }
  from '../../src/giochi/sotterraneo/dati/terra-mappa.js'
import { POSTO_DI, LUOGHI } from '../../src/giochi/sotterraneo/dati/terra.js'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { creaTerra, scopri, nebbiaNuova, nebbiaInCodice, nebbiaDaCodice, sassiLungo }
  from '../../src/giochi/sotterraneo/motore/terra.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const [px, py] = PARTENZA.piede
const terra = creaTerra(MASCHERA, { ostacoli: [MINATORE.piede] })
const casa = { x: px, y: py }

/* ── il modulo è quello del foglietto ── */
const fg = JSON.parse(readFileSync(new URL('../../strumenti/sprite/sorgenti/sotterraneo/terra-di-sopra.json',
  import.meta.url), 'utf8'))
stessaLista('la maschera del gioco è quella del foglietto (rilancia strumenti/sprite/terra-di-sopra.py)',
            MASCHERA, fg.maschera)
stessaLista('e anche i posti', POSTI, fg.posti)
uguale('la maschera copre tutta la mappa, in larghezza', MASCHERA[0].length * CELLA, LARGO)
uguale('e in altezza', MASCHERA.length * CELLA, ALTO)
controlla('solo . e #', MASCHERA.every(r => /^[.#]+$/.test(r) && r.length === MASCHERA[0].length))

/* ── da casa si arriva dappertutto ── */
controlla('si parte da una cella dove si cammina', terra.passa(px, py))
uguale('sette posti: sei discese più l\'abisso', Object.keys(POSTI).length, 7)
for (const t of CAMPAGNA)
  controlla(`${t.nome} sta su un posto della mappa`, !!POSTI[POSTO_DI[t.chiave]], POSTO_DI[t.chiave])
controlla('anche l\'abisso', !!POSTI[POSTO_DI.abisso])
uguale('una discesa per posto', new Set(Object.values(POSTO_DI)).size, Object.keys(POSTO_DI).length)
for (const [nome, p] of Object.entries(POSTI)) {
  const [x, y] = p.piede
  controlla(`${nome}: si sta in piedi davanti`, terra.passa(x, y))
  const via = terra.strada(casa, { x, y })
  controlla(`${nome}: da casa ci si arriva`, Array.isArray(via), `${x},${y}`)
  controlla(`${nome}: il minatore sa spiegare dov'è`, !!LUOGHI[nome])
}
const [cx, cy] = CARTELLO.piede
controlla('al cartello ci si arriva', !!terra.strada(casa, { x: cx, y: cy }))
const [mx, my] = MINATORE.piede
controlla('il minatore sta fermo: non gli si passa attraverso', !terra.passa(mx, my))
const accanto = terra.arrivo(casa, { x: mx, y: my })
controlla('toccandolo in mezzo al prato si va vicino a lui', !!accanto
          && Math.max(Math.abs(accanto.x - mx), Math.abs(accanto.y - my)) === 1, JSON.stringify(accanto))
const [ax, ay] = MINATORE.accanto
controlla('e per parlargli ci si ferma al suo fianco, dove ci si arriva',
          !!terra.strada(casa, { x: ax, y: ay }) && Math.abs(ax - mx) === 2 && ay === my)

/* ── la strada ── */
const lontano = POSTI['pozzo-vecchio'].piede
const via = terra.strada(casa, { x: lontano[0], y: lontano[1] })
let angoli = 0, prima = casa
for (const c of via) {
  const dx = c.x - prima.x, dy = c.y - prima.y
  if (Math.abs(dx) > 1 || Math.abs(dy) > 1) angoli += 100
  if (dx && dy && (!terra.passa(prima.x + dx, prima.y) || !terra.passa(prima.x, prima.y + dy))) angoli++
  prima = c
}
uguale('la strada va di cella in cella e non taglia gli angoli', angoli, 0)
const liscia = terra.liscia(casa, via)
controlla('lisciata, gira molte meno volte', liscia.length < via.length / 2, `${liscia.length} su ${via.length}`)
stessaLista('e arriva nello stesso posto', liscia.at(-1), via.at(-1))

// l'acqua dello stagno: un tocco là in mezzo porta alla riva, non a niente
const acqua = { x: 4, y: 17 }
controlla('nello stagno non si cammina', !terra.passa(acqua.x, acqua.y))
const riva = terra.arrivo(casa, acqua)
controlla('toccando l\'acqua si va alla riva più vicina', !!riva && terra.passa(riva.x, riva.y)
          && Math.hypot(riva.x - acqua.x, riva.y - acqua.y) < 8, JSON.stringify(riva))
stessaLista('toccando un posto raggiungibile si va lì', terra.arrivo(casa, { x: cx, y: cy }), { x: cx, y: cy })

/* ── la nebbia ── */
const L = MASCHERA[0].length, A = MASCHERA.length
const n = nebbiaNuova(L, A)
const nuove = scopri(n, L, A, px + 0.5, py + 0.5, 8)
controlla('attorno a casa si vede', nuove.length > 150 && n[py * L + px] === 1, `${nuove.length}`)
uguale('una cella vista non si scopre due volte', scopri(n, L, A, px + 0.5, py + 0.5, 8).length, 0)
const codice = nebbiaInCodice(n)
uguale('in archivio è corta', codice.length, L * A / 4)
stessaLista('e torna uguale', [...nebbiaDaCodice(codice, L, A)], [...n])
uguale('un codice che non torna è nebbia nuova', nebbiaDaCodice('zz', L, A), null)

/* ── i sassi ── */
const sassi = sassiLungo(via, 4)
controlla('i sassi stanno sulla strada', sassi.length > 5 && sassi.every(s => terra.passa(s.x, s.y)), `${sassi.length}`)

riassunto('la terra di sopra')
