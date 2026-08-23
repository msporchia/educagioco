/* L'abisso: la discesa che non finisce.

   Quello che qui si guarda **non si noterebbe giocando**, ed è il motivo
   per cui questo file esiste:

   - che l'abisso non finisca mai *davvero* — un piano che non si genera
     o una scala che si chiude da sola al piano 40 nessuno la incontra
     prima di una settimana di discese, e chi la incontra la vede come un
     gioco che si spegne;
   - che i numeri di laggiù restino numeri: un mostro con `ossa: NaN` non
     dà nessun errore, dà una battaglia che non finisce;
   - che **l'avanzamento della campagna non si sposti**. `tappa` è un
     indice dentro il profilo: un settimo posto in fila lo farebbe
     scivolare per tutti, in silenzio, e la prova che non succede è che
     l'abisso non sta nella campagna affatto;
   - che il salvataggio di ieri si legga ancora (`VERSIONE` ferma a 3).

   E poi le misure, che sono il resto del lavoro: quanto costa un piano
   in domande, e fin dove si arriva col bottino di oggi.
   `node test/esegui.mjs abisso --niente-build`
   tempo: 300 */
import { CAMPAGNA, QUANTE_TAPPE, L_ABISSO, INDICE_ABISSO, tappaDi, formaDi,
         durezzaDi, guardianoDi, svenimentiDi, crescitaDi, PIANO_DEL_TETTO,
         SVENIMENTI_PER_PIANO, guastiDellAbisso } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { TASCHE } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { MOSTRI } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { EROI } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { gioca, costoDeiPiani, finoADove } from '../../src/giochi/sotterraneo/motore/banco.js'
import { scrivi, leggi, dice, VERSIONE } from '../../src/giochi/sotterraneo/motore/sosta.js'
import { TAPPE_DEL_GIOCO } from '../../src/data/portata-giochi.js'
import manifesto from '../../src/giochi/sotterraneo/gioco.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const guasti = guastiDellAbisso()
controlla('l\'abisso non ha guasti', guasti.length === 0, guasti.join(' · '))

/* ══════════ 1. la campagna non si muove ══════════
   È la cosa che questo lavoro poteva rompere senza che nessuno se ne
   accorgesse: `profile.campagne['sotterraneo'].tappa` è **un indice**, e
   una fila che cresce sposta l'avanzamento di tutti. L'abisso non entra
   in fila: ha un indice suo, fuori dalla scala. */
{
  uguale('le discese restano sei', CAMPAGNA.length, 6)
  uguale('e il manifesto ne dichiara sei', manifesto.tappe, QUANTE_TAPPE)
  controlla('l\'abisso non è una delle sei', !CAMPAGNA.includes(L_ABISSO))
  controlla('e non ha nessuna chiave in comune con loro',
            !CAMPAGNA.some(t => t.chiave === L_ABISSO.chiave))
  uguale('la fila che decide la portata è quella di sempre',
         TAPPE_DEL_GIOCO.sotterraneo.length, CAMPAGNA.length)
  controlla('e l\'abisso non ci sta dentro',
            !TAPPE_DEL_GIOCO.sotterraneo.includes(L_ABISSO))
  /* niente `portata`: il suo cancello non è l'età ma «hai finito le sei
     discese», che è un criterio dimostrato invece che stimato */
  uguale('l\'abisso non dichiara una portata', L_ABISSO.portata, undefined)
  controlla('il suo indice sta fuori dalla campagna', INDICE_ABISSO < 0)
  uguale('e `tappaDi` sa arrivarci', tappaDi(INDICE_ABISSO), L_ABISSO)
  uguale('mentre gli indici della campagna restano quelli', tappaDi(3), CAMPAGNA[3])
}

