/* Due anelli e una collana (docs/sotterraneo/roba.md, «Due anelli e una collana»): il catalogo dice se un gioiello è un anello o
   una collana, le caselle addosso sono sei, i salvataggi di prima (un solo `dito` per tutto) si rileggono senza perdere niente, e il
   banco del rigattiere offre le due cose. `node test/esegui.mjs sotterraneo-gioielli --niente-build` */
import { COSE, CASELLE, CASELLE_DEL_TIPO, IN_VENDITA, chiaveDelPezzo, guastiDelleCose } from '../../src/giochi/sotterraneo/dati/cose.js'
import { Corredo, ROBA_VUOTA, rileggiRoba, schedaConLaRoba, SCHIVATA_MASSIMA } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { Bottega } from '../../src/giochi/sotterraneo/motore/bottega.js'
import { MERCANTI, mercanteDi, schedaDi, vendeLa, guastiDeiMercanti } from '../../src/giochi/sotterraneo/dati/mercanti.js'
import { guastiDellaStoria } from '../../src/giochi/sotterraneo/dati/storia.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { VALORE_GEMME_MASSIMO } from '../../src/giochi/sotterraneo/dati/livelli.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const roba = extra => ({ ...ROBA_VUOTA(), ...extra })
const corredo = (extra, eroe = 'cavaliere') => new Corredo({ eroe, roba: roba(extra) })

/* ══════════ 1. il catalogo: anelli e collane ══════════ */
{
  const anelli = Object.keys(COSE).filter(k => COSE[k].dove === 'dito'), collane = Object.keys(COSE).filter(k => COSE[k].dove === 'collo')
  stessaLista('gli anelli sono i due anelli', anelli.sort(), ['anello-ambra', 'anello-verde'])
  stessaLista('le collane sono gli amuleti, il medaglione e il teschio', collane.sort(),
              ['amuleto-azzurro', 'amuleto-osso', 'amuleto-rosso', 'medaglione', 'teschio-cercatore'])
  stessaLista('le caselle addosso sono sei', CASELLE.slice().sort(), ['collo', 'corpo', 'dito', 'dito2', 'mancina', 'mano'])
  stessaLista('un anello ha due posti', CASELLE_DEL_TIPO.dito, ['dito', 'dito2'])
  stessaLista('una collana uno', CASELLE_DEL_TIPO.collo, ['collo'])
  // anche i pezzi composti (livello e rarità) e quelli col nome seguono la base
  uguale('un anello magico è un anello', COSE['anello-verde@7.m.vita'].dove, 'dito')
  uguale('una collana rara è una collana', COSE['amuleto-rosso@12.r.schivata.fortuna'].dove, 'collo')
  uguale('il pezzo col nome dell\'anello è un anello', COSE['anello-ambra@6.u.anello-di-zannaverde'].dove, 'dito')
  uguale('la collana di Re Ossuto è una collana', COSE['amuleto-osso@1.u.ciondolo-di-ossuto'].dove, 'collo')
  stessaLista('il catalogo non ha guasti', guastiDelleCose(), [])
  stessaLista('i mercanti nemmeno', guastiDeiMercanti(), [])
  stessaLista
  stessaLista('e la storia nemmeno', guastiDellaStoria(), [])
}

