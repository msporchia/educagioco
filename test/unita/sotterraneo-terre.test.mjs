/* Le terre successive del Sotterraneo 3D (docs/sotterraneo/terre-successive.md): la terra di adesso in `terraOra` (manca: la prima),
   il mondo della prima in `mondo` e quelli dopo in `mondi[t]`; la porta si apre ripulite le tombe del vento, fino alla quinta terra;
   passando si porta l'eroe e si ricomincia il mondo, tornando si ritrova la prima com'era; la storia sta nella prima.
   `node test/esegui.mjs sotterraneo-terre --niente-build` */
import { terraDi, laTerra, mondoDellaTerra, conMondo, terreViste, apertaLaPorta, passaTerra, laPorta, terreDaTornare, ULTIMA_TERRA, CHI_APRE_LA_PORTA }
  from '../../src/giochi/sotterraneo/motore/terre.js'
import { dungeonDellAvventura, rifattiDi, conRipulito, dopoLaDiscesa } from '../../src/giochi/sotterraneo/motore/rigenera.js'
import { livelloDelDungeon } from '../../src/giochi/sotterraneo/dati/dungeon-del-mondo.js'
import { TERRE, MONDO_PERCORSO } from '../../src/giochi/sotterraneo/dati/mondo-aperto.js'
import { scheletroDelMondo } from '../../src/giochi/sotterraneo/motore/mondo-percorso.js'
import { mondoDaSalvato } from '../../src/giochi/sotterraneo/motore/mondo-sopra.js'
import { questDi } from '../../src/giochi/sotterraneo/motore/taglie.js'
import { apertura, risposta, voltiDellaTerra } from '../../src/giochi/sotterraneo/motore/dialoghi.js'
import { voltoDelDungeon } from '../../src/giochi/sotterraneo/motore/rigenera.js'
import { guastiDeiDialoghi } from '../../src/giochi/sotterraneo/dati/dialoghi.js'
import { tingi } from '../../src/giochi/sotterraneo/scena3d/mondo/vesti.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const roba = { v: 1, gemme: 40, zaino: ['pozione'], mano: 'spada', mancina: 'scudo-ferro', corpo: 'corazza' }
const crescita = { punti: 1200, abilita: { forza: 2 } }
// un salvataggio di prima delle terre: niente `terraOra` né `mondi`, il mondo della prima terra con le tombe ripulite
const vecchio = () => ({ tappa: 7, libera: true, stelle: { 0: 3 }, missioni: {}, roba, crescita, terra: { dove: [3, 4] },
  mondo: { firma: 'x', nebbia: 'AAAA', pietre: ['villaggio', 'zona:prati'], giro: 4, quest: { stati: { 't:villaggio:caccia:lupo:1': { stato: 'presa' } } },
           dungeon: { tombe: { rifatti: 1 }, cerchio: { rifatti: 2 } } } })

/* ══════════ 1. dove si è: i salvataggi di oggi sono la prima terra ══════════ */
{
  uguale('niente avventura: la prima', terraDi(null), 1)
  uguale('niente terraOra: la prima', terraDi(vecchio()), 1)
  uguale('il campo `terra` della terra dipinta non conta', terraDi({ terra: { dove: [1, 1] } }), 1)
  uguale('terraOra storta: la prima', terraDi({ terraOra: 'boh' }), 1)
  uguale('terraOra 3', terraDi({ terraOra: 3 }), 3)
  uguale('mai oltre la quinta', terraDi({ terraOra: 9 }), ULTIMA_TERRA)
  uguale('le terre sono cinque', ULTIMA_TERRA, 5)
  uguale('una per riga della scheda', TERRE.length, MONDO_PERCORSO.terre)
  const a = vecchio()
  uguale('il mondo della prima è `mondo`, lo stesso oggetto', mondoDellaTerra(a), a.mondo)
  uguale('una terra mai vista non ha mondo', mondoDellaTerra(a, 2), null)
  uguale('fin dove si è arrivati: la prima', terreViste(a), 1)
  uguale('scrivere nella prima scrive `mondo`', JSON.stringify(conMondo(a, { giro: 5 })), JSON.stringify({ mondo: { giro: 5 } }))
}

