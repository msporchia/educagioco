/* ═══════════════════════════════════════════════════════════════════
   LE MATTONELLE E LA SETTIMANA — i conti di «Come va» per un grande

   «Teoricamente ben fatta, ma nella pratica poco intuitiva»: centoventi
   righe di domande non dicono a un genitore come sta andando. In cima ci
   sono le materie, una mattonella l'una con quanto è saputo e una freccia
   rispetto a due settimane fa, e sotto la settimana: minuti, cosa è
   difficile, cosa è migliorato. Qui si provano i conti, che sono il posto
   dove si sbaglia: una lingua che vale tre barre, una tipologia che conta
   due volte, una freccia che balla per il decadimento, un «migliorata»
   detto su tre risposte, una migliorata che risulta anche difficile.

   `node test/esegui.mjs settimana --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { mattonelleAlbo, mattonelleQuiz, mattonelleDi, frecciaDa, fotoDa, miglioramento,
         settimanaDi, inizioSettimana, SOGLIA_FRECCIA } from '../../src/quiz/comeva.js'
import { serveUnaNuova, aggiunta, laPiuRecenteDa, OGNI, TENUTE } from '../../src/store/istantanee.js'
import { segnoDa } from '../../src/quiz/alleggerire.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const GIORNO = 86400000
const ORA = new Date(2026, 8, 29, 18, 0).getTime()

/* ══════════ 1. le materie dell'albo ══════════ */
{
  const tiles = mattonelleAlbo([
    { id: 'mate', nome: 'Tabelline', emoji: '✖️', padronanza: 0.5, visti: 30, imparati: 20, totale: 55 },
    { id: 'inglese', nome: 'Parole inglesi', emoji: '🔤', padronanza: 0.5, visti: 40, totale: 100 },
    { id: 'verbi', nome: 'Verbi inglesi', emoji: '🎧', padronanza: 0, visti: 0, totale: 50 },
    { id: 'frasi', nome: 'Frasi inglesi', emoji: '💬', padronanza: 1, visti: 50, totale: 50 },
    { id: 'soldi', nome: 'Euro e resto', emoji: '🪙', padronanza: 0, visti: 0, totale: 5 },
  ])
  const per = id => tiles.find(t => t.id === id)
  uguale('parole, verbi e frasi fanno una mattonella sola', tiles.filter(t => t.id === 'inglese').length, 1)
  controlla('e nessuna delle tre resta per conto suo', !per('verbi') && !per('frasi'))
  uguale('pesata sul totale, non sulla media delle tre barre', per('inglese').pct, 50)
  uguale('le tabelline aprono la mappa', per('mate').mappa, 'tabelline')
  uguale('e dicono la loro percentuale', per('mate').pct, 50)
}

/* ══════════ 2. le materie dei quiz ══════════ */
const RIGHE = [
  { tipo: 'orto:doppie', materia: 'italiano', dove: 'medie' },
  { tipo: 'orto:doppie', materia: 'italiano', dove: 'toste' },   // la stessa a un altro grado
  { tipo: 'orto:gn', materia: 'italiano', dove: 'facili' },
  { tipo: 'orto:acca', materia: 'italiano', dove: 'sotto' },     // tolta per età: non conta
  { tipo: 'orto:spenta', materia: 'italiano', dove: 'medie', spenta: true },
  { tipo: 'ora:intere', materia: 'tempo', dove: 'medie' },
  { tipo: null, materia: 'logica', dove: 'medie' },              // modulo vecchio: niente conto suo
]
const ITEMS = {
  'orto:doppie': { s: 4, ok: 9, err: 1, last: ORA - 1000 },      // saputa: forza al tetto
  'orto:gn': { s: 2, ok: 2, err: 8, last: ORA - 1000 },
}
{
  const q = mattonelleQuiz(RIGHE, ITEMS, ORA)
  const ita = q.find(m => m.id === 'italiano')
  uguale('una tipologia a due gradi conta una volta', ita.totale, 2)
  uguale('quelle tolte per età e le spente non contano', ita.tipi.join(' '), 'orto:doppie orto:gn')
  uguale('saputa una e mezza l\'altra: tre quarti', ita.pct, 75)
  uguale('il tempo c\'è, mai visto', q.find(m => m.id === 'tempo').visti, 0)
  controlla('una materia senza tipologie non ha mattonella', !q.find(m => m.id === 'logica'))
}

/* ══════════ 3. la freccia ══════════ */
uguale('senza fotografia di allora non c\'è freccia', frecciaDa(40, null), null)
uguale('su', frecciaDa(40, 40 - SOGLIA_FRECCIA), 'su')
uguale('giù', frecciaDa(40, 40 + SOGLIA_FRECCIA), 'giu')
uguale('un punto o due sono il decadimento, non una notizia', frecciaDa(40, 39), 'pari')
{
  const { viste, nonAncora } = mattonelleDi({ righe: RIGHE, items: ITEMS, now: ORA,
                                              prima: { m: { italiano: 60 } } })
  uguale('l\'italiano sale da 60 a 75', viste.find(m => m.id === 'italiano').freccia, 'su')
  controlla('quello mai giocato sta da parte', nonAncora.some(m => m.id === 'tempo'))
}