/* ══════════ 2. la difficoltà arriva a 1 e ci resta ══════════
   È il punto in cui il gioco cambia natura: da lì in giù l'abisso non
   diventa più difficile *da studiare*, solo da sopravvivere. Oltre 1
   non si cerca niente, perché la finestra è quella dell'**età del
   bambino** e non della tappa: un bambino di nove anni al piano 40 non
   deve trovarsi domande da quattordicenne. */
{
  const scala = []
  for (let p = 0; p <= PIANO_DEL_TETTO; p++) scala.push(durezzaDi(L_ABISSO, p).toFixed(2))
  uguale(`al piano ${PIANO_DEL_TETTO + 1} si tocca il tetto`,
         durezzaDi(L_ABISSO, PIANO_DEL_TETTO), 1)
  controlla('e non un piano prima', durezzaDi(L_ABISSO, PIANO_DEL_TETTO - 1) < 1,
            String(durezzaDi(L_ABISSO, PIANO_DEL_TETTO - 1)))
  let oltre = 0
  for (let p = 0; p <= 500; p++) if (durezzaDi(L_ABISSO, p) > 1) oltre++
  uguale('e da lì al piano 500 non lo supera mai', oltre, 0)
  nota(`la difficoltà scendendo: ${scala.join(' · ')} e poi costante`)

  /* e nemmeno passando per la corsa, che ci somma il rincaro di ogni
     cosa: un forziere chiede 0.25 in più, e 1.25 non è una difficoltà */
  const c = new Corsa(L_ABISSO, { seme: 5, rnd: seminato(5) })
  c.piano = 30
  uguale('il rincaro del forziere non sfonda il tetto', c.durezza(0.25), 1)
  controlla('e lo sconto della porta lo lascia sotto', c.durezza(-0.05) < 1)
}

/* ══════════ 3. non finisce mai, e i piani ci sono ══════════
   Le tre righe che sapevano dove finisce una discesa confrontavano con
   `quantiPiani`. Qui non c'è nessun numero con cui confrontarsi, e la
   prova è che a quaranta piani di profondità la scala scende ancora e il
   piano si genera sano. */
{
  let storti = [], piani = 0
  const forme = new Set()
  for (const seme of [7, 41, 99]) {
    const c = new Corsa(L_ABISSO, { seme, rnd: seminato(seme) })
    for (let p = 0; p < 40; p++) {
      c.piano = p
      c.nuovoPiano()
      piani++
      forme.add(`${c.livello.largo}×${c.livello.giri}`)
      const g = c.livello.guasti()
      if (g.length) storti.push(`seme ${seme} piano ${p + 1}: ${g.join(', ')}`)
      /* la mappa vista si dimensiona sul piano generato e non sulla
         tappa: da quando la forma cambia scendendo, le due potevano
         divergere — e mezza mappa al buio non dà nessun errore */
      if (c.visto.length !== c.livello.largo * c.livello.alto)
        storti.push(`seme ${seme} piano ${p + 1}: la mappa vista è lunga ${c.visto.length}`)
    }
  }
  controlla('quaranta piani di abisso, tutti sani', storti.length === 0,
            storti.slice(0, 3).join(' · '))
  controlla('e le forme girano invece di crescere', forme.size === L_ABISSO.forme.length,
            [...forme].join(' '))
  nota(`${piani} piani d'abisso generati, forme ${[...forme].join(' · ')}`)

  /* la scala non si chiude mai da sé: nella campagna l'ultimo piano fa
     «esco dal sotterraneo», qui quel momento non arriva */
  const c = new Corsa(L_ABISSO, { seme: 3, rnd: seminato(3) })
  let ultimo = false
  for (const p of [0, 1, 5, 20, 100, 1000]) {
    c.piano = p
    c.chiaveDelPiano = true
    c.foglio = null
    c.allaScala()
    if (c.foglio.ultimo) ultimo = true
  }
  uguale('nessun piano è mai «l\'ultimo»', ultimo, false)
  controlla('e la corsa lo dice per nome', c.senzaFondo)
  controlla('mentre una tappa della campagna no', !new Corsa(CAMPAGNA[0],
            { seme: 1, rnd: seminato(1) }).senzaFondo)
}

