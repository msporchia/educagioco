/* Le varianti armate e i gradi (docs/sotterraneo/varianti.md): lo scheletro, lo zombie, il goblin e l'orco possono avere un'arma in
   pugno (una figura della roba dell'atlante) e diventano guerrieri, arcieri, maghi; ogni mostro armato ha un grado (comune, magico, raro,
   leggendario) che dà un aggettivo al nome, il colore della rarità e un'arma più ricca. Una variante cambia la forma, mai la forza: le
   ossa e la difesa restano quelle della specie, e a pari grado si costa uguale (entro il 15%). Il grado, dal magico in su, rende il mostro più duro
   (OSSA_DEL_GRADO, ATT_DEL_GRADO): un nome epico è un mostro più forte.
   `node test/esegui.mjs sotterraneo-varianti --niente-build` */
import { VARIANTI, MANI, GRADI, AGGETTIVI, armaDi, nomeDelMostro, etichettaDi, vesti, pescaIlGrado, pescaLaVariante, pesiDeiGradi, coloreDelGrado,
         guastiDelleVarianti, VELOCITA_DEL_GRADO, PREMIO_DEL_GRADO, OSSA_DEL_GRADO, ATT_DEL_GRADO } from '../../src/giochi/sotterraneo/dati/varianti.js'
import { MOSTRI, costoInRisposte } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { RARITA } from '../../src/giochi/sotterraneo/dati/pezzi.js'
import { PEZZI } from '../../src/giochi/sotterraneo/dati/atlante.js'
import { ASPETTI } from '../../src/giochi/sotterraneo/dati/aspetti.js'
import { difeseDi } from '../../src/giochi/sotterraneo/dati/grossi.js'
import { guastiDelleDifese } from '../../src/giochi/sotterraneo/dati/elementi.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { vistaDelloScontro } from '../../src/giochi/sotterraneo/viste/campo.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

controlla('i dati delle varianti non hanno guasti', guastiDelleVarianti().length === 0, guastiDelleVarianti().join(' · '))

/* ══════════ 1. chi ha le mani, e le armi in mano ══════════ */
stessaLista('le specie con le varianti', Object.keys(VARIANTI).sort(), ['goblin', 'orco', 'scheletro', 'zombie'])
stessaLista('lo scheletro: senza arma, guerriero, arciere, mago', VARIANTI.scheletro.map(v => v.chiave), ['semplice', 'guerriero', 'arciere', 'mago'])
for (const [tipo, lista] of Object.entries(VARIANTI)) {
  controlla(`${tipo}: dice dove tiene l'arma`, !!MANI[tipo] && MANI[tipo].x > 0 && MANI[tipo].x <= 1 && MANI[tipo].y > 0 && MANI[tipo].y < 1)
  for (const v of lista.filter(x => x.armi))
    for (const g of GRADI) {
      const a = armaDi(tipo, v.chiave, g, 3)
      controlla(`${tipo} ${v.chiave} ${g}: l'arma è una figura dell'atlante`, !!a && !!PEZZI[a], String(a))
      uguale(`${tipo} ${v.chiave} ${g}: sempre la stessa per la stessa chiave`, armaDi(tipo, v.chiave, g, 3), a)
    }
}
// l'arma sale con il grado: il pregio della figura (catalogo roba.json, `ASPETTI`) non scende
{
  const pregio = a => Object.values(ASPETTI).flat().find(x => x.sprite === a).pregio
  for (const [tipo, ch] of [['scheletro', 'guerriero'], ['scheletro', 'arciere'], ['scheletro', 'mago'], ['orco', 'guerriero']]) {
    const p = GRADI.map(g => pregio(armaDi(tipo, ch, g, 0)))
    controlla(`${tipo} ${ch}: l'arma di un grado alto non è più povera`, p.every((x, i) => !i || x >= p[i - 1]) && p[3] > p[0], p.join())
  }
  // il mago di ghiaccio ha un bastone azzurro (l'arma dice lo stesso del suo incanto)
  const bastone = Object.values(ASPETTI).flat().find(x => x.sprite === armaDi('scheletro', 'mago', 'magico', 0))
  controlla('lo scheletro mago ha in mano un bastone del ghiaccio', bastone.tinta === 'ghiaccio', bastone.tinta)
}

