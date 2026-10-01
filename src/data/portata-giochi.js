/* Il ponte fra le campagne (data/portata.js, che non sa cosa sia un
   profilo) e chi decide se una carta va in home. Un file a sé e non una
   riga in profile.js perché importare qui quattordici campagne invece che
   là evita un anello di import a senso unico. Non spegne niente: un
   gioco fuori portata non è spento, è solo il conto che decide se la
   carta si offre da sola. Vedi docs/apprendimento/eta-e-portata.md. */
import { giocoDaOffrire, filaConPortata, primaDaGiocare, arcoDelGioco,
         statoDellaTappa, PASSATA, AVANTI } from './portata.js'
import { state, etaDelBambino, saperiSpenti, tappaAperta, tuttoAperto,
         giocoAcceso, giocoForzato } from '../store/profile.js'
import { eccezioniPerEta } from './partenze.js'
import { misure } from '../store/progressi.js'
import { GIOCHI_NUOVI } from '../giochi/indice.js'

import { SCALETTA } from './asteroidi.js'
// l'inglese è quello a mondi, un mondo per anno di scuola (docs/lingue/mondi.md); la campagna vecchia resta al gioco di prima
import { TAPPE as INGLESE } from '../giochi/inglese/dati/mondi.js'
// lo spagnolo pure (docs/lingue/spagnolo.md)
import { TAPPE as SPAGNOLO } from '../giochi/spagnolo/dati/mondi.js'
import { RACCONTO as CASTELLO } from './campagne-castello.js'
import { CAMPAGNA as POZIONI } from '../giochi/pozioni/dati/campagna.js'
import { FILA as BANCARELLA } from './bancarella.js'
import { TAPPE as GENERALE } from './generale.js'
import { CAMPAGNA as CONTA } from '../giochi/conta/dati/campagna.js'
import { CAMPAGNA as PRIMA_DOPO } from '../giochi/prima-dopo/dati/campagna.js'
import { CAMPAGNA as CODICE } from '../giochi/codice-segreto/dati/campagna.js'
import { CAMPAGNA as DUNGEON } from '../giochi/dungeon/dati/campagna.js'
import { CAMPAGNA as SURVIVORS } from '../giochi/survivors/dati/campagna.js'
import { CAMPAGNA as CORSA } from '../giochi/corsa/dati/campagna.js'
import { CAMPAGNA as SOTTERRANEO } from '../giochi/sotterraneo/dati/campagna.js'
import { CAMPAGNA as PASSO_PASSO } from '../giochi/passo-passo/dati/campagna.js'
import { CAMPAGNA as COSTRUTTORE } from '../giochi/costruttore/dati/campagna.js'

// chi non è qui dentro non ha una campagna (la fattoria è un posto): l'assenza vuol dire «non si giudica», non «si nasconde»
export const TAPPE_DEL_GIOCO = {
  mate: SCALETTA.map(v => v.T),
  inglese: INGLESE,
  spagnolo: SPAGNOLO,
  torri: CASTELLO,
  pozioni: POZIONI,
  bancarella: BANCARELLA,
  generale: GENERALE,
  conta: CONTA,
  prima: PRIMA_DOPO,
  codice: CODICE,
  dungeon: DUNGEON,
  survivors: SURVIVORS,
  corsa: CORSA,
  sotterraneo: SOTTERRANEO,
  passo: PASSO_PASSO,
  costruttore: COSTRUTTORE,
}

const regole = () => ({ eta: etaDelBambino(), spenti: saperiSpenti() })

// un gioco cominciato non sparisce mai: i vecchi si riconoscono dal loro contatore, i nuovi da albo.provato
const CONTATORE_VECCHIO = {
  mate: 'math', inglese: 'en', spagnolo: 'es', torri: 'torri',
  bancarella: 'clienti', generale: 'missioni',
}

export function giaProvato (chiave) {
  const t = (state.profile && state.profile.totals) || {}
  const vecchio = CONTATORE_VECCHIO[chiave]
  if (vecchio) return (t[vecchio] || 0) > 0 ||
    (chiave === 'inglese' && (t.verbi || 0) > 0)
  const g = GIOCHI_NUOVI.find(x => x.chiave === chiave)
  if (!g || !g.albo || typeof g.albo.provato !== 'function') return false
  try { return !!g.albo.provato(misure(state.profile)) } catch { return false }
}

// un gioco che il profilo non nomina vale quello che la partenza di oggi scriverebbe: si legge, non si scrive (vedi eta-e-portata.md)
const spentoDallEta = chiave => {
  const scelto = ((state.profile && state.profile.settings.giochi) || {})[chiave]
  return typeof scelto !== 'boolean' &&
    eccezioniPerEta(etaDelBambino()).giochi[chiave] === false
}

// un gioco senza campagna (la fattoria) non si giudica; un gioco cominciato non sparisce mai
export function giocoDaVedere (chiave, { provato = null, fatte = 0 } = {}) {
  const tappe = TAPPE_DEL_GIOCO[chiave]
  const dallEta = spentoDallEta(chiave)
  if (!tappe && !dallEta) return true
  const gia = provato == null ? giaProvato(chiave) : provato
  if (dallEta) return gia
  return giocoDaOffrire(tappe, { ...regole(), provato: gia, fatte })
}

// la fanno in due (le carte della home e le novità dei bambini): sta qui perché due copie divergerebbero
export const inCasa = chiave =>
  giocoAcceso(chiave) && (giocoForzato(chiave) || giocoDaVedere(chiave))

export const filaDelGioco = chiave =>
  filaConPortata(TAPPE_DEL_GIOCO[chiave] || [], regole())

export const daDoveComincia = chiave =>
  primaDaGiocare(TAPPE_DEL_GIOCO[chiave] || [], regole())

/* per la schermata dei grandi: «questo gioco va dai 5 ai 9 anni» */
export const arcoDi = chiave => arcoDelGioco(TAPPE_DEL_GIOCO[chiave] || [])


// il lucchetto: passato nasce aperto, oltre la mira resta chiuso comunque (tuttoAperto() dei grandi passa davanti a tutto)
const oltreLEta = stato => stato === AVANTI && !tuttoAperto()

export function apertaQui (tappa, i, fatte) {
  const stato = tappa ? statoDellaTappa(tappa, regole()) : null
  if (stato === PASSATA) return true
  if (oltreLEta(stato)) return false
  return tappaAperta(i, fatte)
}

// perMerito: chi ha vinto la tappa prima va avanti oltre la mira (l'età resta ciò che decide se la carta si offre)
const perMerito = chiave => !!(GIOCHI_NUOVI.find(g => g.chiave === chiave) || {}).perMerito

export const tappaApertaQui = (chiave, i, fatte) =>
  (perMerito(chiave) && tappaAperta(i, fatte)) || apertaQui((TAPPE_DEL_GIOCO[chiave] || [])[i], i, fatte)

// due lucchetti diversi: quello di sempre si apre andando avanti, questo no («continua per aprirla» sarebbe falso)
export const tappaChiusaPerEtaQui = (chiave, i) => {
  const tappa = (TAPPE_DEL_GIOCO[chiave] || [])[i]
  return !!tappa && !perMerito(chiave) && oltreLEta(statoDellaTappa(tappa, regole()))
}
