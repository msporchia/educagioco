/* Verifica del Dungeon a bivi, senza browser. Le tre cose che contano:
   i dati stanno in piedi, il calcolo è giusto dove è facile sbagliarsi
   (la mappa che si chiude, lo scontro che costa più del dovuto), e le
   nove tappe **si vincono giocandole davvero** — con un bambino finto
   che ne sbaglia una su quattro e deve arrivare in fondo lo stesso.

   Da quando i mostri hanno vita, attacco e difesa c'è una quarta cosa,
   ed è quella che il gioco promette: **potenziarsi si deve sentire**.
   Un test che dicesse solo «la tappa si vince» passerebbe anche con un
   bottino finto, cioè col gioco svuotato di quello per cui esiste.
   `node test/esegui.mjs dungeon --niente-build`
   tempo: 300 */
import { STANZE, SACCHI, guastiDelleStanze, rischioDi, pianoDi, finePiano,
         eFinePiano, gradoBottino, QUANTI_PIANI, GRADO_DEL_PIANO }
  from '../../src/giochi/dungeon/dati/stanze.js'
import { AMBIENTI, guastiDegliAmbienti, guastiDelleTaglie, faccia, ossaDi,
         forzaDi, TAGLIE } from '../../src/giochi/dungeon/dati/mostri.js'
import { TESORI, POZIONE, guastiDeiTesori, tesoriPossibili, bonusDi, meglioDi,
         inCasella, CASELLE } from '../../src/giochi/dungeon/dati/tesori.js'
import { BASE, CRESCITA, GRAFFIO, guastiDellEroe, statisticheBase, colpoDellEroe,
         colpoDelMostro, scambiPerAbbattere } from '../../src/giochi/dungeon/dati/eroe.js'
import { EVENTI, guastiDegliEventi } from '../../src/giochi/dungeon/dati/eventi.js'
import { TARATURA, ATTESE, DOMANDE, guastiDellaTaratura, bottinoDi, stellePerVita }
  from '../../src/giochi/dungeon/dati/taratura.js'
import { CAMPAGNA, SCALINI, LIBERE, QUANTE_TAPPE, RAMPA_MINIMA, guastiDellaCampagna,
         difficoltaDi, tappaLibera } from '../../src/giochi/dungeon/dati/campagna.js'
import { generaMappa, guastiDellaMappa, scaletta } from '../../src/giochi/dungeon/motore/mappa.js'
import { Corsa } from '../../src/giochi/dungeon/motore/corsa.js'
import { caso, giocaCorsa, misura, gradoInFondo } from '../../src/giochi/dungeon/motore/banco.js'
import manifesto, { CHIAVE } from '../../src/giochi/dungeon/gioco.js'
import { guastiDellAlbo } from '../../src/giochi/albo.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. i dati stanno in piedi ══════════ */
for (const [cosa, guasti] of [
  ['le stanze', guastiDelleStanze(STANZE, TARATURA.lascia)],
  ['gli ambienti', guastiDegliAmbienti()],
  ['le taglie dei mostri', guastiDelleTaglie()],
  ['l\'eroe', guastiDellEroe()],
  ['i tesori', guastiDeiTesori()],
  ['le stranezze', guastiDegliEventi()],
  ['la taratura', guastiDellaTaratura()],
  ['la campagna', guastiDellaCampagna(CAMPAGNA, AMBIENTI, LIBERE)],
])
  controlla(`${cosa}: nessun guasto`, guasti.length === 0, guasti.join(' · '))

uguale('nove tappe', QUANTE_TAPPE, 9)
controlla('tre scalini', SCALINI.length === 3)
controlla('nessuna discesa è più corta di quella prima',
          CAMPAGNA.every((t, i) => i === 0 || t.file >= CAMPAGNA[i - 1].file))
/* le discese sono lunghe apposta: è la condizione perché una spada
   trovata combattendo si possa usare per più di due stanze */
controlla('anche la più corta è una spedizione a tre piani',
          CAMPAGNA[0].file >= QUANTI_PIANI * 5, `${CAMPAGNA[0].file} file`)
controlla('e in ognuna scendere si sente',
          CAMPAGNA.every(t => t.dif[1] - t.dif[0] >= RAMPA_MINIMA))
controlla('ogni tappa ha il suo ambiente',
          new Set(CAMPAGNA.map(t => t.ambiente)).size === CAMPAGNA.length)
controlla('nessuna tappa parla più di cuori',
          CAMPAGNA.every(t => t.cuori === undefined))
uguale('il manifesto dice quante tappe ci sono', manifesto.tappe, QUANTE_TAPPE)
controlla('il riassunto di chi comincia parla della prima tappa',
          manifesto.riassunto({ tappa: 0, libera: false, stelle: {} }).includes(CAMPAGNA[0].nome))