/* ══════════ 4. i numeri di laggiù restano numeri ══════════
   Un mostro con `ossa: NaN` o `att: Infinity` non dà nessun errore: dà
   una battaglia che non finisce, al piano trenta, a chi ci è arrivato in
   una settimana. */
{
  const storti = []
  let primo = null, ultimo = null
  for (const p of [0, 5, 10, 20, 30, 60]) {
    const c = new Corsa(L_ABISSO, { seme: 21, rnd: seminato(21) })
    c.piano = p
    c.nuovoPiano()
    for (const m of c.livello.robe.filter(r => r.che === 'mostro')) {
      if (!Number.isFinite(m.ossa) || m.ossa < 1) storti.push(`piano ${p + 1}: ossa ${m.ossa}`)
      if (!Number.isFinite(m.att) || m.att < 1) storti.push(`piano ${p + 1}: attacco ${m.att}`)
      if (m.dif !== MOSTRI[m.tipo].dif) storti.push(`piano ${p + 1}: la difesa è cresciuta`)
      if (m.ossa !== m.ossaMax) storti.push(`piano ${p + 1}: nasce già ferito`)
    }
    const capo = c.livello.robe.find(r => r.che === 'mostro' && r.chiave)
    if (p === 0) primo = capo
    ultimo = capo
  }
  controlla('nessun mostro con numeri assurdi, dal piano 1 al 60',
            storti.length === 0, storti.slice(0, 3).join(' · '))
  controlla('ma sono cresciuti davvero', ultimo.ossa > primo.ossa * 5,
            `${primo.ossa} → ${ultimo.ossa}`)
  /* ── la difesa è la manopola velenosa, e resta ferma per sempre ──
     Entra in una sottrazione: un punto in più lì dentro allunga la
     battaglia invece di indurirla. */
  uguale('e la difesa non è cresciuta di un punto', ultimo.dif, MOSTRI[ultimo.tipo].dif)

  /* l'attacco cresce **più piano delle ossa**, ed è la riga che tiene in
     piedi tutto l'abisso: senza tetto, `danno = att − dif` supera la
     difesa che un eroe può mettere insieme, e il graffio che passa
     rispondendo *bene* fa il resto */
  uguale('nell\'abisso l\'attacco cresce ogni tre piani', crescitaDi(L_ABISSO).attOgni, 3)
  uguale('mentre nella campagna resta com\'era', crescitaDi(CAMPAGNA[5]).attOgni, 2)
  nota(`l'orco picchia ${MOSTRI.orco.att}; al piano 20 ne picchia ` +
       `${MOSTRI.orco.att + Math.floor(20 / 3)} invece di ${MOSTRI.orco.att + 10}, ` +
       `che è il difetto misurato: contro una difesa che arriva sì e no a 9, ` +
       'la metà passava anche rispondendo bene')
}

/* ══════════ 5. le occasioni, e cosa costa svenire ══════════
   `svenimentiDi(tappa) = 4 + tappa.piani` non ha senso dove i piani non
   sono un numero: tre per piano, e riparte scendendo. */
{
  uguale('l\'abisso concede tre occasioni per piano',
         svenimentiDi(L_ABISSO), SVENIMENTI_PER_PIANO)
  controlla('mentre la campagna le conta su tutta la discesa',
            svenimentiDi(CAMPAGNA[5]) > SVENIMENTI_PER_PIANO)

  const c = new Corsa(L_ABISSO, { seme: 11, rnd: seminato(11) })
  c.chiaveDelPiano = true
  for (let i = 1; i < SVENIMENTI_PER_PIANO; i++) {
    c.vita = 0
    c.svieni()
    uguale(`svenimento ${i}: si torna all'ingresso`, c.foglio.ultimo, false)
    uguale('e il cartello dice quante ne restano', c.foglio.restano, SVENIMENTI_PER_PIANO - i)
    c.riprendi()
    controlla('la discesa continua', !c.finita)
  }
  /* scendere rinnova le occasioni: è la cosa che si è guadagnata */
  c.foglio = { che: 'scala', ultimo: false }
  c.scendi()
  uguale('sceso un piano, il conto riparte', c.svenimentiQui, 0)
  uguale('ma il totale della discesa resta', c.svenimenti, SVENIMENTI_PER_PIANO - 1)
  c.vita = 0
  c.svieni()
  uguale('quindi al piano nuovo si ricomincia da tre',
         c.foglio.restano, SVENIMENTI_PER_PIANO - 1)

  /* ── e la terza volta si risale, non si ricomincia ── */
  const b = new Corsa(L_ABISSO, { seme: 12, rnd: seminato(12) })
  b.piano = 7
  b.nuovoPiano()
  for (let i = 0; i < SVENIMENTI_PER_PIANO; i++) { b.vita = 0; b.svieni(); if (i < 2) b.riprendi() }
  uguale('all\'ultima occasione il cartello lo dice', b.foglio.ultimo, true)
  b.riprendi()
  controlla('la sera finisce', b.finita)
  uguale('e si sa perché', b.esito.perche, 'svenuto')
  uguale('ma il piano resta quello: da lì si rientra', b.piano, 7)
  uguale('e l\'esito dice il più giù dove si è arrivati', b.esito.fondo, 8)
  uguale('senza inventare un «su quanti»', b.esito.quantiPiani, null)
}

