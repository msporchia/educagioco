// Le zone (docs/sotterraneo/zone.md): finita la storia ogni discesa è una zona con una fascia di livelli fissa
// («livello 14–17»), che tiene finché l'eroe non la supera di tanto; allora rinasce in cima, sopra la più alta, con un
// nome e una storia nuovi che il minatore racconta. Qui i dati: l'ordine, le fasce, i nomi e gli annunci, quanto
// picchiano. Le regole (che fascia ha una zona adesso, di che colore è il pallino) stanno in motore/zone.js.
import { CAMPAGNA, tappaDi } from './campagna.js'

// L'ordine in cui nascono, dalla fascia più bassa: due zone delle cantine, l'inferno della botola, due della fornace (la roccia della miniera),
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
    { nome: 'Le cantine degli orchi', dritta: 'gli orchi hanno preso le cantine: cinque piani di tamburi',
      annuncio: 'Gli orchi hanno preso le cantine dei goblin: i loro tamburi si sentono fin qui. Li comanda Grumo, e la sua mazza è più pesante di prima.' },
    { nome: 'Le cantine del clan', dritta: 'gli orchi sono tornati in tanti: cinque piani di fuochi',
      annuncio: 'Grumo è tornato, e non è solo: ha chiamato tutto il suo clan. Hanno acceso un fuoco su ogni gradino delle cantine.' },
    { nome: 'Le cantine di ferro', dritta: 'grate di ferro su ogni gradino: cinque piani',
      annuncio: 'Nelle cantine dei goblin battono martelli giorno e notte: gli orchi le hanno chiuse con grate di ferro. Grumo si è fatto una mazza nuova, più grossa della sua testa.' },
  ],
  gallerie: [
    { nome: 'La tana delle ragnatele', dritta: 'piani piccoli, ma sei: e tutto è bianco di ragnatele',
      annuncio: 'Nella tana dei ragni è tutto bianco di ragnatele. Zannaverde ha avuto i piccoli, e i piccoli sono cresciuti.' },
    { nome: 'La tana del veleno', dritta: 'sei piani piccoli, e dalle pareti cola veleno',
      annuncio: 'Dalla tana dei ragni esce un odore che fa lacrimare gli occhi. Zannaverde ha riempito di veleno ogni fessura.' },
    { nome: 'La tana dei mille occhi', dritta: 'sei piani piccoli, e al buio brillano gli occhi',
      annuncio: 'Chi passa vicino alla tana dei ragni vede brillare al buio mille occhi. Zannaverde è diventata grande come un carro.' },
  ],
  labirinto: [
    { nome: 'Il labirinto del Minotto', dritta: 'cinque piani di labirinto: senza mappina ci si perde',
      annuncio: 'Oltre la porta dell\'inferno si sente un muggito che fa tremare il prato. Minotto è tornato, e il labirinto è più profondo di prima.' },
    { nome: 'Il labirinto degli zoccoli', dritta: 'cinque piani di labirinto, e zoccoli che corrono',
      annuncio: 'Oltre la porta dell\'inferno si sentono zoccoli che corrono, notte e giorno. Minotto non dorme più: gira il labirinto e aspetta.' },
    { nome: 'Il labirinto di pietra nera', dritta: 'cinque piani di pietra nera: senza mappina ci si perde',
      annuncio: 'La porta dell\'inferno è diventata nera di fuliggine, e dalla fessura esce un muggito che fa tremare i vetri. Minotto ha le corna più lunghe di prima.' },
  ],
  torre: [
    { nome: 'La torre infernale', dritta: 'dalla torre esce fumo rosso: cinque piani di fuoco',
      annuncio: 'Dalla torre bruciata esce fumo rosso: è diventata una torre infernale. Fiammetta ha acceso tutti i piani, uno per uno.' },
    { nome: 'La torre delle ceneri', dritta: 'cinque piani, e la cenere cade come neve',
      annuncio: 'Sul villaggio cade cenere come neve: viene dalla torre bruciata. Fiammetta ha bruciato tutto quello che c\'era da bruciare, e adesso ha fame.' },
    { nome: 'La torre rovente', dritta: 'le pietre sono rosse di calore: cinque piani',
      annuncio: 'Le pietre della torre bruciata sono diventate rosse, e di notte si vedono da lontano. Fiammetta è più calda che mai.' },
  ],
  fondo: [
    { nome: 'Le miniere infestate', dritta: 'stretta, profonda e infestata: cinque piani',
      annuncio: 'C\'è un\'infestazione nelle miniere di brace: i minatori sono scappati senza nemmeno i picconi. In fondo brucia Carbonchio, più forte di prima.' },
    { nome: 'Le miniere crollate', dritta: 'gallerie mezze crollate, e un caldo che soffoca: cinque piani',
      annuncio: 'Nelle miniere di brace c\'è stato un crollo, e dalla crepa sale un caldo che scioglie i picconi. Carbonchio si è svegliato là in fondo.' },
    { nome: 'Le miniere dei fuochi fatui', dritta: 'cinque piani, e lucine azzurre che non scaldano',
      annuncio: 'Di notte, dalle miniere, escono lucine azzurre che volano via. I vecchi dicono che è Carbonchio che chiama.' },
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
  // i sei dungeon nuovi del mondo a percorso (dati/dungeon-del-mondo.js): il primo volto è il dungeon com'è, gli altri due le sue
  // rigenerazioni (motore/rigenera.js, voltoDelDungeon). Solo del 3D
  cerchio: [
    { nome: 'Il cerchio di pietre', dritta: 'tre piani sotto i menhir, e la pietra che respira',
      annuncio: 'Sotto il cerchio di pietre c\'è una botola, e sotto la botola dorme Roccaverde, un golem tutto coperto di muschio.' },
    { nome: 'Il cerchio delle radici', dritta: 'tre piani, e le radici bucano i muri',
      annuncio: 'Le radici del cerchio di pietre sono scese fino in fondo. Roccaverde si è svegliato, e gli è cresciuto il muschio anche sugli occhi.' },
    { nome: 'Il cerchio della nebbia verde', dritta: 'tre piani di nebbia verde: si vede poco',
      annuncio: 'Dalla botola del cerchio di pietre esce una nebbia verde. Roccaverde la respira, e diventa più grosso.' },
  ],
  corvaia: [
    { nome: 'Il pozzo dei corvi', dritta: 'tre piani stretti, e ali che sbattono al buio',
      annuncio: 'Nel pozzo dei corvi ha fatto il nido Piumanera, un grifone con le penne nere come la notte.' },
    { nome: 'Il pozzo delle piume', dritta: 'tre piani coperti di piume nere',
      annuncio: 'Dal pozzo dei corvi volano fuori piume nere, a mucchi. Piumanera ha cambiato le penne, e adesso sono dure come il ferro.' },
    { nome: 'Il pozzo degli stridi', dritta: 'tre piani, e uno strido che fa tremare le pareti',
      annuncio: 'Di notte, dal pozzo dei corvi, si sente uno strido che sveglia tutta la brughiera. È Piumanera che chiama i suoi.' },
  ],
  palafitta: [
    { nome: 'La palafitta', dritta: 'tre piani di fango sotto le assi',
      annuncio: 'Sotto la palafitta della palude striscia Sibilla, un serpente lungo come il ponte del guado.' },
    { nome: 'La palafitta sommersa', dritta: 'l\'acqua è salita: tre piani di fango e canne',
      annuncio: 'La palude è salita fin sopra le assi della palafitta. Sibilla nuota là sotto, e non ha mai fame come adesso.' },
    { nome: 'La palafitta delle sanguisughe', dritta: 'tre piani di fango, e qualcosa si attacca alle gambe',
      annuncio: 'Chi passa vicino alla palafitta esce dall\'acqua pieno di sanguisughe. Sibilla ha cambiato la pelle, e la nuova è più dura.' },
  ],
  fornace: [
    { nome: 'La fornace', dritta: 'tre piani di griglie sopra il fuoco',
      annuncio: 'Nella piana delle ceneri la fornace si è riaccesa da sola. Dentro rimbomba Vulcanor, un golem di lava che non si spegne mai.' },
    { nome: 'La fornace delle colate', dritta: 'tre piani, e la lava cola dalle pareti',
      annuncio: 'Dalle fumarole della fornace cola lava fino alla strada. Vulcanor ha mangiato tutto il carbone, e ne vuole ancora.' },
    { nome: 'La fornace dei mantici', dritta: 'tre piani, e un vento caldo che soffia a colpi',
      annuncio: 'La fornace soffia come un mantice: si sente fino alle colline. Vulcanor si è fatto più grosso, e più caldo.' },
  ],
  cava: [
    { nome: 'La cava gelata', dritta: 'tre piani di ghiaccio sotto la miniera',
      annuncio: 'In fondo alla cava gelata ha messo radici Gelomagno, un golem di ghiaccio: ogni cosa che tocca diventa brina.' },
    { nome: 'La cava dei cristalli', dritta: 'tre piani, e cristalli che tagliano',
      annuncio: 'Nella cava gelata sono cresciuti cristalli lunghi come lance. Gelomagno ci si specchia, e diventa più freddo.' },
    { nome: 'La cava della tormenta', dritta: 'tre piani di vento e di neve',
      annuncio: 'Dalla cava gelata esce una tormenta che non smette mai. Gelomagno è là sotto che soffia.' },
  ],
  tombe: [
    { nome: 'Le tombe del vento', dritta: 'tre piani di tombe, e il vento che fischia',
      annuncio: 'In fondo alla landa, nelle tombe del vento, aspetta Falcenera: il mietitore che comanda tutta questa terra.' },
    { nome: 'Le tombe dei sussurri', dritta: 'tre piani, e voci che chiamano il tuo nome',
      annuncio: 'Dalle tombe del vento escono sussurri che chiamano per nome chi passa. Falcenera ha affilato la sua falce.' },
    { nome: 'Le tombe della luna nera', dritta: 'tre piani al buio, e una luna nera sopra',
      annuncio: 'Sopra le tombe del vento si è alzata una luna nera. Falcenera ha chiamato a sé tutte le ombre della landa.' },
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
  grigio: { chi: 'Il minatore ti ha visto passare', detto: 'Questa non è chiusa: ormai laggiù sei più forte di tutto, e rende poco.' },
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
// (un oggetto e non quattro costanti: `npm run sotterraneo -- --tara zona.forzaA12=5` ne prova un valore senza toccare il file)
export const CURVA_DELLE_ZONE = { forzaA12: 5.8, forzaPerLivello: 0.35, spintaA12: 10, spintaPerLivello: 1 }
// a pari livello le zone non vengono uguali: la cripta ha piani di quattro stanze e pochi mostri prima della chiave,
// la botola sedici. Questo numero corregge la forza zona per zona (1 di difetto), misurato col banco
export const FORMA_DELLA_ZONA = { altare: 1.7, cantine: 1, torre: 0.9, gallerie: 1.4, cisterna: 1.2, labirinto: 0.85, fondo: 1.2 }

export const forzaDellaZona = (L, chiave) =>
  Math.round(Math.max(1, CURVA_DELLE_ZONE.forzaA12 + CURVA_DELLE_ZONE.forzaPerLivello * (L - 12)) * (FORMA_DELLA_ZONA[chiave] || 1) * 100) / 100
export const spintaDellaZona = L => Math.max(0, Math.round((CURVA_DELLE_ZONE.spintaA12 + CURVA_DELLE_ZONE.spintaPerLivello * (L - 12)) * 10) / 10)

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
    // la cripta della storia ha caporale e re più duri dei suoi comuni da un colpo; la sua zona ha i comuni da zona e i rapporti di sempre
    ...(k === 0 ? { caporali: 0, grosso: 0 } : {}),
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
