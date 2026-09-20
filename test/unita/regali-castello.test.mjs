/* ═══════════════════════════════════════════════════════════════════
   I REGALI DELLA PARTITA LIBERA
   tempo: 60

   La partita libera cedeva **sempre alla stessa ondata** — la ventesima,
   con i cinque cuori intatti fino a lì — e non per come si giocava: a
   quel punto la difesa è già in cima alla scaletta e la vita dei nemici
   continua a salire del 45% a ondata. Un record che non si muove non è
   un record. Da qui i regali: ogni cinque ondate un potenziamento da
   scegliere, che **resta anche domani**.

   Quello che questo test tiene fermo, in ordine di quanto costerebbe
   sbagliarlo:

     1. **la campagna non cambia di un bit.** È tarata ondata per ondata
        (`npm run tara`), e un bonus che cresce col giocare renderebbe la
        promessa dei `calcoli` una cosa che dipende da quante partite
        libere si sono fatte. Una tappa della campagna con venti regali
        in tasca deve giocarsi identica a una senza.
     2. **zero regali = il gioco di ieri**, anche nella libera: i
        moltiplicatori partono da 1 e le somme da 0, quindi la prima
        partita di chi apre la modalità è quella su cui la taratura è
        stata fatta.
     3. **il catalogo**: id unici, ogni voce sposta qualcosa, e lo sposta
        nel verso giusto.
     4. **la cadenza**: uno ogni cinque ondate, l'ondata non parte finché
        non è scelto (così un regalo rimandato non si perde) e non se ne
        accumulano due.
     5. **i regali si sentono, e non rendono immortali**: con k regali si
        arriva più lontano che con zero, e con quaranta sulla stessa voce
        si muore comunque.

   `node test/esegui.mjs regali --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { REGALI, OGNI_REGALO, QUANTE_CARTE, LIBERA, LIBERE, TAPPE, MONDO, CFG,
         doniZero, doniDi, regaloDi, quantiRegali, regaliOfferti,
         tiroConDoni, geloConDoni, tiroDi, geloDi } from '../../src/data/castello.js'
import { creaBattaglia } from '../../src/motore/battaglia.js'
import { Nemico } from '../../src/motore/castello/nemico.js'
import { gioca, PROFILI, seme } from '../../strumenti/simula-castello.mjs'
import { regaliDi, regaloPreso } from '../../src/giochi/campagne.js'
import { state, init, creaGiocatore } from '../../src/store/profile.js'
import { controlla, uguale, stessaLista, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. il catalogo ══════════ */
const IDS = REGALI.map(r => r.id)
uguale('gli id dei regali sono unici', new Set(IDS).size, IDS.length)
dentro('il catalogo è corto quanto una scelta', REGALI.length, 5, 7)
for (const r of REGALI) {
  controlla(`${r.id}: si può mostrare su una carta`,
            !!(r.emoji && r.nome && r.che && r.per && typeof r.dai === 'function'),
            JSON.stringify({ emoji: r.emoji, nome: r.nome, che: r.che, per: r.per }))
  uguale(`${r.id}: si ritrova per id`, regaloDi(r.id), r)
}
controlla('un id che non esiste non è un regalo', regaloDi('cioccolata') === null)

/* i doni a riposo: moltiplicatori a 1, somme a 0. È la riga che rende
   «zero regali» e «nessun regalo» la stessa partita. */
{
  const z = doniZero()
  stessaLista('a riposo i moltiplicatori valgono 1',
              [z.danno.arciere, z.danno.magica, z.danno.bombe, z.danno.ghiaccio,
               z.raggio, z.veleno], [1, 1, 1, 1, 1, 1])
  stessaLista('e le somme valgono 0', [z.cadenza, z.gelo, z.fragile], [0, 0, 0])
  stessaLista('nessun regalo è come zero regali',
              JSON.stringify(doniDi(null)), JSON.stringify(doniDi({})))
}

/* ogni voce sposta qualcosa, e lo sposta nel verso giusto: un gradino
   che non cambia nulla è una carta che ruba una scelta */
