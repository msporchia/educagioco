/* ═══════════════════════════════════════════════════════════════════
   ESPAÑOL — verifica dei dati e del motore delle domande, senza browser.
   `node test/esegui.mjs spagnolo`

   Le cose che possono rompersi in silenzio sono quasi tutte nei dati:
   un'emoji ripetuta fa una domanda con due risposte giuste, una parola
   senza clip toglie l'ascolto, una tappa senza abbastanza roba nuova
   diventa impossibile da superare. Qui si controllano quelle.

   Due controlli in più rispetto all'inglese, e sono i due punti dove lo
   spagnolo è diverso:

     · LE DOMANDE HANNO I DUE SEGNI, `¿` e `?`. In inglese le frasi sono
       scritte senza punto interrogativo di proposito; qui il contrario,
       perché in spagnolo la domanda si scrive. Ne segue che i falsi di
       una domanda devono essere domande anche loro: se l'unica frase
       con `¿` fosse quella giusta, si indovinerebbe senza capire.
     · NIENTE CHIAVI IN COMUNE CON L'INGLESE. Le due lingue non si
       devono mescolare nel motore di apprendimento: sapere «gatto» in
       inglese non vuol dire saperlo in spagnolo.
   ═══════════════════════════════════════════════════════════════════ */
import { PAROLE_ES, CATS_ES } from '../../src/data/parole-es.js'
import { VERBI_ES } from '../../src/data/verbi-es.js'
import { FRASI_ES } from '../../src/data/frasi-es.js'
import { CAMPAGNA, LIBERO } from '../../src/data/campagna-spagnolo.js'
import { CAMPAGNA as TAPPE_EN } from '../../src/data/campagna-inglese.js'
import { voceDi, tutteDi } from '../../src/data/lessico.js'
import { TIPI, NOMI_TIPI, scegliTipo, componi, livelloDaForza } from '../../src/data/domande.js'
import { INDICE } from '../../src/data/voci-es.js'
import { newItem, record, strength, activeSet, createPicker, SRS } from '../../src/store/srs.js'
import { controlla, nota, riassunto } from '../aiuto/verifica.mjs'

const ok = (cond, cosa, dettaglio = '') => controlla(cosa, cond, dettaglio)
const titolo = t => console.log('\n' + t)
const TUTTE = tutteDi('es')

/* ═══════════ 1. il lessico ═══════════ */
titolo('LESSICO')
{
  const emoji = new Map(), parole = new Map()
  for (const [es, it, em, cat] of PAROLE_ES) {
    if (em) emoji.set(em, [...(emoji.get(em) || []), es])
    parole.set(es, [...(parole.get(es) || []), cat])
    if (!CATS_ES[cat]) ok(false, 'categoria sconosciuta', cat + ' su ' + es)
    if (!it) ok(false, 'italiano mancante', es)
  }
  const emDoppie = [...emoji].filter(([, v]) => v.length > 1)
  const paDoppie = [...parole].filter(([, v]) => v.length > 1)
  ok(!emDoppie.length, 'emoji ripetute in parole-es.js', JSON.stringify(emDoppie))
  ok(!paDoppie.length, 'parole ripetute in parole-es.js', JSON.stringify(paDoppie))

  const emV = new Map()
  for (const [es, , em] of VERBI_ES) if (em) emV.set(em, [...(emV.get(em) || []), es])
  ok(![...emV].some(([, v]) => v.length > 1), 'emoji ripetute in verbi-es.js',
     JSON.stringify([...emV].filter(([, v]) => v.length > 1)))

  const verbiDoppi = VERBI_ES.map(v => v[0]).filter((v, i, a) => a.indexOf(v) !== i)
  ok(!verbiDoppi.length, 'verbi ripetuti in verbi-es.js', verbiDoppi.join(', '))

  console.log(`  ${PAROLE_ES.length} parole · ${VERBI_ES.length} verbi · ${FRASI_ES.length} frasi` +
              `  = ${TUTTE.length} voci`)
}

