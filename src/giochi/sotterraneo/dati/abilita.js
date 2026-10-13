// L'albero delle abilità (docs/sotterraneo/abilita.md): quattro rami per classe, cinque gradini per ramo (due nodi fra cui
// scegliere in due gradini), e l'energia che le paga. Dato puro: le regole che lo leggono stanno in motore/abilita.js (i
// punti, le caselle) e in motore/scontro.js (cosa succede nello scontro). Un numero per grado: [primo, secondo, terzo].
//
// Il vocabolario degli effetti, uguale per tutti i rami (un effetto nuovo si aggiunge in motore/scontro.js):
//   attive, quando la risposta è giusta:
//     per        il colpo vale tante volte il solito          passa     quanta difesa del mostro non conta (0,5: metà)
//     quieto     il bersaglio salta il suo prossimo turno      rompe     il mostro perde la difesa per tutto lo scontro
//     veleno     turni: a ogni suo turno perde metà colpo (con `elemento: 'fuoco'` il mostro brucia, con gli altri è avvelenato)
//     debole     turni: il mostro colpisce a metà (con `elemento: 'gelo'` è gelato)       fermo   turni: il mostro salta i suoi turni
//     sanguina   turni: il taglio perde un quarto di colpo a ogni suo turno, e ogni ferita nuova si somma (fino a tre)
//     parato     turni dell'eroe: i colpi presi fanno metà    scudo     assorbe tanta vita (in quarti della vita massima)
//     intoccabile turni dell'eroe: nessun danno             specchio  il prossimo colpo preso torna al mostro, per tanto
//     cura       quarti della vita massima                    linfa     turni dell'eroe: cura un decimo della vita a turno
//     forma      chi prende il colpo (docs/sotterraneo/scontro.md): 'uno' (il bersaglio, se manca), 'vicini' (il bersaglio e i due
//                accanto), 'catena' (il bersaglio e `salti` altri, ×0,7 a salto), 'tutti' (tutti in campo); gli effetti vanno a tutti i presi
//     elemento   di che natura è il colpo (dati/elementi.js): un mostro che lo resiste prende metà, uno che lo teme un danno e mezzo;
//                senza, quello del ramo, e senza ancora `fisico`. L'attacco solito non ne ha
//     esposto    turni: il mostro bloccato subisce tanta percentuale di danno in più (Radici)
//     capi       contro un capo o un mostro grosso il colpo vale `capi` volte invece di `per` (l'ultimo gradino dei rami)
//     difende    non fa niente da sé: segna l'abilità di difesa del livello 2 (la regola di guastiDelleAbilita)
//     seStordito il colpo vale `per` solo su un mostro avvelenato, gelato o fermo (o che sanguina), se no `altrimenti`
//     effetto    come si vede sul palco (dati/effetti.js, EFFETTI): una chiave di quella tabella. Solo le abilità importanti ne scrivono
//                uno; senza, se lo ricava da elemento, forma e da cosa fa (`effettoDi`), così un nodo nuovo ne ha già uno
//   sempre (nodi senza costo, valgono da soli):
//     colpoPiu (con l'arma del ramo), graffioMeno (con lo scudo in mano), vitaPiu, schivata, energiaPiu,
//     energiaPerMostro, primoTiro (con l'arco: la prima risposta di uno scontro colpisce da lontano), testaDura
//     (i primi colpi presi in uno scontro fanno metà), fiato (una volta per discesa non si sviene), rami
//     (`piu`: percentuale di danno in più per le attive dello stesso ramo), geloPiu (percentuale: i mostri gelati prendono di più),
//     furia (percentuale di danno in più quando resta meno di metà vita), ruba (percentuale del danno fatto che guarisce),
//     spine (percentuale del danno preso che torna a chi colpisce), velocitaPiu (punti di velocità: la fila dei turni)

import { EROI, eroeDi } from './eroi.js'
import { CHIAVI_ELEMENTI } from './elementi.js'
import { ENERGIA_PER_INTELLIGENZA, DOTE_OGNI, puntiAttesi } from './livelli.js'

// l'energia: si riempie combattendo (due punti ogni cinque risposte giuste, ma solo dentro lo scontro), alla fonte e con la pozione
// blu; mai col tempo, perché sotto una domanda l'orologio è fermo (come la torcia, che si conta a stanze:
// docs/sotterraneo/roba.md). Il massimo è ENERGIA più tre per punto di intelligenza (motore/corredo.js): il mago è il mago
// del mana, parte da ventidue; l'elfa da tredici, il cavaliere e il nano da dieci (docs/sotterraneo/abilita.md, «L'energia»)
export const ENERGIA = 7
export const ENERGIA_DI_PARTENZA_MINIMA = 10
// l'energia torna piano e solo combattendo (l'utente, 12 ottobre: il bambino era sempre a pieno mana): due punti ogni cinque
// risposte giuste date a un mostro (2,5 a punto: il resto passa al punto dopo). Porte, forzieri e curiosità non la ridanno
export const RISPOSTE_PER_ENERGIA = 2.5
// quanto costa un'abilità (l'utente, 13 ottobre: «il mago può avere costi diversi da quelli del cavaliere»; a lanci, non a numeri):
// il globo che la sua classe ha al livello del nodo, diviso per quante volte la classe deve poterla lanciare col globo pieno
// (`lanci` di ogni eroe, dati/eroi.js, una per riga: il mago 6 · 6 · 5 · 4 e l'ultima riga una volta sola, gli altri 3 · 3 · 2,5 · 2 e
// una). Il costo cresce con la riga e, nel mago, con il grado (il globo cresce col livello). Si ricalcola da solo se cambia
// l'energia, la dote o il giro dei punti
export const LANCI_DELL_ULTIMA = 1
// quante abilità si portano nello scontro: tre stanno sopra le risposte anche a 320 px
export const CASELLE_ABILITA = 3
// un punto abilità per livello dal 2: al 12, dove finisce la storia, undici punti per una trentina di nodi per classe
export const PUNTI_ABILITA_PER_LIVELLO = 1
// i gradini del ramo si aprono a questi livelli; ogni grado in più di un nodo vuole due livelli sopra il suo gradino.
// I gradi non hanno tetto (l'utente, 9 ottobre: al livello 50 c'è ancora qualcosa da fare con le abilità): i primi
// GRADI sono scritti nel nodo, oltre si cresce a metà del passo dell'ultimo (`n` qui sotto)
export const GRADINI = [2, 4, 6, 8, 12]
export const LIVELLI_PER_GRADO = 2
export const GRADI = 3

// il globo di energia che la classe ha al livello `livello`, dalle sue caratteristiche (la partenza, i punti come li dà il banco,
// la dote): non i nodi che alzano l'energia, che sono una scelta. È quello che l'eroe atteso ha (motore/forza.js, eroeAtteso)
export function globoAtteso(classe, livello) {
  const e = eroeDi(classe)
  const dote = e.dote === 'intelligenza' ? Math.floor((Math.max(1, livello) - 1) / DOTE_OGNI) : 0
  return ENERGIA + ENERGIA_PER_INTELLIGENZA * ((e.parte.intelligenza || 0) + puntiAttesi(classe, livello).intelligenza + dote)
}
// quante volte la classe lancia un'abilità della riga `riga` col globo pieno
export const lanciDellaRiga = (classe, riga) => eroeDi(classe).lanci[riga]
// il costo di un'abilità della riga `riga` di quella classe, quando chi la porta è al livello `livello`
export const costoDelGradino = (classe, riga, livello = GRADINI[riga]) =>
  Math.max(1, Math.round(globoAtteso(classe, livello) / lanciDellaRiga(classe, riga)))
