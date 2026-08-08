/* ═══════════════════════════════════════════════════════════════════
   ENGLISH — verifica dei dati e del motore delle domande, senza browser.
   `node test/esegui.mjs inglese`

   Le cose che possono rompersi in silenzio sono quasi tutte nei dati:
   un'emoji ripetuta fa una domanda con due risposte giuste, una parola
   senza clip toglie l'ascolto, una tappa senza abbastanza roba nuova
   diventa impossibile da superare. Qui si controllano quelle.
   ═══════════════════════════════════════════════════════════════════ */
import { WORDS, CATS } from '../../src/data/words.js'
import { VERBI } from '../../src/data/verbi.js'
import { FRASI } from '../../src/data/frasi.js'
import { CAMPAGNA, LIBERO, TIPI as NOMI_TIPI } from '../../src/data/campagna-inglese.js'
import { voceDi, tutteDi } from '../../src/data/lessico.js'

/* solo le voci inglesi: il lessico ne tiene dentro due lingue */
const TUTTE = tutteDi('en')
import { TIPI, scegliTipo, componi, livelloDaForza } from '../../src/data/domande.js'
import { INDICE } from '../../src/data/voci.js'
import { newItem, record, strength, activeSet, createPicker, SRS } from '../../src/store/srs.js'
import { controlla, nota, riassunto } from '../aiuto/verifica.mjs'

/* `ok(condizione, cosa)` invece di `controlla(cosa, condizione)`: l'ordine
   qui dentro è quello, e girarlo in trecento righe è un invito a sbagliare */
const ok = (cond, cosa, dettaglio = '') => controlla(cosa, cond, dettaglio)
const titolo = t => console.log('\n' + t)

/* ═══════════ 1. il lessico ═══════════ */
titolo('LESSICO')
{
  const emoji = new Map(), parole = new Map()
  for (const [en, it, em, cat] of WORDS) {
    if (em) emoji.set(em, [...(emoji.get(em) || []), en])
    parole.set(en, [...(parole.get(en) || []), cat])
    if (!CATS[cat]) ok(false, 'categoria sconosciuta', cat + ' su ' + en)
    if (!it) ok(false, 'italiano mancante', en)
  }
  const emDoppie = [...emoji].filter(([, v]) => v.length > 1)
  const paDoppie = [...parole].filter(([, v]) => v.length > 1)
  ok(!emDoppie.length, 'emoji ripetute in words.js', JSON.stringify(emDoppie))
  ok(!paDoppie.length, 'parole ripetute in words.js', JSON.stringify(paDoppie))

  const emV = new Map()
  for (const [en, , em] of VERBI) if (em) emV.set(em, [...(emV.get(em) || []), en])
  ok(![...emV].some(([, v]) => v.length > 1), 'emoji ripetute in verbi.js',
     JSON.stringify([...emV].filter(([, v]) => v.length > 1)))

  console.log(`  ${WORDS.length} parole · ${VERBI.length} verbi · ${FRASI.length} frasi` +
              `  = ${TUTTE.length} voci`)
}

/* ═══════════ 2. distrattori: ce n'è abbastanza? ═══════════
   Un tipo con sei opzioni ha bisogno di sei voci diverse nella stessa
   categoria, altrimenti la domanda esce con meno risposte del previsto
   ed è più facile di quanto dovrebbe. */
titolo('DISTRATTORI')
{
  const perCat = {}
  for (const v of TUTTE) {
    const k = v.genere + ':' + v.cat
    perCat[k] = perCat[k] || { tot: 0, conEmoji: 0 }
    perCat[k].tot++
    if (v.emoji) perCat[k].conEmoji++
  }
  /* una categoria o ha abbastanza emoji per reggere una domanda figurata,
     o non ne ha nessuna ed è testuale: una sola emoji in mezzo a
     quaranta parole nude darebbe una domanda con una risposta sola */
  const magre = Object.entries(perCat).filter(([, v]) => v.conEmoji > 0 && v.conEmoji < 6)
  ok(!magre.length, 'categorie con qualche emoji ma meno di sei',
     JSON.stringify(magre.map(([k, v]) => k + '=' + v.conEmoji)))
  /* le categorie piccole vanno bene: `compagne()` allarga da sola a tutto
     il genere. Quello che non deve succedere è restare senza distrattori,
     e lo verifica la sezione DOMANDE costruendole tutte davvero. */
  const povere = Object.entries(perCat).filter(([, v]) => v.tot < 3)
  ok(!povere.length, 'categorie con meno di tre voci', JSON.stringify(povere.map(([k]) => k)))
}

