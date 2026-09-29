// Gli ambienti (il vestito di una tappa) e chi ci abita: nomi di creature
// disegnate in grafica/bestiario/, mai emoji. Le ossa (vita/attacco/difesa)
// non dipendono dalla faccia: stanno in TAGLIE, sotto. I quattro mazzi di un
// ambiente sono una scala di paura crescente: vedi docs/dungeon/regole.md.

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

// il tipo lo decide la stanza, chi ci abita l'ambiente: le due file non si conoscono
const MAZZI = { grosso: 'grossi', capo: 'capi' }

export function faccia(chiaveAmbiente, tipo, rnd = Math.random) {
  const a = ambiente(chiaveAmbiente)
  if (tipo === 'boss') return a.boss
  const mazzo = a[MAZZI[tipo]] || a.mostri
  return mazzo[Math.floor(rnd() * mazzo.length)]
}

// forza = indice tappa + profondità nella discesa × PASSO: perché scende con
// la profondità e non solo con la tappa, e perché la difesa cresce piano,
// vedi docs/dungeon/regole.md.
export const PASSO = 2   // quanto vale, in tappe, scendere una discesa fino in fondo

export const forzaDi = (indiceTappa, profondita = 0) =>
  Math.max(0, indiceTappa) + Math.max(0, Math.min(1, profondita)) * PASSO

// ogni riga è `base + per × forza`, tarata col banco (node test/esegui.mjs dungeon)
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
  // la serratura non è un mostro: una domanda sola (vita 1, l'eroe fa sempre
  // almeno 1 di danno), o si apre o resta chiusa. Non picchia (attacco 0).
  serratura: {
    nome: 'serratura',
    vita: { base: 1, per: 0 },
    attacco: { base: 0, per: 0 },
    difesa: { base: 0, per: 0 },
  },
}

export const CHIAVI_TAGLIE = Object.keys(TAGLIE)

export const BALLERINO = 0.12   // scarto casuale sulla vita, così due mostri identici non sembrano una tabella

const scala = ({ base, per }, forza) => base + per * forza

export function ossaDi(taglia, forza, rnd = Math.random) {
  const t = TAGLIE[taglia] || TAGLIE.normale
  const scarto = 1 + (rnd() * 2 - 1) * BALLERINO
  return {
    // la vita balla, attacco e difesa no: un mostro che picchia a caso renderebbe il bollino una bugia
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
    if (t.attacco.per > 0 && t.difesa.per >= t.attacco.per)
      guasti.push(`${dove}: la difesa cresce quanto l'attacco: potenziarsi non si sentirebbe`)
  }
  for (const piccola of ['normale', 'grosso'])
    if (taglie.guardiano && taglie[piccola] &&
        scala(taglie.guardiano.vita, 5) <= scala(taglie[piccola].vita, 5))
      guasti.push(`il guardiano ha meno vita di un ${taglie[piccola].nome}`)
  if (taglie.serratura?.attacco.base || taglie.serratura?.attacco.per)
    guasti.push('la serratura picchia: uno scrigno deve costare il tesoro, non la pelle')
  return guasti
}

// `disegnate` arriva da fuori (mai importato qui: il motore deve restare
// senza schermo per girare in Node); chi non lo passa salta solo quel controllo.
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
    if (!Array.isArray(a.capi) || a.capi.length < 2) guasti.push(`${dove}: servono almeno due capi di piano`)
    if (!a.boss) guasti.push(`${dove}: senza boss`)
    // le facce non si ripetono: cancellerebbe la scala fra le taglie
    const tutte = [...(a.mostri || []), ...(a.grossi || []), ...(a.capi || []), a.boss]
    if (new Set(tutte).size !== tutte.length) guasti.push(`${dove}: una faccia è ripetuta`)
    if (esiste)
      for (const chi of tutte)
        if (chi && !esiste.has(chi)) guasti.push(`${dove}: "${chi}" non è disegnato in grafica/bestiario/`)
  }
  return guasti
}