/* ══════════ 2. un salvataggio di prima: un solo dito per tutto ══════════ */
{
  const vecchio = (dito, extra = {}) => ({ v: 1, gemme: 3, zaino: ['pozione'], mano: 'spada', mancina: null, corpo: 'corazza', dito, torcia: 2, torce: 1, ...extra })
  const amuleto = rileggiRoba(vecchio('amuleto-rosso'))
  uguale('un amuleto al dito di prima va al collo', amuleto.collo, 'amuleto-rosso')
  uguale('e il dito resta libero', `${amuleto.dito}|${amuleto.dito2}`, 'null|null')
  const anello = rileggiRoba(vecchio('anello-verde'))
  uguale('un anello resta al dito', `${anello.dito}|${anello.dito2}|${anello.collo}`, 'anello-verde|null|null')
  const magico = rileggiRoba(vecchio('amuleto-azzurro@5.m.fortuna'))
  uguale('un amuleto magico di prima va al collo', magico.collo, 'amuleto-azzurro@5.m.fortuna')
  const gia = rileggiRoba(vecchio('amuleto-rosso', { collo: 'medaglione' }))
  uguale('se il collo è occupato l\'amuleto torna in tasca, senza perdersi', `${gia.collo}|${gia.zaino.join()}`, 'medaglione|pozione,amuleto-rosso')
  uguale('un id sparito si butta', rileggiRoba(vecchio('amuleto-che-non-esiste')).dito, null)
  uguale('niente altro cambia', JSON.stringify([amuleto.gemme, amuleto.mano, amuleto.corpo, amuleto.torcia, amuleto.torce]), JSON.stringify([3, 'spada', 'corazza', 2, 1]))
  // un salvataggio senza `collo` e senza `dito2` ha sempre la forma nuova
  controlla('le chiavi nuove ci sono, vuote', 'collo' in anello && 'dito2' in anello)
  // il giro completo: il Corredo lo veste, lo riscrive, e rileggendolo non cambia più
  const c = new Corredo({ eroe: 'cavaliere', roba: vecchio('amuleto-rosso') })
  uguale('il corredo di prima porta l\'amuleto al collo', `${c.collo}|${c.dito}`, 'amuleto-rosso|null')
  const scritta = c.roba
  uguale('riscritto ha il collo', scritta.collo, 'amuleto-rosso')
  uguale('e le vecchie chiavi non cambiano senso', JSON.stringify(rileggiRoba(scritta)), JSON.stringify(scritta))
  uguale('la scheda dell\'eroe lo conta', schedaConLaRoba('cavaliere', vecchio('amuleto-rosso')).vita, 18 + COSE['amuleto-rosso'].vita)
}

/* ══════════ 3. due anelli insieme, e le loro abilità si sommano ══════════ */
{
  const due = corredo({ dito: 'anello-verde', dito2: 'anello-verde' })
  uguale('due anelli uguali si portano insieme', `${due.dito}|${due.dito2}`, 'anello-verde|anello-verde')
  uguale('le gemme si sommano: ogni gemma vale il doppio', due.valoreGemme, 2)
  const luci = corredo({ dito: 'anello-ambra', dito2: 'anello-ambra' })
  uguale('la luce si somma', luci.addosso('luce'), 5)
  const misti = corredo({ dito: 'anello-verde', dito2: 'anello-ambra', collo: 'teschio-cercatore' })
  uguale('anelli e collana insieme: 1 + 0,5 + 1 farebbe 2,5, ma una gemma vale al più il doppio', misti.valoreGemme, VALORE_GEMME_MASSIMO)
  uguale('e la luce solo dall\'ambra', misti.addosso('luce'), 2.5)
  controlla('quello che hai addosso è indossato', misti.indossato('anello-verde') && misti.indossato('teschio-cercatore'))
  uguale('quanti ne hai: due anelli uguali', due.quanteNeHo('anello-verde'), 2)
  // la schivata ha un tetto, qualunque sia la somma
  const molta = corredo({ dito: chiaveDelPezzo('anello-verde', 90, 'raro', ['schivata', 'vita']), dito2: chiaveDelPezzo('anello-ambra', 90, 'raro', ['schivata', 'vita']),
                          collo: chiaveDelPezzo('amuleto-rosso', 90, 'raro', ['schivata', 'vita']) })
  molta.livelloLibero = true
  controlla('tre gioielli rari di schivata non passano il tetto', molta.schivata <= SCHIVATA_MASSIMA && molta.addosso('schivata') > 30, `${molta.addosso('schivata')} → ${molta.schivata}`)
}

