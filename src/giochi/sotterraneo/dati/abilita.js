// L'albero delle abilità (docs/sotterraneo/abilita.md): tre rami per classe, quattro gradini per ramo, e
// l'energia che le paga. Dato puro: le regole che lo leggono stanno in motore/abilita.js (i punti, le caselle)
// e in motore/corsa.js (cosa succede nello scontro). Un numero per grado: [primo, secondo, terzo].
//
// Il vocabolario degli effetti, uguale per tutti i rami (un effetto nuovo si aggiunge in motore/corsa.js):
//   attive, quando la risposta è giusta:
//     per        il colpo vale tante volte il solito          passa     la difesa del mostro non conta
//     quieto     il mostro non risponde a questo scambio      rompe     il mostro perde la difesa per tutto lo scontro
//     veleno     scambi: ogni scambio gli toglie metà colpo   debole    scambi: il mostro colpisce a metà
//     fermo      scambi: il mostro non colpisce, neanche se sbagli
//     parato     scambi: rispondendo bene nessun graffio      scudo     assorbe tanta vita (in quarti della vita massima)
//     intoccabile scambi: nessun danno, neanche sbagliando    specchio  il prossimo colpo preso torna al mostro, per tanto
//     cura       quarti della vita massima                    linfa     scambi: cura un decimo della vita a scambio
//     stanza     colpisce anche gli altri mostri svegli della stanza, e porta loro gli stessi effetti
//     difende    non fa niente da sé: segna l'abilità di difesa del livello 2 (la regola di guastiDelleAbilita)
//     seStordito il colpo vale `per` solo su un mostro avvelenato, gelato o fermo, se no `altrimenti`
//   sempre (nodi senza costo, valgono da soli):
//     colpoPiu (con l'arma del ramo), graffioMeno (con lo scudo in mano), vitaPiu, schivata, energiaPiu,
//     energiaPerMostro, primoTiro (con l'arco: la prima risposta di uno scontro colpisce da lontano), testaDura
//     (i primi colpi pieni di uno scontro fanno metà), fiato (una volta per discesa non si sviene), rami
//     (`passa` e `piu` per le attive dello stesso ramo), geloPiu (percentuale: i mostri gelati prendono di più)

import { EROI } from './eroi.js'

// l'energia: si riempie rispondendo giusto (porte, forzieri, fonti, mostri), alla fonte e con la pozione blu; mai col
// tempo, perché sotto una domanda l'orologio è fermo (come la torcia, che si conta a stanze: docs/sotterraneo/roba.md).
// Il massimo è ENERGIA più l'intelligenza (motore/corredo.js): il mago parte da dieci, il cavaliere e il nano da sei
export const ENERGIA = 5
export const ENERGIA_DI_PARTENZA_MINIMA = 6
export const ENERGIA_PER_RISPOSTA = 1
// quante abilità si portano nello scontro: tre stanno sopra le risposte anche a 320 px
export const CASELLE_ABILITA = 3
// un punto abilità per livello dal 2: al 12, dove finisce la storia, undici punti per una dozzina di nodi
export const PUNTI_ABILITA_PER_LIVELLO = 1
// i gradini del ramo si aprono a questi livelli; ogni grado in più di un nodo vuole due livelli sopra il suo gradino.
// I gradi non hanno tetto (l'utente, 9 ottobre: al livello 50 c'è ancora qualcosa da fare con le abilità): i primi
// GRADI sono scritti nel nodo, oltre si cresce a metà del passo dell'ultimo (`n` qui sotto)
export const GRADINI = [2, 4, 8, 12]
export const LIVELLI_PER_GRADO = 2
export const GRADI = 3

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
const aTutti = v => (v === 1 ? 'colpisce tutti i mostri della stanza' : `fa ${danno(v)} a tutti i mostri della stanza`)
// le cure e gli scudi si contano in quarti della vita massima (motore/corsa.js, usaAbilita): con la vita dell'eroe
// (`vm`, la pagina la passa) la riga dice il numero vero, «ti guarisce di 12 punti di vita»; senza, la parte della vita
export const inVita = (v, vm) => Math.max(1, Math.round(Math.round(vm / 4) * v))
const cura = (v, vm) => (vm ? `ti guarisce di ${inVita(v, vm)} punti di vita` : `ti guarisce di un quarto della vita${v > 1 ? ` e oltre (×${String(v).replace('.', ',')})` : ''}`)
const scudo = (v, vm) => `una barriera ti protegge dai prossimi ${vm ? `${inVita(v, vm)} danni` : 'danni (un quarto della vita)'}, finché dura lo scontro`

