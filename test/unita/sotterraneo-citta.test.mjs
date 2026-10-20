/* ═══════════════════════════════════════════════════════════════════
   LE CITTÀ DEL MONDO 3D: IL CAPITANO E LA FONTANA — docs/sotterraneo/mondo-aperto-quest.md, chi-cura.md, mondo-3d.md

   Il capitano del forte del guado apre la storia delle marche: dice lui la quinta e la sesta porta (con la strada del mondo
   aperto), per le altre sta zitto e saluta; il suo sprite è quello della guardia, col suo blu e un po' più alto. La fontana prende
   il posto del pozzo nelle città dove manca la guaritrice o l'incantatrice (oggi il forte, che non ha l'incantatrice), cura vita
   ed energia insieme, e sta dove il generatore ha già messo il pozzo: il generatore non cambia. Il disegno e il tocco col dito
   sono in integrazione/sotterraneo-mondo.
   ═══════════════════════════════════════════════════════════════════ */
import { ilMondo, terraDelMondo, fontaneDi, hoLaFontana, curaDellaFontana, postiDi, CURA_DEL_MERCANTE } from '../../src/giochi/sotterraneo/motore/mondo-sopra.js'
import { CITTA } from '../../src/giochi/sotterraneo/dati/mondo-aperto.js'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { PERSONAGGI, PERSONAGGI_DI_SOPRA, CITTADINI, personaDi } from '../../src/giochi/sotterraneo/dati/missioni.js'
import { DIALOGHI, FONTANA, guastiDeiDialoghi } from '../../src/giochi/sotterraneo/dati/dialoghi.js'
import { LUOGHI_MONDO } from '../../src/giochi/sotterraneo/dati/terra.js'
import { PEZZI } from '../../src/giochi/sotterraneo/dati/atlante.js'
import { apertura, scelte, risposta, stradaDelCapitano } from '../../src/giochi/sotterraneo/motore/dialoghi.js'
import { guastiDelleMissioni } from '../../src/giochi/sotterraneo/dati/missioni.js'
import { controlla, uguale as uguale0, stessaLista, riassunto } from '../aiuto/verifica.mjs'
// anche per le liste e gli oggetti: si confronta il JSON
const uguale = (nome, a, b) => uguale0(nome, JSON.stringify(a), JSON.stringify(b))

const m = ilMondo()
const aperta = terraDelMondo(m, () => true)
const testi = pagine => pagine.map(p => p.testo).join(' | ')
const ctxCon = finite => ({ stati: {}, mondo: true, tappe: CAMPAGNA.map((t, i) => ({ ...t, indice: i, fatta: i < finite, aperta: i <= finite, adesso: i === finite })) })

/* ── il capitano: chi è, dov'è ── */
{
  stessaLista('il forte ha il capitano, e basta', CITTA.find(c => c.chiave === 'forte').persone, ['capitano'])
  const forte = m.citta.find(c => c.chiave === 'forte')
  const q = forte.persone.find(p => p.chiave === 'capitano')
  controlla('il generatore l\'ha messo nel forte', !!q && q.citta === 'forte', JSON.stringify(q))
  controlla('dove ci si ferma a parlargli, ci si arriva dalla piazza (coi passaggi aperti)', aperta.raggiungibili(m.partenza).has(q.accanto.y * m.W + q.accanto.x))
  controlla('il suo ingombro non chiude strade: la cella dei piedi è occupata, quella accanto no', !aperta.passa(q.piede.x, q.piede.y) && aperta.passa(q.accanto.x, q.accanto.y))
  controlla('è fra chi sta sopra, ma non fra chi dà favori (la mappa dipinta non lo conosce)', !!PERSONAGGI_DI_SOPRA.capitano && !PERSONAGGI.capitano)
  uguale('il suo nome', personaDi('capitano').nome, 'Il capitano')
  controlla('lo sprite è della guardia e l\'atlante lo ha, in piedi e che saluta', !!PEZZI[`${CITTADINI.capitano.sprite}-fermo-0`] && !!PEZZI[`${CITTADINI.capitano.sprite}-saluta-0`])
  controlla('più alto delle altre persone e con un po\' di blu', CITTADINI.capitano.scala > 1.25 && CITTADINI.capitano.tinta[2] > CITTADINI.capitano.tinta[0])
  stessaLista('i suoi dialoghi sono in regola', guastiDeiDialoghi(), [])
  stessaLista('le missioni anche', guastiDelleMissioni(), [])
}

