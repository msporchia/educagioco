/* ═══════════════════════════════════════════════════════════════════
   I PRIMATI — QUELLO CHE UN GIOCO SENZA FINE HA DA DARE

   Una tappa finisce, e finendo dice com'è andata: una stella, tre
   monete, la tappa dopo che si apre. Un gioco **senza fine** non ha
   niente di tutto questo — la corsa infinita non si vince, la
   Sopravvivenza non si vince — e allora l'unica cosa che può dire è
   **«sei migliorato»**. Era già scritta in due giochi, in due modi
   diversi, e diceva una riga sola: `🥇 nuovo primato!`, senza il numero
   di prima e senza quello di adesso. Cioè la notizia senza la misura:
   un bambino che corre 312 metri dopo averne fatti 280 non legge da
   nessuna parte che ne ha guadagnati trentadue.

   Questo file è **la parte pura**: il quaderno, il confronto e le
   frasi. Non importa niente — né Vue, né lo store, né un manifesto —
   così gira in Node (`test/unita/primati`) e **anche i manifesti lo
   possono importare** per scrivere la riga della home senza tirarsi
   dietro mezza applicazione. Chi scrive nel profilo è
   `giochi/campagne.js`, che è il solo punto in cui un gioco nuovo lo
   tocca.

   ── DOVE STA IL RECORD ───────────────────────────────────────────
   In `profile.campagne[<chiave>].primato`, accanto a `stelle`. Non è
   un cassetto nuovo ed è lo stesso genere di roba: `stelle` è già «il
   primato di ogni tappa», questo è il primato di quello che le tappe
   non ce l'ha. Sta lì e non in `cfg` — dove i due giochi l'avevano
   messo per primi — perché `cfg` sono **le scelte del bambino** (la
   difficoltà, il tema), e un record non si sceglie. E non in un campo
   nuovo del profilo perché un gioco non ne aggiunge, mai: questo
   cassetto si crea da sé alla prima lettura, e chi giocava ieri si
   ritrova il suo record senza nessuna migrazione (vedi `apriQuaderno`).

   ── UNO PER GIOCO ────────────────────────────────────────────────
   Un gioco ha una sfida senza fine sola, e finché è così il record è
   un campo e non un dizionario. Il giorno che un gioco ne avesse due
   si aggiunge la chiave — non prima: un dizionario con dentro sempre
   la stessa voce è un giro in più da leggere ogni volta.

   ── COSA C'È DENTRO ──────────────────────────────────────────────
     best      il record, nella misura dichiarata dal gioco
     quando    quando è stato fatto (per scriverci la data sotto)
     partite   quante partite senza fine sono finite in tutto
     ultime    gli ultimi risultati, il più recente in testa

   `ultime` non è un lusso: il record da solo dice «il te di ieri è più
   bravo di te», e a un bambino che ci si avvicina da tre partite non
   dice niente. Le ultime cinque fanno vedere che si sta salendo, ed è
   quello il premio di un gioco che non finisce.
   ═══════════════════════════════════════════════════════════════════ */

/* quanti risultati si tengono. Cinque perché è quello che si legge in
   un colpo d'occhio su una riga sola: una storia lunga qui non serve a
   nessuno, e il profilo si riscrive intero a ogni salvataggio. */
export const ULTIME = 5

export const VUOTO = () => ({ best: 0, quando: 0, partite: 0, ultime: [] })

/* ── COME SI SCRIVE UN RISULTATO ──
   Un numero da solo non dice niente: 312 può essere metri, secondi o
   codici. La misura la dichiara il gioco nel suo manifesto (`senzaFine`),
   e qui si dice come si scrive — due modi, perché **un risultato e uno
   scarto non si scrivono uguale**: 125 secondi sono «2:05», ma i 32
   secondi di differenza fra due partite sono «32s» e non «0:32», che
   sembrerebbe un orario. */
