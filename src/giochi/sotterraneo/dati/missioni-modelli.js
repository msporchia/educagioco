// Le taglie della bacheca nel mondo di sopra del Sotterraneo 3D: modelli con i buchi (docs/sotterraneo/mondo-aperto-quest.md,
// «Le taglie»). Un modello più i suoi parametri, la città e il giro fanno una quest, e il suo **id dice tutto**:
// `t:<città>:<modello>:<parametro>:<giro>` (`t:villaggio:caccia:cantine.ratto:3`). Nel salvataggio sta solo lo stato
// (`mondo.quest.stati`, presa | fatta | consegnata): la quest si rifà dall'id con `rifaDaId`. **Gli id sono chiavi di salvataggio:
// un modello, un parametro o un testo che cambia di significato non si rinomina mai.** Dato puro (nessun import da Vue o dal mondo
// generato): chi sceglie *quali* taglie offre una bacheca è motore/taglie.js.
import { MOSTRI } from './mostri.js'
import { CAMPAGNA } from './campagna.js'
import { DUNGEON, CITTA, REGIONI_DEL_MONDO, anelloDi } from './mondo-aperto.js'
import { LIVELLI_ATTESI } from './storia.js'
import { valoreDelLivello } from './pezzi.js'

/* ═══════════ gli interruttori ═══════════ */
// I tipi che vogliono i mostri di sopra (la caccia aperta, il signore della regione, la tana da ripulire): accesi dal 19 ottobre 2026,
// quando i mostri di sopra sono arrivati a schermo e li fanno cadere (docs/sotterraneo/mondo-aperto-mostri.md, «Le taglie»). Spento,
// nessuna bacheca li appende (docs/sotterraneo/mondo-aperto-quest.md, «L'aggancio coi mostri»)
export const MOTORI = { 'mostri-sopra': true }

export const PREFISSO = 't:'
export const eTaglia = id => typeof id === 'string' && id.startsWith(PREFISSO)
export const TETTO_TAGLIE = 3      // le taglie in mano insieme: a parte il tetto delle missioni dei personaggi (TETTO)
export const PER_BACHECA = 3       // i fogli appesi a una bacheca per volta
export const GIRI_RICORDATI = 2    // le consegnate dei giri più vecchi si dimenticano (motore/taglie.js, ripulisci)

/* ═══════════ le gemme ═══════════ */
// Le taglie danno gemme (decisione del 16 ottobre), mai esperienza né monete: `base × valoreDelLivello(livello del posto)`, tra
// GEMME_MIN e GEMME_MAX. La caccia paga `1,6` a mostro. Una taglia è ripetibile, quindi sta sotto una discesa (la roba per terra di
// un piano vale `(6 + 3 × piano) × valore`) e sopra una gemma sola: è l'incentivo a tornare in città, non a sedersi alla bacheca
export const GEMME_MIN = 6, GEMME_MAX = 40
export const BASI = { consegna: 10, trovachi: 8, esplora: 8, mappa: 12, recupera: 14, mostro: 16, caccia: 1.6,
                      // quelli dei mostri di sopra ('mostri-sopra'): provvisori, da tarare col banco dei giocatori tipo
                      'caccia-aperta': 1.6, signore: 20, tana: 18 }
export const gemmePer = (base, livello, quanti = 1) =>
  Math.max(GEMME_MIN, Math.min(GEMME_MAX, Math.round(base * quanti * valoreDelLivello(livello))))

const DUNGEON_DI = Object.fromEntries(DUNGEON.map(d => [d.chiave, d]))
const REGIONE_DI = Object.fromEntries(REGIONI_DEL_MONDO.map(r => [r.chiave, r]))
const CITTA_DI = Object.fromEntries(CITTA.map(c => [c.chiave, c]))
export const regioneDi = k => REGIONE_DI[k] || null
export const cittaDelleTaglie = k => CITTA_DI[k] || null
export const livelloDelDungeon = k => (DUNGEON_DI[k] && DUNGEON_DI[k].indice >= 0 ? LIVELLI_ATTESI[DUNGEON_DI[k].indice] : LIVELLI_ATTESI[LIVELLI_ATTESI.length - 1])
export const livelloDellaRegione = k => Math.max(1, (REGIONE_DI[k] && REGIONE_DI[k].livello) || 1)
export const livelloDellaCitta = k => livelloDellaRegione(CITTA_DI[k] && CITTA_DI[k].regione)

