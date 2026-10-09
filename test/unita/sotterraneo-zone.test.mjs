/* Le zone (docs/sotterraneo/zone.md): finita la storia ogni discesa è
   una zona con una fascia di livelli fissa, che tiene finché l'eroe non
   la supera di tanto; allora rinasce rossa sopra la più alta, con un
   nome nuovo, e il minatore la racconta. Qui: le fasce alla nascita, i
   quattro gruppi sempre pieni, i colori con gli esempi del documento, la
   rinascita, la notizia, com'è fatta una zona (più piani, la stessa forma,
   i mostri e il bottino del suo livello), la sosta che la rifà uguale,
   l'esperienza (un quarto nelle grigie, la curva oltre la storia).
   `node test/esegui.mjs sotterraneo-zone --niente-build` */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { ORDINE_DELLE_ZONE, VOLTI, voltoDi, zonaPotenziata, zonaDi, forzaDellaZona, spintaDellaZona, guastiDelleZone,
         DETTI_DEL_COLORE, PIANI_DELLA_ZONA, NASCITA, GIRO, LARGA, ESP_GRIGIA, PRIMA_NOTIZIA, ANNUNCIO_IN_CODA }
  from '../../src/giochi/sotterraneo/dati/zone.js'
import { fasciaDi, coloreDellaFascia, coloreNellaStoria, coloreDi, disposizioneDi, potenzaDi, livelloDellaZona, zoneDi,
         notiziaDi, gradinoDi, COLORI, robaAttesaA, crescitaAttesaA } from '../../src/giochi/sotterraneo/motore/zone.js'