export const MISURE = {
  metri: {
    nome: 'metri',
    scrivi: v => `${v} m`,
    scarto: v => `${v} m`,
  },
  tempo: {
    nome: 'tempo',
    scrivi: v => `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`,
    scarto: v => `${v}s`,
  },
  quanti: {
    nome: 'quanti',
    scrivi: v => `${v}`,
    scarto: v => `${v}`,
  },
  /* una serie: «8 di fila», e lo scarto è un numero e basta — «1 di fila
     meglio di prima» non si legge */
  fila: {
    nome: 'di fila',
    scrivi: v => `${v} di fila`,
    scarto: v => `${v}`,
  },
  ondate: {
    nome: 'ondate',
    scrivi: v => `${v} ondat${v === 1 ? 'a' : 'e'}`,
    scarto: v => `${v}`,
  },
}

const misuraDi = m => MISURE[m] || MISURE.quanti

export const inParole = (valore, misura) => misuraDi(misura).scrivi(intero(valore))
export const scartoInParole = (valore, misura) => misuraDi(misura).scarto(intero(valore))

/* Un risultato è sempre un numero intero e mai negativo: i motori danno
   metri e secondi con la virgola, e «311.9999 m» non è un record, è un
   difetto di arrotondamento che si vede a schermo. */
function intero(v) {
  const n = Math.floor(Number(v))
  return Number.isFinite(n) && n > 0 ? n : 0
}

/* ── IL QUADERNO DI UN GIOCO ──
   Si legge dal record della campagna (`campagne[chiave]`) e si mette a
   posto chi legge, come fa già `progresso()`: un profilo salvato ieri
   non deve avere bisogno di una migrazione per giocare oggi.

   E qui c'è **il posto vecchio**: la corsa e Survivors tenevano il
   record in `cfg.primato`, un numero e basta. Chi ha corso 900 metri il
   mese scorso se li ritrova, perché quel numero si legge ancora — una
   volta sola, e da lì in poi si scrive nel posto nuovo. Buttarlo
   avrebbe fatto ripartire da zero proprio i due bambini che avevano
   giocato di più. */
export function apriQuaderno(av = {}) {
  const q = av && av.primato
  if (q && typeof q === 'object') {
    return {
      best: intero(q.best),
      quando: Number(q.quando) || 0,
      partite: Number(q.partite) || 0,
      ultime: Array.isArray(q.ultime)
        ? q.ultime.slice(0, ULTIME).map(u => ({ v: intero(u && u.v), t: Number(u && u.t) || 0 }))
        : [],
      /* com'era fatta la partita del record — 580 mostri, livello 6 —
         nelle parole del gioco, che è l'unico a sapere cosa contare */
      dettagli: q.dettagli && typeof q.dettagli === 'object' ? { ...q.dettagli } : null,
    }
  }
  const vecchio = intero((av && av.cfg || {}).primato)
  return vecchio ? { ...VUOTO(), best: vecchio } : VUOTO()
}

/* ── UNA PARTITA FINITA ──
   Torna il quaderno nuovo **e** cosa dire: sono due cose diverse e chi
   chiama le vuole tutte e due (una la salva, l'altra la mostra). Il
   quaderno non si modifica sul posto — è dato dentro un profilo
   reattivo, e chi lo legge deve poterlo confrontare con quello di
   prima.

   `primo` non è `record`: la prima partita in assoluto **non batte
   niente**, e dirle «hai battuto il record» è una bugia che si smonta
   da sola (quale record?). È però il momento in cui un record nasce, e
   la festa ci sta lo stesso: cambia la frase, non i coriandoli. */
export function conRisultato(quaderno, valore, quando = Date.now(), dettagli = null) {
  const q = apriQuaderno({ primato: quaderno || VUOTO() })
  const v = intero(valore)
  const primo = q.partite === 0 && q.best === 0
  const record = v > q.best
  const esito = {
    valore: v,
    record,
    primo,
    prima: q.best,
    meglio: record ? v - q.best : 0,
    mancano: record ? 0 : q.best - v,
    partite: q.partite + 1,
    dettagli: dettagli && typeof dettagli === 'object' ? { ...dettagli } : null,
  }
  return {
    esito,
    quaderno: {
      best: record ? v : q.best,
      quando: record ? quando : q.quando,
      partite: q.partite + 1,
      ultime: [{ v, t: quando }, ...q.ultime].slice(0, ULTIME),
      /* i dettagli sono della partita del record: una partita che non lo
         batte non li tocca, se no «580 mostri» diventerebbe il conto
         dell'ultima partita storta */
      dettagli: record ? esito.dettagli : q.dettagli,
    },
  }
}

