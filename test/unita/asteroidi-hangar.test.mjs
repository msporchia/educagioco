/* L'hangar degli asteroidi: chi regala cosa, e che non si coltivano le tappe
   facili. Vedi docs/asteroidi/hangar.md e docs/asteroidi/boss.md.
   `node test/esegui.mjs asteroidi-hangar --niente-build` */
import { SCALETTA } from '../../src/data/asteroidi.js'
import { TINTE, DISEGNI, STEMMI, DI_SERIE, FILA_REGALI, REGALI_VOLO, REGALI_PER_TAPPA,
         regaliDellaTappa, tipoDi, idDi } from '../../src/data/hangar.js'
import { hangarDi, possiede, pacchiDi, vintaTappa, vintoVolo, paccoNelVolo, prossimoDelVolo,
         bossNelVolo, scegli, livrea,
         aspettoDi, visto } from '../../src/motore/asteroidi/hangar.js'
import { chiaveDi } from '../../src/motore/asteroidi/sosta.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. il catalogo ══════════ */
{
  uguale('ogni tappa ha i suoi due regali, nessuno resta fuori',
         FILA_REGALI.length, SCALETTA.length * REGALI_PER_TAPPA)
  uguale('nessun regalo è doppio', new Set(FILA_REGALI).size, FILA_REGALI.length)
  controlla('nessun regalo è di serie', FILA_REGALI.every(p => !DI_SERIE.includes(p)))
  const esiste = p => ({ t: TINTE.map(t => t.id), d: DISEGNI, s: STEMMI })[tipoDi(p)].includes(idDi(p))
  const delVolo = REGALI_VOLO
  controlla('ogni regalo esiste', [...FILA_REGALI, ...delVolo, ...DI_SERIE].every(esiste))
  controlla('i pezzi del volo non li dà nessuna tappa', delVolo.every(p => !FILA_REGALI.includes(p)))
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

/* ══════════ 3. il volo: più in alto, più spesso ══════════ */
{
  controlla('una nave madre ogni tre livelli', bossNelVolo(3) && bossNelVolo(9) && !bossNelVolo(4) && !bossNelVolo(0))
  uguale('al 3 una volta su tre', paccoNelVolo(3), 1 / 3)
  uguale('al 6 una su due', paccoNelVolo(6), 1 / 2)
  uguale('al 9 due su tre', paccoNelVolo(9), 2 / 3)
  stessaLista('dal 12 sempre', [12, 15, 30].map(paccoNelVolo), [1, 1, 1])
  const h = hangarDi({})
  uguale('al 3 col dado basso il pacco c\'è', vintoVolo(h, 3, 0.2), REGALI_VOLO[0])
  uguale('col dado alto no', vintoVolo(h, 3, 0.5), null)
  uguale('il 6 regala il pezzo dopo, non uno del suo livello', vintoVolo(h, 6, 0.4), REGALI_VOLO[1])
  uguale('rifare un livello basso regala ancora', vintoVolo(h, 3, 0), REGALI_VOLO[2])
  uguale('dal 12 anche col dado più alto', vintoVolo(h, 12, 0.999), REGALI_VOLO[3])
  for (const _ of REGALI_VOLO) vintoVolo(h, 12, 0)
  controlla('i pezzi del volo si prendono tutti', REGALI_VOLO.every(p => possiede(h, p)) && !prossimoDelVolo(h))
  uguale('poi più niente', vintoVolo(h, 30, 0), null)
}

/* ══════════ 4. si sceglie solo quello che si ha ══════════ */
{
  const h = hangarDi({})
  controlla('un colore di serie si sceglie', scegli(h, 'scafo', 'rosso'))
  controlla('uno non preso no', !scegli(h, 'ali', 'oro') && h.nave.ali === undefined)
  controlla('un campo che non c\'è no', !scegli(h, 'motore', 'rosso'))
  controlla('uno stemma non preso no', !scegli(h, 'stemma', 'stella'))
  h.presi.push('s:stella')
  controlla('preso sì', scegli(h, 'stemma', 'stella'))
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
