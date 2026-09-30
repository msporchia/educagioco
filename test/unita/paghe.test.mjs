/* ═══════════════════════════════════════════════════════════════════
   SI PAGA SUBITO, E BASTA

   La moneta arriva nel momento in cui il bambino fa la cosa che la
   merita, e non a fine tappa: niente premi aggiuntivi, niente
   moltiplicatori, niente mezze monete. Il perché:
   docs/apprendimento/calibrazione.md («Si paga subito, e basta»).

   Due cose che questo test esiste per fermare:
     1. un tasso che non è un intero, o che scappa di mano;
     2. un gioco che fa esercitare e torna a pagare con `addCoins` — cioè
        un premio di fine tappa rimesso lì — invece che dalla `borsa`.
   ═══════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PAGA, guastiDellePaghe } from '../../src/data/paghe.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

uguale('i tassi sono monete intere, da una a quattro', guastiDellePaghe().join(' · '), '')
uguale('e la regola li vede', guastiDellePaghe({ mezza: 0.5 }).length, 1)
controlla('una domanda che ferma il gioco vale più di un colpo d\'occhio', PAGA.domanda > PAGA.asteroide)

const radice = resolve(import.meta.dirname, '../..')
const SUBITO = [
  'src/views/MathGame.vue', 'src/views/TowerDefense.vue', 'src/views/LinguaGame.vue',
  'src/views/BancarellaGame.vue',
  ...['dungeon', 'sotterraneo', 'survivors', 'corsa', 'conta', 'prima-dopo', 'pozioni', 'inglese']
    .map(g => `src/giochi/${g}/Gioco.vue`),
]
for (const f of SUBITO) {
  const testo = readFileSync(resolve(radice, f), 'utf8')
  controlla(`${f}: paga dalla borsa o da incassa`, /\bborsa\(|\bincassa\(/.test(testo))
  controlla(`${f}: e non con addCoins, che era il premio di fine tappa`, !/\baddCoins\(/.test(testo))
  controlla(`${f}: niente moltiplicatore di livello`, !/\blevel\.value\b/.test(testo))
}

riassunto('si paga subito')
