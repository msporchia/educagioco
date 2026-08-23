/* ═══════════════════════════════════════════════════════════════════
   LA DOMANDA — la sola cosa che un modulo di quiz consegna al gioco.

   Qui non c'è logica: c'è la FORMA. Un modulo di ortografia e uno di
   orologio non hanno niente in comune tranne questo oggetto, ed è per
   questo che la stessa scheda li sa mostrare tutti e due, e che
   Survivors, il dungeon e il castello possono chiedere una domanda
   senza sapere di che materia sia.

     {
       testo:    'Quale parola è scritta giusta?',   // la consegna
       soggetto: { testo: '🕐' } | { scena: {…} },   // opzionale: la cosa da guardare
       risposte: [ Risposta, … ],                    // da 2 a 6
       giusta:   1,                                  // indice della buona
       chiave:   'orto:gn',                          // il CONCETTO, non l'istanza
       aiuto:    'gn si scrive senza i',             // la dritta, dopo l'errore
       dritta:   '6 × 6 = 36: lato per lato',        // la scorciatoia, anche a risposta giusta
     }

   L'`aiuto` E IL `perche` DI UNA RISPOSTA FANNO DUE MESTIERI, e dopo
   uno sbaglio si leggono **tutti e due**. Il `perche` diagnostica la
   scelta appena fatta — «hai guardato solo l'ultima cifra» — e vale
   solo per quel tasto lì; l'`aiuto` insegna il metodo — «47 sta fra 40
   e 50: l'ultima cifra è 7, quindi si va su» — e vale anche la volta
   dopo. Per mesi la scheda ne ha mostrato uno solo, il primo dei due
   che ci fosse, e siccome i moduli scritti bene hanno tutti e due
   l'insegnamento non l'ha letto nessuno: chi sbagliava si prendeva la
   diagnosi e basta. Chi li mette a schermo è `spiegazioneDi` qui
   sotto, che li tiene separati apposta — un paragrafo unico rimette
   insieme le due cose e il metodo si perde in coda alla correzione.

   LA `dritta` NON È UN TERZO AIUTO. L'`aiuto` si legge quando si
   sbaglia, e dice **come si faceva**. La dritta dice che c'era una
   strada più corta di quella presa, e per questo si legge anche
   quando la risposta è giusta — ma solo se il bambino ci ha messo
   troppo, che è il segno che l'ha fatta a mano. Chi risponde in tre
   secondi la strada corta ce l'ha già, e fermarlo per spiegargliela
   sarebbe una punizione per aver saputo. Chi la porta è chi ha una
   formula da offrire: l'area di un rettangolo, il giro di un quadrato.

   Una RISPOSTA è una di queste tre cose, mai due insieme:

     { testo: 'lavagna' }        parole e numeri
     { emoji: '🐟' }             un'icona grande
     { scena: { che:'orologio', ore:3, minuti:30 } }   un disegno

   e può portarsi dietro un `perche`, che si legge solo se il bambino
   sceglie proprio quella: «qui manca il riporto» vale dieci volte
   «sbagliato».

   UNA FIGURA PUÒ AVERE IL SUO NOME SOTTO. `conNome` aggiunge un `nome`
   accanto all'icona o al disegno — `{ emoji:'🦁', nome:'leone' }`,
   `{ scena:{…}, nome:'savana' }` — e il tasto diventa disegno sopra,
   parola sotto. Serve dove la figura da sola non si nomina: un bambino
   riconosce il giallo con l'acacia molto prima di saper chiamare quel
   posto «savana», e senza la parola il quiz gli insegna un'immagine
   invece di un vocabolo.

   MA NON SEMPRE SI PUÒ, E LA RIGA È NETTA: figura e nome stanno
   insieme **quando dicono la stessa cosa e la domanda ne chiede
   un'altra**. «Dove vive il leone?» con quattro paesaggi e i loro nomi
   non anticipa niente. «Come si dice cane in inglese?» con sotto ogni
   parola la sua figura regala la risposta — il bambino guarda il cane
   in cima e cerca il cane in basso, e la domanda smette di essere sulla
   lingua. Lì la coppia sta **su un lato solo**: figura al soggetto,
   parole nei tasti. Nessun controllo automatico può accorgersene,
   perché una domanda così è formalmente ineccepibile: è una regola per
   chi scrive il modulo. Quello che il controllo sa vedere è il caso
   degenere — un `nome` su una risposta di solo testo, cioè la stessa
   parola scritta due volte.

   LA CHIAVE È IL CONCETTO. `orto:gn` sta su tutte le domande sul gruppo
   gn, non su una singola parola: è la stessa scelta di
   `data/calcolo.js`, ed è quella che un giorno permetterà al motore di
   ripasso (`store/srs.js`) di seguire *cosa il bambino non sa* invece
   di *quali domande ha visto*. Un modulo con una chiave sola è un
   modulo che non si potrà mai dosare: meglio poche chiavi vere che una
   per istanza.

   I FALSI NON SONO RUMORE. Se i distrattori si scartano a occhio la
   domanda si risolve per esclusione invece che sapendola: chi scrive un
   generatore deve prendere i falsi dagli ERRORI TIPICI di quel
   concetto — la parola scritta come si sente, l'ora letta sulla lancetta
   sbagliata, il verbo coniugato come lo direbbe un bambino.
   ═══════════════════════════════════════════════════════════════════ */

