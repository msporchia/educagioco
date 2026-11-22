/* I due giri delle botteghe del sotterraneo, per eroi, livelli e discese finite: `unita/sotterraneo-roba` li fa su un campione,
   `misure/sotterraneo-botteghe` sul giro intero e con le quote. Non è un test (non finisce in `.test.mjs`): lo importano loro. */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { COSE, chiaveDelPezzo } from '../../src/giochi/sotterraneo/dati/cose.js'
import { MERCANTI, schedaDi, schedeDi } from '../../src/giochi/sotterraneo/dati/mercanti.js'
import { ROBA_VUOTA, ABILITA_CONFRONTATE } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { Bottega, PEZZI_PER_LINGUETTA, SUBITO_PER_LINGUETTA, RARI_PER_LINGUETTA, SALTI_MINIMI, SOGNI_MINIMI, SALTO_RELATIVO,
         SALTO_MINIMO, SOGNO_LIVELLI } from '../../src/giochi/sotterraneo/motore/bottega.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { robaAttesa, crescitaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { EROI, eroeDi, portaLa } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { crescitaA } from '../../src/giochi/sotterraneo/motore/crescita.js'
import { controlla, uguale } from './verifica.mjs'

export const TUTTI_GLI_EROI = EROI.map(e => e.chiave)
// null: il livello atteso della storia; `rara`: l'eroe ha addosso roba rara di quel livello
export const TUTTE_LE_PROVE = [{ lv: null, rara: false }, { lv: null, rara: true }, { lv: 15, rara: false }, { lv: 40, rara: true }, { lv: 90, rara: false }]
export const TUTTE_LE_FINITE = Array.from({ length: CAMPAGNA.length + 1 }, (_, i) => i)
export const TUTTI_I_LIVELLI = [1, 2, 4, 6, 9, 12, 16, 22, 30, 45, 70, 100]

export const raro = (b, L, ...ab) => chiaveDelPezzo(b, L, 'raro', ab)
export const addossoRaro = (eroe, L) => {
  const porta = (dove, ...basi) => basi.find(x => COSE[x].dove === dove && portaLa(eroeDi(eroe), COSE[x]))
  const mano = porta('mano', 'scettro', 'balestra', 'bipenne', 'spadone')
  return { ...ROBA_VUOTA(), mano: raro(mano, L, 'att', 'fuoco'),
           mancina: COSE[mano].mani === 2 ? null : raro('scudo-teschio', L, 'dif', 'vita'),
           corpo: raro(porta('corpo', 'manto', 'corazza'), L, 'dif', 'vita'), collo: raro('amuleto-osso', L, 'dif', 'vita') }
}

/* Ogni linguetta che veste ha una decina di pezzi, tutti migliori; il banco ha un tetto di rarità: magico sempre, al più un raro
   per linguetta, mai un leggendario (docs/sotterraneo/bottega.md, «Il tetto di rarità»). `quote`: anche i controlli a soglia
   («quasi tutte», «di solito»), che su un campione piccolo non dicono niente. */