/* ══════════ 2. la porta: si apre ripulite le tombe del vento, fino alla quinta ══════════ */
{
  uguale('chi apre la porta', CHI_APRE_LA_PORTA, 'tombe')
  const a = vecchio()
  controlla('tombe ripulite: aperta', apertaLaPorta(a))
  const chiusa = { ...a, mondo: { ...a.mondo, dungeon: { cerchio: { rifatti: 2 } } } }
  controlla('tombe mai ripulite: chiusa', !apertaLaPorta(chiusa))
  controlla('senza mondo: chiusa', !apertaLaPorta({}))
  uguale('chiusa non si passa', passaTerra(chiusa), null)
  // ripulite davvero: dopoLaDiscesa delle tombe scrive il rifatti che apre la porta
  const t = dungeonDellAvventura(chiusa, 'tombe', { eroe: 'cavaliere', terra: 1 }).tappa
  const dopo = dopoLaDiscesa(chiusa.mondo, t, { vinta: true, grossoBattuto: true })
  controlla('battuto il mietitore, la porta si apre', apertaLaPorta({ ...chiusa, ...conMondo(chiusa, dopo.mondo, 1) }))
  const p = laPorta(a)
  uguale('la porta dice dove porta', p.dopo && p.dopo.nome, TERRE[1].nome)
  uguale('e di dove si è', p.qui.nome, TERRE[0].nome)
  controlla('la prima non è l\'ultima', !p.ultima)
  // nella quinta la porta resta chiusa, anche con le tombe ripulite
  const quinta = { ...a, terraOra: 5, mondi: { 2: {}, 3: {}, 4: {}, 5: { dungeon: { tombe: { rifatti: 3 } } } } }
  controlla('nella quinta, chiusa', !apertaLaPorta(quinta))
  uguale('e non si va alla sesta', passaTerra(quinta, 6), null)
  controlla('la quinta è l\'ultima', laPorta(quinta).ultima)
  uguale('nessuna terra dopo la quinta', laPorta(quinta).dopo, null)
}

/* ══════════ 3. passare: l'eroe viene, il mondo ricomincia ══════════ */
const a = vecchio()
const passo = passaTerra(a)
const b = { ...a, ...passo }
{
  uguale('si scrive solo la terra di adesso', JSON.stringify(passo), JSON.stringify({ terraOra: 2 }))
  uguale('adesso si è nella seconda', terraDi(b), 2)
  uguale('l\'eroe è lo stesso: la roba', b.roba, a.roba)
  uguale('la crescita', b.crescita, a.crescita)
  uguale('le missioni dei personaggi', b.missioni, a.missioni)
  uguale('la storia non si muove', b.tappa, 7)
  uguale('né le stelle', JSON.stringify(b.stelle), JSON.stringify({ 0: 3 }))
  const m2 = mondoDellaTerra(b)
  uguale('la seconda terra non ha ancora un mondo', m2, null)
  uguale('i dungeon ripuliti ricominciano', rifattiDi(m2, 'cerchio'), 0)
  uguale('le tombe pure: la porta di qui è chiusa', apertaLaPorta(b), false)
  uguale('le taglie ricominciano', Object.keys(questDi(m2).stati || {}).length, 0)
  // il mondo nuovo, messo in forma per la mappa della seconda terra: nebbia nuova, nessuna pietra accesa, nessuna strada della storia
  const m = scheletroDelMondo(MONDO_PERCORSO.seme, { terra: 2 })
  const s = mondoDaSalvato(m, m2, [])
  stessaLista('nessuna pietra accesa', s.pietre, [])
  controlla('è un mondo nuovo', s.nuovo)
  uguale('la prima terra resta com\'era', mondoDellaTerra(b, 1), a.mondo)
  // quello che si scrive nella seconda va in `mondi[2]`, e la prima non si tocca
  const scritto = conMondo(b, { giro: 1, pietre: ['villaggio'] })
  stessaLista('si scrive `mondi`', Object.keys(scritto), ['mondi'])
  const c = { ...b, ...scritto }
  uguale('il mondo della seconda', mondoDellaTerra(c).giro, 1)
  uguale('la prima com\'era', mondoDellaTerra(c, 1), a.mondo)
  uguale('fin dove si è arrivati: la seconda', terreViste(c), 2)
  // salvato e riletto (le chiavi di `mondi` diventano stringhe): uguale
  const riletto = JSON.parse(JSON.stringify(c))
  uguale('riletto, la terra', terraDi(riletto), 2)
  uguale('riletto, il mondo della seconda', mondoDellaTerra(riletto).giro, 1)
  // ripulite le tombe nella seconda, si va alla terza
  const d = { ...c, ...conMondo(c, conRipulito(mondoDellaTerra(c), 'tombe')) }
  controlla('ripulite le tombe nella seconda, la porta si apre', apertaLaPorta(d))
  uguale('e porta alla terza', passaTerra(d).terraOra, 3)
  uguale('ripulite nella seconda non vuol dire nella prima di nuovo', rifattiDi(mondoDellaTerra(d, 1), 'tombe'), 1)
}

