/* ═══════════════════════════════════════════════════════════════════
   DUE LIVELLI SCRITTI A MANO, PER FAR VEDERE COM'È FATTO IL FORMATO

   Non sono i livelli del gioco — quelli staranno in `src/data/generale.js`.
   Sono l'esempio che il validatore controlla ogni volta e che il test
   usa come «livello buono»: se il formato cambia e nessuno li aggiorna,
   diventano rossi subito.

   Chi vuole scrivere il suo legga FORMATO.md e copi uno di questi.
   ═══════════════════════════════════════════════════════════════════ */

export const LIVELLI = [

  /* ─────────────────────────────────────────────────────────────────
     1 ─ IL PORTONE
     L'idea: un ordine dopo l'altro, in fila. Prendi, apri, prendi.
     Le guardie sono lì solo per far vedere che il livello ha una vita
     sua: i loro ordini li firma il livello, non il bambino.
     ───────────────────────────────────────────────────────────────── */
  {
    id: 'portone',
    nome: 'Il portone',
    racconto: [
      'Il tesoro è nella sala grande e il portone è chiuso a chiave.',
      'La chiave è qui nel corridoio: scrivi gli ordini e poi guarda.',
    ],
    mappa: [
      '##############',
      '#....#.......#',
      '#.@..#...T...#',
      '#....#.......#',
      '#..k.P.......#',
      '#....#..g....#',
      '#....#.......#',
      '#....#..l....#',
      '##############',
    ],
    calco: [
      '..............',
      '.BBBB.AAAAAAA.',
      '.BBBB.AAAAAAA.',
      '.BBBB.AAAAAAA.',
      '.BBBB.AAAAAAA.',
      '.BBBB.AAAAAAA.',
      '.BBBB.AAAAAAA.',
      '.BBBB.AAAAAAA.',
      '..............',
    ],
    zone: {
      A: 'sala del tesoro',
      B: 'corridoio',
    },
    fazioni: {
      nostri:  { nome: 'i nostri',  autore: 'giocatore', simboli: '@se' },
      banditi: { nome: 'i banditi', autore: 'livello',   simboli: 'olgc' },
    },
    ordini: [
      { chi: 'guardia', fai: 'pattuglia', bersaglio: 'sala del tesoro', finche: 'vedi:eroe' },
      { chi: 'guardia', quando: 'vedi:eroe', fai: 'chiama', bersaglio: 'rosso' },
      { chi: 'ladra', quando: 'segnale:rosso', fai: 'vai', bersaglio: 'tesoro' },
    ],
    cassetta: ['vai', 'prendi', 'apri', 'aspetta'],
    par: 3,
    dritta: "Il portone non si apre a mani vuote: prima la chiave, poi il portone.",
    varianti: [
      { nome: 'la chiave in fondo', sposta: { k: [1, 7] } },
      { nome: 'la guardia sulla porta', sposta: { g: [6, 4], l: [11, 2] } },
    ],
    soluzioni: [
      { nome: 'in fila', ordini: [
        { chi: 'eroe', fai: 'prendi', bersaglio: 'chiave' },
        { chi: 'eroe', fai: 'apri', bersaglio: 'portone' },
        { chi: 'eroe', fai: 'prendi', bersaglio: 'tesoro' },
      ] },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────
     2 ─ LA RONDA
     L'idea: due unità che si dividono il lavoro, e un'attesa. Il
     soldato distrae la guardia suonando la campana, l'eroe aspetta che
     l'allarme suoni e solo allora attraversa.
     ───────────────────────────────────────────────────────────────── */
  {
    id: 'ronda',
    nome: 'La ronda',
    racconto: [
      'La guardia gira in tondo e non stacca mai gli occhi dal cortile.',
      'In due si può fare: uno la chiama, l\'altro passa.',
    ],
    mappa: [
      '################',
      '#..A...........#',
      '#.....######...#',
      '#.@...#....#...#',
      '#.s...#.T..#...#',
      '#.....#....#...#',
      '#.....###P##...#',
      '#....g.........#',
      '#..............#',
      '################',
    ],
    calco: [
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '.CCCCCCCCCCCCCC.',
      '.CCCCCCCCCCCCCC.',
      '................',
    ],
    zone: {
      C: { nome: 'cortile' },
    },
    fazioni: {
      nostri:  { nome: 'i nostri',  autore: 'giocatore', simboli: '@se' },
      banditi: { nome: 'i banditi', autore: 'livello',   simboli: 'olgc' },
    },
    segnali: ['ritirata'],
    ordini: [
      { chi: 'guardia', fai: 'pattuglia', bersaglio: 'cortile', finche: 'segnale:rosso' },
      { chi: 'guardia', quando: 'segnale:rosso', fai: 'vai', bersaglio: 'campana' },
    ],
    cassetta: ['vai', 'prendi', 'apri', 'aspetta', 'pattuglia', 'chiama'],
    par: 4,
    dritta: 'La campana si sente da lontano. Chi la suona non è chi passa.',
    varianti: [
      { nome: 'la campana lontana', sposta: { A: [13, 1] } },
      { nome: 'la guardia svelta', sposta: { g: [12, 8] } },
    ],
    soluzioni: [
      { nome: 'in due', ordini: [
        { chi: 'soldato', fai: 'vai', bersaglio: 'campana' },
        { chi: 'soldato', fai: 'chiama', bersaglio: 'rosso' },
        { chi: 'eroe', fai: 'aspetta', finche: 'segnale:rosso' },
        { chi: 'eroe', fai: 'prendi', bersaglio: 'tesoro' },
      ] },
    ],
  },
]

export default LIVELLI
