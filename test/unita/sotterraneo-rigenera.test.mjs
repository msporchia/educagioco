/* I dungeon che si rigenerano (docs/sotterraneo/dungeon-che-si-rigenerano.md): nel Sotterraneo 3D lo stesso (eroe, dungeon, rifatti)
   è la stessa forma e lo stesso mazzo, ripulito è un altro; ripulito vuol dire battuto il grosso e usciti dalla scala in fondo; la
   prima volta delle sette è la storia, poi è ripetibile; i sei nuovi non toccano storia né stelle, e hanno il loro mostro grosso.
   `node test/esegui.mjs rigenera --niente-build` */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { GROSSI, GROSSO_DELLA_DISCESA, figuraDelGrosso, guastiDeiGrossi, grossoDi } from '../../src/giochi/sotterraneo/dati/grossi.js'
import { DEI_GROSSI } from '../../src/giochi/sotterraneo/dati/pezzi.js'
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { MOSTRI } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { DUNGEON_NUOVI, LIVELLO_DEL_DUNGEON, ZONE_DEL_PERCORSO, zonaDelDungeon, livelloDelDungeon, SALTO_DELLA_TERRA, PIANI_DEI_NUOVI }
  from '../../src/giochi/sotterraneo/dati/dungeon-del-mondo.js'
import { semeDelDungeon, tappaDelMondo, ripulito, rifattiDi, conRipulito, dungeonDellAvventura, tappaDellaSosta, dopoLaDiscesa,
         mazzoDellaZona, abitantiDellaVolta, guastiDeiDungeon, CHIAVI_DEI_DUNGEON } from '../../src/giochi/sotterraneo/motore/rigenera.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { gioca } from '../../src/giochi/sotterraneo/motore/banco.js'
import { robaAttesaA, crescitaAttesaA } from '../../src/giochi/sotterraneo/motore/zone.js'
import { scrivi, leggi, dice } from '../../src/giochi/sotterraneo/motore/sosta.js'
import { vintaNellAvventura, avventuraDi } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const firma = c => c.livello.robe.map(r => `${r.che}:${r.x},${r.y}:${r.tipo || ''}`).join('|')

/* ══════════ 1. i dati: tredici dungeon, sei nuovi, sei boss ══════════ */
{
  stessaLista('nessun guasto nei dungeon', guastiDeiDungeon(), [])
  stessaLista('nessun guasto nei grossi', guastiDeiGrossi(CAMPAGNA), [])
  uguale('tredici dungeon con la forma (l\'abisso a parte)', CHIAVI_DEI_DUNGEON.length, 13)
  stessaLista('le chiavi della storia non cambiano, né l\'ordine', CHIAVI_DEI_DUNGEON.slice(0, 7),
              ['altare', 'cantine', 'torre', 'gallerie', 'cisterna', 'labirinto', 'fondo'])
  stessaLista('i sei nuovi', Object.keys(DUNGEON_NUOVI), ['cerchio', 'corvaia', 'palafitta', 'fornace', 'cava', 'tombe'])
  for (const k of CHIAVI_DEI_DUNGEON) {
    const z = zonaDelDungeon(k)
    controlla(`${k}: sta in una zona`, z >= 1 && z <= 7)
    controlla(`${k}: ha il suo livello`, LIVELLO_DEL_DUNGEON[k] >= 1)
  }
  // un po' più forti dei mostri di sopra: nelle zone del percorso il secondo dungeon di una zona sta sopra il primo
  for (const z of ZONE_DEL_PERCORSO) for (let i = 1; i < z.dungeon.length; i++)
    controlla(`zona ${z.zona}: ${z.dungeon[i]} sopra ${z.dungeon[i - 1]}`, LIVELLO_DEL_DUNGEON[z.dungeon[i]] > LIVELLO_DEL_DUNGEON[z.dungeon[i - 1]])
  uguale('la seconda terra sposta i livelli di 14', livelloDelDungeon('cerchio', 2), LIVELLO_DEL_DUNGEON.cerchio + SALTO_DELLA_TERRA)

  for (const k of Object.keys(DUNGEON_NUOVI)) {
    const g = GROSSI[GROSSO_DELLA_DISCESA[k]]
    controlla(`${k}: in fondo il suo mostro grosso`, !!g)
    controlla(`${k}: il grosso ha le sue difese`, !!(g.difese && (g.difese.resiste.length + g.difese.teme.length + g.difese.immune.length)))
    controlla(`${k}: il grosso veste una creatura del catalogo, ingrandita`, !!g.figura && !!MOSTRI[g.figura] && !!figuraDelGrosso(GROSSO_DELLA_DISCESA[k]))
    const p = DEI_GROSSI[g.pezzo]
    controlla(`${k}: il suo pezzo col nome c'è, e lo porta chiunque`, !!p && !COSE[p.base].famiglia)
    controlla(`${k}: il pezzo ha una figura dei fogli`, !!p.figura)
    const t = tappaDelMondo(k, { eroe: 'mago' })
    uguale(`${k}: tre piani`, t.piani, PIANI_DEI_NUOVI)
    uguale(`${k}: il grosso in fondo`, grossoDi(t, t.piani - 1), GROSSO_DELLA_DISCESA[k])
    uguale(`${k}: il livello della zona più uno`, t.livello, LIVELLO_DEL_DUNGEON[k])
    controlla(`${k}: una ripetuta, con la potenza (non tocca la storia)`, t.potenza === t.livello)
  }
}

