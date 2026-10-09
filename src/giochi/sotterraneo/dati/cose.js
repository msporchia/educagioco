// Cosa si trova e cosa dice una porta: le quattro famiglie d'arma (uguali a
// parità di gradino), la mano che resta, l'armatura solo-icona, i gioielli.
// Il perché di tutto sta in docs/sotterraneo/roba.md.
import { EROI, FAMIGLIE, portaLa } from './eroi.js'
import { RARITA, RARITA_DA_LETTERA, ABILITA_DEI_PEZZI, UNICI, EPICI, ATT_OGNI_LIVELLI, DIF_OGNI_LIVELLI,
         VITA_OGNI_LIVELLI, valoreDelLivello } from './pezzi.js'

// i tre gradini, uguali per tutte le famiglie: `att` è a una mano
const GRADINI = [
  { att: 1, prezzo: 8 },
  { att: 2, prezzo: 16 },
  { att: 3, prezzo: 26 },
]

// quanto rende la mano che un'arma a due mani ti mangia: Math.ceil(att / 2) del primo gradino
const LA_MANO_CHE_RESTA = 1

export const STANZE_TORCIA = 12

// `mani: 2` occupa anche la sinistra (bastone, arco, spadone); leggere si sdoppiano, pesanti no
// `genere: 'f'` sulle voci femminili: il nome di un pezzo magico si accorda («Spada fiammeggiante», «Arco affilato»)
const arma = (famiglia, grado, nome, sprite, dice, mani = 1, genere = 'm') => ({
  em: '⚔️', nome, sprite, dove: 'mano', famiglia, grado, mani, genere,
  att: GRADINI[grado - 1].att + (mani === 2 ? LA_MANO_CHE_RESTA : 0),
  prezzo: GRADINI[grado - 1].prezzo, dice,
})

