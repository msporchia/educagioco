/* Il guardaroba del contadino nella forma dell'interfaccia unica (components/personalizza/, docs/core/personalizza.md), e ritorno.
   Dato puro, senza Vue: lo provano le unità (`unita/fattoria3d-guardaroba`). Le regole dei capi restano in dati/abiti.js; qui solo come
   si mostrano: le schede, le voci (un oggetto, le sue forme, i suoi colori) e i valori dei posti (`{ oggetto, forma, colore }`).
   - Aspetto: la pelle (colori), i capelli (il taglio è la forma, poi il colore), la barba (forme).
   - Un cappello e una maglia sono un oggetto ciascuno; la salopette (o la gonna) e gli stivali un oggetto coi loro colori; al collo un
     oggetto per forma (il fazzoletto in tre colori, la sciarpa nei suoi), «Niente» senza scelte.
   Un capo a pagamento è `posseduto` se sta nell'armadio; un pezzo col livello più alto di quello di chi gioca si vede ma non si prende. */
import { PERSONE_ABITO, scelteDi, opzione, etichettaDi, normalizzaAbito, chiaveCapo } from './abiti.js'

export const SCHEDE_GUARDAROBA = [
  { id: 'chi', nome: 'Chi sei', tipo: 'oggetti', dati: { 'data-scheda-abito': 'persona' } },
  { id: 'aspetto', nome: 'Aspetto', tipo: 'oggetti', dati: { 'data-scheda-abito': 'aspetto' } },
  { id: 'cappelli', nome: 'Cappelli', tipo: 'oggetti', dati: { 'data-scheda-abito': 'cappello' } },
  { id: 'vestiti', nome: 'Vestiti', tipo: 'oggetti', dati: { 'data-scheda-abito': 'vestiti' } },
  { id: 'set', nome: 'Set', tipo: 'set', dati: { 'data-scheda-abito': 'set' } },
]
export const NOMI_PERSONE = { contadina: 'Contadina', contadino: 'Contadino' }
const css = c => '#' + (c >>> 0).toString(16).padStart(6, '0')
const NOMI_COLLO = { fazzoletto: 'Fazzoletto', sciarpa: 'Sciarpa', papillon: 'Papillon', scialle: 'Scialle', niente: 'Niente al collo' }

/** Le voci del guardaroba per chi si è; `ctx` = { livello, armadio, stagione }. */
export function vociDelGuardaroba(chi, ctx = {}) {
  const armadio = ctx.armadio || {}
  const tuo = (cat, o) => !o.prezzo || !!armadio[chiaveCapo(cat, o.id)]
  const conto = (cat, o) => ({ ...(o.prezzo ? { prezzo: o.prezzo } : {}), ...(o.liv ? { liv: o.liv } : {}), posseduto: tuo(cat, o) })
  const scelte = cat => scelteDi(cat, chi, ctx)
  const colore = cat => o => ({ id: o.id, nome: o.nome, css: o.c ? css(o.c) : null, ...conto(cat, o), dati: { 'data-capo': chiaveCapo(cat, o.id) } })
  const forma = cat => o => ({ id: o.id, nome: o.nome, ...(o.prezzo ? { prezzo: o.prezzo } : {}), ...(o.liv ? { liv: o.liv } : {}), posseduta: tuo(cat, o), dati: { 'data-capo': chiaveCapo(cat, o.id) } })
  const voci = PERSONE_ABITO.map(p => ({ id: p, scheda: 'chi', posto: 'chi', nome: NOMI_PERSONE[p], dati: { 'data-capo': 'persona:' + p } }))
  voci.push({ id: 'pelle', scheda: 'aspetto', posto: 'pelle', nome: etichettaDi('pelle', chi).nome, tratto: true, colori: scelte('pelle').map(colore('pelle')), dati: { 'data-voce': 'pelle' } })
  voci.push({ id: 'capelli', scheda: 'aspetto', posto: 'capelli', nome: 'Capelli', tratto: true, nomeForme: 'Taglio', nomeColori: 'Colore',
    forme: scelte('taglio').map(forma('taglio')), colori: scelte('capelli').map(colore('capelli')), dati: { 'data-voce': 'capelli' } })
  voci.push({ id: 'barba', scheda: 'aspetto', posto: 'barba', nome: etichettaDi('barba', chi).nome, tratto: true, forme: scelte('barba').map(forma('barba')), dati: { 'data-voce': 'barba' } })
  for (const o of scelte('cappello'))
    voci.push({ id: 'cappello:' + o.id, scheda: 'cappelli', posto: 'cappello', nome: o.nome, ...(o.id === 'niente' ? { niente: true } : {}), ...conto('cappello', o), dati: { 'data-capo': chiaveCapo('cappello', o.id) } })
  for (const o of scelte('maglia'))
    voci.push({ id: 'maglia:' + o.id, scheda: 'vestiti', posto: 'maglia', nome: o.nome, ...conto('maglia', o), dati: { 'data-capo': chiaveCapo('maglia', o.id) } })
  voci.push({ id: 'pantalone', scheda: 'vestiti', posto: 'pantalone', nome: etichettaDi('pantalone', chi).nome, colori: scelte('pantalone').map(colore('pantalone')), dati: { 'data-voce': 'pantalone' } })
  voci.push({ id: 'stivali', scheda: 'vestiti', posto: 'stivali', nome: 'Stivali', colori: scelte('stivali').map(colore('stivali')), dati: { 'data-voce': 'stivali' } })
  // al collo: un oggetto per forma, i pezzi di quella forma sono i suoi colori
  const gruppi = new Map()
  for (const o of scelte('collo')) { if (!gruppi.has(o.forma)) gruppi.set(o.forma, []); gruppi.get(o.forma).push(o) }
  for (const [f, pezzi] of gruppi) {
    const uno = pezzi.length === 1 ? pezzi[0] : null
    voci.push({ id: 'collo:' + f, scheda: 'vestiti', posto: 'collo', nome: uno && f !== 'niente' ? uno.nome : NOMI_COLLO[f] || f, ...(f === 'niente' ? { niente: true } : {}),
      colori: pezzi.map(colore('collo')), dati: { 'data-voce': 'collo:' + f, ...(uno ? { 'data-capo': chiaveCapo('collo', uno.id) } : {}) } })
  }
  return voci
}

