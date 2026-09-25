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
import { comeAvere, comeFarePosto, dentroA, laCosa, leTue, concorda }
  from '../../src/giochi/fattoria/motore/consiglio.js'
import { COLTURE, PRODOTTI, PER_RICETTA, RICETTE, SILI, merciDi, ricetteDi }
  from '../../src/giochi/fattoria/dati/coltivazioni.js'
import { PER_ID } from '../../src/giochi/fattoria/dati/catalogo.js'
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
  /* e coi premi di quei livelli già presi: qui si prova chi consiglia,
     non il gesto di andare a prendere quello che è arrivato */
  f.reclamaTutto()
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
     tre minuti è un consiglio che fa perdere monete a chi si fida.

     Con la fila (`dati/coda.js`) «occupato» vuol dire **la fila
     piena**: un mulino che macina ma ha un posto libero non è occupato,
     ci si mette in fila — e il consiglio lo dice. */
  const t1 = fra(PER_RICETTA.mangime.minuti + 2)
  const mulino = f.cose.find(c => c.id === 'mulino')
  f.ritira(mulino, t1)
  const pastone = PER_RICETTA.pastone
  f.metti('mais', pastone.prende.mais)
  f.avvia(mulino, 'pastone', t1)
  f.metti('grano', PER_RICETTA.mangime.prende.grano)
  /* Col posto solo con cui nasce ogni mulino (`dati/coda.js`) il
     pastone lo occupa tutto: il mulino **sta lavorando**, e «ha la fila
     piena» detto di una fila da uno non si capirebbe. */
  const unoSolo = comeAvere(f, 'mangime', t1)
  controlla('col posto solo occupato dice che sta lavorando',
            /sta lavorando/.test(unoSolo.testo), unoSolo.testo)
  controlla('e non parla di file', !/fila/.test(unoSolo.testo), unoSolo.testo)
  /* Con un posto comprato, invece, dietro al pastone c'è posto. */
  controlla('un posto in più si compra', f.ingrandisciLaFila(mulino).ok)
  const inFila = comeAvere(f, 'mangime', t1)
  uguale('un mulino che macina con un posto libero manda a metterlo in fila',
         inFila.azione && inFila.azione.cosa, mulino)
  controlla('e lo dice', /in fila/.test(inFila.testo), inFila.testo)
  /* il pastone in fila fino a riempirla */
  while (f.statoMacchina(mulino, t1).libera) {
    f.metti('mais', pastone.prende.mais)
    f.avvia(mulino, 'pastone', t1)
  }
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

  /* Mulino occupato: allora sì, si allarga. «Occupato» con la fila
     vuol dire **pieno**: finché ha un posto, metterci il grano libera lo
     scomparto — e riempirlo lo svuota, quindi lo si rimette colmo. */
  while (f.statoMacchina(mulino, T0).libera) f.avvia(mulino, 'mangime', T0)
  f.metti('grano', f.capienzaDi('terra'))
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
  const { f } = fattoria(4)
  posa(f, 'silo', 20, 14)
  posa(f, 'silo_bianco', 20, 17)
  posa(f, 'mulino', 14, 14)
  const presto = comeAvere(f, 'pastone', T0)
  uguale('il pastone al livello 4 non manda a comprare niente', presto.azione, null)
  controlla('e dice a che livello arriva', /livello 11/.test(presto.testo), presto.testo)

  /* Il mulino appena comprato mostra **una ricetta sola**: la stessa
     scelta del primo campo con una coltura sola. */
  uguale('al livello 4 il mulino ha una ricetta sola',
         ricetteDi('mulino', 4).length, 1)
  controlla('e all\'11 sono due', ricetteDi('mulino', 11).length === 2)
}

/* ══════════ 6b. QUELLO CHE È ARRIVATO E NON È STATO PRESO ══════════
   Da quando i premi di un livello si vanno a prendere a mano, fra «non
   è ancora arrivato» e «vallo a comprare» c'è un terzo caso: è
   arrivato, nessuno l'ha preso, e quindi nel baule non c'è. Mandare lì
   sarebbe di nuovo un tasto rotto — quello che i livelli esistono per
   non avere. */
{
  const { f } = fattoria(30)
  /* `fattoria()` prende tutti i premi: qui si rimette indietro il solo
     silo del raccolto, che è la prima cosa a cui il grano risale — senza
     un posto dove metterlo non si raccoglie niente. */
  delete f.reclamati['cosa:silo']
  const p = comeAvere(f, 'grano', T0)
  uguale('non manda al baule una cosa che nel baule non c\'è',
         (p.azione || {}).che, 'premio')
  uguale('e manda dove quella cosa sta davvero',
         (p.azione || {}).voce, 'silo')
  controlla('dicendolo', /premi/i.test(p.testo), p.testo)

  f.reclamati['cosa:silo'] = 1
  uguale('preso il premio, torna a mandare al baule',
         (comeAvere(f, 'grano', T0).azione || {}).che, 'compra')
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
  const { f } = fattoria(8, 100)
  const carretto = posa(f, 'carretto_mercato', 14, 14)
  controlla('un carretto comprato per bellezza è a tutti gli effetti il vicino',
            carrettoIn(f) === carretto)
  uguale('a mani vuote non c\'è niente da dargli', cosaPuoiDare(f).length, 0)
  uguale('e non c\'è nessuno scomparto colmo di cui parlare',
         scompartiColmi(f).length, 0)
  /* Cioè il foglio si apre nello stato che spiega cos'è questo posto,
     invece che in quello che risolve un problema che non c'è. */
}