// il costo di un nodo al grado `g`: ogni grado vuole due livelli in più, e il globo che la classe ha lì (motore/abilita.js, livelloPer)
export const costoAl = (nodo, g = 1) =>
  nodo.sempre ? 0 : costoDelGradino(nodo.classe, nodo.riga, GRADINI[nodo.riga] + (Math.max(1, g) - 1) * LIVELLI_PER_GRADO)

// le armi che un ramo vuole in mano: le famiglie (dati/eroi.js), o 'scudo' per uno scudo nella mancina. `corto` sta
// sulla casella spenta dello scontro, dove c'è posto per due parole
const ARCO = { famiglie: ['archi'], glifo: 'arco', nome: 'un arco', corto: 'serve l\'arco', con: 'con l\'arco' }
const LAMA = { famiglie: ['spade', 'asce'], glifo: 'spada', nome: 'una spada o un\'ascia', corto: 'serve una lama', con: 'con spada o ascia' }
const SPADA = { famiglie: ['spade'], glifo: 'spada', nome: 'una spada', corto: 'serve la spada', con: 'con la spada' }
const ASCIA = { famiglie: ['asce'], glifo: 'ascia', nome: 'un\'ascia', corto: 'serve l\'ascia', con: 'con l\'ascia' }
const BACCHETTA = { famiglie: ['bacchette'], glifo: 'bacchetta', nome: 'una bacchetta', corto: 'serve la bacchetta', con: 'con la bacchetta' }
const SCUDO = { scudo: true, glifo: 'scudo', nome: 'uno scudo', corto: 'serve lo scudo', con: 'con lo scudo' }

// `fa(g, vm)` è la riga corta della pagina, al grado g: dice il numero, non la storia (`vm`: la vita massima dell'eroe,
// per le cure e gli scudi). Niente emoji: le icone
// sono disegnate in codice (`glifo`, viste/glifi.js), e `tinta` è il colore del ramo
// il valore al grado g: scritto fino al terzo, poi metà del passo fra il secondo e il terzo a ogni grado (interi se
// erano interi: gli scambi e i punti non si spezzano)
export function n(v, g) {
  const i = Math.max(1, g) - 1
  if (i < v.length) return v[i]
  const ultimo = v[v.length - 1], passo = (ultimo - (v[v.length - 2] ?? ultimo)) / 2
  const x = ultimo + passo * (i - v.length + 1)
  return v.every(Number.isInteger) ? Math.round(x) : Math.round(x * 100) / 100
}
// Le righe parlano di danno, di turni (una risposta = un turno) e di protezione, non di «scambi» e «colpi a metà»
// (l'utente, 9 ottobre). Il nome dell'abilità sta già sopra la riga: la riga dice solo l'effetto
const volte = v => (v === 2 ? 'il doppio' : v === 3 ? 'il triplo' : `×${String(v).replace('.', ',')}`)
const turni = v => `${v} ${v === 1 ? 'turno' : 'turni'}`
// «danno e mezzo» non si legge: sotto il doppio si dice il moltiplicatore («×1,5 il danno»), e «svegli» sta per «della stanza»
const FRASI_DANNO = { 1: 'il danno di sempre', 2: 'il doppio del danno', 3: 'il triplo del danno', 4: 'il quadruplo del danno' }
const danno = v => FRASI_DANNO[v] || `×${String(v).replace('.', ',')} il danno`
const faDanno = v => (v === 1 ? 'fa il danno di sempre' : `fa ${danno(v)}`)
// i colpi forti dell'ultimo gradino valgono molto di più contro i capi e i mostri grossi (`capi`: il moltiplicatore)
const controCapi = v => `${(FRASI_DANNO[v] || '×' + String(v).replace('.', ',') + ' il danno').replace(' del danno', '').replace(' il danno', '')} contro capi e boss`
// le cure e gli scudi si contano in quarti della vita massima (motore/scontro.js, usaAbilita): con la vita dell'eroe
// (`vm`, la pagina la passa) la riga dice il numero vero, «ti guarisce di 12 punti di vita»; senza, la parte della vita
export const inVita = (v, vm) => Math.max(1, Math.round(Math.round(vm / 4) * v))
const cura = (v, vm) => (vm ? `ti guarisce di ${inVita(v, vm)} punti di vita` : `ti guarisce di un quarto della vita${v > 1 ? ` e oltre (×${String(v).replace('.', ',')})` : ''}`)
const scudo = (v, vm) => `una barriera ti protegge dai prossimi ${vm ? `${inVita(v, vm)} danni` : 'danni (un quarto della vita)'}, finché dura lo scontro`
// le forme dei colpi nelle righe della pagina: chi altro prende il colpo
const AI_VICINI = 'al mostro e ai due accanto'
const salti = v => `salta su altri ${v} ${v === 1 ? 'mostro' : 'mostri'}, ogni volta col 70% del colpo`
const brucia = v => `il mostro arde: metà del tuo danno a ogni turno, per ${turni(v)}`
const sanguina = v => `il mostro sanguina per ${turni(v)}, e ogni ferita nuova lo fa sanguinare di più`

// I nodi di un ramo stanno in righe: un nodo solo, oppure due fra cui scegliere (si può prendere l'uno, l'altro o tutti e
// due, coi punti). Una riga si apre quando si è imparato almeno un nodo della riga sopra (motore/abilita.js). `riga` è
// il numero del gradino; il livello viene da lì (GRADINI), il costo da costoAl (qui sotto, dopo l'albero)
const righe = (...rr) => rr.flatMap((r, i) => r.map(x => ({ ...x, riga: i })))

