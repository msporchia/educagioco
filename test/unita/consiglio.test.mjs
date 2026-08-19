/* ═══════════════════════════════════════════════════════════════════
   IL PROSSIMO PASSO — CHE NON SIA MAI UN VICOLO CIECO

   `motore/consiglio.js` è la regola che dice: un «non si può» non
   compare mai da solo, porta con sé cosa fare adesso. Qui si prova che
   la risposta c'è **in ogni stato in cui la fattoria può trovarsi**, e
   che non è una frase generica ma il passo giusto per quello stato.

   Il modo di rompere questo file senza accorgersene è aggiungere una
   coltura, una ricetta o una macchina e lasciare un buco nella catena:
   l'ultimo blocco gira tutte le tabelle e pretende una risposta per
   ognuna, così un prodotto nuovo senza strada si vede subito.

   Gira senza browser: il consiglio è logica di gioco e non sa niente
   di schermo.
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { Fattoria } from '../../src/giochi/fattoria/motore/fattoria.js'
import { comeAvere, comeFarePosto } from '../../src/giochi/fattoria/motore/consiglio.js'
import { COLTURE, PRODOTTI, PER_RICETTA, RICETTE, merciDi, ricetteDi }
  from '../../src/giochi/fattoria/dati/coltivazioni.js'
import { sogliaDi, guastiDegliSblocchi, livelloDelProdotto }
  from '../../src/giochi/fattoria/dati/livelli.js'
import { scambia, cosaOffre, cosaPuoiDare, carrettoIn, scompartiColmi, DAI, RICEVI }
  from '../../src/giochi/fattoria/motore/vicino.js'

const T0 = 1700000000000
const fra = min => T0 + min * 60000

/* Una fattoria a un livello scelto, con le monete che servono. Il
   livello si mette **spendendo per finta** (`speso`) e non comprando:
   qui si prova chi consiglia, non chi vende. */
function fattoria(liv = 30, monete = 9000) {
  let m = monete
  const borsa = { quante: () => m, paga: n => { m -= n; return true } }
  const f = new Fattoria({ borsa })
  f.speso = sogliaDi(liv)
  return { f, saldo: () => m }
}

/* Le piazzole di partenza vanno da 12 a 29: posare fuori di lì
   fallisce in silenzio, e il consiglio direbbe cose giuste su una
   fattoria vuota senza che niente sembri rotto. */
const posa = (f, id, x, y) => {
  const r = f.posa(id, x, y)
  if (!r.ok) throw new Error(`la prova non riesce a posare ${id}: ${r.motivo}`)
  return r.cosa
}

