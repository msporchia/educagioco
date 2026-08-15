/* ═══════════════════════════════════════════════════════════════════
   🦆 BIBI ALLO STAGNO — capitolo 1: 🥖 IL PANE
   forma: presa · concetto: la fila

   PER CHI È. Per una bambina di sei anni che legge male. Da qui
   discende tutto il resto del file: dieci parole per riga, tre ordini
   in croce, un premio che si vede (il pane in mano a Rosa), nessuna
   condizione, nessun segnale, nessun nemico. Non si perde: una scena
   può non riuscire, e allora si riguarda.

   LA STORIA. Rosa ha una papera e la papera si chiama Bibi. Bibi ha
   fame, e l'unica cosa che ascolta è il pane. Il pane è in cucina, e
   fra Rosa e la cucina ci sono due cose chiuse: il cancello dell'aia
   e la porta di casa.

   IL CONCETTO: LA FILA. Tre ordini, uno dietro l'altro, e l'ordine
   conta perché la seconda cosa sta dietro la prima. Chi scrive «apri
   la porta» per prima manda Rosa a spingere il cancello chiuso, e lì
   si ferma: **quello che non hai scritto non succede**. Camminare Rosa
   lo sa fare da sé — `apri` e `prendi` ci vanno di loro — quindi
   l'unico modo di sbagliare è saltare un ordine o metterli storti.

   FORMA DELL'OBIETTIVO: *presa*. Alla fine il pane dev'essere addosso
   a Rosa. Dove finisce, non conta.

   EREDITA: niente, è il primo capitolo. La cassetta è di tre verbi —
   `vai`, `prendi`, `apri` — e le cose nominabili sono tre: il
   cancello, la porta, il pane.

   LASCIA: **il pane**, in tasca a Rosa. È il filo di tutta la storia:
   nel capitolo 2 fa venire Bibi, nel terzo la tiene dietro, nel quarto
   la fa scendere in acqua.

   LA MAPPA (24×14). Un cortile di campagna, tutto all'aperto tranne
   la cucina. Da sinistra a destra ci sono tre stanze in fila, e in
   mezzo a ognuna una cosa chiusa:
     · l'aia dove gioca Rosa (x1-9), col melo in mezzo;
     · il cortile davanti a casa (x11-22, in basso), col fienile;
     · la cucina (x16-22, in alto), dove sta il pane.
   Il cancello (10,8) è l'unico buco nella siepe, la porta (15,3)
   l'unico buco nel muro di casa. Le tre scene spostano il pane dentro
   la cucina e Rosa dentro l'aia: la fila da scrivere resta quella.
   ═══════════════════════════════════════════════════════════════════ */

/* un ordine è verbo + complemento, e basta */
const o = (verbo, complemento) => ({ verbo, complemento })

/* 24 colonne per 14 righe.
     x10        la siepe, da cima a fondo: il buco è il cancello (10,8)
     x15, y5    il muro di casa: il buco è la porta della cucina (15,3)
     4-5,4-5    il melo dell'aia
     15-16,9-10 il fienile */
const CORTILE_DI_ROSA = [
  '########################',
  '#.........#....#.......#',
  '#.........#....#.......#',
  '#.........#............#',
  '#...##....#....#.......#',
  '#...##....#....#########',
  '#.........#............#',
  '#.........#............#',
  '#......................#',
  '#.........#....##......#',
  '#.........#....##......#',
  '#.........#............#',
  '#.........#............#',
  '########################',
]

const BIBI_1 = {
  id: 'pane', nome: 'Il pane',
  storia: 'bibi', capitolo: 1, emoji: '🥖',
  forma: 'presa', concetto: 'sequenza',
  idea: 'Un ordine dopo l\'altro, nella fila giusta',

  dritta: 'Un ordine alla volta, dal primo all\'ultimo.<br>Il cancello viene prima della porta.',
  racconto: 'Rosa ha una papera. Si chiama Bibi.<br>Bibi ha fame. Il pane è in cucina.<br>Il cancello è chiuso. Anche la porta.<br>Hai vinto quando Rosa ha <b>il pane</b>.',
  aiuti: [
    'Un ordine è un verbo e una cosa.',
    'Rosa cammina da sola. Tu dici solo dove.',
    'Apri il cancello. Apri la porta. Prendi il pane.',
  ],

  griglia: CORTILE_DI_ROSA, ambiente: 'cortile',

  nomi: {
    cancello: 'il cancello',
    porta: 'la porta della cucina',
    pane: 'il pane',
  },
  porte: {
    cancello: { x: 10, y: 8 },
    porta: { x: 15, y: 3 },
  },
  /* l'icona la dichiara l'oggetto: senza `em` uscirebbe una chiave */
  oggetti: [
    { nome: 'pane', em: '🥖', x: 19, y: 2 },
  ],

  unita: [
    { id: 'rosa', nome: 'Rosa', fazione: 'rosa', emoji: '👧', chi: 'ladra',
      vista: 5, vita: 3, x: 2, y: 10, sa: ['vai', 'prendi', 'apri'] },
  ],
  fazioni: { rosa: { nome: 'Rosa', autore: 'giocatore' } },

  /* tre cose e basta: il cancello, la porta, il pane */
  complementi: ['cancello', 'porta', 'pane'],

  obiettivo: [{ cond: 'hai', chi: 'rosa', complemento: 'pane' }],

  /* Tre scene: il pane si sposta dentro la cucina, Rosa dentro l'aia.
     Le due cose chiuse restano dove sono, e la fila non cambia. */
  varianti: [
    { nome: 'il pane sul tavolo',
      oggetti: { pane: { x: 19, y: 2 } }, unita: { rosa: { x: 2, y: 10 } } },
    { nome: 'il pane sulla sedia',
      oggetti: { pane: { x: 17, y: 4 } }, unita: { rosa: { x: 8, y: 2 } } },
    { nome: 'il pane sulla mensola bassa',
      oggetti: { pane: { x: 21, y: 4 } }, unita: { rosa: { x: 5, y: 11 } } },
  ],

  soluzioni: [
    { nome: 'il cancello, la porta, il pane', piano: { rosa: [
      o('apri', 'cancello'), o('apri', 'porta'), o('prendi', 'pane'),
    ] } },
    /* la stessa fila con una passeggiata in più davanti: vince uguale,
       e costa un ordine. Il par premia quella corta senza vietare
       questa — ed è per questo che è marcata `lunga`: è l'unica in cui
       un ordine si può togliere senza perdere. */
    { nome: 'passando dal cancello', lunga: true, piano: { rosa: [
      o('vai', 'cancello'), o('apri', 'cancello'), o('apri', 'porta'),
      o('prendi', 'pane'),
    ] } },
  ],

  /* ── QUELLO CHE QUESTO CAPITOLO HA DI SUO ──
     Le prove particolari si dichiarano qui, e le esegue il banco di
     prova dei livelli (`test/aiuto/livello.mjs`): la verifica e la
     scena cambiano insieme, e nessuno deve più scriversi uno script per
     sapere se una cosa è ancora vera. Il contratto — quali prove
     esistono e come si scrivono — è in testa a quel file. */
  verifiche: {
    /* la lezione del capitolo, quella scritta lassù in testa: chi apre
       la porta per prima manda Rosa a spingere il cancello chiuso, e lì
       si ferma */
    ordineConta: [['apri cancello', 'apri porta']],
    /* e il cancello è l'unico buco nella siepe: senza, in cucina non ci
       si arriva da nessun'altra parte */
    senza: ['cancello'],
  },
}

export default BIBI_1
export { BIBI_1 }