/* ══════════ 2. i nomi coi gradi ══════════ */
uguale('lo scheletro', nomeDelMostro('Uno scheletro', null, 'comune'), 'Uno scheletro')
uguale('lo scheletro mago', nomeDelMostro('Uno scheletro', VARIANTI.scheletro[3], 'comune'), 'Uno scheletro mago')
controlla('un magico ha un aggettivo da magico', AGGETTIVI.magico.some(a => nomeDelMostro('Uno scheletro', VARIANTI.scheletro[1], 'magico', 1).endsWith(` ${a}`)))
controlla('un raro ha un aggettivo da raro', AGGETTIVI.raro.some(a => nomeDelMostro('Uno scheletro', VARIANTI.scheletro[3], 'raro', 0).endsWith(` ${a}`)))
{
  const n = nomeDelMostro('Uno scheletro', VARIANTI.scheletro[3], 'leggendario', 4)
  controlla('un leggendario ne ha due («Uno scheletro mago spettrale arcano»)', n.split(' ').length === 5 && AGGETTIVI.raro.some(a => n.includes(` ${a} `)) && AGGETTIVI.leggendario.some(a => n.endsWith(` ${a}`)), n)
}
uguale('al femminile: una tartaruga antica', nomeDelMostro('Una tartaruga corazzata', null, 'magico', 0), 'Una tartaruga corazzata antica')
uguale('l\'etichetta sullo schermo non ha l\'articolo', etichettaDi('Uno scheletro mago spettrale'), 'Scheletro mago spettrale')
uguale('nemmeno quando è elisa', etichettaDi('Un\'ombra'), 'Ombra')
controlla('il colore è quello della rarità, come la roba', GRADI.every(g => coloreDelGrado(g) === RARITA[g].colore) && new Set(GRADI.map(coloreDelGrado)).size === 4)