for (const r of REGALI) {
  const uno = doniDi({ [r.id]: 1 }), dieci = doniDi({ [r.id]: 10 })
  const foto = d => JSON.stringify(d)
  controlla(`${r.id}: un grado cambia i doni`, foto(uno) !== foto(doniZero()))
  controlla(`${r.id}: dieci gradi contano dieci volte uno`,
            Object.keys(doniZero()).every(k => {
              if (k === 'danno') return true
              const passo = uno[k] - doniZero()[k]
              return Math.abs((dieci[k] - doniZero()[k]) - passo * 10) < 1e-9
            }))
  controlla(`${r.id}: non toglie niente`,
            ['raggio', 'veleno'].every(k => uno[k] >= 1) &&
            ['cadenza', 'gelo', 'fragile'].every(k => uno[k] >= 0) &&
            Object.values(uno.danno).every(v => v >= 1))
}
/* i gradi arrivano dal profilo, che è un file su un telefono: roba
   storta non deve piantare niente */
stessaLista('i gradi storti non contano',
            JSON.stringify(doniDi({ frecce: -3, incanto: 0.7, boh: 9, nulla: null })),
            JSON.stringify(doniZero()))
uguale('e si contano solo quelli veri', quantiRegali({ frecce: 3, incanto: 2, boh: 5 }), 5)
uguale('un profilo senza regali ne ha zero', quantiRegali(undefined), 0)

/* ── le tre carte ── */
{
  const giro = regaliOfferti(0)
  uguale('si offrono tre carte', giro.length, QUANTE_CARTE)
  uguale('e sono tre voci diverse', new Set(giro.map(r => r.id)).size, QUANTE_CARTE)
  const visti = new Set()
  for (let k = 0; k < REGALI.length; k++) regaliOfferti(k).forEach(r => visti.add(r.id))
  uguale('il giro fa passare tutto il catalogo', visti.size, REGALI.length)
  for (let k = 0; k < 20; k++)
    uguale(`il giro ${k} non ripete una carta`,
           new Set(regaliOfferti(k).map(r => r.id)).size, QUANTE_CARTE)
}

/* ══════════ 2. i doni addosso a una torre ══════════
   Le due funzioni pure che il motore chiama al posto di `tiroDi` e
   `geloDi`. Qui si prova che a mano sappiano fare i conti; che il
   motore le chiami davvero lo prova la battaglia più sotto. */
{
  uguale('senza doni il tiro è quello di sempre',
         JSON.stringify(tiroConDoni('add', 5, null, null)), JSON.stringify(tiroDi('add', 5)))
  uguale('e con i doni a riposo pure',
         JSON.stringify(tiroConDoni('add', 5, null, doniZero())), JSON.stringify(tiroDi('add', 5)))
  const d = doniDi({ frecce: 2 })
  controlla('due gradi di frecce alzano il danno dell\'arciere',
            tiroConDoni('add', 5, null, d).danno > tiroDi('add', 5).danno * 1.3,
            `${tiroDi('add', 5).danno.toFixed(1)} → ${tiroConDoni('add', 5, null, d).danno.toFixed(1)}`)
  uguale('e non toccano la magica',
         tiroConDoni('sub', 5, null, d).danno, tiroDi('sub', 5).danno)
  const c = doniDi({ cadenza: 5 })
  controlla('la cadenza accorcia la ricarica di tutte',
            tiroConDoni('sub', 5, null, c).ricarica < tiroDi('sub', 5).ricarica,
            `${tiroDi('sub', 5).ricarica.toFixed(2)}s → ${tiroConDoni('sub', 5, null, c).ricarica.toFixed(2)}s`)
  /* il veleno: vale solo per chi ha il ramo che avvelena, e sulla carta
     c'è scritto. Qui si prova che per quel ramo si sente. */
  const v = doniDi({ veleno: 4 })
  uguale('il veleno non tocca chi non avvelena', tiroConDoni('sub', 5, null, v).veleno, 0)
  controlla('e fa più male a chi ce l\'ha',
            tiroConDoni('sub', 5, 'veleno', v).veleno > tiroDi('sub', 5, 'veleno').veleno * 2,
            `${tiroDi('sub', 5, 'veleno').veleno.toFixed(1)} → ` +
            `${tiroConDoni('sub', 5, 'veleno', v).veleno.toFixed(1)}`)
  /* il gelo: dura di più **e** rende più fragile. La seconda metà è
     quella che conta, ed è il motivo per cui il regalo del ghiaccio non
     è «più gelo» e basta. */
  const g = doniDi({ gelo: 5 })
  const prima = geloDi(6), dopo = geloConDoni(6, null, g)
  controlla('il gelo regalato dura di più', dopo.durata > prima.durata + 1,
            `${prima.durata.toFixed(1)}s → ${dopo.durata.toFixed(1)}s`)
  controlla('e chi è gelato diventa più fragile', dopo.fragile > prima.fragile,
            `×${prima.fragile.toFixed(2)} → ×${dopo.fragile.toFixed(2)}`)
  uguale('senza doni il gelo è quello di sempre',
         JSON.stringify(geloConDoni(6, null, doniZero())), JSON.stringify(geloDi(6)))
  /* e la fragilità passa dal danno degli altri: è così che una torre
     che non ferisce fa male */
  const colpo = fragile => {
    const n = new Nemico({ vita: 1000, vel: 0, bestia: 'slime' })
    n.gela(3, 0.5, fragile)
    n.ferisci(100, 'add')
    return 1000 - n.vita
  }
  controlla('chi è gelato col regalo incassa di più', colpo(dopo.fragile) > colpo(prima.fragile),
            `${colpo(prima.fragile)} → ${colpo(dopo.fragile)}`)
}

