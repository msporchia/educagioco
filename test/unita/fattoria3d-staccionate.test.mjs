/* Le staccionate e i cancelli della fattoria 3D, senza browser: i tipi si aprono col livello e costano, i vicini le legano, il cancello si attraversa e il
   resto no, una staccionata non chiude mai il passo (il pezzo che chiuderebbe diventa cancello) e il salvataggio si rilegge. docs/fattoria3d/staccionate.md
   `node test/esegui.mjs fattoria3d-staccionate`
   tempo: 1 */
import { TIPI_STACCIONATA, TIPI_STACC, PREZZO_CANCELLO, prezzoStaccionata, staccionataDaCodice, codiceStaccionata, staccionateAl } from '../../src/giochi/fattoria3d/dati/staccionate.js'
import { cellaDa } from '../../src/giochi/fattoria3d/dati/mondo.js'
import { viciniDi } from '../../src/giochi/fattoria3d/dati/tessere.js'
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { raggiungibili } from '../../src/giochi/fattoria3d/motore/percorso.js'
import { normalizza } from '../../src/giochi/fattoria3d/motore/stato.js'
import { sogliaDi } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

function mondo(monete = 1000, livello = 30) {
  const b = { monete }
  const f = new Fattoria3d({ borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => 1_000_000, rnd: () => 0.5 })
  for (const o of f.ostacoli) if (!o.tolto) f._togliSenzaPagare(o)
  f.s.esperienza = sogliaDi(livello)
  return { f, b }
}

/* ══════════ i dati ══════════ */
controlla('ogni tipo ha nome, colore, prezzo e livello', Object.values(TIPI_STACCIONATA).every(t => t.nome && t.colore && Number.isInteger(t.prezzo) && t.prezzo >= 1 && t.liv >= 2))
controlla('più si apre tardi, più costa', TIPI_STACC.every((k, q) => q === 0 || (TIPI_STACCIONATA[k].liv > TIPI_STACCIONATA[TIPI_STACC[q - 1]].liv && TIPI_STACCIONATA[k].prezzo >= TIPI_STACCIONATA[TIPI_STACC[q - 1]].prezzo)))
controlla('la cella più cara, col cancello, non supera 🪙 10', Math.max(...TIPI_STACC.map(t => prezzoStaccionata(t, true))) <= 10)
uguale('il cancello costa in più', prezzoStaccionata('bianco', true) - prezzoStaccionata('bianco'), PREZZO_CANCELLO)
uguale('il codice va e viene', JSON.stringify(staccionataDaCodice(codiceStaccionata('siepe', true))), '{"tipo":"siepe","cancello":true}')
for (const brutto of [null, 5, 'x', 'oro', 'legno.x', 'legno.c.c', '']) uguale(`il codice «${brutto}» si butta`, staccionataDaCodice(brutto), null)
controlla('staccionateAl dice cosa arriva a un livello', staccionateAl(5).join() === 'filo' && staccionateAl(1).length === 0)

/* ══════════ i vicini: stesso tipo si lega, un altro no ══════════ */
{
  const mappa = new Map([['0,0', { tipo: 'legno' }], ['1,0', { tipo: 'legno' }], ['0,1', { tipo: 'siepe' }]])
  const v = viciniDi((i, j) => mappa.get(`${i},${j}`) || null, (a, b) => a.tipo === b.tipo, 0, 0)
  uguale('est legato, sud d\'un altro tipo', v.lati.join(), 'vuoto,unito,altro,vuoto')
}

/* ══════════ il motore ══════════ */
{
  const { f, b } = mondo(1000, 1)
  uguale('il legno si apre al livello 2', f.disegnaStaccionata(-3, 2).livello, 2)
  f.s.esperienza = sogliaDi(2)
  const prima = b.monete
  controlla('una staccionata di legno costa 🪙 2 e blocca il passo', f.disegnaStaccionata(-3, 2).ok && b.monete === prima - 2 && !f.libera(-3, 2) && f.blocca(-3, 2))
  uguale('lo stesso pezzo due volte no', f.disegnaStaccionata(-3, 2).motivo, 'qui-no')
  uguale('un tipo non ancora aperto no', f.disegnaStaccionata(-3, 3, { tipo: 'muretto' }).motivo, 'livello')
  uguale('un tipo che non c\'è no', f.disegnaStaccionata(-3, 3, { tipo: 'oro' }).motivo, 'qui-no')
  uguale('fuori dal terreno proprio no', f.disegnaStaccionata(40, 40).motivo, 'qui-no')
  uguale('sopra un campo no', f.disegnaStaccionata(-5, 0).motivo, 'occupato')
  uguale('dove sta il contadino no', f.disegnaStaccionata(-3, 3, { evita: [[-3, 3]] }).motivo, 'occupato')
  uguale('un cancello senza tratto no', f.mettiCancello(-3, 3).motivo, 'senza-tratto')
  const p2 = b.monete
  controlla('il cancello su un tratto costa solo il cancello e si attraversa', f.mettiCancello(-3, 2).ok && b.monete === p2 - PREZZO_CANCELLO && f.libera(-3, 2) && f.blocca(-3, 2))
  controlla('sul cancello lo stesso tipo lo rifà pezzo (non chiude niente) e blocca di nuovo', f.disegnaStaccionata(-3, 2, { tipo: 'legno' }).ok && !f.libera(-3, 2))
  f.mettiCancello(-3, 2)
  f.s.esperienza = sogliaDi(20)
  controlla('un altro tipo sopra un cancello lo ridipinge e resta cancello', f.disegnaStaccionata(-3, 2, { tipo: 'muretto' }).ok && f.aspettoStaccionata(-3, 2).tipo === 'muretto' && f.aspettoStaccionata(-3, 2).cancello && f.libera(-3, 2))
  controlla('la gomma toglie tutto e il passo torna', f.togliStaccionata(-3, 2).ok && f.libera(-3, 2) && !f.aspettoStaccionata(-3, 2))
  uguale('togliere dove non c\'è niente no', f.togliStaccionata(-3, 2).motivo, 'qui-no')
  // una strada sotto: ci va un cancello
  f.disegnaStrada(-3, 4)
  controlla('su una strada tua si può mettere una staccionata', f.disegnaStaccionata(-3, 4).ok && f.eStrada(-3, 4) === 1)
}

