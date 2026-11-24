/* GLI ESERCIZI DELLA SCUOLA — cosa può chiedere la maestra e come si pescano le domande

   Il catalogo costruisce solo esercizi validi, `valido` regge un link manomesso, il pescatore gira
   tutti i fatti prima di ripeterne uno e consegna domande nella forma di Domanda.vue, e il racconto di
   una risposta sta nei 40 caratteri del protocollo. Vedi docs/scuola/esercizi.md.
   `node test/esegui.mjs scuola-esercizi --niente-build` */
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'
import { CATALOGO, MODULI_USATI, valido, descrivi, pescatore, racconta, raccontaAsteroide, LUNGO, giochiPer, limiteAsteroidi, perLeSchede }
  from '../../src/scuola/comune/esercizi.js'
import { MODULI } from '../../src/scuola/sostituti/registro.js'
import { guastiDi, spiegazioneDi } from '../../src/quiz/nucleo/domanda.js'

const voci = CATALOGO.materie.flatMap(m => m.voci)

// la forma di Domanda.vue, il perché dopo uno sbaglio e il racconto corto, su una domanda pescata
function guardaDomanda(dove, q, { chiavi = null } = {}) {
  const d = q.domanda
  const guasti = guastiDi(d, { pittori: q.pittori })
  controlla(`${dove}: la domanda ha la forma che Domanda.vue si aspetta`, !guasti.length, guasti.join('; '))
  controlla(`${dove}: ha un titolo`, typeof q.titolo === 'string' && q.titolo.length > 0)
  if (chiavi) controlla(`${dove}: la chiave è una tipologia chiesta`, chiavi.includes(d.chiave), d.chiave)
  for (let i = 0; i < d.risposte.length; i++) {
    const r = racconta(d, i)
    for (const k of ['fatto', 'data', 'attesa'])
      controlla(`${dove}: racconta.${k} è un testo fra 1 e ${LUNGO} caratteri`,
        typeof r[k] === 'string' && r[k].length > 0 && r[k].length <= LUNGO, JSON.stringify(r))
    uguale(`${dove}: racconta.attesa è la giusta`, r.attesa, racconta(d, d.giusta).data)
    if (i !== d.giusta && d.aiuto)
      uguale(`${dove}: dopo uno sbaglio c'è il «Si fa così»`, spiegazioneDi(d, i).comeSiFa, d.aiuto)
  }
}

/* ══════════ 1. il catalogo costruisce esercizi validi ══════════ */
{
  controlla('il catalogo ha delle materie', CATALOGO.materie.length > 0)
  for (const v of voci) {
    controlla(`${v.id}: ha nome, icona e spiegazione`, !!(v.nome && v.icona && v.spiega))
    controlla(`${v.id}: l'esercizio di partenza è valido`, valido(v.base), JSON.stringify(v.base))
    controlla(`${v.id}: descrivi dice qualcosa`, descrivi(v.base).length > 3)
    controlla(`${v.id}: l'esercizio passa dal link così com'è`, valido(JSON.parse(JSON.stringify(v.base))))
    if (v.gioco) continue           // il contenuto di un gioco (docs/scuola/giochi.md): lo prova il test del gioco
    if (v.tipo === 'tabelline') {
      for (const t of v.tabelline) for (const modo of v.modi.map(m => m.id))
        controlla(`tabellina ${t.valore}, ${modo}: valida`, valido({ tipo: 'tabelline', tabelline: [t.valore], modo }))
      controlla('tutte le tabelline insieme: valido',
        valido({ tipo: 'tabelline', tabelline: v.tabelline.map(t => t.valore), modo: 'misti' }))
      continue
    }
    uguale(`${v.id}: un tipo «modulo»`, v.tipo, 'modulo')
    for (const g of v.gradini) {
      const e = { tipo: 'modulo', modulo: v.id, da: g.grado, a: g.grado, tipologie: [] }
      controlla(`${v.id} gradino ${g.grado}: valido`, valido(e))
      controlla(`${v.id} gradino ${g.grado}: ha un nome e una classe`, !!g.nome && g.classe >= 0 && g.classe <= 5)
      guardaDomanda(`${v.id} gradino ${g.grado}`, pescatore(e, g.grado).prossima())
    }
    for (const t of v.tipologie) {
      controlla(`${t.id}: ha un nome per la maestra`, !!t.nome)
      const e = { tipo: 'modulo', modulo: v.id, da: t.gradini[0], a: t.gradini[t.gradini.length - 1], tipologie: [t.id] }
      controlla(`${t.id}: valida da sola`, valido(e))
      const p = pescatore(e, 11)
      for (let i = 0; i < 6; i++) guardaDomanda(`${t.id} #${i}`, p.prossima(), { chiavi: [t.id] })
    }
  }
  nota(`${voci.length} voci in ${CATALOGO.materie.length} materie`)
}

