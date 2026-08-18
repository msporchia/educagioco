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
     }

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
export function domanda({ testo: consegna, soggetto, buona, falsi, chiave, aiuto, sorte }) {
  const tutte = sorte.mescola([buona, ...falsi])
  const d = {
    testo: consegna,
    risposte: tutte,
    giusta: tutte.indexOf(buona),
    chiave,
  }
  if (soggetto) d.soggetto = soggetto
  if (aiuto) d.aiuto = aiuto
  return d
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