/* ══════════ 4. tornare: la prima terra com'era, arrivando in piazza ══════════ */
{
  const indietro = passaTerra(b, 1)
  uguale('si torna a una terra già vista', indietro.terraOra, 1)
  stessaLista('si scrive la terra e il mondo di là', Object.keys(indietro), ['terraOra', 'mondo'])
  const c = { ...b, ...indietro }
  const { dove, ...resto } = mondoDellaTerra(c), { dove: _d, ...prima } = a.mondo
  uguale('la prima com\'era', JSON.stringify(resto), JSON.stringify(prima))
  uguale('coi suoi dungeon ripuliti', rifattiDi(mondoDellaTerra(c), 'cerchio'), 2)
  uguale('si arriva in piazza, non dove la si era lasciata', JSON.stringify(dove), JSON.stringify({ arrivo: true }))
  uguale('non si salta a una terra mai vista', passaTerra(b, 4), null)
  uguale('né si passa nella stessa', passaTerra(b, 2), null)
}

/* ══════════ 4b. il viaggio indietro dalla pietra del villaggio, col salvataggio ══════════ */
{
  // arrivati nella terza: la seconda e la prima hanno il loro mondo
  const due = { giro: 2, pietre: ['villaggio', 'zona:bosco'], dove: { x: 40, y: 60 }, dungeon: { tombe: { rifatti: 1 }, cava: { rifatti: 1 } } }
  const tre = { giro: 1, pietre: ['villaggio'], dove: { x: 5, y: 6 } }
  const c = JSON.parse(JSON.stringify({ ...a, terraOra: 3, mondi: { 2: due, 3: tre } }))   // salvato e riletto: le chiavi sono stringhe
  uguale('fin dove si è arrivati: la terza', terreViste(c), 3)
  stessaLista('la pietra riporta alla prima e alla seconda', terreDaTornare(c).map(t => t.terra), [1, 2])
  stessaLista('laPorta le dice', laPorta(c).altre.map(t => t.villaggio), [TERRE[0].villaggio, TERRE[1].villaggio])
  stessaLista('nella prima, mai stati altrove: nessuna', terreDaTornare(a), [])
  // dalla terza alla seconda: si scrive `mondi` (con la terza com'era), e si arriva nella piazza di Borgo d'autunno
  const p = passaTerra(c, 2)
  stessaLista('si scrive la terra e `mondi`', Object.keys(p), ['terraOra', 'mondi'])
  const d = JSON.parse(JSON.stringify({ ...c, ...p }))
  uguale('si è nella seconda', terraDi(d), 2)
  uguale('il suo giro', mondoDellaTerra(d).giro, 2)
  uguale('le sue pietre', mondoDellaTerra(d).pietre.join(), 'villaggio,zona:bosco')
  uguale('i suoi dungeon ripuliti', rifattiDi(mondoDellaTerra(d), 'cava'), 1)
  uguale('si arriva in piazza', JSON.stringify(mondoDellaTerra(d).dove), JSON.stringify({ arrivo: true }))
  uguale('la terza resta com\'era', JSON.stringify(mondoDellaTerra(d, 3)), JSON.stringify(tre))
  uguale('la prima pure', mondoDellaTerra(d, 1).giro, a.mondo.giro)
  uguale('fin dove si è arrivati resta la terza', terreViste(d), 3)
  stessaLista('e dalla seconda si torna alla prima o alla terza', terreDaTornare(d).map(t => t.terra), [1, 3])
  // la porta della seconda (tombe ripulite lì) porta alla terza già vista: anche lì si arriva in piazza
  uguale('la porta verso una terra vista', JSON.stringify(mondoDellaTerra({ ...d, ...passaTerra(d) }).dove), JSON.stringify({ arrivo: true }))
  // il mondo di arrivo si rimette in forma come sempre: la firma diversa fa un mondo nuovo con le pietre di prima
  const m = scheletroDelMondo(MONDO_PERCORSO.seme, { terra: 2 })
  const s = mondoDaSalvato(m, mondoDellaTerra(d), [])
  controlla('le pietre accese restano', s.pietre.includes('zona:bosco'))
  controlla('l\'eroe non ha posto: si parte dalla piazza', !(s.dove && Number.isInteger(s.dove.x)))
  // la porta della terza è chiusa (tombe da ripulire) e non si salta oltre
  uguale('mai oltre le terre viste', passaTerra(c, 4), null)
}

/* ══════════ 5. la storia sta nella prima terra ══════════ */
{
  const nuovo = { tappa: 0, stelle: {}, missioni: {} }
  controlla('nella prima, la cripta è la storia', dungeonDellAvventura(nuovo, 0, { eroe: 'mago', terra: 1 }).storia)
  const d = dungeonDellAvventura({ ...nuovo, terraOra: 2 }, 0, { eroe: 'mago', terra: 2, mondo: null })
  controlla('nella seconda, la cripta è ripetuta', !d.storia)
  controlla('con la potenza di una zona: niente stelle né storia', d.tappa.potenza > 0)
  uguale('al suo livello più 14', d.livello, livelloDelDungeon('altare', 2))
  uguale('il salto è di 14', livelloDelDungeon('altare', 2) - livelloDelDungeon('altare', 1), MONDO_PERCORSO.salto)
  uguale('il seme della seconda terra', d.tappa.delMondo.terra, 2)
  const fine = dopoLaDiscesa(null, d.tappa, { vinta: true, grossoBattuto: true })
  controlla('vinta nella seconda: ripulita, ma niente storia', fine.ripulito && !fine.storia)
}

