// Il volo infinito: un volo solo, tabelline e calcolo a mente insieme, che
// si complica col livello della partita (la mira si sposta sulla scala di
// difficoltà 0..1, e oltre il catalogo continua sulle tabelline grandi).
// Dettagli e perché in docs/asteroidi/volo.md.
// Puro: riceve `items` e un `now`, non importa il profilo.
import { stima, banale, chiaviDelle, TUTTE_LE_TABELLE } from './tabelline.js'
import { GRANDI, eGrande, fattoriDi } from '../data/tabelline.js'
import { STAZIONI, CONCETTI, chiaviDi, concettoDiChiave } from '../data/calcolo.js'

// la mira parte da MIRA_MIN (non zero, che sarebbe ×1/×10) e arriva a uno
// (il catalogo) a LIVELLO_CATALOGO, poi a MIRA_OLTRE (le grandi) a
// LIVELLO_TETTO; sopra il tetto sale solo la velocità del cielo
export const LIVELLO_CATALOGO = 9
export const LIVELLO_TETTO = 12
export const MIRA_MIN = 0.15
export const MIRA_OLTRE = 1.4
export const miraDelLivello = livello => {
  if (livello <= LIVELLO_CATALOGO)
    return MIRA_MIN + (1 - MIRA_MIN) * dentro01((livello - 1) / (LIVELLO_CATALOGO - 1))
  return 1 + (MIRA_OLTRE - 1) *
         dentro01((livello - LIVELLO_CATALOGO) / (LIVELLO_TETTO - LIVELLO_CATALOGO))
}

/* ── LA TAGLIA DEL VOLO ──
   Quanto grandi i numeri dentro un concetto a mente, dato il livello:
   zero a livello 1, uno al tetto. Nelle tappe la taglia è quella della
   forza del concetto (`tagliaDi` in `store/calcolo.js`), e resta così;
   nel volo è del livello e basta, perché un concetto consolidato a
   taglia piena usciva uguale a livello 1 e a livello 10, e uno non
   consolidato restava piccolo anche a livello 10. Passa a
   `esercizioDaChiave` come opzione, non come globale. */
export const tagliaDelVolo = livello => dentro01((livello - 1) / (LIVELLO_TETTO - 1))

/* ── LA CAMPANA ──
   Quanto pesa una casella a distanza `altezza − mira`. A 0.2 di banda
   una classe intera di distanza (le tabelline del 2-3-5 contro quelle
   del 4-6-7-8-9 stanno a ~0.35) pesa il 5%: esiste, capita di rado.
   È la stessa forma di `pesoDi` dei quiz, dove la banda vale 11 su 100. */
export const BANDA = 0.2
export const pesoAltezza = (altezza, mira, banda = BANDA) =>
  Math.exp(-(((altezza - mira) / banda) ** 2))

/* ── LE DUE SCALE, RIPORTATE A 0..1 ──
   Tabelline: `stima` va da ~2 (2×2) a ~4.4 (9×9) — è la somma di quanto
   vanno saputi a memoria i due fattori, più un pelo per la taglia — e
   qui diventa 0.14 (2×2) · 0.5 (3×7) · 0.93 (9×9). ×1 e ×10 stanno a
   zero: sono regole. Le grandi stanno sopra l'uno (`altezzaGrande`). */
export const altezzaTabellina = k =>
  eGrande(k) ? altezzaGrande(k) : banale(k) ? 0 : dentro01((stima(k) - 1.6) / 3)

/* Le grandi, fra 1 e `MIRA_OLTRE`: quanto costa il fattore grande (l'11
   si fa «scrivi due volte», il 12 e il 13 si spezzano, il 14 e il 15
   costano ancora un po'), più mezzo punto se anche l'altro fattore va
   saputo (il 6-7-8-9), un punto se sono grandi tutti e due, e un pelo
   per la taglia del prodotto. 11×2 sta appena sopra 9×9, 12×12 in cima. */
