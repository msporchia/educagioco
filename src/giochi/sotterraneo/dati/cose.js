/* ═══════════════════════════════════════════════════════════════════
   COSA SI TROVA, E COSA DICE UNA PORTA

   Tre caselle addosso — la mano, il corpo, il dito — e sei tasche
   (`TASCHE` in `mondo.js`). Le tasche non sono decorazione: sono **il
   limite**. Uno zaino pieno vuol dire scegliere cosa lasciare per terra,
   ed è la stessa domanda del bivio fatta con le mani invece che con una
   freccia.

   ── QUATTRO FAMIGLIE D'ARMA, TRE GRADINI L'UNA ────────────────────
   Spade, asce, archi e bacchette: **valgono lo stesso**, a parità di
   gradino. È la stessa regola dei due rami di una torre nel castello —
   cambia la forma, mai la quantità — e senza di quella regola il gioco
   avrebbe una famiglia giusta e tre da evitare, che è peggio di averne
   una sola. Quello che cambia davvero è il gradino: +1, +2, +3, e si
   legge nel confronto («⚔️ +1 rispetto alla spada corta») senza dover
   sapere niente d'altro.

   ── LE ARMATURE NON HANNO UNO SPRITE, E SI VEDE ───────────────────
   Né 0x72 né il foglio degli oggetti disegnano un'armatura o uno scudo:
   in tutti e due i fogli si equipaggiano solo le mani. Panciotto,
   corazza e manto restano quindi **emoji**, e stonano in mezzo a uno
   schermo disegnato a mano. È il buco che decide se un set basta, e va
   guardato prima di innamorarsene; qui si dichiara `sprite: null`
   invece di puntare a un pezzo che non c'è, perché un nome sbagliato si
   presenta a schermo come un buco senza dire perché.

   ── IL GIOIELLO È L'UNICA COSA CHE NON PICCHIA ────────────────────
   Al dito ci va qualcosa che cambia **come si gira**, non quanto si fa
   male: vedere più lontano, tornare su con più gemme, reggere un colpo
   in più. È il posto dove sta la varietà che le armi non hanno, e ce n'è
   uno solo addosso: si sceglie.

   ── IL PREZZO È DAL MERCANTE, NON PER TERRA ───────────────────────
   `prezzo` serve solo al banco del mercante: quello che si trova in
   giro non costa niente, si raccoglie toccandolo.
   ═══════════════════════════════════════════════════════════════════ */

/* I tre gradini, uguali per tutte le famiglie: il numero sta qui una
   volta sola, così una famiglia nuova non può nascere sbilanciata. */
const GRADINI = [
  { att: 1, prezzo: 8 },
  { att: 2, prezzo: 16 },
  { att: 3, prezzo: 26 },
]

/* ── una mano o due ──
   `mani: 2` vuol dire che l'arma **occupa anche la sinistra**: un
   bastone, un arco, uno spadone non si tengono con una mano sola, e nel
   corredo la casella di sinistra mostra la stessa arma in ombra invece
   di restare vuota — così si vede *perché* non ci si può mettere niente
   altro, che è la sola cosa che un elenco di caselle non dice mai.

   Chi ne ha una sola ne può portare due, ed è il patto: le armi
   leggere si sdoppiano, quelle pesanti no. Due armi di secondo gradino
   valgono un terzo gradino (vedi `attaccoMancino` in `motore/corsa.js`:
   la sinistra colpisce la metà), quindi la scelta resta una scelta e
   non una scorciatoia. */
const arma = (grado, nome, sprite, dice, mani = 1) => ({
  em: '⚔️', nome, sprite, dove: 'mano', grado, mani,
  att: GRADINI[grado - 1].att, prezzo: GRADINI[grado - 1].prezzo, dice,
})