export function giroDelleLinguette({ eroi = TUTTI_GLI_EROI, prove = TUTTE_LE_PROVE, finiteDa = TUTTE_LE_FINITE, quote = true } = {}) {
  let giri = 0, pochi = 0, nonMigliora = 0, nonPortabile = 0, rialzi = 0, storti = 0, meritare = 0, meritareStorti = 0
  let conSubito = 0, dueSubito = 0, dieci = 0, troppiRari = 0, leggendari = 0, magici = 0, scaffali = 0, senzaSubito = 0, daTenere = 0
  const senza = []
  const esempi = []
  for (const eroe of eroi)
    for (const { lv, rara } of prove)
        for (const finite of finiteDa) {
          const crescita = lv == null ? crescitaAttesa(eroe, finite) : crescitaA(eroeDi(eroe), lv)
          const roba = { ...(rara ? addossoRaro(eroe, lv || 6) : robaAttesa(eroe, finite)), gemme: 7 }
          const b = new Bottega({ eroe, finite, roba, crescita, rnd: seminato(9 + finite) })
          for (const m of MERCANTI) {
            const vista = b.mercanziaVista(m.chiave)
            uguale(`${m.chiave}: due volte la stessa vetrina`, b.mercanziaVista(m.chiave).map(r => r.chiave).join(), vista.map(r => r.chiave).join())
            leggendari += vista.filter(r => COSE[r.chiave].rarita === 'leggendario' || COSE[r.chiave].unico).length
            leggendari += b.mercanzia(m.chiave).filter(r => COSE[r.chiave].rarita === 'leggendario').length
            for (const s of schedeDi(m, eroeDi(eroe)).filter(x => x.dove)) {
              giri++
              const qui = vista.filter(r => COSE[r.chiave].dove && schedaDi(m, r.chiave) === s)
              if (qui.length < 3) { pochi++; esempi.push(`${eroe} lv${lv} f${finite} ${m.chiave}/${s.chiave}: ${qui.length}`) }
              if (qui.length >= PEZZI_PER_LINGUETTA) dieci++
              // un pezzo si indossa dal suo livello: chi ha le gemme trova sempre qualcosa da mettersi adesso (se l'eroe non ha già il meglio
              // del suo livello, e i gioielli migliorano quasi solo col livello)
              if (!rara && s.chiave !== 'gioielli' && !qui.some(r => COSE[r.chiave].dove && b.posso(r.chiave))) { senzaSubito++; senza.push(`${eroe} lv${lv} f${finite} ${m.chiave}/${s.chiave}`) }
              if (!rara && s.chiave !== 'gioielli') { conSubito++; if (qui.filter(r => COSE[r.chiave].dove && b.posso(r.chiave) && b.valeLaPena(r.chiave)).length >= SUBITO_PER_LINGUETTA) dueSubito++ }
              if (qui.some(r => COSE[r.chiave].dove && !b.posso(r.chiave) && b.porta(r.chiave))) daTenere++
              if (qui.filter(r => COSE[r.chiave].rarita === 'raro').length > RARI_PER_LINGUETTA) troppiRari++
              magici += qui.filter(r => r.rialzo && COSE[r.chiave].rarita === 'magico').length
              for (const r of qui) {
                if (r.rialzo) scaffali++
                // i pezzi «da meritare»: la classe li porta ma chiedono più caratteristica, e si comprano lo stesso
                if (r.meritare) { meritare++; if (b.posso(r.chiave) || !b.porta(r.chiave) || !(b.quantoCosta(r.chiave) > 0)) meritareStorti++; continue }
                const p = b.seLoMetto(r.chiave)
                if (!b.posso(r.chiave) || !p) { nonPortabile++; continue }
                if (p.bloccata || (p.prima && !ABILITA_CONFRONTATE.some(n => p.dopo[n] > p.prima[n]))) nonMigliora++
                if (r.rialzo) {
                  rialzi++
                  const conf = b.confronto(r.chiave)
                  if (conf.addosso && !(conf.meglio > 0)) storti++
                  if (!(b.quantoCosta(r.chiave) > 0)) storti++
                }
              }
            }
          }
        }
  controlla(`in ${giri} linguette (${eroi.length} eroi, vari livelli, roba rara addosso) nessuna ha meno di tre pezzi`, pochi === 0,
            esempi.slice(0, 6).join(' | '))
  if (quote) controlla('quasi tutte arrivano a dieci', dieci > giri * 0.9, `${dieci}/${giri}`)
  controlla('ogni linguetta ha almeno un pezzo che migliora e si indossa subito', senzaSubito === 0, senza.slice(0, 5).join(' | '))
  if (quote) controlla('e di solito due, perché le gemme abbiano dove andare', dueSubito > conSubito * 0.85, `${dueSubito}/${conSubito}`)
  if (quote) controlla('e quasi sempre anche pezzi da tenere per dopo', daTenere > giri * 0.8, `${daTenere}/${giri}`)
  uguale('mai un leggendario sul banco, né fra i pezzi in più', leggendari, 0)
  uguale('i rari restano nei salti e nei sogni (al più cinque per linguetta)', troppiRari, 0)
  if (quote) controlla('il magico c\'è sempre: la maggior parte dello scaffale', magici > scaffali / 2, `${magici} magici su ${scaffali} in scaffale`)
  uguale('tutti portabili dall\'eroe (tranne quelli da meritare)', nonPortabile, 0)
  uguale('quelli da meritare la classe li porta ma non li regge ancora, e hanno un prezzo', meritareStorti, 0)
  controlla('e ce n\'è davvero, da guardare', meritare > 0, `${meritare}/${giri}`)
  uguale('e tutti migliorano qualcosa di quello che ha addosso', nonMigliora, 0)
  if (quote) controlla('i pezzi in più servono davvero', rialzi > giri / 2, `${rialzi}/${giri}`)
  uguale('quelli in più alzano il punteggio e hanno un prezzo vero', storti, 0)
}