// La regola dell'utente (9 ottobre): ogni classe ha un modo di difendersi al livello 2, in un ramo che non vuole armi,
// e uno di curarsi entro il livello 4 (guastiDelleAbilita lo controlla)
export const RAMI = {
  cavaliere: [
    { chiave: 'lama', nome: 'Lama', glifo: 'spada', tinta: '#8fa6c8', arma: LAMA, nodi: [
      { id: 'fendente', nome: 'Fendente', glifo: 'fendente', costo: 3, per: [2, 2.5, 3],
        fa: g => `${faDanno(n([2, 2.5, 3], g))}` },
      { id: 'filo', nome: 'Filo affilato', glifo: 'filo', sempre: true, colpoPiu: [1, 2, 3],
        fa: g => `+${n([1, 2, 3], g)} di danno a ogni colpo` },
      { id: 'affondo', nome: 'Affondo', glifo: 'affondo', costo: 4, rompe: true, per: [1.5, 2, 2.5],
        fa: g => `spezza la difesa del mostro per tutto lo scontro e ${faDanno(n([1.5, 2, 2.5], g))}` },
      { id: 'turbine', nome: 'Turbine', glifo: 'turbine', costo: 6, stanza: true, per: [1, 1.5, 2],
        fa: g => `${aTutti(n([1, 1.5, 2], g))}` },
    ] },
    { chiave: 'scudo', nome: 'Scudo', glifo: 'scudo', tinta: '#c99a3a', arma: SCUDO, nodi: [
      { id: 'scudo-alzato', nome: 'Scudo alzato', glifo: 'scudo', costo: 3, parato: [2, 3, 4], difende: true,
        fa: g => `protezione dai danni per ${turni(n([2, 3, 4], g))}, se rispondi bene` },
      { id: 'parata', nome: 'Parata', glifo: 'parata', sempre: true, graffioMeno: [1, 2, 3],
        fa: g => `ogni graffio che subisci fa ${n([1, 2, 3], g)} di danno in meno` },
      { id: 'colpo-di-scudo', nome: 'Colpo di scudo', glifo: 'colpo-di-scudo', costo: 4, fermo: [1, 2, 2], per: [1, 1, 1.5],
        fa: g => `il mostro resta stordito per ${turni(n([1, 2, 2], g))}: non può attaccare` },
      { id: 'muro', nome: 'Muro', glifo: 'muro', costo: 6, debole: [4, 6, 8],
        fa: g => `protezione che dimezza i danni per ${turni(n([4, 6, 8], g))}, anche se sbagli` },
    ] },
    { chiave: 'giuramento', nome: 'Giuramento', glifo: 'cuore', tinta: '#c0393b', nodi: [
      { id: 'preghiera', nome: 'Preghiera', glifo: 'preghiera', costo: 3, cura: [1, 1.4, 1.8], difende: true,
        fa: (g, vm) => cura(n([1, 1.4, 1.8], g), vm) },
      { id: 'cuore-saldo', nome: 'Cuore saldo', glifo: 'cuore', sempre: true, vitaPiu: [5, 10, 15],
        fa: g => `+${n([5, 10, 15], g)} di vita` },
      { id: 'grido', nome: 'Grido di guerra', glifo: 'corno', costo: 4, stanza: true, debole: [3, 4, 5], per: [1, 1, 1],
        fa: g => `tutti i mostri della stanza fanno metà del danno per ${turni(n([3, 4, 5], g))}` },
      { id: 'ultimo-fiato', nome: 'Ultimo fiato', glifo: 'ala', sempre: true, fiato: [1, 1, 1], vitaPiu: [0, 5, 10],
        fa: g => `una volta per discesa, invece di svenire resti in piedi${g > 1 ? ` · +${n([0, 5, 10], g)} di vita` : ''}` },
    ] },
  ],

  elfa: [
    { chiave: 'arco', nome: 'Arco', glifo: 'arco', tinta: '#4f9a5a', arma: ARCO, nodi: [
      { id: 'dardo-avvelenato', nome: 'Dardo avvelenato', glifo: 'freccia-veleno', costo: 3, veleno: [3, 4, 5],
        fa: g => `il veleno fa metà del tuo danno a ogni turno, per ${turni(n([3, 4, 5], g))}` },
      { id: 'primo-tiro', nome: 'Primo tiro', glifo: 'mira', sempre: true, primoTiro: [0, 2, 4],
        fa: g => `la prima risposta giusta di uno scontro colpisce da lontano: il mostro non risponde${g > 1 ? ` · +${n([0, 2, 4], g)} di danno` : ''}` },
      { id: 'freccia-mirata', nome: 'Freccia mirata', glifo: 'freccia', costo: 4, per: [2, 2.5, 3], quieto: true,
        fa: g => `${faDanno(n([2, 2.5, 3], g))}, e il mostro non risponde` },
      { id: 'pioggia', nome: 'Pioggia di frecce', glifo: 'pioggia', costo: 6, stanza: true, per: [1, 1.5, 2],
        fa: g => `${aTutti(n([1, 1.5, 2], g))}` },
    ] },
    { chiave: 'lame', nome: 'Lame', glifo: 'pugnale', tinta: '#8a78c8', arma: SPADA, nodi: [
      { id: 'stoccata', nome: 'Stoccata', glifo: 'pugnale', costo: 3, passa: true, per: [1.5, 2, 2.5],
        fa: g => `ignora la difesa e ${faDanno(n([1.5, 2, 2.5], g))}` },
      { id: 'passo-leggero', nome: 'Passo leggero', glifo: 'vento', sempre: true, schivata: [8, 16, 24],
        fa: g => `${n([8, 16, 24], g)}% di probabilità di schivare un graffio` },
      { id: 'danza', nome: 'Danza delle lame', glifo: 'danza', costo: 4, parato: [2, 3, 4], per: [1.5, 1.5, 2],
        fa: g => `${faDanno(n([1.5, 1.5, 2], g))} e ti protegge dai graffi per ${turni(n([2, 3, 4], g))}` },
      { id: 'alle-spalle', nome: 'Alle spalle', glifo: 'luna', costo: 6, seStordito: true, per: [3, 3.5, 4], altrimenti: 1.5,
        fa: g => `fa ${danno(n([3, 3.5, 4], g))} su un mostro avvelenato, gelato o stordito, se no ${danno(1.5)}` },
    ] },
    { chiave: 'bosco', nome: 'Bosco', glifo: 'foglia', tinta: '#6d8f2e', nodi: [
      { id: 'rovi', nome: 'Rovi', glifo: 'rovi', costo: 3, debole: [3, 4, 5], difende: true,
        fa: g => `il mostro fa metà del danno per ${turni(n([3, 4, 5], g))}` },
      { id: 'linfa', nome: 'Linfa', glifo: 'germoglio', costo: 3, linfa: [4, 5, 6], cura: [0.4, 0.6, 0.8],
        fa: (g, vm) => `${cura(n([0.4, 0.6, 0.8], g), vm)}, poi ${vm ? `${Math.max(1, Math.round(vm / 10))} punti` : 'un po\''} a ogni turno per ${turni(n([4, 5, 6], g))}` },
      { id: 'respiro', nome: 'Respiro del bosco', glifo: 'foglia', sempre: true, energiaPerMostro: [1, 2, 3],
        fa: g => `+${n([1, 2, 3], g)} di energia a ogni mostro battuto` },
      { id: 'radici', nome: 'Radici', glifo: 'radici', costo: 6, stanza: true, fermo: [2, 2, 3], per: [1, 1.5, 1.5],
        fa: g => `tutti i mostri della stanza restano fermi per ${turni(n([2, 2, 3], g))}: non possono attaccare` },
    ] },
  ],

  // il mago ha una famiglia d'arma sola: i suoi rami sono elementi, e due su tre vogliono la bacchetta
  mago: [
    { chiave: 'fuoco', nome: 'Fuoco', glifo: 'fiamma', tinta: '#d9632a', arma: BACCHETTA, nodi: [
      { id: 'dardo-di-fuoco', nome: 'Dardo di fuoco', glifo: 'fiamma', costo: 3, per: [2, 2.5, 3],
        fa: g => `${faDanno(n([2, 2.5, 3], g))}` },
      { id: 'fiamma-viva', nome: 'Fiamma viva', glifo: 'candela', sempre: true, rami: { passa: true, piu: [0, 1, 2] },
        fa: g => `il fuoco ignora la difesa${g > 1 ? ` · +${n([0, 1, 2], g)} di danno` : ''}` },
      { id: 'brucia', nome: 'Brucia', glifo: 'brace', costo: 4, veleno: [3, 4, 5],
        fa: g => `il mostro arde: metà del tuo danno a ogni turno, per ${turni(n([3, 4, 5], g))}` },
      { id: 'palla-di-fuoco', nome: 'Palla di fuoco', glifo: 'meteora', costo: 6, stanza: true, per: [1.5, 2, 2.5],
        fa: g => `${aTutti(n([1.5, 2, 2.5], g))}` },
    ] },
    { chiave: 'gelo', nome: 'Gelo', glifo: 'fiocco', tinta: '#4aa3d8', arma: BACCHETTA, nodi: [
      { id: 'raggio-di-gelo', nome: 'Raggio di gelo', glifo: 'fiocco', costo: 3, debole: [2, 3, 4],
        fa: g => `il mostro gela: fa metà del danno per ${turni(n([2, 3, 4], g))}` },
      { id: 'gelo-profondo', nome: 'Gelo profondo', glifo: 'cristallo', sempre: true, geloPiu: [20, 35, 50],
        fa: g => `chi è gelato subisce il ${n([20, 35, 50], g)}% di danno in più a ogni colpo` },
      { id: 'lancia-di-ghiaccio', nome: 'Lancia di ghiaccio', glifo: 'lancia', costo: 4, seStordito: true, per: [3, 3.5, 4], altrimenti: 1.5,
        fa: g => `fa ${danno(n([3, 3.5, 4], g))} su un mostro gelato, in fiamme o stordito, se no ${danno(1.5)}` },
      { id: 'tempesta', nome: 'Tempesta di neve', glifo: 'tempesta', costo: 6, stanza: true, debole: [3, 4, 5], per: [1, 1, 1.5],
        fa: g => `fa danno a tutti i mostri della stanza e li gela per ${turni(n([3, 4, 5], g))}` },
    ] },
    { chiave: 'arcano', nome: 'Arcano', glifo: 'sfera', tinta: '#9b4fd0', nodi: [
      { id: 'scudo-arcano', nome: 'Scudo arcano', glifo: 'sfera', costo: 3, scudo: [1, 1.4, 1.8], difende: true,
        fa: (g, vm) => scudo(n([1, 1.4, 1.8], g), vm) },
      { id: 'fonte-arcana', nome: 'Fonte arcana', glifo: 'calice', costo: 4, cura: [1, 1.4, 1.8],
        fa: (g, vm) => cura(n([1, 1.4, 1.8], g), vm) },
      { id: 'fulmine', nome: 'Fulmine', glifo: 'fulmine', costo: 4, passa: true, per: [2.5, 3, 3.5],
        fa: g => `ignora la difesa e ${faDanno(n([2.5, 3, 3.5], g))}` },
      { id: 'specchio', nome: 'Specchio', glifo: 'specchio', costo: 6, specchio: [1, 1.5, 2],
        fa: g => `il prossimo colpo che subisci si ritorce contro il mostro${g > 1 ? `, ${volte(n([1, 1.5, 2], g))}` : ''}` },
    ] },
  ],

  nano: [
    { chiave: 'ascia', nome: 'Ascia', glifo: 'ascia', tinta: '#b8743a', arma: ASCIA, nodi: [
      { id: 'spaccaroccia', nome: 'Spaccaroccia', glifo: 'roccia', costo: 3, rompe: true, per: [1.5, 2, 2.5],
        fa: g => `spezza la difesa del mostro per tutto lo scontro e ${faDanno(n([1.5, 2, 2.5], g))}` },
      { id: 'mani-pesanti', nome: 'Mani pesanti', glifo: 'martello', sempre: true, colpoPiu: [1, 2, 3],
        fa: g => `+${n([1, 2, 3], g)} di danno a ogni colpo` },
      { id: 'stordisce', nome: 'Martellata', glifo: 'stelle', costo: 4, fermo: [1, 2, 2], per: [1.5, 1.5, 2],
        fa: g => `${faDanno(n([1.5, 1.5, 2], g))} e stordisce il mostro per ${turni(n([1, 2, 2], g))}: non può attaccare` },
      { id: 'terremoto', nome: 'Terremoto', glifo: 'terremoto', costo: 6, stanza: true, fermo: [1, 1, 2], per: [1, 1.5, 1.5],
        fa: g => `${aTutti(n([1, 1.5, 1.5], g))} e li stordisce per ${turni(n([1, 1, 2], g))}` },
    ] },
    { chiave: 'balestra', nome: 'Balestra', glifo: 'quadrello', tinta: '#7d8a96', arma: ARCO, nodi: [
      { id: 'quadrello', nome: 'Quadrello', glifo: 'quadrello', costo: 3, per: [2, 2.5, 3],
        fa: g => `${faDanno(n([2, 2.5, 3], g))}` },
      { id: 'perforante', nome: 'Punta d\'acciaio', glifo: 'punta', sempre: true, rami: { passa: true, piu: [0, 1, 2] },
        fa: g => `i quadrelli ignorano la difesa${g > 1 ? ` · +${n([0, 1, 2], g)} di danno` : ''}` },
      { id: 'chiodi-roventi', nome: 'Chiodi roventi', glifo: 'chiodi', costo: 4, veleno: [3, 4, 5],
        fa: g => `il mostro arde: metà del tuo danno a ogni turno, per ${turni(n([3, 4, 5], g))}` },
      { id: 'polvere-da-mina', nome: 'Polvere da mina', glifo: 'bomba', costo: 6, stanza: true, per: [1.5, 2, 2.5],
        fa: g => `${aTutti(n([1.5, 2, 2.5], g))}` },
    ] },
    { chiave: 'pietra', nome: 'Pietra', glifo: 'montagna', tinta: '#8a7f6a', nodi: [
      { id: 'pelle-di-pietra', nome: 'Pelle di pietra', glifo: 'pietra', costo: 3, scudo: [1, 1.4, 1.8], difende: true,
        fa: (g, vm) => scudo(n([1, 1.4, 1.8], g), vm) },
      { id: 'rune', nome: 'Rune di guarigione', glifo: 'runa', costo: 4, cura: [1.2, 1.6, 2],
        fa: (g, vm) => cura(n([1.2, 1.6, 2], g), vm) },
      { id: 'testa-dura', nome: 'Testa dura', glifo: 'elmo', sempre: true, testaDura: [1, 2, 3],
        fa: g => `${g === 1 ? 'il primo colpo' : `i primi ${n([1, 2, 3], g)} colpi`} che subisci sbagliando fa${g === 1 ? '' : 'nno'} metà del danno, in ogni scontro` },
      { id: 'montagna', nome: 'Montagna', glifo: 'montagna', costo: 6, intoccabile: [2, 3, 4],
        fa: g => `invulnerabile per ${turni(n([2, 3, 4], g))}, anche se sbagli` },
    ] },
  ],
}

