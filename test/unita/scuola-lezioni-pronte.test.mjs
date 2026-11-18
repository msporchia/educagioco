/* LE LEZIONI PRONTE DELLA SCUOLA — una per argomento dell'anno, da cambiare nell'editor

   Ogni lezione pronta è una lezione valida dentro i tetti del servizio, non chiede niente di un anno dopo il suo,
   ha un nome solo nel suo anno e nella sua materia, e ogni anno ha lezioni dove il catalogo ha qualcosa per lui.
   Vedi docs/scuola/lezioni-pronte.md.
   `node test/esegui.mjs scuola-lezioni-pronte --niente-build` */
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'
import { CATALOGO, GIOCHI, valido, giochiPer, giocoDi } from '../../src/scuola/comune/esercizi.js'
import { ANNI, ANNO_TABELLINE, LEZIONI_PRONTE, annoDi, materiaDi, pronte, materiePer, giochiDi, lezioneDa }
  from '../../src/scuola/comune/lezioni-pronte.js'
import { lezioneValida, MAX_QUANTE, MAX_MINUTI } from '../../src/scuola/maestra/quaderno.js'

const senzaGioco = ({ gioco, ...resto }) => resto

/* ══════════ 1. ogni lezione pronta è una lezione valida ══════════ */
for (const p of LEZIONI_PRONTE) {
  const o = p.obiettivo
  controlla(`${p.id}: l'obiettivo è un esercizio valido`, valido(o.esercizio), JSON.stringify(o.esercizio))
  controlla(`${p.id}: il «se hai finito» è nessuno o valido`, p.dopo === null || valido(p.dopo), JSON.stringify(p.dopo))
  controlla(`${p.id}: esattamente uno fra quante e minuti`, (o.quante === null) !== (o.minuti === null), JSON.stringify(o))
  controlla(`${p.id}: dentro i tetti del servizio`,
    o.quante === null ? Number.isInteger(o.minuti) && o.minuti >= 1 && o.minuti <= MAX_MINUTI : Number.isInteger(o.quante) && o.quante >= 1 && o.quante <= MAX_QUANTE,
    JSON.stringify(o))
  controlla(`${p.id}: ha un anno della primaria, una materia del catalogo e una riga per la maestra`,
    ANNI.includes(p.anno) && CATALOGO.materie.some(m => m.id === p.materia) && typeof p.allena === 'string' && p.allena.length > 10)
  uguale(`${p.id}: l'obiettivo è della sua materia`, materiaDi(o.esercizio), p.materia)
  const l = lezioneDa(p, 'lprova')
  controlla(`${p.id}: data all'editor è una lezione che si salva`, lezioneValida(l), JSON.stringify(l))
  stessaLista(`${p.id}: data all'editor ha solo i campi della lezione che viaggia`, Object.keys(l), ['id', 'nome', 'obiettivo', 'dopo'])
}

/* ══════════ 2. sta nel suo anno ══════════ */
for (const p of LEZIONI_PRONTE) {
  for (const [parte, e] of [['l\'obiettivo', p.obiettivo.esercizio], ['il «se hai finito»', p.dopo]]) {
    if (!e) continue
    const a = annoDi(e)
    controlla(`${p.id}: ${parte} non è di un anno dopo la ${p.anno}ª`, Number.isInteger(a) && a <= p.anno, `è di ${a}ª`)
  }
}
uguale('le tabelline sono di seconda', annoDi({ tipo: 'tabelline', tabelline: [7], modo: 'prodotto' }), ANNO_TABELLINE)
uguale('l\'anno guarda solo i gradini che le tipologie aprono', annoDi({ tipo: 'modulo', modulo: 'geometria', da: 1, a: 6, tipologie: ['geo:figure'] }), 0)
uguale('e senza tipologie il gradino più alto', annoDi({ tipo: 'modulo', modulo: 'geometria', da: 1, a: 6, tipologie: [] }), 5)
uguale('il gioco non cambia l\'anno', annoDi({ tipo: 'tabelline', tabelline: [7], modo: 'prodotto', gioco: 'asteroidi' }), ANNO_TABELLINE)

/* ══════════ 3. i nomi e gli id ══════════ */
{
  const visti = new Map()
  for (const p of LEZIONI_PRONTE) {
    const k = `${p.anno}|${p.materia}|${p.nome}`
    controlla(`nome doppio nella ${p.anno}ª, ${p.materia}: «${p.nome}»`, !visti.has(k))
    visti.set(k, true)
  }
  uguale('gli id sono unici', new Set(LEZIONI_PRONTE.map(p => p.id)).size, LEZIONI_PRONTE.length)
  controlla('gli id stanno bene in un attributo', LEZIONI_PRONTE.every(p => /^[a-z0-9-]+$/.test(p.id)))
}