/* ═══════════ 2. le due lingue non si mescolano ═══════════ */
titolo('DUE LINGUE SEPARATE')
{
  const chiaviEn = new Set(TAPPE_EN[TAPPE_EN.length - 1].chiavi)
  const chiaviEs = CAMPAGNA[CAMPAGNA.length - 1].chiavi
  const comuni = chiaviEs.filter(k => chiaviEn.has(k))
  ok(!comuni.length, 'chiavi in comune fra inglese e spagnolo', comuni.slice(0, 5).join(', '))
  ok(chiaviEs.every(k => /^(es:|verbo-es:|frase-es:)/.test(k)),
     'una chiave spagnola non ha il prefisso suo')
  ok(TUTTE.every(v => v.lingua === 'es'), 'una voce spagnola dichiara un’altra lingua')
  nota(`  ${chiaviEs.length} chiavi spagnole, nessuna condivisa con le ${chiaviEn.size} inglesi`)
}

/* ═══════════ 3. distrattori: ce n'è abbastanza? ═══════════ */
titolo('DISTRATTORI')
{
  const perCat = {}
  for (const v of TUTTE) {
    const k = v.genere + ':' + v.cat
    perCat[k] = perCat[k] || { tot: 0, conEmoji: 0 }
    perCat[k].tot++
    if (v.emoji) perCat[k].conEmoji++
  }
  const magre = Object.entries(perCat).filter(([, v]) => v.conEmoji > 0 && v.conEmoji < 6)
  ok(!magre.length, 'categorie con qualche emoji ma meno di sei',
     JSON.stringify(magre.map(([k, v]) => k + '=' + v.conEmoji)))
  const povere = Object.entries(perCat).filter(([, v]) => v.tot < 3)
  ok(!povere.length, 'categorie con meno di tre voci', JSON.stringify(povere.map(([k]) => k)))
}

/* ═══════════ 4. le frasi ═══════════ */
titolo('FRASI')
{
  const domanda = s => s.trim().startsWith('¿')
  const idi = new Set()
  for (const f of FRASI_ES) {
    ok(!idi.has(f.id), 'id di frase ripetuto', f.id); idi.add(f.id)
    ok(f.falsi && f.falsi.length >= 2, 'meno di due falsi', f.id)
    ok(!(f.falsi || []).includes(f.es), 'un falso è uguale alla frase giusta', f.id)
    ok(new Set(f.falsi).size === (f.falsi || []).length, 'due falsi uguali', f.id)
    ok(!(f.falsiIt || []).includes(f.it), 'un falso italiano è uguale al giusto', f.id)

    /* i due segni della domanda: o ci sono tutti e due, o non c'è
       nessuno dei due */
    if (domanda(f.es)) ok(/\?\s*$/.test(f.es), 'domanda aperta con ¿ e non chiusa con ?', f.id)
    else ok(!/[?!.]\s*$/.test(f.es), 'affermativa con punteggiatura finale', f.id + ': ' + f.es)

    /* e i falsi devono avere la stessa faccia della frase giusta */
    for (const x of f.falsi)
      ok(domanda(x) === domanda(f.es), 'un falso non ha la forma della frase giusta',
         f.id + ': ' + x)

    if (f.buco) {
      ok(f.buco.testo.includes('___'), 'il buco non ha il vuoto', f.id)
      ok(f.buco.falsi && f.buco.falsi.length >= 3, 'il buco ha meno di tre falsi', f.id)
      ok(!f.buco.falsi.includes(f.buco.giusta), 'il buco ha il giusto anche fra i falsi', f.id)
    }
  }
  const domande = FRASI_ES.filter(f => domanda(f.es)).length
  console.log(`  ${FRASI_ES.length} frasi · ${FRASI_ES.filter(f => f.buco).length} con il buco · ` +
              `${domande} domande`)
  ok(domande >= 10, 'poche domande fra le frasi', String(domande))

  /* la grammatica per cui esiste questa lingua: se sparissero questi
     buchi resterebbe un elenco di parole tradotte */
  const conBuco = FRASI_ES.filter(f => f.buco)
  const serEstar = conBuco.filter(f => ['es', 'está', 'son', 'estoy'].includes(f.buco.giusta))
  const tener = conBuco.filter(f => f.buco.giusta.startsWith('teng'))
  ok(serEstar.length >= 6, 'pochi buchi su ser/estar', String(serEstar.length))
  ok(tener.length >= 2, 'nessun buco su tener', String(tener.length))
  nota(`  ${serEstar.length} buchi su ser/estar · ${tener.length} su tener`)
}