/* ══════════ 3. il motore, nei due versi ══════════
   Il banco: una partita giocata col motore vero, senza schermo. */
const TUTTI = (quanti = 3) => Object.fromEntries(REGALI.map(r => [r.id, quanti]))

function partita(tappa, regali, { ondate = 8, s = 7 } = {}) {
  const stato = { cuori: 0, onda: 0, uccisi: 0, torri: 0, energia: 0 }
  const b = creaBattaglia({ tappa, misure: { ...MONDO }, stato, caso: seme(s), regali })
  b.inizia()
  /* due torri e via: il resto lo fa il tempo. Non si compra niente, così
     la partita è la stessa in tutte le prove e l'unica differenza sono i
     regali. */
  b.costruisci('add', { prezzo: 0 })
  b.costruisci(tappa.torri[1] || 'add', { prezzo: 0 })
  let t = 0, regalati = 0
  while (t < 60 * ondate && !b.finito) {
    if (b.regaliDaScegliere > 0) { b.prendiRegalo('frecce'); regalati++ }
    b.avanza(1 / 60); t += 1 / 60
  }
  return { uccisi: stato.uccisi, cuori: stato.cuori, onda: stato.onda,
           esito: b.finito, regalati, doni: b.doni }
}

/* ── 3a. la campagna li ignora, e non di poco: del tutto ── */
for (const i of [0, 7, 14]) {
  const t = TAPPE[i]
  const senza = partita(t, null), con = partita(t, TUTTI(20))
  stessaLista(`${i + 1}. ${t.nome}: con venti regali in tasca è la stessa partita`,
              [senza.uccisi, senza.cuori, senza.onda], [con.uccisi, con.cuori, con.onda])
  uguale(`${i + 1}. ${t.nome}: e nessun regalo entra in campo`,
         JSON.stringify(con.doni), JSON.stringify(doniZero()))
  uguale(`${i + 1}. ${t.nome}: e non ne arriva nessuno da scegliere`, con.regalati, 0)
}
/* le tappe che li prevedono sono le quattro libere, e lo dichiarano */
uguale('nessuna tappa della campagna prevede i regali', TAPPE.filter(t => t.regali).length, 0)
controlla('e le quattro partite libere li prevedono tutte',
          LIBERE.length === 4 && LIBERE.every(l => l.regali === true))

/* ── 3b. in ogni libera, zero regali è il gioco di ieri ── */
for (const l of LIBERE) {
  const senza = partita(l, null), zero = partita(l, {})
  stessaLista(`${l.nome}: zero regali gioca come nessun regalo`,
              [senza.uccisi, senza.cuori], [zero.uccisi, zero.cuori])
  const con = partita(l, { frecce: 10 })
  controlla(`${l.nome}: e con dieci gradi di frecce si ferma più gente`,
            con.uccisi > senza.uccisi, `${senza.uccisi} → ${con.uccisi} nemici fermati`)
}

