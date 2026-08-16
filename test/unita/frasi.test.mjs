/* ═══════════════════════════════════════════════════════════════════
   FRASI — igiene dei distrattori, inglese e spagnolo insieme.
   `node test/esegui.mjs frasi`

   Il difetto che questo file esiste per prendere: un falso che non è
   una risposta SBAGLIATA ma la stessa risposta giusta scritta un po'
   diversa — una maiuscola, uno spazio doppio, un accento, o solo il
   punto interrogativo in meno («come stai» contro «come stai?»). A
   schermo le due righe sono quasi indistinguibili e la scelta diventa
   una moneta lanciata: chi sbaglia non ha sbagliato niente, e l'SRS
   (`src/store/srs.js`) registra un errore che non è suo.

   Il motore non protegge da questo (`src/data/domande.js`, funzioni
   `frasiVicine` e `distrattori`): sceglie la risposta giusta in base
   a un flag booleano fissato una volta sola quando costruisce le
   opzioni, non confrontando i testi a schermo. La pulizia va fatta
   qui, nei dati.

   ── L'eccezione voluta ──
   Alcune frasi vanno apposta "in coppia" — l'affermativa e la sua
   domanda, vedi il commento in testa a frasi.js — e ognuna tiene il
   testo dell'altra come distrattore: le due risposte si distinguono
   SOLO per il punto interrogativo, di proposito, perché il segnale
   vero sta nella frase straniera (l'ordine delle parole: «this is a
   cat» contro «is this a cat»), non nell'italiano scritto sotto. È
   legittimo perché quel distrattore è la risposta VERA di un'ALTRA
   frase della stessa lista, non un'invenzione — per questo il
   controllo sotto lo lascia passare solo in quel caso, e blocca tutti
   gli altri: una frase-domanda senza una vera affermativa gemella
   (tipo «come stai?», che non ha un «come stai» affermativo che
   significhi qualcosa) non ha nessuna scusa per tenersi da sola una
   copia spuntata come falso.
   ═══════════════════════════════════════════════════════════════════ */
import { FRASI } from '../../src/data/frasi.js'
import { FRASI_ES } from '../../src/data/frasi-es.js'
import { controlla, nota, riassunto } from '../aiuto/verifica.mjs'

const ok = (cond, cosa, dettaglio = '') => controlla(cosa, cond, dettaglio)
const titolo = t => console.log('\n' + t)

/* minuscole, accenti via, la punteggiatura delle domande (e il punto,
   la virgola, l'esclamativo), spazi doppi: quello che resta è la
   sostanza della frase, indipendentemente da come è scritta */
const normalizza = s => s
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/[?¿!¡.,]/g, '')
  .replace(/\s+/g, ' ')
  .trim()

/* controlla un campo di risposta giusta (es. `en` o `it`) contro il suo
   campo di falsi (es. `falsi` o `falsiIt`) per tutta una lista di frasi */
function controllaCampo(lista, campoGiusto, campoFalsi, nomeCampo) {
  // le risposte vere della lista intera: un falso che normalizzato
  // coincide con la propria risposta giusta è ammesso solo se è,
  // parola per parola, la risposta reale di un'altra frase
  const risposteReali = new Set(lista.map(f => f[campoGiusto]))

  for (const f of lista) {
    const giusta = f[campoGiusto]
    const falsi = f[campoFalsi]
    if (falsi === undefined) continue // falsiIt è facoltativo

    ok(falsi.length > 0, `${campoFalsi} dichiarato ma vuoto`, f.id)
    ok(new Set(falsi).size === falsi.length,
       `due falsi ${nomeCampo} uguali nella stessa frase`, f.id)

    for (const x of falsi) {
      const stessaSostanza = normalizza(x) === normalizza(giusta)
      const presaDaUnAltra = x !== giusta && risposteReali.has(x)
      ok(!stessaSostanza || presaDaUnAltra,
         `un falso ${nomeCampo} è la stessa frase della risposta giusta, ` +
         'solo scritta un po\' diversa (maiuscole, punteggiatura o accenti)',
         `${f.id}: "${x}" contro "${giusta}"`)
    }
  }
}

/* il campo obbligatorio (`falsi`, sempre presente) non può mai avere
   meno di due voci: `frasiVicine` in src/data/domande.js ne pesca fino
   a 3 da lì prima di ripiegare sulle frasi compagne dello stesso tema,
   e con zero o una voce sola la domanda riuscirebbe comunque (il
   ripiego copre), ma varrebbe la pena scriverne almeno due a mano */
function controllaMinimo(lista, nomeLingua) {
  for (const f of lista)
    ok(f.falsi && f.falsi.length >= 2, `meno di due falsi ${nomeLingua}`, f.id)
}

titolo('FRASI — INGLESE (frasi.js)')
{
  controllaMinimo(FRASI, 'inglesi')
  controllaCampo(FRASI, 'en', 'falsi', 'inglese')
  controllaCampo(FRASI, 'it', 'falsiIt', 'italiano')
  nota(`  ${FRASI.length} frasi controllate`)
}

titolo('FRASI — SPAGNOLO (frasi-es.js)')
{
  controllaMinimo(FRASI_ES, 'spagnoli')
  controllaCampo(FRASI_ES, 'es', 'falsi', 'spagnolo')
  controllaCampo(FRASI_ES, 'it', 'falsiIt', 'italiano')
  nota(`  ${FRASI_ES.length} frasi controllate`)
}

riassunto('Frasi: igiene dei distrattori')