// La regola dell'utente (9 ottobre): ogni classe ha un modo di difendersi al livello 2, in un ramo che non vuole armi,
// e uno di curarsi entro il livello 4 (guastiDelleAbilita lo controlla). Quattro rami per classe, sette nodi per ramo
// (l'utente, 12 ottobre: un albero più ricco dove si sceglie, non tre colonnine; più scelta, non più forza)
export const RAMI = {
  cavaliere: [
    { chiave: 'lama', nome: 'Lama', glifo: 'spada', tinta: '#8fa6c8', arma: LAMA, elemento: 'fisico', nodi: righe(
      [{ id: 'fendente', nome: 'Fendente', glifo: 'fendente', effetto: 'taglio', per: [2, 2.5, 3],
        fa: g => `${faDanno(n([2, 2.5, 3], g))}` }],
      [{ id: 'filo', nome: 'Filo affilato', glifo: 'filo', sempre: true, colpoPiu: [20, 35, 50],
        fa: g => `+${n([20, 35, 50], g)}% di danno a ogni colpo` }],
      [{ id: 'taglio-profondo', nome: 'Taglio profondo', glifo: 'taglio', effetto: 'croce', per: [1.5, 1.5, 2], sanguina: [3, 4, 5],
        fa: g => `${faDanno(n([1.5, 1.5, 2], g))}, ${sanguina(n([3, 4, 5], g))}` },
       { id: 'spazzata', nome: 'Spazzata', glifo: 'spazzata', effetto: 'spazzata', forma: 'vicini', per: [1.2, 1.5, 1.8],
        fa: g => `${faDanno(n([1.2, 1.5, 1.8], g))} ${AI_VICINI}` }],
      [{ id: 'affondo', nome: 'Affondo', glifo: 'affondo', effetto: 'affondo', rompe: true, per: [1.5, 2, 2.5],
        fa: g => `spezza la difesa del mostro per tutto lo scontro e ${faDanno(n([1.5, 2, 2.5], g))}` },
       { id: 'mulinello', nome: 'Mulinello', glifo: 'mulinello', effetto: 'turbine', forma: 'tutti', per: [1, 1.2, 1.4],
        fa: g => `${faDanno(n([1, 1.2, 1.4], g))} a tutti i mostri in campo` }],
      [{ id: 'turbine', nome: 'Colpo del campione', glifo: 'turbine', effetto: 'turbine', per: [2, 2.5, 3], capi: [4, 5, 6],
        fa: g => `${faDanno(n([2, 2.5, 3], g))}, ${controCapi(n([4, 5, 6], g))}` }],
    ) },
    { chiave: 'scudo', nome: 'Scudo', glifo: 'scudo', tinta: '#c99a3a', arma: SCUDO, elemento: 'fisico', nodi: righe(
      [{ id: 'scudo-alzato', nome: 'Scudo alzato', glifo: 'scudo', effetto: 'scudo', parato: [2, 3, 4], difende: true,
        fa: g => `i colpi che subisci fanno metà per ${turni(n([2, 3, 4], g))}` }],
      [{ id: 'parata', nome: 'Parata', glifo: 'parata', sempre: true, graffioMeno: [1, 2, 3],
        fa: g => `ogni colpo che subisci fa ${n([1, 2, 3], g)} di danno in meno` }],
      [{ id: 'spallata', nome: 'Spallata', glifo: 'spallata', effetto: 'urto', per: [1.2, 1.5, 1.8], quieto: true,
        fa: g => `${faDanno(n([1.2, 1.5, 1.8], g))}, e il mostro salta il suo prossimo turno` },
       { id: 'bordo-a-punte', nome: 'Bordo a punte', glifo: 'punte', sempre: true, spine: [25, 40, 55],
        fa: g => `chi ti colpisce si fa male: gli torna il ${n([25, 40, 55], g)}% del danno che ti fa` }],
      [{ id: 'colpo-di-scudo', nome: 'Colpo di scudo', glifo: 'colpo-di-scudo', effetto: 'urto', fermo: [1, 2, 2], per: [1, 1, 1.5],
        fa: g => `il mostro resta stordito per ${turni(n([1, 2, 2], g))}: non può attaccare` },
       { id: 'fortezza', nome: 'Fortezza', glifo: 'fortezza', effetto: 'scudo', cura: [1, 1.4, 1.8], parato: [2, 2, 3],
        fa: (g, vm) => `${cura(n([1, 1.4, 1.8], g), vm)}, e i colpi che subisci fanno metà per ${turni(n([2, 2, 3], g))}` }],
      [{ id: 'muro', nome: 'Muro', glifo: 'muro', effetto: 'muro', debole: [4, 6, 8],
        fa: g => `protezione che dimezza i danni per ${turni(n([4, 6, 8], g))}` }],
    ) },
    { chiave: 'giuramento', nome: 'Giuramento', glifo: 'cuore', tinta: '#c0393b', car: 'forza', elemento: 'sacro', nodi: righe(
      [{ id: 'preghiera', nome: 'Preghiera', glifo: 'preghiera', effetto: 'preghiera', cura: [2, 2.8, 3.6], difende: true,
        fa: (g, vm) => cura(n([2, 2.8, 3.6], g), vm) }],
      [{ id: 'cuore-saldo', nome: 'Cuore saldo', glifo: 'cuore', sempre: true, vitaPiu: [5, 10, 15],
        fa: g => `+${n([5, 10, 15], g)} di vita` }],
      [{ id: 'luce-sacra', nome: 'Luce sacra', glifo: 'luce', effetto: 'luce', per: [1.5, 2, 2.5],
        fa: g => `${faDanno(n([1.5, 2, 2.5], g))}, di luce sacra: i morti e le ombre la temono` },
       { id: 'mano-santa', nome: 'Mano santa', glifo: 'croce', sempre: true, ruba: [8, 12, 16],
        fa: g => `ti guarisci del ${n([8, 12, 16], g)}% del danno che fai` }],
      [{ id: 'grido', nome: 'Grido di guerra', glifo: 'corno', effetto: 'onda', forma: 'tutti', debole: [3, 4, 5], per: [1, 1, 1],
        fa: g => `tutti i mostri in campo fanno metà del danno per ${turni(n([3, 4, 5], g))}` },
       { id: 'giudizio', nome: 'Giudizio', glifo: 'giudizio', effetto: 'luce', forma: 'vicini', per: [1.2, 1.5, 1.8],
        fa: g => `${faDanno(n([1.2, 1.5, 1.8], g))} di luce sacra ${AI_VICINI}` }],
      [{ id: 'ultimo-fiato', nome: 'Ultimo fiato', glifo: 'ala', sempre: true, fiato: [1, 1, 1], vitaPiu: [0, 5, 10],
        fa: g => `una volta per discesa, invece di svenire resti in piedi${g > 1 ? ` · +${n([0, 5, 10], g)} di vita` : ''}` }],
    ) },
    // il cavaliere che non ragiona: forte quando ha poca vita, e tira dritto (nessuna arma, picchia con la forza)
    { chiave: 'furia', nome: 'Furia', glifo: 'furia', tinta: '#c2562c', car: 'forza', elemento: 'fisico', nodi: righe(
      [{ id: 'colpo-furioso', nome: 'Colpo furioso', glifo: 'furia', effetto: 'urto', per: [2, 2.5, 3],
        fa: g => `${faDanno(n([2, 2.5, 3], g))}, con ogni arma` }],
      [{ id: 'rabbia', nome: 'Rabbia', glifo: 'rabbia', sempre: true, furia: [20, 35, 50],
        fa: g => `+${n([20, 35, 50], g)}% di danno quando ti resta meno di metà vita` }],
      [{ id: 'carica', nome: 'Carica', glifo: 'carica', effetto: 'affondo', passa: 0.5, per: [1.5, 1.8, 2.2],
        fa: g => `ignora metà della difesa e ${faDanno(n([1.5, 1.8, 2.2], g))}` },
       { id: 'ruggito', nome: 'Ruggito', glifo: 'ruggito', effetto: 'onda', forma: 'tutti', debole: [1, 2, 2],
        fa: g => `tutti i mostri in campo fanno metà del danno per ${turni(n([1, 2, 2], g))}` }],
      [{ id: 'macello', nome: 'Macello', glifo: 'macello', effetto: 'croce', forma: 'vicini', per: [1.2, 1.5, 1.8], sanguina: [2, 3, 3],
        fa: g => `${faDanno(n([1.2, 1.5, 1.8], g))} ${AI_VICINI}, e li fa sanguinare per ${turni(n([2, 3, 3], g))}` },
       { id: 'passo-di-carica', nome: 'Passo di carica', glifo: 'stivale', sempre: true, velocitaPiu: [1, 1, 2],
        fa: g => `+${n([1, 1, 2], g)} di velocità: nella fila dei turni arrivi prima` }],
      [{ id: 'tempesta-di-colpi', nome: 'Tempesta di colpi', glifo: 'colpi', effetto: 'turbine', forma: 'tutti', per: [1.5, 1.8, 2.2],
        fa: g => `${faDanno(n([1.5, 1.8, 2.2], g))} a tutti i mostri in campo` }],
    ) },
  ],

  elfa: [
    { chiave: 'arco', nome: 'Arco', glifo: 'arco', tinta: '#4f9a5a', arma: ARCO, elemento: 'fisico', nodi: righe(
      [{ id: 'dardo-avvelenato', nome: 'Dardo avvelenato', glifo: 'freccia-veleno', effetto: 'freccia-veleno', veleno: [3, 4, 5], elemento: 'veleno',
        fa: g => `il veleno fa metà del tuo danno a ogni turno, per ${turni(n([3, 4, 5], g))}` }],
      [{ id: 'primo-tiro', nome: 'Primo tiro', glifo: 'mira', sempre: true, primoTiro: [0, 25, 50],
        fa: g => `spari per primo in ogni scontro, prima di tutti${g > 1 ? ` · +${n([0, 25, 50], g)}% di danno` : ''}` }],
      [{ id: 'freccia-di-fuoco', nome: 'Freccia di fuoco', glifo: 'freccia-fuoco', effetto: 'freccia-fuoco', elemento: 'fuoco', per: [1.5, 1.5, 2], veleno: [2, 3, 3],
        fa: g => `${faDanno(n([1.5, 1.5, 2], g))}, ${brucia(n([2, 3, 3], g))}` },
       { id: 'freccia-che-trapassa', nome: 'Freccia che trapassa', glifo: 'trapassa', effetto: 'trapassa', forma: 'catena', salti: [1, 2, 2], per: [1.5, 1.8, 2.2],
        fa: g => `${faDanno(n([1.5, 1.8, 2.2], g))}, e la freccia ${salti(n([1, 2, 2], g))}` }],
      [{ id: 'freccia-mirata', nome: 'Freccia mirata', glifo: 'freccia', effetto: 'freccia', per: [2, 2.5, 3], quieto: true,
        fa: g => `${faDanno(n([2, 2.5, 3], g))}, e il mostro salta il suo prossimo turno` },
       { id: 'volo-di-frecce', nome: 'Volo di frecce', glifo: 'volo', effetto: 'pioggia', forma: 'vicini', per: [1.2, 1.5, 1.8],
        fa: g => `${faDanno(n([1.2, 1.5, 1.8], g))} ${AI_VICINI}` }],
      [{ id: 'pioggia', nome: 'Freccia del cacciatore', glifo: 'pioggia', effetto: 'pioggia', per: [2, 2.5, 3], capi: [4, 5, 6],
        fa: g => `${faDanno(n([2, 2.5, 3], g))}, ${controCapi(n([4, 5, 6], g))}` }],
    ) },
    { chiave: 'lame', nome: 'Lame', glifo: 'pugnale', tinta: '#8a78c8', arma: SPADA, elemento: 'fisico', nodi: righe(
      [{ id: 'stoccata', nome: 'Stoccata', glifo: 'pugnale', effetto: 'affondo', passa: 0.5, per: [1.5, 2, 2.5],
        fa: g => `ignora metà della difesa e ${faDanno(n([1.5, 2, 2.5], g))}` }],
      [{ id: 'passo-leggero', nome: 'Passo leggero', glifo: 'vento', sempre: true, schivata: [8, 16, 24],
        fa: g => `${n([8, 16, 24], g)}% di probabilità di schivare un colpo` }],
      [{ id: 'ferita-aperta', nome: 'Ferita aperta', glifo: 'ferita', effetto: 'croce', per: [1.2, 1.5, 1.5], sanguina: [4, 5, 6],
        fa: g => `${faDanno(n([1.2, 1.5, 1.5], g))}, ${sanguina(n([4, 5, 6], g))}` },
       { id: 'piedi-leggeri', nome: 'Piedi leggeri', glifo: 'piedi', sempre: true, velocitaPiu: [1, 1, 2],
        fa: g => `+${n([1, 1, 2], g)} di velocità: nella fila dei turni arrivi prima` }],
      [{ id: 'danza', nome: 'Danza delle lame', glifo: 'danza', effetto: 'turbine', parato: [2, 3, 4], per: [1.5, 1.5, 2],
        fa: g => `${faDanno(n([1.5, 1.5, 2], g))} e i colpi che subisci fanno metà per ${turni(n([2, 3, 4], g))}` },
       { id: 'passo-d-ombra', nome: 'Passo d\'ombra', glifo: 'ombra', effetto: 'affondo', intoccabile: [1, 1, 2], per: [1, 1, 1.5],
        fa: g => `${faDanno(n([1, 1, 1.5], g))}, e per ${turni(n([1, 1, 2], g))} nessun colpo ti tocca` }],
      [{ id: 'alle-spalle', nome: 'Alle spalle', glifo: 'luna', effetto: 'croce', seStordito: true, per: [3, 3.5, 4], altrimenti: 1.5,
        fa: g => `fa ${danno(n([3, 3.5, 4], g))} su un mostro avvelenato, gelato o stordito, se no ${danno(1.5)}` }],
    ) },
    { chiave: 'bosco', nome: 'Bosco', glifo: 'foglia', tinta: '#6d8f2e', car: 'destrezza', elemento: 'veleno', nodi: righe(
      [{ id: 'rovi', nome: 'Rovi', glifo: 'rovi', effetto: 'radici', debole: [3, 4, 5], difende: true,
        fa: g => `il mostro fa metà del danno per ${turni(n([3, 4, 5], g))}` }],
      [{ id: 'linfa', nome: 'Linfa', glifo: 'germoglio', effetto: 'cura', linfa: [4, 5, 6], cura: [0.8, 1.2, 1.6],
        fa: (g, vm) => `${cura(n([0.8, 1.2, 1.6], g), vm)}, poi ${vm ? `${Math.max(1, Math.round(vm / 10))} punti` : 'un po\''} a ogni turno per ${turni(n([4, 5, 6], g))}` }],
      [{ id: 'spore', nome: 'Spore', glifo: 'spore', effetto: 'nube', forma: 'vicini', per: [1, 1, 1.2], veleno: [2, 3, 3],
        fa: g => `una nuvola: ${faDanno(n([1, 1, 1.2], g))} ${AI_VICINI}, e li avvelena per ${turni(n([2, 3, 3], g))}` },
       { id: 'silenzio-del-bosco', nome: 'Silenzio del bosco', glifo: 'quiete', sempre: true, energiaPiu: [1, 2, 3],
        fa: g => `+${n([1, 2, 3], g)} di energia` }],
      [{ id: 'respiro', nome: 'Respiro del bosco', glifo: 'foglia', sempre: true, energiaPerMostro: [1, 2, 3],
        fa: g => `+${n([1, 2, 3], g)} di energia a ogni mostro battuto` },
       { id: 'ortica', nome: 'Ortica', glifo: 'ortica', effetto: 'nube', forma: 'tutti', per: [0.7, 0.8, 0.9], veleno: [2, 3, 3],
        fa: g => `punge tutti i mostri in campo (${faDanno(n([0.7, 0.8, 0.9], g))}) e li avvelena per ${turni(n([2, 3, 3], g))}` }],
      [{ id: 'radici', nome: 'Radici', glifo: 'radici', effetto: 'radici', fermo: [3, 3, 4], esposto: [50, 60, 70], per: [1, 1, 1], capi: [3, 3.5, 4],
        fa: g => `il mostro è bloccato per ${turni(n([3, 3, 4], g))}: non può attaccare e subisce il ${n([50, 60, 70], g)}% di danno in più · ${controCapi(n([3, 3.5, 4], g))}` }],
    ) },
    // la luna: luce che ferisce, gelo che rallenta, sonno che ferma. Non vuole armi: picchia con la destrezza
    { chiave: 'luna', nome: 'Luna', glifo: 'mezzaluna', tinta: '#9fb4e8', car: 'destrezza', elemento: 'sacro', nodi: righe(
      [{ id: 'raggio-di-luna', nome: 'Raggio di luna', glifo: 'raggio', effetto: 'luce', per: [2, 2.5, 3],
        fa: g => `${faDanno(n([2, 2.5, 3], g))}, di luce sacra` }],
      [{ id: 'luce-d-argento', nome: 'Luce d\'argento', glifo: 'argento', sempre: true, rami: { piu: [20, 30, 40] },
        fa: g => `la luna fa il ${n([20, 30, 40], g)}% di danno in più` }],
      [{ id: 'notte-gelida', nome: 'Notte gelida', glifo: 'brina', effetto: 'nevicata', elemento: 'gelo', forma: 'vicini', per: [1, 1, 1.2], debole: [2, 2, 3],
        fa: g => `${faDanno(n([1, 1, 1.2], g))} ${AI_VICINI}: gelano e fanno metà del danno per ${turni(n([2, 2, 3], g))}` },
       { id: 'ninna-nanna', nome: 'Ninna nanna', glifo: 'sonno', effetto: 'sonno', forma: 'vicini', fermo: [1, 1, 2],
        fa: g => `il mostro e i due accanto si addormentano: non attaccano per ${turni(n([1, 1, 2], g))}` }],
      [{ id: 'falce-di-luna', nome: 'Falce di luna', glifo: 'falce', effetto: 'falce', per: [1.8, 2.2, 2.6],
        fa: g => `${faDanno(n([1.8, 2.2, 2.6], g))}, di luce sacra` },
       { id: 'velo-di-luna', nome: 'Velo di luna', glifo: 'velo', sempre: true, schivata: [6, 10, 14],
        fa: g => `+${n([6, 10, 14], g)}% di probabilità di schivare un colpo` }],
      [{ id: 'luna-piena', nome: 'Luna piena', glifo: 'luna-piena', effetto: 'luce', forma: 'tutti', per: [1.5, 1.8, 2.2],
        fa: g => `${faDanno(n([1.5, 1.8, 2.2], g))}, di luce sacra, a tutti i mostri in campo` }],
    ) },
  ],

  // il mago porta le bacchette e le spade. Fuoco e Gelo vogliono la bacchetta (anche nella mancina), la Lama arcana la spada:
  // chi le ha tutte e due è un mago guerriero, e ogni ramo colpisce con la caratteristica che gli spetta
  mago: [
    { chiave: 'fuoco', nome: 'Fuoco', glifo: 'fiamma', tinta: '#d9632a', arma: BACCHETTA, elemento: 'fuoco', nodi: righe(
      [{ id: 'dardo-di-fuoco', nome: 'Dardo di fuoco', glifo: 'fiamma', effetto: 'palla', per: [2, 2.5, 3],
        fa: g => `${faDanno(n([2, 2.5, 3], g))}` }],
      [{ id: 'fiamma-viva', nome: 'Fiamma viva', glifo: 'candela', sempre: true, rami: { piu: [30, 40, 50] },
        fa: g => `il fuoco fa il ${n([30, 40, 50], g)}% di danno in più` }],
      [{ id: 'sfera-di-fuoco', nome: 'Palla di fuoco', glifo: 'palla', effetto: 'palla', forma: 'vicini', per: [1.3, 1.6, 2],
        fa: g => `${faDanno(n([1.3, 1.6, 2], g))} ${AI_VICINI}` },
       { id: 'scintille', nome: 'Pioggia di scintille', glifo: 'scintille', effetto: 'brace', forma: 'tutti', per: [0.7, 0.9, 1.1],
        fa: g => `${faDanno(n([0.7, 0.9, 1.1], g))} a tutti i mostri in campo` }],
      [{ id: 'brucia', nome: 'Brucia', glifo: 'brace', effetto: 'rogo', veleno: [3, 4, 5],
        fa: g => `${brucia(n([3, 4, 5], g))}` },
       { id: 'esplosione', nome: 'Esplosione', glifo: 'esplosione', effetto: 'esplode', forma: 'vicini', per: [1.8, 2.2, 2.6],
        fa: g => `${faDanno(n([1.8, 2.2, 2.6], g))} ${AI_VICINI}` }],
      [{ id: 'palla-di-fuoco', nome: 'Meteora', glifo: 'meteora', effetto: 'meteora', per: [2, 2.5, 3], capi: [4, 5, 6],
        fa: g => `${faDanno(n([2, 2.5, 3], g))}, ${controCapi(n([4, 5, 6], g))}` }],
    ) },
    { chiave: 'gelo', nome: 'Gelo', glifo: 'fiocco', tinta: '#4aa3d8', arma: BACCHETTA, elemento: 'gelo', nodi: righe(
      [{ id: 'raggio-di-gelo', nome: 'Raggio di gelo', glifo: 'fiocco', effetto: 'fascio', debole: [2, 3, 4], per: [1, 1, 1],
        fa: g => `il mostro gela: fa metà del danno per ${turni(n([2, 3, 4], g))}` }],
      [{ id: 'gelo-profondo', nome: 'Gelo profondo', glifo: 'cristallo', sempre: true, geloPiu: [20, 35, 50],
        fa: g => `chi è gelato subisce il ${n([20, 35, 50], g)}% di danno in più a ogni colpo` }],
      [{ id: 'scheggia', nome: 'Scheggia di ghiaccio', glifo: 'scheggia', effetto: 'scheggia', per: [1.5, 2, 2.5],
        fa: g => `${faDanno(n([1.5, 2, 2.5], g))}, di gelo` },
       { id: 'nevicata', nome: 'Nevicata', glifo: 'neve', effetto: 'nevicata', forma: 'vicini', per: [1, 1, 1.2], debole: [2, 2, 3],
        fa: g => `${faDanno(n([1, 1, 1.2], g))} ${AI_VICINI}: gelano e fanno metà del danno per ${turni(n([2, 2, 3], g))}` }],
      [{ id: 'lancia-di-ghiaccio', nome: 'Lancia di ghiaccio', glifo: 'lancia', effetto: 'lancia', seStordito: true, per: [3, 3.5, 4], altrimenti: 1.5,
        fa: g => `fa ${danno(n([3, 3.5, 4], g))} su un mostro gelato, in fiamme o stordito, se no ${danno(1.5)}` },
       { id: 'prigione-di-ghiaccio', nome: 'Prigione di ghiaccio', glifo: 'prigione', effetto: 'blocco', fermo: [1, 2, 2], per: [1, 1, 1.5],
        fa: g => `il mostro è chiuso nel ghiaccio per ${turni(n([1, 2, 2], g))}: non può attaccare` }],
      [{ id: 'tempesta', nome: 'Gelo eterno', glifo: 'tempesta', effetto: 'nevicata', debole: [3, 4, 5], per: [1.5, 1.5, 2], capi: [3, 3.5, 4],
        fa: g => `${faDanno(n([1.5, 1.5, 2], g))} e gela il mostro per ${turni(n([3, 4, 5], g))} · ${controCapi(n([3, 3.5, 4], g))}` }],
    ) },
    { chiave: 'arcano', nome: 'Arcano', glifo: 'sfera', tinta: '#9b4fd0', car: 'intelligenza', elemento: 'fulmine', nodi: righe(
      [{ id: 'scudo-arcano', nome: 'Scudo arcano', glifo: 'sfera', effetto: 'sfera', scudo: [2, 2.6, 3.2], difende: true,
        fa: (g, vm) => scudo(n([2, 2.6, 3.2], g), vm) }],
      [{ id: 'fonte-arcana', nome: 'Fonte arcana', glifo: 'calice', effetto: 'cura', cura: [2, 2.8, 3.6],
        fa: (g, vm) => cura(n([2, 2.8, 3.6], g), vm) }],
      [{ id: 'mente-lucida', nome: 'Mente lucida', glifo: 'mente', sempre: true, energiaPiu: [1, 2, 3],
        fa: g => `+${n([1, 2, 3], g)} di energia` },
       { id: 'raggio-arcano', nome: 'Raggio arcano', glifo: 'raggio-arcano', effetto: 'fascio', per: [1.5, 2, 2.5],
        fa: g => `${faDanno(n([1.5, 2, 2.5], g))}, di fulmine` }],
      [{ id: 'fulmine', nome: 'Fulmine', glifo: 'fulmine', effetto: 'fulmine', passa: 0.5, per: [2.5, 3, 3.5],
        fa: g => `ignora metà della difesa e ${faDanno(n([2.5, 3, 3.5], g))}` },
       { id: 'catena-di-fulmini', nome: 'Catena di fulmini', glifo: 'catena-fulmini', effetto: 'catena', forma: 'catena', salti: [2, 2, 3], per: [1.8, 2.2, 2.6],
        fa: g => `${faDanno(n([1.8, 2.2, 2.6], g))}, e il fulmine ${salti(n([2, 2, 3], g))}` }],
      [{ id: 'specchio', nome: 'Specchio', glifo: 'specchio', effetto: 'specchio', specchio: [1, 1.5, 2],
        fa: g => `il prossimo colpo che subisci si ritorce contro il mostro${g > 1 ? `, ${volte(n([1, 1.5, 2], g))}` : ''}` }],
    ) },
    // la spada e l'intelligenza (`arma` e `car` insieme: la spada si deve avere in mano, l'intelligenza decide quanto fa male)
    { chiave: 'lama-arcana', nome: 'Lama arcana', glifo: 'lama-incantata', tinta: '#6f8bdc', arma: SPADA, car: 'intelligenza', elemento: 'fulmine', nodi: righe(
      [{ id: 'lama-incantata', nome: 'Lama incantata', glifo: 'lama-incantata', effetto: 'taglio', per: [2, 2.5, 3],
        fa: g => `${faDanno(n([2, 2.5, 3], g))}: la spada colpisce con la tua intelligenza` }],
      [{ id: 'incanto', nome: 'Incanto', glifo: 'incanto', sempre: true, rami: { piu: [20, 30, 40] },
        fa: g => `la lama incantata fa il ${n([20, 30, 40], g)}% di danno in più` }],
      [{ id: 'lama-di-fuoco', nome: 'Lama di fuoco', glifo: 'lama-fuoco', effetto: 'taglio', elemento: 'fuoco', per: [1.5, 1.5, 2], veleno: [2, 3, 3],
        fa: g => `${faDanno(n([1.5, 1.5, 2], g))}, ${brucia(n([2, 3, 3], g))}` },
       { id: 'lama-di-gelo', nome: 'Lama di gelo', glifo: 'lama-gelo', effetto: 'taglio', elemento: 'gelo', per: [1.5, 2, 2.5], debole: [1, 2, 2],
        fa: g => `${faDanno(n([1.5, 2, 2.5], g))}, e il mostro gela: fa metà del danno per ${turni(n([1, 2, 2], g))}` }],
      [{ id: 'falciata-arcana', nome: 'Falciata arcana', glifo: 'falciata', effetto: 'spazzata', forma: 'vicini', per: [1.5, 2, 2.5],
        fa: g => `${faDanno(n([1.5, 2, 2.5], g))} ${AI_VICINI}, di fulmine` },
       { id: 'danza-arcana', nome: 'Danza arcana', glifo: 'danza-arcana', effetto: 'turbine', parato: [2, 3, 3], per: [1.5, 1.5, 2],
        fa: g => `${faDanno(n([1.5, 1.5, 2], g))} e i colpi che subisci fanno metà per ${turni(n([2, 3, 3], g))}` }],
      [{ id: 'spada-del-mago', nome: 'Spada del mago', glifo: 'spada-stella', effetto: 'croce', per: [2, 2.5, 3], capi: [4, 5, 6],
        fa: g => `${faDanno(n([2, 2.5, 3], g))}, ${controCapi(n([4, 5, 6], g))}` }],
    ) },
  ],

  nano: [
    { chiave: 'ascia', nome: 'Ascia', glifo: 'ascia', tinta: '#b8743a', arma: ASCIA, elemento: 'fisico', nodi: righe(
      [{ id: 'spaccaroccia', nome: 'Spaccaroccia', glifo: 'roccia', effetto: 'urto', rompe: true, per: [1.5, 2, 2.5],
        fa: g => `spezza la difesa del mostro per tutto lo scontro e ${faDanno(n([1.5, 2, 2.5], g))}` }],
      [{ id: 'mani-pesanti', nome: 'Mani pesanti', glifo: 'martello', sempre: true, colpoPiu: [20, 35, 50],
        fa: g => `+${n([20, 35, 50], g)}% di danno a ogni colpo` }],
      [{ id: 'ascia-lanciata', nome: 'Ascia lanciata', glifo: 'ascia-lanciata', effetto: 'ascia', forma: 'catena', salti: [1, 1, 2], per: [1.5, 1.8, 2.2],
        fa: g => `${faDanno(n([1.5, 1.8, 2.2], g))}, e l'ascia rimbalza: ${salti(n([1, 1, 2], g))}` },
       { id: 'ira-del-nano', nome: 'Ira del nano', glifo: 'ira', sempre: true, furia: [20, 35, 50],
        fa: g => `+${n([20, 35, 50], g)}% di danno quando ti resta meno di metà vita` }],
      [{ id: 'stordisce', nome: 'Martellata', glifo: 'stelle', effetto: 'urto', fermo: [1, 2, 2], per: [1.5, 1.5, 2],
        fa: g => `${faDanno(n([1.5, 1.5, 2], g))} e stordisce il mostro per ${turni(n([1, 2, 2], g))}: non può attaccare` },
       { id: 'mietitrice', nome: 'Mietitrice', glifo: 'mietitrice', effetto: 'spazzata', forma: 'vicini', per: [1.4, 1.8, 2.2],
        fa: g => `${faDanno(n([1.4, 1.8, 2.2], g))} ${AI_VICINI}` }],
      [{ id: 'terremoto', nome: 'Colpo del titano', glifo: 'terremoto', effetto: 'terremoto', fermo: [1, 1, 2], per: [1.5, 1.5, 2], capi: [3, 3.5, 4],
        fa: g => `${faDanno(n([1.5, 1.5, 2], g))} e stordisce il mostro per ${turni(n([1, 1, 2], g))} · ${controCapi(n([3, 3.5, 4], g))}` }],
    ) },
    { chiave: 'balestra', nome: 'Balestra', glifo: 'quadrello', tinta: '#7d8a96', arma: ARCO, elemento: 'fisico', nodi: righe(
      [{ id: 'quadrello', nome: 'Quadrello', glifo: 'quadrello', effetto: 'quadrello', per: [2, 2.5, 3],
        fa: g => `${faDanno(n([2, 2.5, 3], g))}` }],
      [{ id: 'perforante', nome: 'Punta d\'acciaio', glifo: 'punta', sempre: true, rami: { piu: [30, 40, 50] },
        fa: g => `i quadrelli fanno il ${n([30, 40, 50], g)}% di danno in più` }],
      [{ id: 'tiro-perforante', nome: 'Tiro perforante', glifo: 'tiro-perforante', effetto: 'quadrello', passa: 0.5, per: [1.5, 1.8, 2.2],
        fa: g => `ignora metà della difesa e ${faDanno(n([1.5, 1.8, 2.2], g))}` },
       { id: 'mira-del-nano', nome: 'Mira del nano', glifo: 'mirino', sempre: true, primoTiro: [0, 20, 40],
        fa: g => `spari per primo in ogni scontro, prima di tutti${g > 1 ? ` · +${n([0, 20, 40], g)}% di danno` : ''}` }],
      [{ id: 'chiodi-roventi', nome: 'Chiodi roventi', glifo: 'chiodi', effetto: 'freccia-fuoco', veleno: [3, 4, 5], elemento: 'fuoco',
        fa: g => `${brucia(n([3, 4, 5], g))}` },
       { id: 'salva', nome: 'Salva di quadrelli', glifo: 'salva', effetto: 'pioggia', forma: 'vicini', per: [1.4, 1.8, 2.2],
        fa: g => `${faDanno(n([1.4, 1.8, 2.2], g))} ${AI_VICINI}` }],
      [{ id: 'polvere-da-mina', nome: 'Carica di polvere', glifo: 'bomba', effetto: 'esplode', per: [2, 2.5, 3], capi: [4, 5, 6], elemento: 'fuoco',
        fa: g => `${faDanno(n([2, 2.5, 3], g))}, ${controCapi(n([4, 5, 6], g))}` }],
    ) },
    { chiave: 'pietra', nome: 'Pietra', glifo: 'montagna', tinta: '#8a7f6a', car: 'forza', elemento: 'fisico', nodi: righe(
      [{ id: 'pelle-di-pietra', nome: 'Pelle di pietra', glifo: 'pietra', effetto: 'pietra', scudo: [2, 2.6, 3.2], difende: true,
        fa: (g, vm) => scudo(n([2, 2.6, 3.2], g), vm) }],
      [{ id: 'rune', nome: 'Rune di guarigione', glifo: 'runa', effetto: 'cura', cura: [2.4, 3.2, 4],
        fa: (g, vm) => cura(n([2.4, 3.2, 4], g), vm) }],
      [{ id: 'frana', nome: 'Frana', glifo: 'frana', effetto: 'massi', forma: 'vicini', per: [1.2, 1.5, 1.8],
        fa: g => `${faDanno(n([1.2, 1.5, 1.8], g))} ${AI_VICINI}` },
       { id: 'cuore-di-pietra', nome: 'Cuore di pietra', glifo: 'cuore-pietra', sempre: true, vitaPiu: [5, 10, 15],
        fa: g => `+${n([5, 10, 15], g)} di vita` }],
      [{ id: 'testa-dura', nome: 'Testa dura', glifo: 'elmo', sempre: true, testaDura: [1, 2, 3],
        fa: g => `${g === 1 ? 'il primo colpo' : `i primi ${n([1, 2, 3], g)} colpi`} che subisci fa${g === 1 ? '' : 'nno'} metà del danno, in ogni scontro` },
       { id: 'pugno-di-pietra', nome: 'Pugno di pietra', glifo: 'pugno', effetto: 'urto', per: [1.5, 1.8, 2],
        fa: g => `${faDanno(n([1.5, 1.8, 2], g))}` }],
      [{ id: 'montagna', nome: 'Montagna', glifo: 'montagna', effetto: 'pietra', intoccabile: [2, 3, 4],
        fa: g => `invulnerabile per ${turni(n([2, 3, 4], g))}` }],
    ) },
    // il fabbro: martello e fuoco, senz'arma (picchia con la forza)
    { chiave: 'fucina', nome: 'Fucina', glifo: 'incudine', tinta: '#e0952f', car: 'forza', elemento: 'fuoco', nodi: righe(
      [{ id: 'martello-caldo', nome: 'Martello caldo', glifo: 'martello-caldo', effetto: 'urto', per: [2, 2.5, 3],
        fa: g => `${faDanno(n([2, 2.5, 3], g))}, di fuoco` }],
      [{ id: 'fornace', nome: 'Fornace', glifo: 'fornace', sempre: true, rami: { piu: [25, 35, 45] },
        fa: g => `la fucina fa il ${n([25, 35, 45], g)}% di danno in più` }],
      [{ id: 'scintille-di-fucina', nome: 'Scintille di fucina', glifo: 'scintille-fucina', effetto: 'brace', forma: 'vicini', per: [1.2, 1.5, 1.8],
        fa: g => `${faDanno(n([1.2, 1.5, 1.8], g))} ${AI_VICINI}` },
       { id: 'ferro-rovente', nome: 'Ferro rovente', glifo: 'ferro-rovente', effetto: 'urto', per: [1.5, 1.5, 2], veleno: [3, 4, 4],
        fa: g => `${faDanno(n([1.5, 1.5, 2], g))}, ${brucia(n([3, 4, 4], g))}` }],
      [{ id: 'fiamma-della-fucina', nome: 'Fiamma della fucina', glifo: 'fiammata', effetto: 'fiammata', forma: 'tutti', per: [0.8, 1, 1.2],
        fa: g => `${faDanno(n([0.8, 1, 1.2], g))} a tutti i mostri in campo` },
       { id: 'grembiule', nome: 'Grembiule di cuoio', glifo: 'grembiule', sempre: true, graffioMeno: [1, 1, 2],
        fa: g => `ogni colpo che subisci fa ${n([1, 1, 2], g)} di danno in meno` }],
      [{ id: 'colata', nome: 'Colata incandescente', glifo: 'colata', effetto: 'meteora', per: [2, 2.5, 3], capi: [4, 5, 6],
        fa: g => `${faDanno(n([2, 2.5, 3], g))}, ${controCapi(n([4, 5, 6], g))}` }],
    ) },
  ],
}