/* ══════════ 2. il seme e la forma ══════════ */
{
  uguale('lo stesso (eroe, chiave, rifatti, terra), lo stesso seme', semeDelDungeon('mago', 'altare', 2, 1), semeDelDungeon('mago', 'altare', 2, 1))
  controlla('un rifatti in più, un altro seme', semeDelDungeon('mago', 'altare', 2, 1) !== semeDelDungeon('mago', 'altare', 3, 1))
  controlla('un altro eroe, un altro seme', semeDelDungeon('mago', 'altare', 0) !== semeDelDungeon('elfa', 'altare', 0))
  controlla('un\'altra terra, un altro seme', semeDelDungeon('mago', 'altare', 0, 1) !== semeDelDungeon('mago', 'altare', 0, 2))
  for (const k of ['altare', 'gallerie', 'cerchio', 'tombe']) {
    const a = tappaDelMondo(k, { eroe: 'nano', rifatti: 1 }), b = tappaDelMondo(k, { eroe: 'nano', rifatti: 1 }), c = tappaDelMondo(k, { eroe: 'nano', rifatti: 2 })
    stessaLista(`${k}: la stessa volta, lo stesso mazzo`, [...a.mostri, a.caporale], [...b.mostri, b.caporale])
    uguale(`${k}: e la stessa forma`, firma(new Corsa(a, { seme: a.seme, eroe: 'nano' })), firma(new Corsa(b, { seme: b.seme, eroe: 'nano' })))
    controlla(`${k}: un rifatti in più, un'altra forma`, firma(new Corsa(a, { seme: a.seme, eroe: 'nano' })) !== firma(new Corsa(c, { seme: c.seme, eroe: 'nano' })))
    controlla(`${k}: e altri abitanti`, a.mostri.join() !== c.mostri.join())
    uguale(`${k}: lo stesso posto (paesaggio, scenario)`, `${c.paesaggio}/${c.scenario}`, `${a.paesaggio}/${a.scenario}`)
    uguale(`${k}: lo stesso livello`, c.livello, a.livello)
    controlla(`${k}: il volto nuovo`, a.nome !== c.nome)
  }
  // nessuna specie fuori dalla sua zona, in nessuna volta
  for (const k of CHIAVI_DEI_DUNGEON) {
    const m = mazzoDellaZona(zonaDelDungeon(k)), dentro = new Set([...m.mostri, ...m.caporali])
    const fuori = []
    for (let r = 0; r < 12; r++) {
      const a = abitantiDellaVolta(k, r, 'cavaliere')
      for (const x of [...a.mostri, a.caporale]) if (!dentro.has(x)) fuori.push(`${r}:${x}`)
      if (a.mostri.includes(a.caporale)) fuori.push(`${r}: il caporale per strada`)
      if (a.mostri.some(x => MOSTRI[x].capo)) fuori.push(`${r}: un capo per strada`)
    }
    stessaLista(`${k}: nessuna specie fuori dalla zona ${zonaDelDungeon(k)}`, fuori, [])
  }
  // la prima volta i sette sono quelli di sempre
  stessaLista('altare, la prima volta: gli abitanti di sempre', abitantiDellaVolta('altare', 0).mostri, CAMPAGNA[0].mostri)
}