// le schede dei pezzi di base: la chiave di sempre, quella che i salvataggi e la storia conoscono. `COSE` qui sotto
// le legge anche con livello e rarità (leggiPezzo)
const BASI = {
  'spada-corta': arma('spade', 1, 'Spada corta', 'spada-corta', 'I mostri cadono un po\' prima.', 1, 'f'),
  spada: arma('spade', 2, 'Spada', 'spada', 'Ogni risposta giusta fa più male.', 1, 'f'),
  spadone: arma('spade', 3, 'Spadone', 'spadone', 'Anche i grossi cadono in pochi colpi. Due mani.', 2),

  accetta: arma('asce', 1, 'Accetta', 'accetta', 'Piccola, ma taglia.', 1, 'f'),
  ascia: arma('asce', 2, 'Ascia', 'ascia', 'Due mani, e si sente.', 2, 'f'),
  bipenne: arma('asce', 3, 'Ascia doppia', 'bipenne', 'Una lama per parte: non perdona. Due mani.', 2, 'f'),

  'arco-corto': arma('archi', 1, 'Arco corto', 'arco-corto', 'Colpisce prima che ti arrivino addosso. Due mani.', 2),
  'arco-lungo': arma('archi', 2, 'Arco lungo', 'arco-lungo', 'Freccia lunga, colpo pesante. Due mani.', 2),
  balestra: arma('archi', 3, 'Balestra', 'balestra', 'Un colpo solo, e fa un buco. Due mani.', 2, 'f'),

  // lo scettro è a una mano (l'unica di terzo gradino così): apre al mago, con difesa 0, lo scudo in fondo
  verga: arma('bacchette', 1, 'Bacchetta', 'verga', 'Una scintilla a ogni risposta giusta.', 1, 'f'),
  'bastone-magico': arma('bacchette', 2, 'Bastone magico', 'bastone-magico', 'La punta brucia. Due mani.', 2),
  scettro: arma('bacchette', 3, 'Scettro', 'scettro', 'Quello che tocca non si rialza.'),

  // il cuoio non ha famiglia (lo lascia lo scheletro del primo piano); ferro=chi para di suo, stoffa=chi non para
  panciotto: { em: '🦺', nome: 'Giubba di cuoio', sprite: 'corpo-cuoio', dove: 'corpo', dif: 1, prezzo: 9, genere: 'f',
               dice: 'Sbagliare fa un po\' meno male.' },
  corazza: { em: '🛡️', nome: 'Corazza', sprite: 'corpo-piastre', dove: 'corpo', famiglia: 'ferro', genere: 'f',
             dif: 2, prezzo: 18, dice: 'Sbagliare fa molto meno male.' },
  manto: { em: '🧥', nome: 'Mantello', sprite: 'corpo-manto', dove: 'corpo', famiglia: 'stoffa',
           dif: 3, prezzo: 28, dice: 'Sbagliare non fa quasi più male.' },
  // il saio rimette in gioco la casella del corpo senza un numero nuovo: para come il panciotto, tiene in piedi come un amuleto
  saio: { em: '🥋', nome: 'Tunica', sprite: 'corpo-saio', dove: 'corpo', famiglia: 'stoffa', genere: 'f',
          dif: 1, vita: 4, prezzo: 20,
          dice: 'Para poco, ma ti tiene in piedi quattro punti di vita più a lungo.' },

  'amuleto-azzurro': { em: '💙', nome: 'Amuleto azzurro', sprite: 'amuleto-azzurro', dove: 'dito',
                       vita: 3, prezzo: 9, dice: 'Tre punti di vita in più, finché lo porti.' },
  'anello-ambra': { em: '💍', nome: 'Anello d\'ambra', sprite: 'anello-ambra', dove: 'dito',
                    luce: 2.5, prezzo: 14, dice: 'Al buio vedi molto più lontano.' },
  'anello-verde': { em: '💚', nome: 'Anello verde', sprite: 'anello-verde', dove: 'dito',
                    gemme: 0.5, prezzo: 16, dice: 'Ogni gemma che raccogli ne vale una e mezza.' },
  'amuleto-rosso': { em: '❤️', nome: 'Amuleto rosso', sprite: 'amuleto-rosso', dove: 'dito',
                     vita: 6, prezzo: 18, dice: 'Sei punti di vita in più, finché lo porti.' },
  medaglione: { em: '🥇', nome: 'Medaglione', sprite: 'medaglione', dove: 'dito',
                dif: 1, prezzo: 15, dice: 'Para un pochino, come mezza corazza.' },

  // le armi col nome proprio stanno un gradino sopra la scala, non dentro: portano un tratto, non più braccio
  'bipenne-solare': {
    em: '🔥', nome: 'Ascia doppia solare', sprite: 'arma-3', dove: 'mano', famiglia: 'asce', mani: 2, genere: 'f',
    att: 4, luce: 2, prezzo: 36,
    dice: 'Le lame brillano di loro: al buio vedi molto più lontano. Due mani.',
  },
  'spada-del-ladro': {
    em: '💰', nome: 'Spada del ladro', sprite: 'arma-2', dove: 'mano', famiglia: 'spade', mani: 2, genere: 'f',
    att: 4, gemme: 0.5, prezzo: 34,
    dice: 'Ogni gemma che raccogli ne vale una e mezza. Due mani.',
  },
  'pugnale-vampiro': {
    em: '🩸', nome: 'Pugnale vampiro', sprite: 'arma-1', dove: 'mano', mani: 1,
    att: 2, vita: 6, prezzo: 30,
    dice: 'Corto e cattivo: finché lo tieni, sei punti di vita in più.',
  },
  'spada-di-ghiaccio': {
    em: '🧊', nome: 'Spada di ghiaccio', sprite: 'spada-runica', dove: 'mano', famiglia: 'spade', genere: 'f',
    mani: 1, att: 2, dif: 1, prezzo: 26,
    dice: 'La lama gela chi ti sta addosso: sbagliare fa un po\' meno male.',
  },

  // gli scudi: la mano debole diventa "braccio o pelle" invece di "solo più braccio"
  'scudo-legno': { em: '🛡️', nome: 'Scudo di legno', sprite: 'scudo-legno', dove: 'mancina',
                   dif: 1, prezzo: 10, dice: 'Assi e borchie: para il primo colpo.' },
  'scudo-borchiato': { em: '🛡️', nome: 'Scudo borchiato', sprite: 'scudo-borchiato',
                       dove: 'mancina', dif: 1, vita: 3, prezzo: 16,
                       dice: 'Para, e ti tiene in piedi un po\' di più.' },
  'scudo-ferro': { em: '🛡️', nome: 'Scudo di ferro', sprite: 'scudo-ferro', dove: 'mancina',
                   dif: 2, prezzo: 22, dice: 'Pesante: sbagliare fa parecchio meno male.' },
  'scudo-crociato': { em: '✝️', nome: 'Scudo crociato', sprite: 'scudo-crociato', dove: 'mancina',
                      dif: 2, luce: 1, prezzo: 28,
                      dice: 'Lo stemma manda luce: pari, e vedi un po\' più in là.' },
  'scudo-leone': { em: '🦁', nome: 'Scudo del leone', sprite: 'scudo-leone', dove: 'mancina',
                   dif: 2, vita: 4, prezzo: 32,
                   dice: 'Para bene, e ti dà quattro punti di vita in più.' },
  'scudo-teschio': { em: '💀', nome: 'Scudo del teschio', sprite: 'scudo-teschio', dove: 'mancina',
                     dif: 3, prezzo: 34, dice: 'Il più duro che ci sia. Non fa altro, e basta così.' },

  'amuleto-osso': { em: '🦴', nome: 'Amuleto d\'ossa', sprite: 'ossa', dove: 'dito',
                    dif: 1, vita: 4, prezzo: 24,
                    dice: 'Para un pochino, e ti tiene in piedi un po\' di più.' },
  'teschio-cercatore': { em: '💀', nome: 'Teschio del cercatore', sprite: 'amuleto-teschio',
                         dove: 'dito', gemme: 1, prezzo: 32,
                         dice: 'Ogni gemma che raccogli vale il doppio.' },

  // le armi dei mostri grossi (dati/pezzi.js, DEI_GROSSI): basi senza famiglia, che non si vendono e non si pescano
  mazza: { em: '🔨', nome: 'Mazza', sprite: 'mazza', dove: 'mano', mani: 1, att: 1, prezzo: 14, deiGrossi: true, genere: 'f',
           dice: 'Pesante e ammaccata: chi la prende in testa ci pensa due volte.' },
  martello: { em: '🔨', nome: 'Martello', sprite: 'martello', dove: 'mano', mani: 1, att: 2, prezzo: 24, deiGrossi: true,
              dice: 'Batte come un fabbro, e scotta.' },

  'pozione-piccola': { em: '🧪', nome: 'Boccetta', sprite: 'pozione-piccola', usa: 'cura', cura: 6, genere: 'f',
                       prezzo: 6, dice: 'Sei punti di vita, subito.' },
  pozione: { em: '🧪', nome: 'Pozione', sprite: 'pozione', usa: 'cura', cura: 10, prezzo: 10, genere: 'f',
             dice: 'Dieci punti di vita, subito.' },
  'pozione-grande': { em: '🍷', nome: 'Ampolla', sprite: 'pozione-grande', usa: 'cura', cura: 18, genere: 'f',
                      prezzo: 16, dice: 'Diciotto punti di vita: ti rimette in piedi.' },
  // l'energia delle abilità (docs/sotterraneo/abilita.md): si beve dallo zaino, fra uno scontro e l'altro
  'pozione-blu': { em: '🧪', nome: 'Pozione blu', sprite: 'pozione-blu', usa: 'energia', energia: 6, prezzo: 8, genere: 'f',
                   dice: 'Sei punti di energia, per le abilità.' },
  // l'unica che non torna indietro: alza la vita massima per il resto della discesa
  'elisir-toro': { em: '🐂', nome: 'Elisir del toro', sprite: 'pozione-rossa',
                   usa: 'cresci', cresce: 3, prezzo: 22,
                   dice: 'Tre punti di vita massima, per tutta la discesa.' },
  // l'unità è la stanza e non il tempo: un conto a orologio farebbe pagare la luce a chi legge piano
  torcia: { em: '🔥', nome: 'Torcia', sprite: 'torcia', usa: 'luce', genere: 'f',
            stanze: STANZE_TORCIA, prezzo: 5,
            dice: `La prendi e si accende: ${STANZE_TORCIA} stanze di luce, poi si spegne.` },
  chiave: { em: '🗝️', nome: 'Chiave', sprite: 'chiave-oro', usa: 'porta', prezzo: 6, genere: 'f',
            dice: 'Apre una porta senza rispondere.' },
}

