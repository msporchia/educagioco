/* Il prossimo passo: ogni "non si può" porta con sé cosa fare adesso, risalendo la catena da sola
   (comeAvere) finché non trova un passo possibile oggi. Torna { testo, azione } — azione è una delle
   quattro forme che Gioco.vue sa eseguire, o null se c'è solo da aspettare. Vedi docs/fattoria/regole.md
   e catena.md. Gira in Node, senza Vue né pixel. */
import { COLTURE, RICETTE, PRODOTTI, SILI, PROFONDITA } from '../dati/coltivazioni.js'
import { PER_ID, eCampo, macchinaDi } from '../dati/catalogo.js'
import { livelloDelProdotto, livelloDellaVoce } from '../dati/livelli.js'
import { megliaDi } from '../dati/mercato.js'
import { carrettoIn, DAI } from './vicino.js'

// Quanto in là si risale prima di arrendersi: PROFONDITA di dati/coltivazioni.js.
const GIRI = PROFONDITA

// La merce si chiama per nome (non l'emoji, che spesso non somiglia al disegno vero).
const merce = id => roba(id).nome.toLowerCase()

// Solo le ricette che il livello ha già aperto: consigliarne una chiusa manda a cercare un tasto che non c'è.
const leRicette = f => RICETTE.filter(r => (r.liv || 1) <= f.livello)
// Gli articoli (nel/nell'/nello/nella): il genere si dichiara (la su catalogo.js), il resto si ricava dal nome.
const vocale = n => /^[aeiou]/i.test(n)
// La esse impura e compagnia: davanti a queste l'articolo è "lo".
const impura = n => /^(s[^aeiouh]|z|gn|pn|ps|x|y)/i.test(n)

const articoloDi = v => {
  const n = (v.nome || '').toLowerCase()
  if (v.plurale) return v.la ? 'le' : vocale(n) || impura(n) ? 'gli' : 'i'
  if (vocale(n)) return "l'"
  return v.la ? 'la' : impura(n) ? 'lo' : 'il'
}
const IN = { il: 'nel', lo: 'nello', la: 'nella', "l'": "nell'", i: 'nei', gli: 'negli', le: 'nelle' }
const stacca = a => a.endsWith("'") ? a : a + ' '

// "nella sartoria": vuole la voce (il genere sta lì), non una stringa.
export const dentroA = v => {
  if (!v) return ''
  const a = articoloDi(v)
  return stacca(IN[a]) + (v.nome || '').toLowerCase()
}
// "la sartoria", con la maiuscola messa da chi scrive la frase (Su).
export const laCosa = v => v ? stacca(articoloDi(v)) + (v.nome || '').toLowerCase() : ''
export const Su = s => s.charAt(0).toUpperCase() + s.slice(1)

// "le tue sartorie": si piega solo la prima parola di un nome composto ("Silo del raccolto").
const unaParola = n =>
  /a$/i.test(n) ? n.replace(/a$/i, 'e')
  : /io$/i.test(n) ? n.replace(/io$/i, 'i')
  : /[oe]$/i.test(n) ? n.replace(/[oe]$/i, 'i')
  : n
const alPlurale = n => n.replace(/^\S+/, unaParola)
export const leTue = v => {
  if (!v) return ''
  const n = (v.nome || '').toLowerCase()
  return `${v.la ? 'le tue' : 'i tuoi'} ${v.plurale ? n : alPlurale(n)}`
}

// Il verbo che concorda: plurale lo dice il dato (plurale), non si indovina dal nome.
export const concorda = (v, uno, tanti) => (v && v.plurale) ? tanti : uno
const roba = id => PRODOTTI[id] || { nome: id, emoji: '📦' }

// I campi divisi in quello che interessa: liberi (da seminare), pronti (da raccogliere), il resto è tempo.
function iCampi(f, ora) {
  const campi = f.cose.filter(eCampo)
  return {
    tutti: campi,
    liberi: campi.filter(c => (f.statoCampo(c, ora) || {}).vuoto),
    pronti: campi.filter(c => (f.statoCampo(c, ora) || {}).pronto),
  }
}