/* ══════════ 1. LA CATENA SI RISALE DA SOLA ══════════
   È la richiesta intera, in un blocco: manca il mangime, e la risposta
   non è mai «non hai abbastanza mangime». */
{
  const { f } = fattoria()
  posa(f, 'silo', 20, 14)
  posa(f, 'silo_bianco', 20, 17)

  const senzaNiente = comeAvere(f, 'mangime', T0)
  controlla('senza mulino, il consiglio manda a comprarlo',
            senzaNiente.azione && senzaNiente.azione.che === 'compra',
            senzaNiente.testo)
  uguale('ed è proprio il mulino', senzaNiente.azione.voce, 'mulino')

  posa(f, 'mulino', 14, 14)
  const senzaCampi = comeAvere(f, 'mangime', T0)
  controlla('col mulino ma senza campi, risale al grano e manda a farne uno',
            senzaCampi.azione && senzaCampi.azione.voce === 'orto', senzaCampi.testo)
  /* **Per nome, non con l'emoji.** Da quando ogni merce ha una figura
     vera, questi consigli compaiono sotto le caselle che la disegnano —
     e un'emoji che non le somiglia (🥬 per una balla di fieno) si legge
     come una seconda cosa. Il numero e il nome, invece, non possono
     contraddire nessun disegno. */
  controlla('e dice quanto grano manca, per nome',
            /\d+ grano/.test(senzaCampi.testo), senzaCampi.testo)

  const campo = posa(f, 'orto', 14, 20)
  const conCampo = comeAvere(f, 'mangime', T0)
  uguale('con un campo libero manda a seminarci', conCampo.azione.che, 'apri')
  uguale('e il campo è quello libero', conCampo.azione.cosa, campo)

  /* ── il caso che lasciava fermi ──
     I campi ci sono, quindi il gioco non diceva niente; ma sono tutti
     occupati da altro, quindi non si può fare niente lo stesso. */
  f.seminaCampo(campo, 'mais', T0)
  const occupati = comeAvere(f, 'mangime', T0)
  uguale('coi campi tutti occupati propone di farne un altro',
         occupati.azione.che, 'compra')
  uguale('e la cosa da comprare è un campo', occupati.azione.voce, 'orto')

  /* Con il grano in mano il consiglio smette di risalire: la cosa da
     fare è lì, in quel mulino. */
  f.metti('grano', 3)
  const pronti = comeAvere(f, 'mangime', T0)
  uguale('con gli ingredienti in mano manda al mulino', pronti.azione.che, 'apri')
  uguale('e la macchina è il mulino', pronti.azione.cosa.id, 'mulino')

  /* Mulino occupato: due risposte diverse, e la differenza è il tempo.
     Poco → si aspetta. Tanto → se ne fa un altro, che è la cosa che
     l'utente chiede di proporre invece di lasciare lì. */
  f.avvia(f.cose.find(c => c.id === 'mulino'), 'mangime', T0)
  const subito = comeAvere(f, 'mangime', fra(PER_RICETTA.mangime.minuti - 1))
  uguale('un mulino che finisce fra poco si aspetta e basta', subito.azione, null)
  controlla('e dice fra quanto', /\d+ min/.test(subito.testo), subito.testo)

  /* Finito: ritirare viene prima di tutto, perché è gratis e immediato. */
  const finito = comeAvere(f, 'mangime', fra(PER_RICETTA.mangime.minuti + 1))
  uguale('un mulino che ha finito manda a ritirare', finito.azione.che, 'apri')
  controlla('e lo dice', finito.testo.includes('ritirare'), finito.testo)

  /* Un lavoro lungo è un'altra cosa: lì il secondo mulino si propone,
     ed è il caso che l'utente chiede di coprire. La soglia è a cinque
     minuti — sotto si aspetta, perché spendere 🪙150 per risparmiare
     tre minuti è un consiglio che fa perdere monete a chi si fida. */
  const t1 = fra(PER_RICETTA.mangime.minuti + 2)
  f.ritira(f.cose.find(c => c.id === 'mulino'), t1)
  f.metti('mais', 4)
  f.avvia(f.cose.find(c => c.id === 'mulino'), 'pastone', t1)
  const lungo = comeAvere(f, 'mangime', t1)
  uguale('un mulino occupato a lungo fa proporre il secondo',
         lungo.azione && lungo.azione.che, 'compra')
  uguale('e la cosa da comprare è un altro mulino', lungo.azione.voce, 'mulino')
  controlla('dicendo quanto ci mette quello che c\'è',
            /\d+ min/.test(lungo.testo), lungo.testo)
}

/* ══════════ 2. IL RACCOLTO CHE ASPETTA VIENE PRIMA ══════════
   Se c'è già un campo pronto con la roba giusta, la cosa da fare è
   raccoglierlo — non seminarne un altro, e non comprare niente. È il
   consiglio più facile da sbagliare, perché tecnicamente «non ce l'hai
   in mano» è vero anche quando è lì che aspetta. */
{
  const { f } = fattoria()
  const campo = posa(f, 'orto', 14, 20)
  posa(f, 'silo', 20, 14)
  f.seminaCampo(campo, 'grano', T0)
  const dopo = fra(60)
  const c = comeAvere(f, 'grano', dopo)
  uguale('un campo già pronto manda a raccoglierlo', c.azione.che, 'apri')
  uguale('ed è quel campo lì', c.azione.cosa, campo)
}

