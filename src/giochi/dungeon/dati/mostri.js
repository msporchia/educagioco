/* ═══════════════════════════════════════════════════════════════════
   GLI AMBIENTI E CHI CI ABITA — il vestito di una tappa, e le sue ossa

   Il gioco non cambia mai: cambia dove si scende e chi ci si trova.
   Nove tappe con gli stessi tre ragni sono la stessa discesa nove
   volte, e a metà campagna non ci si torna più. A un bambino «adesso si
   scende nelle fogne» dice molto più di «adesso tocca al livello 5».

   Un ambiente porta:
     accento   il colore di tutto: bollini, sentieri, cartelli
     pietra    il fondo della caverna, che il pittore schiarisce da sé
     mostri    i tre normali, grossi i due cattivi, capi i due di fine
               piano, boss il padrone di casa
     bossNome  come si chiama, che è metà della paura

   ── CHI CI ABITA SONO NOMI DI CREATURE, NON EMOJI ──
   Per un pezzo di strada sono state emoji, e a un certo punto non
   reggevano più: un'emoji la disegna il telefono, non il gioco, quindi
   ha lo stile di Apple in mezzo a uno schermo disegnato a mano, non si
   può tingere dell'ambiente in cui sta, non trema quando la colpisci e
   su due telefoni diversi non è nemmeno la stessa figura. I nomi qui
   sotto sono quelli di `grafica/bestiario/`, dove ognuno è disegnato.
   Un nome che lì non esiste **non è un errore silenzioso**: il pittore
   ripiega su un'altra creatura, ma `unita/bestiario` lo trova prima —
   è lui a mettere questo elenco accanto a quello delle creature
   disegnate, perché qui dentro la grafica non entra.

   L'ambiente è **solo il vestito**: quanto picchia un mostro non
   dipende da che faccia ha. Le ossa — vita, attacco, difesa — stanno
   in `TAGLIE`, in fondo a questo file, e dipendono da due cose sole:
   che taglia è (normale, grosso, guardiano) e quanto si è scesi.

   ── I QUATTRO MAZZI SONO UNA SCALA, NON QUATTRO ELENCHI ──
   Le ossa crescono di taglia in taglia, e la figura deve crescere
   insieme a loro: se il capo del piano — quello con la vita tripla e
   che non si può nemmeno evitare — si presenta come uno scorpione,
   il bambino non legge «attento», legge «un altro insetto». Per un
   po' i capi hanno pescato dal mazzo dei grossi ed era esattamente
   quello che succedeva. Dentro un ambiente le quattro file vanno
   lette in fila, dalla bestiola al padrone di casa:

       mostri            →  grossi              →  capi              →  boss
       ragno topo verme     scorpione serpe        vampiro spettro      zombi

   Chi ritocca un mazzo controlla che la fila regga ancora a occhio:
   nessun controllo automatico sa che un pipistrello fa meno paura di
   un orso, e a schermo la differenza la fa anche la stazza della
   figura (`scena/bestia.js`, `STAZZE`), che cresce con la taglia.
   ═══════════════════════════════════════════════════════════════════ */