/* ══════════ 4. dove va un gioiello ══════════ */
{
  // un anello nuovo va sul primo dito libero, una collana al collo
  const c = corredo({ zaino: ['anello-verde', 'anello-ambra', 'amuleto-rosso', 'amuleto-azzurro'] })
  c.indossaDallaTasca(c.zaino.indexOf('anello-verde'))
  uguale('il primo anello va al primo dito', `${c.dito}|${c.dito2}`, 'anello-verde|null')
  c.indossaDallaTasca(c.zaino.indexOf('anello-ambra'))
  uguale('il secondo sul dito libero', `${c.dito}|${c.dito2}`, 'anello-verde|anello-ambra')
  c.indossaDallaTasca(c.zaino.indexOf('amuleto-rosso'))
  uguale('l\'amuleto al collo, mai su un dito', `${c.collo}|${c.dito}|${c.dito2}`, 'amuleto-rosso|anello-verde|anello-ambra')
  c.indossaDallaTasca(c.zaino.indexOf('amuleto-azzurro'))
  uguale('una seconda collana prende il posto della prima', c.collo, 'amuleto-azzurro')
  controlla('e la prima torna in tasca, non si perde', c.zaino.includes('amuleto-rosso'))
  // una cosa che non è un gioiello non finisce su un dito
  uguale('una collana non ha caselle da anello', CASELLE_DEL_TIPO[COSE['amuleto-rosso'].dove].join(), 'collo')
}

/* ══════════ 5. i due anelli pieni: sostituisce quello che rende meno, e si può scegliere l'altro ══════════ */
{
  // un anello magico di difesa e vita, contro l'ambra magico di vita e il verde: prende il posto di chi vale meno (il verde)
  const forte = chiaveDelPezzo('anello-verde', 1, 'magico', ['dif', 'vita'])
  const buono = chiaveDelPezzo('anello-ambra', 1, 'magico', ['vita']), debole = 'anello-verde'
  const c = corredo({ dito: buono, dito2: debole, zaino: [forte] })
  controlla('con tutti e due i posti pieni un anello nuovo non si mette da sé', !c.vaAddosso(forte))
  const prova = c.seLoMetto(forte)
  controlla('il confronto dice quale anello sostituirebbe', prova.fuori === c.casella(prova.dove) && ['dito', 'dito2'].includes(prova.dove), JSON.stringify([prova.dove, prova.fuori]))
  uguale('è quello che rende meno', prova.fuori, debole)
  uguale('il confronto nomina quel solo anello', prova.cambio.toglie.join(), debole)
  uguale('sul secondo dito', prova.dove, 'dito2')
  controlla('c\'è anche la prova sull\'altro dito', prova.altro && prova.altro.dove !== prova.dove, JSON.stringify(prova.altro && prova.altro.dove))
  uguale('e dice che toglierebbe l\'altro anello', prova.altro.cambio.toglie.join(), buono)
  uguale('un\'altra prova non ne ha una terza', prova.altro.altro, undefined)
  // indossare senza scegliere: dove rende meno; scegliendo: dove si vuole. Quello che c'era torna in tasca
  const a = corredo({ dito: buono, dito2: debole, zaino: [forte] })
  a.indossaDallaTasca(0)
  uguale('di difetto prende il posto del verde', `${a.dito}|${a.dito2}`, `${buono}|${forte}`)
  controlla('e il verde torna in tasca', a.zaino.includes(debole))
  const b = corredo({ dito: buono, dito2: debole, zaino: [forte] })
  b.indossaDallaTasca(0, 'dito')
  uguale('scegliendo l\'altro dito prende il posto dell\'ambra magico', `${b.dito}|${b.dito2}`, `${forte}|${debole}`)
  controlla('e l\'ambra magico torna in tasca', b.zaino.includes(buono))
  controlla('le gemme: il verde tolto le porta via, il verde tenuto le tiene', b.valoreGemme === 2 && a.valoreGemme === 1.5, `${b.valoreGemme} ${a.valoreGemme}`)
  // un dito scelto per una collana non vale: la collana va al collo
  const d = corredo({ zaino: ['amuleto-rosso'] })
  d.indossaDallaTasca(0, 'dito')
  uguale('un amuleto non va mai su un dito, anche se lo si chiede', `${d.collo}|${d.dito}`, 'amuleto-rosso|null')
  // un dito libero non propone scambi
  controlla('con un dito libero l\'altro non è offerto', corredo({ dito: 'anello-verde' }).seLoMetto('anello-ambra').altro === undefined)
  // il posto libero si vede dal tipo
  controlla('postoLibero: un anello ha ancora un dito', corredo({ dito: 'anello-verde' }).postoLibero('dito'))
  controlla('con due anelli no', !corredo({ dito: 'anello-verde', dito2: 'anello-ambra' }).postoLibero('dito'))
  controlla('la collana sì finché è vuota', corredo({ dito: 'anello-verde' }).postoLibero('collo'))
}

