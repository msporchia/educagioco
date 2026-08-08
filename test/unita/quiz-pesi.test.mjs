/* ═══════════════════════════════════════════════════════════════════
   QUANTO SPESSO ESCE UNA CLASSE DI DOMANDE
   tempo: 15

   Una CLASSE è una coppia (modulo, grado): «il perimetro», «i
   contrari», «le conversioni facili». Questo test guarda una cosa
   sola, che però è quella che decide cosa un bambino vede davvero:
   **con che frequenza esce ognuna**.

   Il difetto che ha fatto nascere `nucleo/classi.js` era invisibile a
   ogni altra prova. Le domande erano giuste, varie, senza doppioni — e
   metà delle classi non usciva mai, perché il grado si calcolava dalla
   difficoltà (`round(1 + d × (gradi−1))`) e le difficoltà che i giochi
   chiedono sono poche e fisse: 0.15, 0.50, 0.85 in Survivors. Area e
   perimetro, che stanno in cima alla scaletta della griglia, si
   vedevano solo comprando le carte più care.

   Quindi qui si contano i tiri, non si guardano le domande:

     · alle difficoltà che i giochi chiedono davvero, TUTTE le classi
       devono uscire almeno ogni tanto;
     · nessuna deve prendersi una fetta spropositata;
     · il centro della banda deve restare dov'è: una carta facile non
       deve consegnare l'ultimo grado di un modulo (sarebbe una bugia
       al bambino: ha pagato poco);
     · e a parità di seme deve uscire sempre lo stesso, se no non si
       può provare niente.
   ═══════════════════════════════════════════════════════════════════ */
import { readdirSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { nota, controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { classiDi, pescaClasse, pesoDi, postoDelGrado, BANDA } from '../../src/quiz/nucleo/classi.js'
import { Sorte } from '../../src/quiz/nucleo/sorte.js'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CARTELLA = resolve(RADICE, 'src/quiz/moduli')

const moduli = []
if (existsSync(CARTELLA))
  for (const f of readdirSync(CARTELLA).sort().filter(x => x.endsWith('.js'))) {
    const mod = (await import(pathToFileURL(resolve(CARTELLA, f)).href)).default
    if (mod) moduli.push(mod)
  }
controlla('i moduli si raccolgono da soli', moduli.length > 0)

const CLASSI = moduli.reduce((s, m) => s + m.gradi, 0)
nota(`${moduli.length} moduli, ${CLASSI} classi di domande in tutto`)

/* ═══════════ il peso: dove sta il centro ═══════════ */
uguale('il primo grado sta a 0 sulla manopola', postoDelGrado(1, 5), 0)
uguale('l\'ultimo sta a 1', postoDelGrado(5, 5), 1)
uguale('un modulo a un grado solo sta a 0', postoDelGrado(1, 1), 0)
controlla('il peso è massimo dove la difficoltà chiede',
          pesoDi(3, 5, 0.5) > pesoDi(2, 5, 0.5) && pesoDi(3, 5, 0.5) > pesoDi(4, 5, 0.5))
controlla('e cala allontanandosi', pesoDi(2, 5, 0.5) > pesoDi(1, 5, 0.5))
controlla('a una banda di distanza è già poco', pesoDi(1, 5, 0.5) < 0.15,
          `${pesoDi(1, 5, 0.5).toFixed(3)} con banda ${BANDA}`)

/* ═══════════ mille tiri per ogni difficoltà ═══════════
   Le difficoltà sono quelle vere: le tre fasce delle carte di
   Survivors, più gli estremi della rampa del dungeon. */
const FASCE = [
  ['carta debole', 0.15],
  ['carta media', 0.50],
  ['carta tosta', 0.85],
  ['prima stanza', 0.0],
  ['fondo del dungeon', 1.0],
]
const TIRI = 3000

const conta = (difficolta, seme = 3) => {
  const sorte = new Sorte(seme)
  const classi = classiDi(moduli, { difficolta })
  const quante = new Map()
  for (let i = 0; i < TIRI; i++) {
    const c = pescaClasse(sorte, classi)
    const k = `${c.modulo.id}/${c.grado}`
    quante.set(k, (quante.get(k) || 0) + 1)
  }
  return quante
}

for (const [nome, d] of FASCE) {
  const quante = conta(d)
  const usate = [...quante.keys()].length
  const massima = Math.max(...quante.values()) / TIRI
  /* quanti moduli diversi si sono visti: se fossero due o tre, il gioco
     sembrerebbe un'interrogazione su una materia sola */
  const moduliVisti = new Set([...quante.keys()].map(k => k.split('/')[0])).size
  controlla(`${nome} (${d}): si vedono tutti i moduli`, moduliVisti === moduli.length,
            `${moduliVisti} su ${moduli.length}`)
  controlla(`${nome} (${d}): nessuna classe si prende più di un quinto dei tiri`,
            massima <= 0.2, `la più frequente prende il ${(massima * 100).toFixed(1)}%`)
  nota(`${nome} ${d}: ${usate} classi su ${CLASSI}, la più frequente al ` +
       `${(massima * 100).toFixed(1)}%`)
}

/* ── le classi che prima non si vedevano mai ──
   Il grado in cima alla scaletta della griglia (area e perimetro a
   confronto) usciva solo a difficoltà ≥ 0.92 col conto secco. Adesso
   deve farsi vedere già da una carta tosta. */
const griglia = moduli.find(m => m.id === 'griglia')
if (griglia) {
  const quante = conta(0.85)
  const cima = quante.get(`griglia/${griglia.gradi}`) || 0
  const area = quante.get('griglia/4') || 0
  controlla('con una carta tosta esce anche l\'ultimo grado della griglia', cima > 0,
            'mai in 3000 tiri')
  controlla('e l\'area, che sta due gradi sotto, pure', area > 0)
  nota(`griglia a 0.85: area ${area} volte, ultimo grado ${cima} volte su ${TIRI}`)
}

/* ── e il contrario: una carta facile non deve dare una domanda tosta ── */
const facile = conta(0.15)
const toste = [...facile.entries()].filter(([k]) => {
  const [id, g] = k.split('/')
  const m = moduli.find(x => x.id === id)
  return postoDelGrado(Number(g), m.gradi) >= 0.75
})
const quoteToste = toste.reduce((s, [, n]) => s + n, 0) / TIRI
controlla('una carta facile non consegna quasi mai una domanda da carta tosta',
          quoteToste < 0.01, `${(quoteToste * 100).toFixed(2)}% dei tiri`)

/* ── il caso è ripetibile ── */
const a = [...conta(0.5, 11).entries()].sort().map(([k, n]) => `${k}:${n}`).join(' ')
const b = [...conta(0.5, 11).entries()].sort().map(([k, n]) => `${k}:${n}`).join(' ')
uguale('stesso seme, stessa distribuzione', a, b)

/* ── i macrogruppi spenti non entrano nel conto ──
   Se un genitore spegne le misure, nessun tiro deve finire su una
   classe che le chiedeva: è la stessa cosa che prova `unita/saperi`,
   qui vista dal lato della frequenza. */
const spenti = ['misure', 'conversioni', 'orologio']
const sorte = new Sorte(5)
const classi = classiDi(moduli, { spenti, difficolta: 0.6 })
let intrusi = 0
for (let i = 0; i < TIRI; i++) {
  const c = pescaClasse(sorte, classi)
  if (c.modulo.serve(c.grado).some(s => spenti.includes(s))) intrusi++
}
uguale('spenti misure e orologio, nessun tiro ci finisce sopra', intrusi, 0)

riassunto('i pesi delle classi di domande')