controlla('e quello di chi ha finito parla del gioco libero',
          manifesto.riassunto({ tappa: 9, libera: true, stelle: { 0: 3 } }).includes('♾️'))

/* ══════════ 2. le due formule dello scontro ══════════
   Sono la cosa che un bambino legge sopra la barra della vita: se
   sbagliano, sbaglia tutto il resto. */
uguale('attacco 5 contro difesa 3 fa 2 di danno', colpoDellEroe(5, 3), 2)
uguale('e attacco 3 contro difesa 5 fa comunque 1',
       colpoDellEroe(3, 5), 1)
controlla('nessun mostro è mai immortale',
          [0, 1, 5, 20].every(d => colpoDellEroe(3, d) >= 1))
uguale('un mostro che picchia 9 contro difesa 4 toglie 5', colpoDelMostro(9, 4), 5)
uguale('e uno debolissimo toglie sempre almeno 1', colpoDelMostro(1, 30), 1)
uguale('venti di vita a tre di danno sono sette scambi',
       scambiPerAbbattere(20, 5, 2), 7)
controlla('il graffio c\'è ma è piccolo', GRAFFIO >= 1 && GRAFFIO < BASE.attacco)
{
  const zero = statisticheBase(0), otto = statisticheBase(8)
  uguale('si comincia con la vita di partenza', zero.vita, BASE.vita)
  controlla('e alla nona tappa l\'eroe è cresciuto in tutto',
            otto.vita > zero.vita && otto.attacco > zero.attacco && otto.difesa > zero.difesa)
  /* la difesa cresce più piano dell'attacco: se tenesse il passo,
     sbagliare smetterebbe di costare e la campagna sarebbe piatta */
  controlla('ma l\'attacco cresce più della difesa',
            otto.attacco - zero.attacco > otto.difesa - zero.difesa)
}

/* ══════════ 3. potenziarsi si deve sentire ══════════
   È la promessa del gioco. Senza questo blocco, il bottino potrebbe
   essere una decorazione e nessun altro test se ne accorgerebbe. */
{
  const forza = forzaDi(4, 0.6)
  const ossa = ossaDi('normale', forza, () => 0.5)
  const nudo = scambiPerAbbattere(ossa.vita, statisticheBase(4).attacco, ossa.difesa)
  const armato = scambiPerAbbattere(ossa.vita, statisticheBase(4).attacco + TESORI.lama.attacco, ossa.difesa)
  controlla('con la lama del drago un mostro cade in meno scambi',
            armato < nudo, `${nudo} scambi a mani quasi vuote, ${armato} con la lama`)
  const colpoNudo = colpoDelMostro(ossa.attacco, statisticheBase(4).difesa)
  const colpoArmato = colpoDelMostro(ossa.attacco, statisticheBase(4).difesa + TESORI.manto.difesa)
  controlla('e col manto di scaglie uno sbaglio costa meno vita',
            colpoArmato < colpoNudo, `−${colpoNudo} senza, −${colpoArmato} con`)
}
{
  /* la scala dei gradi: più alto è il grado, più dà e più costa */
  for (const casella of CASELLE) {
    const roba = Object.entries(TESORI).filter(([, t]) => t.casella === casella)
      .sort((a, b) => a[1].grado - b[1].grado)
    controlla(`la casella "${casella}" ha tre gradi`, roba.length === 3)
    const quanto = t => casella === 'mano' ? t.attacco : t.difesa
    controlla(`e in "${casella}" il grado più alto dà di più`,
              roba.every(([, t], i) => i === 0 || quanto(t) > quanto(roba[i - 1][1])))
  }
  uguale('impugnare la lama vale i suoi punti',
         bonusDi({ mano: 'lama' }).attacco, TESORI.lama.attacco)
  uguale('e un\'armatura non dà attacco', bonusDi({ addosso: 'manto' }).attacco, 0)
  controlla('uno spadino non si prende se si ha già la lama',
            meglioDi('spadino', { mano: 'lama' }) === false)
  controlla('ma la lama sì, se si ha lo spadino',
            meglioDi('lama', { mano: 'spadino' }) === true)
}
{
  /* i mostri crescono con la profondità e con la campagna */
  const vicino = ossaDi('normale', forzaDi(0, 0), () => 0.5)
  const lontano = ossaDi('normale', forzaDi(8, 1), () => 0.5)
  controlla('un mostro del covo ha più vita di uno della cantina',
            lontano.vita > vicino.vita * 2, `${vicino.vita} contro ${lontano.vita}`)
  controlla('e picchia più forte', lontano.attacco > vicino.attacco)
  const grosso = ossaDi('grosso', forzaDi(4, 0.5), () => 0.5)
  const normale = ossaDi('normale', forzaDi(4, 0.5), () => 0.5)
  controlla('un mostro grosso è più grosso di uno normale, alla stessa profondità',
            grosso.vita > normale.vita && grosso.attacco > normale.attacco)
  uguale('la serratura non picchia', ossaDi('serratura', forzaDi(8, 1), () => 0.5).attacco, 0)
}