/* ── fabbriche delle risposte ──
   Servono a non sbagliare la forma, e a dare un posto solo dove
   aggiungere un tipo di risposta il giorno che ne servirà un quarto. */
export const testo = (t, perche) => perche ? { testo: String(t), perche } : { testo: String(t) }
export const emoji = (e, perche) => perche ? { emoji: e, perche } : { emoji: e }
export const scena = (s, perche) => perche ? { scena: s, perche } : { scena: s }

/* la parola sotto la figura. Non è una quarta forma ma un'aggiunta alle
   altre, e si compone: `conNome(scena({ che:'savana' }), 'savana')`.
   Sta su un campo suo (`nome`) e non su `testo` apposta — `testo` vuol
   dire «la risposta È questa parola», e le due cose vanno distinte o il
   giorno che una domanda mescola tasti scritti e tasti disegnati non si
   capisce più quale sia quale. */
export const conNome = (risposta, nome) => ({ ...risposta, nome: String(nome) })

/* ── la fabbrica della domanda ──
   Prende la risposta giusta e i falsi già pronti, li mescola con la
   sorte e tiene il conto di dov'è finita la buona. È il modo di non
   scrivere mai più `giusta: 0` per distrazione (e di non lasciare la
   buona sempre in cima, che i bambini imparano in tre partite). */
export function domanda({ testo: consegna, soggetto, buona, falsi, chiave, aiuto, dritta, sorte }) {
  const tutte = sorte.mescola([buona, ...falsi])
  const d = {
    testo: consegna,
    risposte: tutte,
    giusta: tutte.indexOf(buona),
    chiave,
  }
  if (soggetto) d.soggetto = soggetto
  if (aiuto) d.aiuto = aiuto
  if (dritta) d.dritta = dritta
  return d
}

/* ── quando la scorciatoia va detta ──
   Pura, e fuori dal componente apposta: è una regola con dentro una
   soglia, e una soglia che si può provare solo col telefono in mano
   non la prova nessuno. La usa `quiz/Domanda.vue`, e la prova
   `test/unita/griglia-misure`.

   Dodici secondi è il tempo che ci vuole a contare a dito i quadretti
   di un rettangolo 6×7 — non quello che ci vuole a moltiplicare. Chi
   sta sotto la strada corta ce l'ha già, e fermarlo per spiegargliela
   sarebbe una punizione per aver saputo. */
export const LENTO = 12

export function serveLaDritta(d, { giusto, tempo }) {
  if (!d?.dritta) return false
  return giusto ? tempo > LENTO : true
}

/* ── QUANDO SI È TIRATO A CASO ─────────────────────────────────────
   Il verso opposto della dritta, e nasce dallo stesso posto: guardando
   un bambino giocare si vede che certe risposte non sono tentativi, sono
   **tocchi**. Il tasto è lì, lo si preme, si vede cosa succede. Nei
   giochi dove sbagliare non toglie niente quella è perfino la strada più
   corta: quattro tocchi e una domanda è passata.

   Non si può sapere se un bambino stava tirando a caso. Si può sapere
   una cosa più modesta e sufficiente: **che non ha avuto il tempo di
   leggere**. Sotto quel tempo, e con la risposta sbagliata, non c'è
   niente da distinguere fra «non lo sapeva» e «non ha guardato», e il
   gioco può trattarli allo stesso modo — perché la cura è la stessa:
   fermarsi un momento e leggere.

   LA SOGLIA NON È UN NUMERO SOLO, e questo è il punto. Un secondo e
   mezzo è tantissimo per «7 × 8» e non basta per una consegna di venti
   parole con quattro risposte scritte: una soglia fissa direbbe «hai
   tirato a caso» a chi le tabelline le sa, che è esattamente il
   contrario di quello che serve. Si misura quindi la roba da leggere —
   consegna più risposte — e si conta un tempo di lettura.

   E NON COSTA NIENTE DI QUELLO CHE SI HA. La penalità è **tempo**: si
   resta fermi più a lungo, con scritto perché. Togliere vita o monete a
   chi risponde in fretta punirebbe anche chi è svelto e sa, e
   soprattutto insegnerebbe la cosa sbagliata — che rispondere è
   pericoloso. Quello che si vuole insegnare è che leggere conviene, e
   il modo di dirlo è non lasciare andare avanti chi non ha letto. */
