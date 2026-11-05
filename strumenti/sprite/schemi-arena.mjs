/* ═══════════════════════════════════════════════════════════════════
   GLI ALLEGATI DELLE SCHEDE DI CASTLE BATTLE

     npm run build && node strumenti/sprite/schemi-arena.mjs

   Scrive in `strumenti/sprite/sorgenti/arena/schemi/` quello che si allega a ChatGPT (voci 7c, 8, 9 e 10 di
   DA-GENERARE.md): `terreno-<chiave>.png`, il terreno disegnato in codice su tutto il pezzo di mondo che il dipinto
   deve coprire, e `partita.png` e `scelta.png`, due schermate del gioco com'è oggi. Il disegno è la forma, il dipinto
   la rifà: prima in codice, poi dipinto. Si rilancia quando cambia un terreno.
   ═══════════════════════════════════════════════════════════════════ */
import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const ESCE = resolve(QUI, 'sorgenti/arena/schemi')
mkdirSync(ESCE, { recursive: true })

function scatta(cheat, file, ...altro) {
  const r = spawnSync('node', [resolve(QUI, '../scatta-app.mjs'), cheat, '--dist', '--file', resolve(ESCE, file), ...altro], { stdio: 'inherit' })
  if (r.status) process.exit(r.status)
}

for (const chiave of ['bosco', 'palude', 'neve', 'lava']) {
  scatta(`arena=${chiave}&schema`, `terreno-${chiave}.png`, '--larghezza', '1620', '--alto', '1080', '--pixel', '1', '--aspetta', '1500')
}
scatta('arena=neve&battaglia=25', 'partita.png', '--aspetta', '1500', '--attesa', '2600')
scatta('arena=lava&battaglia=0&vuota', 'scelta.png', '--aspetta', '2600', '--tocca', '[data-piazzola="2"]', '--attesa', '800')