const COSTO_GRANDE = { 11: 1, 12: 2, 13: 2, 14: 2.2, 15: 2.4 }
const COSTO_MAX = 3.5
export function altezzaGrande(k) {
  const [lo, hi] = fattoriDi(k)
  const costo = (COSTO_GRANDE[hi] || COSTO_MAX) + (lo >= 11 ? 1 : lo >= 6 ? 0.5 : 0)
                + (lo * hi) / 300
  return 1 + 0.05 + (MIRA_OLTRE - 1.05) * dentro01((costo - 1) / (COSTO_MAX - 1))
}

/* Calcolo a mente: la stazione in cui il concetto è arrivato, sulla fila
   delle stazioni che insegnano qualcosa (l'esame in coda non conta). Un
   fatto che sta in due concetti vale per il padrone, il più elementare
   (`concettoDiChiave`), come nella marea. */
const STAZIONE_DEL = new Map()
STAZIONI.forEach(S => S.nuovi.forEach(id => STAZIONE_DEL.set(id, S.i)))
const ULTIMA = Math.max(1, ...STAZIONI.filter(S => S.nuovi.length).map(S => S.i))
export const altezzaMente = k => dentro01((STAZIONE_DEL.get(concettoDiChiave(k)) || 0) / ULTIMA)

/* ── I DUE MAGAZZINI ──
   Le tabelline sono 55 caselle più le grandi. ×1 e ×10 sono 19 di
   quelle, e sono una regola sola: se pesassero come le altre, a livello
   1 la metà delle domande sarebbe 1×7. In fondo alla scala le caselle
   vere sono sei (2-3-5 fra loro), quindi diciannove regole si dividono
   **mezza** casella: a livello 1 ne esce una ogni dieci, non una ogni
   tre. Le grandi non hanno bisogno di un peso loro: stanno sopra l'uno,
   e sotto il livello 7 la campana non ci arriva. */
export const PESO_BANALE = 0.03
export const CASELLE = chiaviDelle(TUTTE_LE_TABELLE)
export const CASELLE_DEL_VOLO = [...CASELLE, ...GRANDI]
export const pesoTabellina = (k, mira) =>
  pesoAltezza(altezzaTabellina(k), mira) * (banale(k) ? PESO_BANALE : 1)

/* Il calcolo a mente è fatto di concetti, e un concetto a fatti (le
   somme entro il dieci) ha decine di chiavi mentre una strategia ne ha
   una: perché due concetti alla stessa altezza pesino uguale, le chiavi
   di un concetto si dividono il suo peso. La mira si ferma a uno: la
   scala delle stazioni finisce lì, e sopra il catalogo per il calcolo a
   mente cresce la taglia, non la stazione. */
export const CHIAVI_MENTE = CONCETTI.flatMap(c => chiaviDi(c.id))
const QUANTE_DEL = new Map(CONCETTI.map(c => [c.id, chiaviDi(c.id).length]))
export const pesoMente = (k, mira) =>
  pesoAltezza(altezzaMente(k), Math.min(1, mira)) / (QUANTE_DEL.get(concettoDiChiave(k)) || 1)

/* ── IL POOL DI UNA DOMANDA ──
   `quanti` chiavi pescate senza rimessa, ognuna con la probabilità del
   suo peso: è la campana fatta elenco. Poi il picker del gioco sceglie
   dentro con la lentezza della marea e il bisogno di ripasso, che è il
   punto 1 di sopra. `items` qui non serve: la scala non dipende dal
   bambino, e quello che dipende da lui lo fa il picker dopo. */
export const QUANTI = 8

export function pescaPesati(chiavi, peso, quanti, sorte = Math.random) {
  const resto = chiavi.map(k => ({ k, p: peso(k) })).filter(x => x.p > 0)
  const out = []
  while (out.length < quanti && resto.length) {
    const tot = resto.reduce((s, x) => s + x.p, 0)
    let r = sorte() * tot, i = 0
    for (; i < resto.length - 1; i++) { r -= resto[i].p; if (r < 0) break }
    out.push(resto[i].k)
    resto.splice(i, 1)
  }
  return out
}

export const poolVoloTabelline = (livello, quanti = QUANTI, sorte = Math.random) =>
  pescaPesati(CASELLE_DEL_VOLO, k => pesoTabellina(k, miraDelLivello(livello)), quanti, sorte)

