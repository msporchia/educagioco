/* Le pozioni di cura (docs/sotterraneo/roba.md, «Le pozioni»): cinque stadi con numeri fissi (la cura non cresce col livello e il prezzo
   non sale), la guaritrice le mette sul banco una dopo l'altra per discese finite, l'ampolla della vita non si compra e cade soltanto,
   al più otto in tasca di qualunque stadio, e quale bere si sceglie (con la regola del giocatore finto).
   `node test/esegui.mjs sotterraneo-pozioni --niente-build`
   tempo: 5 */
import { COSE, CURE, CURE_IN_VENDITA, IN_VENDITA } from '../../src/giochi/sotterraneo/dati/cose.js'
import { POZIONI_MASSIME } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { MERCANTI, mercanteDi, vendeLa } from '../../src/giochi/sotterraneo/dati/mercanti.js'
import { CHIAVI as CHIAVI_POZIONI } from '../../src/giochi/sotterraneo/scena3d/roba3d/pozioni.js'
import { haModelloPerTerra } from '../../src/giochi/sotterraneo/scena3d/per-terra-pura.js'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { Corredo, ROBA_VUOTA, curePerTipo } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { Bottega } from '../../src/giochi/sotterraneo/motore/bottega.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { allaBottega } from '../../src/giochi/sotterraneo/motore/banco.js'
import { ampollaCade, PROBABILITA_AMPOLLA } from '../../src/giochi/sotterraneo/motore/bottino.js'
import { CRESCITA_NUOVA, crescitaA } from '../../src/giochi/sotterraneo/motore/crescita.js'
import { sogliaDi } from '../../src/giochi/sotterraneo/dati/livelli.js'
import { numeriDi } from '../../src/giochi/sotterraneo/viste/pezzo.js'
import { controlla, uguale, dentro, riassunto } from '../aiuto/verifica.mjs'

const STADI = ['pozione-piccola', 'pozione', 'pozione-grande', 'ampolla-maggiore']
const corredo = (zaino, gemme = 0, livello = 1) =>
  new Corredo({ eroe: 'cavaliere', roba: { ...ROBA_VUOTA(), zaino, gemme }, crescita: { ...CRESCITA_NUOVA(), esp: sogliaDi(livello) } })

/* ══════════ 1. i cinque stadi: numeri fissi, e più è grande più costa ogni punto ══════════ */
{
  uguale('le cure sono cinque', CURE.length, 5)
  uguale('quattro si comprano, la quinta (la vita) no', CURE_IN_VENDITA.join(), STADI.join())
  controlla('l\'ampolla della vita non è in vendita da nessuno', !IN_VENDITA.includes('ampolla-vita') &&
            MERCANTI.every(m => !vendeLa(m, 'ampolla-vita') && !m.sempre.includes('ampolla-vita')))
  controlla('e rimette tutta la vita', COSE['ampolla-vita'].tutta === true && !COSE['ampolla-vita'].cura)
  for (let i = 1; i < STADI.length; i++) {
    const [p, q] = [COSE[STADI[i - 1]], COSE[STADI[i]]]
    controlla(`${STADI[i]}: cura almeno una volta e mezza ${STADI[i - 1]}`, q.cura >= p.cura * 1.5, `${p.cura} → ${q.cura}`)
    controlla(`${STADI[i]}: ogni punto di vita costa di più`, q.prezzo / q.cura > p.prezzo / p.cura * 1.3,
              `${(p.prezzo / p.cura).toFixed(2)} → ${(q.prezzo / q.cura).toFixed(2)}`)
    controlla(`${STADI[i]}: arriva sul banco dopo ${STADI[i - 1]}`, (q.dalla || 0) > (p.dalla || 0))
  }
  // la figura è il modello (roba3d/pozioni.js): nei pannelli la sua foto, per terra il modello (docs/sotterraneo/roba-3d.md)
  for (const k of [...STADI, 'ampolla-vita']) controlla(`${k}: ha il suo modello`, CHIAVI_POZIONI.includes(k) && haModelloPerTerra(k))
  controlla('i nomi non si confondono con l\'elisir del toro', COSE['ampolla-vita'].nome !== COSE['elisir-toro'].nome &&
            !/elisir/i.test(COSE['ampolla-vita'].nome))
}

