// Le zone che si potenziano (docs/sotterraneo/zone.md): finita la storia, una discesa già fatta si sveglia al livello
// dell'eroe, il minatore lo racconta, e in fondo aspetta il suo mostro grosso più forte di prima. Battuto lui se ne
// sveglia un'altra, a giro. Qui i dati: l'ordine, i nomi e le storie, la forma e quanto picchiano. Le regole (quale
// zona, a che livello, di che colore è il pallino) stanno in motore/zone.js.
import { CAMPAGNA, tappaDi } from './campagna.js'

// L'ordine in cui si svegliano: tre zone delle cantine, due della fornace (la roccia della miniera), due della cripta,
// poi si ricomincia. Lo scenario resta lo stesso per qualche zona di fila: si sente di essere passati a un altro posto
export const ORDINE_DELLE_ZONE = ['cantine', 'gallerie', 'labirinto', 'torre', 'fondo', 'cisterna', 'altare']

// La zona potenziata ha il nome e la storia sue; `annuncio` è quello che racconta il minatore. La chiave della discesa
// resta quella (le missioni, il mostro grosso e il posto sulla mappa la leggono)
export const POTENZIATE = {
  cantine: { nome: 'La scalinata degli orchi', dritta: 'gli orchi hanno preso la scalinata: cinque piani di tamburi',
             annuncio: 'Gli orchi hanno preso la scalinata antica: i loro tamburi si sentono fin qui. Li comanda Grumo, e la sua mazza è più pesante di prima.' },
  gallerie: { nome: 'La grotta delle ragnatele', dritta: 'piani piccoli, ma sei: e tutto è bianco di ragnatele',
              annuncio: 'Nella grotta della scaletta è tutto bianco di ragnatele. Zannaverde ha avuto i piccoli, e i piccoli sono cresciuti.' },
  labirinto: { nome: 'Il labirinto del Minotto', dritta: 'cinque piani di labirinto: senza mappina ci si perde',
               annuncio: 'Sotto la botola si sente un muggito che fa tremare il prato. Minotto è tornato, e il labirinto è più profondo di prima.' },
  torre: { nome: 'La torre infernale', dritta: 'dalla torre esce fumo rosso: cinque piani di fuoco',
           annuncio: 'Dalla torre in rovina esce fumo rosso: è diventata una torre infernale. Fiammetta ha acceso tutti i piani, uno per uno.' },
  fondo: { nome: 'La miniera infestata', dritta: 'stretta, profonda e infestata: cinque piani',
           annuncio: 'C\'è un\'infestazione nella vecchia miniera: i minatori sono scappati senza nemmeno i picconi. In fondo brucia Carbonchio, più forte di prima.' },
  cisterna: { nome: 'La cisterna nera', dritta: 'l\'acqua è nera, e la scala scende per cinque piani',
              annuncio: 'L\'acqua dello stagno è diventata nera come l\'inchiostro. Gorgo si è svegliato, e gorgoglia più forte di prima.' },
  altare: { nome: 'La cripta profanata', dritta: 'qualcuno ha spostato la pietra: cinque piani di ossa',
            annuncio: 'Qualcuno ha spostato la pietra dell\'altare. Re Ossuto ha chiamato a sé tutte le ossa della cripta, e la corona gli sta di nuovo bene.' },
}
// la riga che chiude ogni annuncio: dove sta la zona la dice il pallino sulla mappa
export const ANNUNCIO_IN_CODA = 'Adesso laggiù è tutto alla tua altezza.'
// la riga in fondo alla terra di sopra, finché il minatore non l'ha raccontata
export const C_E_UNA_NOTIZIA = 'Il minatore ha una notizia: vai a sentirla.'

// Chi lo dice, nel fumetto di una discesa, secondo il colore del suo pallino (motore/zone.js, coloreDi): la guardia
// davanti alla rossa (e non si scende), il minatore per la grigia e l'arancio. La verde non ha bisogno di niente
export const DETTI_DEL_COLORE = {
  rosso: { chi: 'La sentinella', detto: 'Alt! Laggiù è troppo pericoloso per te: non ti faccio passare. Fatti le ossa dove il pallino è verde, e torna.' },
  arancio: { chi: 'Il minatore ti ha visto passare', detto: 'Laggiù sono più forti di te. Si può tentare, ma porta pozioni.' },
  grigio: { chi: 'Il minatore ti ha visto passare', detto: 'Laggiù non c\'è più niente alla tua altezza: poca esperienza, e roba da poco.' },
}