/* Ogni linguetta che veste ha sempre almeno due pezzi che alzano chiaramente quello che l'eroe ha addosso nel posto (i salti) e
   almeno uno da sogno (otto livelli e più sopra, raro, esorbitante), anche con roba rara addosso (docs/sotterraneo/bottega.md,
   «Salti e sogni»). */
export const schedeChe = (m, eroe) => schedeDi(m, eroeDi(eroe)).filter(x => x.dove && !x.vendi)
export const dellaScheda = (b, m, sc) => b.mercanziaVista(m.chiave).filter(r => COSE[r.chiave].dove && schedaDi(m, r.chiave) === sc)
export const contaRuolo = (qui, ruolo) => qui.filter(r => r.ruolo === ruolo).length
export const raroDi = (eroe, L) => {
  const porta = (dove, ...basi) => basi.find(x => COSE[x].dove === dove && portaLa(eroeDi(eroe), COSE[x]))
  const mano = porta('mano', 'scettro', 'balestra', 'bipenne', 'spadone')
  const r = (b, ...ab) => chiaveDelPezzo(b, L, 'raro', ab)
  return { ...ROBA_VUOTA(), gemme: 50, mano: r(mano, 'att', 'fuoco'), mancina: COSE[mano].mani === 2 ? null : r('scudo-teschio', 'dif', 'vita'),
           corpo: r(porta('corpo', 'manto', 'corazza'), 'dif', 'vita'), collo: r('amuleto-osso', 'dif', 'vita') }
}

export function giroDeiSalti({ eroi = TUTTI_GLI_EROI, livelli = TUTTI_I_LIVELLI } = {}) {
  let linguette = 0, pochiSalti = 0, pochiSogni = 0, sogniBassi = 0, saltiDeboli = 0, instabili = 0, reggibili = 0, nonReggibili = 0
  const guai = []
  for (const eroe of eroi)
    for (const lv of livelli)
      for (const roba of [{ ...ROBA_VUOTA(), gemme: 50 }, raroDi(eroe, lv), { ...robaAttesa(eroe, 3), gemme: 50 }]) {
        const b = new Bottega({ eroe, finite: 3, roba, crescita: crescitaA(eroeDi(eroe), lv), rnd: seminato(lv * 31 + 7) })
        for (const m of MERCANTI.filter(x => x.passo))
          for (const sc of schedeChe(m, eroe)) {
            const qui = dellaScheda(b, m, sc)
            linguette++
            const salti = contaRuolo(qui, 'salto'), sogni = contaRuolo(qui, 'sogno')
            if (salti + sogni < SALTI_MINIMI) { pochiSalti++; guai.push(`${eroe} lv${lv} ${m.chiave}/${sc.chiave}: ${salti} salti e ${sogni} sogni`) }
            if (sogni < SOGNI_MINIMI) { pochiSogni++; guai.push(`${eroe} lv${lv} ${m.chiave}/${sc.chiave}: ${sogni} sogni (sogni)`) }
            for (const r of qui.filter(x => x.ruolo)) {
              const conf = b.confronto(r.chiave)
              if (!(conf.meglio >= Math.max(SALTO_MINIMO, SALTO_RELATIVO * b.valoreDelPosto(conf.dove)))) saltiDeboli++
              if (r.ruolo === 'sogno' && COSE[r.chiave].liv - b.livelloEroe < SOGNO_LIVELLI) sogniBassi++
              if (r.ruolo === 'sogno' && COSE[r.chiave].rarita === 'leggendario') sogniBassi++
              if (b.posso(r.chiave)) reggibili++; else nonReggibili++
            }
            if (dellaScheda(b, m, sc).map(r => r.chiave).join() !== qui.map(r => r.chiave).join()) instabili++
          }
      }
  controlla(`in ${linguette} linguette (${eroi.length} eroi, ${livelli.length} livelli, nudi, con roba rara e attesa) ci sono almeno due pezzi forti`, pochiSalti === 0, guai.slice(0, 6).join(' | '))
  controlla('e ogni linguetta ha il suo sogno', pochiSogni === 0, guai.filter(g => /sogni/.test(g)).slice(0, 6).join(' | '))
  uguale('un salto alza davvero un quarto del posto (e almeno il minimo)', saltiDeboli, 0)
  uguale('un sogno sta otto livelli sopra e non è leggendario', sogniBassi, 0)
  uguale('guardare due volte il banco non lo cambia', instabili, 0)
  controlla('ci sono salti che si indossano subito e salti da meritare', reggibili > 0 && nonReggibili > 0, `${reggibili} / ${nonReggibili}`)
}