/* ══════════ 3. ripulito, e cosa no ══════════ */
{
  controlla('vinta: ripulito', ripulito({ vinta: true }))
  controlla('vinta col grosso battuto: ripulito', ripulito({ vinta: true, grossoBattuto: true }))
  controlla('il grosso ancora in piedi: no', !ripulito({ vinta: true, grossoBattuto: false }))
  controlla('lasciar perdere (risalito): no', !ripulito({ vinta: false }))
  controlla('svenuto: no', !ripulito({ vinta: false, perche: 'svenuto' }))
  controlla('niente esito (il portale non chiude la discesa): no', !ripulito(null))

  // una discesa vera nel mondo: altare ripetuta, giocata fino in fondo con la roba e il livello del 20
  const t = tappaDelMondo('altare', { eroe: 'cavaliere', rifatti: 0 })
  const c = new Corsa(t, { seme: t.seme, eroe: 'cavaliere', roba: robaAttesaA('cavaliere', 20), crescita: crescitaAttesaA('cavaliere', 20), ricomparsa: false })
  const g = gioca(t, { seme: t.seme, bravura: 1, da: c })
  controlla('giocata fino in fondo, è vinta', g.esito.vinta, JSON.stringify(g.guasto || g.esito))
  const battuto = !c.livello.robe.some(r => r.che === 'mostro' && r.grosso && !r.morto)
  controlla('e in fondo il grosso è battuto', battuto)
  const d = dopoLaDiscesa({ nebbia: 'x' }, t, { ...g.esito, grossoBattuto: battuto })
  controlla('ripulita', d.ripulito)
  uguale('il mondo ha un rifatti in più', rifattiDi(d.mondo, 'altare'), 1)
  uguale('e tiene il resto', d.mondo.nebbia, 'x')
  controlla('una ripetuta non è la storia', !d.storia)

  // uscire col portale (la sosta resta, nessun esito), lasciar perdere, svenire: rifatti non sale
  const u = tappaDelMondo('cerchio', { eroe: 'mago' })
  const lascia = new Corsa(u, { seme: u.seme, eroe: 'mago' }); lascia.risali()
  uguale('lasciar perdere: rifatti resta', dopoLaDiscesa({}, u, lascia.esito).mondo, null)
  const sviene = new Corsa(u, { seme: u.seme, eroe: 'mago' }); sviene.risali(); sviene.perche = 'svenuto'
  uguale('svenire: rifatti resta', dopoLaDiscesa({}, u, sviene.esito).mondo, null)
  const portale = new Corsa(u, { seme: u.seme, eroe: 'mago' })
  const sosta = scrivi(portale, 'cerchio', { via: 'portale' })
  uguale('il portale scrive la sosta per chiave', sosta.tappa, 'cerchio')
  uguale('con il dungeon e la volta', JSON.stringify(sosta.dungeon), JSON.stringify({ chiave: 'cerchio', rifatti: 0, terra: 1 }))
  const t2 = tappaDellaSosta(sosta)
  const ripresa = leggi(sosta, t2, null)
  uguale('rientrando dal portale, la stessa forma', firma(ripresa), firma(portale))
  uguale('e la carta «riprendi» dice il suo nome', dice(sosta).nome, 'Il cerchio di pietre')
}

