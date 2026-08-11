/* ═══════════════════════════════════════════════════════════════════
   LE SCORCIATOIE PER SCRIVERE UN LIVELLO

   Un livello è **dato puro**: nessuna regola, nessun comportamento —
   solo com'è fatta la scena e cosa ci si può dire. Queste funzioni non
   aggiungono niente al gioco: costruiscono gli stessi oggetti che si
   scriverebbero a mano, e servono perché

       o('prendi', 'chiave')

   si legge, mentre `{ verbo: 'prendi', complemento: 'chiave' }`
   ripetuto quaranta volte non si legge più.

   Stavano copiate in testa a ogni file di livello — dieci copie della
   stessa riga, che è il modo migliore per farne divergere una. Qui
   stanno in un posto solo, e un livello importa quelle che gli
   servono.

   ── le tre famiglie ──
     gli ORDINI      `o`, `quando`, `azione`, `aspettaChe`
     i BLOCCHI       `bivio`, `ciclo`, `giro`
     le DOMANDE      `vedi`, `qui`, `ha`, `caduto`, e i loro contrari

   E in fondo il pennello per le griglie grandi: una mappa di trenta
   colonne non si scrive riga per riga, si **scava** (`tela`, `cava`,
   `tondo`, `mura`, `stampa`). Il risultato resta una lista di righe di
   caratteri, cioè dato come tutto il resto.
   ═══════════════════════════════════════════════════════════════════ */

/* ── gli ordini ──
   Un ordine è verbo + complemento, e non porta condizioni addosso:
   per scegliere fra due strade c'è il bivio, per aspettare c'è
   `aspettaChe`. */
export const o = (verbo, complemento) => ({ verbo, complemento })

/* `quando` non è un'azione: arma un ascolto e passa oltre. Quando quel
   segnale arriva parte una fila nuova — è così che un piano ha due
   punti d'ingresso senza annidare niente. */
export const quando = (segnale, ...allora) => ({ verbo: 'quando', complemento: segnale, allora })

/* una routine con un nome: si scrive una volta e la si chiama con
   `o('esegui', 'nome')`. Serve quando la stessa fila torna in due
   punti del piano, e a dare un nome a un pezzo di piano. */
export const azione = (nome, corpo) => ({ blocco: 'routine', nome, corpo })

/* fermarsi finché una cosa non è vera. È diverso da `quando`: qui si
   **guarda**, lì si **riceve un messaggio**. Quello che vedi lo puoi
   aspettare, quello che non vedi te lo deve dire qualcuno. */
export const aspettaChe = cond => ({ verbo: 'aspetta', cond })

/* ── i blocchi, cioè le strutture che contengono ordini ── */

/* la decisione: si guarda una volta sola, quando ci si arriva, e da lì
   parte esattamente un ramo. Un ramo vuoto vuol dire «in quel caso non
   fare niente». */
export const bivio = (cond, vero, falso) =>
  ({ blocco: 'condizione', cond, vero: vero || [], falso: falso || [] })

/* il ciclo: gli ordini che ha dentro, in tondo, finché la domanda non
   diventa vera. L'uscita non è facoltativa — senza, il giro non
   finisce mai e gli ordini dopo non partono. */
export const ciclo = (corpo, finche) => ({ blocco: 'ripeti', corpo, finche })

/* il caso più comune di ciclo: un giro di ronda fra due o più punti.
   È un `ripeti` con dentro dei `vai`, e si vede che è un ciclo. */
export const giro = (punti, finche) =>
  ciclo(punti.map(p => o('vai', p)), finche)

/* ── le domande ── */
export const vedi = complemento => ({ cond: 'vedi', complemento })
export const nonVedi = complemento => ({ cond: 'vedi', complemento, non: true })
export const qui = (chi, complemento) => ({ cond: 'qui', chi, complemento })
export const ha = (chi, complemento) => ({ cond: 'hai', chi, complemento })
export const caduto = complemento => ({ cond: 'vivo', complemento, non: true })
export const aperto = complemento => ({ cond: 'aperta', complemento })
export const sentito = complemento => ({ cond: 'segnale', complemento })

/* ── il pennello delle griglie ──
   Una mappa grande non si scrive a mano: si parte da tutto pieno e si
   scava. Quello che esce è una lista di righe di caratteri, uguale a
   una scritta a mano. */
export function tela (w, h) {
  const g = []
  for (let y = 0; y < h; y++) g.push(new Array(w).fill('#'))
  return g
}
export function cava (g, x0, y0, x1, y1) {
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) g[y][x] = '.'
}
/* una sala tonda: nessuna stanza vera è un rettangolo, e una curva
   cambia il modo in cui ci si gira dentro */
export function tondo (g, cx, cy, r) {
  for (let y = cy - r; y <= cy + r; y++)
    for (let x = cx - r; x <= cx + r; x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) g[y][x] = '.'
}
/* il contrario di `cava`: alza un muro attorno a un rettangolo */
export function mura (g, x0, y0, x1, y1) {
  for (let x = x0; x <= x1; x++) { g[y0][x] = '#'; g[y1][x] = '#' }
  for (let y = y0; y <= y1; y++) { g[y][x0] = '#'; g[y][x1] = '#' }
}
export const stampa = g => g.map(r => r.join(''))