/* ══════════ 2. cura e prezzo non crescono col livello ══════════ */
{
  const piccolo = corredo([], 0, 1), grande = corredo([], 0, 20)
  for (const k of STADI) {
    uguale(`${k}: cura uguale a livello 1 e 20`, grande.curaDi(k), piccolo.curaDi(k))
    uguale(`${k}: cura = il suo numero`, piccolo.curaDi(k), COSE[k].cura)
    uguale(`${k}: prezzo uguale a livello 1 e 20`, grande.prezzoDi(k), piccolo.prezzoDi(k))
    uguale(`${k}: prezzo = il suo`, piccolo.prezzoDi(k), COSE[k].prezzo)
  }
  uguale('l\'ampolla della vita rimette la vita massima (di chi la beve)', grande.curaDi('ampolla-vita'), grande.vitaConLaRoba)
  controlla('e a livello 20 è più della vita di livello 1', grande.curaDi('ampolla-vita') > piccolo.curaDi('ampolla-vita'))
  const t = numeriDi({ ...COSE['ampolla-vita'], cura: grande.curaDi('ampolla-vita') }).map(n => n.testo).join()
  controlla('il pannello dice «tutta la vita»', /tutta la vita/.test(t), t)
  uguale('e di una pozione i punti veri', numeriDi({ ...COSE.pozione, cura: 16 })[0].testo, '+16 vita, subito')
}

/* ══════════ 3. la guaritrice le mette sul banco per discese finite ══════════ */
{
  const sul = finite => new Bottega({ eroe: 'cavaliere', finite, roba: { ...ROBA_VUOTA(), gemme: 9999 }, rnd: seminato(5) })
    .mercanzia('erborista').filter(r => r.sempre && COSE[r.chiave].usa === 'cura').map(r => r.chiave)
  uguale('prima discesa: solo la boccetta', sul(0).join(), 'pozione-piccola')
  uguale('dopo una: anche la pozione', sul(1).join(), 'pozione-piccola,pozione')
  uguale('dopo tre: anche l\'ampolla', sul(3).join(), 'pozione-piccola,pozione,pozione-grande')
  uguale('dopo cinque: anche l\'ampolla maggiore', sul(5).join(), STADI.join())
  uguale('e così fino in fondo', sul(CAMPAGNA.length).join(), STADI.join())
  const b = new Bottega({ eroe: 'cavaliere', finite: 0, roba: { ...ROBA_VUOTA(), gemme: 9999 }, rnd: seminato(5) })
  uguale('quella che non c\'è ancora non si compra', b.compraDa('erborista', 'ampolla-maggiore'), null)
  uguale('e le gemme restano', b.gemme, 9999)
  uguale('l\'ampolla della vita non si compra mai', new Bottega({ eroe: 'cavaliere', finite: 7, roba: { ...ROBA_VUOTA(), gemme: 9999 } })
    .compraDa('erborista', 'ampolla-vita'), null)
  controlla('l\'erborista pesca righe diverse per discese finite, ma le cure sono sempre le stesse a quel punto', sul(2).join() === sul(2).join())
  const compra = new Bottega({ eroe: 'cavaliere', finite: 5, roba: { ...ROBA_VUOTA(), gemme: 1000 }, rnd: seminato(5) })
  uguale('si compra l\'ampolla maggiore al suo prezzo fisso', compra.compraDa('erborista', 'ampolla-maggiore')?.che, 'comprato')
  uguale('e costa quanto dice', compra.gemme, 1000 - COSE['ampolla-maggiore'].prezzo)
  uguale('e sta nello zaino', compra.zaino.join(), 'ampolla-maggiore')
}

