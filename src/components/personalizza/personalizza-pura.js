// Il modello dell'interfaccia unica per personalizzare (Personalizza.vue), senza Vue: cosa c'è in ogni zona, quanto costa, cosa fa un tocco.
// Vedi docs/core/personalizza.md. Il contratto in una riga: UN'INTERAZIONE MODIFICA SOLO LE ZONE SOTTO. La gerarchia va in un verso solo,
// scheda → oggetto → forma → colore → prezzo: `zone()` di una zona dipende solo dalle scelte sopra di lei, e un tocco cambia stato solo dal
// suo livello in giù (le zone sopra possono cambiare aspetto, mai numero, ordine o posto). Le dipendenze le dichiarano i dati (le forme di
// un oggetto, i colori di una forma), mai l'ordine dei tocchi; quando una scelta sopra rende impossibile quella sotto, il sotto torna al
// primo valore dichiarato.
//
// I dati (`dati`, da chi usa il componente):
//   schede   [{ id, nome, tipo: 'oggetti' | 'set' }]
//   voci     [{ id, scheda, posto, nome, prezzo?, liv?, posseduto?, prezzoColore?, tratto?, niente?, nomeForme?, nomeColori?,
//              forme?: [{ id, nome, prezzo?, liv?, posseduta?, colori? }], colori?: [{ id, nome, css?, prezzo?, liv?, posseduto? }], dati? }]
//            `tratto`: toccarlo apre il pannello e basta (pelle, capelli: si cambiano nel pannello); `niente`: «Nessuno», niente da scegliere.
//            Possedere: `posseduto` (l'oggetto), `posseduta` (una forma), `posseduto` (un colore). Senza prezzo una cosa è sempre tua.
//   indossato { posto: valore }        valore = { oggetto, forma, colore } (id o null)
//   setGioco  [{ id, nome, prezzo, liv?, pezzi: { posto: valore } }]
//   mieiSet   [{ posto: 0..MAX_SET-1, nome, pezzi: { posto: valore } }]     (salvati da chi gioca, per personaggio)
//   livello   il livello di chi gioca (i pezzi con `liv` più alto si vedono e si provano, ma non si prendono)
//   saldo     le monete o le gemme che ha (null: un gioco senza prezzi)

export const MAX_SET = 6
export const STATO_NUOVO = (schede = []) => ({ scheda: (schede[0] || {}).id || null, aperto: {}, prova: {}, provaSet: null, setAperto: null, nomina: null, toglie: null })

export const formeDi = voce => (voce && voce.forme) || []
export const formaDi = (voce, id) => formeDi(voce).find(f => f.id === id) || null
/** I colori di una forma: quelli suoi, se no quelli dell'oggetto (il colore dipende dalla forma). */
export function coloriDi(voce, formaId) { const f = formaDi(voce, formaId); return (f && f.colori) || (voce && voce.colori) || [] }
const primo = l => (l[0] ? l[0].id : null)
export const vale = (oggetto, forma = null, colore = null) => ({ oggetto, forma, colore })
export const stessoValore = (a, b) => !!a && !!b && a.oggetto === b.oggetto && (a.forma ?? null) === (b.forma ?? null) && (a.colore ?? null) === (b.colore ?? null)

/** Il valore di un oggetto toccato: com'è addosso se è lui, se no la prima forma e il primo colore dichiarati. */
export function valoreDi(voce, addosso) {
  if (addosso && addosso.oggetto === voce.id) return addosso
  const f = primo(formeDi(voce))
  return vale(voce.id, f, primo(coloriDi(voce, f)))
}
/** Un'altra forma: il colore resta se la forma nuova ce l'ha, se no torna il primo della forma. */
export function conForma(voce, valore, formaId) {
  const cs = coloriDi(voce, formaId)
  return vale(voce.id, formaId, cs.some(c => c.id === valore.colore) ? valore.colore : primo(cs))
}
export const conColore = (voce, valore, coloreId) => vale(voce.id, valore.forma ?? null, coloreId)

