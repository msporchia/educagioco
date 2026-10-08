/* L'hangar degli asteroidi: chi regala cosa, e che non si coltivano le tappe
   facili. Vedi docs/asteroidi/hangar.md e docs/asteroidi/boss.md.
   `node test/esegui.mjs asteroidi-hangar --niente-build` */
import { SCALETTA } from '../../src/data/asteroidi.js'
import { TINTE, DISEGNI, STEMMI, DI_SERIE, FILA_REGALI, REGALI_VOLO, REGALI_PER_TAPPA,
         regaliDellaTappa, tipoDi, idDi } from '../../src/data/hangar.js'
import { hangarDi, possiede, pacchiDi, vintaTappa, vintoVolo, bossNelVolo, scegli, livrea,
         aspettoDi, visto } from '../../src/motore/asteroidi/hangar.js'
import { chiaveDi } from '../../src/motore/asteroidi/sosta.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. il catalogo ══════════ */
{
  uguale('ogni tappa ha i suoi due regali, nessuno resta fuori',
         FILA_REGALI.length, SCALETTA.length * REGALI_PER_TAPPA)
  uguale('nessun regalo è doppio', new Set(FILA_REGALI).size, FILA_REGALI.length)
  controlla('nessun regalo è di serie', FILA_REGALI.every(p => !DI_SERIE.includes(p)))
  const esiste = p => ({ t: TINTE.map(t => t.id), d: DISEGNI, s: STEMMI })[tipoDi(p)].includes(idDi(p))
  controlla('ogni regalo esiste', [...FILA_REGALI, ...REGALI_VOLO, ...DI_SERIE].every(esiste))
  controlla('il volo regala le tinte lucide', REGALI_VOLO.every(p => TINTE.find(t => t.id === idDi(p)).lucida))
  controlla('ogni tappa ne ha due diversi', SCALETTA.every(v => regaliDellaTappa(v.pos).length === 2))
}

/* ══════════ 2. la tappa: due regali, poi più niente ══════════ */
{
  const h = hangarDi(null)
  const v = SCALETTA[3], k = chiaveDi(v)
  uguale('due pacchi prima di cominciare', pacchiDi(h, k), 2)
  const primo = vintaTappa(h, k, v.pos), secondo = vintaTappa(h, k, v.pos)
  uguale('il primo giro dà il primo regalo della tappa', primo, regaliDellaTappa(v.pos)[0])
  uguale('il secondo il secondo', secondo, regaliDellaTappa(v.pos)[1])
  uguale('il terzo niente', vintaTappa(h, k, v.pos), null)
  uguale('e la tappa non ha più pacchi', pacchiDi(h, k), 0)
  controlla('i due sono suoi, e nuovi', possiede(h, primo) && possiede(h, secondo) && h.nuovi.length === 2)
  visto(h)
  uguale('guardati, non sono più nuovi', h.nuovi.length, 0)
}

/* ══════════ 3. il volo: solo chi va più in alto ══════════ */
{
  const h = hangarDi({})
  controlla('una nave madre ogni tre livelli', bossNelVolo(3) && bossNelVolo(9) && !bossNelVolo(4) && !bossNelVolo(0))
  const a = vintoVolo(h, 9)
  uguale('la prima nave madre del volo regala la prima lucida', a, REGALI_VOLO[0])
  uguale('la stessa altezza non regala', vintoVolo(h, 9), null)
  uguale('più in basso nemmeno', vintoVolo(h, 6), null)
  uguale('più in alto sì', vintoVolo(h, 12), REGALI_VOLO[1])
}

/* ══════════ 4. si sceglie solo quello che si ha ══════════ */
{
  const h = hangarDi({})
  controlla('un colore di serie si sceglie', scegli(h, 'scafo', 'rosso'))
  controlla('uno non preso no', !scegli(h, 'ali', 'oro') && h.nave.ali === undefined)
  controlla('un campo che non c\'è no', !scegli(h, 'motore', 'rosso'))
  controlla('lo stemma di serie sì', scegli(h, 'stemma', 'stella'))
  controlla('un disegno non preso no', !scegli(h, 'disegno', 'fiamme'))
  controlla('«di serie» toglie la scelta', scegli(h, 'scafo', null) && h.nave.scafo === undefined)
  uguale('senza scelte la nave è quella di sempre', livrea({}), null)
  const l = livrea({ scafo: 'rosso', stemma: 'stella', colStemma: 'giallo' })
  controlla('la livrea dice solo colori e forme', l.scafo === '#e63946' && l.stemma === 'stella' && l.colStemma === '#ffd60a')
  uguale('un pezzo sconosciuto è nave di serie', livrea({ scafo: 'fucsia' }), null)
  uguale('un disegno si mostra sulla nave', aspettoDi('d:pois').livrea.disegno, 'pois')
  uguale('un colore è un tondo', aspettoDi('t:oro').lucida, true)
}

riassunto('asteroidi — l\'hangar')