export const AMBIENTI = {
  cantina: {
    nome: 'ragni e topi', icona: '🕯️', accento: '#a06fe0', pietra: '#241f33',
    mostri: ['ragno', 'topo', 'verme'], grossi: ['scorpione', 'serpe'],
    capi: ['vampiro', 'spettro'], boss: 'zombi', bossNome: 'Lo Zombi Impolverato',
  },
  cripta: {
    nome: 'ossa e fantasmi', icona: '💀', accento: '#8b8bf0', pietra: '#1d1c33',
    mostri: ['spettro', 'topo', 'ragno'], grossi: ['stregone', 'vampiro'],
    capi: ['zombi', 'golem'], boss: 'scheletro', bossNome: 'Il Re delle Ossa',
  },
  grotta: {
    nome: 'pipistrelli e serpenti', icona: '🪨', accento: '#4fb3e0', pietra: '#182430',
    mostri: ['pipistrello', 'serpe', 'verme'], grossi: ['ragno', 'cinghiale'],
    capi: ['lupo', 'troll'], boss: 'golem', bossNome: 'Il Colosso di Pietra',
  },
  fungaia: {
    nome: 'bestie della muffa', icona: '🍄', accento: '#4fce7c', pietra: '#152a1f',
    mostri: ['rana', 'ragno', 'granchio'], grossi: ['scorpione', 'cinghiale'],
    capi: ['troll', 'orco'], boss: 'verme', bossNome: 'Il Vermone delle Radici',
  },
  fogne: {
    nome: 'roba d\'acqua', icona: '💧', accento: '#3fa6a0', pietra: '#132628',
    mostri: ['rana', 'topo', 'pipistrello'], grossi: ['serpe', 'verme'],
    capi: ['orco', 'troll'], boss: 'granchio', bossNome: 'Il Granchione della Fogna',
  },
  fucina: {
    nome: 'orchi e bestioni', icona: '🔥', accento: '#ff8a3d', pietra: '#301a16',
    mostri: ['goblin', 'topo', 'ragno'], grossi: ['cinghiale', 'orco'],
    capi: ['golem', 'zombi'], boss: 'troll', bossNome: 'Il Fabbro Furioso',
  },
  ghiacciaia: {
    nome: 'bestie del freddo', icona: '❄️', accento: '#6fc6ff', pietra: '#17263a',
    mostri: ['topo', 'pipistrello', 'serpe'], grossi: ['cinghiale', 'golem'],
    capi: ['lupo', 'orso'], boss: 'orsoBianco', bossNome: 'L\'Orso Bianco',
  },
  tana: {
    nome: 'bestie con le zanne', icona: '🕳️', accento: '#d98e1c', pietra: '#2b2113',
    mostri: ['ragno', 'serpe', 'topo'], grossi: ['scorpione', 'cinghiale'],
    capi: ['orso', 'troll'], boss: 'lupo', bossNome: 'Il Lupo della Tana',
  },
  covo: {
    nome: 'serpenti e draghi', icona: '🐉', accento: '#ffd23f', pietra: '#331a14',
    mostri: ['serpe', 'pipistrello', 'ragno'], grossi: ['scorpione', 'cinghiale'],
    capi: ['golem', 'troll'], boss: 'drago', bossNome: 'Il Drago del Fondo',
  },
}

export const CHIAVI_AMBIENTI = Object.keys(AMBIENTI)

export const ambiente = chiave => AMBIENTI[chiave] || AMBIENTI[CHIAVI_AMBIENTI[0]]

/* La faccia di uno scontro. Il tipo lo decide la stanza, chi ci abita
   l'ambiente: così un mostro grosso nelle fogne è un polpo e nella
   fucina un rinoceronte, senza che nessuno dei due file sappia
   dell'altro. Un tipo che non è di casa qui — lo scrigno, il fuoco —
   non ha una faccia da pescare e non deve arrivarci: chiede il mazzo
   dei piccoli e si prende un ragno. */
const MAZZI = { grosso: 'grossi', capo: 'capi' }

export function faccia(chiaveAmbiente, tipo, rnd = Math.random) {
  const a = ambiente(chiaveAmbiente)
  if (tipo === 'boss') return a.boss
  const mazzo = a[MAZZI[tipo]] || a.mostri
  return mazzo[Math.floor(rnd() * mazzo.length)]
}

/* ═══════════════════════════════════════════════════════════════════
   LE OSSA — quanto è forte chi ti trovi davanti

   ── LA FORZA, cioè «quanto è avanti questo mostro» ──
   Un numero solo, da 0 (il primo topo della cantina) a dieci e rotti
   (il drago in fondo al covo), che mette insieme le due cose che
   rendono un mostro più cattivo:

       forza = indice della tappa + profondità nella discesa × PASSO

   `PASSO` è quanto vale scendere fino in fondo a una discesa, contato
   in tappe: con 2, il fondo della cantina picchia come l'ingresso
   della fungaia. Sembra strano detto così — a metà campagna si
   incontrano mostri più deboli di quelli battuti mezz'ora prima — ed è
   giusto che sia così, perché **all'ingresso di una discesa si è
   nudi**: l'equipaggiamento è del giro e non passa la notte. Quello
   che continua a crescere da una discesa all'altra è l'eroe di base
   (`eroe.js`), e sono le due cose insieme a fare la scala.

   ── PERCHÉ LA DIFESA DEI MOSTRI CRESCE PIANO ──
   La difesa entra in una sottrazione (`attacco − difesa`), quindi ogni
   punto in più al mostro è un punto tolto a te: se crescesse come
   l'attacco dell'eroe, potenziarsi non si sentirebbe mai e il bottino
   diventerebbe una decorazione. Cresce a un terzo del ritmo, e la
   differenza è tutta lì.

   ── COME SONO TARATI I GUARDIANI ──
   Il guardiano di una tappa **non è battibile con le statistiche di
   partenza**, ed è voluto: è il posto dove si scopre se ci si è
   equipaggiati per strada. Con la spada e due allenamenti cade in
   quattro o cinque scambi; chi ci arriva nudo lo vede scendere di un
   punto per volta e capisce, guardando la barra, cosa doveva fare
   diversamente. È l'unica lezione di strategia che questo gioco dà, e
   la dà senza scriverla da nessuna parte.
   ═══════════════════════════════════════════════════════════════════ */