/* ══════════ 3. la forma cambia, la forza no; il grado la alza ══════════ */
{
  const sch = MOSTRI.scheletro
  const base = () => ({ tipo: 'scheletro', ossa: 24, att: 5, dif: sch.dif })
  for (const v of VARIANTI.scheletro) for (const g of GRADI) {
    const m = vesti(base(), sch, { variante: v.chiave, grado: g, k: 2 })
    controlla(`scheletro ${v.chiave} ${g}: le ossa sono quelle della specie per il grado, la difesa quella della specie`, m.ossa === Math.round(24 * OSSA_DEL_GRADO[g]) && m.dif === sch.dif)
    const vel = m.velocita != null ? m.velocita : sch.velocita
    controlla(`scheletro ${v.chiave} ${g}: la velocità resta fra 5 e 13`, vel >= 5 && vel <= 13, String(vel))
    const pari = vesti(base(), sch, { variante: 'semplice', grado: g, k: 2 }), velPari = pari.velocita != null ? pari.velocita : sch.velocita
    controlla(`scheletro ${v.chiave} ${g}: colpo per velocità entro il 15% di quello dello scheletro dello stesso grado, in più o in meno`,
              (m.att * vel) / (pari.att * velPari) < 1.2 && (m.att * vel) / (pari.att * velPari) > 0.7, `${m.att * vel} contro ${pari.att * velPari}`)
    controlla(`scheletro ${v.chiave} ${g}: le difese sono valide`, guastiDelleDifese('x', difeseDi(m)).length === 0, guastiDelleDifese('x', difeseDi(m)).join())
  }
  const guerriero = vesti(base(), sch, { variante: 'guerriero', grado: 'comune' }), arciere = vesti(base(), sch, { variante: 'arciere', grado: 'comune' })
  const mago = vesti(base(), sch, { variante: 'mago', grado: 'comune' })
  controlla('il guerriero resiste ai colpi fisici (più difesa, ma da abilità: la difesa vera è la stessa)', difeseDi(guerriero).resiste.includes('fisico') && !difeseDi(guerriero).teme.includes('fisico') && guerriero.dif === sch.dif)
  controlla('l\'arciere agisce prima nella fila dei turni', arciere.velocita > sch.velocita + 1, String(arciere.velocita))
  controlla('il mago ha un incanto di gelo e resiste al gelo', mago.incanto === 'gelo' && difeseDi(mago).resiste.includes('gelo'))
  controlla('lo scheletro senza arma è quello di sempre', vesti(base(), sch, { variante: 'semplice', grado: 'comune' }).arma === undefined)
  const raro = vesti(base(), sch, { variante: 'guerriero', grado: 'raro' }), leg = vesti(base(), sch, { variante: 'guerriero', grado: 'leggendario' })
  controlla('il grado alza un poco la velocità, e basta', VELOCITA_DEL_GRADO.comune === 0 && VELOCITA_DEL_GRADO.leggendario <= 2 && (leg.velocita ?? sch.velocita) >= (raro.velocita ?? sch.velocita))
  controlla('e vale di più abbatterlo', PREMIO_DEL_GRADO.leggendario > PREMIO_DEL_GRADO.raro && PREMIO_DEL_GRADO.raro > PREMIO_DEL_GRADO.magico && PREMIO_DEL_GRADO.magico > 1)
}
// a pari grado si costa uguale: ogni variante costa in risposte come la specie dello stesso grado, entro il 15% (le ossa e la difesa sono le stesse)
{
  const male = []
  for (const tipo of Object.keys(VARIANTI)) for (const v of VARIANTI[tipo]) for (const g of GRADI) for (const att of [3, 5, 8, 12, 20, 40]) {
    const m = vesti({ tipo, ossa: MOSTRI[tipo].ossa, att: MOSTRI[tipo].att, dif: MOSTRI[tipo].dif }, MOSTRI[tipo], { variante: v.chiave, grado: g })
    const pari = vesti({ tipo, ossa: MOSTRI[tipo].ossa, att: MOSTRI[tipo].att, dif: MOSTRI[tipo].dif }, MOSTRI[tipo], { variante: 'semplice', grado: g })
    const r = costoInRisposte(m, att) / costoInRisposte(pari, att)
    if (Math.abs(r - 1) > 0.15) male.push(`${tipo} ${v.chiave} ${g} a ${att}`)
  }
  controlla('ogni variante a ogni grado costa in risposte come la sua specie dello stesso grado', !male.length, male.slice(0, 3).join(' · '))
  // il grado pesa: più sale, più ossa e più attacco; nella cripta (peso 0) è solo un nome
  const su = (g, peso = 1) => vesti({ tipo: 'scheletro', ossa: 24, att: 5, dif: 1 }, MOSTRI.scheletro, { variante: 'guerriero', grado: g, peso })
  controlla('un grado più alto ha più ossa e più attacco', su('magico').ossa > su('comune').ossa && su('raro').ossa > su('magico').ossa && su('leggendario').ossa > su('raro').ossa &&
            su('raro').att > su('comune').att && su('leggendario').att > su('raro').att, [su('comune'), su('magico'), su('raro'), su('leggendario')].map(m => `${m.ossa}/${m.att}`).join(' '))
  controlla('con peso 0 (la cripta) il grado è solo un nome', su('leggendario', 0).ossa === 24 && su('leggendario', 0).att === 5 + (VARIANTI.scheletro[1].att || 0))
  controlla('il grado comune non cambia niente', OSSA_DEL_GRADO.comune === 1 && ATT_DEL_GRADO.comune === 0)
}