/** Dall'abito ai valori dei posti. */
export function valoriDellAbito(abito) {
  const a = abito || {}, collo = opzione('collo', a.collo)
  return {
    chi: { oggetto: a.persona, forma: null, colore: null },
    pelle: { oggetto: 'pelle', forma: null, colore: a.pelle },
    capelli: { oggetto: 'capelli', forma: a.taglio, colore: a.capelli },
    barba: { oggetto: 'barba', forma: a.barba, colore: null },
    cappello: { oggetto: 'cappello:' + a.cappello, forma: null, colore: null },
    maglia: { oggetto: 'maglia:' + a.maglia, forma: null, colore: null },
    pantalone: { oggetto: 'pantalone', forma: null, colore: a.pantalone },
    stivali: { oggetto: 'stivali', forma: null, colore: a.stivali },
    collo: { oggetto: 'collo:' + (collo ? collo.forma : 'niente'), forma: null, colore: a.collo },
  }
}

/** Dai valori all'abito (rimesso in forma: un pezzo che non c'è torna quello di serie). `persona`: chi si è, se i valori non lo dicono. */
export function abitoDeiValori(v, persona) {
  const g = k => (v && v[k]) || {}, dopo = s => (typeof s === 'string' && s.includes(':') ? s.split(':')[1] : null)
  const chi = PERSONE_ABITO.includes(g('chi').oggetto) ? g('chi').oggetto : persona
  return normalizzaAbito({
    pelle: g('pelle').colore, taglio: g('capelli').forma, capelli: g('capelli').colore, barba: g('barba').forma,
    cappello: dopo(g('cappello').oggetto), maglia: dopo(g('maglia').oggetto), pantalone: g('pantalone').colore, stivali: g('stivali').colore, collo: g('collo').colore,
  }, chi)
}

/** I set salvati del guardaroba (cfg.vestiti): sei posti per la contadina e sei per il contadino, un nome corto e i capi. Uno storto si butta. */
export const POSTI_VESTITI = 6
export function vestitiInForma(l) {
  if (!Array.isArray(l)) return []
  const visti = new Set(), fuori = []
  for (const s of l) {
    if (!s || typeof s !== 'object' || !Number.isInteger(s.posto) || s.posto < 0 || s.posto >= POSTI_VESTITI || visti.has(s.persona + s.posto)) continue
    const nome = typeof s.nome === 'string' ? s.nome.trim().slice(0, 16) : ''
    if (!nome || !PERSONE_ABITO.includes(s.persona)) continue
    visti.add(s.persona + s.posto)
    const { persona, ...capi } = normalizzaAbito(s.capi, s.persona)
    fuori.push({ posto: s.posto, nome, persona, capi })
  }
  return fuori.sort((x, y) => x.persona.localeCompare(y.persona) || x.posto - y.posto)
}