/* quanto vale, in tappe, scendere una discesa fino in fondo */
export const PASSO = 2

export const forzaDi = (indiceTappa, profondita = 0) =>
  Math.max(0, indiceTappa) + Math.max(0, Math.min(1, profondita)) * PASSO

/* Ogni riga è `base + per × forza`. I numeri sono tarati col banco di
   prova (`motore/banco.js`), non a occhio: chi li tocca rilancia
   `node test/esegui.mjs dungeon` e guarda la tabella che stampa. */
export const TAGLIE = {
  normale: {
    nome: 'mostro',
    vita: { base: 6, per: 1.4 },
    attacco: { base: 6, per: 1.1 },
    difesa: { base: 0, per: 0.35 },
  },
  grosso: {
    nome: 'mostro grosso',
    vita: { base: 11, per: 2 },
    attacco: { base: 8, per: 1.3 },
    difesa: { base: 0.5, per: 0.5 },
  },
  guardiano: {
    nome: 'guardiano',
    vita: { base: 18, per: 2.6 },
    attacco: { base: 6, per: 1.4 },
    difesa: { base: 0.5, per: 0.5 },
  },
  /* ── la serratura ──
     Non è un mostro e non si combatte: **una domanda sola**, e o si
     apre o resta chiuso per sempre. Per un po' ha avuto una vita da
     consumare a colpi come tutti gli altri, ed era la cosa sbagliata:
     scegliere lo scrigno vuol dire scegliere di *non* combattere —
     niente scambio di colpi, niente barra che scende, niente graffi —
     e quello che si rischia è il tesoro, non la pelle. È l'altra
     faccia del bivio: la strada corta che però si può sbagliare per
     intero.

     Vita 1 non è un trucco per ottenere «una domanda»: è il modo di
     dirlo con i numeri che il motore ha già, dato che l'eroe fa sempre
     almeno 1 di danno. Attacco 0 perché una serratura non picchia. */
  serratura: {
    nome: 'serratura',
    vita: { base: 1, per: 0 },
    attacco: { base: 0, per: 0 },
    difesa: { base: 0, per: 0 },
  },
}

export const CHIAVI_TAGLIE = Object.keys(TAGLIE)

/* quanto ballano le statistiche di due mostri della stessa taglia: due
   ragni identici in fila fanno sembrare il dungeon una tabella */
export const BALLERINO = 0.12

const scala = ({ base, per }, forza) => base + per * forza

/* Le ossa di un mostro, date la taglia e quanto si è scesi. Il caso
   arriva da fuori come sempre, così il banco di prova rigioca la stessa
   discesa identica. */
export function ossaDi(taglia, forza, rnd = Math.random) {
  const t = TAGLIE[taglia] || TAGLIE.normale
  const scarto = 1 + (rnd() * 2 - 1) * BALLERINO
  return {
    /* la vita balla, attacco e difesa no: un mostro un po' più coriaceo
       si scopre giocando, uno che picchia a caso rende il bollino della
       mappa una bugia */
    vita: Math.max(1, Math.round(scala(t.vita, forza) * scarto)),
    attacco: Math.max(0, Math.round(scala(t.attacco, forza))),
    difesa: Math.max(0, Math.round(scala(t.difesa, forza))),
  }
}