// Le macchine di un tipo, divise allo stesso modo; fra le libere prima le vuote (mai in coda dietro a un pezzo lungo).
function leMacchine(f, quale, ora) {
  const tutte = f.cose.filter(c => macchinaDi(c) === quale)
  const stato = c => f.statoMacchina(c, ora) || {}
  return {
    tutte,
    ferme: tutte.filter(c => stato(c).libera)
      .sort((a, b) => stato(a).coda.length - stato(b).coda.length),
    pronte: tutte.filter(c => stato(c).pronto),
    // fra quelle con la fila piena, quella che finirà prima il pezzo che ha per le mani
    prima: tutte.map(stato)
      .filter(s => s.lavora && !s.libera && !s.pronto)
      .sort((a, b) => a.manca - b.manca)[0] || null,
  }
}

// Il pezzo di questa ricetta che arriva prima: non manda a raccogliere per un mangime già in arrivo.
function inArrivo(f, ricetta, ora) {
  return f.cose.filter(c => macchinaDi(c) === ricetta.dove)
    .flatMap(c => (f.statoMacchina(c, ora) || { coda: [] }).coda)
    .filter(p => !p.pronto && p.ricetta.da === ricetta.da)
    .sort((a, b) => a.manca - b.manca)[0] || null
}

// Quale voce comprare per avere quella macchina: dal catalogo, non da un elenco a parte.
const vocePerMacchina = quale =>
  Object.values(PER_ID).find(v => v.macchina === quale) || null

const voceCampo = () => Object.values(PER_ID).find(v => v.campo) || null

// acquisto risponde se si può e a che prezzo, costa scrive la coda della frase (separati perché il
// contesto cambia la frase). Non ancora aperto: si dice a che livello arriva; arrivato ma non preso: dov'è il premio.
function acquisto(f, voce) {
  if (!voce) return null
  const liv = livelloDellaVoce(voce)
  if (liv > f.livello) return { voce, arriva: liv, prezzo: null, azione: null }
  if (!f.sbloccata(voce.id))
    return { voce, arriva: null, premio: true, prezzo: null,
             azione: { che: 'premio', voce: voce.id } }
  const prezzo = f.quantoCosta(voce.id)
  return { voce, arriva: null, prezzo,
           azione: { che: 'compra', voce: voce.id, prezzo } }
}

const costa = a => a.arriva ? `arriva al livello ${a.arriva}`
  : a.premio ? 'ti aspetta nei premi' : `🪙${a.prezzo}`

// La domanda che tutto il resto gira a questo file.
export function comeAvere(f, prodotto, ora = Date.now(), giri = GIRI) {
  const pr = roba(prodotto)
  if (giri <= 0) return { testo: `${pr.emoji} ${pr.nome} si fa in fattoria.`, azione: null }

  // Prima il campo: è la strada più corta e la più facile da capire.
  const coltura = COLTURE.find(c => c.da === prodotto)
  if (coltura) {
    const dal = daiCampi(f, coltura, ora)
    if (dal) return dal
  }

  // Poi le macchine, tutte quelle che fanno questa merce: vince la prima che si può fare davvero,
  // prima chi ha già tutto in granaio, poi la più economica e svelta (megliaDi, come in mercato.js).
  const haTutto = r => Object.keys(r.prende || {}).every(k => f.quantoHo(k) >= r.prende[k])
  const ricette = leRicette(f).filter(r => r.da === prodotto).sort(megliaDi(haTutto))
  let ripiego = null
  for (const r of ricette) {
    const dalla = dallaMacchina(f, r, ora, giri)
    if (!dalla) continue
    if (dalla.azione) return dalla
    ripiego = ripiego || dalla
  }
  if (ripiego) return ripiego

  // Nessuna strada aperta adesso: si dice quando si aprirà, non che "non si fa".
  const quando = livelloDelProdotto(prodotto)
  if (quando > f.livello && quando < Infinity)
    return { testo: `${pr.emoji} ${pr.nome} arriva al livello ${quando}.`, azione: null }
  return { testo: `${pr.emoji} ${pr.nome} non si fa in fattoria.`, azione: null }
}