/* ══════════ non si chiude il passo ══════════ */
{
  const { f } = mondo()
  const da = [-3, 3]
  // un anello di 8 attorno a (-3,3), poi il contadino dentro: l'ultimo pezzo che chiude diventa cancello
  const anello = [[-4, 2], [-3, 2], [-2, 2], [-2, 3], [-2, 4], [-3, 4], [-4, 4], [-4, 3]]
  const r = anello.map(([i, j]) => f.disegnaStaccionata(i, j, { da, evita: [da] }))
  controlla('i primi sette pezzi sono pezzi', r.slice(0, 7).every(x => x.ok && !x.cancello))
  controlla('l\'ultimo, che chiuderebbe il contadino dentro, diventa cancello', r[7].ok && r[7].cancello && f.aspettoStaccionata(-4, 3).cancello)
  controlla('il contadino esce dal cancello', f.libera(-4, 3) && raggiungibili((i, j) => f.libera(i, j), da).size > 8)
  uguale('il cancello non torna pezzo: richiuderebbe il contadino', f.disegnaStaccionata(-4, 3, { da, tipo: 'legno' }).motivo, 'chiude')
  controlla('la gomma lo toglie sempre', f.togliStaccionata(-4, 3).ok)
}
{
  const { f } = mondo()
  // un pezzo (un campo 2×2) chiuso da ogni lato: l'ultimo lato libero diventa cancello e il campo si tocca ancora
  const m = f.compraEMetti('campo', -1, 0)
  controlla('un campo messo per la prova', m.ok !== false)
  const c = f.cosaSu(-1, 0), d = f.misureCosa(c)
  const celle = [...new Set(f._latiDi(c.i, c.j, d.w, d.d))].map(k => cellaDa(k))
  const ris = celle.map(([i, j]) => f.disegnaStaccionata(i, j, { da: [0, 5] }))
  controlla('si chiudono i quattro lati: l\'ultimo pezzo è un cancello', ris.filter(x => x.ok).length > 0 && ris.some(x => x.ok && x.cancello))
  controlla('…e il campo ha ancora un lato da cui si tocca', celle.some(([i, j]) => f.libera(i, j)))
}

/* ══════════ i salvataggi ══════════ */
{
  const { f } = mondo()
  f.disegnaStaccionata(-3, 2, { tipo: 'bianco' }); f.disegnaStaccionata(-2, 2, { tipo: 'bianco' }); f.mettiCancello(-2, 2)
  const sal = f.serializza()
  uguale('si salvano gli id con il codice', Object.values(sal.staccionate).sort().join(), 'bianco,bianco.c')
  const g = new Fattoria3d({ stato: JSON.parse(JSON.stringify(sal)), borsa: { quante: () => 0, paga: () => true }, ora: () => 1_000_000 })
  controlla('si rilegge uguale', g.aspettoStaccionata(-3, 2)?.tipo === 'bianco' && g.aspettoStaccionata(-2, 2)?.cancello === true && !g.libera(-3, 2) && g.libera(-2, 2))
  uguale('e si risalva uguale', JSON.stringify(g.serializza().staccionate), JSON.stringify(sal.staccionate))
}
{
  const n = normalizza({ v: 10 })
  uguale('uno stato di prima non ha staccionate', JSON.stringify(n.staccionate), '{}')
  const m = normalizza({ v: 10, staccionate: { 525: 'legno', 526: 'oro', 527: 'siepe.c', x: 'legno', 528: 3 } })
  uguale('si tiene solo ciò che si capisce', Object.keys(m.staccionate).sort().join(), '525,527')
  for (const rotto of [{ staccionate: 'no' }, { staccionate: [1, 2] }, { staccionate: null }]) {
    let ok = true; try { normalizza(rotto) } catch { ok = false }
    controlla(`uno stato rotto (${JSON.stringify(rotto)}) non rompe`, ok)
  }
  // una staccionata dove ora c'è un lotto non tuo, o un campo, si butta alla lettura
  const { f } = mondo()
  const sal = f.serializza()
  sal.staccionate = { 1: 'legno' }
  const g = new Fattoria3d({ stato: sal, borsa: { quante: () => 0, paga: () => true }, ora: () => 1_000_000 })
  uguale('una cella che non è più tua si butta', g.staccionata.size, 0)
}

riassunto('staccionate della fattoria 3D')