/* ══════════ 6. svenendo si perde lo zaino, non il corredo ══════════
   Punisce senza umiliare: se ne va il margine accumulato, non il lavoro
   di dieci piani — che in una discesa senza fine sarebbe una brutta sera
   che cancella una settimana. E l'ascia bella non si butta *mai*, che è
   la richiesta da cui nasce tutto l'abisso. */
{
  const c = new Corsa(L_ABISSO, { seme: 31, rnd: seminato(31), eroe: 'cavaliere' })
  c.mano = 'spadone'
  c.corpo = 'corazza'
  c.dito = 'amuleto-rosso'
  c.zaino = ['pozione', 'pozione-grande', 'chiave']
  c.torcia = true
  c.gemme = 40
  const tetto = c.vitaMax
  c.vita = 0
  c.svieni()
  c.riprendi()
  uguale('l\'arma resta in pugno', c.mano, 'spadone')
  uguale('l\'armatura resta addosso', c.corpo, 'corazza')
  uguale('e il gioiello al dito', c.dito, 'amuleto-rosso')
  uguale('le sei tasche si svuotano', c.zaino.length, 0)
  uguale('le gemme si dimezzano, non si azzerano', c.gemme, 20)
  /* la torcia non è nello zaino: è un interruttore sulla corsa. Chi
     sviene non si ritrova al buio, che sarebbe il modo più rapido di
     trasformare uno svenimento in una serata finita */
  uguale('la torcia resta accesa', c.torcia, true)
  uguale('e il tetto della vita non scende', c.vitaMax, tetto)
  controlla('e la roba non resta per terra da recuperare',
            !c.livello.robe.some(r => r.che === 'cosa' && r.cosa === 'pozione' && !r.presa))
  controlla('la riga lo dice', c.avvisi.some(a => /tasche/.test(String(a.testo || a))),
            JSON.stringify(c.avvisi))

  /* nella campagna invece non cambia niente: quella regola è
     dell'abisso, e portarla nelle sei tappe sposterebbe un equilibrio
     già misurato */
  const t = new Corsa(CAMPAGNA[2], { seme: 31, rnd: seminato(31) })
  t.zaino = ['pozione', 'pozione']
  t.vita = 0
  t.svieni()
  t.riprendi()
  uguale('nella campagna le tasche restano piene', t.zaino.length, 2)
}

/* ══════════ 7. la sosta: si riprende, e la versione non sale ══════════
   Una discesa in corso il giorno del rilascio non si butta: `tappa`
   **non cambia significato**, guadagna un valore (−1), e chi ha lasciato
   a metà «Il labirinto» ieri sera lo riprende oggi. */
{
  uguale('la versione del salvataggio non è salita', VERSIONE, 3)

  const c = new Corsa(L_ABISSO, { seme: 77, rnd: seminato(77), eroe: 'nano' })
  c.piano = 22
  c.nuovoPiano()
  c.mano = 'ascia'
  c.gemme = 210
  c.vita = 34
  const dato = scrivi(c, INDICE_ABISSO)
  uguale('la sosta dell\'abisso porta il suo indice', dato.tappa, INDICE_ABISSO)
  uguale('e la versione di sempre', dato.v, VERSIONE)

  /* la riga che, dimenticandola, farebbe **sparire in silenzio** la
     carta «riprendi»: `campagna[-1]` è `undefined` */
  const riga = dice(dato, CAMPAGNA)
  controlla('la carta della ripresa c\'è', !!riga)
  uguale('e dice l\'abisso', riga.nome, L_ABISSO.nome)
  uguale('col piano dove si era', riga.piano, 23)
  uguale('e senza un «di quanti» che non esiste', riga.piani, null)

  const b = leggi(dato, tappaDi(dato.tappa), 'nano')
  controlla('e la discesa si rilegge', !!b)
  uguale('allo stesso piano', b.piano, 22)
  uguale('con l\'ascia ancora in pugno', b.mano, 'ascia')
  uguale('e le sue gemme', b.gemme, 210)
  uguale('sullo stesso piano, rifatto dal seme', b.livello.celle.join(), c.livello.celle.join())
  nota(`una sosta d'abisso al piano 23 pesa ${JSON.stringify(dato).length} byte`)

  /* una discesa finita non si salva — tranne l'abisso, che non finisce:
     quello che si scrive è il punto da cui si rientra */
  c.risali()
  uguale('una tappa finita non lascia soste', scrivi(c, 2), null)
  controlla('l\'abisso sì, se lo si chiede per nome',
            !!scrivi(c, INDICE_ABISSO, { anchePerFinite: true }))

  /* e il salvataggio di una tappa continua a leggersi come prima */
  const t = new Corsa(CAMPAGNA[4], { seme: 5, rnd: seminato(5) })
  const suo = scrivi(t, 4)
  uguale('la sosta di una tappa non è cambiata', suo.tappa, 4)
  uguale('e la sua carta dice ancora «di quanti»', dice(suo, CAMPAGNA).piani, CAMPAGNA[4].piani)
}