/* ══════════ 3. QUANDO NON C'È POSTO ══════════
   Tre risposte per tre cose da fare diverse, e l'ordine conta: usare
   quello che si ha viene **prima** di pagare. Chi ingrandisce il silo
   avendo il mulino fermo e lo scomparto del grano colmo ha pagato per
   non aver capito. */
{
  const { f } = fattoria()
  posa(f, 'orto', 14, 20)

  const senzaSilo = comeFarePosto(f, 'grano', T0)
  uguale('senza silo si compra il silo', senzaSilo.azione.che, 'compra')
  uguale('ed è quello del raccolto', senzaSilo.azione.voce, 'silo')

  /* E lo dice **prima di seminare**, non a raccolto pronto: mandare ad
     aspettare dieci minuti veri per poi rispondere di no è il no
     peggiore, perché arriva a lavoro fatto. */
  const primaDiSeminare = comeAvere(f, 'grano', T0)
  uguale('e chi chiede del grano senza silo lo sa prima di seminare',
         primaDiSeminare.azione.voce, 'silo')

  posa(f, 'silo', 20, 14)
  posa(f, 'silo_bianco', 20, 17)
  f.metti('grano', f.capienzaDi('terra'))

  /* Nessuno lo consuma: non c'è mulino, quindi allargare è davvero
     l'unica cosa da fare. */
  const soloSilo = comeFarePosto(f, 'grano', T0)
  uguale('senza niente che lo consumi si allarga il silo',
         soloSilo.azione.che, 'ingrandisci')
  uguale('e si dice quale', soloSilo.azione.famiglia, 'terra')
  controlla('col prezzo sopra', soloSilo.azione.prezzo > 0)

  /* Col mulino fermo la risposta cambia, e non costa niente. */
  const mulino = posa(f, 'mulino', 14, 14)
  const conMulino = comeFarePosto(f, 'grano', T0)
  uguale('col mulino fermo si manda a usarne un po\'', conMulino.azione.che, 'apri')
  uguale('proprio in quel mulino', conMulino.azione.cosa, mulino)

  /* Mulino occupato: allora sì, si allarga. */
  f.avvia(mulino, 'mangime', T0)
  const occupato = comeFarePosto(f, 'grano', T0)
  uguale('col mulino occupato torna l\'ingrandimento', occupato.azione.che, 'ingrandisci')
}

/* ══════════ 4. UNO SCOMPARTO PIENO NON FERMA GLI ALTRI ══════════
   La ragione per cui gli scomparti esistono, detta dal lato di chi
   consiglia: il mais colmo non deve far comparire consigli sul mais
   quando si sta chiedendo delle carote. */
{
  const { f } = fattoria()
  posa(f, 'silo', 20, 14)
  f.metti('mais', 99)
  uguale('il mais è colmo', f.quantoCiSta('mais'), 0)
  controlla('ma le carote entrano ancora', f.quantoCiSta('carote') > 0)
}

