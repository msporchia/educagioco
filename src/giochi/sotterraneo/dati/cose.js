// Cosa si trova e cosa dice una porta: le quattro famiglie d'arma (uguali a
// parità di gradino), la mano che resta, l'armatura solo-icona, i gioielli.
// Il perché di tutto sta in docs/sotterraneo/roba.md.
import { EROI, FAMIGLIE, portaLa } from './eroi.js'
import { RARITA, RARITA_DA_LETTERA, ABILITA_DEI_PEZZI, UNICI, EPICI, ATT_OGNI_LIVELLI, DIF_OGNI_LIVELLI,
         VITA_OGNI_LIVELLI, DIF_TESTA_OGNI_LIVELLI, VITA_TESTA_OGNI_LIVELLI, valoreDelLivello, TINTE_DELLE_ABILITA } from './pezzi.js'
import { ASPETTI } from './aspetti.js'

// i tre gradini, uguali per tutte le famiglie: `att` è a una mano, `mano` quello che darebbe la mancina (uno scudo del gradino:
// legno, ferro, teschio)
const GRADINI = [
  { att: 1, prezzo: 8, mano: 1 },
  { att: 2, prezzo: 16, mano: 2 },
  { att: 3, prezzo: 26, mano: 3 },
]

// Quanto vale una difesa, in attacco: contro i branchi una difesa toglie qualcosa a ogni colpo di ognuno. Misurato col banco
// (docs/sotterraneo/strade.md): una strada con l'arma a due mani e una con l'arma a una mano e lo scudo, stessi punti e stesso albero,
// pareggiano fra due e tre; si tiene due, il cambio con cui il gioco sceglieva già i pezzi (PESI in motore/corredo.js). Un'arma a
// due mani vale quella a una mano più la mano che ti toglie (l'utente, 13 ottobre: l'arma a due mani non aveva vantaggi): la difesa
// dello scudo del suo gradino e livello, contata come attacco. Lo usano anche la storia (dati/storia.js) e il banco
export const PESO_DELLA_DIFESA = 2
// il bastone (a due mani, bacchette) ha in più un potere suo, da mago puro: l'energia torna di più in fretta, in percento
// (docs/sotterraneo/roba.md, «Due mani»)
export const RICARICA_DEL_BASTONE = 50

export const STANZE_TORCIA = 12
// la pergamena del portale (docs/sotterraneo/portale-e-sosta.md, «La pergamena del portale»): costa una scelta, cinque torce;
// se ne tengono al più PERGAMENE_MASSIME, e la vende solo l'incantatrice dopo la sua missione (`dopo`)
export const PREZZO_PERGAMENA = 25, PERGAMENE_MASSIME = 5

// Dove si indossa: `dove` di un pezzo è il tipo di posto (dito = anello, collo = collana, testa = copricapo), le caselle addosso sono
// sette e due anelli stanno sulle due del dito (docs/sotterraneo/roba.md, «Addosso e in tasca»). Un salvataggio di prima ha un solo
// `dito`, e nessuna `testa` (docs/sotterraneo/elmo.md): la casella in coda, così chi scorre le altre le trova nell'ordine di sempre
export const TIPI_DI_POSTO = ['mano', 'mancina', 'corpo', 'dito', 'collo', 'testa']
export const CASELLE = ['mano', 'mancina', 'corpo', 'collo', 'dito', 'dito2', 'testa']
export const CASELLE_DEL_TIPO = { mano: ['mano'], mancina: ['mancina'], corpo: ['corpo'], collo: ['collo'], dito: ['dito', 'dito2'], testa: ['testa'] }
export const tipoDellaCasella = c => (c === 'dito2' ? 'dito' : c)