/* ══════════ 4. al più otto in tasca, di qualunque stadio ══════════ */
{
  const otto = [...STADI, ...STADI]
  const c = corredo(otto, 5000)
  uguale('otto cure di stadi diversi', c.pozioniDiCura, POZIONI_MASSIME)
  controlla('la nona non ci sta, anche se uguale a una che c\'è', !c.cista('pozione') && !c.cista('ampolla-vita'))
  controlla('l\'energia e l\'elisir del toro non contano', c.cista('pozione-blu') && c.cista('elisir-toro') || !c.cista('elisir-toro') && c.postiUsati([...otto, 'elisir-toro']) > c.capienza)
  const b = new Bottega({ eroe: 'cavaliere', finite: 5, roba: { ...ROBA_VUOTA(), gemme: 5000, zaino: otto }, rnd: seminato(5) })
  uguale('la nona non si compra', b.compraDa('erborista', 'pozione')?.che, 'pieno')
  uguale('e le gemme restano', b.gemme, 5000)
  controlla('e il banco dice «al massimo 8 pozioni»', b.avvisi.some(a => /al massimo 8 pozioni/.test(String(a.testo || a))), JSON.stringify(b.avvisi))
  controlla('la torcia sì, che non è una pozione', b.compraDa('erborista', 'torcia')?.che === 'comprato')
  b.zaino.pop()
  uguale('bevuta una, si può comprare di nuovo', b.compraDa('erborista', 'pozione')?.che, 'comprato')
  uguale('di nuovo otto', b.pozioniDiCura, POZIONI_MASSIME)

  // per terra: con le tasche già col tetto una cura trovata resta lì, e si dice
  const k = new Corsa(CAMPAGNA[0], { seme: 3, rnd: seminato(3), roba: { ...ROBA_VUOTA(), zaino: otto } })
  const dove = { x: Math.floor(k.eroe.x), y: Math.floor(k.eroe.y) }
  const r = { che: 'cosa', cosa: 'pozione', x: dove.x, y: dove.y, em: COSE.pozione.em }
  k.livello.robe.push(r)
  k.interagisci(r)
  controlla('per terra resta lì', !r.presa && k.pozioniDiCura === POZIONI_MASSIME)
  controlla('e dice «al massimo 8 pozioni»', k.avvisi.some(a => /al massimo 8 pozioni/.test(String(a.testo || a))), JSON.stringify(k.avvisi))
  uguale('e la taratura se ne accorge', k.cureRifiutate, 1)
  k.zaino.pop()
  k.interagisci(r)
  controlla('con un posto libero la si prende', r.presa && k.pozioniDiCura === POZIONI_MASSIME)
  // una cosa che non è una cura passa anche col tetto
  const spada = { che: 'cosa', cosa: 'spada', x: dove.x, y: dove.y, em: COSE.spada.em }
  const j = new Corsa(CAMPAGNA[0], { seme: 3, rnd: seminato(3), roba: { ...ROBA_VUOTA(), zaino: otto } })
  j.livello.robe.push(spada)
  j.interagisci(spada)
  controlla('una spada si prende (o si mette addosso) anche col tetto', spada.presa)
}