/* ── 3c. la cadenza ──
   Uno ogni `OGNI_REGALO` ondate; finché non è scelto l'ondata dopo non
   parte; prenderlo lo consuma; e due non se ne accumulano. */
{
  const stato = { cuori: 0, onda: 0, uccisi: 0, torri: 0, energia: 0 }
  const b = creaBattaglia({ tappa: LIBERA, misure: { ...MONDO }, stato, caso: seme(7) })
  b.inizia()
  /* una difesa regalata e alta: qui si misura il ritmo dei regali, non
     se la partita si regge, e una torre di livello 1 alla quinta ondata
     perde i cuori prima di arrivare al punto */
  for (const k of LIBERA.torri) {
    const torre = b.costruisci(k, { prezzo: 0 })
    for (let lv = 1; lv < 8; lv++) b.potenzia(torre, { prezzo: 0 })
  }
  uguale('a partita appena aperta non c\'è nessun regalo', b.regaliDaScegliere, 0)
  /* Si gioca a mano finché la quinta ondata non è finita. L'ondata si
     chiama **dopo** aver fatto passare un fotogramma a campo pulito, che
     è quello che succede nel gioco: il tasto «manda l'ondata» compare
     perché `aggiornaVista` l'ha visto pulito, cioè dopo un `avanza`. È
     in quel fotogramma che l'ondata si chiude — premio, moneta e
     regalo. */
  let t = 0
  while (t < 900 && b.regaliDaScegliere === 0 && !b.finito) {
    b.avanza(1 / 60); t += 1 / 60
    if (b.inAttesa() && b.ondaChiusa) b.chiamaOnda()
  }
  uguale('e la partita è arrivata fin lì', stato.onda, OGNI_REGALO)
  uguale(`alla fine dell'ondata ${OGNI_REGALO} arriva un regalo`, b.regaliDaScegliere, 1)
  const onda = stato.onda
  /* l'ondata non parte: né chiamandola, né lasciando passare il tempo */
  uguale('chiamare l\'ondata con un regalo in sospeso non fa niente', b.chiamaOnda(), false)
  for (let k = 0; k < 60 * (LIBERA.attesa + 20); k++) b.avanza(1 / 60)
  uguale('e non parte nemmeno da sola', stato.onda, onda)
  uguale('il regalo è ancora lì, non se n\'è perso e non se n\'è aggiunto',
         b.regaliDaScegliere, 1)
  /* si prende */
  const presi = b.prendiRegalo('frecce')
  uguale('preso, il conto torna a zero', b.regaliDaScegliere, 0)
  uguale('e il grado è scritto', presi.frecce, 1)
  uguale('i regali presi si contano', b.regaliPresi, 1)
  controlla('le torri già in piedi ce l\'hanno addosso subito',
            b.torri.every(x => x.doni === b.doni) && b.doni.danno.arciere > 1)
  controlla('e adesso l\'ondata riparte', b.chiamaOnda() === true)
  /* un regalo che non esiste non si prende, e non consuma niente */
  uguale('un id inventato non è un regalo', b.prendiRegalo('cioccolata'), null)
  uguale('e i gradi restano quelli', b.regaliPresi, 1)
}

/* ══════════ 4. quanto valgono, misurato giocando ══════════
   La scala è a gradoni — oltre la ventesima la vita sale del 45% a
   ondata, e passare un muro fa arrivare di colpo tre ondate più in là —
   quindi qui non si controlla «un regalo, un'ondata»: si controlla che
   la curva **salga** e che non finisca mai in cielo.

   `tempo: 60` in testa al file: sono partite vere giocate fino alla
   sconfitta, e costano secondi. La scala si misura **sulla prima
   libera** (il bosco, che è anche quella che eredita il record di
   ieri): le altre tre hanno la loro tabella e il loro muro, e che
   ognuna regga e ceda lo controlla `unita/castello`. Misurarla quattro
   volte costerebbe quattro volte tanto per dire la stessa cosa — i
   regali sono gli stessi, e la curva sale a moltiplicare dappertutto. */
/* si gioca com'è in gioco (`ondate: Infinity`), non come una campagna
   da novanta: cambierebbe da quando le ondate arrivano da tutte e due
   le bocche. `attesa: 1` toglie solo il tempo morto: il metro non
   chiama mai l'ondata, e trenta secondi per trentasette ondate sono
   mezz'ora dell'ora che il simulatore concede a una partita — con
   cento regali si arrivava allo stallo per orologio, non per difesa */
const LUNGA = { ...LIBERA, attesa: 1 }
const SEMI = [7, 29]
const spalma = k => {
  const o = {}
  for (let i = 0; i < k; i++) { const id = IDS[i % IDS.length]; o[id] = (o[id] || 0) + 1 }
  return o
}
const finoDove = regali => {
  const r = SEMI.map(s => gioca(LUNGA, { ...PROFILI.misura, s, regali }))
  return { onda: r.reduce((n, x) => n + x.onda, 0) / r.length,
           persa: r.every(x => x.esito === 'persa') }
}

