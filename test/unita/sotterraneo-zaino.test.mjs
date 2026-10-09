/* Le tasche dello zaino (docs/sotterraneo/roba.md, «Le tasche»): le pozioni dello stesso tipo stanno in una tasca sola
   (solo loro: ogni altro pezzo ha la sua), e le tasche in più si comprano con le gemme, una alla volta, a un prezzo che
   cresce in linea retta fino a un tetto. Il numero di tasche resta nella crescita dell'eroe.
   `node test/esegui.mjs sotterraneo-zaino --niente-build` */
import { Corredo, ROBA_VUOTA, tascheDello, postiDello, impilabile } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { rileggiCrescita, CRESCITA_NUOVA } from '../../src/giochi/sotterraneo/motore/crescita.js'
import { TASCHE, TASCHE_EXTRA_MAX, prezzoTasca, FORZA_PER_TASCA } from '../../src/giochi/sotterraneo/dati/mondo.js'
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

/* ══════════ 4. la forza dà posto anche a chi non picchia con spade e asce ══════════ */
{
  const con = (eroe, forza) => new Corredo({ eroe, roba: ROBA_VUOTA(), crescita: { ...CRESCITA_NUOVA(), esp: 99999, forza } })
  const base = con('mago', 0)
  uguale('il mago a forza 1 non ha tasche in più', base.tascheDallaForza, 0)
  controlla('con la forza alzata ne ha', con('mago', 6).tascheDallaForza > 0 && con('mago', 6).capienza > base.capienza)
  uguale('una ogni FORZA_PER_TASCA punti oltre il primo', con('mago', 7).tascheDallaForza, Math.floor(6 / FORZA_PER_TASCA))
  const ch = con('mago', 2).caratteristiche().find(c => c.chiave === 'forza')
  controlla('il «+» della forza lo dice quando la tasca arriva', ch.cambia.some(x => x.em === '🎒'), JSON.stringify(ch.cambia))
}

/* ══════════ 5. la pozione blu dice energia, non vita ══════════ */
{
  const blu = numeriDi(COSE['pozione-blu'])
  controlla('la pozione blu dice quanta energia dà', blu.length === 1 && /energia/.test(blu[0].testo) && !/vita/.test(blu[0].testo), JSON.stringify(blu))
  controlla('anche l\'ampolla delle stelle', numeriDi(COSE['ampolla-blu']).some(n => /16 energia/.test(n.testo)))
  controlla('la rossa continua a dire vita', numeriDi(COSE.pozione, { cura: 10 }).some(n => /vita/.test(n.testo)))
}

riassunto('le tasche dello zaino')