/* ══════════ 4. dove e quanto spesso ══════════ */
{
  const p1 = pesiDeiGradi(1), p60 = pesiDeiGradi(60), pc = pesiDeiGradi(1, true)
  const quota = (p, g) => p[g] / GRADI.reduce((a, x) => a + p[x], 0)
  controlla('i gradi alti sono rari: nella prima discesa il leggendario non arriva all\'1% e il comune è la gran parte', quota(p1, 'leggendario') < 0.01 && quota(p1, 'comune') > 0.75)
  controlla('crescono col livello del posto, senza mai fare il comune meno di un terzo', quota(p60, 'raro') > quota(p1, 'raro') && quota(p60, 'leggendario') > quota(p1, 'leggendario') && quota(p60, 'comune') > 0.3)
  uguale('un caporale non è mai comune', pc.comune, 0)
  // le frequenze, sul caso: a livello 1 su 4000 tiri
  const r = seminato(5)
  const conta = { comune: 0, magico: 0, raro: 0, leggendario: 0 }
  for (let i = 0; i < 4000; i++) conta[pescaIlGrado(1, r())]++
  controlla('a livello 1 su 4000 tiri: tanti comuni, pochi rari, qualche leggendario al più', conta.comune > 3000 && conta.raro < 400 && conta.leggendario < 60, JSON.stringify(conta))
  const v = { semplice: 0, guerriero: 0, arciere: 0, mago: 0 }
  for (let i = 0; i < 4000; i++) v[pescaLaVariante('scheletro', r())]++
  controlla('lo scheletro è senza arma il più delle volte, e ogni variante esce', v.semplice > v.guerriero && Object.values(v).every(n => n > 200), JSON.stringify(v))
  uguale('una specie senza varianti non ne ha', pescaLaVariante('ratto', 0.3), null)
}
// nel piano: la cripta è il posto degli scheletri, con i suoi gradi e le sue armi; il caporale e il grosso sono i posti dei gradi alti
{
  const nomi = new Set(), gradi = { comune: 0, magico: 0, raro: 0, leggendario: 0 }
  let armati = 0, conArma = 0
  for (const seme of [3, 8, 21, 34, 55, 89]) {
    const c = new Corsa(CAMPAGNA[0], { seme, rnd: seminato(seme) })
    for (let p = 0; p < 2; p++) {
      c.piano = p; c.nuovoPiano()
      for (const m of c.livello.robe.filter(r => r.che === 'mostro' && !r.grosso && !r.missione)) {
        if (!m.caporale) gradi[m.grado || 'comune']++
        if (m.tipo === 'scheletro') { nomi.add(m.nome); if (m.variante) { armati++; if (m.arma) conArma++ } }
        if (m.caporale) controlla(`un caporale della cripta (${m.nome}) non è mai comune`, m.grado && m.grado !== 'comune')
      }
    }
  }
  controlla('nella cripta ci sono scheletri armati e tutti hanno un\'arma in mano', armati > 0 && armati === conArma, `${armati} armati, ${conArma} con l'arma`)
  controlla('e almeno due nomi diversi di scheletro', nomi.size >= 2, [...nomi].join(' · '))
  controlla('i soldati sono per lo più comuni (i caporali no, mai)', gradi.comune > gradi.magico + gradi.raro + gradi.leggendario, JSON.stringify(gradi))
}
// una zona alta ha gradi alti: a livello 60 la cripta ne ha di leggendari
{
  const r = seminato(9)
  let raro = 0, leg = 0
  for (let i = 0; i < 400; i++) { const g = pescaIlGrado(60, r()); if (g === 'raro') raro++; if (g === 'leggendario') leg++ }
  controlla('al livello 60 i rari e i leggendari sono comuni', raro > 40 && leg > 10, `${raro} rari, ${leg} leggendari su 400`)
}