// Una chiave composta è un pezzo con livello e rarità (docs/sotterraneo/rarita.md):
//   «spada»                    il pezzo di base (livello 1, comune): quelle dei salvataggi e della storia
//   «spada@7»                  livello 7, comune
//   «spada@7.m.fuoco.att»      livello 7, magico, con le abilità fuoco e attacco (r: raro)
//   «mazza@9.u.mazza-di-grumo» un pezzo col nome proprio (un leggendario, o quello di un mostro grosso)
// I numeri non stanno nella chiave: nascono dal livello e dalla rarità, sempre uguali (dati/pezzi.js). `COSE[k]`
// la legge da sé: è un Proxy sulle basi, così le letture `COSE[k]` del gioco non sanno che le chiavi sono
// cambiate. Una chiave che non si legge torna undefined, come una chiave sparita. Trappola: `IN_VENDITA.includes(k)`
// e simili vogliono la base (baseDi)
const letti = new Map()
export const baseDi = k => (typeof k === 'string' ? k.split('@')[0] : null)

const accorda = (b, coppia) => coppia[b.genere === 'f' ? 1 : 0]

export function leggiPezzo(k) {
  if (letti.has(k)) return letti.get(k)
  let c
  try { c = componi(k) } catch (e) { c = undefined }
  letti.set(k, c)
  return c
}

