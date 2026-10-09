// Le zone (docs/sotterraneo/zone.md): finita la storia ogni discesa è una zona con una fascia di livelli fissa
// («livello 14–17»), che tiene finché l'eroe non la supera di tanto; allora rinasce in cima, sopra la più alta, con un
// nome e una storia nuovi che il minatore racconta. Qui i dati: l'ordine, le fasce, i nomi e gli annunci, quanto
// picchiano. Le regole (che fascia ha una zona adesso, di che colore è il pallino) stanno in motore/zone.js.
import { CAMPAGNA, tappaDi } from './campagna.js'

// L'ordine in cui nascono, dalla fascia più bassa: tre zone delle cantine, due della fornace (la roccia della miniera),
// due della cripta. Rinascono nello stesso ordine: lo scenario resta lo stesso per qualche rinascita di fila
export const ORDINE_DELLE_ZONE = ['cantine', 'gallerie', 'labirinto', 'torre', 'fondo', 'cisterna', 'altare']

// La fascia: LARGA livelli («14–17»), e fra l'inizio di una fascia e quello della dopo PASSO livelli. Fino a MARGINE
// livelli sotto la fascia la zona è arancio, oltre rossa; fino a MARGINE sopra grigia, oltre non ha più senso e
// rinasce GIRO livelli più su (sette zone per due: sopra la più alta). Così a ogni livello ce ne sono due grigie,
// due verdi, due arancio e una rossa
export const LARGA = 4
export const PASSO = 2
export const MARGINE = 4
export const GIRO = PASSO * ORDINE_DELLE_ZONE.length
// dove nasce la prima: con le altre a due a due, all'eroe del 12 che finisce la storia tocca 6–9, 8–11 (grigie),
// 10–13, 12–15 (verdi), 14–17, 16–19 (arancio) e 18–21 (rossa)
export const PRIMA_FASCIA = 6
export const NASCITA = Object.fromEntries(ORDINE_DELLE_ZONE.map((k, i) => [k, PRIMA_FASCIA + PASSO * i]))

// la volta della zona `chiave` che comincia al livello `da`: 0 la prima, 1 dopo una rinascita… (giù anche negativa, per
// un eroe così basso che le fasce di nascita sono già troppo alte: non capita finendo la storia)
export const voltaDi = (chiave, da) => Math.floor((da - NASCITA[chiave]) / GIRO)

