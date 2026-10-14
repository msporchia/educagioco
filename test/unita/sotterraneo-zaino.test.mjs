/* Le tasche dello zaino (docs/sotterraneo/roba.md, «Le tasche»): le pozioni dello stesso tipo stanno in una tasca sola
   (solo loro: ogni altro pezzo ha la sua), e le tasche in più si comprano con le gemme, una alla volta, a un prezzo che
   cresce in linea retta fino a un tetto. Il numero di tasche resta nella crescita dell'eroe.
   `node test/esegui.mjs sotterraneo-zaino --niente-build` */
import { Corredo, ROBA_VUOTA, tascheDello, postiDello, impilabile } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { rileggiCrescita, CRESCITA_NUOVA } from '../../src/giochi/sotterraneo/motore/crescita.js'
import { sogliaDi } from '../../src/giochi/sotterraneo/dati/livelli.js'
import { TASCHE, TASCHE_EXTRA_MAX, prezzoTasca } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { numeriDi } from '../../src/giochi/sotterraneo/viste/pezzo.js'
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const corredo = (zaino, extra = 0, gemme = 0) =>
  new Corredo({ eroe: 'cavaliere', roba: { ...ROBA_VUOTA(), zaino, gemme }, crescita: { ...CRESCITA_NUOVA(), tasche: extra } })

/* ══════════ 1. le pozioni uguali fanno un posto solo ══════════ */
{
  controlla('una pozione si impila, una spada no', impilabile('pozione') && !impilabile('spada'))
  const z = ['pozione', 'spada', 'pozione', 'pozione-blu', 'pozione', 'spada']
  const t = tascheDello(z)
  uguale('quattro tasche: la pozione ×3, la spada, la blu, la seconda spada', t.length, 4)
  uguale('la pozione sono tre, e sta dove è comparsa la prima', JSON.stringify(t[0]), JSON.stringify({ k: 'pozione', n: 3, i: 0 }))
  uguale('due spade uguali sono due posti', t.filter(x => x.k === 'spada').length, 2)
  uguale('posti usati', postiDello(z), 4)
}

/* ══════════ 2. lo zaino pieno conta i posti, non i pezzi ══════════ */
{
  const c = corredo(['pozione', 'pozione', 'pozione', 'pozione', 'pozione'])
  controlla('dieci pozioni uguali in un posto: c\'è sempre spazio per un\'altra', c.cista('pozione') && c.postiUsati() === 1)
  const pieno = corredo(['panciotto', 'manto', 'saio', 'amuleto-azzurro', 'chiave', 'corazza'])
  controlla('sei pezzi diversi: piene', !pieno.cista('spada') && pieno.postiUsati() === TASCHE)
  const con = corredo(['panciotto', 'manto', 'saio', 'amuleto-azzurro', 'chiave', 'pozione'])
  controlla('piene, ma una pozione uguale a una che c\'è ci sta', con.cista('pozione') && !con.cista('pozione-blu'))
  uguale('la tasca della griglia si risale al posto nella lista', con.indiceDellaTasca(5), 5)
  const m = corredo(['pozione', 'spada', 'pozione'])
  uguale('la seconda tasca è la spada, al posto 1', m.indiceDellaTasca(1), 1)
  uguale('una tasca vuota non ha un posto', m.indiceDellaTasca(2), null)
}

/* ══════════ 3. le tasche in più, a gemme ══════════ */
{
  const c = corredo([], 0, 100)
  uguale('si parte da sei', c.capienza, TASCHE)
  uguale('la prima costa il prezzo base', c.costoTasca, prezzoTasca(0))
  controlla('il prezzo cresce in linea retta', prezzoTasca(1) - prezzoTasca(0) === prezzoTasca(2) - prezzoTasca(1))
  controlla('si compra, e le gemme calano', c.compraTasca() && c.gemme === 100 - prezzoTasca(0) && c.capienza === TASCHE + 1)
  controlla('la crescita se la ricorda', c.crescita.tasche === 1)
  const povero = corredo([], 0, 1)
  controlla('senza gemme non si compra', !povero.compraTasca() && povero.capienza === TASCHE)
  const alTetto = corredo([], TASCHE_EXTRA_MAX, 9999)
  controlla('al tetto non se ne compra altre', alTetto.costoTasca === null && !alTetto.compraTasca() && alTetto.capienza === TASCHE + TASCHE_EXTRA_MAX)
  uguale('un salvataggio con troppe tasche si ferma al tetto', rileggiCrescita({ ...CRESCITA_NUOVA(), tasche: 99 }).tasche, TASCHE_EXTRA_MAX)
  uguale('e uno storto è senza tasche in più', rileggiCrescita({ tasche: -4 }).tasche, 0)
}