function componi(k) {
  const [base, resto, avanzo] = k.split('@')
  const b = BASI[base]
  if (!b || !b.dove || resto == null || avanzo != null) return undefined
  const parti = resto.split('.')
  const liv = Number(parti[0])
  if (!Number.isInteger(liv) || liv < 1 || liv > 999) return undefined
  const lettera = parti[1] || 'c'
  let rarita, abilita, nome = null, unico = null, storia = null
  if (lettera === 'u') {
    const u = UNICI[parti[2]]
    if (!u || u.base !== base || parti.length !== 3) return undefined
    rarita = u.rarita; abilita = u.abilita; nome = u.nome; unico = parti[2]; storia = u.storia || null
  } else {
    rarita = RARITA_DA_LETTERA[lettera]
    if (!rarita || rarita === 'leggendario') return undefined
    abilita = parti.slice(2)
    if ((rarita === 'comune') !== !abilita.length) return undefined
    if (abilita.some(a => !ABILITA_DEI_PEZZI[a]) || new Set(abilita).size !== abilita.length) return undefined
  }
  const c = { ...b, chiave: k, base, liv, rarita, unico, storia, abilita: {} }
  // il livello sul numero principale, anche per un pezzo comune
  if (b.dove === 'mano') c.att = (c.att || 0) + Math.floor((liv - 1) / ATT_OGNI_LIVELLI)
  else if (b.dove === 'mancina' || b.dove === 'corpo') c.dif = (c.dif || 0) + Math.floor((liv - 1) / DIF_OGNI_LIVELLI)
  else if (b.dove === 'dito' && b.vita) c.vita = b.vita + Math.floor((liv - 1) / VITA_OGNI_LIVELLI)
  const f = RARITA[rarita].forza
  for (const a of abilita) {
    const v = ABILITA_DEI_PEZZI[a].valore(liv, f)
    c.abilita[a] = v
    c[a] = Math.round(((c[a] || 0) + v) * 100) / 100
  }
  c.prezzo = Math.max(1, Math.round((b.prezzo || 1) * valoreDelLivello(liv) * RARITA[rarita].molt))
  c.nome = nome || nomeDelPezzo(b, rarita, abilita, liv)
  return c
}