/* ═══════════ la caccia nei dungeon ═══════════ */
// Per ogni dungeon le specie da battere e **quanti**: sotto la mediana dei mostri di quella specie in un giro intero della discesa
// (dodici semi, tutti i piani: lo misura `unita/sotterraneo-quest-modelli`, come le «sconfiggi N» di prima, missioni-conteggio.md).
// La cripta non ha caccia (tre mostri per specie) e l'abisso nemmeno. `[N, plurale]`
export const CACCE = {
  cantine: { ratto: [9, 'ratti'], goblin: [12, 'goblin'], melma: [9, 'melme'] },
  torre: { pipistrello: [5, 'pipistrelli'], 'spirito-fuoco': [8, 'spiriti di fuoco'] },
  gallerie: { ragno: [5, 'ragni'], fungo: [6, 'funghi'], pianta: [5, 'piante carnivore'], 'melma-rosa': [5, 'melme rosa'] },
  cisterna: { polpo: [9, 'polpi'], 'fantasma-azzurro': [5, 'fantasmi azzurri'], piranha: [4, 'piranha'] },
  labirinto: { 'bestia-cornuta': [15, 'bestie cornute'], negromante: [14, 'negromanti'], 'troll-clava': [14, 'troll'] },
  fondo: { scorpione: [12, 'scorpioni'], golem: [8, 'golem'], 'spirito-elettrico': [7, 'spiriti elettrici'] },
}

/* ═══════════ i testi: roba, soprannomi, viandanti ═══════════ */
// Le cose smarrite e portate: solo emoji già nel gioco (docs/core/emoji.md)
export const COSE_PORTATE = [
  { nome: 'La lettera del sindaco', em: '✉️' }, { nome: 'Il pacco di pane caldo', em: '🍞' }, { nome: 'Il cesto di mele', em: '🍎' },
  { nome: 'Il rotolo di pergamene', em: '📜' }, { nome: 'La matassa di lana', em: '🧶' }, { nome: 'Il pacco del mercante', em: '📦' },
]
export const COSE_PERSE = [
  { nome: 'Lo zaino del viandante', em: '🎒' }, { nome: 'Il cannocchiale dello scout', em: '🔭' }, { nome: 'L\'arco di un cacciatore', em: '🏹' },
  { nome: 'La benda per le ferite', em: '🩹' }, { nome: 'Il rosario del pellegrino', em: '📿' }, { nome: 'Il rotolo di una mappa vecchia', em: '📜' },
  { nome: 'Il cesto delle mele', em: '🍎' }, { nome: 'Il pacco smarrito di un mercante', em: '📦' },
]
export const SOPRANNOMI = ['Zannalunga', 'Occhiofurbo', 'Pelogrigio', 'Zampaveloce', 'Naso Adunco', 'Guancia Rotta', 'Orecchiofreddo', 'Dentenero',
                           'Coda Mozza', 'Occhio di Brace', 'Testadura', 'Unghia Storta', 'Baffolungo', 'Pancia Piena', 'Mastro Rosicchia', 'Ossoduro']
// chi si perde nelle terre: lo sprite è uno di quelli che il gioco ha già (nessuna figura nuova)
export const VIANDANTI = [
  { chiave: 'pastore', nome: 'Il pastore', sprite: 'boscaiolo', perso: 'le sue pecore' },
  { chiave: 'lavandaia', nome: 'La lavandaia', sprite: 'ragazza', perso: 'il cesto del bucato' },
  { chiave: 'cantastorie', nome: 'Il vecchio cantastorie', sprite: 'eremita', perso: 'la strada di casa' },
  { chiave: 'raccoglitore', nome: 'Il raccoglitore di funghi', sprite: 'mugnaio', perso: 'il suo sentiero' },
  { chiave: 'pescatore', nome: 'Il pescatore di rane', sprite: 'pescatore', perso: 'la sua barca' },
]

