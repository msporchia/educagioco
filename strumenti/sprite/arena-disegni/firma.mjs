// L'impronta dei sorgenti del disegno: se cambia, l'atlante e i terreni vanno rifatti (`npm run disegni:arena`, lo controlla unita/arena).
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const FILE = ['terreno.js', 'decori.js', 'opere.js', 'pagina.js', '../../../src/giochi/arena/scena/ambienti.js']

export const firmaDisegni = () => createHash('sha1').update(FILE.map(f => readFileSync(resolve(QUI, f), 'utf8')).join('\n')).digest('hex').slice(0, 12)