/* ══════════ 4. la storia la prima volta, poi ripetibile; i nuovi non la toccano ══════════ */
{
  // un profilo come quello di giochi/campagne.js, con l'avventura del cavaliere al primo passo
  const prof = { tappa: 0, stelle: {}, cfg: { avventure: { cavaliere: { tappa: 0, stelle: {}, roba: null } } } }
  const chiudi = (k) => {   // quello che fa Gioco.vue chiudendo una discesa vinta del mondo
    const a = avventuraDi(prof, 'cavaliere')
    const d = dungeonDellAvventura(a, k, { eroe: 'cavaliere' })
    const dopo = dopoLaDiscesa(a.mondo, d.tappa, { vinta: true, svenimenti: 0, grossoBattuto: true })
    if (dopo.mondo) prof.cfg.avventure.cavaliere.mondo = dopo.mondo   // come scriviNellAvventura
    if (dopo.storia) vintaNellAvventura(prof, 'cavaliere', d.indice, CAMPAGNA.length, 3)
    return { d, dopo, a: avventuraDi(prof, 'cavaliere') }
  }
  const prima = chiudi('altare')
  controlla('altare la prima volta è la storia', prima.d.storia && !prima.d.tappa.potenza)
  controlla('e dà le stelle e il capitolo', prima.dopo.storia)
  uguale('la storia va avanti', prima.a.tappa, 1)
  uguale('con le stelle', prima.a.stelle[0], 3)
  uguale('e la cripta è ripulita una volta', rifattiDi(prima.a.mondo, 'altare'), 1)
  const seconda = chiudi('altare')
  controlla('la seconda volta è una ripetuta', !seconda.d.storia && seconda.d.tappa.potenza > 0)
  controlla('e non dà la storia', !seconda.dopo.storia)
  uguale('la storia resta dov\'era', seconda.a.tappa, 1)
  uguale('ripulita due volte', rifattiDi(seconda.a.mondo, 'altare'), 2)
  const nuovo = chiudi('cerchio')
  controlla('un dungeon nuovo non è la storia', !nuovo.d.storia && nuovo.d.indice === null && !nuovo.dopo.storia)
  uguale('e non tocca la tappa', nuovo.a.tappa, 1)
  stessaLista('né le stelle', Object.keys(nuovo.a.stelle), ['0'])
  uguale('ma è ripulito', rifattiDi(nuovo.a.mondo, 'cerchio'), 1)
  const cantine = dungeonDellAvventura(nuovo.a, 1, { eroe: 'cavaliere' })
  controlla('la porta dopo, adesso, è la storia', cantine.storia)
}

/* ══════════ 5. i salvataggi di prima ══════════ */
{
  uguale('senza mondo: rifatti 0', rifattiDi(undefined, 'altare'), 0)
  uguale('senza mondo.dungeon: rifatti 0', rifattiDi({ nebbia: 'x' }, 'altare'), 0)
  uguale('storto: rifatti 0', rifattiDi({ dungeon: { altare: { rifatti: 'tanti' } } }, 'altare'), 0)
  uguale('conRipulito da un mondo senza dungeon', rifattiDi(conRipulito({ nebbia: 'x' }, 'cava'), 'cava'), 1)
  const a = { tappa: 3, stelle: { 0: 3, 1: 2, 2: 1 } }
  const d = dungeonDellAvventura(a, 'torre', { eroe: 'elfa' })
  controlla('un\'avventura di oggi: la torre finita è una ripetuta della prima volta', !d.storia && d.rifatti === 0)
  // una sosta di prima (senza `dungeon`) si rilegge come prima
  const t = CAMPAGNA[2], c = new Corsa(t, { seme: 77, eroe: 'elfa' })
  const s = scrivi(c, 2)
  controlla('una sosta della storia senza mondo non ha `dungeon`', !('dungeon' in s))
  uguale('e si rifà come prima', firma(leggi(s, tappaDellaSosta(s), null)), firma(c))
}

riassunto('I dungeon che si rigenerano')