/* ══════════ 6. toglierne uno non ne perde nessuno ══════════ */
{
  const e = corredo({ dito: 'anello-verde', dito2: 'anello-ambra', collo: 'medaglione', mano: 'spada' })
  e.riponi('dito2')
  uguale('riporre un anello libera quel dito', `${e.dito}|${e.dito2}`, 'anello-verde|null')
  controlla('e l\'anello è nello zaino', e.zaino.includes('anello-ambra'))
  e.riponi('collo')
  uguale('riporre la collana libera il collo', e.collo, null)
  uguale('i pezzi sono tutti ancora lì', e.zaino.length, 2)
  // addosso e in tasca stanno nella roba che si salva
  const r = e.roba
  uguale('la roba salvata ha i sei posti', JSON.stringify([r.dito, r.dito2, r.collo]), JSON.stringify(['anello-verde', null, null]))
}

/* ══════════ 7. la bottega: anelli e collane sotto la stessa linguetta ══════════ */
{
  const m = mercanteDi('rigattiere')
  uguale('il rigattiere ha la linguetta dei gioielli', m.schede[0].chiave, 'gioielli')
  stessaLista('e dice dito e collo', m.schede[0].dove, ['dito', 'collo'])
  controlla('le collane stanno sotto i gioielli', IN_VENDITA.filter(k => COSE[k].dove === 'collo').every(k => vendeLa(m, k) && schedaDi(m, k).chiave === 'gioielli'))
  controlla('anche gli anelli', IN_VENDITA.filter(k => COSE[k].dove === 'dito').every(k => vendeLa(m, k) && schedaDi(m, k).chiave === 'gioielli'))
  let anelli = 0, collane = 0, banchi = 0
  for (let seme = 1; seme <= 30; seme++) {
    const b = new Bottega({ roba: roba({ gemme: 99 }), finite: 3, rnd: seminato(seme) })
    const stock = b.mercanziaVista('rigattiere').map(r => COSE[r.chiave]).filter(x => x.dove)
    banchi++
    if (stock.some(x => x.dove === 'dito')) anelli++
    if (stock.some(x => x.dove === 'collo')) collane++
  }
  controlla('il banco offre anelli', anelli > banchi / 2, `${anelli}/${banchi}`)
  controlla('e collane', collane > banchi / 2, `${collane}/${banchi}`)
  // comprare: il primo anello al primo dito, il secondo al secondo, la collana al collo
  const b = new Bottega({ roba: roba({ gemme: 999 }), finite: 3, rnd: seminato(5) })
  b.banchi.rigattiere = ['anello-verde', 'anello-ambra', 'amuleto-rosso']
  b.prepara('rigattiere')
  b.compraDa('rigattiere', 'anello-verde')
  b.compraDa('rigattiere', 'anello-ambra')
  b.compraDa('rigattiere', 'amuleto-rosso')
  uguale('comprati, stanno nei loro tre posti', `${b.dito}|${b.dito2}|${b.collo}`, 'anello-verde|anello-ambra|amuleto-rosso')
  uguale('nello zaino non è rimasto niente', b.zaino.length, 0)
  // a due anelli pieni il terzo si compra ma non si mette da sé: è una scelta
  const pieno = new Bottega({ roba: roba({ gemme: 999, dito: 'anello-verde', dito2: 'anello-ambra' }), finite: 3, rnd: seminato(5) })
  const nuovo = chiaveDelPezzo('anello-verde', 1, 'magico', ['vita'])
  pieno.banchi.rigattiere = [nuovo]
  pieno.compraDa('rigattiere', nuovo)
  controlla('con i due anelli pieni, il terzo va in tasca', pieno.zaino.includes(nuovo) && pieno.dito === 'anello-verde')
}

riassunto('due anelli e una collana')
