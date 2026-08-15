/* ═══════════════════════════════════════════════════════════════════
   IL QUADERNO DEI GIUDIZI — «questa domanda era troppo facile»

   Il guasto che i moduli di quiz non lanciano mai. Una domanda può
   essere formalmente ineccepibile — forma giusta, falsi distinti,
   varietà alta, il banco la promuove — e arrivare comunque **fuori
   misura** per il bambino che ce l'ha davanti: una moltiplicazione a
   due cifre a chi le tabelline le sta ancora imparando, o un contrario
   che a sette anni è un regalo. Quello lo vede solo chi è seduto lì, e
   fino a ieri finiva su un foglietto che poi si perde.

   Adesso finisce qui. Tre tasti sopra la domanda (`components/
   Giudizio.vue`), un tocco, e il gioco si annota **da sé** tutto quello
   che a mano non si scriverebbe mai: quale modulo, quale grado, quale
   tipologia, quanto ci ha messo, se l'ha presa. Chi giudica dà solo il
   verdetto — che è l'unica cosa che il gioco non può sapere.

   STA FUORI DAI PROFILI, accanto al codice dei genitori e al libretto
   degli incidenti: un giudizio è di chi scrive il gioco, non di un
   bambino, e cancellare i progressi di un giocatore non deve portarselo
   via. Per lo stesso motivo l'interruttore non sta in `settings`: si
   accende sul telefono, non su Melody, e cambiando bambino resta acceso.

   ── COME ESCONO DI QUI ──
   Non c'è nessun server a cui mandarli, e non ci sarà: il gioco è un
   file HTML che gira offline. C'è però già una strada aperta per le
   segnalazioni — il modulo Tally della schermata dei grandi — e i
   giudizi ci passano insieme a tutto il resto, precompilati in un campo
   nascosto. Da un telefono senza posta configurata è l'unico canale che
   non chiede niente a nessuno: si apre una pagina e si tocca invia.

   Quindi la forma compatta di `riga()` non è un vezzo: quel testo
   viaggia **dentro un indirizzo**, dove ogni carattere strano ne costa
   tre, e i browser hanno un tetto. Sopra `TETTO_INVIO` si mandano gli
   ultimi e il pacco lo dice in testa, invece di farsi troncare a metà
   riga da qualcun altro.
   ═══════════════════════════════════════════════════════════════════ */
import { ref } from 'vue'
import { load, save, flush } from './storage.js'

const CHIAVE = 'giudizi'
const CHIAVE_ACCESO = 'giudizi-accesi'

/* quanti se ne tengono in archivio. Sono righe minuscole e si scrivono
   a mano una alla volta: il tetto serve solo perché niente cresca senza
   fine, non perché ci si arrivi davvero. */
const QUANTI = 150

/* quanti ne entrano in un invio. Il pacco viaggia nell'indirizzo del
   modulo, e una riga costa fino a 160 caratteri una volta codificata
   (le misura `test/unita/giudizi.test.mjs` su righe piene): trenta
   stanno sotto i cinquemila, che è largo per qualunque browser e per il
   modulo che le riceve. Chi ne ha di più li manda in due volte, o li
   copia — meglio corti e detti che lunghi e troncati da altri. */
export const TETTO_INVIO = 30

/* I tre verdetti, e non uno di più. Due sono la misura — troppo facile,
   troppo difficile — e il terzo è la cosa diversa che capita a leggerle:
   una domanda con due risposte difendibili, un disegno che non si
   capisce, una consegna che non dice a che tempo coniugare. Sono i tre
   difetti che il banco automatico non trova per costruzione. */
export const VERDETTI = [
  { id: 'facile', ico: '😴', che: 'troppo facile' },
  { id: 'difficile', ico: '😰', che: 'troppo difficile' },
  { id: 'storta', ico: '🐛', che: 'domanda storta' },
]

export const verdettoDi = id => VERDETTI.find(v => v.id === id) || null

/* ── l'interruttore ──
   Reattivo perché lo legge un componente dentro il gioco, e a domanda
   comparsa non c'è tempo di aspettare l'archivio: si carica una volta
   all'avvio e poi è un booleano in memoria. */
export const giudiziAccesi = ref(false)

/* NON si salva il booleano nudo, e non è un vezzo: `storage.js` usa
   `true` come segnale di «scrittura riuscita» e la sua `load()` scarta
   quel valore quando lo rilegge (`fromIdb !== true`). Un `save(k, true)`
   si scrive senza lamentarsi e torna sempre `null`: l'interruttore si
   spegnerebbe a ogni riavvio senza che niente sembri rotto. Dentro un
   oggetto il problema non esiste. */
