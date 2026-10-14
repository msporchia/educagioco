// I giocatori tipo della taratura (docs/sotterraneo/giocatori-tipo.md): come gioca ciascuno e i SUOI bersagli. È un dato: lo legge il
// banco (`stile`, motore/banco.js) e il rapporto (motore/rapporto.js). Ogni bersaglio è { min?, max? } sul numero misurato;
// `cripta` ha i suoi quando la prima discesa non può dare lo stesso (nessuna pozione in tasca, nessun mostro grosso da tirare).
// Numeri scelti da chi ha scritto lo strumento dentro le frasi dell'utente: quelli marcati `// da confermare` sono ambigui.

// la cura dello scontro grosso: tre mostri o più in campo, o il mostro grosso della discesa
export const MOSTRI_DEL_GROSSO = 3

// un bersaglio mancato di più di questo (in unità del suo margine) è «di molto» (`--presto` si ferma lì): docs/sotterraneo/giocatori-tipo.md
export const DI_MOLTO = 1

// le code della fortuna: quota di storie che entra nella discesa con la roba più debole (sfortunato) o più forte (fortunato)
export const CODA = 0.1

// quante volte si rifà una discesa persa, prima di dire che è un muro (e si va avanti lo stesso per misurare le altre)
export const TENTATIVI = 4

// «Tanti mostri che picchiano poco» (l'utente): in quanti colpi un mostro solo stende l'eroe atteso, almeno, per ruolo. Sotto, la specie
// picchia fuori misura e il rapporto la segnala per nome. I numeri sono di chi ha scritto lo strumento: da confermare con l'utente
export const COLPI_PER_STENDERE = { comune: 7, caporale: 4.5, grosso: 3 }

export const GIOCATORI_TIPO = {
  curioso: {
    nome: 'Il curioso',
    chi: 'il figlio dell\'utente: gira tutto, apre tutto, usa quello che ha',
    // come gioca
    bravura: 0.9,                 // 9 risposte giuste su 10
    come: 'tutto',                // gira tutte le stanze e apre tutto (porte, forzieri, fonti, mostri, cose)
    stile: {
      abilita: 'appenaPuoi',      // la più forte che può pagare, anche se spreca: niente tetto di due a scontro, niente risparmio
      beviSotto: 0.3,             // beve una pozione nel rosso (la soglia dello stop di motore/pericolo.js)…
      beviNelloScontro: true,     // …anche nello scontro, e allo stop del pericolo
      // quale pozione: la più piccola che rimette quanto manca (e quanto picchiano i mostri in arrivo), l'ampolla della vita compresa: non la risparmia
      fonte: { sotto: 0.65, energiaSotto: 0.4, allaFine: true },   // si ferma alle fonti se è sotto il 65% di vita o il 40% di energia, e alla fine del piano se non è pieno
    },
    punti: 'strada',              // i punti alle caratteristiche e all'albero come li dà la strada della classe (COME_LI_DA, STRADA)
    spesa: 'il meglio',           // dal fabbro, dall'incantatrice e dal rigattiere compra il meglio che può, poi le pozioni (allaBottega)
    bersagli: {
      vinte: { min: 0.85 },                       // la prima volta che scende, la discesa si vince: «arriva in fondo quasi sempre»
      storiaFinita: { min: 0.9 },                 // e la storia si finisce (le sette discese, al più quattro tentativi l'una)
      svenuto: { min: 0.2, max: 0.6, cripta: { min: 0, max: 0.3 } },   // quota di discese nuove con almeno uno svenimento: «ogni tanto»
      pozioni: { min: 1, max: 3, cripta: { min: 0, max: 2 } },         // beve da 1 a 3 pozioni a discesa
      vitaGrosso: { min: 0.4, max: 0.7 },         // dopo uno scontro grosso gli resta il 40–70% della vita (uno svenimento vale 0)
      domande: { max: 85 },                       // da confermare: «un piano girato tutto» letto come una discesa girata tutta (regole.md, «Il tetto è una seduta»)
      rifatteSvenute: { max: 0.05 },              // le discese già vinte, rifatte con la roba di dopo: non sviene mai
      sfortunato: { vinte: { min: 0.6 }, muri: { max: 0.1 } },   // il 10° percentile della roba con cui entra: non trova un muro
      fortunato: { vitaGrosso: { max: 0.8 }, sopra90: { max: 0.55 } },   // il 90°: non stravince
    },
  },

  bravo: {
    nome: 'Il bravo',
    chi: 'il banco di prima: dritto alla scala, abilità al meglio',
    bravura: 0.95,                // 9–10 su 10
    come: 'minimo',
    stile: { tieneLaVita: true },   // il banco di sempre: due abilità forti a scontro, la cura sotto la metà, non beve nello scontro, e l'ampolla della vita la tiene per il grosso
    punti: 'strada',
    spesa: 'il meglio',
    bersagli: {
      vinte: { min: 0.9 },
      vitaScontri: { min: 0.45, max: 0.85, cripta: { min: 0.3 } },   // vince, ma non a vita piena
      sopra90: { max: 0.45, cripta: { max: 1 } },                     // se esce da quasi ogni scontro sopra il 90% è troppo facile (la cripta si impara)
      domande: { max: 85 },                                           // il tetto della seduta, oggi in unita/sotterraneo
    },
  },

  sbadato: {
    nome: 'Lo sbadato',
    chi: 'il curioso in una giornata storta: 6 su 10, roba e livello di quel momento della sua storia',
    bravura: 0.6,
    come: 'tutto',
    daiCurioso: true,             // gioca ogni discesa dall'ingresso del curioso: la giornata storta, non un altro viaggio
    stile: 'curioso',
    punti: 'strada',
    spesa: 'il meglio',
    bersagli: {
      // «perde quasi sempre»: arriva in fondo al più una volta su sette-otto
      vinte: { max: 0.15, cripta: { max: 0.5 } },   // da confermare con l'utente: la cripta si impara, non si perde otto volte su nove
    },
  },
}