// `mani: 2` occupa anche la sinistra (bastone, arco, spadone); leggere si sdoppiano, pesanti no
// `genere: 'f'` sulle voci femminili: il nome di un pezzo magico si accorda («Spada fiammeggiante», «Arco affilato»)
const arma = (famiglia, grado, nome, sprite, dice, mani = 1, genere = 'm') => ({
  em: '⚔️', nome, sprite, dove: 'mano', famiglia, grado, mani, genere,
  att: GRADINI[grado - 1].att + (mani === 2 ? PESO_DELLA_DIFESA * GRADINI[grado - 1].mano : 0),
  prezzo: GRADINI[grado - 1].prezzo, dice,
  ...(famiglia === 'bacchette' && mani === 2 ? { ricarica: RICARICA_DEL_BASTONE } : {}),
})

// le armi col nome proprio a due mani stanno al gradino più alto, con un tratto in più
const DUE_MANI_DEL_TERZO = GRADINI[2].att + PESO_DELLA_DIFESA * GRADINI[2].mano

// le schede dei pezzi di base: la chiave di sempre, quella che i salvataggi e la storia conoscono. `COSE` qui sotto
// le legge anche con livello e rarità (leggiPezzo)
const BASI = {
  'spada-corta': arma('spade', 1, 'Spada corta', 'spada-corta', 'I mostri cadono un po\' prima.', 1, 'f'),
  spada: arma('spade', 2, 'Spada', 'spada', 'Ogni risposta giusta fa più male.', 1, 'f'),
  spadone: arma('spade', 3, 'Spadone', 'spadone', 'Anche i grossi cadono in pochi colpi. Due mani.', 2),
  // le armi a una mano dei gradini alti (le strade con lo scudo, docs/sotterraneo/strade.md): la lama larga di chi non lascia lo scudo
  sciabola: arma('spade', 3, 'Sciabola', 'spada-13', 'Larga e veloce: la mano che resta tiene lo scudo.', 1, 'f'),

  accetta: arma('asce', 1, 'Accetta', 'accetta', 'Piccola, ma taglia.', 1, 'f'),
  ascia: arma('asce', 2, 'Ascia', 'ascia', 'Due mani, e si sente.', 2, 'f'),
  bipenne: arma('asce', 3, 'Ascia doppia', 'bipenne', 'Una lama per parte: non perdona. Due mani.', 2, 'f'),
  scure: arma('asce', 2, 'Scure', 'ascia-05', 'Un\'ascia corta: si regge con una mano, e lo scudo resta.', 1, 'f'),
  mannaia: arma('asce', 3, 'Mannaia', 'ascia-06', 'Pesante, ma una mano sola le basta.', 1, 'f'),

  'arco-corto': arma('archi', 1, 'Arco corto', 'arco-corto', 'Colpisce prima che ti arrivino addosso. Due mani.', 2),
  'arco-lungo': arma('archi', 2, 'Arco lungo', 'arco-lungo', 'Freccia lunga, colpo pesante. Due mani.', 2),
  balestra: { ...arma('archi', 3, 'Balestra', 'balestra', 'Un colpo solo, e fa un buco. Due mani.', 2, 'f'), tiene: 'orizzontale' },

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

  'amuleto-azzurro': { em: '💙', nome: 'Amuleto azzurro', sprite: 'amuleto-azzurro', dove: 'collo',
                       vita: 3, prezzo: 9, dice: 'Tre punti di vita in più, finché lo porti.' },
  'anello-ambra': { em: '💍', nome: 'Anello d\'ambra', sprite: 'anello-ambra', dove: 'dito',
                    luce: 2.5, prezzo: 14, dice: 'Al buio vedi molto più lontano.' },
  'anello-verde': { em: '💚', nome: 'Anello verde', sprite: 'anello-verde', dove: 'dito',
                    gemme: 0.5, prezzo: 16, dice: 'Ogni gemma che raccogli ne vale una e mezza.' },
  'amuleto-rosso': { em: '❤️', nome: 'Amuleto rosso', sprite: 'amuleto-rosso', dove: 'collo',
                     vita: 6, prezzo: 18, dice: 'Sei punti di vita in più, finché lo porti.' },
  medaglione: { em: '🥇', nome: 'Medaglione', sprite: 'medaglione', dove: 'collo',
                dif: 1, prezzo: 15, dice: 'Para un pochino, come mezza corazza.' },

  // le armi col nome proprio stanno un gradino sopra la scala, non dentro: portano un tratto, non più braccio
  'bipenne-solare': {
    em: '🔥', nome: 'Ascia doppia solare', dove: 'mano', famiglia: 'asce', mani: 2, genere: 'f',
    att: DUE_MANI_DEL_TERZO, luce: 2, prezzo: 36,
    dice: 'Le lame brillano di loro: al buio vedi molto più lontano. Due mani.',
  },
  'spada-del-ladro': {
    em: '💰', nome: 'Spada del ladro', dove: 'mano', famiglia: 'spade', mani: 2, genere: 'f',
    att: DUE_MANI_DEL_TERZO, gemme: 0.5, prezzo: 34,
    dice: 'Ogni gemma che raccogli ne vale una e mezza. Due mani.',
  },
  'pugnale-vampiro': {
    em: '🩸', nome: 'Pugnale vampiro', dove: 'mano', mani: 1,
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

  // i copricapi (docs/sotterraneo/elmo.md): il ferro per chi veste il ferro, la stoffa per gli altri, la cuffia per tutti. Un elmo vale
  // una frazione di un'armatura (un punto di difesa, e cresce a metà passo: DIF_TESTA_OGNI_LIVELLI); il 3D li disegna coi modelli
  // dei copricapi (anteprime3d-pura.js, `COPRICAPI_3D`) e non hanno sprite: senza modello, l'emoji. `copricapo`: fuori dai banchi e dal
  // bottino di sempre, ci entrano solo dove il gioco li accende (Corredo.copricapi)
  cuffia: { em: '🪖', nome: 'Cuffia di cuoio', dove: 'testa', copricapo: true, genere: 'f', vita: 3, prezzo: 7,
            dice: 'Cuoio imbottito: ti tiene in piedi un po\' di più.' },
  elmo: { em: '🪖', nome: 'Elmo', dove: 'testa', famiglia: 'ferro', copricapo: true, dif: 1, prezzo: 10,
          dice: 'Ferro sulla testa: sbagliare fa un po\' meno male.' },
  'elmo-cornuto': { em: '🪖', nome: 'Elmo cornuto', dove: 'testa', famiglia: 'ferro', copricapo: true, dif: 1, vita: 3, prezzo: 16,
                    dice: 'Due corna e tanto ferro: para, e ti tiene in piedi.' },
  cappuccio: { em: '🎩', nome: 'Cappuccio', dove: 'testa', famiglia: 'stoffa', copricapo: true, dif: 1, prezzo: 10,
               dice: 'Stoffa fitta, cucita doppia: sbagliare fa un po\' meno male.' },
  cerchietto: { em: '👑', nome: 'Cerchietto', dove: 'testa', famiglia: 'stoffa', copricapo: true, dif: 1, luce: 1, prezzo: 16,
                dice: 'Para poco, e brilla: vedi un po\' più in là.' },
  'cappello-mago': { em: '🎩', nome: 'Cappello a punta', dove: 'testa', famiglia: 'stoffa', copricapo: true, dif: 1, vita: 3, prezzo: 16,
                     dice: 'Il cappello di chi studia le stelle: para, e ti tiene in piedi.' },

  'amuleto-osso': { em: '🦴', nome: 'Amuleto d\'ossa', sprite: 'ossa', dove: 'collo',
                    dif: 1, vita: 4, prezzo: 24,
                    dice: 'Para un pochino, e ti tiene in piedi un po\' di più.' },
  'teschio-cercatore': { em: '💀', nome: 'Teschio del cercatore', sprite: 'amuleto-teschio',
                         dove: 'collo', gemme: 1, prezzo: 32,
                         dice: 'Ogni gemma che raccogli vale il doppio.' },

  // le armi dei mostri grossi (dati/pezzi.js, DEI_GROSSI): basi senza famiglia, che non si vendono e non si pescano
  mazza: { em: '🔨', nome: 'Mazza', sprite: 'mazza', dove: 'mano', mani: 1, att: 1, prezzo: 14, deiGrossi: true, genere: 'f',
           dice: 'Pesante e ammaccata: chi la prende in testa ci pensa due volte.' },
  martello: { em: '🔨', nome: 'Martello', sprite: 'martello', dove: 'mano', mani: 1, att: 2, prezzo: 24, deiGrossi: true,
              dice: 'Batte come un fabbro, e scotta.' },

  // i consumabili non hanno uno sprite: si vedono col loro modello (scena3d/roba3d/pozioni.js), nei pannelli e per terra
  // le cinque cure (docs/sotterraneo/roba.md, «Le pozioni»): numeri fissi, e più è grande più costa ogni punto di vita.
  // `dalla`: da quante discese finite la guaritrice la mette sul banco; `tutta`: rimette tutta la vita
  'pozione-piccola': { em: '🧪', nome: 'Boccetta', usa: 'cura', cura: 8, genere: 'f',
                       prezzo: 8, dalla: 0, dice: 'Otto punti di vita, subito.' },
  pozione: { em: '🧪', nome: 'Pozione', usa: 'cura', cura: 14, prezzo: 21, genere: 'f', dalla: 1,
             dice: 'Quattordici punti di vita, subito.' },
  'pozione-grande': { em: '🍷', nome: 'Ampolla', usa: 'cura', cura: 30, genere: 'f',
                      prezzo: 75, dalla: 3, dice: 'Trenta punti di vita: ti rimette in piedi.' },
  'ampolla-maggiore': { em: '🍷', nome: 'Ampolla maggiore', usa: 'cura', cura: 50, genere: 'f',
                        prezzo: 200, dalla: 5, dice: 'Cinquanta punti di vita: per le discese che fanno male.' },
  // non si compra: cade dal grosso, da un caporale o da un forziere (bottino.js, `ampollaCade`), ed è quella da tenere per un boss
  'ampolla-vita': { em: '🍷', nome: 'Ampolla della vita', usa: 'cura', tutta: true, prezzo: 120, rarissimo: true,
                    genere: 'f', dice: 'Tutta la vita, subito. Una sola, da tenere per un boss.' },
  // l'energia delle abilità (docs/sotterraneo/abilita.md): si beve dallo zaino, fra uno scontro e l'altro
  'pozione-blu': { em: '🧪', nome: 'Pozione blu', usa: 'energia', energia: 8, prezzo: 8, genere: 'f',
                   dice: 'Otto punti di energia, per le abilità.' },
  // la boccetta grande dell'energia: stesso disegno, nome epico (l'utente, 9 ottobre)
  'ampolla-blu': { em: '🧪', nome: 'Ampolla delle stelle', usa: 'energia', energia: 16, prezzo: 18, genere: 'f',
                   dice: 'Sedici punti di energia: un fiume per le abilità.' },
  // l'unica che non torna indietro: alza la vita massima dell'eroe per sempre (crescita.elisir). Un ritrovamento rarissimo,
  // mai in vendita (`rarissimo`: fuori da IN_VENDITA); il prezzo resta per quando lo si rivende (docs/sotterraneo/rarita.md)
  'elisir-toro': { em: '🐂', nome: 'Elisir del toro',
                   usa: 'cresci', cresce: 3, prezzo: 22, rarissimo: true,
                   dice: 'Tre punti di vita massima, per sempre.' },
  // l'unità è la stanza e non il tempo: un conto a orologio farebbe pagare la luce a chi legge piano
  torcia: { em: '🔥', nome: 'Torcia', usa: 'luce', genere: 'f',
            stanze: STANZE_TORCIA, prezzo: 5,
            dice: `La prendi e si accende: ${STANZE_TORCIA} stanze di luce, poi si spegne.` },
  chiave: { em: '🗝️', nome: 'Chiave', usa: 'porta', prezzo: 6, genere: 'f',
            dice: 'Apre una porta senza rispondere.' },
  // lo sprite è un rotolo col sigillo ritagliato da scudi.png (il foglietto, strumenti/sprite/sorgenti/sotterraneo/generati/scudi.json)
  'pergamena-portale': { em: '📜', nome: 'Pergamena del portale', usa: 'portale', prezzo: PREZZO_PERGAMENA, genere: 'f', dopo: 'quaderno',
                         dice: 'La apri e si accende un portale: ti porta a casa, e quando torni giù riparti proprio da qui.' },
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
  let rarita, abilita, nome = null, unico = null, storia = null, modello = null
  if (lettera === 'u') {
    const u = UNICI[parti[2]]
    if (!u || u.base !== base || parti.length !== 3) return undefined
    rarita = u.rarita; abilita = u.abilita; nome = u.nome; unico = parti[2]; storia = u.storia || null; modello = u.modello || null
  } else {
    rarita = RARITA_DA_LETTERA[lettera]
    if (!rarita || rarita === 'leggendario') return undefined
    abilita = parti.slice(2)
    if ((rarita === 'comune') !== !abilita.length) return undefined
    if (abilita.some(a => !ABILITA_DEI_PEZZI[a]) || new Set(abilita).size !== abilita.length) return undefined
  }
  const c = { ...b, chiave: k, base, liv, rarita, unico, storia, abilita: {}, ...(modello ? { modello } : {}) }
  // il pezzo col nome ha la sua figura, chiamata come lui; uno trovato ne prende una fra quelle della sua base
  c.sprite = (unico && b.dove !== 'testa' && (UNICI[unico].figura || unico)) || aspettoDi(k, base, rarita, abilita) || b.sprite   // `figura`: una dei fogli, finché la sua non c'è
  // il livello sul numero principale, anche per un pezzo comune
  // (e un'arma a due mani anche quanto cresce lo scudo che non porta)
  if (b.dove === 'mano') c.att = (c.att || 0) + Math.floor((liv - 1) / ATT_OGNI_LIVELLI) +
    (b.mani === 2 ? PESO_DELLA_DIFESA * Math.floor((liv - 1) / DIF_OGNI_LIVELLI) : 0)
  else if (b.dove === 'mancina' || b.dove === 'corpo') c.dif = (c.dif || 0) + Math.floor((liv - 1) / DIF_OGNI_LIVELLI)
  else if ((b.dove === 'dito' || b.dove === 'collo') && b.vita) c.vita = b.vita + Math.floor((liv - 1) / VITA_OGNI_LIVELLI)
  else if (b.dove === 'testa') {
    if (b.dif) c.dif = b.dif + Math.floor((liv - 1) / DIF_TESTA_OGNI_LIVELLI)
    if (b.vita) c.vita = b.vita + Math.floor((liv - 1) / VITA_TESTA_OGNI_LIVELLI)
  }
  const f = RARITA[rarita].forza
  for (const a of abilita) {
    const v = ABILITA_DEI_PEZZI[a].valore(liv, f)
    c.abilita[a] = v
    c[a] = Math.round(((c[a] || 0) + v) * 100) / 100
  }
  c.prezzo = Math.max(1, Math.round((b.prezzo || 1) * valoreDelLivello(liv) * RARITA[rarita].molt))
  // al banco costa di più: la rarità pesa molto più di quanto si incassa rivendendo (dati/pezzi.js, `acq`)
  c.prezzoAcquisto = Math.max(1, Math.round((b.prezzo || 1) * valoreDelLivello(liv) * RARITA[rarita].acq))
  c.nome = nome || nomeDelPezzo(b, rarita, abilita, liv)
  return c
}

// L'aspetto di un pezzo trovato (docs/sotterraneo/figure.md): fra le figure della sua base quelle del pregio della
// rarità, poi quelle che richiamano la prima abilità che ne ha, poi una sola, scelta dalla chiave: lo stesso pezzo
// ha sempre la stessa figura, anche ricaricato
export function aspettoDi(k, base, rarita, abilita = []) {
  const tutte = ASPETTI[base]
  if (!tutte || !tutte.length) return null
  const [da, a] = RARITA[rarita].pregio
  let scelte = tutte.filter(f => f.pregio >= da && f.pregio <= a)
  if (!scelte.length) scelte = tutte
  for (const x of abilita) {
    const giuste = scelte.filter(f => (TINTE_DELLE_ABILITA[x] || []).includes(f.tinta))
    if (giuste.length) { scelte = giuste; break }
  }
  let h = 2166136261
  for (let i = 0; i < k.length; i++) h = Math.imul(h ^ k.charCodeAt(i), 16777619)
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)   // chiavi quasi uguali («manto@2», «manto@3») non si alternano su due
  h = (h ^ (h >>> 16)) >>> 0
  return scelte[h % scelte.length].sprite
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
// le basi che si trovano e si comprano: senza le armi dei mostri grossi, e senza i copricapi (sotto)
export const PEZZI_DI_BASE = CHIAVI_COSE.filter(k => COSE[k].dove && !COSE[k].deiGrossi && !COSE[k].copricapo)
// i copricapi: un elenco a parte, perché il bottino e i banchi di sempre (il banco di prova, la taratura) restino quelli di
// prima; li pescano solo `copricapoDalTrovato` (motore/bottino.js) e le linguette `copricapi` (dati/mercanti.js), dove sono accesi
export const COPRICAPI = CHIAVI_COSE.filter(k => COSE[k].dove === 'testa')

// due elenchi diversi: dal forziere non escono chiavi né boccette
export const IN_VENDITA = CHIAVI_COSE.filter(k => COSE[k].prezzo && !COSE[k].deiGrossi && !COSE[k].rarissimo && !COSE[k].copricapo)
export const SCUDI = CHIAVI_COSE.filter(k => COSE[k].dove === 'mancina')

// stanno fuori dal sorteggio (la guaritrice le ha sempre, dalla discesa in cui `dalla` le mette sul banco); l'elisir e l'ampolla
// della vita non ci sono: non si comprano, si trovano (bottino.js, `elisirCade`, `ampollaCade`)
export const CURE = CHIAVI_COSE.filter(k => COSE[k].usa === 'cura')
export const CURE_IN_VENDITA = CURE.filter(k => !COSE[k].rarissimo)

// la pergamena non si pesca: sta sul banco dell'incantatrice dopo la sua missione, e cade da sola (bottino.js, `pergamenaCade`)
export const A_SORTE = IN_VENDITA.filter(k => !CURE.includes(k) && !COSE[k].dopo)

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
  'pozione', 'pozione-grande', 'torcia', 'pozione-blu', 'ampolla-blu',
]

