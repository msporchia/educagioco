// Le misure del sotterraneo col metro del curioso (docs/sotterraneo/giocatori-tipo.md, «Il metro è il curioso»): ogni discesa si gioca
// dall'ingresso che la storia del curioso gli ha dato (roba, livello, pozioni), per venti storie; qui si cambia solo quante risposte
// sono giuste, o una cosa sola dell'ingresso (il livello, la roba, le gemme). Un compito di test/aiuto/parallelo.mjs: gira in un processo
// suo e torna un JSON; la fila degli ingressi di una storia si gioca una volta sola per processo.
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { sogliaDi, livelloDi, quotaDi } from '../../src/giochi/sotterraneo/dati/livelli.js'
import { zonaPotenziata } from '../../src/giochi/sotterraneo/dati/zone.js'
import { coloreDellaFascia } from '../../src/giochi/sotterraneo/motore/zone.js'
import { forzaDi } from '../../src/giochi/sotterraneo/motore/forza.js'
import { CRESCITA_NUOVA, puntiDaDare, prossimoPunto } from '../../src/giochi/sotterraneo/motore/crescita.js'
import { puntiAbilita, prossimoDellaStrada } from '../../src/giochi/sotterraneo/motore/abilita.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { robaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { allaBottega } from '../../src/giochi/sotterraneo/motore/banco.js'
import { giocaDalCurioso, ingressoDelCurioso, storiaDi } from '../../src/giochi/sotterraneo/motore/storie.js'

const K = CAMPAGNA.length
const vuota = () => CAMPAGNA.map(() => 0)

/* Per un eroe, `semi` storie (1..semi). Torna, per ogni prova, per bravura e per discesa, quante volte si arriva in fondo (`quali` dice a
   quali bravure: servono solo quelle che il test controlla, ognuna è una partita per storia e per discesa):
   - `curioso`: la roba e il livello con cui il curioso ci arriva;
   - `prima`, `avanti`: la roba di una discesa prima / di due dopo (la sua storia), il livello di adesso;
   - `L-2`, `L+3`: la sua roba, due livelli sotto / tre sopra (la crescita rifatta a quel livello, i punti da dare);
   - `nuda`: niente roba (la riga 0 della tabella) con il suo livello: solo per la scalinata, a `prove[0]`;
   - `gemme100`, `gemme250`: arriva con quelle gemme in più e compra il meglio che può;
   - `uscita`: le gemme con cui esce dalla cripta e dalla scalinata, prima di spendere (media): bastano alla prima arma. */
export function misuraDelCurioso({ eroe, semi = 20, prove = [0.9, 0.6, 0.4] } = {}) {
  const conLivello = piu => ing => {
    const liv = Math.max(1, livelloDi(ing.crescita.esp) + piu)
    return { ...ing, crescita: { ...CRESCITA_NUOVA(), esp: sogliaDi(liv), tasche: ing.crescita.tasche, elisir: ing.crescita.elisir } }
  }
  const conGemme = (gemme, k, s) => ing => ({ ...ing, roba: allaBottega({ ...ing.roba, gemme: ing.roba.gemme + gemme }, { finite: k, eroe, seme: s * 101 + k, crescita: ing.crescita }) })
  const dalla = (k, s) => ingressoDelCurioso(k, { eroe, seme: s }).roba
  // chiave → [quali bravure (indici di `prove`), come si ritocca l'ingresso]
  const modi = {
    curioso: [[0, 1, 2], () => null],
    prima: [[0, 1], (k, s) => ing => ({ ...ing, roba: dalla(Math.max(0, k - 1), s) })],
    avanti: [[2], (k, s) => ing => ({ ...ing, roba: dalla(Math.min(K - 1, k + 2), s) })],
    'L-2': [[0, 1], () => conLivello(-2)],
    'L+3': [[2], () => conLivello(3)],
    gemme100: [[1, 2], (k, s) => conGemme(100, k, s)],
    gemme250: [[1, 2], (k, s) => conGemme(250, k, s)],
  }
  const vinte = {}, quali = {}
  for (const [chiave, [js]] of Object.entries(modi)) { vinte[chiave] = prove.map(vuota); quali[chiave] = js }
  vinte.nuda = prove.map(vuota)
  for (let k = 0; k < K; k++)
    for (let s = 1; s <= semi; s++) {
      for (const [chiave, [js, ritocco]] of Object.entries(modi))
        for (const j of js)
          if (giocaDalCurioso(k, { eroe, seme: s, bravura: prove[j], ritocca: ritocco(k, s) }).esito.vinta) vinte[chiave][j][k]++
      if (k === 1 && giocaDalCurioso(k, { eroe, seme: s, bravura: prove[0], ritocca: ing => ({ ...ing, roba: robaAttesa(eroe, 0) }) }).esito.vinta) vinte.nuda[0][k]++
    }
  // le gemme che ha in tasca arrivando alla bottega della scalinata e della discesa dopo, prima di spendere
  const uscita = [0, 0]
  for (let s = 1; s <= semi; s++) {
    const passi = storiaDi({ tipo: 'curioso', eroe, seme: s, fino: 2 })
    uscita[0] += passi[1].prima.gemme / semi
    uscita[1] += passi[2].prima.gemme / semi
  }
  return { vinte, quali, semi, prove, uscita }
}