import { LIVELLI_ATTESI } from '../../src/giochi/sotterraneo/dati/storia.js'
import { sogliaDi, espDi } from '../../src/giochi/sotterraneo/dati/livelli.js'
import { MOSTRI } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { scenarioDi } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { Corredo } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { robaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { gioca } from '../../src/giochi/sotterraneo/motore/banco.js'
import { scrivi, leggi, dice } from '../../src/giochi/sotterraneo/motore/sosta.js'
import { strada } from '../../src/giochi/sotterraneo/motore/dialoghi.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const indiceDi = k => CAMPAGNA.findIndex(t => t.chiave === k)
const detta = (E, chiavi = null) => disposizioneDi(E).filter(z => !chiavi || chiavi.includes(z.chiave))
  .map(z => `${z.chiave} ${z.da}-${z.a} ${z.colore}`).join(' | ')

/* ══════════ 1. i dati stanno in piedi ══════════ */
uguale('nessun guasto nelle zone', guastiDelleZone().join(' · '), '')
uguale('l\'ordine passa da ogni discesa una volta', [...ORDINE_DELLE_ZONE].sort().join(), CAMPAGNA.map(t => t.chiave).sort().join())
{
  // lo scenario resta fisso per qualche rinascita di fila: tre blocchi, non sette cambi
  const scenari = ORDINE_DELLE_ZONE.map(k => CAMPAGNA[indiceDi(k)].scenario)
  uguale('lo scenario cambia due volte nel giro (cantine, fornace, cripta)', scenari.filter((s, i) => i && s !== scenari[i - 1]).length, 2)
  uguale('le prime sono le cantine', scenari.slice(0, 3).join(), 'cantine,cantine,cantine')
  controlla('ogni zona ha almeno tre volti', Object.values(VOLTI).every(v => v.length >= 3))
  uguale('il volto gira: dopo l\'ultimo torna il primo', voltoDi('torre', VOLTI.torre.length).nome, VOLTI.torre[0].nome)
}

/* ══════════ 2. le fasce alla nascita, e i quattro gruppi ══════════
   L'eroe del 12 che finisce la storia: 6–9 e 8–11 grigie, 10–13 e 12–15 verdi, 14–17 e 16–19 arancio, 18–21 rossa */
uguale('al 12, la disposizione del documento', detta(12),
       'cantine 6-9 grigio | gallerie 8-11 grigio | labirinto 10-13 verde | torre 12-15 verde | ' +
       'fondo 14-17 arancio | cisterna 16-19 arancio | altare 18-21 rosso')
uguale('una zona nasce dove dice NASCITA', fasciaDi('torre', 12).da, NASCITA.torre)
for (let E = 8; E <= 90; E++) {
  const d = disposizioneDi(E)
  const quanti = c => d.filter(z => z.colore === c).length
  if (!controlla(`al livello ${E}: due grigie, due verdi, due arancio, una rossa`,
                 [quanti('grigio'), quanti('verde'), quanti('arancio'), quanti('rosso')].join() === '2,2,2,1', detta(E))) break
  if (!controlla(`al livello ${E}: le fasce a due a due, una dopo l'altra`, d.every((z, i) => !i || z.da === d[i - 1].da + 2), detta(E))) break
}

/* ══════════ 3. la fascia è fissa, poi rinasce rossa in cima ══════════ */
{
  // la torre (12–15) resta 12–15 dal livello 8 al 19: non segue l'eroe
  const torre = [8, 12, 15, 16, 19].map(E => fasciaDi('torre', E).da)
  uguale('la torre resta 12–15 finché l\'eroe sale dal 8 al 19', torre.join(), '12,12,12,12,12')
  uguale('e cambia colore: rossa al 7, arancio all\'8, verde al 12, grigia al 16',
         [7, 8, 12, 16].map(E => coloreDellaFascia(12, E)).join(), 'rosso,arancio,verde,grigio')
  // al 20 l'eroe la supera di più di quattro livelli: rinasce
  const dopo = fasciaDi('torre', 20)
  uguale('al 20 la torre rinasce: 26–29', `${dopo.da}-${dopo.a}`, '26-29')
  const altre = disposizioneDi(20).filter(z => z.chiave !== 'torre').map(z => z.da)
  uguale('due livelli sopra la più alta delle altre', dopo.da - Math.max(...altre), 2)
  uguale('ed è la rossa', coloreDellaFascia(dopo.da, 20), 'rosso')
  uguale('con un nome nuovo', voltoDi('torre', dopo.volta).nome, VOLTI.torre[1].nome)
  uguale('salita di un giro intero', dopo.da - 12, GIRO)
  // dal 12 al 14: la scalinata (6–9) si fa da parte, e la cripta diventa arancio
  uguale('al 14, la scalinata superata è la rossa nuova', detta(14, ['cantine', 'altare']), 'altare 18-21 arancio | cantine 20-23 rosso')
}

/* ══════════ 4. i colori, con gli esempi del documento ══════════
   Fascia 16–19: rossa fino all'11, arancio dal 12 al 15, verde dal 16 al 19, grigia dal 20 al 23; al 24 rinasce */
for (const [eroe, colore] of [[11, 'rosso'], [12, 'arancio'], [15, 'arancio'], [16, 'verde'], [19, 'verde'], [20, 'grigio'], [23, 'grigio']])
  uguale(`fascia 16–19, eroe del ${eroe}: ${colore}`, coloreDellaFascia(16, eroe), colore)
uguale('la cisterna (16–19) al 24 non c\'è più: rinasce 30–33', `${fasciaDi('cisterna', 23).da}→${fasciaDi('cisterna', 24).da}`, '16→30')
uguale('ogni colore che non è verde ha chi lo dice', COLORI.filter(c => c !== 'verde' && !DETTI_DEL_COLORE[c]).join(), '')
controlla('la guardia della rossa non fa passare', /non ti faccio passare/.test(DETTI_DEL_COLORE.rosso.detto))

// nella storia restano i gradini: 1 · 2 · 3 · 5 · 7 · 8 · 10 · 12, due sopra rosso, uno sopra arancio, due sotto grigio
uguale('i gradini della storia', [1, 2, 3, 4, 5, 7, 8, 10, 12].map(gradinoDi).join(), '0,1,2,2,3,4,5,6,7')
for (const [zona, eroe, colore, perche] of [
  [1, 1, 'verde', 'la cripta per chi comincia'],
  [2, 1, 'arancio', 'la scalinata al livello 1: un gradino sopra'],
  [3, 1, 'rosso', 'la torre al livello 1: due gradini sopra'],
  [7, 5, 'arancio', 'la scala sommersa al 5'],
  [7, 4, 'rosso', 'la scala sommersa al 4'],
  [10, 12, 'verde', 'la miniera, appena finita'],
]) uguale(`nella storia, ${perche}: ${colore}`, coloreNellaStoria(zona, eroe), colore)

/* ══════════ 5. nella storia e dopo: potenza, colore, notizia ══════════ */
{
  const storia = { tappa: 4, libera: false, stelle: {} }
  uguale('nella storia nessuna discesa è una zona', CAMPAGNA.map((_, k) => potenzaDi(storia, k, 9)).filter(Boolean).length, 0)
  uguale('il livello è quello atteso', livelloDellaZona(storia, 3, 9), LIVELLI_ATTESI[3])
  uguale('e il colore dai gradini: la torre al livello 1 è rossa', coloreDi(storia, indiceDi('torre'), 1), 'rosso')
  uguale('nella storia non c\'è notizia', notiziaDi(storia, 9), null)

  const finita = { tappa: 7, libera: true, stelle: {} }
  uguale('finita la storia la torre ha la sua fascia', potenzaDi(finita, indiceDi('torre'), 12), 12)
  uguale('e il suo colore', coloreDi(finita, indiceDi('torre'), 12), 'verde')
  uguale('la cripta al 12 è la rossa', coloreDi(finita, indiceDi('altare'), 12), 'rosso')
  const n = notiziaDi(finita, 12)
  uguale('la notizia è la zona più alta: la cripta', `${n.chiave}:${n.da}`, 'altare:18')
  uguale('mai sentita', n.sentita, false)
  controlla('la prima volta dice cosa è cambiato, poi la sua storia, poi che non si passa',
            n.detto.startsWith(PRIMA_NOTIZIA) && n.detto.includes(VOLTI.altare[0].annuncio) && n.detto.endsWith(ANNUNCIO_IN_CODA), n.detto)
  const sentita = { ...finita, zone: { sentita: n.id } }
  uguale('sentita, resta sentita salendo di un livello', notiziaDi(sentita, 13).sentita, true)
  const nuova = notiziaDi(sentita, 14)
  uguale('al 14 la scalinata rinasce: una notizia nuova', `${nuova.chiave}:${nuova.da}`, 'cantine:20')
  uguale('da raccontare', nuova.sentita, false)
  controlla('senza la presentazione, col nome nuovo', !nuova.detto.startsWith(PRIMA_NOTIZIA) && nuova.nome === VOLTI.cantine[1].nome, nuova.detto)
  // lo stato delle zone che si svegliavano (8/10) vale come mai sentito, senza azzerare niente
  const vecchio = { ...finita, zone: { n: 3, livelli: { cantine: 13 }, sentita: true } }
  uguale('lo stato di prima si rilegge come mai sentito', zoneDi(vecchio).sentita, null)
  uguale('e la cantina vinta al 13 di prima prende la sua fascia', potenzaDi(vecchio, indiceDi('cantine'), 12), 6)
  {
    // il minatore la racconta per prima cosa, dice dove sta e poi le zone verdi; sentita, dice solo le verdi
    const tappe = CAMPAGNA.map((t, i) => ({ ...zonaDi(i, potenzaDi(finita, i, 12)), indice: i, fatta: true,
                                            colore: coloreDi(finita, i, 12) }))
    const pagine = strada({ tappe, stati: {}, abisso: true, annuncio: { chiave: n.chiave, detto: n.detto, sentita: false } })
    uguale('nel dialogo del minatore la prima pagina è l\'annuncio', pagine[0].dato, 'annuncio')
    controlla('poi la strada per la zona nuova', pagine.some(p => p.dato === 'detto' && p.testo.startsWith(VOLTI.altare[0].nome)),
              pagine.map(p => p.testo).join(' | '))
    uguale('e le due verdi', pagine.filter(p => p.dato === 'verde').length, 2)
    const poi = strada({ tappe, stati: {}, abisso: true, annuncio: { chiave: n.chiave, detto: n.detto, sentita: true } })
    uguale('sentita, niente annuncio', poi.filter(p => p.dato === 'annuncio').length, 0)
    controlla('ma le verdi sì', poi[0].dato === 'verde' && poi.some(p => p.testo.includes(VOLTI.labirinto[0].nome.slice(3))),
              poi.map(p => p.testo).join(' | '))
  }
  // scesi dentro: la sosta tiene la potenza di quando si è scesi, anche se intanto la zona è rinata
  const giu = { ...finita, sosta: { tappa: indiceDi('cantine'), potenza: 6 } }
  uguale('lasciata a metà, la zona resta quella di quando si è scesi', potenzaDi(giu, indiceDi('cantine'), 14), 6)
  uguale('le altre seguono la loro fascia', potenzaDi(giu, indiceDi('torre'), 14), 12)
}

/* ══════════ 6. com'è fatta una zona ══════════ */
for (const [k, t] of CAMPAGNA.entries()) {
  const z = zonaPotenziata(k, 16)
  controlla(`${t.chiave}: zona corta, cinque o sei piani`, z.piani >= PIANI_DELLA_ZONA && z.piani <= 6, String(z.piani))
  uguale(`${t.chiave}: la stessa discesa (chiave e scenario)`, `${z.chiave}|${scenarioDi(z, 3)}`, `${t.chiave}|${scenarioDi(t, 0)}`)
  uguale(`${t.chiave}: il livello del posto è la potenza, la fascia quattro livelli`, `${z.livello}|${z.potenza}|${z.fascia.join('-')}`, '16|16|16-19')
  controlla(`${t.chiave}: più forte che al 12`, forzaDellaZona(16, t.chiave) > forzaDellaZona(12, t.chiave) &&
            spintaDellaZona(16) > spintaDellaZona(12))
  uguale(`${t.chiave}: il nome della sua volta`, zonaPotenziata(k, NASCITA[t.chiave] + GIRO).nome, VOLTI[t.chiave][1].nome)
}
uguale('zonaDi senza potenza è la discesa della storia', zonaDi(2), CAMPAGNA[2])
uguale('e l\'abisso resta l\'abisso', zonaDi(-1).abisso, true)
{
  const k = indiceDi('torre')
  const z = zonaPotenziata(k, 16)
  const c = new Corsa(z, { seme: 31, eroe: 'cavaliere', roba: robaAttesaA('cavaliere', 16), crescita: crescitaAttesaA('cavaliere', 16) })
  uguale('una zona pesca il bottino come l\'abisso, non la riga della storia', c.indice, -1)
  uguale('il bottino è del suo livello', c.livelloDelBottino, 16)
  const storia = new Corsa(CAMPAGNA[k], { seme: 31, eroe: 'cavaliere', roba: robaAttesa('cavaliere', k) })
  const ossa = cc => Math.max(...cc.livello.robe.filter(r => r.che === 'mostro').map(r => r.ossa))
  controlla('i mostri hanno più ossa che nella storia', ossa(c) > 2 * ossa(storia), `${ossa(c)} contro ${ossa(storia)}`)
  c.piano = z.piani - 1
  c.nuovoPiano()
  const g = c.livello.robe.find(r => r.grosso)
  uguale('in fondo c\'è il suo mostro grosso', g && g.grosso, 'fiammetta')
  controlla('e porta la chiave', !!(g && g.chiave))
  const domande = c.colpiPer(g)
  controlla('il grosso si batte in poche risposte, non in un compito', domande >= 5 && domande <= 16, String(domande))
}

/* ══════════ 7. la sosta rifà la stessa zona ══════════ */
{
  const k = indiceDi('labirinto')
  const L = NASCITA.labirinto + GIRO   // la seconda volta: 24
  const z = zonaPotenziata(k, L)
  const roba = robaAttesaA('nano', L)
  const c = new Corsa(z, { seme: 77, eroe: 'nano', roba, crescita: crescitaAttesaA('nano', L) })
  c.piano = 2
  c.nuovoPiano()
  const s = scrivi(c, k)
  uguale('la sosta scrive la potenza', s.potenza, L)
  const d = leggi(s, zonaDi(s.tappa, s.potenza), roba, [], crescitaAttesaA('nano', L))
  controlla('e si rilegge', !!d)
  uguale('nello stesso piano, con le stesse cose', d && JSON.stringify(d.livello.robe.map(r => [r.che, r.x, r.y, r.ossa])),
         JSON.stringify(c.livello.robe.map(r => [r.che, r.x, r.y, r.ossa])))
  uguale('cinque piani, non tre', d && d.quantiPiani, 5)
  uguale('la carta «riprendi» dice il nome di quella volta', dice(s, CAMPAGNA).nome, VOLTI.labirinto[1].nome)
  uguale('e i suoi piani', dice(s, CAMPAGNA).piani, 5)
  const vecchia = { ...s }
  delete vecchia.potenza
  uguale('una sosta senza potenza resta la discesa della storia', dice(vecchia, CAMPAGNA).nome, CAMPAGNA[k].nome)
}

/* ══════════ 8. l'esperienza ══════════ */
{
  // dentro la storia la curva è quella tarata; oltre, ogni livello costa una retta in più, non un cubo
  uguale('le soglie della storia non cambiano', [2, 5, 8, 10, 12].map(sogliaDi).join(), '30,204,504,774,1100')
  const salto = n => sogliaDi(n + 1) - sogliaDi(n)
  uguale('oltre il 12 il costo di un livello cresce in linea retta', salto(30) - salto(29), salto(20) - salto(19))
  nota(`un livello costa: al 12 ${salto(12)}, al 16 ${salto(16)}, al 20 ${salto(20)}, al 30 ${salto(30)}, al 40 ${salto(40)}`)

  // nella zona grigia un mostro dà un quarto: la grigia è facile, e non deve rendere come la verde
  const z = zonaPotenziata(indiceDi('torre'), 14)
  const esp = eroeA => {
    const c = new Corsa(z, { seme: 5, eroe: 'cavaliere', rnd: seminato(5), crescita: crescitaAttesaA('cavaliere', eroeA) })
    const m = c.livello.robe.find(r => r.che === 'mostro' && !r.chiave)
    const prima = c.crescita.esp
    c.cade(m)
    return { presa: c.crescita.esp - prima, piena: espDi(MOSTRI[m.tipo], c.livelloQui) }
  }
  const verde = esp(16), grigia = esp(18)
  uguale('nella verde il mostro dà la sua esperienza', verde.presa, verde.piena)
  uguale('nella grigia un quarto', grigia.presa, Math.max(1, Math.round(grigia.piena * ESP_GRIGIA)))

  // il passo: una zona verde vinta, dal fondo della fascia, vale più o meno un livello (le misure su tutte le zone)
  for (const L of [14, 24, 34]) {
    const k = indiceDi('torre')
    const cr = crescitaAttesaA('cavaliere', L)
    const g = gioca(zonaPotenziata(k, L), { seme: 41, bravura: 0.8, eroe: 'cavaliere', crescita: cr, roba: robaAttesaA('cavaliere', L) })
    const livelli = (g.corsa.crescita.esp - cr.esp) / salto(L)
    controlla(`una torre verde vinta al ${L} vale più o meno un livello`, g.esito.vinta && livelli >= 0.7 && livelli <= 2,
              `${g.esito.vinta ? 'vinta' : 'persa'}, ${livelli.toFixed(2)} livelli`)
  }
}

/* ══════════ 9. la roba attesa oltre la storia ══════════ */
{
  const a = new Corredo({ eroe: 'elfa', roba: robaAttesaA('elfa', 12), crescita: crescitaAttesaA('elfa', 12) })
  const b = new Corredo({ eroe: 'elfa', roba: robaAttesaA('elfa', 20), crescita: crescitaAttesaA('elfa', 20) })
  controlla('al 20 si picchia e si regge più che al 12', b.att > a.att && b.vitaConLaRoba > a.vitaConLaRoba,
            `${a.att}/${a.vitaConLaRoba} → ${b.att}/${b.vitaConLaRoba}`)
  uguale('con le pozioni dell\'abisso', robaAttesaA('elfa', 20).zaino.length, 6)
  nota(`elfa attesa: al 12 ⚔️${a.att} 🛡️${a.dif} ❤️${a.vitaConLaRoba}, al 20 ⚔️${b.att} 🛡️${b.dif} ❤️${b.vitaConLaRoba}`)
}
uguale('LARGA è quattro livelli, come nel documento', LARGA, 4)

riassunto('le zone')
