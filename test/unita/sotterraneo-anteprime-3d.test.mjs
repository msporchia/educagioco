/* ═══════════════════════════════════════════════════════════════════
   LE ANTEPRIME 3D DEL SOTTERRANEO — docs/sotterraneo/anteprime-3d.md

   Quale modello per quale oggetto (la stessa mappa che veste l'eroe in
   scena), le chiavi della cache (le stesse per la stessa figura, null
   dove non c'è un modello e resta lo sprite), il ritorno dalle chiavi,
   e la coda: una volta per chiave, un guasto vale null, si cede il filo.
   ═══════════════════════════════════════════════════════════════════ */
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { MOSTRI } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { perId } from '../../src/giochi/sotterraneo/scena3d/eroi3d/collezione.js'
import { TIPI } from '../../src/giochi/sotterraneo/scena3d/eroi3d/armature.js'
import { idDi } from '../../src/giochi/sotterraneo/scena3d/mostri3d/registro.js'
import { FIGURE3D } from '../../src/giochi/sotterraneo/dati/figure3d.js'
import { MODELLO_DI, ARMATURE, modelloDi, pregioDi, dotazioneDi, pezzo3dDi, chiaveDellaCosa, chiaveDellEroe, chiaveDelMostro, leggiChiave, creaCoda, MISURE }
  from '../../src/giochi/sotterraneo/scena3d/anteprime3d-pura.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

// la mappa: ogni modello esiste nella collezione, ogni arma e scudo del gioco ne ha uno, le armature sono quelle del 3D
for (const [k, id] of Object.entries(MODELLO_DI)) controlla(`${k} → ${id}: è nella collezione`, !!perId(id))
for (const [k, c] of Object.entries(COSE)) {
  if (c.dove === 'mano' || c.dove === 'mancina') controlla(`${k}: ha un modello 3D`, !!modelloDi(k) && !!perId(modelloDi(k)))
  if (c.dove === 'corpo') controlla(`${k}: è un'armatura 3D`, ARMATURE.includes(k) && TIPI.includes(k))
}
uguale('un pezzo trovato ha come ripiego il modello della sua base', modelloDi('spada@7.m.fuoco'), 'spada-lunga')

// il pregio dell'armatura viene dalla rarità
uguale('corazza di base: pregio 1', pregioDi('corazza'), 1)
uguale('corazza comune trovata: pregio 1', pregioDi('corazza@5'), 1)
uguale('corazza magica: pregio 2', pregioDi('corazza@5.m.vita'), 2)
uguale('corazza rara: pregio 3', pregioDi('corazza@5.r.vita.dif'), 3)

// il pezzo 3D: la figura dello sprite (docs/sotterraneo/roba-3d.md), il ripiego, la rarità e l'elemento
uguale('la spada di base: la sua figura e il ripiego', JSON.stringify(pezzo3dDi('spada')),
  JSON.stringify({ figura: 'spada-26', id: 'spada-lunga', rarita: 'comune', elemento: 'natura' }))
uguale('un pezzo trovato ha la figura del suo aspetto', pezzo3dDi('spada@7.m.fuoco').figura, COSE['spada@7.m.fuoco'].sprite)
uguale('…e la rarità', pezzo3dDi('spada@7.m.fuoco').rarita, 'magico')
uguale('un pezzo col nome ha la sua figura', pezzo3dDi('spada@9.u.zanna-del-drago').figura, 'spada-29')
uguale('uno sprite fuori dai fogli: solo il ripiego', JSON.stringify(pezzo3dDi('pugnale-vampiro')), JSON.stringify({ figura: null, id: 'pugnale', rarita: 'comune', elemento: 'nessuno' }))

