/* Le lezioni già preparate per ogni anno della primaria e per materia, col programma di quell'anno: la maestra ne
   tocca una e la ritrova nell'editor da cambiare. Funzioni pure, gira in Node. Vedi docs/scuola/lezioni-pronte.md. */
import { CATALOGO, GIOCHI, giochiPer, giocoDi } from './esercizi.js'

export const ANNI = [1, 2, 3, 4, 5]
// le tabelline non hanno gradini: si fanno tutte in seconda (conti.js: «fino al 9» è un gradino di seconda)
export const ANNO_TABELLINE = 2

/* ══════════════ l'anno di un esercizio ══════════════ */

const voci = CATALOGO.materie.flatMap(m => m.voci.map(v => ({ ...v, materia: m.id })))
const voceDi = e => voci.find(v => v.id === (e?.tipo === 'tabelline' ? 'tabelline' : e?.modulo)) || null
export const materiaDi = e => voceDi(e)?.materia ?? null

// l'anno più alto fra i gradini che l'esercizio apre davvero (con le tipologie scelte); 0 è la scuola dell'infanzia
export function annoDi(e) {
  const v = voceDi(e)
  if (!v) return null
  if (v.tipo === 'tabelline') return ANNO_TABELLINE
  const aperto = g => !e.tipologie.length || v.tipologie.some(t => e.tipologie.includes(t.id) && t.gradini.includes(g))
  const anni = v.gradini.filter(g => g.grado >= e.da && g.grado <= e.a && aperto(g.grado)).map(g => g.classe)
  return anni.length ? Math.max(...anni) : null
}

/* ══════════════ come si scrivono ══════════════ */