// il nome nasce dalle abilità: «Spada fiammeggiante», «Spada fiammeggiante della volpe», «Scudo runico del drago»
export function nomeDelPezzo(b, rarita, abilita, liv) {
  if (rarita === 'comune' || !abilita.length) return b.nome
  const [a1, a2] = abilita.map(a => ABILITA_DEI_PEZZI[a])
  if (rarita === 'magico') return `${b.nome} ${accorda(b, a1.agg)}${a2 ? ' ' + a2.di : ''}`
  const epico = [...EPICI].reverse().find(e => liv >= e.da) || EPICI[0]
  return `${b.nome} ${accorda(b, epico.agg)} ${a1.di}`
}

// la chiave di un pezzo: quella di base se è di livello 1 e comune (le chiavi di sempre restano le stesse)
export function chiaveDelPezzo(base, liv = 1, rarita = 'comune', abilita = [], unico = null) {
  const L = Math.max(1, Math.floor(liv || 1))
  if (unico) return `${base}@${L}.u.${unico}`
  if (rarita === 'comune' || !abilita.length) return L === 1 ? base : `${base}@${L}`
  return `${base}@${L}.${RARITA[rarita].lettera}.${abilita.join('.')}`
}

// lo stesso pezzo, comune, a un altro livello (la riga della storia, il banco del mercante); una cosa che si
// consuma non ha livello e resta la sua chiave
export const aLivello = (k, liv) => {
  const b = baseDi(k)
  return BASI[b] && BASI[b].dove ? chiaveDelPezzo(b, liv) : b
}

export const livelloDelPezzo = k => (COSE[k] && COSE[k].liv) || 1
export const raritaDi = k => (COSE[k] && COSE[k].rarita) || 'comune'

export const COSE = new Proxy(BASI, {
  get(t, k) {
    if (typeof k !== 'string' || Object.prototype.hasOwnProperty.call(t, k)) return t[k]
    return k.includes('@') ? leggiPezzo(k) : undefined
  },
  has(t, k) { return typeof k === 'string' && (k in t || (k.includes('@') && !!leggiPezzo(k))) },
})

export const CHIAVI_COSE = Object.keys(BASI)

export const ARMI_DI = grado =>
  CHIAVI_COSE.filter(k => COSE[k].dove === 'mano' && COSE[k].grado === grado)
// le basi che si trovano e si comprano: senza le armi dei mostri grossi
export const PEZZI_DI_BASE = CHIAVI_COSE.filter(k => COSE[k].dove && !COSE[k].deiGrossi)

// due elenchi diversi: dal forziere non escono chiavi né boccette
export const IN_VENDITA = CHIAVI_COSE.filter(k => COSE[k].prezzo && !COSE[k].deiGrossi)
export const SCUDI = CHIAVI_COSE.filter(k => COSE[k].dove === 'mancina')

// stanno fuori dal sorteggio (sempre tutte e tre sul banco); l'elisir non c'è: non deve diventare "compro vita finché ho gemme"
export const CURE = CHIAVI_COSE.filter(k => COSE[k].usa === 'cura')

export const A_SORTE = IN_VENDITA.filter(k => !CURE.includes(k))

// il prezzo è l'unica scala su cui sta tutto il catalogo (docs/sotterraneo/roba.md)
const PREZZI = A_SORTE.map(k => COSE[k].prezzo)
const MENO_CARO = Math.min(...PREZZI)
const PIU_CARO = Math.max(...PREZZI)

// quanto è sfocato il tiro in gemme: un decimo e non zero, o il banco mostrerebbe solo il comprabile
const LARGHEZZA = 10

export const prezzoAtteso = profondita =>
  MENO_CARO + (PIU_CARO - MENO_CARO) * Math.max(0, Math.min(1, profondita))

// predilige la classe, non la garantisce (un terzo e non zero: vendere è un gesto del gioco come gli altri)
export const PESO_ALTRUI = 1 / 3