// la dotazione: la stessa regola dell'eroe in scena (l'arco nella sinistra, lo scudo solo con un'arma a una mano)
const d = dotazioneDi({ mano: 'spada', mancina: 'scudo-ferro', corpo: 'corazza' })
uguale('spada e scudo', `${d.destra.id} ${d.sinistra.id} ${d.corpo.tipo}.${d.corpo.pregio}`, 'spada-lunga scudo-rotondo corazza.1')
uguale('l\'arco sta nella sinistra, e lo scudo non c\'è', [dotazioneDi({ mano: 'arco-lungo', mancina: 'scudo-legno' })].map(x => `${x.destra}|${x.sinistra.id}|${x.corpo}`)[0], 'null|arco-lungo|null')
uguale('a due mani niente scudo', dotazioneDi({ mano: 'spadone', mancina: 'scudo-legno' }).sinistra, null)
uguale('niente roba, niente dotazione', JSON.stringify(dotazioneDi({})), JSON.stringify({ destra: null, sinistra: null, corpo: null, collo: null, testa: null }))
uguale('al collo una collana con la sua figura', dotazioneDi({ collo: 'medaglione@3.m.vita' }).collo.figura, COSE['medaglione@3.m.vita'].sprite)
uguale('un anello non sta al collo', dotazioneDi({ collo: 'anello-ambra' }).collo, null)

// le chiavi: null dove resta lo sprite, la stessa per la stessa figura e la stessa rarità
for (const k of ['medaglione', 'amuleto-rosso', 'amuleto-osso']) uguale(`${k}: niente modello, resta lo sprite`, chiaveDellaCosa({ chiave: k }), null)
uguale('una pozione: il suo modello', chiaveDellaCosa({ chiave: 'pozione' }), 'consumabile:pozione:c')
uguale('la torcia anche', chiaveDellaCosa({ chiave: 'torcia' }), 'consumabile:torcia:c')
uguale('un rarissimo brilla come un raro', chiaveDellaCosa({ chiave: 'elisir-toro' }), 'consumabile:elisir-toro:r')
uguale('un consumabile letto', JSON.stringify(leggiChiave('consumabile:ampolla-vita:r')), JSON.stringify({ tipo: 'consumabile', pezzo: { consumabile: 'ampolla-vita', rarita: 'raro', elemento: 'nessuno' } }))
uguale('un consumabile che non c\'è', leggiChiave('consumabile:spada:c'), null)
uguale('una cosa senza chiave', chiaveDellaCosa(null), null)
uguale('un\'arma', chiaveDellaCosa({ chiave: 'spada' }), 'arma:spada-26.spada-lunga.c.natura')
{
  const altra = Array.from({ length: 60 }, (_, i) => `spada@${i + 3}`).find(k => COSE[k].sprite === COSE['spada@2'].sprite)
  uguale(`due spade comuni con la stessa figura (spada@2, ${altra}): la stessa anteprima`, chiaveDellaCosa({ chiave: altra }), chiaveDellaCosa({ chiave: 'spada@2' }))
}
controlla('la rarità cambia l\'anteprima', chiaveDellaCosa({ chiave: 'spada@3' }).split('.')[2] === 'c' && chiaveDellaCosa({ chiave: 'spada@3.r.att.vita' }).split('.')[2] === 'r')
uguale('uno scudo', chiaveDellaCosa({ chiave: 'scudo-crociato' }), 'scudo:scudo-18.scudo-cavaliere.c.luce')
uguale('un anello: un gioiello', chiaveDellaCosa({ chiave: 'anello-ambra' }), 'gioiello:amuleto-33.-.c.fuoco')
uguale('l\'armatura sta su chi la porta', chiaveDellaCosa({ chiave: 'saio' }, 'mago'), 'armatura:saio:1:mago:saio.1.veste-15.c.luce')
uguale('un eroe sconosciuto è il cavaliere', chiaveDellaCosa({ chiave: 'saio' }, 'nessuno').split(':')[3], 'cavaliere')
uguale('l\'eroe vestito', chiaveDellEroe('nano', { mano: 'accetta', mancina: 'scudo-leone', corpo: 'corazza@5.r.vita.dif' }),
  `eroe:nano:ascia-04.accetta.c.nessuno:scudo-20.scudo-nanico.c.oro:corazza.3.${COSE['corazza@5.r.vita.dif'].sprite}.r.${FIGURE3D[COSE['corazza@5.r.vita.dif'].sprite].elemento}:-`)
uguale('a mezzo busto', chiaveDellEroe('elfa', {}, 'busto'), 'busto:elfa:-:-:-:-')
uguale('un mostro', chiaveDelMostro({ tipo: 'lupo', grado: 'raro' }), 'mostro:lupo:raro:-')
uguale('un grosso', chiaveDelMostro({ tipo: 'orco', grosso: 'grumo' }), 'mostro:grosso:grumo')