/* Chi va dritto (il bravo, 19 su 20): la sua storia di fila, una per seme. Per discesa: quante storie la vincono alla prima e in
   quante la prima e la seconda volta sono perse (un muro: giocatori-tipo.md). */
export function misuraDelBravo({ eroe, semi = 20 } = {}) {
  const alla = vuota(), muri = vuota()
  for (let s = 1; s <= semi; s++)
    storiaDi({ tipo: 'bravo', eroe, seme: s, fino: K - 1 }).forEach((p, k) => {
      const t = p.tentativi
      if (t[0] && t[0].v) alla[k]++
      if (t[1] && !t[0].v && !t[1].v) muri[k]++
    })
  return { alla, muri, semi }
}

/* Le zone (docs/sotterraneo/zone.md) col curioso: ogni discesa fatta zona con la fascia che comincia a `livello`, giocata da lui con la roba e le
   pozioni dell'ingresso dell'ultima discesa della storia (la sua più vicina), il livello rifatto a `eroeA` (i punti da dare) e la spesa fatta con le
   gemme che ha (`allaBottega`, come fra una discesa e l'altra). `configurazioni`: [[livello, eroeA], …]. Per ognuna torna, per bravura e per discesa,
   le vittorie su `semi` storie; le domande e i livelli presi (alla prima bravura); e la forza di ingresso (motore/forza.js, quella da cui il gioco
   legge il colore del pallino) con i colori che ne vengono (`coloreDellaFascia`), quante storie per colore */
// i punti da dare e quelli dell'albero, dati come li dà il banco a ogni discesa (banco.js, daiIPunti): la forza (e il colore del pallino) si legge da un
// eroe che ha speso i suoi punti, non da uno che li ha ancora in tasca
function conIPuntiDati(tappa, eroe, roba, crescita) {
  const corsa = new Corsa(tappa, { seme: 1, rnd: seminato(1), eroe, roba, crescita })
  while (puntiDaDare(corsa.crescita) > 0) corsa.daiUnPunto(prossimoPunto(corsa.crescita, corsa.chiEro, null))
  while (puntiAbilita(corsa.crescita) > 0) {
    const id = prossimoDellaStrada(corsa.crescita, corsa.chiEro, null)
    if (!id || !corsa.impara(id)) break
  }
  return corsa.crescita
}

export function misuraLeZoneDelCurioso({ eroe, semi = 10, prove = [0.9, 0.6, 0.4], configurazioni } = {}) {
  const fuori = {}
  for (const [livello, eroeA] of configurazioni) {
    const vinte = prove.map(vuota), domande = vuota(), livelli = vuota()
    let forza = 0
    const colori = { grigio: 0, verde: 0, arancio: 0, rosso: 0 }
    for (let s = 1; s <= semi; s++) {
      const ultimo = ingressoDelCurioso(K - 1, { eroe, seme: s })
      const crescita0 = { ...CRESCITA_NUOVA(), esp: sogliaDi(eroeA), tasche: ultimo.crescita.tasche, elisir: ultimo.crescita.elisir }
      const roba0 = allaBottega(ultimo.roba, { finite: K, eroe, seme: s * 101 + K, crescita: crescita0 })
      const ing = { roba: roba0, crescita: conIPuntiDati(zonaPotenziata(0, livello), eroe, roba0, crescita0) }
      const ritocca = base => ({ ...base, roba: JSON.parse(JSON.stringify(ing.roba)), crescita: JSON.parse(JSON.stringify(ing.crescita)) })
      const f = forzaDi(eroe, ing.roba, ing.crescita)
      forza += f / semi
      colori[coloreDellaFascia(livello, f)]++
      for (let k = 0; k < K; k++)
        prove.forEach((bravura, j) => {
          const g = giocaDalCurioso(k, { eroe, seme: s, bravura, ritocca, tappa: zonaPotenziata(k, livello) })
          if (g.esito.vinta) vinte[j][k]++
          if (j === 0) {
            domande[k] += g.esito.domande / semi
            const q = quotaDi(g.corsa.crescita.esp)
            livelli[k] += (q.livello + q.quota - eroeA) / semi
          }
        })
    }
    fuori[`${livello},${eroeA}`] = { vinte, domande, livelli, forza, colori }
  }
  return { semi, prove, zone: fuori }
}