const scala = [0, 10, 35, 140].map(k => ({ k, ...finoDove(spalma(k)) }))
for (const [i, p] of scala.entries()) {
  if (i) controlla(`${p.k} regali non portano meno lontano di ${scala[i - 1].k}`,
                   p.onda >= scala[i - 1].onda,
                   `o${scala[i - 1].onda.toFixed(1)} → o${p.onda.toFixed(1)}`)
  controlla(`con ${p.k} regali si perde comunque`, p.persa,
            `con ${p.k} regali la partita non finisce più: la libera diventa una schermata fissa`)
}
controlla('i regali si sentono: dieci portano più lontano di zero',
          scala[1].onda > scala[0].onda,
          `zero → o${scala[0].onda.toFixed(1)}, dieci → o${scala[1].onda.toFixed(1)}`)
/* il rendimento cala: i primi dieci regali comprano ondate, gli ultimi
   cento molte meno per regalo. È la condizione perché accumularli per
   sempre non porti in cielo — la vita dei nemici cresce a moltiplicare,
   i regali a sommare, e il moltiplicare vince sempre. */
const perRegalo = (a, b) => (scala[b].onda - scala[a].onda) / (scala[b].k - scala[a].k)
controlla('e cento non rendono immortali: il rendimento cala',
          perRegalo(2, 3) < perRegalo(0, 1) / 2,
          `${perRegalo(0, 1).toFixed(2)} ondate per regalo all'inizio, ` +
          `${perRegalo(2, 3).toFixed(2)} in fondo`)
nota('fin dove arriva il metro: ' + scala.map(p => `${p.k} regali → o${p.onda.toFixed(1)}`).join(' · '))
/* e quaranta tutti sulla stessa voce: è previsto (si può riprendere lo
   stesso regalo quante volte si vuole) e non deve sfondare il gioco */
const soli = REGALI.map(r => ({ r, ...finoDove({ [r.id]: 40 }) }))
for (const { r, persa, onda } of soli)
  controlla(`quaranta ${r.id}: si muore comunque`, persa, `o${onda}`)
nota('quaranta gradi su una voce sola: ' +
     soli.map(({ r, onda }) => `${r.emoji} o${onda.toFixed(0)}`).join(' · '))

/* ══════════ 5. il posto nel profilo ══════════
   Fuori dal browser l'archivio degrada in memoria da sé, quindi il giro
   vero si fa qui: prendere un regalo, rileggerlo, e non trovarne
   nessuno in un profilo che non ne ha mai preso uno. */
{
  await init()
  await creaGiocatore('Prova')

  stessaLista('un profilo nuovo non ha nessun regalo', regaliDi('torri'), {})
  uguale('e non se li scrive da sé leggendoli',
         (state.profile.campagne || {}).torri, undefined)

  const uno = regaloPreso('torri', 'frecce')
  uguale('il regalo preso si scrive', uno.frecce, 1)
  uguale('e sta accanto al record, in campagne.torri.regali',
         state.profile.campagne.torri.regali.frecce, 1)
  regaloPreso('torri', 'frecce')
  regaloPreso('torri', 'gelo')
  uguale('lo stesso regalo si riprende', regaliDi('torri').frecce, 2)
  uguale('e ognuno tiene il suo conto', regaliDi('torri').gelo, 1)
  uguale('in tutto sono tre', quantiRegali(regaliDi('torri')), 3)

  /* il record non lo tocca nessuno: sono due cose che vivono accanto */
  state.profile.campagne.torri.primato = { best: 21, partite: 3, ultime: [] }
  regaloPreso('torri', 'vista')
  uguale('prendere un regalo non tocca il record',
         state.profile.campagne.torri.primato.best, 21)
  uguale('né le tappe fatte', state.profile.campagne.torri.tappa, 0)

  /* un profilo di ieri: la voce c'è, il campo dei regali no */
  state.profile.campagne.altro = { tappa: 2, libera: false, stelle: {}, cfg: {} }
  stessaLista('un profilo senza il campo parte da zero', regaliDi('altro'), {})
  uguale('e la prima scrittura lo crea', regaloPreso('altro', 'polvere').polvere, 1)

  /* e la copia che esce non è quella dentro il profilo: chi la tiene in
     un `ref` non deve poter cambiare il salvataggio scrivendoci dentro */
  const copia = regaloPreso('torri', 'incanto')
  copia.incanto = 99
  uguale('quello che torna è una copia', regaliDi('torri').incanto, 1)
}

nota(`un regalo ogni ${OGNI_REGALO} ondate · ${REGALI.length} voci in catalogo · ` +
     `${QUANTE_CARTE} carte per volta · ${CFG.cuori} cuori come sempre`)
riassunto('i regali della partita libera')