/* ═══════════ 5. l'audio ═══════════ */
titolo('VOCE')
{
  const daAvere = [...new Set([...PAROLE_ES.map(w => w[0]), ...VERBI_ES.map(v => v[0])])]
  const senza = daAvere.filter(p => !INDICE[p])
  ok(!senza.length, 'parole senza clip (rilancia `npm run voci -- --lingua es`)',
     senza.slice(0, 8).join(', ') + (senza.length > 8 ? ` e altre ${senza.length - 8}` : ''))

  const perSprite = {}
  for (const [parola, [sp, inizio, durata]] of Object.entries(INDICE)) {
    ok(durata > 0.1 && durata < 4, 'durata sospetta', parola + ' = ' + durata + ' s')
    ;(perSprite[sp] = perSprite[sp] || []).push({ parola, inizio, fine: inizio + durata })
  }
  let sovrapposte = 0
  for (const fette of Object.values(perSprite)) {
    fette.sort((a, b) => a.inizio - b.inizio)
    for (let i = 1; i < fette.length; i++)
      if (fette[i].inizio < fette[i - 1].fine - 0.01) sovrapposte++
  }
  ok(!sovrapposte, 'clip che si sovrappongono dentro lo stesso sprite', String(sovrapposte))
  nota(`  ${Object.keys(INDICE).length} clip in ${Object.keys(perSprite).length} sprite`)
}

/* ═══════════ 6. la campagna ═══════════ */
titolo('CAMPAGNA')
{
  let precedenti = 0
  for (const t of CAMPAGNA) {
    ok(t.nuove.length > 0, 'tappa senza roba nuova', t.nome)
    ok(t.chiavi.length > precedenti, 'tappa che non aggiunge niente', t.nome)
    precedenti = t.chiavi.length
    ok(t.chiavi.every(k => voceDi(k)), 'chiave che non esiste nel lessico', t.nome)
    ok(t.tipi.length > 0, 'tappa senza tipi di domanda', t.nome)
    ok(t.mirate <= t.nuove.length, 'chiede più risposte mirate di quante ce ne siano', t.nome)
    ok(t.tipi.every(x => NOMI_TIPI.includes(x) && TIPI[x]), 'tipo sconosciuto', t.nome)
    ok(!!t.dritta, 'tappa senza dritta da leggere', t.nome)
  }
  const tutte = CAMPAGNA[CAMPAGNA.length - 1].chiavi
  ok(new Set(tutte).size === tutte.length, 'chiavi doppie nella campagna')
  ok(tutte.length === TUTTE.length, 'la campagna non copre tutto il lessico',
     `${tutte.length} di ${TUTTE.length}`)
  ok(LIBERO.tipi.length === NOMI_TIPI.length, 'il gioco libero non apre tutti i tipi')
  nota(`  ${CAMPAGNA.length} tappe · ${tutte.length} elementi in tutto`)
}