// tutti i nodi, per id: l'id è la chiave del salvataggio (crescita.albero) e non si rinomina. `gradino` è la riga nel ramo,
// `dal` il livello a cui si apre; `elemento` è quello del nodo, o del ramo, o fisico
export const NODI = {}
for (const [classe, rami] of Object.entries(RAMI))
  rami.forEach(r => r.nodi.forEach(nodo => {
    if (!nodo.sempre) nodo.costo = costoAl({ ...nodo, classe })   // al primo grado; agli altri `costoAl(nodo, g)`
    NODI[nodo.id] = { ...nodo, classe, ramo: r.chiave, gradino: nodo.riga, dal: GRADINI[nodo.riga], arma: r.arma || null, car: r.car || null,
                      forma: nodo.forma || 'uno', elemento: nodo.elemento || r.elemento || 'fisico' }
  }))

// il valore di un campo del nodo al grado g (i campi a un numero valgono uguale a ogni grado)
export function aGrado(nodo, campo, g) {
  const v = nodo[campo]
  return Array.isArray(v) ? n(v, g) : v
}

// le forme del colpo (docs/sotterraneo/scontro.md): `uno` il bersaglio, `vicini` lui e i due accanto, `catena` lui e `salti`
// altri (ogni salto vale FATTORE_DEL_SALTO del precedente), `tutti` tutti i mostri in campo
export const FORME = ['uno', 'vicini', 'catena', 'tutti']
export const FATTORE_DEL_SALTO = 0.7