/* ═══════════ 3. le frasi ═══════════ */
titolo('FRASI')
{
  const idi = new Set()
  for (const f of FRASI) {
    ok(!idi.has(f.id), 'id di frase ripetuto', f.id); idi.add(f.id)
    ok(f.falsi && f.falsi.length >= 2, 'meno di due falsi', f.id)
    ok(!/[?!.]\s*$/.test(f.en), 'la frase inglese ha punteggiatura finale', f.id + ': ' + f.en)
    ok(!(f.falsi || []).includes(f.en), 'un falso è uguale alla frase giusta', f.id)
    ok(!(f.falsi || []).some(x => /[?!.]\s*$/.test(x)), 'un falso inglese ha punteggiatura', f.id)
    ok(!(f.falsiIt || []).includes(f.it), 'un falso italiano è uguale al giusto', f.id)
    if (f.buco) {
      ok(f.buco.testo.includes('___'), 'il buco non ha il vuoto', f.id)
      ok(f.buco.falsi && f.buco.falsi.length >= 3, 'il buco ha meno di tre falsi', f.id)
      ok(!f.buco.falsi.includes(f.buco.giusta), 'il buco ha il giusto anche fra i falsi', f.id)
    }
  }
  const coppie = FRASI.filter(f => (f.falsiIt || []).some(x => x.replace('?', '') === f.it.replace('?', '')))
  console.log(`  ${FRASI.length} frasi · ${FRASI.filter(f => f.buco).length} con il buco · ` +
              `${coppie.length} coppie domanda/affermazione`)
  ok(coppie.length >= 5, 'poche coppie che si distinguono solo per il punto di domanda',
     String(coppie.length))
}

/* ═══════════ 4. l'audio ═══════════ */
titolo('VOCE')
{
  const daAvere = [...new Set([...WORDS.map(w => w[0]), ...VERBI.map(v => v[0])])]
  const senza = daAvere.filter(p => !INDICE[p])
  ok(!senza.length, 'parole senza clip (rilancia `npm run voci`)',
     senza.slice(0, 8).join(', ') + (senza.length > 8 ? ` e altre ${senza.length - 8}` : ''))

  // dentro uno sprite le parole non si devono sovrapporre
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

/* ═══════════ 5. la campagna ═══════════ */
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
  }
  const tutte = CAMPAGNA[CAMPAGNA.length - 1].chiavi
  ok(new Set(tutte).size === tutte.length, 'chiavi doppie nella campagna')
  ok(tutte.length === TUTTE.length, 'la campagna non copre tutto il lessico',
     `${tutte.length} di ${TUTTE.length}`)
  ok(LIBERO.tipi.length === NOMI_TIPI.length, 'il gioco libero non apre tutti i tipi')
  nota(`  ${CAMPAGNA.length} tappe · ${tutte.length} elementi in tutto`)
}

/* ═══════════ 6. le domande ═══════════
   Per ogni voce e ogni tipo che la può usare, la domanda costruita deve
   avere una sola risposta giusta e nessuna opzione ripetuta: due opzioni
   identiche vorrebbero dire due risposte giuste. */