/* ── COSA SI LEGGE ALLA FINE ──
   Una riga sola, e deve contenere **i due numeri**: quello di adesso e
   quanto si è guadagnato. «Nuovo primato!» da solo era la notizia senza
   la misura. Quando invece il record resta dov'era, si dice di quanto è
   mancato: è l'unica frase che fa venire voglia di rigiocare subito, e
   non è un rimprovero — il record è suo, mica di qualcun altro. */
export function fraseDiFine(esito, misura) {
  if (!esito) return ''
  const ora = inParole(esito.valore, misura)
  if (esito.primo) return `Il tuo primo risultato: ${ora}`
  if (esito.record)
    return `Nuovo record! ${ora} (${scartoInParole(esito.meglio, misura)} meglio di prima)`
  if (!esito.prima) return ''
  if (!esito.mancano) return `Il tuo record resta ${inParole(esito.prima, misura)}`
  return `Il tuo record è ${inParole(esito.prima, misura)}` +
         ` · ti sono mancati ${scartoInParole(esito.mancano, misura)}`
}

/* La riga corta, quella che sta sul tasto della mappa e nella home:
   «primato 312 m». Vuota se non c'è ancora niente — un «primato 0 m»
   sarebbe una bugia e un invito a non provarci. */
export const primatoInParole = (quaderno, misura) =>
  quaderno && quaderno.best ? inParole(quaderno.best, misura) : ''

/* Com'era la partita del record, nelle parole del gioco: «580 mostri ·
   livello 6». Il gioco dichiara `dettagli` nella sfida — una funzione
   che riceve quello che ha salvato e torna le frasi — perché solo lui
   sa che i suoi numeri sono mostri e non ondate. Vuota se il gioco non
   dichiara niente o se il record è di prima che si contassero. */
export function dettagliInParole(quaderno, sfida) {
  const d = quaderno && quaderno.dettagli
  if (!d || !sfida || typeof sfida.dettagli !== 'function') return ''
  const parti = sfida.dettagli(d)
  return (Array.isArray(parti) ? parti : [parti]).filter(Boolean).join(' · ')
}

/* La riga del record **prima di entrare** — sul tasto della mappa: il
   numero e com'era fatta quella partita, «2:05 · 580 mostri · livello
   6». È quello che fa venire voglia di provarci: un record senza il suo
   racconto è un numero, un racconto senza il numero è una chiacchiera. */
export const recordInParole = (quaderno, sfida) =>
  [primatoInParole(quaderno, sfida && sfida.misura), dettagliInParole(quaderno, sfida)]
    .filter(Boolean).join(' · ')

/* ── LA DICHIARAZIONE, E I SUOI GUASTI ──
   Un gioco con una modalità senza fine lo dice nel manifesto (i vecchi
   nella loro riga di `data/giochi.js`):

     senzaFine: { nome, icona, misura, che, dettagli? }

   `misura` è una chiave di `MISURE` e non un'unità scritta a mano: se
   fosse una stringa libera, il giorno che due giochi scrivessero «sec»
   e «secondi» la tabella dei record sarebbe due tabelle. Sbagliarla non
   si vede a schermo — si vede come un numero senza unità — quindi il
   test di ogni gioco fa girare questo sul proprio manifesto. `dettagli`,
   se c'è, è una funzione: riceve quello che il gioco ha salvato col
   record e torna le frasi da mettere accanto al numero. */
export function guastiDelleSfide(giochi = []) {
  const guasti = []
  for (const g of giochi) {
    const s = g && g.senzaFine
    if (!s) continue
    const dove = `senzaFine di «${g.chiave}»`
    if (!s.nome) guasti.push(`${dove}: manca il nome`)
    if (!s.icona) guasti.push(`${dove}: manca l'icona`)
    if (!s.che) guasti.push(`${dove}: manca la riga che dice cosa si misura`)
    if (!MISURE[s.misura])
      guasti.push(`${dove}: misura «${s.misura}» sconosciuta (${Object.keys(MISURE).join(', ')})`)
    if (s.dettagli !== undefined && typeof s.dettagli !== 'function')
      guasti.push(`${dove}: «dettagli» dev'essere una funzione (dettagli salvati → frasi)`)
  }
  return guasti
}