// Un'abilità prende il posto dell'attacco (l'utente, 9 ottobre): colpisce solo se è fatta per colpire. Scudi, cure,
// parate, il gelo e le difese in genere non fanno danno, e il mostro non muore per uno scudo
export const colpisce = nodo => !!(nodo && (nodo.per || nodo.veleno || nodo.rompe || nodo.passa || nodo.quieto || nodo.seStordito || nodo.sanguina))

// i nodi della riga sopra, nello stesso ramo: bisogna averne imparato uno per aprire questa riga (motore/abilita.js)
export function nodiSopra(nodo) {
  if (!nodo || !(nodo.gradino > 0)) return []
  const ramo = (RAMI[nodo.classe] || []).find(r => r.chiave === nodo.ramo)
  return ramo ? ramo.nodi.filter(x => x.riga === nodo.gradino - 1) : []
}

export function guastiDelleAbilita() {
  const g = []
  const minima = Math.min(...EROI.map(e => ENERGIA + (e.parte.intelligenza || 0) * ENERGIA_PER_INTELLIGENZA))
  if (minima !== ENERGIA_DI_PARTENZA_MINIMA) g.push(`l'energia di partenza più bassa è ${minima}, non ${ENERGIA_DI_PARTENZA_MINIMA}`)
  for (const e of EROI) {
    const l = e.lanci
    if (!Array.isArray(l) || l.length !== GRADINI.length || l.some((x, r) => !(x >= LANCI_DELL_ULTIMA) || (r && x > l[r - 1]) || (r === GRADINI.length - 1) !== (x === LANCI_DELL_ULTIMA)))
      g.push(`${e.chiave}: i lanci col globo pieno (${l}) vogliono una riga per gradino, mai di più salendo, e solo l'ultima una volta sola`)
    else {
      // il costo cresce con la riga, e l'ultima si lancia una volta col globo pieno: non più cara del globo che la classe ha lì
      const costi = GRADINI.map((_, r) => costoDelGradino(e.chiave, r))
      costi.forEach((c, r) => { if (r && c < costi[r - 1]) g.push(`${e.chiave}: la riga ${r} costa ${c}, meno della riga sopra (${costi[r - 1]})`) })
      if (!(costi[costi.length - 1] > costi[costi.length - 2])) g.push(`${e.chiave}: l'ultima riga non costa più delle altre`)
      if (costi[costi.length - 1] > globoAtteso(e.chiave, GRADINI[GRADINI.length - 1])) g.push(`${e.chiave}: l'ultima riga non sta nel globo pieno`)
    }
  }
  const visti = new Set()
  for (const [classe, rami] of Object.entries(RAMI)) {
    if (rami.length !== 4) g.push(`${classe}: ${rami.length} rami invece di quattro`)
    for (const r of rami) {
      const chi = `${classe}/${r.chiave}`
      // cinque righe di uno o due nodi: uno solo in cima, perché al livello 2 c'è da toccare una cosa sola per ramo
      for (let i = 0; i < GRADINI.length; i++) {
        const quanti = r.nodi.filter(x => x.riga === i).length
        if (quanti < 1 || quanti > 2) g.push(`${chi}: la riga ${i} ha ${quanti} nodi, ne vuole uno o due`)
      }
      if (r.nodi.filter(x => x.riga === 0).length !== 1) g.push(`${chi}: la prima riga ha un nodo solo`)
      if (r.nodi.some(x => !(x.riga >= 0 && x.riga < GRADINI.length))) g.push(`${chi}: un nodo fuori dalle righe`)
      if (!r.nodi.some(x => !x.sempre)) g.push(`${chi}: nessuna abilità da usare`)
      // il primo gradino si usa nello scontro: il livello 2 deve dare qualcosa da toccare
      const primo = r.nodi.find(x => x.riga === 0)
      if (primo && primo.sempre) g.push(`${chi}: il primo nodo non si usa`)
      if (!r.glifo || !/^#[0-9a-f]{6}$/i.test(r.tinta || '')) g.push(`${chi}: senza icona o senza colore`)
      if (r.elemento && !CHIAVI_ELEMENTI.includes(r.elemento)) g.push(`${chi}: l'elemento "${r.elemento}" non esiste`)
      for (const x of r.nodi) {
        if (visti.has(x.id)) g.push(`due nodi con l'id "${x.id}"`)
        visti.add(x.id)
        if (!x.nome || !x.glifo || typeof x.fa !== 'function') g.push(`${x.id}: senza nome, icona o riga`)
        if (!FORME.includes(x.forma || 'uno')) g.push(`${x.id}: la forma "${x.forma}" non esiste`)
        if (x.forma === 'catena' && !((Array.isArray(x.salti) ? x.salti[0] : x.salti) > 0)) g.push(`${x.id}: una catena senza salti`)
        if (x.elemento && !CHIAVI_ELEMENTI.includes(x.elemento)) g.push(`${x.id}: l'elemento "${x.elemento}" non esiste`)
        if (!x.sempre && !(x.costo > 0)) g.push(`${x.id}: un'abilità senza costo`)
        if (!x.sempre && x.costo !== costoAl({ ...x, classe })) g.push(`${x.id}: costa ${x.costo}, la sua riga costa ${costoAl({ ...x, classe })}`)
        if (!x.sempre && x.riga === 0 && x.costo >= ENERGIA_DI_PARTENZA_MINIMA) g.push(`${x.id}: il primo gradino costa quanto l'energia di chi ne ha meno`)
        for (let gr = 1; gr <= GRADI; gr++) if (!x.fa(gr)) g.push(`${x.id}: al grado ${gr} non dice cosa fa`)
      }
    }
    // difendersi al livello 2 senza armi, curarsi entro il 4 (la regola qui sopra RAMI)
    const tutti = rami.flatMap(r => r.nodi.map(x => ({ ...x, dal: GRADINI[x.riga], arma: r.arma })))
    if (!tutti.some(x => x.difende && x.dal === GRADINI[0] && !x.arma)) g.push(`${classe}: niente per difendersi al livello ${GRADINI[0]} senz'armi`)
    if (!tutti.some(x => x.cura && x.dal <= GRADINI[1])) g.push(`${classe}: niente per curarsi entro il livello ${GRADINI[1]}`)
  }
  return g
}