/* ══════════ 5. come si vede ══════════ */
{
  const c = new Corsa(CAMPAGNA[0], { seme: 5, rnd: seminato(5) })
  const m = c.livello.mostro('scheletro', 3, 3, { variante: 'mago', grado: 'raro' })
  uguale('Livello.mostro accetta una variante e un grado', [m.variante, m.grado, m.incanto].join(), 'mago,raro,gelo')
  controlla('e il nome li dice', /^Uno scheletro mago \S+$/.test(m.nome), m.nome)
  const sem = c.livello.mostro('scheletro', 3, 3, { variante: 'semplice', grado: 'comune' })
  uguale('senza variante né grado è lo scheletro di sempre', [sem.nome, sem.arma, sem.variante].join(), 'Uno scheletro,,')
  const gob = c.livello.mostro('goblin', 3, 3)
  controlla('un goblin ne ha anche lui, e chi non ne ha (il ratto) no', ['Un goblin', 'Un goblin guerriero', 'Un goblin arciere'].some(n => gob.nome.startsWith(n)) && c.livello.mostro('ratto', 3, 3).variante === undefined)
  // la vista dello scontro porta quello che serve a disegnare: etichetta, grado, colore, arma, variante
  const campo = [m, sem]
  c.scontro(m, { solo: false })
  c.foglio.campo = campo
  const v = vistaDelloScontro({ foglio: { che: 'scontro', chi: m, campo, io: {}, turni: [], colpiti: [], minaccia: [], difese: [] }, io: {}, scenario: 'cripta', vita: 5, vitaMax: 5 })
  uguale('la vista: l\'etichetta del mago', v.mostri[0].etichetta, 'Scheletro mago ' + m.nome.split(' ').pop())
  uguale('il suo grado, il suo colore e la sua arma', [v.mostri[0].grado, v.mostri[0].colore, v.mostri[0].arma].join(), ['raro', RARITA.raro.colore, m.arma].join())
  uguale('lo scheletro senza arma non ha grado né arma', [v.mostri[1].grado, v.mostri[1].arma, v.mostri[1].etichetta].join(), ',,Scheletro')
}

/* ══════════ 6. l'incanto del mago: il gelo che dimezza ══════════
   Un colpo di un mago che ti arriva ti può gelare (a caso, tanto più spesso quanto più alto il grado): il tuo colpo dopo fa metà. Si
   scongela appena agisci. Chi non ha un incanto non fa nessun tiro (non sposta il caso dello scontro). */
{
  const prova = (incanto, rnd) => {
    const c = new Corsa(CAMPAGNA[0], { seme: 5, eroe: 'cavaliere', rnd: seminato(5) })
    const m = c.livello.robe.find(r => r.che === 'mostro')
    Object.assign(m, { tipo: 'scheletro', ossa: 400, ossaMax: 400, att: 4, dif: 0, sveglio: true, stati: null, grosso: null, velocita: c.velocita, incanto })
    c.scontro(m, { solo: true, tocco: true })
    c.vitaPiu += 200; c.vita = c.vitaMax
    c.rnd = () => rnd
    return { c, m }
  }
  const { c, m } = prova('gelo', 0)
  const prima = c.colpo(m)
  const e = c.colpoDelMostro(m)
  controlla('un colpo del mago che arriva ti gela', e.gelaTe === true && c.foglio.io.gelato === 1)
  controlla('e il tuo colpo adesso fa metà', c.colpo(m) === Math.max(1, Math.round(prima / 2)) || c.colpo(m) < prima, `${prima} → ${c.colpo(m)}`)
  c.rnd = () => 0.99   // stavolta il mago non ti gela di nuovo
  c.finisciIlTurno(c.foglio, [], m)
  controlla('dopo il tuo turno ti sei scongelato', !c.foglio || !c.foglio.io || !c.foglio.io.gelato)
  const senza = prova('gelo', 0.99)
  controlla('con il tiro alto non gela', senza.c.colpoDelMostro(senza.m).gelaTe !== true)
  const neutro = prova(undefined, 0)
  controlla('senza incanto non gela mai', neutro.c.colpoDelMostro(neutro.m).gelaTe !== true && !(neutro.c.foglio.io.gelato > 0))
}

riassunto('le varianti armate e i gradi')