/* ══════════ 5. NIENTE ANELLI, E NIENTE BUCHI ══════════
   Ogni prodotto del gioco deve avere una risposta, sempre, in una
   fattoria vuota come in una piena. Il giro sulle tabelle è quello che
   accorge di una coltura o di una ricetta aggiunta a metà.

   E la risposta deve **finire**: una tabella con un anello — il
   pastone che serve al pastone — bloccherebbe il fotogramma, e il
   fondo alla ricorsione è l'unica cosa che lo impedisce. */
{
  const vuota = fattoria().f
  const piena = fattoria().f
  posa(piena, 'silo', 20, 14)
  posa(piena, 'silo_bianco', 20, 17)
  posa(piena, 'mulino', 14, 14)
  posa(piena, 'orto', 14, 20)

  let mute = []
  for (const id of Object.keys(PRODOTTI))
    for (const [come, f] of [['vuota', vuota], ['avviata', piena]]) {
      const r = comeAvere(f, id, T0)
      if (!r || !r.testo || r.testo.includes('non si fa in fattoria'))
        mute.push(`${id} (${come})`)
    }
  uguale('ogni prodotto sa dire come si ottiene, in ogni stato', mute.join(', '), '')

  let senzaPosto = []
  for (const id of Object.keys(PRODOTTI)) {
    const r = comeFarePosto(piena, id, T0)
    if (!r || !r.testo) senzaPosto.push(id)
  }
  uguale('e ogni prodotto sa dire dove metterlo', senzaPosto.join(', '), '')

  /* Le colture non ancora sbloccate non mandano a comprare: dicono a
     che livello arrivano. Un tasto che compra una cosa che il baule non
     ha è un tasto rotto. */
  const bassa = fattoria(1).f
  const tarde = COLTURE.filter(c => (c.liv || 1) > 1)
  for (const c of tarde) {
    const r = comeAvere(bassa, c.da, T0)
    if (r.azione && r.azione.che === 'compra' && r.azione.voce === 'orto') continue
    controlla(`${c.emoji} ${c.nome} non promette niente che non si possa avere`,
              !r.azione || r.azione.che !== 'compra' || !!r.azione.prezzo, r.testo)
  }
}

/* ══════════ 6. L'ORDINE DI SBLOCCO ══════════
   Un tasto che non si può premere non è un obiettivo: è indistinguibile
   da una cosa rotta, e chi lo prova smette di fidarsi anche di quelli
   che funzionano. Il difetto vero: il pastone si vedeva nel mulino dal
   livello 3 e il mais arrivava al 10 — cinque ore di esercizi con una
   ricetta impossibile in mezzo a quelle vere. */
{
  uguale('nessuna ricetta compare prima dei suoi ingredienti',
         guastiDegliSblocchi().join(' · '), '')

  /* E chi chiede una cosa che non è ancora arrivata sente **quando**
     arriva, che è una cosa da aspettare, invece di «non si fa», che è
     un no. */
  const { f } = fattoria(3)
  posa(f, 'silo', 20, 14)
  posa(f, 'silo_bianco', 20, 17)
  posa(f, 'mulino', 14, 14)
  const presto = comeAvere(f, 'pastone', T0)
  uguale('il pastone al livello 3 non manda a comprare niente', presto.azione, null)
  controlla('e dice a che livello arriva', /livello 10/.test(presto.testo), presto.testo)

  /* Il mulino appena comprato mostra **una ricetta sola**: la stessa
     scelta del primo campo con una coltura sola. */
  uguale('al livello 3 il mulino ha una ricetta sola',
         ricetteDi('mulino', 3).length, 1)
  controlla('e al 10 sono due', ricetteDi('mulino', 10).length === 2)
}