/* ══════════ 6. la mappa è la stessa, la porta c'è, i mostri più su ══════════ */
{
  const uno = scheletroDelMondo(MONDO_PERCORSO.seme, { terra: 1 }), due = scheletroDelMondo(MONDO_PERCORSO.seme, { terra: 2 })
  uguale('la stessa firma', due.firma, uno.firma)
  uguale('una porta delle terre', due.posti.filter(p => p.tipo === 'terre').length, 1)
  uguale('nella landa', due.posti.find(p => p.tipo === 'terre').zona, 'landa')
  stessaLista('le fasce più su di 14', due.zone.map(z => z.fascia[0]), uno.zone.map(z => z.fascia[0] + 14))
  uguale('la tinta della seconda', due.terraDi.nome, TERRE[1].nome)
}

/* ══════════ 7b. il minatore racconta i volti nuovi ══════════ */
{
  const ctx = { tappe: [], stati: {}, forza: 1, terra: 2 }
  uguale('nella prima terra niente volti', voltiDellaTerra({ ...ctx, terra: 1 }).length, 0)
  const v = voltiDellaTerra(ctx)
  stessaLista('quelli della zona per te: i prati', [...new Set(v.map(p => p.chiave))], ['altare', 'cantine'])
  controlla('col volto della seconda terra', v.some(p => p.dato === 'volto-dove' && p.testo.startsWith(voltoDelDungeon('altare', 0, 2).nome)))
  controlla('e diverso da quello della prima', voltoDelDungeon('altare', 0, 2).nome !== voltoDelDungeon('altare', 0, 1).nome)
  // il volto della volta già ripulita, se il gioco lo dà
  const dungeon = [{ chiave: 'altare', nome: 'La cripta X', annuncio: 'Una cosa nuova.' }]
  controlla('il volto dei dungeon del gioco', voltiDellaTerra({ ...ctx, dungeon }).some(p => p.dato === 'volto-dove' && p.testo.startsWith('La cripta X:')))
  // la prima volta in una terra dopo: il minatore li racconta, senza presentarsi
  const ap = apertura('minatore', ctx, { nuovaTerra: true })
  uguale('la prima pagina dice che le discese hanno un\'altra faccia', ap[0].dato, 'volti')
  controlla('poi i volti', ap.some(p => p.dato === 'volto'))
  controlla('dopo, non più', !apertura('minatore', ctx).some(p => p.dato === 'volto'))
  controlla('nella prima terra mai', !apertura('minatore', { ...ctx, terra: 1 }, { nuovaTerra: true }).some(p => p.dato === 'volti'))
  // «Cosa c'è laggiù?» nelle terre dopo: i volti, le tombe e la porta
  const r = risposta('minatore', 'racconta', ctx)
  controlla('laggiù: le tombe di questa terra', r.some(p => p.chiave === 'tombe' && p.dato === 'volto'))
  controlla('e chi le batte apre la porta', r.some(p => p.dato === 'volti'))
  controlla('nella quinta la porta non si riapre', !risposta('minatore', 'racconta', { ...ctx, terra: 5 }).some(p => p.dato === 'volti'))
  controlla('nella prima, il racconto di sempre', risposta('minatore', 'racconta', { ...ctx, terra: 1 }).every(p => p.dato === 'racconto'))
  // la riga del dove è come quella della strada del minatore («nome: luogoDi»); i volti vanno a pagine
  controlla('nessuna pagina del volto troppo lunga', [...v, ...r].filter(p => p.dato !== 'volto-dove').every(p => p.testo.length <= 150))
  uguale('i dialoghi senza guasti', guastiDeiDialoghi().join(' | '), '')
}

/* ══════════ 7. chi annuncia la porta, e la tinta ══════════ */
{
  const ctx = { terre: true, tappe: [], stati: {} }
  controlla('il minatore dice la porta', apertura('minatore', ctx).some(p => p.dato === 'terre'))
  controlla('il capitano anche', apertura('capitano', ctx).some(p => p.dato === 'terre'))
  controlla('porta chiusa: niente', !apertura('minatore', { ...ctx, terre: false }).some(p => p.dato === 'terre'))
  stessaLista('la prima terra non cambia colore', tingi(laTerra(1)), [1, 1, 1])
  controlla('la seconda sì (il cielo d\'autunno è più caldo)', tingi(laTerra(2))[0] > 1)
  tingi(laTerra(1))
}

riassunto('Le terre successive')
