/* ═══════════════════════════════════════════════════════════════════
   CHI SCENDE — quattro, e si sceglie una volta

   Il foglio 0x72 disegna otto personaggi giocabili con le stesse pose
   dell'eroe di prima; quattro sono diventati i quattro modi di scendere
   qua sotto. Non è varietà per la varietà: **la scelta cambia i conti**,
   e li cambia in un modo che si legge in due numeri.

   ── VITA, BRACCIO, E COSA PORTA: TRE COSE, TUTTE E TRE SCRITTE ────
   Per un pezzo gli assi sono stati due — quanto reggi e quanto fai male
   — e la regola scritta qui diceva **due e basta**, perché un tratto in
   più («vede al buio», «trova più gemme») è una cosa da spiegare, e una
   cosa da spiegare in un gioco che non si spiega la sanno solo i
   grandi.

   Il terzo asse c'è, ed è `porta`: quali armi impugna e quale armatura
   veste. La regola di prima non è stata rotta, è stata **presa in
   parola**: un tratto si può aggiungere finché non c'è niente da
   spiegare, e qui non c'è, perché si vede in tre posti e in tutti e tre
   con le figure invece che con le parole.

     1. **prima di scegliere** — la carta della classe porta la sua fila
        di icone («⚔️ spade · 🪓 asce · 🛡️ ferro»), accanto ai due numeri
        di sempre. Si decide sapendo;
     2. **appena la si vede** — una cosa che questa classe non porta lo
        dice addosso alla cosa, nello zaino, per terra e al banco, e dice
        **perché**: «Il mago non impugna le asce». Non un tasto spento,
        che è la sola cosa peggiore di un limite: un limite invisibile;
     3. **si raccoglie e si vende lo stesso.** Il limite è sull'indossare
        e mai sul prendere: un'ascia in mano a un mago vale la metà del
        suo prezzo dal mercante, come per chiunque altro. Un bottino che
        non si può nemmeno raccogliere sarebbe una stanza vuota.

   La differenza fra questo e «vede al buio» è tutta lì: un tratto
   nascosto lo scopri sbagliando e non lo vedi mai; questo lo leggi
   prima di scegliere e te lo ridice la cosa stessa quando la trovi.

   ── PERCHÉ UN LIMITE, E NON QUATTRO CLASSI CHE PORTANO TUTTO ──────
   Perché senza, il bottino non è una scelta: la roba migliore è la
   stessa per tutti, e ogni discesa finisce con lo stesso corredo in
   mano a chiunque. Col limite un forziere è una notizia diversa a
   seconda di chi lo apre, e la classe si sceglie anche per **cosa si
   spera di trovare**. Quello che non si può usare non è buttato: si
   vende, ed è il modo in cui la frustrazione — che ogni tanto ci vuole
   — si trasforma in gemme invece che in muso lungo.

   ── I NUMERI, E PERCHÉ PROPRIO QUESTI ─────────────────────────────
   Il costo di un mostro è le sue ossa diviso il tuo braccio, quindi
   l'attacco è la manopola **velenosa**: fra 3 e 5 il gigante passa da
   nove risposte a cinque. Per questo chi picchia di più regge di meno, e
   per questo nessuno scende sotto braccio 3 — con 2 l'orco costerebbe
   dodici risposte di fila, che non è difficile: è lungo. La difesa
   invece si muove piano (toglie 1 al danno di ogni sbaglio) ed è la
   moneta con cui si paga la vita bassa del mago.

   Chi vince con chi lo dice il banco di prova, non l'occhio:
   `unita/sotterraneo` gioca la campagna con tutti e quattro e controlla
   che nessuno esca dalla seduta.
   ═══════════════════════════════════════════════════════════════════ */