export const NOMI_TIPO = Object.keys(GIOCATORI_TIPO)

// Le strade di spesa, incrociate coi giocatori tipo (docs/sotterraneo/fine-discesa-e-strade.md); `stile` si sovrappone a quello del giocatore.
// `spesa`: 'il meglio' i pezzi migliori e poi le pozioni (allaBottega di sempre); 'pozioniPrima' le pozioni, e ai pezzi quello che avanza.
export const STRADE = {
  armaPrima: { nome: 'arma prima', spesa: 'il meglio', stile: {} },
  beveTutto: { nome: 'beve tutto', spesa: 'pozioniPrima', stile: { beviSotto: 0.55, scontroSotto: 0.55, beviNelloScontro: true } },
}
export const NOMI_STRADA = Object.keys(STRADE)
export const STRADA_BASE = 'armaPrima'

// con la spesa 'pozioniPrima': le tasche che restano libere per i pezzi (le pozioni riempiono le altre)
export const TASCHE_PER_I_PEZZI = 2

// quante storie per eroe giocano le strade oltre quelle dei bersagli (il curioso e il bravo di arma prima ne giocano `--semi`, 30)
export const SEMI_DELLE_STRADE = 6

// una discesa vinta con almeno tante pozioni bevute è vinta «bevendo» (docs/sotterraneo/fine-discesa-e-strade.md)
export const POZIONI_DA_BEONE = 10

// una discesa «blocca» chi non la vince in TENTATIVI giri; «si ferma» alla prima in cui almeno questa quota delle storie è bloccata
export const QUOTA_CHE_SI_FERMA = 0.1

// Le risalite (docs/sotterraneo/fine-discesa-e-strade.md): il giocatore tipo torna su dal portale del piano a spendere. Sale quando ha in tasca il prezzo del salto che non poteva pagare
// (o, senza, quando ha preso `soglia(livello)` gemme dall'ultima spesa), o dopo `mostriOgni` mostri se le pozioni sono meno di `pozioniSotto` e ha almeno `minimoPerMostri` gemme. `acceso` 0 le spegne;
// `scaffale` 1: chi spende guarda anche i salti e i sogni dello scaffale (motore/bottega.js), non solo il banco del passo; `rivedi` 1: i banchi si rimettono in discussione quando l'eroe sale di livello
// (0: mai, un terzo di tempo in meno); `tentativi`: quante volte per piano prova ad arrivare al portale. La soglia è una proposta: base + salita·(1 − e^(−livello/scala)).
export const RISALITA = { acceso: 1, scaffale: 1, rivedi: 1, base: 60, salita: 150, scala: 6, mostriOgni: 10, pozioniSotto: 2, minimoPerMostri: 30, tentativi: 4, perDopo: 2 }
export const sogliaDiRisalita = livello => Math.round(RISALITA.base + RISALITA.salita * (1 - Math.exp(-Math.max(1, livello) / RISALITA.scala)))

// lo stile di un giocatore tipo (quello dello sbadato è quello del curioso), sulla strada di spesa che segue
export const stileDi = (chi, strada = STRADA_BASE) => {
  const g = GIOCATORI_TIPO[chi]
  return { ...(g.stile === 'curioso' ? GIOCATORI_TIPO.curioso.stile : g.stile), ...STRADE[strada].stile }
}