/* ══════════ 4. la forza non dà più posto: le tasche di prima sono comprate ══════════
   Fino al 13 ottobre 2026 una tasca ogni tre punti di forza oltre il primo («poco quantificabile e tanto si compra», l'utente):
   chi le aveva se le tiene, come tasche comprate, una volta sola e anche oltre il tetto di quelle che si comprano */
{
  const con = (eroe, forza) => new Corredo({ eroe, roba: ROBA_VUOTA(), crescita: { ...CRESCITA_NUOVA(), esp: 99999, forza } })
  uguale('la forza non alza più la capienza', con('mago', 30).capienza, con('mago', 0).capienza)
  controlla('e il «+» della forza non parla più di tasche', !con('mago', 2).caratteristiche().find(c => c.chiave === 'forza').cambia.some(x => x.em === '🎒'))
  // un salvataggio di prima (v 2): il mago, forza 1 + 6 punti = 7 → due tasche; il nano, 3 + dote 3 + 5 = 11 → tre
  const mago = rileggiCrescita({ v: 2, esp: 99999, forza: 6, tasche: 1 }, 'mago')
  uguale('un salvataggio di prima tiene le tasche che la forza dava, come comprate', mago.tasche, 1 + 2)
  const nano = rileggiCrescita({ v: 2, esp: sogliaDi(12), forza: 5, tasche: 2 }, 'nano')
  uguale('con la partenza e la dote della classe', nano.tasche, 2 + 3)
  uguale('si fa una volta sola: riletto, non ne aggiunge altre', rileggiCrescita(JSON.parse(JSON.stringify(nano)), 'nano').tasche, nano.tasche)
  uguale('la crescita nuova è alla versione che non le conta più', nano.v, CRESCITA_NUOVA().v)
  // oltre il tetto di quelle che si comprano ci si ferma a quelle che si avevano: niente di rotto, niente da comprare
  const pieno = rileggiCrescita({ v: 2, esp: sogliaDi(12), forza: 8, tasche: TASCHE_EXTRA_MAX }, 'nano')
  controlla('il tetto non si applica a quelle di prima', pieno.tasche > TASCHE_EXTRA_MAX, String(pieno.tasche))
  const c = new Corredo({ eroe: 'nano', roba: { ...ROBA_VUOTA(), gemme: 999 }, crescita: pieno })
  controlla('ma non se ne comprano altre', c.costoTasca === null && !c.compraTasca() && c.capienza === TASCHE + pieno.tasche)
  // senza perdere niente: lo zaino di prima, pieno com'era, ci sta ancora
  const zaino = ['panciotto', 'manto', 'saio', 'amuleto-azzurro', 'chiave', 'corazza', 'scudo-legno', 'scudo-ferro', 'spada']
  const stesso = new Corredo({ eroe: 'nano', roba: { ...ROBA_VUOTA(), zaino }, crescita: { v: 2, esp: sogliaDi(12), forza: 5, tasche: 0 } })
  controlla('lo zaino pieno com\'era ci sta ancora', stesso.zaino.length === zaino.length && stesso.postiUsati() <= stesso.capienza,
            `${stesso.postiUsati()}/${stesso.capienza}`)
  // un dato storto non gonfia lo zaino: il tetto è quello delle comprate più quelle che la forza poteva dare a quel livello
  uguale('e un salvataggio storto no', rileggiCrescita({ v: 3, esp: 0, tasche: 99 }, 'mago').tasche, TASCHE_EXTRA_MAX)
}

/* ══════════ 5. la pozione blu dice energia, non vita ══════════ */
{
  const blu = numeriDi(COSE['pozione-blu'])
  controlla('la pozione blu dice quanta energia dà', blu.length === 1 && /energia/.test(blu[0].testo) && !/vita/.test(blu[0].testo), JSON.stringify(blu))
  controlla('anche l\'ampolla delle stelle', numeriDi(COSE['ampolla-blu']).some(n => /16 energia/.test(n.testo)))
  controlla('la rossa continua a dire vita', numeriDi(COSE.pozione, { cura: 10 }).some(n => /vita/.test(n.testo)))
}

riassunto('le tasche dello zaino')