/* ══════════ 4. il patto del bivio ══════════
   Chi promette di più ha dentro qualcosa di più grosso, e lascia roba
   migliore. Vale fra i tipi di stanza e vale scendendo. */
{
  const stazza = t => TAGLIE[t] ? TAGLIE[t].vita.base + TAGLIE[t].vita.per * 5 : 0
  controlla('un mostro grosso ha più vita di uno normale',
            stazza(STANZE.grosso.taglia) > stazza(STANZE.mostro.taglia))
  controlla('il guardiano è la cosa più grossa di tutte',
            stazza(STANZE.boss.taglia) >= Math.max(...Object.values(STANZE).map(s => stazza(s.taglia))))
  controlla('e chi lascia roba migliore è anche più duro',
            STANZE.grosso.grado > STANZE.mostro.grado)
  controlla('le stanze senza nessuno dentro non fanno male',
            Object.values(STANZE).every(s => s.taglia || !s.sfuma))
  uguale('il bollino di una stanza tranquilla è zero', rischioDi('fuoco'), 0)
  dentro('e quello del guardiano è il massimo', rischioDi('boss'), 3, 3)
}
{
  const t = CAMPAGNA[8]
  const cima = difficoltaDi(t, 0), fondo = difficoltaDi(t, t.file - 1)
  uguale('in cima alla discesa si chiede la difficoltà di partenza', cima, t.dif[0])
  uguale('e davanti al guardiano quella d\'arrivo', fondo, t.dif[1])
  controlla('scendendo si fa più dura', fondo > cima)
  uguale('una stanza che rincara chiede di più della sua fila',
         difficoltaDi(t, 2, 0.3) > difficoltaDi(t, 2), true)
  /* il rincaro non deve poter sfondare la scala dei quiz: `scelta.js`
     vuole 0..1 e sopra l'uno non c'è nessun grado */
  dentro('la difficoltà resta dentro 0..1', difficoltaDi(t, t.file - 1, 0.5), 0, 1)
  dentro('anche in cima alla prima tappa', difficoltaDi(CAMPAGNA[0], 0, 0), 0, 1)
}
{
  /* ── i ⚡ devono dire il vero ── */
  const t = CAMPAGNA[8]
  const inCima = rischioDi('mostro', difficoltaDi(t, 0, STANZE.mostro.rincaro))
  const inFondo = rischioDi('mostro', difficoltaDi(t, t.file - 2, STANZE.mostro.rincaro))
  controlla('lo stesso mostro in fondo mostra più ⚡ che all\'ingresso',
            inFondo > inCima, `${inCima} contro ${inFondo}`)
  uguale('una stanza senza domande non mostra niente, per quanto in fondo sia',
         rischioDi('fuoco', 1), 0)

  let scesi = 0, saliti = 0
  const rnd = caso(7)
  for (let i = 0; i < 20; i++) {
    const tutte = generaMappa(t, rnd).tutte
    for (const a of tutte)
      for (const b of tutte)
        if (a.tipo === b.tipo && a.riga < b.riga) {
          if (b.rischio > a.rischio) saliti++
          else if (b.rischio < a.rischio) scesi++
        }
  }
  uguale('sulla mappa una stanza più in giù non mostra mai meno ⚡ di una uguale più in su', scesi, 0)
  controlla('e scendendo capita che ne mostri di più', saliti > 0)
}

/* ══════════ 5. i tre piani ══════════
   Non sono una scritta sulla mappa: sono il posto dove cade il bottino
   buono e il collo di bottiglia che chiude un pezzo di discesa. */
{
  const file = 18
  uguale('la prima fila è del primo piano', pianoDi(0, file), 0)
  uguale('e l\'ultima dell\'ultimo', pianoDi(file - 1, file), QUANTI_PIANI - 1)
  uguale('il guardiano chiude l\'ultimo piano', finePiano(QUANTI_PIANI - 1, file), file - 1)
  controlla('ogni piano finisce dove comincia il prossimo',
            Array.from({ length: QUANTI_PIANI - 1 }, (_, p) =>
              pianoDi(finePiano(p, file) + 1, file) === p + 1).every(Boolean))
  /* il bottino buono cade presto: al terzo piano non si trovano più
     armi nuove, perché non ci sarebbe più strada per usarle */
  controlla('il secondo piano è quello della roba migliore',
            GRADO_DEL_PIANO[1] === Math.max(...GRADO_DEL_PIANO))
  controlla('e l\'ultimo non lascia più niente di buono',
            GRADO_DEL_PIANO.at(-1) < GRADO_DEL_PIANO[0])
  uguale('quindi un mostro grosso dell\'ultimo piano non lascia la lama',
         gradoBottino('grosso', QUANTI_PIANI - 1) < TESORI.lama.grado, true)
  controlla('mentre nel secondo sì', gradoBottino('scrigno', 1) >= TESORI.lama.grado)
}

