/* LE LEZIONI PRONTE DELLA SCUOLA — una per argomento dell'anno, da cambiare nell'editor

   Ogni lezione pronta è una lezione valida dentro i tetti del servizio, non chiede niente di un anno dopo il suo,
   ha un nome solo nel suo anno e nella sua materia, e ogni anno ha lezioni dove il catalogo ha qualcosa per lui.
   Vedi docs/scuola/lezioni-pronte.md.
   `node test/esegui.mjs scuola-lezioni-pronte --niente-build` */
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'
import { CATALOGO, GIOCHI, valido, giochiPer, giocoDi } from '../../src/scuola/comune/esercizi.js'
import { ANNI, ANNO_TABELLINE, LEZIONI_PRONTE, annoDi, materiaDi, pronte, materiePer, giochiDi, lezioneDa }
  from '../../src/scuola/comune/lezioni-pronte.js'
import { lezioneValida } from '../../src/scuola/maestra/quaderno.js'
import { lezioneValida as validaComune, passaValido, modoDi } from '../../src/scuola/comune/lezione.js'

const senzaGioco = ({ gioco, ...resto }) => resto

/* ══════════ 1. ogni lezione pronta è una lezione valida ══════════ */
// l'obiettivo di prima è il primo blocco (a domande o a minuti), il «se hai finito» il secondo (quando lo dice la maestra)
for (const p of LEZIONI_PRONTE) {
  const [primo, secondo, ...altri] = p.blocchi
  controlla(`${p.id}: ogni blocco chiede un esercizio valido`, p.blocchi.every(b => valido(b.esercizio)), JSON.stringify(p.blocchi))
  controlla(`${p.id}: il primo blocco passa da solo, a domande o a minuti, dentro i tetti`,
    passaValido(primo.passa) && ['domande', 'minuti'].includes(modoDi(primo.passa)), JSON.stringify(primo.passa))
  controlla(`${p.id}: il secondo, se c'è, passa quando lo dice la maestra`, !secondo || secondo.passa === null, JSON.stringify(secondo))
  controlla(`${p.id}: al più due blocchi, non in tondo`, !altri.length && p.inTondo === false)
  controlla(`${p.id}: ha un anno della primaria, una materia del catalogo e una riga per la maestra`,
    ANNI.includes(p.anno) && CATALOGO.materie.some(m => m.id === p.materia) && typeof p.allena === 'string' && p.allena.length > 10)
  uguale(`${p.id}: il primo blocco è della sua materia`, materiaDi(primo.esercizio), p.materia)
  const l = lezioneDa(p, 'lprova')
  controlla(`${p.id}: data all'editor è una lezione che si salva`, lezioneValida(l) && validaComune(l), JSON.stringify(l))
  stessaLista(`${p.id}: data all'editor ha solo i campi della lezione che viaggia`, Object.keys(l), ['id', 'nome', 'blocchi', 'inTondo'])
}

/* ══════════ 2. sta nel suo anno ══════════ */
for (const p of LEZIONI_PRONTE) {
  for (const [i, { esercizio }] of p.blocchi.entries()) {
    const a = annoDi(esercizio)
    controlla(`${p.id}: il blocco ${i + 1} non è di un anno dopo la ${p.anno}ª`, Number.isInteger(a) && a <= p.anno, `è di ${a}ª`)
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
      const usata = qui.some(p => (p.blocchi[0].esercizio.tipo === 'tabelline' ? 'tabelline' : p.blocchi[0].esercizio.modulo) === v.id)
      controlla(`${anno}ª: «${v.nome}» ha un gradino di quest'anno e una lezione pronta`, usata)
    }
  }
  nota(`${anno}ª:`, materiePer(anno).map(m => `${m.id} ${pronte({ anno, materia: m.id }).length}`).join(' · '))
}

/* ══════════ 5. i giochi ══════════ */
{
  for (const p of LEZIONI_PRONTE) {
    const g = giocoDi(p.blocchi[0].esercizio)
    if (g === 'schede') continue
    const gemella = LEZIONI_PRONTE.find(x => x.id === p.id.replace(new RegExp(`-${g}$`), ''))
    controlla(`${p.id}: nel gioco c'è anche la stessa nelle domande`, !!gemella && JSON.stringify(p.blocchi.map(b => senzaGioco(b.esercizio))) === JSON.stringify(gemella.blocchi.map(b => b.esercizio)))
  }
  for (const p of LEZIONI_PRONTE.filter(x => giocoDi(x.blocchi[0].esercizio) === 'schede')) {
    for (const g of giochiPer(p.blocchi[0].esercizio).filter(x => x.id !== 'schede'))
      controlla(`${p.id}: il gioco «${g.nome}» accetta il primo blocco, e c'è la lezione lì`, LEZIONI_PRONTE.some(x => x.id === `${p.id}-${g.id}`))
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
    .every(p => p.anno === 3 && p.materia === 'matematica' && giocoDi(p.blocchi[0].esercizio) === 'schede'))
  stessaLista('le materie seguono l\'ordine del catalogo', materiePer(1).map(m => m.id),
    CATALOGO.materie.map(m => m.id).filter(id => pronte({ anno: 1, materia: id }).length))
  uguale('un anno che non c\'è non ha niente', pronte({ anno: 6 }).length, 0)
  const p = pronte({ anno: 2, materia: 'matematica' })[0]
  const l = lezioneDa(p, 'lx')
  l.blocchi[0].esercizio.tabelline?.push(99)
  controlla('lezioneDa dà una copia: cambiarla non tocca la pronta', valido(p.blocchi[0].esercizio))
}

nota(`${LEZIONI_PRONTE.length} lezioni pronte`)
riassunto('le lezioni pronte della scuola')