export function guastiDelleTaglie(taglie = TAGLIE) {
  const guasti = []
  for (const [chiave, t] of Object.entries(taglie)) {
    const dove = `taglia "${chiave}"`
    if (!t.nome) guasti.push(`${dove}: senza nome`)
    for (const campo of ['vita', 'attacco', 'difesa']) {
      const r = t[campo]
      if (!r || !(r.base >= 0) || !(r.per >= 0))
        guasti.push(`${dove}: ${campo} non è una riga "base + per × forza"`)
    }
    if (!(t.vita.base > 0)) guasti.push(`${dove}: nasce senza vita`)
    /* LA REGOLA CHE TIENE IN PIEDI IL POTENZIAMENTO: la difesa di un
       mostro non può crescere quanto il suo attacco. Se lo facesse,
       l'attacco dell'eroe non recupererebbe mai il terreno e la spada
       trovata combattendo non si sentirebbe addosso. */
    if (t.attacco.per > 0 && t.difesa.per >= t.attacco.per)
      guasti.push(`${dove}: la difesa cresce quanto l'attacco: potenziarsi non si sentirebbe`)
  }
  /* un guardiano che non è il più grosso di tutti non è un guardiano */
  for (const piccola of ['normale', 'grosso'])
    if (taglie.guardiano && taglie[piccola] &&
        scala(taglie.guardiano.vita, 5) <= scala(taglie[piccola].vita, 5))
      guasti.push(`il guardiano ha meno vita di un ${taglie[piccola].nome}`)
  if (taglie.serratura?.attacco.base || taglie.serratura?.attacco.per)
    guasti.push('la serratura picchia: uno scrigno deve costare il tesoro, non la pelle')
  return guasti
}

/* `disegnate` è l'elenco delle creature che esistono davvero, e arriva
   **da fuori**: importarlo qui vorrebbe dire che i dati del dungeon
   tirano dentro i pittori, e da lì il motore — che deve girare in Node
   senza schermo, ed è l'unico motivo per cui una campagna intera si
   può giocare in un test da tre decimi di secondo. Chi controlla i
   guasti glielo passa (`unita/bestiario`); chi non lo passa fa gli
   altri controlli e salta questo. */
export function guastiDegliAmbienti(ambienti = AMBIENTI, disegnate = null) {
  const guasti = []
  const esiste = disegnate && new Set(disegnate)
  for (const [chiave, a] of Object.entries(ambienti)) {
    const dove = `ambiente "${chiave}"`
    if (!a.nome || !a.icona || !a.bossNome) guasti.push(`${dove}: senza nome, icona o nome del boss`)
    for (const campo of ['accento', 'pietra'])
      if (!/^#[0-9a-f]{6}$/i.test(a[campo] || '')) guasti.push(`${dove}: ${campo} "${a[campo]}" non è un colore`)
    if (!Array.isArray(a.mostri) || a.mostri.length < 3) guasti.push(`${dove}: servono almeno tre mostri normali`)
    if (!Array.isArray(a.grossi) || a.grossi.length < 2) guasti.push(`${dove}: servono almeno due mostri grossi`)
    /* senza il mazzo dei capi il capo del piano ripiega sui piccoli, e
       quello che chiude un piano si presenta come quello che l'ha
       aperto: il mazzo che manca non si vede da nessuna parte, se non
       da un guardiano che sembra un insetto */
    if (!Array.isArray(a.capi) || a.capi.length < 2) guasti.push(`${dove}: servono almeno due capi di piano`)
    if (!a.boss) guasti.push(`${dove}: senza boss`)
    /* dentro un ambiente le facce non si ripetono: due ragni identici
       in due stanze diverse fanno sembrare il dungeon più corto, e la
       stessa faccia in due mazzi cancella la scala fra le taglie */
    const tutte = [...(a.mostri || []), ...(a.grossi || []), ...(a.capi || []), a.boss]
    if (new Set(tutte).size !== tutte.length) guasti.push(`${dove}: una faccia è ripetuta`)
    /* Una creatura che non è disegnata non si vede: il pittore
       ripiega su un'altra e a schermo compare un ragno dove doveva
       esserci un drago, senza che niente sembri rotto. È il tipo di
       guasto che si scopre solo giocando fino in fondo, cioè tardi. */
    if (esiste)
      for (const chi of tutte)
        if (chi && !esiste.has(chi)) guasti.push(`${dove}: "${chi}" non è disegnato in grafica/bestiario/`)
  }
  return guasti
}