/* ══════════ 2. valido rifiuta le forme storte ══════════ */
{
  const storti = [
    null, undefined, 9, 'tabelline', [], {}, { tipo: 'boh' },
    { tipo: 'tabelline', tabelline: [], modo: 'prodotto' },
    { tipo: 'tabelline', tabelline: [0], modo: 'prodotto' },
    { tipo: 'tabelline', tabelline: [11], modo: 'prodotto' },
    { tipo: 'tabelline', tabelline: [9, 9], modo: 'prodotto' },
    { tipo: 'tabelline', tabelline: ['9'], modo: 'prodotto' },
    { tipo: 'tabelline', tabelline: [8.5], modo: 'prodotto' },
    { tipo: 'tabelline', tabelline: 9, modo: 'prodotto' },
    { tipo: 'tabelline', tabelline: [9], modo: 'divisione' },
    { tipo: 'tabelline', tabelline: [9] },
    { tipo: 'tabelline', tabelline: [9], modo: 'prodotto', quante: 15 },
    { tipo: 'modulo', modulo: 'ing-frasi', da: 1, a: 1, tipologie: [] },
    { tipo: 'modulo', modulo: 'tabelline', da: 1, a: 1, tipologie: [] },
    { tipo: 'modulo', modulo: 'constructor', da: 1, a: 1, tipologie: [] },
    { tipo: 'modulo', modulo: 'orologio', da: 0, a: 2, tipologie: [] },
    { tipo: 'modulo', modulo: 'orologio', da: 1, a: 6, tipologie: [] },
    { tipo: 'modulo', modulo: 'orologio', da: 3, a: 2, tipologie: [] },
    { tipo: 'modulo', modulo: 'orologio', da: '1', a: 2, tipologie: [] },
    { tipo: 'modulo', modulo: 'orologio', da: 1, a: 2 },
    { tipo: 'modulo', modulo: 'orologio', da: 1, a: 2, tipologie: 'ora:intere' },
    { tipo: 'modulo', modulo: 'orologio', da: 1, a: 2, tipologie: ['ora:boh'] },
    { tipo: 'modulo', modulo: 'orologio', da: 1, a: 2, tipologie: ['orto:gn'] },
    { tipo: 'modulo', modulo: 'orologio', da: 1, a: 2, tipologie: ['ora:intere', 'ora:intere'] },
    { tipo: 'modulo', modulo: 'orologio', da: 4, a: 5, tipologie: ['ora:intere'] },
    { tipo: 'modulo', modulo: 'orologio', da: 1, a: 2, tipologie: [], extra: 1 },
    JSON.parse('{"tipo":"modulo","modulo":"orologio","da":1,"a":2,"tipologie":[],"__proto__":{"x":1}}'),
  ]
  for (const e of storti) {
    let dice
    try { dice = valido(e) } catch (err) { dice = `lancia: ${err.message}` }
    uguale(`valido rifiuta ${JSON.stringify(e)}`, dice, false)
  }
  uguale('descrivi di uno storto non lancia', descrivi({ tipo: 'boh' }), 'Esercizio non valido')
  let lancia = false
  try { pescatore({ tipo: 'boh' }) } catch { lancia = true }
  controlla('il pescatore di uno storto lancia invece di pescare a caso', lancia)
}

