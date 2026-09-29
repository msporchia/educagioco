// Il banco di prova: un bambino finto che scende nel dungeon. Non serve al
// gioco (il build lo scarta). Sceglie una strada, si equipaggia, risponde
// `bravura` volte su una, scappa quando serve — non gioca come un adulto,
// ma deve arrivare in fondo se una tappa è giusta. Le soglie stanno in
// dati/taratura.js (ATTESE), non qui.
import { STANZE } from '../dati/stanze.js'
import { TESORI, POZIONE, inCasella } from '../dati/tesori.js'
import { colpoDelMostro } from '../dati/eroe.js'
import { Corsa } from './corsa.js'

// il caso ripetibile: due prove uguali devono raccontare la stessa storia
export function caso(seme = 1) {
  let s = seme >>> 0 || 1
  return () => {
    s ^= s << 13; s >>>= 0
    s ^= s >>> 17
    s ^= s << 5; s >>>= 0
    return s / 4294967296
  }
}

const conciato = corsa => 1 - corsa.vita / Math.max(1, corsa.vitaMax)   // 0 intero, 1 in fin di vita

// chi sta bene caccia bottino, chi è ferito cerca il fuoco, chi è nudo cerca equipaggiamento
function scegliStrada(corsa, rnd) {
  const aperte = corsa.aperte()
  if (!aperte.length) return null
  const male = conciato(corsa)
  const ferito = male > 0.55
  const nudo = !corsa.mano || !corsa.addosso
  const votate = aperte.map(s => {
    const scheda = STANZE[s.tipo]
    let voto = scheda.ricchezza
    if (s.tipo === 'fuoco') voto = ferito ? 7 : 1.5
    if (s.tipo === 'negozio') voto = corsa.gemme >= TESORI.spadino.prezzo ? 4 : 1
    if (nudo && !ferito && scheda.grado >= 2) voto += 2.5   // la roba buona sta dietro i mostri grossi
    if (scheda.taglia && s.tipo !== 'scrigno') voto -= male * corsa.scambiPer(s) * 0.6   // conciato, costa di più
    return { s, voto: voto + rnd() * 0.5 }
  })
  return votate.reduce((a, b) => (b.voto > a.voto ? b : a)).s
}

// cosa si sceglie dentro una stanza senza domande
function scegliVoce(corsa, st, rnd) {
  const buone = st.voci.filter(v => !v.spento)
  const male = conciato(corsa)

  if (st.tipo === 'fuoco') {
    if (male > 0.4 || (st.primaDelCapo && male > 0.15)) return 'riposa'
    const roba = buone.find(v => v.chiave === 'roba')
    if (roba) return 'roba'
    return male > 0.2 ? 'allena:difesa' : 'allena:attacco'
  }

  if (st.tipo === 'negozio') {
    if (male > 0.45 && buone.some(v => v.chiave === 'pozione') && corsa.gemme >= POZIONE.prezzo)
      return 'pozione'
    // il pezzo più caro che ci si può permettere è anche il migliore: prezzo e grado salgono insieme
    const compra = buone.filter(v => v.chiave.startsWith('compra:'))
      .sort((a, b) => b.prezzo - a.prezzo)
    if (compra.length) return compra[0].chiave
    if (buone.some(v => v.chiave === 'pozione') && male > 0.2) return 'pozione'
    return 'via'
  }

  // le stranezze: azzardare quando si sta bene, sul sicuro quando si è conciati
  const prudente = buone.find(v => !v.azzardo) || buone[0]
  const rischiosa = buone.find(v => v.azzardo) || buone[0]
  if (male > 0.5) return prudente.chiave
  return (rnd() < 0.6 ? rischiosa : prudente).chiave
}

// `giri` è una rete di sicurezza: una corsa che non finisce è un guasto da segnalare
export function giocaCorsa(tappa, { rnd = Math.random, bravura = 1, mappa = null,
                                    tappeFatte = 0 } = {}) {
  const corsa = new Corsa(tappa, { rnd, mappa, tappeFatte })
  let giri = 0
  while (!corsa.finita && giri++ < 4000) {
    if (corsa.dove === 'mappa') {
      const dove = scegliStrada(corsa, rnd)
      if (!dove) break
      corsa.entra(dove)
      continue
    }
    const st = corsa.stanza
    if (!st) break
    if (st.che === 'sfida') {
      if (st.momento === 'domanda') corsa.rispondi(rnd() < bravura)
      else if (st.momento === 'colpito') {
        // si scappa quando il prossimo sbaglio può essere l'ultimo (due colpi di margine)
        const colpo = colpoDelMostro(st.mostro.attacco, corsa.difesa)
        if (corsa.vita <= colpo * 2 && st.scappabile) corsa.scappa()
        else corsa.continua()
      } else corsa.esci()
    } else {
      if (st.esito) corsa.esci()
      else if (!corsa.scegli(scegliVoce(corsa, st, rnd)) && corsa.stanza?.esito) corsa.esci()
    }
  }
  return { corsa, bloccata: giri >= 4000 }
}

// attaccoFine e difesaFine dicono se il potenziamento è arrivato: la promessa del gioco
export function misura(tappa, { volte = 60, bravura = 1, rnd = Math.random,
                                tappeFatte = 0 } = {}) {
  let vinte = 0, domande = 0, sbagliate = 0, stelle = 0, stanze = 0, bloccate = 0
  let tesori = 0, attacco = 0, difesa = 0, conArma = 0, conArmatura = 0
  for (let i = 0; i < volte; i++) {
    const { corsa, bloccata } = giocaCorsa(tappa, { rnd, bravura, tappeFatte })
    if (bloccata) bloccate++
    domande += corsa.domande
    sbagliate += corsa.sbagliate
    stanze += corsa.visitate
    tesori += corsa.tesori
    attacco += corsa.attacco
    difesa += corsa.difesa
    if (corsa.mano) conArma++
    if (corsa.addosso) conArmatura++
    if (corsa.vinta) { vinte++; stelle += corsa.stelle }
  }
  return {
    volte, vinte, bloccate,
    quota: vinte / volte,
    domandeMedie: domande / volte,
    sbagliateMedie: sbagliate / volte,
    stanzeMedie: stanze / volte,
    tesoriMedi: tesori / volte,
    attaccoFine: attacco / volte,
    difesaFine: difesa / volte,
    quotaArma: conArma / volte,
    quotaArmatura: conArmatura / volte,
    stelleMedie: vinte ? stelle / vinte : 0,
  }
}

// la domanda del gioco: chi gioca bene arriva al guardiano con roba migliore di chi tira dritto?
export function gradoInFondo(tappa, { volte = 40, bravura = 0.85, rnd = Math.random,
                                      tappeFatte = 0 } = {}) {
  let somma = 0, quante = 0
  for (let i = 0; i < volte; i++) {
    const { corsa } = giocaCorsa(tappa, { rnd, bravura, tappeFatte })
    const arma = inCasella(corsa.equipaggiamento, 'mano')
    const armatura = inCasella(corsa.equipaggiamento, 'addosso')
    somma += (arma?.grado || 0) + (armatura?.grado || 0)
    quante++
  }
  return quante ? somma / quante : 0
}