export const FRETTA = 1.1            // secondi, il minimo per guardare qualunque cosa
export const A_PAROLA = 0.09         // e quanto costa leggere ogni parola
export const FRETTA_MAX = 4          // oltre non si sale: sarebbe un'accusa, non una misura

/* quante parole ci sono da leggere, in un pezzo di testo o in tanti */
const quanteParole = parti =>
  parti.filter(Boolean).join(' ').trim().split(/\s+/).filter(Boolean).length

export function tempoDiLettura(d) {
  if (!d) return FRETTA
  return Math.min(FRETTA_MAX,
    FRETTA + quanteParole([d.testo, ...(d.risposte || []).map(r => r?.testo)]) * A_PAROLA)
}

/* ── COSA SI LEGGE DOPO AVER SBAGLIATO ─────────────────────────────
   Due righe con due mestieri, e la scheda le tiene separate: vedi il
   cappello di questo file. Qui c'è solo la scelta di *cosa* mostrare,
   e sta fuori dal componente per il motivo di sempre — dentro un `.vue`
   non si prova senza un browser, e infatti il difetto che questa
   funzione toglie (uno dei due invece di tutti e due) è vissuto per
   mesi senza che niente diventasse rosso.

   A risposta giusta non si spiega niente: quello che c'era da dire
   l'ha detto il bambino. */
export function spiegazioneDi(d, scelto) {
  if (!d || !(scelto >= 0) || scelto === d.giusta) return { perche: '', comeSiFa: '' }
  return {
    perche: d.risposte?.[scelto]?.perche || '',
    comeSiFa: d.aiuto || '',
  }
}

/* ── QUANTO SI STA FERMI, E PERCHÉ CRESCE ──────────────────────────
   Dopo uno sbaglio la scheda non va avanti subito: c'è da leggere. Il
   pavimento è `PONDERA`, quattro secondi, ed è tarato su una
   spiegazione di **una riga** — il respiro che i giochi chiedono è
   tarato sul ritmo della partita (il sotterraneo ne chiede 900 ms),
   che è la misura giusta per una risposta giusta e quella sbagliata
   per un errore. Da quando la scheda dice il perché *e* come si fa le
   righe sono due, e quattro secondi su venticinque parole vorrebbero
   dire sei parole al secondo: una spiegazione che passa senza essere
   letta è peggio di nessuna spiegazione, perché insegna che quel
   riquadro non contiene niente di utile.

   Quindi si misura la roba da leggere, come già si fa per la fretta —
   stessa unità, le parole — ma con un passo diverso e per un motivo
   diverso: `A_PAROLA` è quanto ci vuole a **posare l'occhio** su una
   parola (serve a dire «non l'ha nemmeno guardata»), `A_CAPIRE` è
   quanto ci vuole a leggerne una **per capirla**.

   Un quarto di secondo, e il numero non è preso a caso: quattro
   secondi diviso un quarto fanno sedici parole, che è esattamente la
   spiegazione di una riga su cui `PONDERA` era stato tarato. Il
   pavimento e il passo sono lo stesso numero detto due volte, e per
   questo le spiegazioni corte restano ai quattro secondi di prima
   invece di scattare in su per un arrotondamento.

   E c'è un tetto, `LEGGERE_MAX`, perché le spiegazioni lunghe
   esistono (la logica arriva a cinquanta parole) e sette secondi sono
   già il limite di quanto un bambino sta a guardare una schermata
   ferma senza toccarla.

   IL TOTALE NON SUPERA MAI `TETTO`. La penalità della fretta
   (`quiz/fretta.js`) si somma a questa attesa, e dieci secondi sono il
   punto oltre il quale una pausa smette di sembrare una pausa e
   comincia a sembrare un gioco rotto — è la stessa soglia dichiarata
   là, e adesso è scritta una volta sola invece di risultare per caso
   dalla somma di due numeri. Chi tira a caso su una domanda dalla
   spiegazione lunga aspetta dieci secondi come chi tira a caso su una
   corta: la penalità si accorcia, non l'attesa per leggere. */
export const PONDERA = 4000
export const A_CAPIRE = 0.25
export const LEGGERE_MAX = 7000
export const TETTO = 10000

export function tempoDiCapire(righe = []) {
  return Math.min(LEGGERE_MAX, Math.round(quanteParole(righe) * A_CAPIRE * 1000))
}