// I volti di una zona, uno per rinascita, poi si ricomincia. `annuncio` è quello che racconta il minatore quando
// rinasce. La chiave della discesa resta quella (le missioni, il mostro grosso e il posto sulla mappa la leggono)
export const VOLTI = {
  cantine: [
    { nome: 'La scalinata degli orchi', dritta: 'gli orchi hanno preso la scalinata: cinque piani di tamburi',
      annuncio: 'Gli orchi hanno preso la scalinata antica: i loro tamburi si sentono fin qui. Li comanda Grumo, e la sua mazza è più pesante di prima.' },
    { nome: 'La scalinata del clan', dritta: 'gli orchi sono tornati in tanti: cinque piani di fuochi',
      annuncio: 'Grumo è tornato, e non è solo: ha chiamato tutto il suo clan. Hanno acceso un fuoco su ogni gradino della scalinata antica.' },
    { nome: 'La scalinata di ferro', dritta: 'grate di ferro su ogni gradino: cinque piani',
      annuncio: 'Sulla scalinata antica battono martelli giorno e notte: gli orchi l\'hanno chiusa con grate di ferro. Grumo si è fatto una mazza nuova, più grossa della sua testa.' },
  ],
  gallerie: [
    { nome: 'La grotta delle ragnatele', dritta: 'piani piccoli, ma sei: e tutto è bianco di ragnatele',
      annuncio: 'Nella grotta della scaletta è tutto bianco di ragnatele. Zannaverde ha avuto i piccoli, e i piccoli sono cresciuti.' },
    { nome: 'La grotta del veleno', dritta: 'sei piani piccoli, e dalle pareti cola veleno',
      annuncio: 'Dalla grotta della scaletta esce un odore che fa lacrimare gli occhi. Zannaverde ha riempito di veleno ogni fessura.' },
    { nome: 'La grotta dei mille occhi', dritta: 'sei piani piccoli, e al buio brillano gli occhi',
      annuncio: 'Chi passa vicino alla grotta della scaletta vede brillare al buio mille occhi. Zannaverde è diventata grande come un carro.' },
  ],
  labirinto: [
    { nome: 'Il labirinto del Minotto', dritta: 'cinque piani di labirinto: senza mappina ci si perde',
      annuncio: 'Sotto la botola si sente un muggito che fa tremare il prato. Minotto è tornato, e il labirinto è più profondo di prima.' },
    { nome: 'Il labirinto degli zoccoli', dritta: 'cinque piani di labirinto, e zoccoli che corrono',
      annuncio: 'Sotto la botola si sentono zoccoli che corrono, notte e giorno. Minotto non dorme più: gira il labirinto e aspetta.' },
    { nome: 'Il labirinto di pietra nera', dritta: 'cinque piani di pietra nera: senza mappina ci si perde',
      annuncio: 'La botola segreta è diventata nera di fuliggine, e dal buco esce un muggito che fa tremare i vetri. Minotto ha le corna più lunghe di prima.' },
  ],
  torre: [
    { nome: 'La torre infernale', dritta: 'dalla torre esce fumo rosso: cinque piani di fuoco',
      annuncio: 'Dalla torre in rovina esce fumo rosso: è diventata una torre infernale. Fiammetta ha acceso tutti i piani, uno per uno.' },
    { nome: 'La torre delle ceneri', dritta: 'cinque piani, e la cenere cade come neve',
      annuncio: 'Sul villaggio cade cenere come neve: viene dalla torre in rovina. Fiammetta ha bruciato tutto quello che c\'era da bruciare, e adesso ha fame.' },
    { nome: 'La torre rovente', dritta: 'le pietre sono rosse di calore: cinque piani',
      annuncio: 'Le pietre della torre in rovina sono diventate rosse, e di notte si vedono da lontano. Fiammetta è più calda che mai.' },
  ],
  fondo: [
    { nome: 'La miniera infestata', dritta: 'stretta, profonda e infestata: cinque piani',
      annuncio: 'C\'è un\'infestazione nella vecchia miniera: i minatori sono scappati senza nemmeno i picconi. In fondo brucia Carbonchio, più forte di prima.' },
    { nome: 'La miniera crollata', dritta: 'gallerie mezze crollate, e un caldo che soffoca: cinque piani',
      annuncio: 'Nella vecchia miniera c\'è stato un crollo, e dalla crepa sale un caldo che scioglie i picconi. Carbonchio si è svegliato là in fondo.' },
    { nome: 'La miniera dei fuochi fatui', dritta: 'cinque piani, e lucine azzurre che non scaldano',
      annuncio: 'Di notte, dalla miniera, escono lucine azzurre che volano via. I vecchi dicono che è Carbonchio che chiama.' },
  ],
  cisterna: [
    { nome: 'La cisterna nera', dritta: 'l\'acqua è nera, e la scala scende per cinque piani',
      annuncio: 'L\'acqua dello stagno è diventata nera come l\'inchiostro. Gorgo si è svegliato, e gorgoglia più forte di prima.' },
    { nome: 'La cisterna dei gorghi', dritta: 'l\'acqua gira e tira giù: cinque piani',
      annuncio: 'Lo stagno si è messo a girare, come una vasca quando si toglie il tappo. Gorgo è là sotto, e tira giù tutto quello che trova.' },
    { nome: 'La cisterna delle nebbie', dritta: 'dalla scala sale nebbia fredda: cinque piani',
      annuncio: 'Dallo stagno sale una nebbia fredda che non se ne va nemmeno a mezzogiorno. Gorgo ci si nasconde dentro, e gorgoglia.' },
  ],
  altare: [
    { nome: 'La cripta profanata', dritta: 'qualcuno ha spostato la pietra: cinque piani di ossa',
      annuncio: 'Qualcuno ha spostato la pietra dell\'altare. Re Ossuto ha chiamato a sé tutte le ossa della cripta, e la corona gli sta di nuovo bene.' },
    { nome: 'La cripta delle campane', dritta: 'a mezzanotte suonano campane: cinque piani di ossa',
      annuncio: 'A mezzanotte, dalla cripta, suonano campane che non ci sono. Re Ossuto chiama a raccolta il suo esercito.' },
    { nome: 'La cripta della corona nera', dritta: 'cinque piani di ossa, e una corona nera',
      annuncio: 'Re Ossuto si è fatto una corona nuova, nera come il carbone. Adesso comanda anche le ossa del cimitero vecchio.' },
  ],
}
export const voltoDi = (chiave, volta) => {
  const v = VOLTI[chiave]
  return v[((volta % v.length) + v.length) % v.length]
}