// La strada del campo: prima quello che si fa adesso, poi l'attesa, poi la spesa.
function daiCampi(f, coltura, ora) {
  const { tutti, liberi, pronti } = iCampi(f, ora)

  // Prima di tutto: dove finirà. Mandare a seminare senza silo vuol dire un altro no dopo dieci minuti veri.
  const fam = (PRODOTTI[coltura.da] || {}).silo
  if (fam && !f.eCostruito(fam) && !pronti.length) {
    const a = acquisto(f, Object.values(PER_ID).find(v => v.silo === fam))
    const si = SILI[fam]
    if (a && si)
      return { testo: `Prima ti serve ${laCosa(si)} (${costa(a)}):` +
                      ` è lì che finisce ${coltura.emoji} quando lo raccogli.`,
               azione: a.azione }
  }
  const suo = tutti.filter(c => (f.statoCampo(c, ora) || {}).coltura === coltura)

  // Ce n'è già uno pronto: si raccoglie, non se ne semina un altro.
  const suoPronto = suo.find(c => pronti.includes(c))
  if (suoPronto)
    return { testo: `Hai ${coltura.emoji} pronto in un campo: raccoglilo.`,
             azione: { che: 'apri', cosa: suoPronto } }

  if (liberi.length)
    return { testo: `Hai un campo libero: seminaci ${coltura.emoji} ${coltura.nome.toLowerCase()}` +
                    ` (🪙${coltura.semina}, ${coltura.minuti} min).`,
             azione: { che: 'apri', cosa: liberi[0] } }

  // Nessun campo libero, ma uno cresce con la roba giusta: si aspetta, e si dice quanto.
  const inArrivo = suo.map(c => f.statoCampo(c, ora)).filter(s => s && !s.vuoto && !s.pronto)
    .sort((a, b) => a.manca - b.manca)[0]
  if (inArrivo)
    return { testo: `${coltura.emoji} sta crescendo: pronto fra ${inArrivo.manca} min.`,
             azione: null }

  if ((coltura.liv || 1) > f.livello)
    return { testo: `${coltura.emoji} ${coltura.nome} arriva al livello ${coltura.liv}.`,
             azione: null }

  // Campi occupati da altro: la cosa da fare è farne un altro.
  const a = acquisto(f, voceCampo())
  if (!a) return null
  return { testo: tutti.length
             ? `I tuoi campi sono tutti occupati: fanne un altro (${costa(a)}).`
             : `Ti serve un campo dove seminare (${costa(a)}).`,
           azione: a.azione }
}