// `nomi` arriva da fuori: questo file non importa la grafica, o il motore smetterebbe di girare in Node
export function guastiDelleCose(nomi = null) {
  const g = []
  if (nomi) for (const [k, c] of Object.entries(COSE))
    if (c.sprite && !nomi.includes(c.sprite))
      g.push(`${k}: nell'atlante non c'è lo sprite "${c.sprite}"`)
  if (nomi) for (const k of Object.keys(UNICI))
    if (UNICI[k].modello) continue   // un copricapo col nome: lo disegna un modello 3D, niente figura
    else if (!nomi.includes(UNICI[k].figura || k)) g.push(`${k}: ha il nome proprio, ma nell'atlante non c'è la sua figura`)
  for (const [base, figure] of Object.entries(ASPETTI)) {
    if (!BASI[base] || !BASI[base].dove) g.push(`aspetti di "${base}": non è un pezzo che si indossa`)
    if (nomi) for (const f of figure) if (!nomi.includes(f.sprite)) g.push(`${base}: nell'atlante non c'è l'aspetto "${f.sprite}"`)
  }
  for (const [k, c] of Object.entries(COSE)) {
    if (!c.em || !c.nome) g.push(`${k}: senza emoji o senza nome`)
    if (!c.dice) g.push(`${k}: non dice cosa fa, e il mercante lo mostra`)
    if (!c.dove && !c.usa) g.push(`${k}: né si indossa né si usa, quindi non fa niente`)
    if (c.dove && !TIPI_DI_POSTO.includes(c.dove)) g.push(`${k}: si indossa su "${c.dove}"?`)
    if (c.dove === 'mancina' && !c.dif) g.push(`${k}: nella mano debole, ma non para`)
    if (c.dove === 'corpo' && !c.dif) g.push(`${k}: si mette addosso, ma non para`)
    // il copricapo non ha sprite: lo disegnano i modelli dei copricapi, e senza modello si vede la sua emoji; armi e scudi li disegna
    // sempre un modello (la figura, o il ripiego della collezione: unita/sotterraneo-roba-3d), e tre armi non hanno sprite
    if (c.dove && !['testa', 'mano', 'mancina'].includes(c.dove) && !c.sprite) g.push(`${k}: si indossa, ma non ha un pezzo disegnato`)
    if (c.dove === 'testa' && !(c.dif || c.vita)) g.push(`${k}: in testa, ma non para e non tiene in piedi`)
    if (c.dove === 'testa' && !c.copricapo) g.push(`${k}: in testa senza \`copricapo\`, entrerebbe nel bottino di sempre`)
    if (c.usa === 'cura' && !c.cura && !c.tutta) g.push(`${k}: cura zero`)
    if (c.usa === 'luce' && !(c.stanze > 0)) g.push(`${k}: fa luce, ma non dice per quante stanze`)
    if ((c.dove === 'dito' || c.dove === 'collo') && !(c.luce || c.gemme || c.vita || c.dif))
      g.push(`${k}: al dito o al collo, ma non fa niente`)
  }
  // le quattro famiglie devono valere lo stesso, a parità di mani: chi ne chiede due picchia quanto la mano che perde in più, non meno né di più
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
    if (aUna.length && aDue.length && COSE[aDue[0]].att - COSE[aUna[0]].att !== PESO_DELLA_DIFESA * GRADINI[grado - 1].mano)
      g.push(`gradino ${grado}: a due mani ${COSE[aDue[0]].att} contro ${COSE[aUna[0]].att}, ` +
             `e la mano che resta libera ne vale ${PESO_DELLA_DIFESA * GRADINI[grado - 1].mano}`)
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
    if (COPRICAPI.filter(k => COSE[k].famiglia && portaLa(e, COSE[k])).length < 2) g.push(`${e.chiave}: meno di due copricapi suoi`)
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
  if (!CURE_IN_VENDITA.length) g.push('niente che curi, e sul banco ci sta sempre')
  if (!CURE_IN_VENDITA.some(k => !COSE[k].dalla)) g.push('nessuna cura sul banco fin dalla prima discesa')
  const vendute = CURE_IN_VENDITA.filter(k => COSE[k].cura).sort((a, b) => COSE[a].cura - COSE[b].cura)
  for (let i = 1; i < vendute.length; i++) {
    const [p, q] = [COSE[vendute[i - 1]], COSE[vendute[i]]]
    if (q.cura <= p.cura * 1.5 || q.prezzo / q.cura <= p.prezzo / p.cura * 1.3 || (q.dalla || 0) < (p.dalla || 0))
      g.push(`${vendute[i]}: il salto sulla cura o sul prezzo per punto non è deciso, o arriva prima di ${vendute[i - 1]}`)
  }
  if (A_SORTE.length < 5) g.push(`solo ${A_SORTE.length} cose da pescare: il banco ne vuole cinque`)
  return g
}