/* ══════════ 3. la tabellina del 9: solo il 9, tutti i fatti prima di ripetere ══════════ */
{
  for (const modo of ['prodotto', 'nascosto', 'misti']) {
    const p = pescatore({ tipo: 'tabelline', tabelline: [9], modo }, 5)
    let prima = null
    const forme = new Set()
    const formeDelFatto = new Map()
    for (let giro = 0; giro < 6; giro++) {
      const fatti = []
      for (let i = 0; i < 10; i++) {
        const q = p.prossima()
        const d = q.domanda
        guardaDomanda(`tabellina del 9 (${modo})`, q)
        const prodotto = /^9 × (\d+) = \?$/.exec(d.testo)
        const nascosto = /^9 × □ = (\d+)$/.exec(d.testo)
        controlla(`tabellina del 9 (${modo}): solo fatti del 9`, !!(prodotto || nascosto), d.testo)
        const f = prodotto ? Number(prodotto[1]) : nascosto ? Number(nascosto[1]) / 9 : NaN
        forme.add(prodotto ? 'prodotto' : 'nascosto')
        if (!formeDelFatto.has(f)) formeDelFatto.set(f, new Set())
        formeDelFatto.get(f).add(prodotto ? 'prodotto' : 'nascosto')
        controlla(`tabellina del 9 (${modo}): mai lo stesso fatto due volte di fila`, f !== prima, `9 × ${f}`)
        prima = f
        fatti.push(f)
        controlla(`tabellina del 9 (${modo}): c'è il «Si fa così»`, !!d.aiuto, d.testo)
        controlla(`tabellina del 9 (${modo}): ogni falso dice perché`,
          d.risposte.every((r, j) => j === d.giusta || !!r.perche), d.testo)
      }
      stessaLista(`tabellina del 9 (${modo}), giro ${giro + 1}: 9 × 1 … 9 × 10, una volta ciascuno`,
        fatti.sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    }
    if (modo === 'misti') {
      uguale('nei misti escono le due forme', forme.size, 2)
      controlla('nei misti ogni fatto arriva nelle due forme in due giri',
        [...formeDelFatto.values()].every(s => s.size === 2))
    } else stessaLista(`tabellina del 9 (${modo}): una forma sola`, [...forme], [modo])
  }
  const p = pescatore({ tipo: 'tabelline', tabelline: [3, 4], modo: 'prodotto' }, 2)
  const giro = Array.from({ length: 20 }, () => p.prossima().domanda.testo)
  uguale('tabelline del 3 e del 4: venti fatti diversi in un giro', new Set(giro).size, 20)
  uguale('racconta un conto senza «= ?»', racconta(pescatore({ tipo: 'tabelline', tabelline: [9], modo: 'prodotto' }, 1)
    .prossima().domanda, 0).fatto.replace(/\d+$/, 'n'), '9 × n')
  const a = pescatore({ tipo: 'tabelline', tabelline: [9], modo: 'misti' }, 77)
  const b = pescatore({ tipo: 'tabelline', tabelline: [9], modo: 'misti' }, 77)
  stessaLista('con lo stesso seme le stesse domande',
    Array.from({ length: 15 }, () => a.prossima().domanda), Array.from({ length: 15 }, () => b.prossima().domanda))
  controlla('senza seme pesca lo stesso', !!pescatore({ tipo: 'tabelline', tabelline: [7], modo: 'prodotto' }).prossima().domanda)
}

/* ══════════ 4. un modulo: il giro sulle classi, mai la stessa due volte di fila ══════════ */
{
  // orologio dal 1 al 5: le ore intere stanno in 3 gradini, i quarti in 4, i minuti e le durate in 2
  const e = { tipo: 'modulo', modulo: 'orologio', da: 1, a: 5, tipologie: [] }
  const p = pescatore(e, 3)
  const conti = {}
  for (let i = 0; i < 11 * 4; i++) { const k = p.prossima().domanda.chiave; conti[k] = (conti[k] || 0) + 1 }
  stessaLista('orologio: ogni classe una volta per giro',
    Object.entries(conti).sort(), [['ora:durata', 8], ['ora:intere', 12], ['ora:minuti', 8], ['ora:quarti', 16]])

  // pochi fatti possibili: «quanti giorni ha un mese» sono dodici
  const stretto = pescatore({ tipo: 'modulo', modulo: 'calendario', da: 2, a: 2, tipologie: ['cal:giorni-mese'] }, 9)
  let prima = null
  for (let i = 0; i < 200; i++) {
    const d = stretto.prossima().domanda
    controlla('calendario: mai la stessa domanda due volte di fila', d.testo !== prima, d.testo)
    prima = d.testo
  }
}

/* ══════════ 5. il registro della scuola ══════════ */
{
  stessaLista('il registro della scuola elenca proprio i moduli del catalogo',
    MODULI.map(m => m.id).sort(), MODULI_USATI.map(m => m.id).sort())
  controlla("niente moduli d'inglese (arrivano a store/srs.js)", !MODULI.some(m => m.id.startsWith('ing-')))
  const nelCatalogo = new Set(voci.map(v => v.id))
  controlla('ogni modulo del registro è una voce del catalogo o un pezzo delle tabelline',
    MODULI.every(m => nelCatalogo.has(m.id)))
}

/* ══════════ 6. una risposta degli Asteroidi ══════════ */
{
  stessaLista('un colpo giusto', Object.entries(raccontaAsteroide({ testo: '9 × 7 = ?', data: 63, attesa: 63 })),
    [['fatto', '9 × 7'], ['data', '63'], ['attesa', '63']])
  uguale('un colpo sbagliato dice il sasso colpito', raccontaAsteroide({ testo: '9 × 7 = ?', data: 56, attesa: 63 }).data, '56')
  uguale('il giusto caduto: nessuna risposta', raccontaAsteroide({ testo: '9 × 7 = ?', data: null, attesa: 63 }).data, '—')
  controlla('anche da storto non lancia e resta corto', Object.values(raccontaAsteroide({ testo: 'x'.repeat(99) }))
    .every(t => typeof t === 'string' && t.length <= LUNGO))
}

console.log('\nPIÙ COSE INSIEME, CON LE INTENSITÀ')
{
  const t = (tabelline, modo = 'prodotto') => ({ tipo: 'tabelline', tabelline, modo })
  const ins = (...parti) => ({ tipo: 'insieme', parti: parti.map(([esercizio, peso]) => ({ esercizio, peso })) })
  const otto = ins([t([8]), 'tanto'], [t([3, 4, 5, 6]), 'poco'])
  controlla('«tanto l\'8, un po\' il 3-6» è valido', valido(otto))
  uguale('e si descrive con le intensità', descrivi(otto), 'Tabellina dell\'8 · il risultato (tanto) + Tabelline dal 3 al 6 · il risultato (un po\')')
  const p = pescatore(otto, 7)
  const usciti = Array.from({ length: 50 }, () => p.prossima().domanda.testo)
  uguale('quattro domande dell\'8 per una del ripasso', usciti.filter(s => s.startsWith('8 ×')).length, 40)
  controlla('e il ripasso le gira tutte e quattro', [3, 4, 5, 6].every(n => usciti.some(s => s.startsWith(n + ' ×'))))
  const misto = ins([t([8], 'nascosto'), 'normale'], [{ tipo: 'modulo', modulo: 'orologio', da: 1, a: 2, tipologie: [] }, 'poco'])
  controlla('tabelline e orologio insieme si possono fare', valido(misto) && !!pescatore(misto, 3).prossima().domanda)
  stessaLista('nelle domande, in Survivors e nel sotterraneo, che prendono tutto il catalogo', giochiPer(misto).map(g => g.id), ['schede', 'survivors', 'sotterraneo'])
  controlla('e agli Asteroidi no', !valido({ ...misto, gioco: 'asteroidi' }))
  controlla('tutte tabelline col risultato: anche negli Asteroidi', valido({ ...otto, gioco: 'asteroidi' }))
  stessaLista('che ricevono i gruppi con le loro volte', limiteAsteroidi({ ...otto, gioco: 'asteroidi' }).gruppi,
    [{ tabelline: [8], volte: 4, modo: 'prodotto' }, { tabelline: [3, 4, 5, 6], volte: 1, modo: 'prodotto' }])
  const nascosti = ins([t([7], 'nascosto'), 'tanto'], [t([2, 3], 'misti'), 'poco'])
  controlla('anche il numero nascosto e i misti negli Asteroidi (9 × ? = 63)', valido({ ...nascosti, gioco: 'asteroidi' }) &&
    valido({ ...t([9], 'nascosto'), gioco: 'asteroidi' }))
  stessaLista('e ogni gruppo porta il suo modo', limiteAsteroidi({ ...nascosti, gioco: 'asteroidi' }).gruppi.map(g => g.modo), ['nascosto', 'misti'])
  for (const [cosa, e] of [['una parte sola', ins([t([8]), 'tanto'])], ['un\'intensità sconosciuta', ins([t([8]), 'tantissimo'], [t([2]), 'poco'])],
    ['un insieme dentro un insieme', ins([otto, 'poco'], [t([2]), 'poco'])], ['un gioco dentro una parte', ins([{ ...t([8]), gioco: 'asteroidi' }, 'poco'], [t([2]), 'poco'])],
    ['sette parti', ins(...Array.from({ length: 7 }, (_, i) => [t([i + 1]), 'poco']))]])
    controlla(`non è valido: ${cosa}`, !valido(e))
}

console.log('\nIL CALCOLO A MENTE DEGLI ASTEROIDI')
{
  const m = { tipo: 'mente', stazioni: ['somma-10', 'somma-20'] }
  const t = { tipo: 'tabelline', tabelline: [7], modo: 'prodotto' }
  controlla('è un esercizio, e si fa solo negli Asteroidi', valido(m) && giochiPer(m).map(g => g.id).join() === 'asteroidi')
  for (const [cosa, e] of [['senza stazioni', { tipo: 'mente', stazioni: [] }], ['una stazione che non c\'è', { tipo: 'mente', stazioni: ['boh'] }],
    ['doppia', { tipo: 'mente', stazioni: ['somma-10', 'somma-10'] }], ['una chiave in più', { ...m, x: 1 }]]) controlla(`non è valido: ${cosa}`, !valido(e))
  const misto = { tipo: 'insieme', parti: [{ esercizio: t, peso: 'tanto' }, { esercizio: m, peso: 'poco' }] }
  controlla('con le tabelline si mescola negli Asteroidi', valido({ ...misto, gioco: 'asteroidi' }))
  controlla('ma non senza gioco, né a schede', !valido(misto) && !valido({ ...misto, gioco: 'schede' }))
  stessaLista('agli Asteroidi arrivano i gruppi e il calcolo, coi loro pesi', limiteAsteroidi({ ...misto, gioco: 'asteroidi' }),
    { gruppi: [{ tabelline: [7], volte: 4, modo: 'prodotto' }], mente: { concetti: ['somma-10', 'doppi', 'meno-10', 'somma-20', 'quasi-doppi', 'meno-20'], volte: 1 } })
  stessaLista('a schede resta la parte che le schede sanno fare', perLeSchede({ ...misto, gioco: 'asteroidi' }), t)
  uguale('e il calcolo solo resta nel gioco', perLeSchede({ ...m, gioco: 'asteroidi' }), null)
  uguale('si descrive', descrivi({ ...m, gioco: 'asteroidi' }), 'Calcolo a mente · fino al dieci e oltre la decina · negli Asteroidi')
}

/* ── la scelta del gioco della maestra mostra qualche secondo di ogni gioco (docs/scuola/editor.md, «La scelta del gioco») ── */
{
  const { GIOCHI } = await import('../../src/scuola/comune/esercizi.js')
  const { ANTEPRIME } = await import('../../src/scuola/maestra/anteprime-giochi.js')
  const { mescolaPiuCose } = await import('../../src/scuola/comune/esercizi.js')
  stessaLista('un gioco col contenuto suo dice cosa allena (non «Si può chiedere: <il suo nome>»)', GIOCHI.filter(g => !mescolaPiuCose(g.id) && !g.allena).map(g => g.id), [])
  stessaLista('ogni gioco ha il suo video (se no: `npm run anteprime scuola`)', GIOCHI.filter(g => !/^data:video\/mp4;base64,/.test(ANTEPRIME[g.id] || '')).map(g => g.id), [])
}

riassunto('gli esercizi della scuola')