/* ══════════ 6. la mappa non si chiude mai ══════════ */
{
  let guasti = 0, ingressiStorti = 0, senzaScrigno = 0, senzaFuoco = 0, capiStorti = 0
  const rnd = caso(31)
  for (const t of CAMPAGNA)
    for (let i = 0; i < 20; i++) {
      const m = generaMappa(t, rnd)
      guasti += guastiDellaMappa(m).length
      if (m.ingressi.length < 2 || m.ingressi.length > 3) ingressiStorti++
      for (let p = 0; p < QUANTI_PIANI; p++) {
        const suoi = m.tutte.filter(s => pianoDi(s.riga, m.quanteFile) === p)
        if (!suoi.some(s => s.tipo === 'scrigno')) senzaScrigno++
        const capo = m.file[finePiano(p, m.quanteFile)]
        if (capo.length !== 1 || !['capo', 'boss'].includes(capo[0].tipo)) capiStorti++
        /* la fila prima di ogni capo è sempre di riposo: arrivarci
           senza aver potuto rifiatare non è difficile, è ingiusto */
        if (!m.file[finePiano(p, m.quanteFile) - 1].every(s => s.tipo === 'fuoco')) senzaFuoco++
      }
    }
  uguale('180 mappe e nessuna strada chiusa', guasti, 0)
  uguale('gli ingressi sono sempre due o tre', ingressiStorti, 0)
  uguale('ogni piano ha il suo scrigno', senzaScrigno, 0)
  uguale('ogni piano finisce con un capo, da solo', capiStorti, 0)
  uguale('e prima di ogni capo si può rifiatare', senzaFuoco, 0)
}
{
  const firma = m => m.file.map(f => f.map(s => s.tipo[0] + s.xn.toFixed(2)).join('')).join('|')
  uguale('lo stesso seme dà la stessa mappa',
         firma(generaMappa(CAMPAGNA[5], caso(99))), firma(generaMappa(CAMPAGNA[5], caso(99))))
  controlla('semi diversi danno mappe diverse',
            firma(generaMappa(CAMPAGNA[5], caso(1))) !== firma(generaMappa(CAMPAGNA[5], caso(2))))
}
{
  let storte = 0
  const rnd = caso(4)
  for (let a = 1; a <= 4; a++)
    for (let b = 1; b <= 4; b++)
      for (let i = 0; i < 50; i++) {
        const archi = scaletta(a, b, rnd)
        const esce = new Array(a).fill(0), entra = new Array(b).fill(0)
        for (const [x, y] of archi) { esce[x]++; entra[y]++ }
        if (esce.some(n => n < 1) || entra.some(n => n < 1)) storte++
        if (esce.some(n => n > Math.max(2, b)) || entra.some(n => n > Math.max(2, a))) storte++
        if (archi.length !== a + b - 1) storte++
      }
  uguale('la scaletta lega tutti senza fare ragnatele', storte, 0)
}

/* ══════════ 7. cosa costa sbagliare ══════════ */
/* una corsa con la stanza che si vuole già aperta: si costruisce a mano
   invece di generarne mille sperando che esca */
function corsaCon(tipo, opzioni = {}) {
  const tappa = { ...CAMPAGNA[3], ...opzioni.tappa }
  const rnd = opzioni.rnd || caso(2)
  for (let i = 0; i < 200; i++) {
    const corsa = new Corsa(tappa, { rnd, tappeFatte: opzioni.tappeFatte ?? 3 })
    for (let passi = 0; passi < 30 && corsa.dove === 'mappa'; passi++) {
      const meta = corsa.aperte().find(x => x.tipo === tipo)
      if (meta) { corsa.entra(meta); return corsa }
      const avanti = corsa.aperte()[0]
      if (!avanti) break
      corsa.entra(avanti)
      if (corsa.stanza?.che === 'sfida') {
        while (corsa.stanza && corsa.stanza.momento !== 'esito') corsa.rispondi(true)
      } else if (corsa.stanza) corsa.scegli(corsa.stanza.voci.at(-1).chiave)
      if (corsa.dove === 'stanza') corsa.esci()
      if (corsa.finita) break
    }
  }
  return null
}