const m = (modulo, da, a = da, tipologie = []) => ({ tipo: 'modulo', modulo, da, a, tipologie })
const t = (tabelline, modo = 'prodotto') => ({ tipo: 'tabelline', tabelline, modo })
const TUTTE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const SD = ['conti:somma', 'conti:differenza']
// [nome, cosa allena, obiettivo, quante domande o '<n> min', se hai finito]
const SCRITTE = {
  1: {
    italiano: [
      ['Con che lettera comincia', 'Sentire il primo suono di una parola e trovare la lettera che lo scrive.', m('lettere', 1), 15, m('lettere', 2, 2, ['let:leggi'])],
      ['Leggo la parola', 'Leggere tutta la parola, non solo la prima lettera, e trovare la figura giusta.', m('lettere', 2, 2, ['let:leggi']), 15, m('lettere', 1, 2)],
      ['La sillaba iniziale', 'Distinguere parole che cominciano con la stessa lettera dalla sillaba iniziale.', m('lettere', 3, 3, ['let:sillaba']), 15, m('lettere', 2, 3)],
      ['Quante sillabe?', 'Battere le sillabe di una parola e contarle.', m('sillabe', 1), 15, m('lettere', 3)],
      ['Capisco due frasi', 'Leggere due frasi e dire chi, dove e che cosa.', m('capire', 1), 10, m('lessico', 1)],
      ['Perché: la causa', 'Capire che «perché» lega una cosa alla sua causa.', m('connettivi', 1), 15, m('capire', 1)],
      ['Uno o tanti, maschio o femmina', 'Il singolare e il plurale, il maschile e il femminile delle parole.', m('grammatica', 1), 15, m('grammatica', 2)],
      ["L'articolo giusto", "Scegliere l'articolo che va con la parola (il, lo, la, l').", m('grammatica', 2), 15, m('grammatica', 1, 2)],
      ['I contrari', 'Trovare la parola che dice il contrario.', m('lessico', 1), 15, m('lessico', 2)],
      ["L'intruso", 'Trovare la parola che non sta con le altre, e dire perché.', m('lessico', 2), 15, m('lessico', 1, 2)],
    ],
    matematica: [
      ["Quanti sono a colpo d'occhio", 'Riconoscere piccole quantità senza contarle una per una, e chi è di più.', m('numero', 1), 15, m('numero', 2)],
      ['La linea dei numeri fino a 20', 'Leggere la linea dei numeri e mettere un numero al suo posto.', m('numero', 2), 15, m('numero', 1, 2)],
      ['Prima, dopo, in mezzo', 'Il numero che viene prima, quello dopo e quello in mezzo.', m('numero', 3, 3, ['num:ordine']), 15, m('numero', 2, 3)],
      ['I conti in fila', 'Fare un conto dopo l\'altro tenendo il risultato a mente.', m('numero', 3, 3, ['num:catena']), 15, m('conti', 2, 2, SD)],
      ['Più e meno dentro il dieci', 'Le prime addizioni e sottrazioni entro il dieci.', m('conti', 1, 1, SD), 15, m('numero', 3, 3, ['num:ordine'])],
      ['Il doppio e la metà', 'Il doppio e la metà dei numeri piccoli, il per 10 e il diviso 10.', m('conti', 1, 1, ['conti:prodotto', 'conti:quoziente']), 15, m('conti', 1, 1, SD)],
      ['Più e meno fino al venti', 'Addizioni e sottrazioni entro il venti, senza passare la decina.', m('conti', 2, 2, SD), 20, m('conti', 1, 2, SD)],
      ['Oltre la decina', 'Addizioni e sottrazioni che passano la decina.', m('conti', 3, 3, SD), 20, m('conti', 2, 3, SD)],
      ['Il pittogramma', 'Contare e confrontare le figure di un pittogramma.', m('grafici', 1), 15, m('numero', 1, 2)],
    ],
    spazio: [
      ['Le figure e i loro nomi', 'Riconoscere e nominare quadrato, cerchio, triangolo, rettangolo.', m('geometria', 1), 15, m('geometria', 2, 2, ['geo:lati'])],
      ['Lati e vertici', 'Contare i lati e i vertici di una figura.', m('geometria', 2, 2, ['geo:lati']), 15, m('geometria', 1)],
      ['La simmetria', 'Completare la metà che manca e trovare dove si piega una figura.', m('geometria', 3), 15, m('geometria', 1, 2, ['geo:figure', 'geo:quadrilateri', 'geo:lati'])],
      ['Le caselle: lettera e numero', 'Trovare una casella della griglia con la lettera e il numero.', m('griglia', 1), 15, m('griglia', 2)],
      ['Destra, sinistra, sopra e sotto', 'Orientarsi sulla griglia con destra, sinistra, sopra e sotto.', m('griglia', 2), 15, m('griglia', 1, 2)],
      ['I percorsi a frecce', 'Seguire un percorso a frecce e contare le mosse.', m('griglia', 3), 15, m('griglia', 1, 3)],
    ],
    tempo: [
      ['I giorni della settimana', "L'ordine dei giorni della settimana: ieri, oggi, domani.", m('calendario', 1), 15, m('calendario', 2)],
      ["I mesi dell'anno", "L'ordine dei mesi e quanti giorni hanno.", m('calendario', 2), 15, m('calendario', 1, 2)],
      ['Le stagioni e le feste', "Le stagioni e le feste nell'anno.", m('calendario', 3), 15, m('calendario', 1, 3)],
      ['Le ore intere', "Leggere l'ora intera sull'orologio a lancette.", m('orologio', 1), 15, m('calendario', 1, 3)],
    ],
    logica: [
      ['Cosa viene dopo', 'Continuare un ritmo in cui cambia una cosa sola.', m('sequenze', 1), 15, m('sequenze', 3)],
      ["Chi non c'entra", 'Trovare la figura diversa per colore o per forma.', m('sequenze', 2), 15, m('sequenze', 1, 2)],
      ['Il ritmo a due', 'Continuare un ritmo in cui cambiano due cose insieme.', m('sequenze', 3), 15, m('sequenze', 1, 3)],
      ['Chi sono io?', 'Usare gli indizi per scartare e trovare la figura o la cosa giusta.', m('indizi', 1, 2), 15, m('analogie', 1)],
      ['Tutti e nessuno', 'Capire cosa vogliono dire «tutti» e «nessuno».', m('logica', 1), 15, m('logica', 2)],
      ['Chi è più alto', 'Mettere in ordine dai confronti: chi è più alto di chi.', m('logica', 2), 15, m('logica', 1, 2)],
      ['A sta a B come C sta a…', 'Riconoscere la stessa relazione fra due coppie di cose.', m('analogie', 1), 15, m('indizi', 1, 2)],
    ],
    scienze: [
      ['Dove vive questo animale', 'Gli animali della fattoria, del mare e del bosco, e dove vivono.', m('animali', 1), 15, m('animali', 2)],
      ['Gli animali del mondo', 'Savana, deserto, giungla e ghiacci: chi vive dove.', m('animali', 2), 15, m('animali', 1, 2)],
    ],
  },
  2: {
    italiano: [
      ['Capire un testo più lungo', 'Leggere un testo di qualche riga e dire chi, dove e che cosa.', m('capire', 2), 10, m('capire', 1, 2)],
      ['Il presente dei verbi regolari', 'Coniugare il presente dei verbi in -are, -ere, -ire.', m('coniugazione', 1), 20, m('coniugazione', 2)],
      ['Il presente dei verbi irregolari', 'Il presente di essere, avere, andare, fare e degli altri verbi di ogni giorno.', m('coniugazione', 2), 20, m('coniugazione', 1, 2)],
      ['Ma, però, invece', 'Capire che «ma», «però» e «invece» mettono a confronto due cose.', m('connettivi', 2), 20, m('connettivi', 1, 2)],
      ['Gn e gl', 'Scrivere giusto i suoni gn e gl.', m('ortografia', 1), 20, m('ortografia', 2, 2, ['orto:sc'])],
      ['Sc, sce e sci', 'Scrivere giusto il suono sc, con e senza la i.', m('ortografia', 2, 2, ['orto:sc']), 20, m('ortografia', 1, 2)],
      ['Dividere in sillabe', 'Dividere le parole in sillabe, anche con le doppie.', m('sillabe', 2), 20, m('sillabe', 1, 2)],
      ['Le rime', 'Riconoscere le parole che fanno rima.', m('sillabe', 3), 15, m('sillabe', 2, 3)],
      ['Genere, numero e articolo', "Ripasso: singolare e plurale, maschile e femminile, l'articolo giusto.", m('grammatica', 1, 2), 20, m('lessico', 1, 2)],
      ["I contrari e l'intruso", "Ripasso: la parola contraria e quella che non c'entra.", m('lessico', 1, 2), 20, m('grammatica', 1, 2)],
    ],
    matematica: [
      ['Le tabelline del 2, del 5 e del 10', 'Le prime tabelline, quelle che si contano a salti facili.', t([2, 5, 10]), 30, t([2, 5, 10], 'nascosto')],
      ['Le tabelline del 3 e del 4', 'Le tabelline del 3 e del 4, dal per 1 al per 10.', t([3, 4]), 30, t([2, 5, 10])],
      ['Le tabelline del 6 e del 7', 'Le tabelline del 6 e del 7, dal per 1 al per 10.', t([6, 7]), 30, t([3, 4])],
      ["Le tabelline dell'8 e del 9", "Le tabelline dell'8 e del 9, dal per 1 al per 10.", t([8, 9]), 30, t([6, 7])],
      ['Tutte le tabelline', 'Tutte le tabelline mescolate, per vedere quali mancano ancora.', t(TUTTE), '10 min', t(TUTTE, 'nascosto')],
      ['Più e meno con le decine', 'Addizioni e sottrazioni fra numeri di una e due cifre, senza cambio.', m('conti', 4, 4, SD), 20, m('conti', 3, 4, SD)],
      ['Passare la decina', 'Addizioni e sottrazioni fra numeri di una e due cifre, col cambio.', m('conti', 5, 5, SD), 20, m('conti', 4, 5, SD)],
      ['Il numero nascosto fino a venti', 'Trovare il numero che manca in un più o in un meno.', m('bilance', 1), 20, m('conti', 4, 5, SD)],
      ['La linea fino a 100', 'Leggere la linea fino a 100, mettere un numero al suo posto e trovare il più vicino.', m('numero', 4), 20, m('numero', 4, 4, ['num:catena', 'num:indovinello'])],
      ['Legenda e grafico a barre', 'Leggere un pittogramma con la legenda e un grafico a barre.', m('grafici', 2), 15, m('grafici', 1, 2)],
      ['Quanti in più, quanti in tutto', 'Rispondere a domande su un grafico: la differenza e il totale.', m('grafici', 3), 15, m('grafici', 2)],
      ['Con che cosa si misura', "Scegliere lo strumento e l'unità giusta per misurare.", m('misure', 1), 15, m('grafici', 2, 3)],
      ['I problemi del più e del meno', 'Capire dal testo se quello che succede si somma o si toglie.', m('problemi', 1, 2), 15, m('conti', 4, 5, SD)],
      ['Monete e banconote', 'Contare quanto fanno monete e banconote.', m('soldi', 1), 15, m('soldi', 2, 2, ['sol:resto'])],
      ['Il resto', 'Calcolare il resto di un acquisto.', m('soldi', 2, 2, ['sol:resto']), 15, m('soldi', 1, 2)],
    ],
    spazio: [
      ['La figura allo specchio', 'Riconoscere una figura riflessa allo specchio.', m('geometria', 4, 4, ['geo:specchio']), 15, m('geometria', 3)],
      ['Figure, lati e vertici', 'Ripasso: i nomi delle figure, i lati e i vertici.', m('geometria', 1, 2, ['geo:figure', 'geo:quadrilateri', 'geo:lati']), 15, m('geometria', 3)],
      ['Percorsi sulla griglia', 'Seguire le frecce, contare le mosse, destra e sinistra.', m('griglia', 2, 3), 15, m('griglia', 1)],
    ],
    tempo: [
      ['Le mezze ore', "Leggere l'ora intera e la mezza sull'orologio.", m('orologio', 2), 15, m('orologio', 1)],
      ["I quarti d'ora", "Leggere l'ora coi quarti: e un quarto, meno un quarto.", m('orologio', 3), 15, m('orologio', 2)],
      ['Mesi, stagioni e feste', "Ripasso dell'anno: i mesi, le stagioni e le feste.", m('calendario', 2, 3), 15, m('calendario', 1)],
    ],
    logica: [
      ['Analogie coi falsi simili', 'Trovare la stessa relazione quando le risposte sbagliate le somigliano.', m('analogie', 2), 15, m('analogie', 1)],
      ['Analogie fra figure', 'Capire cosa cambia fra due figure e farlo sulla terza.', m('analogie', 3), 15, m('analogie', 2)],
      ['Chi sono io, anche coi no', 'Usare gli indizi, anche quelli che dicono di no, per trovare la figura.', m('indizi', 3), 15, m('indizi', 2)],
      ["Chi non c'entra: quanti e quanto grandi", 'Trovare la figura diversa per numero o per grandezza.', m('sequenze', 4), 15, m('sequenze', 3)],
    ],
    scienze: [
      ['Chi vive in questo posto', "Gli animali di un ambiente, e quello che non c'entra.", m('animali', 3), 15, m('animali', 2)],
    ],
  },
  3: {
    italiano: [
      ['Prima e dopo, e il perché', 'In un testo: in che ordine succedono le cose, il perché scritto e quello che si capisce.', m('capire', 3), 10, m('capire', 2)],
      ['Di chi parla il pronome', 'Capire a chi si riferiscono «lei», «lo», «gli» in un testo.', m('capire', 4), 10, m('capire', 3)],
      ['Il passato prossimo', 'Scegliere essere o avere e scrivere il participio giusto.', m('coniugazione', 3), 20, m('coniugazione', 1, 2)],
      ['Quindi, quando, mentre', 'I connettivi della conseguenza e del tempo.', m('connettivi', 3), 20, m('connettivi', 2)],
      ['Le parti del discorso', 'Dire se una parola è nome, verbo, aggettivo, articolo…', m('grammatica', 3), 20, m('grammatica', 1, 2)],
      ['I sinonimi', 'Trovare la parola che vuol dire la stessa cosa.', m('lessico', 3), 20, m('lessico', 1, 2)],
      ['Le doppie', 'Scrivere giusto le parole con le doppie.', m('ortografia', 3, 3, ['orto:doppie']), 20, m('ortografia', 1, 2)],
      ['Cqu, cia e cie', 'Acqua e la sua famiglia, cia, ce e cie.', m('ortografia', 4), 20, m('ortografia', 3)],
      ['La sillaba che manca', 'Completare la parola con la sillaba che manca.', m('sillabe', 4), 20, m('sillabe', 2, 3)],
    ],
    matematica: [
      ['Le tabelline del 6, 7, 8 e 9', 'Le tabelline difficili, dal per 1 al per 10.', t([6, 7, 8, 9]), 30, t([6, 7, 8, 9], 'nascosto')],
      ['Tutte le tabelline', 'Tutte le tabelline mescolate: alla fine della terza si sanno con sicurezza.', t(TUTTE), '10 min', t(TUTTE, 'misti')],
      ['Il numero nascosto nelle tabelline', 'Trovare il fattore che manca: la strada verso la divisione.', t(TUTTE, 'nascosto'), 20, m('bilance', 2, 2, ['bil:nascosto-per'])],
      ['Più e meno senza cambio', 'Addizioni e sottrazioni fra numeri di due cifre, senza riporto né prestito.', m('conti', 6, 6, SD), 20, m('conti', 5, 5, SD)],
      ['Col riporto e col prestito', 'Addizioni col riporto e sottrazioni col prestito fra numeri di due cifre.', m('conti', 7, 7, SD), 20, m('conti', 6, 6, SD)],
      ['Le prime divisioni', 'Le divisioni esatte con le tabelline.', m('conti', 6, 7, ['conti:quoziente']), 20, t(TUTTE, 'nascosto')],
      ['Il numero nascosto fino a cento', 'Il numero che manca in un più, in un meno e in una tabellina.', m('bilance', 2), 20, m('bilance', 1)],
      ['Decine e valore delle cifre', 'Unità, decine e centinaia: quanto vale ogni cifra.', m('numero', 5, 5, ['num:decine', 'num:cifre']), 20, m('numero', 4)],
      ['Le frazioni sul disegno', 'La metà, un terzo, un quarto e più pezzi colorati, fino agli ottavi.', m('frazioni', 1, 2), 20, m('frazioni', 1)],
      ['Chi è più grande fra le frazioni', 'Confrontare frazioni e trovare quanto manca per fare un intero.', m('frazioni', 3), 20, m('frazioni', 1, 2)],
      ['La tabella a doppia entrata', 'Leggere tabelle e grafici per rispondere a una domanda.', m('grafici', 4), 15, m('grafici', 3)],
      ['Quanto è grande davvero', 'Stimare la misura vera delle cose di ogni giorno.', m('misure', 2), 15, m('numero', 5, 5, ['num:decine', 'num:cifre'])],
      ['Tante volte tanti, e le parti uguali', 'I problemi della moltiplicazione e della divisione.', m('problemi', 3), 15, m('problemi', 1, 2)],
      ['Quanto costano più cose', 'Sommare i prezzi e capire quale costa di più.', m('soldi', 3), 15, m('soldi', 1, 2)],
    ],
    spazio: [
      ['I solidi e le facce', 'I nomi dei solidi e quante facce hanno.', m('geometria', 5, 5, ['geo:solidi', 'geo:facce']), 15, m('geometria', 4, 4, ['geo:specchio'])],
      ["L'area: i quadretti dentro", "Misurare l'area contando i quadretti.", m('griglia', 4), 15, m('griglia', 3)],
    ],
    tempo: [
      ['I cinque minuti', "Leggere l'ora coi minuti e dire che ora sarà fra un po'.", m('orologio', 4), 15, m('orologio', 2, 3)],
      ['Contare i giorni', 'Contare i giorni che passano fra due date.', m('calendario', 4), 15, m('calendario', 2, 3)],
    ],
    logica: [
      ['Analogie: due cose che cambiano', 'Analogie fra figure in cui cambiano due cose insieme.', m('analogie', 4), 15, m('analogie', 3)],
      ['La tabella: chi ha cosa', 'Indovinelli e tabelle da riempire con gli indizi, anche quelli col «non».', m('indizi', 4), 10, m('indizi', 3)],
      ['Quando non si può sapere', 'La regola girata: capire quando la risposta giusta è «non si sa».', m('logica', 3), 15, m('logica', 1, 2)],
      ['Figure che girano e crescono', 'Continuare una serie in cui le figure girano o crescono.', m('sequenze', 5), 15, m('sequenze', 4)],
    ],
    scienze: [
      ['Il corpo dice il posto', "Dal corpo di un animale capire dove vive, e chi non c'entra.", m('animali', 4), 15, m('animali', 3)],
    ],
  },
  4: {
    italiano: [
      ['Quello che non è scritto', 'Capire quello che il testo non dice ma fa capire, e scegliere il titolo.', m('capire', 5), 10, m('capire', 3, 4)],
      ['Imperfetto e futuro', "Coniugare l'imperfetto e il futuro.", m('coniugazione', 4), 20, m('coniugazione', 3)],
      ['Se: la condizione', 'Capire le frasi col «se» e con «anche se».', m('connettivi', 4), 20, m('connettivi', 3)],
      ["Nome e aggettivo d'accordo", "Accordare l'aggettivo col nome nel genere e nel numero.", m('grammatica', 4), 20, m('grammatica', 3)],
      ['Soggetto e predicato', 'Trovare il soggetto e il predicato, e distinguere i nomi propri.', m('grammatica', 5), 20, m('grammatica', 4)],
      ['La parola giusta nella frase', 'Scegliere la parola che dà il senso giusto alla frase.', m('lessico', 4), 20, m('lessico', 3)],
      ["Accenti, apostrofi e l'acca", "Quando ci vuole l'accento, l'apostrofo e l'acca.", m('ortografia', 5), 20, m('ortografia', 3, 4)],
    ],
    matematica: [
      ['Riscaldamento: tutte le tabelline', 'Cinque minuti di tabelline prima delle operazioni in colonna.', t(TUTTE), '5 min', t(TUTTE, 'nascosto')],
      ['Oltre il cento', 'Addizioni e sottrazioni oltre il cento.', m('conti', 8, 8, SD), 20, m('conti', 7, 7, SD)],
      ['Più e meno a tre cifre', 'Addizioni e sottrazioni fra numeri di tre cifre.', m('conti', 9, 9, SD), 20, m('conti', 8, 8, SD)],
      ['Moltiplicare per una cifra', 'Moltiplicazioni di un numero di due cifre per una cifra, senza e col riporto.', m('conti', 8, 9, ['conti:prodotto']), 20, t(TUTTE)],
      ['Le divisioni per una cifra', 'Divisioni esatte di un numero di due cifre per una cifra.', m('conti', 8, 9, ['conti:quoziente']), 20, m('conti', 8, 9, ['conti:prodotto'])],
      ['Quanto pesa uno', 'Sulla bilancia in pari: quanto pesa una cosa sola, e togliere dai due piatti.', m('bilance', 3), 15, m('bilance', 2)],
      ['Togliere e scambiare', 'Togliere la stessa cosa dai due piatti e fare gli scambi.', m('bilance', 4), 15, m('bilance', 3)],
      ['La frazione di un numero', 'Calcolare la frazione di un numero e confrontare frazioni con lo stesso numeratore.', m('frazioni', 4), 20, m('frazioni', 3)],
      ['Le frazioni equivalenti', 'Riconoscere le frazioni che valgono uguale.', m('frazioni', 5), 20, m('frazioni', 4)],
      ['Moda e media', 'Trovare la moda e la media di un gruppo di dati.', m('grafici', 5), 15, m('grafici', 4)],
      ['Le equivalenze', 'Convertire lunghezze, capacità e pesi.', m('misure', 3), 20, m('misure', 2)],
      ['Due conti di fila', 'I problemi che si risolvono con due operazioni.', m('problemi', 4), 15, m('problemi', 3)],
      ['I numeri con la virgola', 'Confrontare i numeri decimali e dire quanto vale ogni cifra dopo la virgola.', m('soldi', 4, 5, ['sol:confronto-numeri', 'sol:cifre']), 20, m('soldi', 3)],
      ['Decimali in ordine', 'Mettere in ordine i decimali sulla linea e arrotondarli.', m('soldi', 6), 20, m('soldi', 4, 5, ['sol:confronto-numeri', 'sol:cifre'])],
    ],
    spazio: [
      ['Gli angoli', 'Riconoscere e nominare angoli retti, acuti e ottusi.', m('geometria', 2, 2, ['geo:angoli']), 15, m('geometria', 4, 4, ['geo:rotazione'])],
      ['Girare le figure', 'Girare una figura di un quarto con la mente, e la figura allo specchio.', m('geometria', 4), 15, m('geometria', 2, 2, ['geo:angoli'])],
      ['Il perimetro', 'Misurare il perimetro contando il giro del bordo.', m('griglia', 5), 15, m('griglia', 4)],
      ['Area e perimetro dei rettangoli', 'Calcolare a mente area e perimetro di un rettangolo.', m('griglia', 6), 15, m('griglia', 4, 5)],
    ],
    tempo: [
      ['Date e durate', 'Calcolare quanto dura una cosa e contare i giorni fra due date.', m('calendario', 5), 15, m('calendario', 4)],
    ],
    logica: [
      ['Se… allora', 'Ragionare con le regole «se… allora» e quello che non dicono.', m('logica', 4), 15, m('logica', 3)],
    ],
    scienze: [
      ['Gli ambienti del mondo', 'I grandi ambienti della Terra, chi ci vive e perché il suo corpo è fatto così.', m('animali', 2, 4), 15, null],
    ],
  },
  5: {
    italiano: [
      ['Il tempo giusto', 'Riconoscere il tempo di un verbo e scegliere quello che la frase chiede.', m('coniugazione', 5), 20, m('coniugazione', 4)],
      ['I modi e i tempi difficili', 'Passato remoto, tempi composti, condizionale, congiuntivo e imperativo.', m('coniugazione', 6), 20, m('coniugazione', 5)],
      ['Anche se, e il doppio «mentre»', 'I connettivi della concessione e i due sensi di «mentre».', m('connettivi', 5), 20, m('connettivi', 4)],
      ['Modi di dire e parole difficili', 'Il significato dei modi di dire e delle parole meno comuni.', m('lessico', 5), 20, m('lessico', 4)],
      ['Leggere fra le righe', 'Capire quello che il testo non dice e trovare il titolo che lo riassume.', m('capire', 3, 5, ['capire:indizio', 'capire:titolo']), 10, m('connettivi', 5)],
    ],
    matematica: [
      ['Riscaldamento: tutte le tabelline', 'Cinque minuti di tabelline prima dei calcoli grandi.', t(TUTTE), '5 min', t(TUTTE, 'nascosto')],
      ['Più e meno coi numeri grandi', 'Addizioni e sottrazioni fra numeri di tre cifre.', m('conti', 10, 10, SD), 20, m('conti', 9, 9, SD)],
      ['Moltiplicazioni e divisioni grandi', 'Moltiplicazioni per una cifra e per le decine, e le divisioni.', m('conti', 10, 10, ['conti:prodotto', 'conti:quoziente']), 20, m('conti', 9, 9, ['conti:prodotto', 'conti:quoziente'])],
      ['Scambi lunghi sulla bilancia', 'Scambi a catena con tre bilance, e due cose da pesare.', m('bilance', 5), 15, m('bilance', 4)],
      ['Quale misura è più grande', 'Confrontare misure scritte con unità diverse.', m('misure', 4), 20, m('misure', 3)],
      ['Problemi con le misure', 'I problemi che chiedono di convertire una misura.', m('misure', 5), 15, m('misure', 4)],
      ['Stima e ordine di grandezza', 'Stimare un risultato, arrotondare e capire cosa è impossibile.', m('numero', 6, 6, ['num:stima', 'num:arrotonda', 'num:grandezza']), 20, m('numero', 6, 6, ['num:catena', 'num:indovinello'])],
      ['Tre conti di fila', 'I problemi che si risolvono con tre operazioni.', m('problemi', 5), 15, m('problemi', 4)],
      ['I dati che non servono', 'Riconoscere in un problema i dati che non servono.', m('problemi', 6), 15, m('problemi', 5)],
      ['Il prezzo di una cosa sola', 'Dal prezzo di più cose, quanto costa una.', m('soldi', 7), 15, m('soldi', 6)],
      ['Quanto costano tante cose', 'Dal prezzo di poche cose, quanto costano tante.', m('soldi', 8), 15, m('soldi', 7)],
      ['Cosa conviene comprare', 'Confrontare prezzi, pesi e offerte per scegliere cosa conviene.', m('soldi', 9, 11), 15, m('soldi', 7, 8)],
    ],
    spazio: [
      ["Come si vede dall'alto", "I solidi, le loro facce e come si vedono dall'alto.", m('geometria', 5), 15, m('geometria', 4, 4, ['geo:rotazione'])],
      ['Cubetti e sviluppi', 'Contare i cubetti anche nascosti e piegare lo sviluppo di un solido.', m('geometria', 6), 15, m('geometria', 5)],
    ],
    tempo: [
      ['Minuti spicci e durate', "Leggere l'ora al minuto e calcolare quanto dura una cosa.", m('orologio', 5), 15, m('calendario', 5)],
    ],
    logica: [
      ['La fila e le tabelle collegate', 'Indizi in negativo, chi sta dove nella fila, due tabelle insieme.', m('indizi', 5), 10, m('indizi', 4)],
      ['Le catene di regole', 'Seguire più regole una dopo l\'altra fino alla risposta.', m('logica', 5), 15, m('logica', 4)],
    ],
  },
}