/* ══════════ GLI ARTICOLI ══════════
   Il consiglio nomina macchine e silos e ci mette davanti un articolo,
   e per mesi ne sapeva due: «nel» e «nell'». Conigliera e Stalla
   dicevano «nel conigliera» **da sempre**, le Arnie «nel arnie», lo
   Stagno delle anatre «nel stagno»; poi sono arrivate sartoria,
   tintoria, cucina e dispensa e sono diventate sette righe storte.

   Nessun test poteva vederle, ed è il punto: una frase storta non è un
   errore, è **formalmente ineccepibile**. La trova un genitore che
   legge ad alta voce.

   Quello che si può controllare a macchina è l'altra metà: che il
   genere sia **dichiarato** dove serve, e che nessuna frase esca con
   un articolo impossibile. Il giudizio su come suona resta a chi
   guarda l'elenco che questo blocco stampa. */
{
  const conArticolo = [...Object.values(PER_ID).filter(v => v.macchina || v.silo),
                       ...Object.values(SILI)]
  const storte = []
  for (const v of conArticolo) {
    const dove = dentroA(v), la = laCosa(v), tue = leTue(v)
    if (!dove || !la || !tue) { storte.push(`${v.nome}: frase vuota`); continue }
    /* l'apostrofo davanti a una vocale, e mai «nel» davanti a una */
    if (/^nel [aeiou]/i.test(dove)) storte.push(`${v.nome}: «${dove}» vuole l'apostrofo`)
    /* «lo/nello» davanti alla esse impura: c'è lo stagno delle anatre */
    if (/^nel s[^aeiouh]/i.test(dove)) storte.push(`${v.nome}: «${dove}» vuole «nello»`)
    /* un nome femminile non dichiarato si vede da qui: «nel sartoria» */
    if (/^nel [a-z]*a /i.test(dove + ' ')) storte.push(`${v.nome}: «${dove}» — manca «la: true»?`)
    /* il plurale piega la prima parola, non l'ultima: «i tuoi sili del
       raccolto», non «i tuoi silo del raccolti» */
    const resto = v.nome.toLowerCase().split(' ').slice(1).join(' ')
    if (resto && !tue.endsWith(resto))
      storte.push(`${v.nome}: «${tue}» ha piegato la parola sbagliata`)
  }
  uguale(`${conArticolo.length} nomi prendono l'articolo giusto`, storte.join(' · '), '')

  /* ── il lint del genere ──
     Non può sapere se una voce nuova è femminile; può però dire che un
     nome che finisce per -a e non lo dichiara è quasi sempre una
     dimenticanza. È un'euristica usata dove le euristiche vanno usate:
     a segnalare una **dichiarazione mancante**, mai a decidere cosa
     scrivere a schermo. */
  const sospette = conArticolo.filter(v => /a$/i.test(v.nome.split(' ')[0]) && !v.la)
  uguale('nessun nome che finisce per -a si è dimenticato «la: true»',
         sospette.map(v => v.nome).join(', '), '')

  /* E il verbo concorda con quello che l'articolo ha appena scritto:
     «le arnie hanno», non «le arnie ha». */
  const arnie = PER_ID.arnie
  uguale('le arnie sono plurali', concorda(arnie, 'ha', 'hanno'), 'hanno')
  uguale('e prendono il loro articolo', laCosa(arnie), 'le arnie')
  uguale('il fienile no', concorda(PER_ID.fienile, 'ha', 'hanno'), 'ha')

  nota('come li nomina il consiglio:')
  for (const v of conArticolo)
    nota(`  si fa ${dentroA(v)} · ${laCosa(v)} ${concorda(v, 'ha', 'hanno')} la fila piena` +
         ` · ${leTue(v)}`)
}

nota(`${Object.keys(PRODOTTI).length} prodotti, ${COLTURE.length} colture, ` +
     `${RICETTE.length} ricette · raccolto ${merciDi('terra').length} merci, ` +
     `stalla ${merciDi('stalla').length}`)

riassunto('il prossimo passo')
