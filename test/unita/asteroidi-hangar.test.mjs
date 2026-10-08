/* L'hangar degli asteroidi: chi regala cosa, e che non si coltivano le tappe
   facili. Vedi docs/asteroidi/hangar.md e docs/asteroidi/boss.md.
   `node test/esegui.mjs asteroidi-hangar --niente-build` */
import { SCALETTA } from '../../src/data/asteroidi.js'
import { TINTE, DISEGNI, STEMMI, DI_SERIE, FILA_REGALI, REGALI_VOLO, REGALI_PER_TAPPA, POSTI_COLORE,
         CATALOGO_VOLO, regaliDellaTappa, pezzo, tipoDi, idDi } from '../../src/data/hangar.js'
import { hangarDi, possiede, pacchiDi, vintaTappa, vintoVolo, paccoNelVolo, prossimoDelVolo,
         bossNelVolo, scegli, livrea,
         aspettoDi, visto } from '../../src/motore/asteroidi/hangar.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. il catalogo ══════════ */
{
  uguale('ogni tappa ha i suoi due regali, nessuno resta fuori',
         FILA_REGALI.length, SCALETTA.length * REGALI_PER_TAPPA)
  uguale('nessun regalo è doppio', new Set(FILA_REGALI).size, FILA_REGALI.length)
  controlla('nessun regalo è di serie', FILA_REGALI.every(p => !DI_SERIE.includes(p)))
  const esiste = p => (POSTI_COLORE.includes(tipoDi(p)) ? TINTE.map(t => t.id)
                       : { d: DISEGNI, s: STEMMI }[tipoDi(p)] || []).includes(idDi(p))
  const delVolo = REGALI_VOLO
  controlla('ogni regalo esiste', [...CATALOGO_VOLO, ...DI_SERIE].every(esiste))
  controlla('i pezzi del volo non li dà nessuna tappa', delVolo.every(p => !FILA_REGALI.includes(p)))
  // ogni «?» dell'hangar è un pezzo che qualcuno regala
  const tutti = [...POSTI_COLORE.flatMap(c => TINTE.map(t => pezzo(c, t.id))),
                 ...DISEGNI.map(d => pezzo('d', d)), ...STEMMI.map(s => pezzo('s', s))]
    .filter(p => !DI_SERIE.includes(p))
  uguale('il volo può dare ogni pezzo che non è di serie', tutti.filter(p => !CATALOGO_VOLO.includes(p)).join(' '), '')
  uguale('e ognuno una volta sola', new Set(CATALOGO_VOLO).size, CATALOGO_VOLO.length)
  uguale('i colori sono uno per posto: 22 tinte per 5 posti, più disegni e stemmi',
         CATALOGO_VOLO.length, 22 * 5 + DISEGNI.length + STEMMI.length)
  controlla('ogni tappa ne ha due diversi', SCALETTA.every(v => regaliDellaTappa(v.pos).length === 2))
}

/* ══════════ 2. la tappa: due regali, poi più niente ══════════ */
{
  const h = hangarDi(null)
  const v = SCALETTA[3]
  uguale('due pacchi prima di cominciare', pacchiDi(h, v.pos), 2)
  const primo = vintaTappa(h, v.pos), secondo = vintaTappa(h, v.pos)
  uguale('il primo giro dà il primo regalo della tappa', primo, regaliDellaTappa(v.pos)[0])
  uguale('il secondo il secondo', secondo, regaliDellaTappa(v.pos)[1])
  uguale('il terzo niente', vintaTappa(h, v.pos), null)
  uguale('e la tappa non ha più pacchi', pacchiDi(h, v.pos), 0)
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
  while (REGALI_VOLO.some(p => !possiede(h, p))) vintoVolo(h, 12, 0)
  controlla('i pezzi del volo si prendono tutti', REGALI_VOLO.every(p => possiede(h, p)))
  const [a, b] = regaliDellaTappa(0)
  uguale('poi quelli delle tappe, in fila', vintoVolo(h, 12, 0), a)
  uguale('la tappa che l\'ha perso dà l\'altro', vintaTappa(h, 0), b)
  uguale('e non ha più pacchi', pacchiDi(h, 0), 0)
  uguale('a turno, un colore di un altro posto', vintoVolo(h, 12, 0), 'ali:arancio')
  uguale('il volo salta quelli già presi (il secondo della tappa)', vintoVolo(h, 12, 0), 'fiamma:arancio')
  uguale('e torna alle tappe', vintoVolo(h, 12, 0), FILA_REGALI[2])
  for (const _ of CATALOGO_VOLO) vintoVolo(h, 12, 0)
  controlla('alla fine il volo ha dato tutto', CATALOGO_VOLO.every(p => possiede(h, p)) && !prossimoDelVolo(h))
  uguale('e poi più niente', vintoVolo(h, 30, 0), null)
}

/* ══════════ 4. si sceglie solo quello che si ha ══════════ */
{
  const h = hangarDi({})
  controlla('un colore di serie si sceglie', scegli(h, 'scafo', 'rosso'))
  controlla('uno non preso no', !scegli(h, 'ali', 'oro') && h.nave.ali === undefined)
  h.presi.push('scafo:oro')
  controlla('preso per lo scafo vale lo scafo', scegli(h, 'scafo', 'oro'))
  controlla('ma non le ali', !scegli(h, 'ali', 'oro'))
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
  uguale('un colore è un tondo', aspettoDi('ali:oro').lucida, true)
}

/* ══════════ 5. i colori vecchi valevano per tutti i posti ══════════ */
{
  const h = hangarDi({ presi: ['t:oro', 't:rosso', 'd:pois'], nuovi: ['t:oro'] })
  controlla('un colore vecchio si apre in uno per posto',
            POSTI_COLORE.every(c => h.presi.includes(pezzo(c, 'oro'))) && !h.presi.includes('t:oro'))
  controlla('quelli di serie non entrano fra i presi', !h.presi.some(p => idDi(p) === 'rosso'))
  controlla('il resto resta', h.presi.includes('d:pois') && h.nuovi.length === POSTI_COLORE.length)
  uguale('rileggere non cambia niente', JSON.stringify(hangarDi(JSON.parse(JSON.stringify(h)))), JSON.stringify(h))
}

riassunto('asteroidi — l\'hangar')
