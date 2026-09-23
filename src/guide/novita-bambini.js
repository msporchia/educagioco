/* ═══════════════════════════════════════════════════════════════════
   LE NOVITÀ PER I BAMBINI — cosa c'è di nuovo nei giochi

   Questo È un changelog, ed è il contrario di `guide/novita.js`. Là si
   parla al genitore, e si scrive solo quello che gli chiede di fare
   qualcosa; qui si parla al bambino, e la notizia è proprio quella che
   di là non entra: il laboratorio rifatto, dieci mostri nuovi, una
   partita che prima non c'era. Erano cose fatte bene e nessun bambino
   lo sapeva — si entra nel gioco che si conosce, e gli altri non si
   riaprono per vedere se sono cambiati.

   ── UNA RIGA, E LA LEGGE DA SOLO ──
   Chi legge sa leggere, ma non ha voglia di un papiro: una riga per
   novità, con l'emoji della cosa in testa, che dice **cosa c'è adesso**
   e non cosa abbiamo cambiato. «🧪 Il laboratorio delle pozioni è tutto
   nuovo», non «Rifatta la grafica delle pozioni». Niente parole da
   officina (sprite, taratura, bilanciamento). La prova è una sola: se
   un bambino ci andasse apposta, se ne accorgerebbe? Se no, non è una
   novità — un guasto riparato o un prezzo ritoccato non lo sono.

   ── L'ELENCO CRESCE, E NON SI POTA ──
   Le righe non si tolgono mai. Il tetto non lo mette il file, lo mette
   la pagina (`guide/Novita.vue`): di ogni gioco si vedono solo le
   ultime `PER_GIOCO`, quindi chi non apre il gioco da un anno trova al
   massimo quattro righe per gioco, e nessuno deve tenere corto questo
   file a mano.

   ── LETTO FIN QUI ──
   Ogni bambino ha un segno solo, `settings.novitaLette`: l'id più alto
   che c'era quando ha premuto «Letto». Non una versione — il gioco si
   pubblica venti volte e la pagina cambia solo quando si scrive qui — e
   non un elenco di righe viste una per una. Un bambino creato oggi
   parte dall'ultima (`creaGiocatore`): «è tutto nuovo», detto a chi il
   prima non l'ha mai visto, è falso.

   ── IL FORMATO ──
   - `id`      progressivo, non si riusa mai: è il segno di «letto fin
               qui». Il prossimo è quello dopo il più alto.
   - `quando`  la data, `AAAA-MM-GG`: la pagina la scrive piccola accanto.
   - `gioco`   la chiave di `data/giochi.js`. Senza, è una novità di
               tutti i giochi (la pausa, i record) e la vede chiunque;
               con, la vede solo chi quel gioco ce l'ha in home — la
               stessa domanda della home (`inCasa`), perché una riga sul
               castello a chi il castello non ce l'ha è rumore.
   - `testo`   una riga di testo semplice: niente HTML e niente `**`.

   Le decide il proprietario del gioco: chi lavora al codice propone la
   riga nel resoconto, e la si aggiunge quando viene detto sì.
   ═══════════════════════════════════════════════════════════════════ */
export const NOVITA = [
  { id: 1, quando: '2026-08-24', gioco: 'sotterraneo',
    testo: '👹 Nel sotterraneo ci sono dieci mostri nuovi' },
  { id: 2, quando: '2026-09-11', gioco: 'pozioni',
    testo: '🧪 Il laboratorio delle pozioni è tutto nuovo' },
  { id: 3, quando: '2026-09-20', gioco: 'torri',
    testo: '♾️ Finita la campagna ci sono quattro partite libere' },
  { id: 4, quando: '2026-09-20', gioco: 'survivors',
    testo: '🧟 In Survivors arrivano i muri di mostri e due armi nuove' },
  { id: 5, quando: '2026-09-21', gioco: 'mate',
    testo: '🚀 Il volo infinito ha il suo record: fin dove arrivi?' },
  { id: 6, quando: '2026-09-22', gioco: 'fattoria',
    testo: '🐰 Alla fattoria sono arrivati il coniglio e le botteghe' },
]

/* quante righe per gioco, al massimo: è il tetto di chi torna dopo
   tanto tempo, e vale anche per le novità di tutti i giochi */
export const PER_GIOCO = 4

export const ULTIMA = NOVITA.reduce((m, n) => Math.max(m, n.id), 0)

/* ── cosa resta da leggere ──
   Pura, e provata a parte (`test/unita/novita-bambini`): le righe vere
   cambiano, la regola no. Torna i gruppi — uno per gioco, `gioco: null`
   per le novità di tutti — e ogni gruppo ha le sue righe dalla più
   fresca. I gruppi vengono nell'ordine della loro riga più fresca: in
   cima c'è l'ultima cosa successa, che è quella di cui si parla.

   `inCasa` arriva da fuori perché qui non si importa il profilo: chi
   chiama passa quella di `data/portata-giochi.js`, un test una finta. */
export function daLeggere (segno, inCasa = () => true, elenco = NOVITA) {
  const da = typeof segno === 'number' ? segno : 0
  const gruppi = new Map()
  for (const n of [...elenco].sort((a, b) => b.id - a.id)) {
    if (n.id <= da) continue
    if (n.gioco && !inCasa(n.gioco)) continue
    const chi = n.gioco || null
    if (!gruppi.has(chi)) gruppi.set(chi, [])
    const voci = gruppi.get(chi)
    if (voci.length < PER_GIOCO) voci.push(n)
  }
  return [...gruppi].map(([gioco, voci]) => ({ gioco, voci }))
}
