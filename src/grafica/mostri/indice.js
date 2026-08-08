/* ═══════════════════════════════════════════════════════════════════
   I MOSTRI NUOVI — l'indice.

   Otto bestie in più rispetto alle dieci di `grafica/castello/`
   (`corpi-mostri.js`), una per file, stessa firma `(p, s)` dei pittori
   che ci sono già — studiata lì e riprodotta qui, non importata: questo
   cantiere non tocca `grafica/castello/`, che altri agenti stanno
   modificando in parallelo (vedi `docs/castello-riassetto.md`).

   Chi sono — nome, debolezza, se volano — sta in `data/mostri.js`,
   indicizzato con lo stesso `id`. Qui c'è solo come si disegnano.

     Bosco         lupo, corvo (vola), rovo
     Sotterraneo   verme, blatta, troll
     Mura          corazziere, balestriere

   Quando questi mostri verranno agganciati al campo vero, la tabella
   qui sotto (`PITTORI_MOSTRI`) è pensata per confluire in `BESTIE` di
   `grafica/castello/corpi-mostri.js`, indicizzata allo stesso modo per
   `id`.
   ═══════════════════════════════════════════════════════════════════ */
import { lupo } from './lupo.js'
import { corvo } from './corvo.js'
import { rovo } from './rovo.js'
import { verme } from './verme.js'
import { blatta } from './blatta.js'
import { troll } from './troll.js'
import { corazziere } from './corazziere.js'
import { balestriere } from './balestriere.js'

export const PITTORI_MOSTRI = { lupo, corvo, rovo, verme, blatta, troll, corazziere, balestriere }

export const NOMI_MOSTRI_NUOVI = Object.keys(PITTORI_MOSTRI)