titolo('DOMANDE')
{
  const haVoce = p => !!INDICE[p]
  let costruite = 0
  const perTipo = {}
  for (const v of TUTTE) {
    for (const [nome, def] of Object.entries(TIPI)) {
      if (!def.puoUsare(v, haVoce)) continue
      const q = componi(v, nome)
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
}

/* ═══════════ 7. la difficoltà segue la forza ═══════════ */
titolo('DIFFICOLTÀ')
{
  const haVoce = () => true
  const cane = voceDi('en:dog')
  const aperti = LIBERO.tipi
  const prova = forza => {
    const conteggio = {}
    for (let i = 0; i < 400; i++) {
      const t = scegliTipo(cane, { aperti, forza, haVoce })
      conteggio[TIPI[t].livello] = (conteggio[TIPI[t].livello] || 0) + 1
    }
    return conteggio
  }
  const debole = prova(0), medio = prova(2), forte = prova(5)
  ok(!debole[1] && !debole[2], 'a forza 0 escono domande troppo difficili', JSON.stringify(debole))
  ok(!medio[2], 'a forza 2 escono già le domande di produzione', JSON.stringify(medio))
  ok(forte[2] > 0, 'a forza 5 non esce mai la produzione', JSON.stringify(forte))
  ok(livelloDaForza(0) === 0 && livelloDaForza(3) === 1 && livelloDaForza(SRS.masterS) === 2,
     'la scala forza → livello non è quella attesa')
  nota('  forza 0 → ' + JSON.stringify(debole) + '  forza 5 → ' + JSON.stringify(forte))

  /* IL TESTO SI TOGLIE QUANDO LA PAROLA È SAPUTA.
     È la regola più facile da rompere senza accorgersene — basta abbassare
     il livello di un tipo di ascolto — e sarebbe un peccato: una parola
     chiesta a orecchio quando ancora non la si sa leggere è solo una
     domanda a caso, e chiesta per sempre col testo davanti non allena
     l'ascolto mai. */
  const tipiA = forza => {
    const usciti = new Set()
    for (let i = 0; i < 600; i++) usciti.add(scegliTipo(cane, { aperti, forza, haVoce }))
    return usciti
  }
  const nuova = tipiA(0), conosciuta = tipiA(2), saputa = tipiA(5)
  ok(![...nuova].some(t => t.startsWith('ascolto')),
     'una parola nuova viene già chiesta a orecchio', [...nuova].join(','))
  ok(conosciuta.has('ascoltoFigura'),
     'una parola conosciuta non si sente mai senza testo', [...conosciuta].join(','))
  ok(saputa.has('ascoltoIt') && saputa.has('tradStra'),
     'a parola saputa mancano ascolto puro o produzione', [...saputa].join(','))
  ok(!conosciuta.has('ascoltoIt'),
     'l’ascolto senza figura arriva troppo presto', [...conosciuta].join(','))
  nota('  il testo si toglie strada facendo: nuova → ' + [...nuova].join(', ') +
       '  ·  saputa → ' + [...saputa].join(', '))

  // una voce senza emoji non può che usare i tipi testuali, anche da nuova
  const io = voceDi('en:I')
  const t = scegliTipo(io, { aperti, forza: 0, haVoce })
  ok(t && TIPI[t].puoUsare(io, haVoce), 'una parola senza emoji resta senza domanda', String(t))
}

/* ═══════════ 8. una tappa si supera davvero? ═══════════
   Si simula un bambino che risponde sempre giusto e si conta quanti
   turni servono per centrare bersaglio E mirate. Se il pool non
   proponesse abbastanza roba nuova, la tappa resterebbe lì per sempre. */
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

/* ═══════════ 9. l'allineamento di chi giocava prima ═══════════ */
titolo('CHI GIOCAVA PRIMA')
{
  const { allineaInglese } = await import('../../src/store/progressi.js')
  const now = Date.now()
  const imparato = () => ({ s: 6, ok: 9, err: 0, last: now, seen: 9, t: 0 })

  const vuoto = { items: {}, eng: { tappa: 0, libera: false } }
  allineaInglese(vuoto, now)
  ok(vuoto.eng.tappa === 0, 'un profilo vuoto non parte dalla prima tappa')

  // chi sa tutti gli animali e quasi tutto il cibo deve trovarsi la terza aperta
  const esperto = { items: {}, eng: { tappa: 0, libera: false } }
  for (const k of CAMPAGNA[0].nuove) esperto.items[k] = imparato()
  for (const k of CAMPAGNA[1].nuove.slice(0, Math.ceil(CAMPAGNA[1].nuove.length * 0.7)))
    esperto.items[k] = imparato()
  allineaInglese(esperto, now)
  ok(esperto.eng.tappa === 2, 'le tappe già meritate non si aprono', 'tappa=' + esperto.eng.tappa)

  // e non si torna mai indietro
  const avanti = { items: {}, eng: { tappa: 7, libera: false } }
  allineaInglese(avanti, now)
  ok(avanti.eng.tappa === 7, 'l’allineamento fa retrocedere chi era più avanti')
  nota('  la campagna si apre da sola su quello che si sa già')
}

riassunto('English: lessico, frasi, campagna, domande')