/* ══════════ 7. IL CARRETTO DEL VICINO ══════════
   La valvola: si danno 5 di quello che avanza e se ne riceve 1 di
   quello che manca, senza monete in nessuna direzione. Perde apposta —
   se fosse alla pari si seminerebbe sempre la coltura più veloce e le
   altre quattro diventerebbero decorazioni. */
{
  const { f, saldo } = fattoria()
  posa(f, 'silo', 20, 14)
  posa(f, 'silo_bianco', 20, 17)
  f.metti('mais', 8)

  uguale('senza carretto non si scambia', scambia(f, 'mais', 'carote').motivo,
         'niente-carretto')
  const carretto = posa(f, 'carretto_mercato', 14, 14)

  uguale('e non si dà quello di cui non se ne ha abbastanza',
         scambia(f, 'zucche', 'carote').motivo, 'poca-roba')

  const prima = saldo()
  const r = scambia(f, 'mais', 'carote')
  controlla('cinque mais diventano una carota', r.ok)
  uguale('il mais scende di cinque', f.quantoHo('mais'), 3)
  uguale('e la carota è una', f.quantoHo('carote'), RICEVI)
  uguale('senza toccare le monete, in nessuna direzione', saldo(), prima)

  /* Il regalo: niente in cambio, ma la roba se ne va e il posto si
     libera. È la strada che resta quando non entra più niente da
     nessuna parte, e non deve mai somigliare a buttare. */
  f.metti('mais', 5)
  const dono = scambia(f, 'mais', null)
  controlla('e si può regalare senza ricevere niente', dono.ok)
  uguale('non si riceve niente', dono.ricevuti, 0)
  uguale('ma il posto si libera lo stesso', f.quantoHo('mais'), 3)

  /* Non si offre mai quello che non ci starebbe: un elenco vecchio —
     il silo si è riempito mentre il foglio era aperto — toglierebbe
     cinque pezzi per metterne uno che non entra. */
  f.metti('mais', 5)
  f.granaio.carote = f.capienzaDi('terra')
  controlla('le carote colme non si offrono più',
            !cosaOffre(f, 'mais').some(x => x.prodotto === 'carote'))
  uguale('e chiederle lo stesso non passa',
         scambia(f, 'mais', 'carote').motivo, 'non-ci-sta')
  controlla('né si offre la stessa cosa che si sta dando',
            !cosaOffre(f, 'mais').some(x => x.prodotto === 'mais'))

  /* Il consiglio lo sa: dare via non costa niente, quindi viene prima
     di ingrandire il silo, che costa monete a chi spesso non ne ha. */
  f.granaio.mais = f.capienzaDi('terra')
  const dove = comeFarePosto(f, 'mais', T0)
  uguale('col carretto, il consiglio manda lì invece che a pagare',
         dove.azione.che, 'apri')
  uguale('proprio al carretto', dove.azione.cosa, carretto)

  /* Ma solo se dare via è possibile: sotto i cinque pezzi il carretto
     non serve a niente, e proporlo sarebbe un giro a vuoto. */
  const { f: f2 } = fattoria()
  posa(f2, 'silo', 20, 14)
  posa(f2, 'carretto_mercato', 14, 14)
  f2.metti('mais', 2)
  f2.granaio.mais = 2
  controlla('con pochi pezzi non si può dare niente',
            !cosaPuoiDare(f2).some(x => x.prodotto === 'mais'))
}

/* ══════════ 7b. IL CARRETTO CHE C'ERA GIÀ ══════════
   `carretto_mercato` era una decorazione, ed è la stessa voce con lo
   stesso id: un salvataggio di ieri lo rilegge senza accorgersi di
   niente e il bambino se lo ritrova che **funziona**. Il verso buono in
   cui far cambiare mestiere a una cosa già in mappa — nessuna
   migrazione, niente che sparisce.

   Il prezzo è una sorpresa: quel carretto adesso apre un foglio dove
   prima si limitava a selezionarsi. Va bene che sorprenda, **a patto
   che il foglio si spieghi da solo** anche a chi non ha niente da
   dargli — che è lo stato esatto in cui si trova chi non l'aveva
   comprato per questo. */
{
  const { f } = fattoria(2, 100)
  const carretto = posa(f, 'carretto_mercato', 14, 14)
  controlla('un carretto comprato per bellezza è a tutti gli effetti il vicino',
            carrettoIn(f) === carretto)
  uguale('a mani vuote non c\'è niente da dargli', cosaPuoiDare(f).length, 0)
  uguale('e non c\'è nessuno scomparto colmo di cui parlare',
         scompartiColmi(f).length, 0)
  /* Cioè il foglio si apre nello stato che spiega cos'è questo posto,
     invece che in quello che risolve un problema che non c'è. */
}

nota(`${Object.keys(PRODOTTI).length} prodotti, ${COLTURE.length} colture, ` +
     `${RICETTE.length} ricette · raccolto ${merciDi('terra').length} merci, ` +
     `stalla ${merciDi('stalla').length}`)

riassunto('il prossimo passo')