// quanto pesa una cosa a quella profondità: piena al prezzo atteso, un decimo e non zero lontano da lì
const pesoA = (k, profondita) => {
  if (profondita == null) return 1
  const scarto = (COSE[k].prezzo - prezzoAtteso(profondita)) / LARGHEZZA
  return 1 / (1 + scarto * scarto)
}

// `profondita` (0..1, durezzaDi): da quando la roba resta fra una discesa e l'altra il forziere della
// scalinata non può dare lo spadone come quello della miniera (docs/sotterraneo/regole.md)
export function pescaCosa(elenco, { rnd = Math.random, tua = () => true, profondita = null } = {}) {
  if (!elenco || !elenco.length) return null
  const peso = k => pesoA(k, profondita) * (tua(k) ? 1 : PESO_ALTRUI)
  let somma = 0
  for (const k of elenco) somma += peso(k)
  let tiro = rnd() * somma
  for (const k of elenco) {
    tiro -= peso(k)
    if (tiro <= 0) return k
  }
  return elenco[elenco.length - 1]
}

export function pescaMerce(profondita, { quante = 5, rnd = Math.random,
                                         ammessa = () => true, tua = () => true } = {}) {
  const resto = A_SORTE.filter(ammessa)
  const peso = k => pesoA(k, profondita) * (tua(k) ? 1 : PESO_ALTRUI)
  const presi = []
  while (presi.length < quante && resto.length) {
    let somma = 0
    for (const k of resto) somma += peso(k)
    let tiro = rnd() * somma
    let i = 0
    while (i < resto.length - 1 && (tiro -= peso(resto[i])) > 0) i++
    presi.push(resto[i])
    resto.splice(i, 1)
  }
  return presi
}

export const NEI_FORZIERI = [
  ...ARMI_DI(2), ...ARMI_DI(3),
  'corazza', 'manto', 'saio',
  'anello-ambra', 'anello-verde', 'amuleto-rosso', 'medaglione',
  'amuleto-osso', 'teschio-cercatore',
  'scudo-ferro', 'scudo-crociato', 'scudo-leone', 'scudo-teschio',
  'bipenne-solare', 'spada-del-ladro', 'pugnale-vampiro', 'spada-di-ghiaccio',
  'pozione-grande', 'elisir-toro', 'torcia', 'pozione-blu',
]

// non mente mai: dietro un teschio c'è davvero una guardia
export const SEGNI = {
  guardia: { em: '💀', dice: 'C\'è qualcosa di grosso, là dentro.' },
  tesoro: { em: '💎', dice: 'Da qui si sente odore di roba buona.' },
  fonte: { em: '⛲', dice: 'Si sente acqua.' },
  vuoto: { em: '·', dice: 'Non si sente niente.' },
}