{
  const corsa = corsaCon('mostro')
  controlla('un mostro si trova sempre nella prima fila', corsa !== null)
  const st = corsa.stanza
  controlla('un mostro ha vita, attacco e difesa',
            st.mostro.vita > 0 && st.mostro.attacco > 0 && st.mostro.difesa >= 0)
  uguale('e la prima cosa che vuole è una domanda', st.momento, 'domanda')
  const vitaPrima = corsa.vita, vitaMostro = st.mostro.vita
  const esito = corsa.rispondi(true)
  uguale('rispondendo bene gli si toglie vita',
         st.mostro.vita, vitaMostro - colpoDellEroe(corsa.attacco, st.mostro.difesa))
  uguale('ma lui ti graffia lo stesso', corsa.vita, vitaPrima - GRAFFIO)
  uguale('e il cartello lo dice', esito.che, 'colpo')
}
{
  const corsa = corsaCon('mostro')
  const st = corsa.stanza
  const vitaPrima = corsa.vita, vitaMostro = st.mostro.vita
  const colpo = colpoDelMostro(st.mostro.attacco, corsa.difesa)
  const esito = corsa.rispondi(false)
  uguale('sbagliando si prende un colpo pieno', corsa.vita, vitaPrima - colpo)
  controlla('che fa più male di un graffio', colpo > GRAFFIO)
  uguale('e al mostro non si toglie niente', st.mostro.vita, vitaMostro)
  uguale('il mostro è ancora lì', esito.che, 'ferito')
  controlla('ma la corsa non finisce', corsa.finita === false)
  corsa.continua()
  uguale('e si riprova', corsa.stanza.momento, 'domanda')
}
{
  /* il potenziamento, giocato: la stessa stanza con la lama in mano
     costa meno domande. È la promessa del gioco, provata sul motore. */
  const rnd = caso(55)
  const conta = (chiave) => {
    const corsa = corsaCon('mostro', { rnd: caso(55) })
    if (chiave) corsa.prendi(chiave)
    let n = 0
    while (corsa.stanza && corsa.stanza.momento !== 'esito' && n < 40) { corsa.rispondi(true); n++ }
    return n
  }
  const nudo = conta(null), armato = conta('lama')
  controlla('con la lama in mano lo stesso mostro cade prima',
            armato < nudo, `${nudo} domande a mani nude, ${armato} con la lama`)
}
{
  /* ── lo scrigno non si combatte ──
     È la strada che si sceglie **per non combattere**: una domanda
     sola, niente scambio di colpi, niente graffi. Quello che si rischia
     è il tesoro, non la pelle. */
  const corsa = corsaCon('scrigno')
  controlla('uno scrigno si trova', corsa !== null)
  const vita = corsa.vita, gemme = corsa.gemme
  uguale('la serratura non picchia', corsa.stanza.mostro.attacco, 0)
  const esito = corsa.rispondi(true)
  uguale('una domanda sola e si apre', corsa.stanza.momento, 'esito')
  uguale('senza combattere niente', esito.che, 'vinto')
  /* «non è calata» e non «è uguale»: dentro può esserci una bistecca,
     che la vita la alza — e sarebbe un guasto del test, non del gioco */
  controlla('e senza un graffio', corsa.vita >= vita, `${vita} → ${corsa.vita}`)
  controlla('e dentro c\'è qualcosa', esito.gemme > 0 || !!esito.tesoro)
}
{
  const corsa = corsaCon('scrigno')
  const vita = corsa.vita, gemme = corsa.gemme
  const esito = corsa.rispondi(false)
  uguale('sbagliando lo scrigno resta chiuso', esito.che, 'sfumato')
  uguale('e non costa nemmeno un punto vita', corsa.vita, vita)
  uguale('e non lascia niente', corsa.gemme, gemme)
  controlla('la corsa continua', corsa.finita === false)
  corsa.esci()
  uguale('si torna sulla mappa', corsa.dove, 'mappa')
}
{
  /* nessun singolo sbaglio manda a casa chi ha ancora vita: si perde
     solo finendola, ed è la regola che tiene un bambino al gioco */
  const corsa = corsaCon('mostro')
  const colpo = colpoDelMostro(corsa.stanza.mostro.attacco, corsa.difesa)
  corsa.vita = colpo * 2 + 1
  corsa.rispondi(false); corsa.continua()
  controlla('con vita di scorta si va avanti', corsa.finita === false)
  corsa.rispondi(false); corsa.continua()
  controlla('ancora', corsa.finita === false)
  corsa.rispondi(false)
  uguale('finita la vita, la discesa è finita', corsa.esito, 'persa')
  uguale('e non si porta a casa niente', corsa.monete, 0)
  uguale('nemmeno una stella', corsa.stelle, 0)
}
{
  /* scappare: costa il bottino, non la pelle */
  const corsa = corsaCon('grosso') || corsaCon('mostro')
  corsa.rispondi(false)
  const vita = corsa.vita, gemme = corsa.gemme
  controlla('si può scappare da uno scontro', corsa.scappa() === true)
  uguale('scappare non toglie altra vita', corsa.vita, vita)
  uguale('e non lascia gemme', corsa.gemme, gemme)
  corsa.esci()
  uguale('la strada continua', corsa.dove, 'mappa')
}
{
  /* dal capo del piano e dal guardiano non si scappa: sono il collo di
     bottiglia, e una via di fuga li renderebbe facoltativi */
  controlla('dal capo non si scappa', STANZE.capo.scappabile !== true)
  controlla('e dal guardiano nemmeno', STANZE.boss.scappabile !== true)
}

