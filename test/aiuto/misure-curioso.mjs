// Le misure del sotterraneo col metro del curioso (docs/sotterraneo/giocatori-tipo.md, «Il metro è il curioso»): ogni discesa si gioca
// dall'ingresso che la storia del curioso gli ha dato (roba, livello, pozioni), per venti storie; qui si cambia solo quante risposte
// sono giuste, o una cosa sola dell'ingresso (il livello, la roba, le gemme). Un compito di test/aiuto/parallelo.mjs: gira in un processo
// suo e torna un JSON; la fila degli ingressi di una storia si gioca una volta sola per processo.
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { sogliaDi, livelloDi } from '../../src/giochi/sotterraneo/dati/livelli.js'
import { CRESCITA_NUOVA } from '../../src/giochi/sotterraneo/motore/crescita.js'
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
   - `uscita`: le gemme con cui esce dalla cripta, prima di spendere (media): bastano alla prima arma. */
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
  // le gemme con cui si esce dalla cripta = quelle che ha in tasca arrivando alla bottega della scalinata, prima di spendere
  let uscita = 0
  for (let s = 1; s <= semi; s++) uscita += storiaDi({ tipo: 'curioso', eroe, seme: s, fino: 1 })[1].prima.gemme / semi
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