/** Quanto costa mettersi addosso `valore`: { righe: [[nome, prezzo]], tot, liv } (`liv` > 0: bloccato fino a quel livello).
    L'oggetto si paga una volta; chi lo compra lo prende nella forma e nel colore che prova (la forma e il colore di base vengono con
    lui); un'altra forma ha il suo prezzo; un altro colore dopo costa `prezzoColore`, o il prezzo suo (un colore speciale, sempre). */
export function costo(voce, valore, livello = Infinity) {
  const r = { righe: [], tot: 0, liv: 0 }
  if (!voce || !valore) return r
  const fs = formeDi(voce), fo = formaDi(voce, valore.forma), cs = coloriDi(voce, valore.forma), co = cs.find(c => c.id === valore.colore) || null
  for (const x of [voce, fo, co]) if (x && x.liv > livello) r.liv = Math.max(r.liv, x.liv)
  const aggiungi = (nome, p) => { r.righe.push([nome, p]); r.tot += p }
  let nuovo = false
  if (voce.prezzo && !voce.posseduto) { aggiungi(voce.nome, voce.prezzo); nuovo = true }
  if (fo && fo.prezzo && !fo.posseduta) { aggiungi(fs.length > 1 ? fo.nome : voce.nome, fo.prezzo); nuovo = true }
  if (co && !co.posseduto) {
    const p = co.prezzo || (co === cs[0] || nuovo ? 0 : voce.prezzoColore || 0)
    if (p) aggiungi('colore ' + co.nome.toLowerCase(), p)
  }
  return r
}

const voceDi = (dati, id) => dati.voci.find(v => v.id === id) || null
const schedaDi = (dati, id) => dati.schede.find(s => s.id === id) || dati.schede[0] || null
export const addossoOra = (dati, stato) => ({ ...(dati.indossato || {}), ...stato.prova })
/** Le voci di una scheda, nell'ordine dei dati (mai in quello dei tocchi). */
export const vociDi = (dati, schedaId) => dati.voci.filter(v => v.scheda === schedaId)

/** L'oggetto aperto nel pannello: quello toccato per ultimo in questa scheda, se no quello che si ha addosso, se no il primo tratto. */
export function apertoDi(dati, stato, schedaId = stato.scheda) {
  const voci = vociDi(dati, schedaId)
  const scelto = voci.find(v => v.id === stato.aperto[schedaId])
  if (scelto) return scelto
  const ora = addossoOra(dati, stato)
  return voci.find(v => !v.tratto && ora[v.posto] && ora[v.posto].oggetto === v.id) || voci.find(v => v.tratto) || null
}

/** Quanto costa un set: il minimo fra il suo prezzo e la somma dei pezzi che mancano (chi ne ha già metà paga il resto). */
export function costoSet(dati, set) {
  let somma = 0, liv = 0
  for (const v of Object.values(set.pezzi || {})) { const r = costo(voceDi(dati, v.oggetto), v, dati.livello); somma += r.tot; liv = Math.max(liv, r.liv) }
  return { tot: Math.min(set.prezzo || 0, somma), somma, liv }
}
/** I pezzi di un set salvato che oggi non si possono mettere (non più tuoi, di un livello che non hai, o spariti dal catalogo). */
export function mancantiDi(dati, set) {
  return Object.values(set.pezzi || {}).filter(v => { const voce = voceDi(dati, v && v.oggetto); if (!voce) return true; const r = costo(voce, v, dati.livello); return r.tot || r.liv }).length
}

/** La prova di adesso, tutta: { righe, tot, liv, nome, invece } o null. */
export function conto(dati, stato) {
  const posti = Object.keys(stato.prova)
  if (!posti.length) return null
  if (stato.provaSet) {
    const set = (dati.setGioco || []).find(s => s.id === stato.provaSet), c = set ? costoSet(dati, set) : { tot: 0, somma: 0, liv: 0 }
    return { nome: set ? set.nome : '', righe: [['il set', c.tot]], tot: c.tot, liv: c.liv, invece: c.somma > c.tot ? c.somma : 0 }
  }
  const out = { righe: [], tot: 0, liv: 0, nomi: [], invece: 0 }
  for (const p of posti) {
    const v = stato.prova[p], voce = voceDi(dati, v.oggetto), r = costo(voce, v, dati.livello)
    out.righe.push(...r.righe); out.tot += r.tot; out.liv = Math.max(out.liv, r.liv)
    out.nomi.push(voce ? voce.nome : '')
  }
  out.nome = out.nomi.join(' e ')
  return out
}