/* ── LE FAMIGLIE: IL VOCABOLARIO CHE LE COSE E LE CLASSI CONDIVIDONO ──
   Un oggetto dichiara **a chi serve** (`famiglia` in `dati/cose.js`) e
   una classe dichiara **cosa porta** (`porta`, qui sotto): il motore
   chiede, e non c'è nessun `if` col nome di un eroe dentro. È la stessa
   forma di `RAMI` nel castello e dei manifesti dei giochi — chi decide
   è il dato, non il codice che lo legge.

   Quello che **non ha famiglia lo porta chiunque**, ed è la parte più
   grossa del catalogo: i sei scudi, i gioielli, le pozioni, il
   panciotto di cuoio, il pugnale. Non è una dimenticanza. La mano debole
   è già limitata dalla regola delle due mani, e un secondo limite sullo
   stesso posto punirebbe due volte proprio le classi che impugnano
   pesante; il cuoio è la prima armatura che si trova, e negarla a
   qualcuno vorrebbe dire mandarlo giù nudo per due piani; un pugnale lo
   impugna chiunque, e per un mago è l'unica lama che possa toccare.

   `verbo` e `nome` servono a comporre la riga che dice perché no —
   «Il mago non impugna le asce» — che si scrive **una volta sola**
   (`nonLaPorta`) e compare identica nei tre posti in cui una cosa si
   guarda. */
export const FAMIGLIE = {
  spade: { em: '⚔️', corto: 'spade', nome: 'le spade', verbo: 'impugna' },
  asce: { em: '🪓', corto: 'asce', nome: 'le asce', verbo: 'impugna' },
  archi: { em: '🏹', corto: 'archi', nome: 'gli archi', verbo: 'impugna' },
  bacchette: { em: '🪄', corto: 'bacchette', nome: 'le bacchette', verbo: 'impugna' },
  /* Il ferro para di suo, la stoffa deve parare per intero: è il motivo
     per cui il pezzo di stoffa migliore (il manto, 🛡️ 3) para più del
     ferro migliore (la corazza, 🛡️ 2). Chi veste ferro l'armatura ce
     l'ha già addosso alla pelle — il nano para 2 nudo, il cavaliere 1 —
     e chi veste stoffa parte da uno e da zero. I quattro si ritrovano
     tutti fra 3 e 4, che è dove devono stare. */
  ferro: { em: '🛡️', corto: 'ferro', nome: 'il ferro', verbo: 'veste' },
  stoffa: { em: '🧥', corto: 'stoffa', nome: 'la stoffa', verbo: 'veste' },
}

export const EROI = [
  { chiave: 'cavaliere', nome: 'Cavaliere', em: '🛡️', sprite: 'cavaliere',
    chi: 'il cavaliere',
    vita: 18, att: 3, dif: 1,
    porta: ['spade', 'asce', 'ferro'],
    dice: 'Tiene botta. Se non sai chi scegliere, è questo.' },

  { chiave: 'elfa', nome: 'Elfa', em: '🧝', sprite: 'elfa',
    chi: 'l\'elfa',
    vita: 15, att: 4, dif: 1,
    porta: ['spade', 'archi', 'stoffa'],
    dice: 'Colpisce più forte, e regge un po\' meno.' },

  /* ── il mago, e la sua fila sola ──
     Una famiglia d'arma invece di due: è il prezzo del braccio 5, ed è
     anche il ritratto — un mago impugna la magia e nient'altro. La fila
     resta **completa** (verga, bastone, scettro: un'arma per gradino,
     che è il minimo perché il gioco del bottino esista anche per lui),
     e le due cose che lo tenevano in piedi non gliele toglie nessuno:
     lo scudo — che con lo scettro a una mano adesso può davvero
     imbracciare — e il manto, che para 3 e para per la pelle che non
     ha. Con lo scettro a due mani, com'era prima, questo mago non
     avrebbe retto: è la misura che l'ha detto, non l'occhio. */
  { chiave: 'mago', nome: 'Mago', em: '🧙', sprite: 'mago',
    chi: 'il mago',
    vita: 12, att: 5, dif: 0,
    porta: ['bacchette', 'stoffa'],
    dice: 'I mostri cadono in metà risposte. Ma ogni sbaglio fa malissimo.' },

  { chiave: 'nano', nome: 'Nano', em: '🧔', sprite: 'nano',
    chi: 'il nano',
    vita: 20, att: 3, dif: 2,
    porta: ['asce', 'archi', 'ferro'],
    dice: 'Sbagliare gli fa quasi il solletico. Non cade quasi mai.' },
]

export const DI_PARTENZA = 'cavaliere'