/* ═══════════ 7. le domande ═══════════ */
titolo('DOMANDE')
{
  const haVoce = p => !!INDICE[p]
  let costruite = 0
  const perTipo = {}
  for (const v of TUTTE) {
    for (const [nome, def] of Object.entries(TIPI)) {
      if (!def.puoUsare(v, haVoce)) continue
      const q = componi(v, nome, 'spagnolo')
      costruite++
      perTipo[nome] = (perTipo[nome] || 0) + 1
      const giuste = q.opzioni.filter(o => o.giusta)
      if (!ok(giuste.length === 1, 'la domanda non ha una sola risposta giusta',
              `${nome} su ${v.chiave}`)) break
      const testi = q.opzioni.map(o => o.testo)
      if (!ok(new Set(testi).size === testi.length, 'opzioni ripetute',
              `${nome} su ${v.chiave}: ${JSON.stringify(testi)}`)) break
      if (!ok(q.opzioni.length === def.quante, 'numero di opzioni sbagliato',
              `${nome} su ${v.chiave}: ${q.opzioni.length} invece di ${def.quante}`)) break
      if (!ok(testi.every(t => t !== undefined && t !== ''), 'opzione vuota',
              `${nome} su ${v.chiave}`)) break
      const d = q.domanda
      if (!ok(d.testo || d.ascolta, 'domanda senza bersaglio', `${nome} su ${v.chiave}`)) break
    }
  }
  console.log('  ' + costruite + ' domande costruite: ' +
    Object.entries(perTipo).map(([k, n]) => k + ' ' + n).join(' · '))
  for (const nome of Object.keys(TIPI))
    ok(perTipo[nome] > 0, 'tipo che nessuna voce può usare', nome)

  /* l'etichetta dice la lingua giusta: è l'unico punto in cui il motore
     delle domande sa che sta insegnando lo spagnolo */
  const q = componi(voceDi('es:perro'), 'tradStra', 'spagnolo')
  ok(/spagnolo/.test(q.etichetta), 'l’etichetta non nomina lo spagnolo', q.etichetta)
}

/* ═══════════ 8. la difficoltà segue la forza ═══════════ */
titolo('DIFFICOLTÀ')
{
  const haVoce = () => true
  const perro = voceDi('es:perro')
  const aperti = LIBERO.tipi
  const tipiA = forza => {
    const usciti = new Set()
    for (let i = 0; i < 600; i++) usciti.add(scegliTipo(perro, { aperti, forza, haVoce }))
    return usciti
  }
  const nuova = tipiA(0), conosciuta = tipiA(2), saputa = tipiA(5)
  ok(![...nuova].some(t => t.startsWith('ascolto')),
     'una parola nuova viene già chiesta a orecchio', [...nuova].join(','))
  ok(conosciuta.has('ascoltoFigura'),
     'una parola conosciuta non si sente mai senza testo', [...conosciuta].join(','))
  ok(saputa.has('ascoltoIt') && saputa.has('tradStra'),
     'a parola saputa mancano ascolto puro o produzione', [...saputa].join(','))
  ok(livelloDaForza(0) === 0 && livelloDaForza(3) === 1 && livelloDaForza(SRS.masterS) === 2,
     'la scala forza → livello non è quella attesa')
  nota('  nuova → ' + [...nuova].join(', ') + '  ·  saputa → ' + [...saputa].join(', '))

  // una voce senza emoji non può che usare i tipi testuali, anche da nuova
  const yo = voceDi('es:yo')
  const t = scegliTipo(yo, { aperti, forza: 0, haVoce })
  ok(t && TIPI[t].puoUsare(yo, haVoce), 'una parola senza emoji resta senza domanda', String(t))
}