/* ══════════ 4. la fotografia di ogni settimana ══════════ */
{
  const foto = fotoDa([{ id: 'italiano', pct: 75 }], ITEMS, ['orto:doppie', 'orto:gn', 'ora:intere'])
  uguale('tiene le percentuali', foto.m.italiano, 75)
  uguale('e il conto delle tipologie con risposte, e basta', Object.keys(foto.c).join(' '),
         'orto:doppie orto:gn')
  controlla('la prima si fa subito', serveUnaNuova([], ORA))
  controlla('la seconda non prima di una settimana', !serveUnaNuova([{ t: ORA - OGNI + GIORNO }], ORA))
  controlla('dopo sì', serveUnaNuova([{ t: ORA - OGNI }], ORA))
  let voci = []
  for (let i = 0; i < TENUTE + 3; i++) voci = aggiunta(voci, { t: i })
  uguale(`se ne tengono ${TENUTE}`, voci.length, TENUTE)
  const storia = [{ t: ORA - 20 * GIORNO }, { t: ORA - 13 * GIORNO }, { t: ORA - 6 * GIORNO }]
  uguale('due settimane fa è quella di tredici giorni', laPiuRecenteDa(storia, 12, ORA).t, ORA - 13 * GIORNO)
  uguale('una settimana fa quella di sei', laPiuRecenteDa(storia, 6, ORA).t, ORA - 6 * GIORNO)
  uguale('e prima che ce ne sia una, niente', laPiuRecenteDa([{ t: ORA - GIORNO }], 6, ORA), null)
}

/* ══════════ 5. migliorata: «da 4 a 9 su 10» ══════════ */
uguale('da 4 a 9', JSON.stringify(miglioramento({ ok: 13, err: 7 }, [4, 6])),
       JSON.stringify({ da: 4, a: 9 }))
uguale('con tre risposte nuove non si dice niente', miglioramento({ ok: 7, err: 6 }, [4, 6]), null)
uguale('un passo solo non è una notizia', miglioramento({ ok: 8, err: 10 }, [4, 6]), null)
uguale('un conto azzerato non si confronta', miglioramento({ ok: 3, err: 0 }, [4, 6]), null)

/* ══════════ 6. la settimana ══════════ */
{
  const r = (tipo, ok, err) => ({ tipo, nome: tipo, ok, err, quante: ok + err, quota: ok / (ok + err) })
  const items = {
    'a:muro': { ok: 2, err: 8 },
    'b:salita': { ok: 12, err: 12 },    // ancora sotto la metà, ma da 2 a 7 nell'ultima settimana
    'c:vabene': { ok: 1, err: 9 },
    'd:bene': { ok: 9, err: 1 },
  }
  const righe = Object.entries(items).map(([k, v]) => r(k, v.ok, v.err))
  const voci = [
    { g: 'x', t: ORA - GIORNO, s: 600 },
    { g: 'y', t: inizioSettimana(ORA) + 60000, s: 300 },
    { g: 'z', t: inizioSettimana(ORA) - 60000, s: 9000 },  // prima della settimana
  ]
  const s = settimanaDi({
    righe, items, voci, now: ORA,
    prima: { c: { 'b:salita': [2, 8] } },
    vaBene: { 'c:vabene': segnoDa(items['c:vabene'], ORA - GIORNO) },
    alleggerite: { 'a:muro': segnoDa(items['a:muro'], ORA - GIORNO) },
  })
  uguale('i minuti sono quelli della settimana', s.minuti, 15)
  uguale('difficile è il muro', s.difficili.map(x => x.tipo).join(' '), 'a:muro')
  controlla('e sulla riga c\'è che è già alleggerita', s.difficili[0]?.alleggerita)
  controlla('col numero, non un giudizio', /8 su 10/.test(s.difficili[0]?.detto), s.difficili[0]?.detto)
  uguale('migliorata è quella salita', s.migliorate.map(x => `${x.tipo} ${x.da}→${x.a}`).join(' '),
         'b:salita 2→7')
  controlla('e una migliorata non sta anche fra le difficili',
            !s.difficili.some(x => x.tipo === 'b:salita'))
  controlla('«Va bene così» la toglie', !s.difficili.some(x => x.tipo === 'c:vabene'))
  controlla('senza una fotografia di una settimana fa lo dice',
            settimanaDi({ righe, items, now: ORA }).confronto === false)
}

riassunto('le mattonelle e la settimana')