// la zona appena nata è sempre la rossa: il minatore la racconta, e chiude dicendo che per adesso non si passa.
// La prima volta (la storia appena finita) prima di tutto dice cosa è cambiato
export const ANNUNCIO_IN_CODA = 'Per adesso è troppo forte per te, e la sentinella non ti fa passare: fatti le ossa dove il pallino è verde.'
export const PRIMA_NOTIZIA = 'Hai chiuso tutte le porte, ma laggiù non dorme niente. Adesso ogni discesa ha i suoi livelli, e il pallino ti dice quali fanno per te.'
// la riga in fondo alla terra di sopra, finché il minatore non l'ha raccontata
export const C_E_UNA_NOTIZIA = 'Il minatore ha una notizia: vai a sentirla.'

// Chi lo dice, nel fumetto di una discesa, secondo il colore del suo pallino (motore/zone.js): la guardia
// davanti alla rossa (e non si scende), il minatore per la grigia e l'arancio. La verde non ha bisogno di niente
export const DETTI_DEL_COLORE = {
  rosso: { chi: 'La sentinella', detto: 'Alt! Laggiù è troppo pericoloso per te: non ti faccio passare. Fatti le ossa dove il pallino è verde, e torna.' },
  arancio: { chi: 'Il minatore ti ha visto passare', detto: 'Laggiù sono più forti di te. Si può tentare, ma porta pozioni.' },
  grigio: { chi: 'Il minatore ti ha visto passare', detto: 'Laggiù non c\'è più niente alla tua altezza: poca esperienza, e roba da poco.' },
}

// Quanta della sua esperienza dà un mostro qui: nella zona grigia (l'eroe sopra la fascia) un quarto, se no le grigie,
// facili, rendevano quasi quanto le verdi (misurato: 0,9 livelli a zona contro 1,1); nell'abisso quella che dice
// L_ABISSO (`esp`, dati/campagna.js); altrove tutta
export const ESP_GRIGIA = 0.25
export const espNellaZona = (tappa, livelloEroe) =>
  (tappa && tappa.potenza && livelloEroe > tappa.potenza + LARGA - 1 ? ESP_GRIGIA : (tappa && tappa.esp) || 1)

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

// La discesa `k` della storia fatta zona, con la fascia che comincia al livello L: la stessa discesa (la chiave, la
// forma dei piani, lo scenario, i guardiani e il mostro grosso), più piani, le domande dell'abisso, i mostri del
// livello L e il volto di quella rinascita. `potenza` è L: la sosta lo scrive, e rientrando si rifà la stessa zona
// (motore/sosta.js)
export function zonaPotenziata(k, L) {
  const t = CAMPAGNA[k]
  const livello = Math.max(1, Math.round(L))
  const v = voltoDi(t.chiave, voltaDi(t.chiave, livello))
  return {
    ...t,
    potenza: livello,
    fascia: [livello, livello + LARGA - 1],
    nome: v.nome, dritta: v.dritta, annuncio: v.annuncio,
    piani: t.piani >= PIANI_DELLA_ZONA ? PIANI_DELLA_GROTTA : PIANI_DELLA_ZONA,
    dif: DIF_DELLA_ZONA,
    livello,
    forza: forzaDellaZona(livello, t.chiave),
    spinta: spintaDellaZona(livello),
  }
}

// la discesa `indice` com'è: la zona se c'è una potenza, se no quella della storia (o l'abisso)
export const zonaDi = (indice, potenza = null) =>
  (potenza && CAMPAGNA[indice] ? zonaPotenziata(indice, potenza) : tappaDi(indice))

export function guastiDelleZone() {
  const g = []
  const chiavi = CAMPAGNA.map(t => t.chiave)
  if (new Set(ORDINE_DELLE_ZONE).size !== chiavi.length || !chiavi.every(k => ORDINE_DELLE_ZONE.includes(k)))
    g.push('l\'ordine delle zone non ha ogni discesa una volta sola')
  const nomi = new Set()
  for (const k of chiavi) {
    const v = VOLTI[k] || []
    if (!v.length) g.push(`${k}: la zona senza volti`)
    for (const x of v) {
      if (!x.nome || !x.dritta || !x.annuncio) g.push(`${k}: un volto senza nome, dritta o annuncio`)
      if (nomi.has(x.nome)) g.push(`due zone si chiamano «${x.nome}»`)
      nomi.add(x.nome)
    }
  }
  // quattro gruppi (grigio, verde, arancio, rosso) vogliono la fascia larga quanto il margine, e sette zone che la
  // coprono a due a due: se no a qualche livello un colore resta senza zone
  if (LARGA !== MARGINE || LARGA !== 2 * PASSO) g.push('fascia, margine e passo non danno due zone per colore')
  for (let L = 12; L <= 60; L++) {
    if (forzaDellaZona(L) < forzaDellaZona(L - 1)) g.push(`al livello ${L} le zone si indeboliscono`)
  }
  return g
}