export const COSE = {
  /* ── le spade: quello che tutti si aspettano di trovare ── */
  'spada-corta': arma(1, 'Spada corta', 'spada-corta', 'I mostri cadono un po\' prima.'),
  spada: arma(2, 'Spada', 'spada', 'Ogni risposta giusta fa più male.'),
  spadone: arma(3, 'Spadone', 'spadone', 'Anche i grossi cadono in pochi colpi. Due mani.', 2),

  /* ── le asce: pesanti, e si vede ── */
  accetta: arma(1, 'Accetta', 'accetta', 'Piccola, ma taglia.'),
  ascia: arma(2, 'Ascia', 'ascia', 'Due mani, e si sente.', 2),
  bipenne: arma(3, 'Bipenne', 'bipenne', 'Una lama per parte: non perdona. Due mani.', 2),

  /* ── gli archi: la stessa forza, da lontano ── */
  'arco-corto': arma(1, 'Arco corto', 'arco-corto', 'Colpisce prima che ti arrivino addosso. Due mani.', 2),
  'arco-lungo': arma(2, 'Arco lungo', 'arco-lungo', 'Freccia lunga, colpo pesante. Due mani.', 2),
  balestra: arma(3, 'Balestra', 'balestra', 'Un colpo solo, e fa un buco. Due mani.', 2),

  /* ── le bacchette: per chi scende da mago ── */
  verga: arma(1, 'Verga', 'verga', 'Una scintilla a ogni risposta giusta.'),
  'bastone-magico': arma(2, 'Bastone magico', 'bastone-magico', 'La punta brucia. Due mani.', 2),
  scettro: arma(3, 'Scettro', 'scettro', 'Quello che tocca non si rialza. Due mani.', 2),

  /* ── quello che si mette addosso: emoji, per ora ── */
  panciotto: { em: '🦺', nome: 'Panciotto', sprite: null, dove: 'corpo', dif: 1, prezzo: 9,
               dice: 'Sbagliare fa un po\' meno male.' },
  corazza: { em: '🛡️', nome: 'Corazza', sprite: null, dove: 'corpo', dif: 2, prezzo: 18,
             dice: 'Sbagliare fa molto meno male.' },
  manto: { em: '🧥', nome: 'Manto', sprite: null, dove: 'corpo', dif: 3, prezzo: 28,
           dice: 'Sbagliare non fa quasi più male.' },

  /* ── quello che si porta al dito ── */
  'anello-ambra': { em: '💍', nome: 'Anello d\'ambra', sprite: 'anello-ambra', dove: 'dito',
                    luce: 2.5, prezzo: 14, dice: 'Al buio vedi molto più lontano.' },
  'anello-verde': { em: '💚', nome: 'Anello verde', sprite: 'anello-verde', dove: 'dito',
                    gemme: 0.5, prezzo: 16, dice: 'Ogni gemma che raccogli ne vale una e mezza.' },
  'amuleto-rosso': { em: '❤️', nome: 'Amuleto rosso', sprite: 'amuleto-rosso', dove: 'dito',
                     vita: 6, prezzo: 18, dice: 'Sei punti di vita in più, finché lo porti.' },
  medaglione: { em: '🥇', nome: 'Medaglione', sprite: 'medaglione', dove: 'dito',
                dif: 1, prezzo: 15, dice: 'Para un pochino, come mezza corazza.' },

  /* ═══ LE TRE ARMI CHE HANNO UN NOME PROPRIO ═══
     Le quattro famiglie valgono lo stesso a parità di gradino, ed è la
     regola che tiene in piedi tutto il resto (vedi in cima). Queste tre
     non la rompono: **stanno un gradino sopra la scala**, non dentro.
     Non ce n'è una per famiglia — sono pezzi unici, come si conviene a
     una cosa che ha un nome — e quello che le distingue non è quanto
     fanno male, ma **un tratto che di solito sta al dito**: fanno luce,
     fruttano di più, tengono in piedi. È lo stesso mestiere dei
     gioielli, portato in mano.

     Perché si possa scegliere davvero, nessuna delle tre batte lo
     spadone sul suo terreno: due su tre hanno il suo stesso braccio, e
     il pugnale ne ha meno. Si comprano care, e si trovano solo in fondo
     a un forziere. */
  'spada-fiammeggiante': {
    em: '🔥', nome: 'Spada fiammeggiante', sprite: 'arma-3', dove: 'mano', mani: 2,
    att: 3, luce: 2, prezzo: 36,
    dice: 'La lama brucia di suo: al buio vedi molto più lontano. Due mani.',
  },
  'ascia-del-ladro': {
    em: '💰', nome: 'Ascia del ladro', sprite: 'arma-2', dove: 'mano', mani: 2,
    att: 3, gemme: 0.5, prezzo: 34,
    dice: 'Ogni gemma che raccogli ne vale una e mezza.',
  },
  'pugnale-vampiro': {
    em: '🩸', nome: 'Pugnale vampiro', sprite: 'arma-1', dove: 'mano', mani: 1,
    att: 2, vita: 6, prezzo: 30,
    dice: 'Corto e cattivo: finché lo tieni, sei punti di vita in più.',
  },

  /* ── altre due cose da portarsi addosso ── */
  'amuleto-osso': { em: '🦴', nome: 'Amuleto d\'ossa', sprite: 'ossa', dove: 'dito',
                    dif: 1, vita: 4, prezzo: 24,
                    dice: 'Para un pochino, e ti tiene in piedi un po\' di più.' },
  'teschio-cercatore': { em: '💀', nome: 'Teschio del cercatore', sprite: 'scena-teschio',
                         dove: 'dito', gemme: 1, prezzo: 32,
                         dice: 'Ogni gemma che raccogli vale il doppio.' },

  /* ── quello che si usa e finisce ── */
  'pozione-piccola': { em: '🧪', nome: 'Boccetta', sprite: 'pozione-piccola', usa: 'cura', cura: 6,
                       prezzo: 6, dice: 'Sei punti di vita, subito.' },
  pozione: { em: '🧪', nome: 'Pozione', sprite: 'pozione', usa: 'cura', cura: 10, prezzo: 10,
             dice: 'Dieci punti di vita, subito.' },
  'pozione-grande': { em: '🍷', nome: 'Ampolla', sprite: 'pozione-grande', usa: 'cura', cura: 18,
                      prezzo: 16, dice: 'Diciotto punti di vita: ti rimette in piedi.' },
  /* L'unica cosa che si beve e **non torna indietro**: alza la vita
     massima per il resto della discesa, quindi vale di più giù in fondo
     che al primo piano — ed è il motivo per cui si tengono da parte le
     gemme invece di spenderle subito. */
  'elisir-toro': { em: '🐂', nome: 'Elisir del toro', sprite: 'pozione-rossa',
                   usa: 'cresci', cresce: 3, prezzo: 22,
                   dice: 'Tre punti di vita massima, per tutta la discesa.' },
  /* ── la torcia non si accende: si ha ──
     Era una cosa da usare: la raccoglievi, occupava una tasca, e poi
     bisognava aprire lo zaino e premere «l'accendo». Ma quella scelta
     non è una scelta — non esiste il momento in cui uno preferisce
     restare al buio — ed era per giunta l'unico modo di scoprire che la
     torcia serviva a qualcosa. Adesso si accende **appena la prendi**,
     e non entra nemmeno nello zaino: una tasca in meno da spendere per
     una cosa che non si può sbagliare. */
  torcia: { em: '🔦', nome: 'Torcia', sprite: 'torcia', usa: 'luce', prezzo: 7,
            dice: 'La prendi e si accende: da lì in avanti vedi più lontano.' },
  chiave: { em: '🗝️', nome: 'Chiave', sprite: 'chiave-oro', usa: 'porta', prezzo: 6,
            dice: 'Apre una porta senza rispondere.' },
}