// tutti i nodi, per id: l'id è la chiave del salvataggio (crescita.albero) e non si rinomina
export const NODI = {}
for (const [classe, rami] of Object.entries(RAMI))
  rami.forEach(r => r.nodi.forEach((nodo, i) => {
    NODI[nodo.id] = { ...nodo, classe, ramo: r.chiave, gradino: i, dal: GRADINI[i], arma: r.arma || null }
  }))

// il valore di un campo del nodo al grado g (i campi a un numero valgono uguale a ogni grado)
export function aGrado(nodo, campo, g) {
  const v = nodo[campo]
  return Array.isArray(v) ? n(v, g) : v
}

export function guastiDelleAbilita() {
  const g = []
  const minima = Math.min(...EROI.map(e => ENERGIA + (e.parte.intelligenza || 0)))
  if (minima !== ENERGIA_DI_PARTENZA_MINIMA) g.push(`l'energia di partenza più bassa è ${minima}, non ${ENERGIA_DI_PARTENZA_MINIMA}`)
  const visti = new Set()
  for (const [classe, rami] of Object.entries(RAMI)) {
    if (rami.length !== 3) g.push(`${classe}: ${rami.length} rami invece di tre`)
    for (const r of rami) {
      if (r.nodi.length !== GRADINI.length) g.push(`${classe}/${r.chiave}: ${r.nodi.length} nodi invece di ${GRADINI.length}`)
      if (!r.nodi.some(x => !x.sempre)) g.push(`${classe}/${r.chiave}: nessuna abilità da usare`)
      // il primo gradino si usa nello scontro: il livello 2 deve dare qualcosa da toccare
      if (r.nodi[0] && r.nodi[0].sempre) g.push(`${classe}/${r.chiave}: il primo nodo non si usa`)
      if (!r.glifo || !/^#[0-9a-f]{6}$/i.test(r.tinta || '')) g.push(`${classe}/${r.chiave}: senza icona o senza colore`)
      for (const x of r.nodi) {
        if (visti.has(x.id)) g.push(`due nodi con l'id "${x.id}"`)
        visti.add(x.id)
        if (!x.nome || !x.glifo || typeof x.fa !== 'function') g.push(`${x.id}: senza nome, icona o riga`)
        if (!x.sempre && !(x.costo > 0)) g.push(`${x.id}: un'abilità senza costo`)
        if (!x.sempre && x.costo > ENERGIA_DI_PARTENZA_MINIMA) g.push(`${x.id}: costa più dell'energia di chi ne ha meno`)
        for (let gr = 1; gr <= GRADI; gr++) if (!x.fa(gr)) g.push(`${x.id}: al grado ${gr} non dice cosa fa`)
      }
    }
    // difendersi al livello 2 senza armi, curarsi entro il 4 (la regola qui sopra RAMI)
    const tutti = rami.flatMap(r => r.nodi.map((x, i) => ({ ...x, dal: GRADINI[i], arma: r.arma })))
    if (!tutti.some(x => x.difende && x.dal === GRADINI[0] && !x.arma)) g.push(`${classe}: niente per difendersi al livello ${GRADINI[0]} senz'armi`)
    if (!tutti.some(x => x.cura && x.dal <= GRADINI[1])) g.push(`${classe}: niente per curarsi entro il livello ${GRADINI[1]}`)
  }
  return g
}