export const poolVoloMente = (livello, quanti = QUANTI, sorte = Math.random) =>
  pescaPesati(CHIAVI_MENTE, k => pesoMente(k, miraDelLivello(livello)), quanti, sorte)

/* ── LE CASELLE CHE IL BOSS PUÒ CHIEDERE ──
   Il boss del volo pesca la più tosta fra quelle che non reggono
   (`chiaveDelBoss` in `store/tabelline.js`), e le grandi sono le più
   toste per stima: date tutte, il boss di livello 2 chiederebbe 12×12.
   Entrano una per volta, quando la campana le raggiunge davvero — a
   `SOGLIA_BOSS` di peso, cioè a una banda dalla mira. */
export const SOGLIA_BOSS = 0.3
export const caselleDelBoss = livello => {
  const mira = miraDelLivello(livello)
  return CASELLE_DEL_VOLO.filter(k => !eGrande(k) || pesoAltezza(altezzaGrande(k), mira) >= SOGLIA_BOSS)
}

/* ── LA TABELLINA GIRATA ──
   Le divisioni grandi — 132:11, 96:12 — non sono chiavi nuove: sono la
   stessa casella letta al contrario, come «la tabellina girata» fa con
   quelle del catalogo. Una grande su tre esce girata, e si segna sulla
   sua casella: chi sbaglia 96:8 non sa 8×12, ed è quello che va
   ripassato. Le caselle del catalogo non si girano qui — per quelle c'è
   il concetto, con la sua dritta. */
export const QUOTA_GIRATA = 1 / 3
export const giraLaGrande = (k, sorte = Math.random) => eGrande(k) && sorte() < QUOTA_GIRATA

/* ── DA DOVE SI PARTE ──
   Il livello di partenza dato quello del record: due gradini sotto, e
   mai sotto l'1. Due perché una partita sale di un livello ogni cinque
   giuste, quindi sono dieci calcoli di scaldamento — una decina di
   secondi l'uno — prima di tornare dove si era arrivati: di più sarebbe
   la solita fila di 2×3, di meno un tuffo a freddo nel punto in cui si
   è perso. Ed è misurato sulle grandi: chi ha un record a 11 riparte da
   9, dove sono metà del magazzino, e le rivede nelle prime domande;
   a 8 sarebbero una su quattro, cioè forse nessuna prima del boss. */
export const SCALINI_SOTTO = 2
export const partenzaDalRecord = livelloRecord =>
  Math.max(1, Math.floor(Number(livelloRecord) || 0) - SCALINI_SOTTO)

/* tutto quello che il volo può chiedere, per il «da ripassare» di fine
   partita: lì si guarda cosa è andato storto, non cosa è alla mira */
export const chiaviDelVolo = () => [...CASELLE_DEL_VOLO, ...CHIAVI_MENTE]

/* ── L'ALTERNANZA ──
   Da quale magazzino esce la prossima domanda. A monetina, e mai più di
   `MAX_DI_FILA` di seguito dallo stesso: una monetina da sola fa quattro
   tabelline di fila una volta ogni sedici, e a chi gioca sembra che il
   calcolo a mente sia sparito. Il boss non passa di qui — chiede dal
   magazzino dell'ultima domanda, e non si conta. */
export const MAX_DI_FILA = 3
export const MAGAZZINI = ['tabelline', 'mente']

export function creaAlternanza(max = MAX_DI_FILA) {
  let ultimo = null, fila = 0
  return {
    prossimo(sorte = Math.random) {
      if (ultimo && fila >= max) return MAGAZZINI.find(m => m !== ultimo)
      return sorte() < 0.5 ? MAGAZZINI[0] : MAGAZZINI[1]
    },
    segna(magazzino) {
      fila = magazzino === ultimo ? fila + 1 : 1
      ultimo = magazzino
    },
    azzera() { ultimo = null; fila = 0 },
    get max() { return max },
  }
}

function dentro01(x) { return Math.max(0, Math.min(1, x)) }