/* ══════════════ l'elenco ══════════════ */

const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const conGioco = (e, gioco) => (e && giochiPer(e).some(g => g.id === gioco) ? { ...e, gioco } : e)

function scritta(anno, materia, [nome, allena, esercizio, misura, dopo]) {
  const minuti = typeof misura === 'string' ? Number.parseInt(misura, 10) : null
  return { id: `${anno}-${materia}-${slug(nome)}`, anno, materia, nome, allena,
           obiettivo: { esercizio, quante: minuti ? null : misura, minuti }, dopo: dopo ?? null }
}

// dove un gioco vero accetta l'obiettivo, la stessa lezione anche lì (e il «se hai finito», se lo accetta)
function neiGiochi(p) {
  return GIOCHI.filter(g => g.id !== 'schede' && giochiPer(p.obiettivo.esercizio).some(x => x.id === g.id)).map(g => ({
    ...p, id: `${p.id}-${g.id}`, nome: `${p.nome} ${g.nei}`,
    obiettivo: { ...p.obiettivo, esercizio: conGioco(p.obiettivo.esercizio, g.id) }, dopo: conGioco(p.dopo, g.id),
  }))
}

export const LEZIONI_PRONTE = Object.freeze(ANNI.flatMap(anno => CATALOGO.materie.flatMap(mat =>
  (SCRITTE[anno][mat.id] || []).map(r => scritta(anno, mat.id, r)).flatMap(p => [p, ...neiGiochi(p)]))))

/* ══════════════ i filtri ══════════════ */

export const giocoDellaPronta = p => giocoDi(p.obiettivo.esercizio)

// quelle che rispondono a tutti i filtri dati (un filtro assente vale tutto)
export const pronte = ({ anno, materia, gioco } = {}) => LEZIONI_PRONTE.filter(p =>
  (anno == null || p.anno === anno) && (materia == null || p.materia === materia) && (gioco == null || giocoDellaPronta(p) === gioco))

// le materie del catalogo, nel suo ordine, che hanno lezioni pronte per quell'anno
export const materiePer = anno => CATALOGO.materie.filter(mat => pronte({ anno, materia: mat.id }).length)

// i giochi in cui si fa qualcosa di quella materia in quell'anno
export const giochiDi = (anno, materia) => GIOCHI.filter(g => pronte({ anno, materia, gioco: g.id }).length)

// la lezione che viaggia (docs/scuola/protocollo.md), da dare all'editor: una copia, con l'id nuovo
export const lezioneDa = (p, id) => JSON.parse(JSON.stringify({ id, nome: p.nome, obiettivo: p.obiettivo, dopo: p.dopo }))