export async function avviaGiudizi() {
  const c = await load(CHIAVE_ACCESO)
  giudiziAccesi.value = c?.acceso === true
  return giudiziAccesi.value
}

export function accendiGiudizi(si) {
  giudiziAccesi.value = !!si
  save(CHIAVE_ACCESO, { acceso: !!si })
  return flush()
}

/* ── la parte che si prova senza browser ──
   Una voce nuova si accoda; una che ha già l'`id` di una scritta prima
   la **sostituisce**, perché quell'id è una domanda comparsa a schermo
   una volta sola: chi tocca 😰 e poi ci ripensa e tocca 😴 ha cambiato
   idea su quella domanda lì, non ne ha giudicate due. */
export function aggiungi(lista, voce, quanti = QUANTI) {
  const prima = Array.isArray(lista) ? lista.filter(v => v && typeof v === 'object') : []
  const senza = voce.id ? prima.filter(v => v.id !== voce.id) : prima
  return [...senza, voce].slice(-quanti)
}

export const leggi = () => load(CHIAVE).then(l => (Array.isArray(l) ? l : []))
export const dimentica = () => { save(CHIAVE, []); return flush() }

/* Scrivere non fa aspettare nessuno: chi chiama è un dito su un tasto
   mentre un bambino sta giocando. Il `flush()` invece serve — un
   giudizio è di solito l'ultima cosa che si fa prima di chiudere. */
export async function annota(voce) {
  const piena = { quando: new Date().toISOString(), ...voce }
  try {
    save(CHIAVE, aggiungi(await leggi(), piena))
    await flush()
  } catch (e) { /* se non si riesce a scrivere un giudizio, pazienza */ }
  return piena
}

/* ── la forma compatta ──
   Una riga per giudizio, campi sempre nello stesso ordine, il verdetto
   per primo perché è quello che si scorre. Il testo della domanda va in
   coda e tagliato: serve a riconoscerla, non a rileggerla — per quella
   c'è la chiave, che è la sola cosa che ritrova la domanda nel codice.

   Niente caratteri fuori dall'alfabeto: un `·` costa sei caratteri una
   volta finito nell'indirizzo, e a fine pacco sono centinaia. */
const taglia = (t, quanti) => {
  const s = String(t ?? '').replace(/\s+/g, ' ').trim()
  return s.length > quanti ? s.slice(0, quanti - 1) + '…' : s
}

export function riga(v) {
  const pezzi = [
    v.verdetto || '?',
    v.chi || '?',
    v.gioco || '?',
    [v.modulo, v.grado].filter(x => x !== undefined && x !== '').join(' '),
    v.chiave || '',
    [v.tempo !== undefined ? Math.round(v.tempo) + 's' : '', v.esito || '']
      .filter(Boolean).join(' '),
    taglia(v.testo, 46),
  ]
  return pezzi.filter(p => p !== '').join(' | ')
}

const giorno = q => {
  const d = new Date(q)
  return isNaN(d) ? '?' : d.toLocaleDateString('it', { day: 'numeric', month: 'short' })
}

/* ── il pacco da mandare ──
   Quello che finisce nel campo nascosto del modulo. In testa quanti
   sono e di che giorni, perché arrivano staccati dal resto; e se sono
   più di quanti ne regge un indirizzo si mandano **gli ultimi**, con
   scritto quanti sono rimasti a casa. Un pacco che si fa troncare in
   silenzio da un limite altrui è peggio di uno corto: non si sa cosa
   manca. */
export function pacco(lista, tetto = TETTO_INVIO) {
  const tutte = Array.isArray(lista) ? lista : []
  if (!tutte.length) return { testo: '', mandati: 0, lasciati: 0 }
  const mandate = tutte.slice(-tetto)
  const lasciati = tutte.length - mandate.length
  const date = [giorno(mandate[0].quando), giorno(mandate[mandate.length - 1].quando)]
  const quando = date[0] === date[1] ? date[0] : `${date[0]} - ${date[1]}`
  const testa = `${mandate.length} giudizi (${quando})` +
    (lasciati ? `, i piu recenti di ${tutte.length}` : '')
  return {
    testo: [testa, ...mandate.map(riga)].join('\n'),
    mandati: mandate.length,
    lasciati,
  }
}
