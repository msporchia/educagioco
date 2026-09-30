/* ═══════════════════════════════════════════════════════════════════
   I REGALI DELLA PARTITA LIBERA
   tempo: 60

   La partita libera cedeva **sempre alla stessa ondata** — la ventesima,
   con i cinque cuori intatti fino a lì — e non per come si giocava: a
   quel punto la difesa è già in cima alla scaletta e la vita dei nemici
   continua a salire del 30% a ondata. Un record che non si muove non è
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
     5. **i regali si sentono, e non rendono immortali**: con cento
        gradi (venticinque partite) ogni libera arriva più lontano che
        con zero, con quattrocento si muore comunque, e con quaranta
        sulla stessa voce pure.

   `node test/esegui.mjs regali --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { REGALI, OGNI_REGALO, QUANTE_CARTE, LIBERA, LIBERE, TAPPE, MONDO, CFG, sequenzaTorri,
         doniZero, doniDi, regaloDi, quantiRegali, regaliOfferti,
         tiroConDoni, geloConDoni, tiroDi, geloDi } from '../../src/data/castello.js'
import { creaBattaglia } from '../../src/motore/battaglia.js'
import { Nemico } from '../../src/motore/castello/nemico.js'
import { finoDove } from '../../strumenti/regali-castello.mjs'
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
  /* un grado è piccolo apposta (+8% all'arciere, +5% agli altri): qui
     si prova che si somma, due gradi di frecce sono +16% */
  const d = doniDi({ frecce: 2 })
  controlla('due gradi di frecce alzano il danno dell\'arciere',
            Math.abs(tiroConDoni('add', 5, null, d).danno - tiroDi('add', 5).danno * 1.16) < 1e-9,
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
            tiroConDoni('sub', 5, 'veleno', v).veleno > tiroDi('sub', 5, 'veleno').veleno * 1.3,
            `${tiroDi('sub', 5, 'veleno').veleno.toFixed(1)} → ` +
            `${tiroConDoni('sub', 5, 'veleno', v).veleno.toFixed(1)}`)
  /* il gelo: dura di più **e** rende più fragile. La seconda metà è
     quella che conta, ed è il motivo per cui il regalo del ghiaccio non
     è «più gelo» e basta. */
  const g = doniDi({ gelo: 5 })
  const prima = geloDi(6), dopo = geloConDoni(6, null, g)
  controlla('il gelo regalato dura di più', dopo.durata > prima.durata + 0.9,
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

function partita(tappa, regali, { ondate = 8 } = {}) {
  const stato = { cuori: 0, onda: 0, uccisi: 0, torri: 0, energia: 0 }
  const b = creaBattaglia({ tappa, misure: { ...MONDO }, stato, regali })
  b.inizia()
  /* le torri e via: il resto lo fa il tempo. Non si compra niente, così
     la partita è la stessa in tutte le prove e l'unica differenza sono i
     regali. Le torri sono quelle che il giocatore modello compra per
     prime (`sequenzaTorri`, le `urgenti`), ognuna sulla sua strada: con
     le immunità, due torri a caso possono non toccare metà delle ondate,
     e un regalo sul danno non si vedrebbe. Erano le due dell'apertura,
     e bastavano finché nel Delta la sesta ondata non è diventata un
     troll che scende dalla parte dove le due non lo toccano: passava
     intero, la partita finiva lì con o senza regali, e il conto dei
     fermati era lo stesso. `ondate` è quanto dura, in minuti */
  const fila = sequenzaTorri(tappa)
  const quante = Math.max(2, fila.urgenti ? fila.urgenti.size : 0)
  for (let j = 0; j < quante; j++) {
    const posto = b.liberi().find(i => (b.postazioni[i].via || 0) === (fila.strade?.[j] || 0))
    b.costruisci(fila[j] || 'add', { prezzo: 0, posto: posto ?? null })
  }
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
  /* sedici minuti e non otto: con le torri che coprono tutta la fila,
     nei primi otto nel Delta e nel Bivio cadono tutti comunque, con o
     senza regali, e il conto dei fermati non si muove */
  const lunga = { ondate: 16 }
  const senza = partita(l, null, lunga), zero = partita(l, {}, lunga)
  stessaLista(`${l.nome}: zero regali gioca come nessun regalo`,
              [senza.uccisi, senza.cuori], [zero.uccisi, zero.cuori])
  /* dieci gradi su tutti e tre i danni, e non solo sulle frecce: con le
     immunità metà delle ondate l'arciere non le tocca, e un regalo
     sulle frecce da solo può non cambiare di un nemico chi cade */
  const con = partita(l, { frecce: 10, incanto: 10, polvere: 10 }, lunga)
  controlla(`${l.nome}: e con dieci gradi sui danni si ferma più gente`,
            con.uccisi > senza.uccisi, `${senza.uccisi} → ${con.uccisi} nemici fermati`)
}

/* ── 3c. la cadenza ──
   Uno ogni `OGNI_REGALO` ondate; finché non è scelto l'ondata dopo non
   parte; prenderlo lo consuma; e due non se ne accumulano. */
{
  const stato = { cuori: 0, onda: 0, uccisi: 0, torri: 0, energia: 0 }
  const b = creaBattaglia({ tappa: LIBERA, misure: { ...MONDO }, stato })
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
   Un grado è piccolo apposta — +5% a quello che tocca, +8% all'arciere,
   +3% a quello che tocca tutte le torri — perché i gradi **restano per
   sempre** e si riprendono senza tetto: a quattro per partita, cento
   gradi sono venticinque partite, e un gradino da +30% dopo cento
   partite avrebbe fatto la difesa immortale. Il prezzo del gradino
   piccolo è che il record si muove più tardi, e questa sezione dice
   **quanto più tardi**, giocando.

   Le partite le gioca `strumenti/regali-castello.mjs` (che stampa anche
   la tabella intera): il giocatore modello fino alla sconfitta, con N
   gradi presi **come li prende un bambino** — dal giro delle tre carte,
   non spalmati in ordine di catalogo — e i regali della partita dallo
   stesso punto del giro. Una partita costa un decimo di secondo, quindi
   si misurano tutte e quattro le libere: il muro di ognuna è un mostro
   diverso, e un regalo che sfonda nel delta può non spostare niente nel
   bosco. La scala è a gradoni — un muro passato fa arrivare di colpo tre
   ondate più in là — quindi non si controlla «un regalo, un'ondata»: si
   controlla che la curva **salga**, da dove, e che non finisca in cielo.

   `tempo: 60` in testa al file: sono partite vere giocate fino alla
   sconfitta. */
const GRADI = [0, 20, 50, 100, 400]
const scale = LIBERE.map(l => ({ l, scala: GRADI.map(k => ({ k, ...finoDove(l, k) })) }))
for (const { l, scala } of scale) {
  for (const [i, p] of scala.entries()) {
    if (i) controlla(`${l.nome}: ${p.k} gradi non portano meno lontano di ${scala[i - 1].k}`,
                     p.onda >= scala[i - 1].onda,
                     `o${scala[i - 1].onda} → o${p.onda}`)
    controlla(`${l.nome}: con ${p.k} gradi si perde comunque`, p.esito === 'persa',
              `con ${p.k} gradi la partita non finisce più (${p.esito} all'ondata ${p.onda})`)
  }
  /* Cento e non dieci, e nemmeno cinquanta. Dieci gradi sono un +8% qui
     e un +5% là, e oltre la ventesima la vita sale del 30% a ondata
     (`OLTRE`): dieci gradi il record lo spostano di un'ondata al più,
     venti di tre al più e sul bastione di niente, cinquanta di due-cinque
     ma sul bastione ancora di niente (il muro della ventunesima è uno
     scheletro, che magia e gelo non toccano). Cento sono venticinque
     partite, ed è da lì che la promessa regge su tutti e quattro i
     terreni. */
  const [zero, , , cento] = scala
  controlla(`${l.nome}: i regali si sentono — cento gradi portano più lontano di zero`,
            cento.onda > zero.onda, `zero → o${zero.onda}, cento → o${cento.onda}`)
  nota(`${l.nome}: ` + scala.map(p => `${p.k} gradi → o${p.onda}`).join(' · '))
}
/* il rendimento cala: i primi cento gradi comprano ondate, i trecento
   dopo molte meno per grado. È la condizione perché accumularli per
   sempre non porti in cielo — la vita cresce a moltiplicare, i gradi
   dello stesso regalo a sommare, e il moltiplicare vince sempre. Si
   conta **sulle quattro libere insieme**: la scala è a gradoni, e su
   un terreno solo un gradone preso a 101 gradi invece che a 99 basta a
   capovolgere il conto (il bivio fermo a o27 da cinquanta a cento, e
   poi a o34 a duecento) */
{
  const guadagno = (a, b) => scale.reduce((s, { scala }) => s + scala[b].onda - scala[a].onda, 0) /
                             (GRADI[b] - GRADI[a])
  controlla('e quattrocento non rendono immortali — il rendimento cala',
            guadagno(3, 4) < guadagno(0, 3),
            `${guadagno(0, 3).toFixed(3)} ondate per grado fino a cento, ` +
            `${guadagno(3, 4).toFixed(3)} da cento a quattrocento, sulle quattro libere`)
}
/* e quaranta tutti sulla stessa voce: è previsto (si può riprendere lo
   stesso regalo quante volte si vuole) e non deve sfondare il gioco */
const soli = REGALI.map(r => ({ r, ...finoDove(LIBERA, 40, { soli: r.id }) }))
for (const { r, esito, onda } of soli)
  controlla(`quaranta ${r.id}: si muore comunque`, esito === 'persa', `${esito} a o${onda}`)
nota('quaranta gradi su una voce sola, nel bosco: ' +
     soli.map(({ r, onda }) => `${r.emoji} o${onda}`).join(' · '))

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