/* ══════════ 8. il record, e la riga in home ══════════ */
{
  const av = { tappa: 6, libera: true, stelle: { 0: 3 }, cfg: {} }
  controlla('finita la campagna ma senza record, la riga è quella di sempre',
            manifesto.riassunto(av).startsWith('discesa'), manifesto.riassunto(av))
  av.cfg.abisso = { fondo: 23 }
  controlla('col record, la riga racconta l\'abisso',
            manifesto.riassunto(av).includes('piano più profondo 23'), manifesto.riassunto(av))
  const chiuso = manifesto.riassunto({ tappa: 2, libera: false, stelle: {}, cfg: {} })
  controlla('e chi la campagna non l\'ha finita non lo vede',
            !chiuso.includes('abisso'), chiuso)

  const t = manifesto.albo.traguardi.find(x => x.id === 'sot-abisso')
  controlla('c\'è il traguardo dell\'abisso', !!t)
  uguale('e legge il primato, non un totale',
         t.valore({ best: k => (k === 'sotFondo' ? 26 : 0), tot: () => 0 }), 26)
}

/* ══════════ 9. quanto costa un piano, e fin dove si arriva ══════════
   Le due misure del progetto. La prima è la regola che tiene in piedi
   l'abisso — **il costo di un mostro in domande è una costante, quello
   che cresce è il prezzo di restare indietro** — e si vede solo qui: se
   il numero cresce scendendo vuol dire che le ossa e il braccio non si
   muovono più insieme, e la discesa sta diventando lunga invece che
   difficile.

   La seconda dice dove finisce, oggi, quello che c'è: il bottino non ha
   ancora gradi, quindi l'eroe si ferma al gradino 3 e i mostri no. */
{
  const c = costoDeiPiani(L_ABISSO, { fino: 11, seme: 41 })
  const piani = c.minimo.filter(n => n > 0)
  controlla('si misurano almeno otto piani', piani.length >= 8, `${piani.length}`)
  /* La banda è larga apposta in basso: un piano dove il guardiano è uno
     scheletro a due stanze dall'ingresso costa sei risposte, ed è un
     piano fortunato e non un piano rotto — il generatore non promette
     dove mette la scala. Quello che conta è il tetto, e che la media non
     cresca (la riga qui sotto). */
  for (let i = 0; i < piani.length; i++)
    dentro(`il piano ${i + 1} costa fra 5 e 30 domande obbligate`, piani[i], 5, 30)
  /* e non cresce: la seconda metà della discesa non deve costare il
     doppio della prima, o scendere sarebbe un compito che si allunga */
  const meta = Math.floor(piani.length / 2)
  const sopra = piani.slice(0, meta).reduce((a, b) => a + b, 0) / meta
  const sotto = piani.slice(meta).reduce((a, b) => a + b, 0) / (piani.length - meta)
  controlla('e il costo di un piano non cresce scendendo', sotto < sopra * 1.6,
            `primi ${sopra.toFixed(1)} · ultimi ${sotto.toFixed(1)} domande a piano`)
  nota(`domande per piano (il minimo): ${piani.join(' · ')}`)

  /* la forbice: se «tutto» costasse quanto «il minimo», in mezzo non ci
     sarebbe più niente da scegliere — ed è la scelta il motivo per cui
     un posto è un posto */
  const t = c.tutto.filter(n => n > 0)
  const mediaT = t.reduce((a, b) => a + b, 0) / t.length
  const mediaM = piani.reduce((a, b) => a + b, 0) / piani.length
  controlla('chi ripulisce un piano paga molto di più', mediaT > mediaM * 1.8,
            `minimo ${mediaM.toFixed(1)}, tutto ${mediaT.toFixed(1)}`)

  /* ── fin dove si arriva col bottino di oggi ──
     Il numero che dice quando servirà il bottino graduato. Non è una
     soglia da difendere, è una misura da leggere: il patto è solo che
     l'abisso regga **almeno una serata**, cioè che non si muoia al
     secondo piano. */
  const righe = []
  for (const e of EROI) {
    const f = finoADove(L_ABISSO, { eroe: e.chiave, semi: [7, 41, 99, 203, 311, 457], tetto: 30 })
    controlla(`${e.chiave}: l'abisso regge almeno tre piani`, f.peggio >= 3,
              `si è fermato al piano ${f.peggio}`)
    righe.push(`  ${e.nome.padEnd(10)} si ferma ai piani ${f.fondi.sort((a, b) => a - b).join(' · ')} ` +
               `· medio ${f.medio.toFixed(1)}`)
  }
  nota('fin dove si arriva partendo nudi (bravura 0.8, sei semi):')
  for (const r of righe) nota(r)
}

riassunto('l\'abisso')
