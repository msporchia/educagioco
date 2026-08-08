/* ═══════════════════════════════════════════════════════════════════
   GLI AMBIENTI E CHI CI ABITA — il vestito di una tappa, e le sue ossa

   Il gioco non cambia mai: cambia dove si scende e chi ci si trova.
   Nove tappe con gli stessi tre ragni sono la stessa discesa nove
   volte, e a metà campagna non ci si torna più. A un bambino «adesso si
   scende nelle fogne» dice molto più di «adesso tocca al livello 5».

   Un ambiente porta:
     accento   il colore di tutto: bollini, sentieri, cartelli
     pietra    il fondo della caverna, che il pittore schiarisce da sé
     mostri    i tre normali, grossi i due cattivi, boss il padrone di casa
     bossNome  come si chiama, che è metà della paura

   L'ambiente è **solo il vestito**: quanto picchia un mostro non
   dipende da che faccia ha. Le ossa — vita, attacco, difesa — stanno
   in `TAGLIE`, in fondo a questo file, e dipendono da due cose sole:
   che taglia è (normale, grosso, guardiano) e quanto si è scesi.

   Come si sceglie una faccia, in ordine di importanza:
   1. **si riconosce da piccola**: il bollino sulla mappa è 26 pixel;
   2. **è una bestia intera**, non un oggetto (🕸️ no, 🕷️ sì);
   3. **c'è su tutti i telefoni**: le emoji arrivate da poco (🦣, 🐻‍❄️) su
      un telefono di quattro anni fa sono un rettangolo vuoto.
   ═══════════════════════════════════════════════════════════════════ */

export const AMBIENTI = {
  cantina: {
    nome: 'ragni e topi', icona: '🕯️', accento: '#a06fe0', pietra: '#241f33',
    mostri: ['🕷️', '🐀', '🦟'], grossi: ['🦂', '🐍'],
    boss: '🧟', bossNome: 'Lo Zombi Impolverato',
  },
  cripta: {
    nome: 'ossa e fantasmi', icona: '💀', accento: '#8b8bf0', pietra: '#1d1c33',
    mostri: ['💀', '🦴', '👻'], grossi: ['🧛', '🧙'],
    boss: '☠️', bossNome: 'Il Re delle Ossa',
  },
  grotta: {
    nome: 'pipistrelli e lucertole', icona: '🪨', accento: '#4fb3e0', pietra: '#182430',
    mostri: ['🦇', '🦎', '🐛'], grossi: ['🦍', '🐗'],
    boss: '🦉', bossNome: 'Il Gufo di Pietra',
  },
  fungaia: {
    nome: 'funghi e insetti', icona: '🍄', accento: '#4fce7c', pietra: '#152a1f',
    mostri: ['🐌', '🐜', '🦗'], grossi: ['🐛', '🕷️'],
    boss: '🍄', bossNome: 'Il Fungo che Parla',
  },
  fogne: {
    nome: 'roba d\'acqua', icona: '💧', accento: '#3fa6a0', pietra: '#132628',
    mostri: ['🐸', '🐟', '🐊'], grossi: ['🐙', '🦑'],
    boss: '🦈', bossNome: 'Il Pescecane della Fogna',
  },
  fucina: {
    nome: 'orchi e bestioni', icona: '🔥', accento: '#ff8a3d', pietra: '#301a16',
    mostri: ['👹', '🐗', '🦏'], grossi: ['🦍', '🐂'],
    boss: '👺', bossNome: 'Il Fabbro Furioso',
  },
  ghiacciaia: {
    nome: 'bestie del freddo', icona: '❄️', accento: '#6fc6ff', pietra: '#17263a',
    mostri: ['🐧', '🦭', '🦌'], grossi: ['🐻', '🐗'],
    boss: '🐺', bossNome: 'Il Lupo Bianco',
  },
  tana: {
    nome: 'bestie con le zanne', icona: '🕳️', accento: '#d98e1c', pietra: '#2b2113',
    mostri: ['🦔', '🐍', '🦡'], grossi: ['🐗', '🦁'],
    boss: '🐯', bossNome: 'La Tigre della Tana',
  },
  covo: {
    nome: 'draghi e lucertoloni', icona: '🐉', accento: '#ffd23f', pietra: '#331a14',
    mostri: ['🦖', '🦅', '🐲'], grossi: ['🦕', '🐊'],
    boss: '🐉', bossNome: 'Il Drago del Fondo',
  },
}

export const CHIAVI_AMBIENTI = Object.keys(AMBIENTI)

export const ambiente = chiave => AMBIENTI[chiave] || AMBIENTI[CHIAVI_AMBIENTI[0]]

/* La faccia di uno scontro. Il tipo lo decide la stanza, chi ci abita
   l'ambiente: così un mostro grosso nelle fogne è un polpo e nella
   fucina un gorilla, senza che nessuno dei due file sappia dell'altro. */
export function faccia(chiaveAmbiente, tipo, rnd = Math.random) {
  const a = ambiente(chiaveAmbiente)
  if (tipo === 'boss') return a.boss
  const mazzo = tipo === 'grosso' ? a.grossi : a.mostri
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

export function guastiDegliAmbienti(ambienti = AMBIENTI) {
  const guasti = []
  for (const [chiave, a] of Object.entries(ambienti)) {
    const dove = `ambiente "${chiave}"`
    if (!a.nome || !a.icona || !a.bossNome) guasti.push(`${dove}: senza nome, icona o nome del boss`)
    for (const campo of ['accento', 'pietra'])
      if (!/^#[0-9a-f]{6}$/i.test(a[campo] || '')) guasti.push(`${dove}: ${campo} "${a[campo]}" non è un colore`)
    if (!Array.isArray(a.mostri) || a.mostri.length < 3) guasti.push(`${dove}: servono almeno tre mostri normali`)
    if (!Array.isArray(a.grossi) || a.grossi.length < 2) guasti.push(`${dove}: servono almeno due mostri grossi`)
    if (!a.boss) guasti.push(`${dove}: senza boss`)
    /* dentro un ambiente le facce non si ripetono: due ragni identici
       in due stanze diverse fanno sembrare il dungeon più corto */
    const tutte = [...(a.mostri || []), ...(a.grossi || []), a.boss]
    if (new Set(tutte).size !== tutte.length) guasti.push(`${dove}: una faccia è ripetuta`)
  }
  return guasti
}