// La strada della macchina: se è libera ma mancano gli ingredienti, la domanda si sposta su quelli.
function dallaMacchina(f, ricetta, ora, giri) {
  const voce = vocePerMacchina(ricetta.dove)
  const { tutte, ferme, pronte, prima } = leMacchine(f, ricetta.dove, ora)

  if (!tutte.length) {
    const a = acquisto(f, voce)
    if (!a) return null
    return { testo: `${ricetta.nome} si fa ${dentroA(voce)},` +
                    ` che non hai (${costa(a)}).`,
             azione: a.azione }
  }

  // Una che ha già finito: ritirare è gratis e immediato, viene prima di tutto.
  if (pronte.length)
    return { testo: `${Su(laCosa(voce))} ${concorda(voce, 'ha', 'hanno')}` +
                    ' qualcosa da ritirare.',
             azione: { che: 'apri', cosa: pronte[0] } }

  const manca = Object.keys(ricetta.prende)
    .filter(k => f.quantoHo(k) < ricetta.prende[k])
  if (ferme.length && !manca.length) {
    // Con la fila "fai" vuol dire anche "metti dietro a quello che sta facendo".
    const occupata = !(f.statoMacchina(ferme[0], ora) || {}).ferma
    return { testo: `Hai tutto: ${occupata ? 'metti in fila' : 'fai'}` +
                    ` ${ricetta.nome.toLowerCase()} ${dentroA(voce)}.`,
             azione: { che: 'apri', cosa: ferme[0] } }
  }

  // Ne sta arrivando uno presto: si aspetta, invece di mandare a comprare per niente.
  const arriva = inArrivo(f, ricetta, ora)
  if (arriva && arriva.manca <= 5)
    return { testo: `${ricetta.emoji ? ricetta.emoji + ' ' : ''}${ricetta.nome}` +
                    ` è in arrivo: pronto fra ${arriva.manca} min.`,
             azione: null }

  if (ferme.length) {
    // Libera: manca qualcosa da metterci dentro? Si risale a quello.
    const k = manca[0]
    const quanti = ricetta.prende[k] - f.quantoHo(k)
    const sotto = comeAvere(f, k, ora, giri - 1)
    return { testo: `Ti ${quanti === 1 ? 'manca' : 'mancano'} ${quanti} ${merce(k)}.` +
                    ` ${sotto.testo}`,
             azione: sotto.azione }
  }

  // Tutte con la fila piena: se una finisce presto si aspetta, se no se ne fa un'altra (mai allungare la fila).
  const unPosto = tutte.every(c => (f.statoMacchina(c, ora) || {}).posti === 1)
  const quante = tutte.length === 1
    ? `${Su(laCosa(voce))} ${unPosto ? concorda(voce, 'sta', 'stanno') + ' lavorando'
                                     : concorda(voce, 'ha', 'hanno') + ' la fila piena'}`
    : `${Su(leTue(voce))} ${unPosto ? 'stanno lavorando' : 'hanno la fila piena'}`
  if (prima && prima.manca <= 5)
    return { testo: `${quante}: pronto fra ${prima.manca} min.`, azione: null }
  const a = acquisto(f, voce)
  if (!a) return { testo: `${quante}.`, azione: null }
  return { testo: `${quante}${prima ? ` (ancora ${prima.manca} min)` : ''}:` +
                  ` fanne un altro (${costa(a)}).`,
           azione: a.azione }
}

// L'altra faccia: non "mi manca", "non ci sta". Prima usare quello che si ha, poi il carretto, poi il silo.
export function comeFarePosto(f, prodotto, ora = Date.now()) {
  const pr = roba(prodotto)
  const fam = pr.silo
  const si = SILI[fam] || SILI.terra

  if (!f.eCostruito(fam)) {
    const a = acquisto(f, Object.values(PER_ID).find(v => v.silo === fam))
    if (!a) return { testo: `${pr.emoji} non ha dove andare.`, azione: null }
    return { testo: `${pr.emoji} non ha dove andare: ti serve` +
                    ` ${laCosa(si)} (${costa(a)}).`,
             azione: a.azione }
  }

  // Chi consuma questa roba, e può farlo adesso.
  const usa = leRicette(f).filter(r => (r.prende || {})[prodotto])
  for (const r of usa) {
    if (f.quantoHo(prodotto) < r.prende[prodotto]) continue
    const { ferme } = leMacchine(f, r.dove, ora)
    if (!ferme.length) continue
    const voce = vocePerMacchina(r.dove)
    return { testo: `Lo scomparto ${pr.emoji} è pieno. Usane ${r.prende[prodotto]}` +
                    ` ${dentroA(voce)}: ${r.resa} ${r.nome.toLowerCase()}.`,
             azione: { che: 'apri', cosa: ferme[0] } }
  }

  // Nessuna macchina lo consuma: prima il carretto (gratis), poi il silo (costa).
  if (carrettoIn(f) && f.quantoHo(prodotto) >= DAI)
    return { testo: `Lo scomparto ${pr.emoji} è pieno. Danne ${DAI} al vicino:` +
                    ' ti dà qualcos\'altro in cambio, e non costa niente.',
             // con: quale merce, non solo dove — il primo passo del carretto l'ha già fatto venendo qui
             azione: { che: 'apri', cosa: carrettoIn(f), con: prodotto } }

  // Nessuno lo consuma adesso: allora sì, si allarga il silo.
  const costo = f.costoDellIngrandimento(fam)
  return { testo: `Lo scomparto ${pr.emoji} è pieno (${f.capienzaDi(fam)}).` +
                  ` Ingrandisci ${laCosa(si)}: ${costo} monete,` +
                  ' e cresce anche il posto per tutto il resto.',
           azione: { che: 'ingrandisci', famiglia: fam, prezzo: costo } }
}