/* ── cosa dice: la quinta e la sesta porta ── */
{
  uguale('alle prime quattro porte non dice la strada', [0, 1, 2, 3].map(f => stradaDelCapitano(ctxCon(f)).length), [0, 0, 0, 0])
  const cis = stradaDelCapitano(ctxCon(4))
  controlla('alla quinta racconta Gorgo e le sale allagate', /Gorgo/.test(testi(cis)) && /sale allagate/.test(testi(cis)), testi(cis))
  uguale('poi la strada del mondo aperto', cis.find(p => p.dato === 'detto').testo, `Le sale allagate: ${LUOGHI_MONDO.cisterna}.`)
  uguale('le prime pagine sono la storia', cis.slice(0, cis.findIndex(p => p.dato === 'detto')).every(p => p.dato === 'storia'), true)
  uguale('e in fondo le luci azzurre e «portami lì»', cis.at(-1).dato, 'luci')
  const lab = stradaDelCapitano(ctxCon(5))
  controlla('alla sesta Minotto, e manda dal minatore al rifugio', /Minotto/.test(testi(lab)) && /rifugio/.test(testi(lab)), testi(lab))
  uguale('con la sua strada', lab.find(p => p.dato === 'detto').testo, `La porta dell'inferno: ${LUOGHI_MONDO.labirinto}.`)
  uguale('dopo la sesta non dice più la strada', stradaDelCapitano(ctxCon(6)).length, 0)
  uguale('nemmeno finita la storia, con una zona nata', stradaDelCapitano({ ...ctxCon(4), annuncio: { chiave: 'cantine' } }).length, 0)
  // la pagina del saluto, e le scelte
  const ap = apertura('capitano', ctxCon(4))
  uguale('parlandogli alla quinta porta, la strada c\'è', ap.some(p => p.dato === 'detto'), true)
  uguale('e il saluto non si aggiunge', ap.some(p => p.dato === 'saluto'), false)
  const sal = apertura('capitano', ctxCon(2))
  uguale('prima, solo il saluto', sal.map(p => p.dato).join(), 'saluto')
  controlla('che a sei porte cambia', apertura('capitano', ctxCon(6))[0].testo !== sal[0].testo)
  const che = c => scelte('capitano', c).map(s => s.che)
  stessaLista('quando è la sua, si può chiedergli la strada', che(ctxCon(4)), ['strada', 'racconta', 'ciao'])
  stessaLista('se no no', che(ctxCon(2)), ['racconta', 'ciao'])
  stessaLista('e una volta detta non torna', scelte('capitano', ctxCon(4), new Set(['strada'])).map(s => s.che), ['racconta', 'ciao'])
  uguale('la strada chiesta è la stessa', testi(risposta('capitano', 'strada', ctxCon(5))), testi(stradaDelCapitano(ctxCon(5))))
  const rac = f => testi(risposta('capitano', 'racconta', ctxCon(f)))
  controlla('racconta cose diverse in punti diversi', new Set([0, 4, 5, 6, 7].map(rac)).size === 5)
  uguale('quando si chiede cosa c\'è oltre il guado, il minatore non è il solo a rispondere', DIALOGHI.capitano.domanda, 'Com\'è oltre il guado?')
}

/* ── la fontana ── */
{
  stessaLista('chi cura: la guaritrice la vita, l\'incantatrice l\'energia', Object.entries(CURA_DEL_MERCANTE).map(e => e.join(':')), ['erborista:vita', 'incantatrice:energia'])
  uguale('il villaggio ha tutte e due: niente fontana', hoLaFontana('villaggio'), false)
  uguale('il forte non ha l\'incantatrice: la fontana', hoLaFontana('forte'), true)
  uguale('il rifugio ha tutte e due', hoLaFontana('rifugio'), false)
  uguale('una città che non c\'è non ha niente', hoLaFontana('nessuna'), false)
  const f = fontaneDi(m, aperta)
  stessaLista('una fontana, quella del forte', f.map(x => x.citta), ['forte'])
  const forte = m.citta.find(c => c.chiave === 'forte'), p = forte.pozzo
  uguale('sta dove il generatore ha messo il pozzo', [f[0].x, f[0].y, f[0].w, f[0].h], [p.x, p.y, 2, 2])
  controlla('il pozzo è già un ingombro: non serve altro, e non si cammina sopra', !aperta.passa(f[0].piede.x, f[0].piede.y))
  controlla('ci si ferma accanto, in piazza, e ci si arriva', aperta.passa(f[0].accanto.x, f[0].accanto.y) && aperta.raggiungibili(m.partenza).has(f[0].accanto.y * m.W + f[0].accanto.x))
  controlla('dentro la piazza', Math.hypot(f[0].accanto.x - forte.piazza.x, f[0].accanto.y - forte.piazza.y) <= forte.piazza.r + 1)
  uguale('senza la terra, la prima cella provata', fontaneDi(m)[0].accanto, { x: p.x + 1, y: p.y + 3 })
  uguale('non aggiunge posti al mondo: il generatore è quello di prima', postiDi(m, 'fontana').length, 0)
  // cosa serve a chi sale
  uguale('senza sosta del portale si è in forze', curaDellaFontana(null), { vita: 0, energia: 0, serve: false })
  const forze = { vita: 7, vitaMax: 20, energia: 3, energiaMax: 10 }
  uguale('ferito e a secco', curaDellaFontana(forze), { vita: 13, energia: 7, serve: true })
  uguale('solo ferito', curaDellaFontana({ ...forze, energia: 10 }), { vita: 13, energia: 0, serve: true })
  uguale('solo a secco', curaDellaFontana({ ...forze, vita: 20 }), { vita: 0, energia: 7, serve: true })
  uguale('in forze', curaDellaFontana({ ...forze, vita: 20, energia: 10 }).serve, false)
  controlla('le frasi della fontana stanno in una riga di fumetto', Object.values(FONTANA).every(t => typeof t === 'string' && t.length <= 110), JSON.stringify(FONTANA))
}

riassunto('le città del mondo 3D: il capitano e la fontana')