/* ══════════ 8. le stanze tranquille ══════════ */
{
  const corsa = corsaCon('fuoco')
  controlla('un fuoco da campo si trova', corsa !== null)
  uguale('al fuoco non si risponde a niente', corsa.stanza.che, 'scelte')
  controlla('e si può curare o allenare', corsa.stanza.voci.length >= 3)
  corsa.vita = corsa.vitaMax - TARATURA.cura
  corsa.scegli('riposa')
  uguale('riposare rimette in sesto', corsa.vita, corsa.vitaMax)
  controlla('e chiude la stanza', corsa.stanza.esito !== null)
}
{
  const corsa = corsaCon('fuoco')
  const attacco = corsa.attacco
  corsa.scegli('allena:attacco')
  uguale('allenarsi alza l\'attacco', corsa.attacco, attacco + TARATURA.allenamento)
  controlla('e resta alzato', corsa.attaccoBase > BASE.attacco)
}
{
  const corsa = corsaCon('fuoco')
  /* ci si arriva coi graffi della strada: qui interessa il caso di chi
     al fuoco ci arriva intero, che è l'unico in cui la sosta rischia di
     essere sprecata */
  corsa.vita = corsa.vitaMax
  const max = corsa.vitaMax
  corsa.scegli('riposa')
  uguale('chi riposa già pieno diventa più resistente', corsa.vitaMax, max + TARATURA.cura)
  uguale('e ce l\'ha subito', corsa.vita, max + TARATURA.cura)
}
{
  const corsa = corsaCon('negozio')
  controlla('un mercante si trova', corsa !== null)
  corsa.gemme = 0
  corsa.rifaiVetrina()
  const merce = corsa.stanza.voci.filter(v => v.prezzo)
  controlla('la merce ha i prezzi', merce.length >= 2)
  controlla('senza gemme non si compra niente', merce.every(v => v.spento))
  uguale('comprare senza gemme non succede', corsa.scegli(merce[0].chiave), null)
  corsa.gemme = 60
  corsa.rifaiVetrina()
  const prima = corsa.stanza.voci.find(v => v.chiave.startsWith('compra:'))
  corsa.scegli(prima.chiave)
  uguale('comprando si spendono le gemme', corsa.gemme, 60 - prima.prezzo)
  controlla('il mercante resta aperto', corsa.stanza.esito === null)
  controlla('e quello che è stato venduto non si ricompra',
            !corsa.stanza.voci.some(v => v.chiave === prima.chiave))
  corsa.scegli('via')
  controlla('finché non si va via', corsa.stanza.esito !== null)
}
{
  const corsa = corsaCon('bivio')
  controlla('una stranezza si trova', corsa !== null)
  uguale('le scelte di una stranezza sono due', corsa.stanza.voci.length, 2)
  controlla('almeno una delle due è un azzardo o costa',
            corsa.stanza.voci.some(v => v.azzardo || v.prezzo))
  const esito = corsa.scegli(corsa.stanza.voci.find(v => !v.spento).chiave)
  controlla('e ne esce un cartello', esito === null || (esito.tit && esito.testo))
}

