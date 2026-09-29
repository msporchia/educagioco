// Otto bestie in più rispetto alle dieci di `grafica/castello/corpi-mostri.js`
// (Bosco: lupo, corvo, rovo · Sotterraneo: verme, blatta, troll · Mura:
// corazziere, balestriere), stessa firma `(p, s)`, confluite in `BESTIE` da
// `grafica/castello/mostro.js`. Chi sono — nome, resistenza, immunità — sta
// in `data/mostri.js`, indicizzato allo stesso `id`.
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