/* Quanto resta a schermo l'esito. `pavimento` è quello che il gioco (o
   la regola) vuole comunque — `PONDERA` dopo uno sbaglio, il respiro
   della partita quando si è indovinato — e `penale` è la fretta.
   È un pavimento e non un'aggiunta: chi già aspettava di più continua
   ad aspettare quello. */
export function attesaDellEsito({ righe = [], pavimento = 0, penale = 0 } = {}) {
  return Math.min(TETTO, Math.max(pavimento, tempoDiCapire(righe)) + penale)
}

/* Sbagliata **e** più veloce di quanto ci voglia a leggerla. La risposta
   giusta non è mai fretta, per veloce che sia: chi la sa la sa. */
export function troppoDiFretta(d, { giusto, tempo }) {
  if (giusto) return false
  return tempo < tempoDiLettura(d)
}

/* ── il controllo di forma ──
   Lo usa il banco di prova su ogni domanda generata; è anche la
   descrizione eseguibile del contratto qui sopra, quindi quando cambia
   la forma cambia questa funzione e non un commento.
   Restituisce la lista dei guasti: vuota vuol dire a posto. */
export function guastiDi(d, { pittori = {} } = {}) {
  const g = []
  const dice = (c, m) => { if (!c) g.push(m) }

  dice(d && typeof d === 'object', 'non è un oggetto')
  if (!g.length) {
    dice(typeof d.testo === 'string' && d.testo.trim().length > 2, 'testo mancante o troppo corto')
    dice(typeof d.chiave === 'string' && /^[a-z0-9-]+:[a-z0-9-]+$/.test(d.chiave),
      `chiave malformata: ${JSON.stringify(d.chiave)} (serve «materia:concetto», minuscole e trattini)`)
    dice(Array.isArray(d.risposte) && d.risposte.length >= 2 && d.risposte.length <= 6,
      `le risposte devono essere da 2 a 6, sono ${d.risposte?.length}`)
    dice(Number.isInteger(d.giusta) && d.giusta >= 0 && d.giusta < (d.risposte?.length ?? 0),
      `«giusta» fuori dalla lista: ${d.giusta}`)

    /* il nome è la parola sotto la figura: si controlla che ci sia
       qualcosa scritto, e che non sia appiccicato a una risposta che è
       già una parola — quella sarebbe scritta due volte */
    const guastiDelNome = (c, dove) => {
      if (c?.nome === undefined) return
      dice(typeof c.nome === 'string' && c.nome.trim().length > 0, `${dove}: nome vuoto`)
      dice(c.testo === undefined, `${dove}: «nome» su una risposta di solo testo — la parola ci sarebbe due volte`)
    }

    for (const r of d.risposte || []) {
      const forme = ['testo', 'emoji', 'scena'].filter(k => r && r[k] !== undefined)
      dice(forme.length === 1, `una risposta deve avere UNA fra testo/emoji/scena, ne ha ${forme.length}`)
      if (r?.scena) dice(!!pittori[r.scena.che], `nessun pittore per la scena «${r.scena?.che}»`)
      if (r?.testo !== undefined) dice(String(r.testo).length > 0, 'risposta con testo vuoto')
      guastiDelNome(r, 'risposta')
    }
    if (d.soggetto) {
      const forme = ['testo', 'emoji', 'scena'].filter(k => d.soggetto[k] !== undefined)
      dice(forme.length === 1, 'il soggetto deve avere UNA fra testo/emoji/scena')
      if (d.soggetto.scena) dice(!!pittori[d.soggetto.scena.che], `nessun pittore per la scena «${d.soggetto.scena.che}»`)
      guastiDelNome(d.soggetto, 'soggetto')
    }

    /* due risposte identiche sono un guasto grave: la domanda ha due
       risposte giuste o una buona nascosta fra i cloni */
    const impronte = (d.risposte || []).map(r =>
      r.testo !== undefined ? 't:' + r.testo : r.emoji !== undefined ? 'e:' + r.emoji : 's:' + JSON.stringify(r.scena))
    dice(new Set(impronte).size === impronte.length, `risposte doppie: ${impronte.join(' | ')}`)

    /* Con la figura e il nome insieme i lati sono due, e l'unicità va
       chiesta a tutti e due: due tasti con lo stesso disegno e due nomi
       diversi passerebbero il controllo qui sopra — le impronte sono
       diverse — ma a schermo sono la stessa risposta due volte, e uno
       dei due è per forza sbagliato. */
    const nomi = (d.risposte || []).map(r => r.nome).filter(n => n !== undefined)
    dice(new Set(nomi).size === nomi.length, `nomi doppi fra le risposte: ${nomi.join(' | ')}`)
  }
  return g
}