/* ══════════ 9. i conti di fine tappa ══════════ */
uguale('arrivare quasi interi vale tre stelle', stellePerVita(95, 100), 3)
uguale('arrivare a metà ne vale due', stellePerVita(50, 100), 2)
uguale('arrivare col fiato corto una sola', stellePerVita(5, 100), 1)
uguale('e non si scende mai sotto una', stellePerVita(0, 100), 1)
{
  const rnd = caso(21)
  let cima = 0, fondo = 0
  for (let i = 0; i < 400; i++) { cima += bottinoDi(1, 0, rnd); fondo += bottinoDi(1, 1, rnd) }
  controlla('più si scende più si trova', fondo > cima * 1.4, `${cima} contro ${fondo}`)
  uguale('una stanza che non paga non paga', bottinoDi(0, 1, rnd), 0)
  controlla('un mostro solo non basta a comprare un\'arma',
            bottinoDi(STANZE.mostro.ricchezza, 1, rnd) < TESORI.spadino.prezzo)
}
{
  const corsa = new Corsa(CAMPAGNA[0], { rnd: caso(3) })
  uguale('una discesa non finita non vale niente', corsa.monete, 0)
  corsa.esito = 'vinta'
  uguale('vinta senza un graffio: premio pieno', corsa.monete, CAMPAGNA[0].premio * 3)
  corsa.vita = 1
  uguale('vinta a fatica: premio a una stella', corsa.monete, CAMPAGNA[0].premio)
}
{
  /* l'equipaggiamento che si ha già non ricapita, e quello peggiore
     nemmeno: un premio che toglie è peggio di nessun premio */
  const restano = tesoriPossibili({ mano: 'lama', addosso: 'manto', presi: { lanterna: true } })
  controlla('con tutto addosso resta solo roba senza casella',
            restano.every(k => !TESORI[k].casella), restano.join())
  const corsa = new Corsa(CAMPAGNA[0], { rnd: caso(3) })
  corsa.prendi('lama')
  uguale('prendere uno spadino con la lama in mano non succede', corsa.prendi('spadino'), null)
  uguale('la lama resta in mano', corsa.mano, 'lama')
  const lasciato = corsa.prendi('spada')
  uguale('e nemmeno la spada di ferro', lasciato, null)
}
{
  const corsa = new Corsa(CAMPAGNA[0], { rnd: caso(3) })
  corsa.prendi('spadino')
  const lasciato = corsa.prendi('lama')
  uguale('ma la lama sostituisce lo spadino', corsa.mano, 'lama')
  uguale('e il gioco sa cosa hai lasciato', lasciato, 'spadino')
}

/* ══════════ 10. le nove tappe si vincono davvero ══════════ */
nota('tappa                 file  dom.  att/dif  arma  ' + ATTESE.map(a => a.chiave.padStart(8)).join(''))
for (const [i, t] of CAMPAGNA.entries()) {
  const quote = {}
  for (const [k, a] of ATTESE.entries()) {
    const m = misura(t, { volte: 60, bravura: a.bravura, rnd: caso(1000 + i * 10 + k), tappeFatte: i })
    quote[a.chiave] = m
    if (a.minimo !== undefined)
      controlla(`tappa ${i + 1} (${t.nome}): ${a.nome} arriva in fondo`,
                m.quota >= a.minimo, `ce la fa il ${(m.quota * 100).toFixed(0)}%, ne serve il ${(a.minimo * 100).toFixed(0)}%`)
    if (a.massimo !== undefined)
      controlla(`tappa ${i + 1} (${t.nome}): ${a.nome} NON ci arriva`,
                m.quota <= a.massimo, `ce la fa il ${(m.quota * 100).toFixed(0)}%`)
    uguale(`tappa ${i + 1} (${t.nome}): nessuna corsa si impianta`, m.bloccate, 0)
  }
  const bambino = quote['bambino']
  nota(`${(i + 1 + '. ' + t.nome).padEnd(22)}${String(t.file).padStart(3)}` +
       `${bambino.domandeMedie.toFixed(0).padStart(6)}` +
       `${(bambino.attaccoFine.toFixed(0) + '/' + bambino.difesaFine.toFixed(0)).padStart(9)}` +
       `${(bambino.quotaArma * 100).toFixed(0).padStart(5)}%  ` +
       ATTESE.map(a => (quote[a.chiave].quota * 100).toFixed(0).padStart(7) + '%').join(''))
  /* Una tappa deve costare quello che promette: la forbice la
     dichiara `dati/taratura.js`, non questo file. */
  dentro(`tappa ${i + 1} (${t.nome}): quante domande costa`,
         bambino.domandeMedie, DOMANDE.minimo, DOMANDE.massimo)
  /* e chi ci gioca si deve equipaggiare: una tappa in cui si arriva in
     fondo a mani vuote è una tappa in cui il bottino non serve */
  controlla(`tappa ${i + 1} (${t.nome}): ci si arma per strada`,
            bambino.quotaArma >= 0.6,
            `arriva armato il ${(bambino.quotaArma * 100).toFixed(0)}%`)
}
{
  /* la campagna è una salita anche in domande, non solo nei numeri */
  const rnd = caso(777)
  const costo = (t, i) => misura(t, { volte: 40, bravura: 0.8, rnd, tappeFatte: i }).domandeMedie
  controlla('l\'ultima tappa costa più domande della prima',
            costo(CAMPAGNA[8], 8) > costo(CAMPAGNA[0], 0) * 1.2)
}
{
  /* IL CUORE DEL GIOCO NUOVO: chi scende più in basso ci arriva con
     roba migliore. Se questo non fosse vero, le stanze difficili non le
     sceglierebbe più nessuno e il bottino sarebbe una decorazione. */
  const corta = gradoInFondo(CAMPAGNA[0], { volte: 30, rnd: caso(88), tappeFatte: 0 })
  const lunga = gradoInFondo(CAMPAGNA[8], { volte: 30, rnd: caso(88), tappeFatte: 8 })
  controlla('in una discesa lunga ci si equipaggia meglio che in una corta',
            lunga > corta, `${corta.toFixed(1)} contro ${lunga.toFixed(1)} gradi`)
  nota(`equipaggiamento in fondo: ${corta.toFixed(1)} gradi nella cantina, ${lunga.toFixed(1)} nel covo`)
}
{
  /* il gioco libero regge come le tappe */
  for (const l of LIBERE) {
    const t = tappaLibera(l.chiave, 'covo')
    const m = misura(t, { volte: 40, bravura: 0.75, rnd: caso(500 + l.file), tappeFatte: 8 })
    controlla(`la discesa libera «${l.nome}» si porta a casa`, m.quota >= 0.5,
              `ce la fa il ${(m.quota * 100).toFixed(0)}%`)
    nota(`libera ${l.nome.padEnd(14)} ${(m.quota * 100).toFixed(0)}% in ${m.domandeMedie.toFixed(0)} domande`)
  }
}
{
  /* chi risponde sempre giusto prende solo graffi, quindi finisce quasi
     sempre in cima alla scala delle stelle */
  const m = misura(CAMPAGNA[4], { volte: 40, bravura: 1, rnd: caso(64), tappeFatte: 4 })
  dentro('chi non sbaglia mai finisce quasi sempre con tre stelle', m.stelleMedie, 2.2, 3)
}