export const eroeDi = chiave => EROI.find(e => e.chiave === chiave) || EROI[0]

/* ── la domanda, in un posto solo ──
   Prende la **scheda** di una cosa e non la sua chiave, così questo file
   non ha bisogno di conoscere il catalogo: chi chiede ce l'ha già in
   mano. Senza famiglia se la mette chiunque, ed è il caso più comune. */
export const portaLa = (eroe, cosa) =>
  !cosa || !cosa.famiglia || (eroe.porta || []).includes(cosa.famiglia)

/* La riga che compare addosso alla cosa: «Il mago non impugna le asce».
   Torna '' quando non c'è niente da dire, così chi disegna nasconde la
   riga invece di mostrarne una vuota — la stessa forma di `cambioDetto`
   in `viste/cambio.js`. La maiuscola si mette qui e non nel dato: nel
   dato «il mago» serve anche in mezzo a una frase. */
export function nonLaPorta(eroe, cosa) {
  if (!eroe || portaLa(eroe, cosa)) return ''
  const f = FAMIGLIE[cosa.famiglia]
  if (!f) return ''
  const detto = `${eroe.chi} non ${f.verbo} ${f.nome}`
  return detto.charAt(0).toUpperCase() + detto.slice(1)
}

export function guastiDegliEroi() {
  const g = []
  const viste = new Set()
  const portate = new Set()
  for (const e of EROI) {
    if (viste.has(e.chiave)) g.push(`due eroi con la chiave "${e.chiave}"`)
    viste.add(e.chiave)
    if (!e.nome || !e.em || !e.dice) g.push(`${e.chiave}: senza nome, emoji o frase`)
    if (!e.chi) g.push(`${e.chiave}: non sa come si chiama in mezzo a una frase`)
    /* Le tre righe qui sotto sono il patto del terzo asse. Una classe
       senza niente da impugnare gioca a mani nude tutta la campagna;
       una famiglia che non porta nessuno è uno scaffale di catalogo che
       nel gioco non compare mai, e nessuno se ne accorgerebbe. */
    for (const f of e.porta || []) {
      if (!FAMIGLIE[f]) g.push(`${e.chiave}: porta "${f}", che non è una famiglia`)
      portate.add(f)
    }
    if (!(e.porta || []).length) g.push(`${e.chiave}: non porta niente`)
    if (!e.sprite) g.push(`${e.chiave}: senza sprite, e a schermo sarebbe un buco`)
    /* Il pavimento: sotto braccio 3 il colpo sull'orco scende a 1 e
       abbatterlo costa dodici risposte di fila. Non è difficile, è lungo
       — ed è il modo di far chiudere il gioco. */
    if (e.att < 3) g.push(`${e.chiave}: braccio ${e.att}, i mostri diventano lunghi invece che duri`)
    /* Il pavimento della vita. Undici e non quattordici da quando le
       discese si possono perdere (`SVENIMENTI_IN_REGALO`): la vita è
       scesa di un quarto su tutta la fila perché con quella di prima si
       arrivava in fondo anche rispondendo a caso, e la soglia doveva
       scendere con lei o avrebbe bocciato il mago, che è fragile per
       mestiere. Sotto undici però un colpo pieno di orco (4, e il mago
       non para) vale un terzo della vita: tre sbagli e si è a terra
       prima di aver capito com'è fatta la stanza. */
    if (e.vita < 11) g.push(`${e.chiave}: ${e.vita} di vita, si sviene al terzo sbaglio`)
    if (e.dif < 0) g.push(`${e.chiave}: difesa sotto zero`)
  }
  if (!EROI.some(e => e.chiave === DI_PARTENZA))
    g.push(`chi si parte (${DI_PARTENZA}) non è fra gli eroi`)
  for (const f of Object.keys(FAMIGLIE))
    if (!portate.has(f)) g.push(`la famiglia "${f}" non la porta nessuno: è catalogo morto`)
  for (const [k, f] of Object.entries(FAMIGLIE))
    if (!f.em || !f.corto || !f.nome || !f.verbo)
      g.push(`famiglia ${k}: senza icona, nome o verbo, e la riga del perché no non si scrive`)
  return g
}