/* ═══════════ 9. una tappa si supera davvero? ═══════════ */
titolo('TAPPE SUPERABILI')
{
  const items = {}
  const item = k => (items[k] = items[k] || newItem())

  for (const T of CAMPAGNA) {
    const nuove = new Set(T.nuove)
    const vecchie = T.chiavi.filter(k => !nuove.has(k))
    const picker = createPicker({ getItem: item, pausaDopo: 3 })
    const ordine = k => k.length
    let giuste = 0, mirate = 0, turni = 0

    while (giuste < T.bersaglio || mirate < T.mirate) {
      if (++turni > 4000) break
      const now = Date.now()
      const attiveNuove = activeSet(T.nuove, item, ordine, now, SRS.setSize)
      const attiveVecchie = vecchie.length
        ? activeSet(vecchie, item, ordine, now, 4) : { learning: [], due: [] }
      const pool = [...new Set([...attiveNuove.learning, ...attiveNuove.due.slice(0, 3),
                                ...attiveVecchie.learning])]
      if (!pool.length) break
      const k = picker.pick(pool, now)
      record(item(k), { correct: true, now })
      picker.afterAnswer(k, true)
      giuste++
      if (nuove.has(k)) mirate++
    }
    ok(giuste >= T.bersaglio && mirate >= T.mirate,
       'tappa non superabile: ' + T.nome, `${giuste}/${T.bersaglio} giuste, ${mirate}/${T.mirate} mirate`)
    ok(turni <= T.bersaglio * 2.2, 'tappa troppo lunga: ' + T.nome,
       `${turni} turni per un bersaglio di ${T.bersaglio}`)
  }
  nota('  tutte le ' + CAMPAGNA.length + ' tappe si superano rispondendo giusto')
}

/* ═══════════ 10. progressi e traguardi ═══════════ */
titolo('PROGRESSI')
{
  const { MATERIE, allineaSpagnolo, misure, XP_AREA } = await import('../../src/store/progressi.js')
  const { TRAGUARDI, AREE } = await import('../../src/data/traguardi.js')
  const now = Date.now()

  ok(MATERIE.some(m => m.prefisso === 'es:'), 'lo spagnolo non è fra le materie')
  ok(AREE.some(a => a.id === 'spagnolo'), 'manca l’area dei traguardi spagnoli')
  ok(!!XP_AREA.spagnolo, 'lo spagnolo non dà esperienza')

  const suoi = TRAGUARDI.filter(t => t.area === 'spagnolo')
  ok(suoi.length >= 5, 'pochi traguardi spagnoli', String(suoi.length))
  const idi = new Set(TRAGUARDI.map(t => t.id))
  ok(idi.size === TRAGUARDI.length, 'due traguardi con lo stesso id')

  /* i contatori dello spagnolo sono suoi: rispondere in inglese non deve
     far salire il livello di spagnolo, e viceversa */
  const soloEn = { items: {}, totals: { en: 100, verbi: 50, frasi: 20 }, eng: { tappa: 3 } }
  ok(XP_AREA.spagnolo(misure(soloEn, now)) === 0,
     'giocare in inglese dà esperienza di spagnolo')
  const soloEs = { items: {}, totals: { es: 100 }, esp: { tappa: 2 } }
  ok(XP_AREA.inglese(misure(soloEs, now)) === 0,
     'giocare in spagnolo dà esperienza di inglese')

  const imparato = () => ({ s: 6, ok: 9, err: 0, last: now, seen: 9, t: 0 })
  const vuoto = { items: {}, esp: { tappa: 0, libera: false } }
  allineaSpagnolo(vuoto, now)
  ok(vuoto.esp.tappa === 0, 'un profilo vuoto non parte dalla prima tappa')

  const esperto = { items: {}, esp: { tappa: 0, libera: false } }
  for (const k of CAMPAGNA[0].nuove) esperto.items[k] = imparato()
  allineaSpagnolo(esperto, now)
  ok(esperto.esp.tappa === 1, 'la tappa già saputa non si apre', 'tappa=' + esperto.esp.tappa)

  const avanti = { items: {}, esp: { tappa: 5, libera: false } }
  allineaSpagnolo(avanti, now)
  ok(avanti.esp.tappa === 5, 'l’allineamento fa retrocedere chi era più avanti')
  nota(`  ${suoi.length} traguardi spagnoli · esperienza e campagna separate dall’inglese`)
}

riassunto('Español: lessico, frasi, campagna, domande')