/* ══════════ 5. quale bere ══════════ */
{
  const c = new Corsa(CAMPAGNA[0], { seme: 3, rnd: seminato(3), eroe: 'cavaliere',
    roba: { ...ROBA_VUOTA(), zaino: ['pozione', 'ampolla-vita', 'pozione-piccola', 'pozione', 'pozione-grande'] } })
  const scelte = c.scelteDiCura()
  uguale('cinque pozioni, quattro stadi', scelte.map(s => `${s.k}×${s.n}`).join(), 'pozione-piccola×1,pozione×2,pozione-grande×1,ampolla-vita×1')
  controlla('in ordine di stadio, con la cura vera (la vita in fondo, anche se a livello 1 ne cura meno dell\'ampolla)',
            scelte[0].cura === COSE['pozione-piccola'].cura && scelte[2].cura === COSE['pozione-grande'].cura && scelte[3].cura === c.vitaMax)
  c.vita = c.vitaMax - 5
  uguale('mancano 5: la boccetta', c.zaino[c.pozioneGiusta()], 'pozione-piccola')
  c.vita = c.vitaMax - 10
  uguale('mancano 10: la pozione', c.zaino[c.pozioneGiusta()], 'pozione')
  c.vita = 1
  uguale('a vita bassa e piccola, la più piccola che basta è l\'ampolla (36 ≥ 17)', c.zaino[c.pozioneGiusta()], 'pozione-grande')
  c.vitaPiu += 100
  c.vita = 1
  uguale('con una vita grande nessuna cura basta: l\'ampolla della vita, non la risparmia', c.zaino[c.pozioneGiusta()], 'ampolla-vita')
  uguale('chi la tiene per il grosso beve l\'altra più grande', c.zaino[c.pozioneGiusta({ riservaLaVita: true })], 'pozione-grande')
  c.zaino = ['ampolla-vita']
  uguale('ma se non ha altro, la beve', c.zaino[c.pozioneGiusta({ riservaLaVita: true })], 'ampolla-vita')
  c.zaino = ['pozione', 'pozione-grande']
  c.vita = c.vitaMax - 3
  uguale('serve di più (i colpi in arrivo): sceglie una cura che copre anche quelli', c.zaino[c.pozioneGiusta({ serve: 20 })], 'pozione-grande')
  uguale('una sola scelta se ne ha un tipo', corredo(['pozione', 'pozione']).tasche().length, 1)
  uguale('curePerTipo conta per stadio', JSON.stringify(curePerTipo(['pozione', 'spada', 'pozione-blu', 'pozione'])), JSON.stringify([{ k: 'pozione', n: 2, i: 0 }]))
  c.zaino = ['pozione-grande']
  c.vita = 5
  const prima = c.vita
  c.usa(0)
  uguale('bevuta, cura il suo numero', c.vita, Math.min(c.vitaMax, prima + COSE['pozione-grande'].cura))
}

/* ══════════ 6. l'ampolla della vita cade, rara, e non sposta l'elisir ══════════ */
{
  let grossi = 0, caporali = 0, forzieri = 0
  const N = 4000
  for (let i = 0; i < N; i++) {
    if (ampollaCade('grosso', i, 1, 5, 6)) grossi++
    if (ampollaCade('caporale', i, 1, 5, 6)) caporali++
    if (ampollaCade('forziere', i, 1, 5, 6)) forzieri++
  }
  dentro('un grosso su quattro', grossi / N, PROBABILITA_AMPOLLA.grosso * 0.7, PROBABILITA_AMPOLLA.grosso * 1.3)
  dentro('un caporale su venti', caporali / N, PROBABILITA_AMPOLLA.caporale * 0.6, PROBABILITA_AMPOLLA.caporale * 1.4)
  dentro('un forziere su quaranta', forzieri / N, PROBABILITA_AMPOLLA.forziere * 0.4, PROBABILITA_AMPOLLA.forziere * 1.6)
  uguale('lo stesso posto dà lo stesso tiro', ampollaCade('grosso', 7, 2, 3, 4), ampollaCade('grosso', 7, 2, 3, 4))
  uguale('chi non è grosso, caporale o forziere non la lascia', ampollaCade('ratto', 1, 1, 1, 1), false)
}

/* ══════════ 7. il giocatore finto compra la più grande che può, e si ferma al tetto ══════════ */
{
  const roba = allaBottega({ ...ROBA_VUOTA(), gemme: 5000 }, { finite: 6, seme: 1 })
  const cure = roba.zaino.filter(k => COSE[k].usa === 'cura')
  uguale('con tante gemme compra otto cure, non una di più', cure.length, POZIONI_MASSIME)
  controlla('e sono le più grandi in vendita a quel punto', cure.every(k => k === 'ampolla-maggiore'), cure.join())
  const medio = allaBottega({ ...ROBA_VUOTA(), gemme: 700 }, { finite: 3, seme: 1 })
  const dopo = medio.zaino.filter(k => COSE[k].usa === 'cura')
  controlla('con 700 gemme dopo tre discese, dopo l\'equipaggiamento, compra cure e mai più dell\'ampolla (la maggiore non c\'è ancora)',
            dopo.length > 0 && dopo.every(k => k !== 'ampolla-maggiore'), medio.zaino.join())
}

riassunto('le pozioni di cura')