/* ══════════ 11. quello che il gioco porta all'albo ══════════ */
{
  const guasti = guastiDellAlbo([manifesto])
  controlla("l'albo del dungeon non ha guasti", guasti.length === 0, guasti.join(' · '))

  const FINITO = { dungeonStanze: 400, dungeonBoss: 22, dungeonInteri: 11,
                   dungeonTesori: 60, dungeonFila: 10 }
  const misure = pieno => ({
    tot: k => pieno ? (FINITO[k] ?? 0) : 0,
    best: k => pieno ? (FINITO[k] ?? 0) : 0,
    tappeDi: ch => pieno && ch === CHIAVE ? QUANTE_TAPPE : 0,
    stelleDi: ch => pieno && ch === CHIAVE ? QUANTE_TAPPE * 3 : 0,
    finita: ch => pieno && ch === CHIAVE ? 1 : 0,
  })
  const pieno = misure(true), vuoto = misure(false)

  for (const t of manifesto.albo.traguardi) {
    const alto = Math.max(...t.soglie), basso = Math.min(...t.soglie)
    controlla(`traguardo "${t.id}": si prende tutto, giocandoci`,
              t.valore(pieno) >= alto, `vale ${t.valore(pieno)}, ne serve ${alto}`)
    controlla(`traguardo "${t.id}": non è già preso a profilo vuoto`,
              t.valore(vuoto) < basso, `vale ${t.valore(vuoto)} contro ${basso}`)
    controlla(`traguardo "${t.id}": sa dire cosa chiede`,
              typeof t.come(basso) === 'string' && t.come(basso).length > 8)
  }
  controlla("l'esperienza cresce giocando",
            manifesto.albo.xp(pieno) > manifesto.albo.xp(vuoto) * 10 + 100)
  uguale('a profilo vuoto non si è preso niente', manifesto.albo.xp(vuoto), 0)
  controlla('chi non ha mai giocato non risulta averlo provato',
            manifesto.albo.provato(vuoto) === false)
  controlla('chi ci ha giocato sì', manifesto.albo.provato(pieno) === true)
}

/* ══════════ 12. le facce del posto ══════════ */
{
  const rnd = caso(12)
  let fuori = 0
  for (const [k, a] of Object.entries(AMBIENTI))
    for (let i = 0; i < 60; i++) {
      if (!a.mostri.includes(faccia(k, 'mostro', rnd))) fuori++
      if (!a.grossi.includes(faccia(k, 'grosso', rnd))) fuori++
      if (faccia(k, 'boss', rnd) !== a.boss) fuori++
    }
  uguale('i mostri sono sempre quelli di casa', fuori, 0)
}

riassunto('dungeon a bivi')