// `nomi` arriva da fuori: questo file non importa la grafica, o il motore smetterebbe di girare in Node
export function guastiDelleCose(nomi = null) {
  const g = []
  if (nomi) for (const [k, c] of Object.entries(COSE))
    if (c.sprite && !nomi.includes(c.sprite))
      g.push(`${k}: nell'atlante non c'è lo sprite "${c.sprite}"`)
  for (const [k, c] of Object.entries(COSE)) {
    if (!c.em || !c.nome) g.push(`${k}: senza emoji o senza nome`)
    if (!c.dice) g.push(`${k}: non dice cosa fa, e il mercante lo mostra`)
    if (!c.dove && !c.usa) g.push(`${k}: né si indossa né si usa, quindi non fa niente`)
    if (c.dove && !['mano', 'mancina', 'corpo', 'dito'].includes(c.dove)) g.push(`${k}: si indossa su "${c.dove}"?`)
    if (c.dove === 'mancina' && !c.dif) g.push(`${k}: nella mano debole, ma non para`)
    if (c.dove === 'corpo' && !c.dif) g.push(`${k}: si mette addosso, ma non para`)
    if (c.dove && !c.sprite) g.push(`${k}: si indossa, ma non ha un pezzo disegnato`)
    if (c.usa === 'cura' && !c.cura) g.push(`${k}: cura zero`)
    if (c.usa === 'luce' && !(c.stanze > 0)) g.push(`${k}: fa luce, ma non dice per quante stanze`)
    if (c.dove === 'dito' && !(c.luce || c.gemme || c.vita || c.dif))
      g.push(`${k}: al dito, ma non fa niente`)
  }
  // le quattro famiglie devono valere lo stesso, a parità di mani: chi ne chiede due picchia LA_MANO_CHE_RESTA in più, non meno né di più
  for (const grado of [1, 2, 3]) {
    const armi = ARMI_DI(grado)
    if (armi.length < 2) { g.push(`gradino ${grado}: solo ${armi.length} arma`); continue }
    for (const mani of [1, 2]) {
      const forze = new Set(armi.filter(k => (COSE[k].mani || 1) === mani).map(k => COSE[k].att))
      if (forze.size > 1)
        g.push(`gradino ${grado}, a ${mani} mani: forze diverse (${[...forze].join(', ')}), una famiglia sarebbe da evitare`)
    }
    const aUna = armi.filter(k => (COSE[k].mani || 1) === 1)
    const aDue = armi.filter(k => COSE[k].mani === 2)
    if (aUna.length && aDue.length && COSE[aDue[0]].att - COSE[aUna[0]].att !== LA_MANO_CHE_RESTA)
      g.push(`gradino ${grado}: a due mani ${COSE[aDue[0]].att} contro ${COSE[aUna[0]].att}, ` +
             `e la mano che resta libera ne vale ${LA_MANO_CHE_RESTA}`)
    const prezzi = new Set(armi.map(k => COSE[k].prezzo))
    if (prezzi.size > 1) g.push(`gradino ${grado}: stesse armi, prezzi diversi`)
  }
  const forzaDi = grado => Math.max(...ARMI_DI(grado).map(k => COSE[k].att))
  for (let grado = 2; grado <= 3; grado++)
    if (forzaDi(grado) <= forzaDi(grado - 1))
      g.push(`il gradino ${grado} non picchia più del ${grado - 1}`)

  for (const [k, c] of Object.entries(COSE))
    if (c.famiglia && !FAMIGLIE[c.famiglia]) g.push(`${k}: famiglia "${c.famiglia}", che non esiste`)
  for (const e of EROI) {
    for (const grado of [1, 2, 3])
      if (!ARMI_DI(grado).some(k => portaLa(e, COSE[k])))
        g.push(`${e.chiave}: nessuna arma di gradino ${grado}, la sua fila ha un buco`)
    const addosso = CHIAVI_COSE.filter(k => COSE[k].dove === 'corpo' && portaLa(e, COSE[k]))
    if (!addosso.length) g.push(`${e.chiave}: niente da mettersi addosso`)
  }

  // le armi col nome proprio non devono picchiare più dell'ultimo gradino, e devono portare un tratto
  const cima = COSE[ARMI_DI(3)[0]].att
  for (const [k, c] of Object.entries(COSE)) {
    if (c.dove !== 'mano' || c.grado || c.deiGrossi) continue
    if (c.att > cima) g.push(`${k}: picchia ${c.att}, più dell'ultimo gradino (${cima})`)
    if (!(c.luce || c.gemme || c.vita || c.dif))
      g.push(`${k}: arma fuori scala senza niente di suo, è una copia con un altro nome`)
  }

  for (const k of NEI_FORZIERI) if (!COSE[k]) g.push(`nei forzieri c'è "${k}", che non esiste`)
  if (!IN_VENDITA.length) g.push('il mercante non ha niente da vendere')
  if (!CURE.length) g.push('niente che curi, e sul banco ci sta sempre')
  if (A_SORTE.length < 5) g.push(`solo ${A_SORTE.length} cose da pescare: il banco ne vuole cinque`)
  for (const [k, s] of Object.entries(SEGNI))
    if (!s.em || !s.dice) g.push(`segno ${k}: senza emoji o senza frase`)
  return g
}