/** Le zone, dall'alto in basso, con i soli id (numero e ordine): quello che il test della gerarchia confronta. */
export function zone(dati, stato) {
  const sc = schedaDi(dati, stato.scheda)
  const out = { schede: dati.schede.map(s => s.id), griglia: [], pannello: { tipo: 'vuoto', voce: null, forme: [], colori: [] }, conto: conto(dati, stato) }
  if (!sc) return out
  if (sc.tipo === 'set') {
    out.griglia = [...Array.from({ length: MAX_SET }, (_, i) => 'mio:' + i), ...(dati.setGioco || []).map(s => 'gioco:' + s.id)]
    out.pannello = { tipo: stato.nomina ? 'nome' : 'set', voce: null, forme: [], colori: [] }
    return out
  }
  out.griglia = vociDi(dati, sc.id).map(v => 'voce:' + v.id)
  const voce = apertoDi(dati, stato, sc.id)
  if (!voce || voce.niente) { out.pannello = { tipo: 'vuoto', voce: voce ? voce.id : null, forme: [], colori: [] }; return out }
  const ora = addossoOra(dati, stato)[voce.posto], cur = valoreDi(voce, ora)
  out.pannello = { tipo: 'voce', voce: voce.id, forme: formeDi(voce).length > 1 ? formeDi(voce).map(f => f.id) : [], colori: coloriDi(voce, cur.forma).length > 1 ? coloriDi(voce, cur.forma).map(c => c.id) : [] }
  return out
}

/** Un tocco. Torna { stato, eventi: [[nome, carico]] }: lo stato nuovo del componente e gli eventi da mandare a chi lo usa.
    `scegli` (gratis: il gioco lo mette subito), `prova` (costa: resta in prova finché non si paga), `acquista`, `annulla`,
    `indossa-set`, `salva-set`, `rinomina-set`, `togli-set`. */