/* ══════════ 4. ogni anno ha lezioni dove il catalogo ha qualcosa per lui ══════════ */
// «per quell'anno»: un gradino di quell'anno (la prima prende anche la scuola dell'infanzia)
const diQuellAnno = (classe, anno) => (anno === 1 ? classe <= 1 : classe === anno)
const vociDellAnno = (mat, anno) => mat.voci.filter(v =>
  v.tipo === 'tabelline' ? anno === ANNO_TABELLINE : v.gradini.some(g => diQuellAnno(g.classe, anno)))
for (const anno of ANNI) {
  for (const mat of CATALOGO.materie) {
    const voci = vociDellAnno(mat, anno)
    if (!voci.length) continue
    const qui = pronte({ anno, materia: mat.id })
    controlla(`${anno}ª: ci sono lezioni pronte di ${mat.nome}`, qui.length > 0)
    for (const v of voci) {
      const usata = qui.some(p => (p.obiettivo.esercizio.tipo === 'tabelline' ? 'tabelline' : p.obiettivo.esercizio.modulo) === v.id)
      controlla(`${anno}ª: «${v.nome}» ha un gradino di quest'anno e una lezione pronta`, usata)
    }
  }
  nota(`${anno}ª:`, materiePer(anno).map(m => `${m.id} ${pronte({ anno, materia: m.id }).length}`).join(' · '))
}

/* ══════════ 5. i giochi ══════════ */
{
  for (const p of LEZIONI_PRONTE) {
    const g = giocoDi(p.obiettivo.esercizio)
    if (g === 'schede') continue
    const gemella = LEZIONI_PRONTE.find(x => x.id === p.id.replace(new RegExp(`-${g}$`), ''))
    controlla(`${p.id}: nel gioco c'è anche la stessa nelle domande`, !!gemella && JSON.stringify(senzaGioco(p.obiettivo.esercizio)) === JSON.stringify(gemella.obiettivo.esercizio))
  }
  for (const p of LEZIONI_PRONTE.filter(x => giocoDi(x.obiettivo.esercizio) === 'schede')) {
    for (const g of giochiPer(p.obiettivo.esercizio).filter(x => x.id !== 'schede'))
      controlla(`${p.id}: il gioco «${g.nome}» accetta l'obiettivo, e c'è la lezione lì`, LEZIONI_PRONTE.some(x => x.id === `${p.id}-${g.id}`))
  }
  const asteroidi = pronte({ gioco: 'asteroidi' })
  controlla('negli Asteroidi ci sono lezioni, tutte di matematica', asteroidi.length > 0 && asteroidi.every(p => p.materia === 'matematica'))
  stessaLista('in seconda la matematica si fa nelle domande e negli Asteroidi', giochiDi(2, 'matematica').map(g => g.id), ['schede', 'asteroidi'])
  stessaLista('l\'italiano solo nelle domande', giochiDi(3, 'italiano').map(g => g.id), ['schede'])
  controlla('ogni gioco proposto è un gioco vero', ANNI.every(a => materiePer(a).every(m => giochiDi(a, m.id).every(g => GIOCHI.includes(g)))))
}

/* ══════════ 6. i filtri ══════════ */
{
  uguale('senza filtri, tutte', pronte().length, LEZIONI_PRONTE.length)
  controlla('per anno, materia e gioco', pronte({ anno: 3, materia: 'matematica', gioco: 'schede' })
    .every(p => p.anno === 3 && p.materia === 'matematica' && giocoDi(p.obiettivo.esercizio) === 'schede'))
  stessaLista('le materie seguono l\'ordine del catalogo', materiePer(1).map(m => m.id),
    CATALOGO.materie.map(m => m.id).filter(id => pronte({ anno: 1, materia: id }).length))
  uguale('un anno che non c\'è non ha niente', pronte({ anno: 6 }).length, 0)
  const p = pronte({ anno: 2, materia: 'matematica' })[0]
  const l = lezioneDa(p, 'lx')
  l.obiettivo.esercizio.tabelline?.push(99)
  controlla('lezioneDa dà una copia: cambiarla non tocca la pronta', valido(p.obiettivo.esercizio))
}

nota(`${LEZIONI_PRONTE.length} lezioni pronte`)
riassunto('le lezioni pronte della scuola')