export const CHIAVI_COSE = Object.keys(COSE)

/* Le armi per gradino: chi deve pescare «un'arma da orco» chiede il
   gradino e non un elenco scritto a mano, che si scollerebbe il giorno
   in cui si aggiunge una famiglia. */
export const ARMI_DI = grado =>
  CHIAVI_COSE.filter(k => COSE[k].dove === 'mano' && COSE[k].grado === grado)

/* Quello che il mercante può avere in banco, e quello che salta fuori da
   un forziere. Sono due elenchi diversi apposta: dal forziere non escono
   chiavi né boccette — è la cosa che si è pagata cara, e deve valere. */
export const IN_VENDITA = CHIAVI_COSE.filter(k => COSE[k].prezzo)
export const NEI_FORZIERI = [
  ...ARMI_DI(2), ...ARMI_DI(3),
  'corazza', 'manto',
  'anello-ambra', 'anello-verde', 'amuleto-rosso', 'medaglione',
  'amuleto-osso', 'teschio-cercatore',
  'spada-fiammeggiante', 'ascia-del-ladro', 'pugnale-vampiro',
  'pozione-grande', 'elisir-toro', 'torcia',
]

/* ── quello che una porta chiusa lascia intravedere ──
   È l'informazione con cui si sceglie dove andare, quindi **non mente
   mai**: dietro un teschio c'è davvero una guardia. Se un segno
   promettesse a vuoto diventerebbe una decorazione, e in due minuti
   nessuno lo guarderebbe più — e con lui se ne andrebbe l'unico motivo
   per cui tornare indietro è una scelta invece che una penitenza. */