// zone corte, non una discesa senza fondo: cinque piani, sei nella grotta che li ha piccoli
export const PIANI_DELLA_ZONA = 5
export const PIANI_DELLA_GROTTA = 6
// le domande sono quelle dell'abisso: in cima alla finestra dell'età, fino al tetto (dati/campagna.js, DIF_ABISSO)
export const DIF_DELLA_ZONA = [0.92, 1]

// Quanto sono forti i mostri di una zona al livello L: `forza` moltiplica le ossa di tutti, `spinta` aggiunge al loro
// attacco, come nelle discese della storia (dati/campagna.js). Crescono in linea retta col livello, mai esponenziali,
// tarati col banco sull'eroe atteso a quel livello (misure/sotterraneo, docs/sotterraneo/zone.md «Le misure»)
export const FORZA_A_12 = 4, FORZA_PER_LIVELLO = 0.5
export const SPINTA_A_12 = 15, SPINTA_PER_LIVELLO = 0.65
// a pari livello le zone non vengono uguali: la cripta ha piani di quattro stanze e pochi mostri prima della chiave,
// la botola sedici. Questo numero corregge la forza zona per zona (1 di difetto), misurato col banco
export const FORMA_DELLA_ZONA = { altare: 1.6, torre: 1.05, cisterna: 0.9, fondo: 0.9, labirinto: 0.9 }

export const forzaDellaZona = (L, chiave) =>
  Math.round(Math.max(1, FORZA_A_12 + FORZA_PER_LIVELLO * (L - 12)) * (FORMA_DELLA_ZONA[chiave] || 1) * 100) / 100
export const spintaDellaZona = L => Math.max(0, Math.round(SPINTA_A_12 + SPINTA_PER_LIVELLO * (L - 12)))

// La discesa `k` della storia potenziata al livello L: la stessa discesa (la chiave, la forma dei piani, lo scenario, i
// guardiani e il mostro grosso), più piani, le domande dell'abisso e i mostri del livello. `potenza` dice che è
// potenziata e a che livello: la sosta lo scrive, e rientrando si rifà la stessa zona (motore/sosta.js)
export function zonaPotenziata(k, L) {
  const t = CAMPAGNA[k]
  const p = POTENZIATE[t.chiave]
  const livello = Math.max(1, Math.round(L))
  return {
    ...t,
    potenza: livello,
    nome: p.nome, dritta: p.dritta,
    piani: t.piani >= PIANI_DELLA_ZONA ? PIANI_DELLA_GROTTA : PIANI_DELLA_ZONA,
    dif: DIF_DELLA_ZONA,
    livello,
    forza: forzaDellaZona(livello, t.chiave),
    spinta: spintaDellaZona(livello),
  }
}

// la discesa `indice` com'è: la zona potenziata se c'è una potenza, se no quella della storia (o l'abisso)
export const zonaDi = (indice, potenza = null) =>
  (potenza && CAMPAGNA[indice] ? zonaPotenziata(indice, potenza) : tappaDi(indice))

export function guastiDelleZone() {
  const g = []
  const chiavi = CAMPAGNA.map(t => t.chiave)
  if (new Set(ORDINE_DELLE_ZONE).size !== chiavi.length || !chiavi.every(k => ORDINE_DELLE_ZONE.includes(k)))
    g.push('l\'ordine delle zone non ha ogni discesa una volta sola')
  for (const k of chiavi) {
    const p = POTENZIATE[k]
    if (!p || !p.nome || !p.dritta || !p.annuncio) g.push(`${k}: la zona potenziata senza nome, dritta o annuncio`)
  }
  for (let L = 12; L <= 60; L++) {
    if (forzaDellaZona(L) < forzaDellaZona(L - 1)) g.push(`al livello ${L} le zone si indeboliscono`)
  }
  return g
}
