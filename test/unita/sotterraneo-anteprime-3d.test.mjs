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
import { MODELLO_DI, ARMATURE, modelloDi, pregioDi, dotazioneDi, chiaveDellaCosa, chiaveDellEroe, chiaveDelMostro, leggiChiave, creaCoda, MISURE }
  from '../../src/giochi/sotterraneo/scena3d/anteprime3d-pura.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

// la mappa: ogni modello esiste nella collezione, ogni arma e scudo del gioco ne ha uno, le armature sono quelle del 3D
for (const [k, id] of Object.entries(MODELLO_DI)) controlla(`${k} → ${id}: è nella collezione`, !!perId(id))
for (const [k, c] of Object.entries(COSE)) {
  if (c.dove === 'mano' || c.dove === 'mancina') controlla(`${k}: ha un modello 3D`, !!modelloDi(k) && !!perId(modelloDi(k)))
  if (c.dove === 'corpo') controlla(`${k}: è un'armatura 3D`, ARMATURE.includes(k) && TIPI.includes(k))
}
uguale('un pezzo trovato ha il modello della sua base', modelloDi('spada@7.m.fuoco'), 'spada-lunga')

// il pregio dell'armatura viene dalla rarità
uguale('corazza di base: pregio 1', pregioDi('corazza'), 1)
uguale('corazza comune trovata: pregio 1', pregioDi('corazza@5'), 1)
uguale('corazza magica: pregio 2', pregioDi('corazza@5.m.vita'), 2)
uguale('corazza rara: pregio 3', pregioDi('corazza@5.r.vita.dif'), 3)

// la dotazione: la stessa regola dell'eroe in scena (l'arco nella sinistra, lo scudo solo con un'arma a una mano)
uguale('spada e scudo', JSON.stringify(dotazioneDi({ mano: 'spada', mancina: 'scudo-ferro', corpo: 'corazza' })),
  JSON.stringify({ destra: 'spada-lunga', sinistra: 'scudo-rotondo', corpo: { tipo: 'corazza', pregio: 1 } }))
uguale('l\'arco sta nella sinistra, e lo scudo non c\'è', JSON.stringify(dotazioneDi({ mano: 'arco-lungo', mancina: 'scudo-legno' })),
  JSON.stringify({ destra: null, sinistra: 'arco-lungo', corpo: null }))
uguale('a due mani niente scudo', dotazioneDi({ mano: 'spadone', mancina: 'scudo-legno' }).sinistra, null)
uguale('niente roba, niente dotazione', JSON.stringify(dotazioneDi({})), JSON.stringify({ destra: null, sinistra: null, corpo: null }))

// le chiavi: null dove resta lo sprite, la stessa per la stessa figura
for (const k of ['anello-ambra', 'medaglione', 'pozione', 'torcia', 'chiave', 'elisir-toro']) uguale(`${k}: niente modello, resta lo sprite`, chiaveDellaCosa({ chiave: k }), null)
uguale('una cosa senza chiave', chiaveDellaCosa(null), null)
uguale('un\'arma', chiaveDellaCosa({ chiave: 'spada' }), 'arma:spada-lunga')
uguale('due spade di rarità diverse: la stessa anteprima', chiaveDellaCosa({ chiave: 'spada@3.r.att.vita' }), chiaveDellaCosa({ chiave: 'spada@9' }))
uguale('uno scudo', chiaveDellaCosa({ chiave: 'scudo-crociato@4' }), 'scudo:scudo-cavaliere')
uguale('l\'armatura sta su chi la porta', chiaveDellaCosa({ chiave: 'manto@2.m.vita' }, 'mago'), 'armatura:manto:2:mago')
uguale('un eroe sconosciuto è il cavaliere', chiaveDellaCosa({ chiave: 'saio' }, 'nessuno'), 'armatura:saio:1:cavaliere')
uguale('l\'eroe vestito', chiaveDellEroe('nano', { mano: 'accetta', mancina: 'scudo-leone', corpo: 'corazza@5.r.vita.dif' }), 'eroe:nano:accetta:scudo-nanico:corazza.3')
uguale('a mezzo busto', chiaveDellEroe('elfa', {}, 'busto'), 'busto:elfa:-:-:-')
uguale('un mostro', chiaveDelMostro({ tipo: 'lupo', grado: 'raro' }), 'mostro:lupo:raro:-')
uguale('un grosso', chiaveDelMostro({ tipo: 'orco', grosso: 'grumo' }), 'mostro:grosso:grumo')

// leggere le chiavi: tornano quello che serve al disegno, e le sconosciute valgono null
const e = leggiChiave('eroe:nano:accetta:scudo-nanico:corazza.3')
uguale('l\'eroe letto', JSON.stringify(e), JSON.stringify({ tipo: 'eroe', eroe: 'nano', destra: 'accetta', sinistra: 'scudo-nanico', corpo: { tipo: 'corazza', pregio: 3 } }))
uguale('la dotazione letta è quella di dotazioneDi', JSON.stringify({ destra: e.destra, sinistra: e.sinistra, corpo: e.corpo }),
  JSON.stringify(dotazioneDi({ mano: 'accetta', mancina: 'scudo-leone', corpo: 'corazza@5.r.vita.dif' })))
uguale('un mostro letto', JSON.stringify(leggiChiave('mostro:scheletro:magico:guerriero')), JSON.stringify({ tipo: 'mostro', r: { tipo: 'scheletro', grado: 'magico', variante: 'guerriero' } }))
for (const k of ['', 'boh:1', 'armatura:pigiama:1:elfa', 'mostro:']) uguale(`«${k}» non si legge`, leggiChiave(k), null)
for (const t of ['arma', 'scudo', 'armatura', 'eroe', 'busto', 'mostro']) controlla(`${t}: ha la sua misura`, MISURE[t] && MISURE[t][0] <= 192 && MISURE[t][1] <= 192)

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