export const SEGNI = {
  guardia: { em: '💀', dice: 'C\'è qualcosa di grosso, là dentro.' },
  tesoro: { em: '💎', dice: 'Da qui si sente odore di roba buona.' },
  mercante: { em: '🏪', dice: 'Qualcuno, là dentro, vende.' },
  fonte: { em: '⛲', dice: 'Si sente acqua.' },
  vuoto: { em: '·', dice: 'Non si sente niente.' },
}

/* `nomi` sono i pezzi che l'atlante ha davvero, e arrivano **da fuori**:
   questo file non importa la grafica, o il motore smetterebbe di girare
   in Node senza schermo. Uno sprite dichiarato e non ritagliato non dà
   nessun errore — si vede l'emoji al suo posto, che è il ripiego di
   tutto il gioco — e quindi è un difetto che solo un controllo trova. */
export function guastiDelleCose(nomi = null) {
  const g = []
  if (nomi) for (const [k, c] of Object.entries(COSE))
    if (c.sprite && !nomi.includes(c.sprite))
      g.push(`${k}: nell'atlante non c'è lo sprite "${c.sprite}"`)
  for (const [k, c] of Object.entries(COSE)) {
    if (!c.em || !c.nome) g.push(`${k}: senza emoji o senza nome`)
    if (!c.dice) g.push(`${k}: non dice cosa fa, e il mercante lo mostra`)
    if (!c.dove && !c.usa) g.push(`${k}: né si indossa né si usa, quindi non fa niente`)
    if (c.dove && !['mano', 'corpo', 'dito'].includes(c.dove)) g.push(`${k}: si indossa su "${c.dove}"?`)
    if (c.usa === 'cura' && !c.cura) g.push(`${k}: cura zero`)
    /* un gioiello che non dà niente è una tasca sprecata con l'aria di
       essere un premio */
    if (c.dove === 'dito' && !(c.luce || c.gemme || c.vita || c.dif))
      g.push(`${k}: al dito, ma non fa niente`)
  }
  /* le quattro famiglie devono valere lo stesso, gradino per gradino:
     è la condizione perché scegliere l'arma sia una questione di gusto
     e non una trappola per chi sceglie male */
  for (const grado of [1, 2, 3]) {
    const armi = ARMI_DI(grado)
    if (armi.length < 2) { g.push(`gradino ${grado}: solo ${armi.length} arma`); continue }
    const forze = new Set(armi.map(k => COSE[k].att))
    if (forze.size > 1)
      g.push(`gradino ${grado}: armi di forza diversa (${[...forze].join(', ')}), una famiglia sarebbe da evitare`)
    const prezzi = new Set(armi.map(k => COSE[k].prezzo))
    if (prezzi.size > 1) g.push(`gradino ${grado}: stesse armi, prezzi diversi`)
  }
  for (let grado = 2; grado <= 3; grado++)
    if (COSE[ARMI_DI(grado)[0]].att <= COSE[ARMI_DI(grado - 1)[0]].att)
      g.push(`il gradino ${grado} non picchia più del ${grado - 1}`)

  /* Le armi che hanno un nome proprio stanno **fuori** dalla scala (non
     dichiarano `grado`), e la regola che le tiene oneste è questa: non
     picchiano più forte dell'ultimo gradino — se no la scala non
     servirebbe più a niente — e in cambio portano un tratto. Un'arma
     unica senza tratto e senza gradino sarebbe solo una copia con un
     altro disegno. */
  const cima = COSE[ARMI_DI(3)[0]].att
  for (const [k, c] of Object.entries(COSE)) {
    if (c.dove !== 'mano' || c.grado) continue
    if (c.att > cima) g.push(`${k}: picchia ${c.att}, più dell'ultimo gradino (${cima})`)
    if (!(c.luce || c.gemme || c.vita || c.dif))
      g.push(`${k}: arma fuori scala senza niente di suo, è una copia con un altro nome`)
  }

  for (const k of NEI_FORZIERI) if (!COSE[k]) g.push(`nei forzieri c'è "${k}", che non esiste`)
  if (!IN_VENDITA.length) g.push('il mercante non ha niente da vendere')
  for (const [k, s] of Object.entries(SEGNI))
    if (!s.em || !s.dice) g.push(`segno ${k}: senza emoji o senza frase`)
  return g
}