/* ═══════════ un po' di grammatica ═══════════ */
const ARTICOLATE = {
  in: { il: 'nel', lo: 'nello', la: 'nella', i: 'nei', gli: 'negli', le: 'nelle', "l'": "nell'" },
  a: { il: 'al', lo: 'allo', la: 'alla', i: 'ai', gli: 'agli', le: 'alle', "l'": "all'" },
  di: { il: 'del', lo: 'dello', la: 'della', i: 'dei', gli: 'degli', le: 'delle', "l'": "dell'" },
  da: { il: 'dal', lo: 'dallo', la: 'dalla', i: 'dai', gli: 'dagli', le: 'dalle', "l'": "dall'" },
}
// «Il bosco vecchio» → «nel bosco vecchio»; «La brughiera» → «nella brughiera»
export function articolata(prep, nome) {
  const m = /^(il|lo|la|i|gli|le|l')\s*/i.exec(nome)
  if (!m) return `${prep} ${nome}`
  const art = m[1].toLowerCase()
  return ARTICOLATE[prep][art] + (art === "l'" ? '' : ' ') + nome.slice(m[0].length)
}
const minuscolo = s => s.charAt(0).toLowerCase() + s.slice(1)
const senzaArticolo = nome => nome.replace(/^(il|lo|la|i|gli|le|l')\s*/i, '')
// «Un ratto» → «il ratto», «Uno scheletro» → «lo scheletro», «Una melma» → «la melma»
export function definito(nomeSpecie) {
  const m = /^(un|uno|una|un')\s*/i.exec(nomeSpecie)
  const resto = m ? nomeSpecie.slice(m[0].length) : nomeSpecie
  const art = m ? ({ un: 'il', uno: 'lo', una: 'la', "un'": "l'" })[m[1].toLowerCase()] : 'il'
  return art + (art === "l'" ? '' : ' ') + resto
}

/* ═══════════ il caso: stesso id, stessa quest ═══════════ */
export function hash(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 }
  return h >>> 0
}
// un caso seminato dalla stringa (mulberry32): per ogni (eroe, giro, città) la bacheca è sempre la stessa
export function casoDa(seme) {
  let a = hash(String(seme))
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const scegli = (lista, id, sale = '') => lista[hash(id + sale) % lista.length]

/* ═══════════ i modelli ═══════════ */
// Ogni modello: `quando` (se serve un dungeon, i mostri di sopra), e `fa(c)` che riempie la quest dal parametro `p` (stringa), la città
// e l'id; torna null se il parametro non va (un id stantio o storto non rompe niente). I campi in comune li aggiunge `taglia()`.
const bacheca = k => ({ nome: `La bacheca ${articolata('di', CITTA_DI[k].nome)}`, chi: `la bacheca ${articolata('di', CITTA_DI[k].nome)}` })
export const bachecaDi = bacheca
const aCitta = k => articolata('a', CITTA_DI[k].nome)

const MODELLI = {
  // Porta una cosa da una città a un'altra: si consegna alla bacheca di laggiù (fatta e consegnata in un colpo)
  consegna: {
    fa: c => {
      if (!CITTA_DI[c.p] || c.p === c.citta) return null
      const og = scegli(COSE_PORTATE, c.id)
      const dove = aCitta(c.p)
      return { tipo: 'consegna', titolo: `${og.nome} ${dove}`, em: og.em, dove: CITTA_DI[c.p].nome, aCitta: c.p, consegnaA: c.p,
               livello: Math.max(livelloDellaCitta(c.p), livelloDellaCitta(c.citta)),
               dice: `Serve qualcuno che porti ${minuscolo(og.nome)} ${dove}. Si consegna alla bacheca di laggiù. La strada è lunga, la paga è giusta.`,
               grazie: 'Consegna ricevuta. Il fattorino è pagato: ecco le gemme.',
               verbo: ['Da portare', 'Portato'], nota: `alla bacheca ${articolata('di', CITTA_DI[c.p].nome)}` }
    },
  },
  'esplora-regione': {
    fa: c => {
      const r = REGIONE_DI[c.p]
      if (!r || anelloDi(r) < 1) return null
      return { tipo: 'esplora', titolo: `Vedi ${minuscolo(r.nome)}`, em: '🔭', dove: r.nome, regione: r.chiave, bersaglio: { tipo: 'regione', chiave: r.chiave },
               livello: livelloDellaRegione(r.chiave),
               dice: `Nessuno ha ancora disegnato ${minuscolo(r.nome)} sulla mappa. Vacci, guardati attorno, e torna a raccontarlo.`,
               grazie: 'Adesso lo sappiamo com\'è! Ecco la paga di chi disegna le mappe.',
               verbo: ['Da raggiungere', 'Raggiunto'], nota: `si scopre camminando` }
    },
  },
  'esplora-ingresso': {
    fa: c => {
      const d = DUNGEON_DI[c.p]
      if (!d || d.indice < 0) return null
      return { tipo: 'esplora', titolo: `Trova ${minuscolo(d.nome)}`, em: '🔭', dove: d.nome, regione: d.regione, discesa: null, bersaglio: { tipo: 'ingresso', chiave: d.chiave },
               livello: livelloDelDungeon(d.chiave),
               dice: `Si dice che ${minuscolo(d.nome)} abbia un ingresso nascosto. Trovalo, e dicci dov'è.`,
               grazie: 'Ora lo possiamo segnare sulla mappa. Ecco il compenso.',
               verbo: ['Da trovare', 'Trovato'], nota: 'si trova camminando' }
    },
  },
  'esplora-pietra': {
    fa: c => {
      const nome = CITTA_DI[c.p] ? `la pietra ${articolata('di', CITTA_DI[c.p].nome)}` : DUNGEON_DI[c.p] ? `la pietra davanti ${articolata('a', DUNGEON_DI[c.p].nome)}` : null
      if (!nome) return null
      const liv = CITTA_DI[c.p] ? livelloDellaCitta(c.p) : livelloDelDungeon(c.p)
      return { tipo: 'esplora', titolo: `Trova ${nome}`, em: '🔭', dove: CITTA_DI[c.p] ? CITTA_DI[c.p].nome : DUNGEON_DI[c.p].nome,
               regione: CITTA_DI[c.p] ? CITTA_DI[c.p].regione : DUNGEON_DI[c.p].regione, bersaglio: { tipo: 'pietra', chiave: c.p }, livello: liv,
               dice: `Le pietre del viaggio non si trovano da sole. Cerca ${nome}: chi la trova non la dimentica.`,
               grazie: 'Una pietra in più sulla mappa. Ecco il compenso.',
               verbo: ['Da trovare', 'Trovata'], nota: 'si trova camminando' }
    },
  },
  // Cerca una persona persa in una regione e parlale: c'è solo finché la taglia è in mano (Mondo3d.vue la mette sul prato)
  'trova-chi': {
    fa: c => {
      const r = REGIONE_DI[c.p]
      if (!r || anelloDi(r) < 1) return null
      const v = scegli(VIANDANTI, c.id)
      return { tipo: 'trovachi', titolo: `Cerca ${minuscolo(v.nome)}`, em: '🗣️', dove: r.nome, regione: r.chiave, viandante: v, livello: livelloDellaRegione(r.chiave),
               dice: `${v.nome} è uscito a cercare ${v.perso} e non è più tornato. Dicono che sia ${articolata('in', r.nome)}. Trovalo e digli che a casa lo aspettano.`,
               grazie: 'Sta bene, e torna presto. Ecco la ricompensa di chi ha cercato.',
               verbo: ['Da cercare', 'Trovato'], nota: 'si cerca e ci si parla' }
    },
  },
  // Una mappa strappata con una X: si va, si scava dove segna (una domanda), si torna. Il posto lo sceglie Mondo3d.vue sulla strada vera
  mappa: {
    fa: c => {
      const r = REGIONE_DI[c.p]
      if (!r || anelloDi(r) < 1) return null
      return { tipo: 'mappa', titolo: `La mappa ${articolata('di', r.nome)}`, em: '🗺️', dove: r.nome, regione: r.chiave, livello: livelloDellaRegione(r.chiave),
               dice: `Sul foglio c'è una mappa strappata con una X, ${articolata('in', r.nome)}. Seguila, scava dove segna la X, e riporta quello che trovi.`,
               grazie: 'Il tesoro esiste davvero! Ecco la tua parte.',
               verbo: ['Da scavare', 'Scavato'], nota: 'segui la X' }
    },
  },
  // In un dungeon: sconfiggi N di una specie (la «conta» di sempre, motore/corsa.js)
  caccia: {
    dungeon: true,
    fa: c => {
      const [k, specie] = c.p.split('.')
      const t = CAMPAGNA.find(x => x.chiave === k), cac = CACCE[k] && CACCE[k][specie]
      if (!t || !cac || !MOSTRI[specie]) return null
      const [quanti, nomi] = cac
      return { tipo: 'conta', specie, quanti, nomi, titolo: `${quanti} ${nomi}`, em: MOSTRI[specie].em, dove: t.nome, discesa: k, piano: 0, regione: DUNGEON_DI[k].regione,
               livello: livelloDelDungeon(k), gemmeSu: quanti,
               dice: `Cacciatori cercasi: ${quanti} ${nomi} ${articolata('in', t.nome)}. Sconfiggili tutti, anche in più discese, e torna qui.`,
               grazie: 'Bel lavoro. La paga di chi non si tira indietro.' }
    },
  },
  // In un dungeon: un mostro col nome e la corona, più duro di quelli del suo piano
  mostro: {
    dungeon: true,
    fa: c => {
      const [k, specie] = c.p.split('.')
      const t = CAMPAGNA.find(x => x.chiave === k)
      if (!t || !t.mostri.includes(specie) || !MOSTRI[specie] || MOSTRI[specie].capo || k === 'abisso') return null
      const nome = `${scegli(SOPRANNOMI, c.id)}, ${definito(MOSTRI[specie].nome)}`
      const piano = hash(c.id + 'p') % Math.min(t.piani, 3)
      return { tipo: 'sconfiggi', mostro: { tipo: specie, nome }, titolo: nome, em: '👑', dove: t.nome, discesa: k, piano, regione: DUNGEON_DI[k].regione,
               livello: livelloDelDungeon(k),
               dice: `Una taglia: ${nome}, ${articolata('in', t.nome)}, al ${['primo', 'secondo', 'terzo'][piano]} piano. Ha la corona in testa. Battilo.`,
               grazie: 'La taglia è tua. Ecco le gemme promesse.' }
    },
  },
  // In un dungeon: una cosa smarrita, in un forziere d'oro che si riconosce
  recupera: {
    dungeon: true,
    fa: c => {
      const [k, p] = c.p.split('.')
      const t = CAMPAGNA.find(x => x.chiave === k)
      const cosa = COSE_PERSE[Number(p)]
      if (!t || !cosa) return null
      const piano = hash(c.id + 'p') % Math.min(t.piani, 3)
      return { tipo: 'trova', cosa, titolo: cosa.nome, em: cosa.em, dove: t.nome, discesa: k, piano, regione: DUNGEON_DI[k].regione, livello: livelloDelDungeon(k),
               dice: `${cosa.nome} è finito ${articolata('in', t.nome)}, al ${['primo', 'secondo', 'terzo'][piano]} piano. Chi lo riporta ha la sua paga.`,
               grazie: 'Proprio quello! Ecco la paga promessa.' }
    },
  },
  // — quelli dei mostri di sopra, dietro MOTORI['mostri-sopra'] —
  'caccia-aperta': {
    sopra: true,
    fa: c => {
      const [k, specie] = c.p.split('.')
      const r = REGIONE_DI[k]
      if (!r || !r.abitanti || !r.abitanti.includes(specie) || !MOSTRI[specie]) return null
      const quanti = 6
      return { tipo: 'cacciaAperta', specie, quanti, titolo: `${quanti} ${MOSTRI[specie].nome.replace(/^(un|uno|una)\s+/i, '')}`, em: MOSTRI[specie].em, dove: r.nome, regione: k,
               livello: livelloDellaRegione(k), gemmeSu: quanti,
               dice: `Le bestie ${articolata('in', r.nome)} sono troppe. Sconfiggine ${quanti} e torna.`, grazie: 'Si respira meglio. Ecco la paga.' }
    },
  },
  signore: {
    sopra: true,
    fa: c => {
      const r = REGIONE_DI[c.p]
      if (!r || !r.caporale || !MOSTRI[r.caporale]) return null
      return { tipo: 'signore', titolo: `Il signore ${articolata('di', r.nome)}`, em: '👑', dove: r.nome, regione: r.chiave, caporale: r.caporale, livello: livelloDellaRegione(r.chiave),
               dice: `${articolata('in', r.nome)} comanda uno solo. Battilo, e le bestie smetteranno di organizzarsi.`, grazie: 'Il signore è caduto. Ecco la taglia.' }
    },
  },
  tana: {
    sopra: true,
    fa: c => {
      const r = REGIONE_DI[c.p]
      if (!r || !r.abitanti) return null
      return { tipo: 'tana', titolo: `Ripulisci la tana ${articolata('di', r.nome)}`, em: '🏹', dove: r.nome, regione: r.chiave, livello: livelloDellaRegione(r.chiave),
               dice: `La tana ${articolata('di', r.nome)} è piena. Ripulisci tutto il covo.`, grazie: 'Il covo è vuoto. Ecco la taglia.' }
    },
  },
}
export const NOMI_MODELLI = Object.keys(MODELLI)
export const modelloAcceso = nome => !!MODELLI[nome] && !(MODELLI[nome].sopra && !MOTORI['mostri-sopra'])
// quale base delle gemme per un modello (i tre dei mostri di sopra e la caccia usano la loro)
const baseDi = nome => BASI[nome === 'esplora-regione' || nome === 'esplora-ingresso' || nome === 'esplora-pietra' ? 'esplora' : nome === 'trova-chi' ? 'trovachi' : nome]

/* ═══════════ fare e rifare ═══════════ */
export const idDi = (citta, modello, param, giro) => `${PREFISSO}${citta}:${modello}:${param}:${giro}`

// l'id → la quest, o null (un id che non si legge, un modello che non c'è più, un parametro che non va). Rifatta tale e quale ogni volta
export function rifaDaId(id) {
  if (!eTaglia(id)) return null
  const [, citta, modello, p, giro] = String(id).split(':')
  const mod = MODELLI[modello]
  if (!mod || !CITTA_DI[citta] || p == null || !/^\d+$/.test(giro || '')) return null
  const c = mod.fa({ id, citta, p, giro: Number(giro) })
  if (!c) return null
  const { gemmeSu, livello, ...resto } = c
  const gemme = gemmePer(baseDi(modello), livello, gemmeSu || 1)
  const consegnaA = c.consegnaA || citta
  return {
    id, taglia: true, modello, citta, giro: Number(giro), param: p,
    da: `bacheca:${citta}`, consegnaA, discesa: null, piano: null, regione: null, ...resto,
    premio: { gemme },
    ritorno: '', torna: `Passa dalla bacheca ${articolata('di', CITTA_DI[consegnaA].nome)}: hai finito`,
    richiede: [], fuoriDalTetto: true,   // le taglie hanno il loro tetto (TETTO_TAGLIE), a parte quello dei personaggi
  }
}

/* ═══════════ chi è la bacheca ═══════════ */
// `bacheca:<città>`: chi dà le taglie. Il diario e le frasi la nominano come un personaggio (dati/missioni.js, personaDi)
export const bachecaDiChi = da => {
  const m = /^bacheca:(\w+)$/.exec(da || '')
  return m && CITTA_DI[m[1]] ? bacheca(m[1]) : null
}

/* ═══════════ i guasti ═══════════ */
export function guastiDelleTaglie() {
  const g = []
  for (const [k, specie] of Object.entries(CACCE)) {
    const t = CAMPAGNA.find(x => x.chiave === k)
    if (!t) { g.push(`caccia: la discesa "${k}" non c'è`); continue }
    for (const [s, [n, nomi]] of Object.entries(specie)) {
      if (!MOSTRI[s]) g.push(`caccia ${k}: la specie "${s}" non c'è`)
      else if (!t.mostri.includes(s)) g.push(`caccia ${k}: ${s} non abita lì`)
      else if (MOSTRI[s].capo) g.push(`caccia ${k}: ${s} è un capo`)
      if (!(Number.isInteger(n) && n >= 2 && n <= 20)) g.push(`caccia ${k}.${s}: ${n} da battere (da 2 a 20)`)
      if (!nomi) g.push(`caccia ${k}.${s}: senza plurale`)
    }
  }
  for (const [m, b] of Object.entries(BASI)) if (!(b > 0)) g.push(`base delle gemme: ${m}`)
  for (const c of [...COSE_PORTATE, ...COSE_PERSE]) if (!c.nome || !c.em) g.push(`una cosa senza nome o faccia: ${JSON.stringify(c)}`)
  return g
}