// leggere le chiavi: tornano quello che serve al disegno, e le sconosciute valgono null
const roba = { mano: 'accetta', mancina: 'scudo-leone', corpo: 'corazza@5.r.vita.dif', collo: 'medaglione@3.m.vita' }
const e = leggiChiave(chiaveDellEroe('nano', roba))
uguale('l\'eroe letto è la dotazione di dotazioneDi', JSON.stringify({ destra: e.destra, sinistra: e.sinistra, corpo: e.corpo, collo: e.collo, testa: e.testa }),
  JSON.stringify(dotazioneDi(roba)))
uguale('un\'arma letta', JSON.stringify(leggiChiave('arma:spada-28.spada-lunga.m.fuoco')), JSON.stringify({ tipo: 'arma', pezzo: { figura: 'spada-28', id: 'spada-lunga', rarita: 'magico', elemento: 'fuoco' } }))
uguale('un mostro letto', JSON.stringify(leggiChiave('mostro:scheletro:magico:guerriero')), JSON.stringify({ tipo: 'mostro', r: { tipo: 'scheletro', grado: 'magico', variante: 'guerriero' } }))
for (const k of ['', 'boh:1', 'armatura:pigiama:1:elfa', 'mostro:', 'arma:-.-.c.nessuno', 'arma:spada-lunga']) uguale(`«${k}» non si legge`, leggiChiave(k), null)
for (const t of ['arma', 'scudo', 'gioiello', 'consumabile', 'armatura', 'eroe', 'busto', 'mostro']) controlla(`${t}: ha la sua misura`, MISURE[t] && MISURE[t][0] <= 192 && MISURE[t][1] <= 192)

// i mostri: chi non ha un modello torna allo sprite (idDi null), gli altri hanno la chiave che il disegno risolve
for (const t of Object.keys(MOSTRI)) {
  const r = leggiChiave(chiaveDelMostro({ tipo: t })).r
  uguale(`${t}: la chiave porta allo stesso modello della scena`, idDi(r), idDi({ tipo: t, grado: 'comune' }))
}

// la coda: una volta per chiave, nell'ordine, un guasto vale null, si cede il filo fra un giro e l'altro
{
  const fatte = [], giri = []
  let ora = 0
  const coda = creaCoda(k => { fatte.push(k); ora += 10; if (k === 'rotta') throw new Error('no'); return k === 'vuota' ? null : `img:${k}` },
    { pianifica: fn => giri.push(fn), ora: () => ora, budget: 15 })
  const p = ['a', 'b', 'a', 'rotta', 'vuota', 'c'].map(k => coda.chiedi(k))
  uguale('niente si disegna prima che il filo lo conceda', fatte.length, 0)
  controlla('la stessa chiave dà la stessa promessa', p[0] === p[2])
  while (giri.length) giri.shift()()
  uguale('ogni chiave una volta sola, nell\'ordine', fatte.join(','), 'a,b,rotta,vuota,c')
  const r = await Promise.all(p)
  uguale('le immagini, e null per il guasto e per chi non ne ha', r.join(','), 'img:a,img:b,img:a,,,img:c')
  uguale('pronta e già letta', coda.leggi('a'), 'img:a')
  uguale('mai chiesta: null', coda.leggi('z'), null)
  coda.chiedi('a'); uguale('chiesta di nuovo: non si ridisegna', fatte.length, 5)
}
{
  const giri = []
  let ora = 0
  const coda = creaCoda(() => { ora += 20; return 'x' }, { pianifica: fn => giri.push(fn), ora: () => ora, budget: 8 })
  for (const k of ['a', 'b', 'c']) coda.chiedi(k)
  giri.shift()()
  uguale('oltre il budget, una per giro (almeno una)', coda.inCoda, 2)
  const q = coda.chiedi('d')
  coda.via()
  uguale('chiusa, quel che aspetta vale null', await q, null)
  uguale('chiusa, una richiesta nuova vale null', await coda.chiedi('e'), null)
}
{
  const giri = []
  let ora = 0, fine
  const coda = creaCoda(() => new Promise(r => { fine = r }), { pianifica: fn => giri.push(fn), ora: () => ora })
  const p = coda.chiedi('a')
  giri.shift()()
  uguale('una promessa: non è pronta finché non arriva', coda.pronta('a'), false)
  fine('tela'); uguale('poi lo è', await p, 'tela')
}

riassunto('le anteprime 3D del sotterraneo')
