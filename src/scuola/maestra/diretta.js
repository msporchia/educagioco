/* La lezione in corso: il collegamento della maestra (comune/rete.js) che scrive nel quaderno man mano. Uno solo per
   pagina; si rifà da `quaderno.inCorso` quando la pagina si riapre. Vedi docs/scuola/quaderno.md. */
import { reactive } from 'vue'
import { creaLezione, apriMaestra } from '../comune/rete.js'
import * as Q from './quaderno.js'
import { quaderno, salva, salvaPresto, voceDi } from './stato.js'

// `alunni`: l'ultimo elenco del servizio ({ id, nome, nuovo, preso, collegato, dove }); vuoto finché non arriva
export const diretta = reactive({ fase: null, linea: 'giu', alunni: [], errore: '', sentito: false })
let filo = null, sveglia = null

const viva = () => (quaderno.inCorso ? voceDi(quaderno.inCorso.voce) : null)

export async function avvia(lezione, classe) {
  const { codice, chiave, scade } = await creaLezione(lezione, classe.alunni.map(a => ({ id: a.id, nome: a.nome })))
  const ora = Date.now()
  const voce = Q.nuovaVoce({ classe, lezione, codice, chiave, scade, ora })
  quaderno.storico.push(voce)
  quaderno.inCorso = { codice, chiave, scade, avviata: ora, classe: classe.id, lezione: JSON.parse(JSON.stringify(lezione)), voce: voce.id }
  salva(['storico', 'inCorso'])
  collega()
  return voce
}

/* chiude qui: la voce resta nello storico (con la chiave fino alla scadenza, per «Recupera i risultati») */
function finisci(errore = '') {
  const v = viva()
  if (v) v.chiusa = true
  quaderno.inCorso = null
  salva(['storico', 'inCorso'])
  smettiDiAscoltare()
  diretta.errore = errore
}

function smettiDiAscoltare() {
  if (filo) filo.chiudi()
  if (sveglia) clearTimeout(sveglia)
  filo = null; sveglia = null
  Object.assign(diretta, { fase: null, linea: 'giu', alunni: [], sentito: false })
}

export function collega() {
  const c = quaderno.inCorso
  if (!c || filo) return
  diretta.errore = ''
  filo = apriMaestra(c.codice, c.chiave, {
    suTutto(d) {
      Object.assign(diretta, { fase: d.fase, alunni: d.alunni || [], sentito: true })
      Q.ricalcola(viva(), d)
      if (Number.isFinite(d.scade) && quaderno.inCorso) { quaderno.inCorso.scade = d.scade; salva(['inCorso']) }
      salvaPresto()
      if (d.fase === 'chiusa') finisci()
    },
    suAlunni(a) { diretta.alunni = a; Q.aggiornaAlunni(viva(), a); salvaPresto() },
    suRisposta(id, r) { Q.aggiungiRisposta(viva(), id, r); salvaPresto() },
    suFase(f) { diretta.fase = f; if (f === 'chiusa') finisci() },
    suLinea(l) { diretta.linea = l },
    // il servizio non la conosce più (scaduta) o non accetta la chiave: si chiude qui, coi risultati presi fin qui
    suRifiuto: perche => finisci(perche === 'chiave' ? 'Il servizio non riconosce più questa lezione: l\'ho chiusa qui.' : ''),
  })
  sveglia = setTimeout(() => finisci(), Math.max(0, c.scade - Date.now()))
}

/* all'apertura della pagina: le scadute si chiudono da sé, quella in corso si ricollega */
export function riprendi() {
  if (Q.pulisciScadute(quaderno, Date.now())) salva(['storico', 'inCorso'])
  if (quaderno.inCorso) collega()
}

// false: non c'è linea, il messaggio non è partito
export const via = () => !!filo?.via()
export const libera = id => !!filo?.libera(id)
export const togli = id => !!filo?.togli(id)

/* «Chiudi lezione»: col filo su la chiude il servizio (e i PC lo sanno); `soloQui` la chiude senza linea */
export function chiudiLezione({ soloQui = false } = {}) {
  if (soloQui) { finisci(); return true }
  return !!filo?.smetti()
}

/* «Recupera i risultati» di una lezione già chiusa qui: un collegamento solo per prendere `tutto`, poi si chiude */
export function recupera(voce, { attesa = 15000 } = {}) {
  return new Promise(risolvi => {
    if (!Q.recuperabile(voce, Date.now())) return risolvi('scaduta')
    let f = null, fatto = false
    const fine = esito => { if (fatto) return; fatto = true; clearTimeout(t); f?.chiudi(); risolvi(esito) }
    const t = setTimeout(() => fine('rete'), attesa)
    f = apriMaestra(voce.codice, voce.chiave, {
      suTutto(d) { Q.ricalcola(voceDi(voce.id), d); salva(['storico']); fine('ok') },
      suRifiuto: () => { const v = voceDi(voce.id); if (v) v.chiave = null; salva(['storico']); fine('scaduta') },
    })
    if (fatto) f.chiudi()
  })
}