export function tocca(dati, stato0, ev) {
  const stato = { ...stato0, aperto: { ...stato0.aperto }, prova: { ...stato0.prova } }, eventi = []
  const metti = (voce, valore, da) => {
    const r = costo(voce, valore, dati.livello), carico = { posto: voce.posto, ...valore, da }
    stato.provaSet = null
    if (!r.tot && !r.liv) { delete stato.prova[voce.posto]; eventi.push(['scegli', carico]) }
    else { stato.prova[voce.posto] = valore; eventi.push(['prova', carico]) }
  }
  const aperto = () => apertoDi(dati, stato), ora = voce => addossoOra(dati, stato)[voce.posto]
  switch (ev.tipo) {
    case 'scheda': stato.scheda = ev.id; stato.nomina = null; stato.toglie = null; break
    case 'voce': {
      const voce = voceDi(dati, ev.id)
      if (!voce) break
      stato.aperto[stato.scheda] = voce.id
      if (!voce.tratto) metti(voce, valoreDi(voce, ora(voce)), 'oggetto')
      break
    }
    case 'forma': { const voce = aperto(); if (voce) metti(voce, conForma(voce, valoreDi(voce, ora(voce)), ev.id), 'forma'); break }
    case 'colore': { const voce = aperto(); if (voce) metti(voce, conColore(voce, valoreDi(voce, ora(voce)), ev.id), 'colore'); break }
    case 'paga': {
      const c = conto(dati, stato)
      if (!c || c.liv || (dati.saldo != null && c.tot > dati.saldo)) break
      eventi.push(['acquista', { pezzi: Object.entries(stato.prova).map(([posto, v]) => ({ posto, ...v })), set: stato.provaSet, totale: c.tot }])
      stato.prova = {}; stato.provaSet = null
      break
    }
    case 'annulla': stato.prova = {}; stato.provaSet = null; eventi.push(['annulla', null]); break
    case 'set-gioco': {
      const set = (dati.setGioco || []).find(s => s.id === ev.id)
      if (!set) break
      stato.setAperto = null; stato.toglie = null; stato.nomina = null
      const c = costoSet(dati, set)
      if (!c.tot && !c.liv) { stato.prova = {}; stato.provaSet = null; eventi.push(['indossa-set', { gioco: set.id, pezzi: { ...set.pezzi }, saltati: 0 }]) }
      else { stato.prova = { ...set.pezzi }; stato.provaSet = set.id }
      break
    }
    case 'set-mio': {
      stato.setAperto = ev.posto; stato.toglie = null; stato.nomina = null
      const set = (dati.mieiSet || []).find(m => m.posto === ev.posto)
      if (!set) break
      // quello che è tuo e del tuo livello subito e gratis; il resto si salta, e lo si dice
      const pezzi = {}
      let saltati = 0
      for (const [p, v] of Object.entries(set.pezzi || {})) {
        const voce = voceDi(dati, v && v.oggetto), r = voce ? costo(voce, v, dati.livello) : { tot: 1 }
        if (r.tot || r.liv) saltati++; else pezzi[p] = v
      }
      stato.prova = {}; stato.provaSet = null
      eventi.push(['indossa-set', { posto: ev.posto, pezzi, saltati }])
      break
    }
    case 'salva': {
      const posto = postoPerSalvare(dati, stato)
      if (posto == null) break
      const m = (dati.mieiSet || []).find(x => x.posto === posto)
      stato.nomina = { modo: 'salva', posto, vecchio: m ? m.nome : '', nome: m ? m.nome : ev.proposto || `Il mio set ${posto + 1}` }
      stato.toglie = null
      break
    }
    case 'rinomina': {
      const m = (dati.mieiSet || []).find(x => x.posto === stato.setAperto)
      if (m) stato.nomina = { modo: 'rinomina', posto: m.posto, vecchio: m.nome, nome: m.nome }
      break
    }
    case 'nome-ok': {
      const n = stato.nomina
      if (!n) break
      const nome = String(ev.nome || '').trim().slice(0, 16) || n.nome
      // si salva quello che si ha addosso ed è tuo: una prova non pagata non entra in un set
      if (n.modo === 'rinomina') eventi.push(['rinomina-set', { posto: n.posto, nome }])
      else { eventi.push(['salva-set', { posto: n.posto, nome, pezzi: { ...(dati.indossato || {}) } }]); stato.setAperto = n.posto }
      stato.nomina = null
      break
    }
    case 'nome-no': stato.nomina = null; break
    case 'togli': {
      if (stato.setAperto == null) break
      if (stato.toglie === stato.setAperto) { eventi.push(['togli-set', stato.setAperto]); stato.toglie = null }
      else stato.toglie = stato.setAperto
      break
    }
  }
  return { stato, eventi }
}

/** Dove va il set salvato: il posto toccato, o il primo libero; null se sono tutti pieni e non se n'è toccato nessuno. */
export function postoPerSalvare(dati, stato) {
  if (stato.setAperto != null) return stato.setAperto
  const pieni = new Set((dati.mieiSet || []).map(m => m.posto))
  for (let i = 0; i < MAX_SET; i++) if (!pieni.has(i)) return i
  return null
}

/** Quante righe servono alle forme e ai colori di una scheda, con `perRiga` gettoni per riga: il pannello è alto uguale per tutta la
    scheda (cambia solo cambiando scheda, che cambia tutto quello che sta sotto). */
export function righeDelPannello(dati, schedaId, perRigaForme, perRigaColori) {
  const sc = schedaDi(dati, schedaId)
  if (!sc || sc.tipo === 'set') return { forme: 1, colori: 1 }
  let forme = 1, colori = 1
  for (const v of vociDi(dati, sc.id)) {
    const fs = formeDi(v)
    if (fs.length > 1) forme = Math.max(forme, Math.ceil(fs.length / Math.max(1, perRigaForme)))
    for (const f of fs.length ? fs : [null]) {
      const cs = coloriDi(v, f && f.id)
      if (cs.length > 1) colori = Math.max(colori, Math.ceil(cs.length / Math.max(1, perRigaColori)))
    }
  }
  return { forme, colori }
}
