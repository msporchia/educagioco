/* ═══════════════════════════════════════════════════════════════════
   LE ONDATE — chi arriva, quanti sono, e quando.

   Il ciclo della tappa in una classe sola: data un'ondata, dice chi la
   compone, quanti nemici sono, ogni quanto escono dall'ingresso. Non
   tiene tempo e non fa camminare nessuno: è una **tabella calcolata**,
   e per questo si può guardare anche in avanti.

   ── il preavviso ──
   Ed è tutto il punto. Chi arriva è deterministico — `mostroDiOnda`
   dipende solo dal numero dell'ondata — quindi «fra tre ondate arriva
   il Golem, e la magia non lo tocca» si può dire *adesso*, mentre il
   campo è pulito e si stanno facendo i conti per comprare. Prima quello
   che un mostro reggeva si scopriva quando l'ondata era già partita,
   cioè quando non serviva più a niente: era un dettaglio, non una
   decisione.

   `prossime()` è quello che l'interfaccia mette in un nastro, ed è il
   solo motivo per cui il motore espone il futuro invece del presente.
   ═══════════════════════════════════════════════════════════════════ */
import { nemiciDiOnda, intervalloDiOnda, vitaNemico, velocitaNemico, insiemeDa,
         boccaDellOnda } from '../../data/castello.js'
import { MOSTRI, CAPO, ABILITA, mostroDiOnda, mostroLibero, immuniDi } from '../../data/mostri.js'

/* il passo stretto dentro un gruppetto, di quanto si muove la fila,
   quante ondate su tre escono a gruppetti, e di quanto (in unità del
   mondo) un mostro può uscire indietro rispetto al suo posto */
const RITMO = { stretto: 0.5, mosso: 0.25, gruppo: [2, 3], da: 3, quota: 1 / 3, sfalso: 30 }
/* un numero fra 0 e 1 che dipende solo da `a` e `b`: il dado del ritmo
   e dello sfalso, che tira sempre lo stesso numero per la stessa ondata */
function caso(a, b = 0) {
  let h = Math.imul(a + 1, 2654435761) ^ Math.imul(b + 7, 40503)
  h = Math.imul(h ^ (h >>> 15), 2246822519)
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296
}

export class Ondate {
  constructor(tappa) { this.tappa = tappa }

  /* la partita libera non ha un numero di ondate: non finisce */
  get campagna() { return Number.isFinite(this.tappa.ondate) }
  get quante() { return this.tappa.ondate }
  ultima(o) { return this.campagna && o >= this.quante }

  /* Chi arriva in questa ondata: un tipo solo, così la scheda in alto a
     destra parla di lui e scegliere la torre è una domanda con una
     risposta.

     ── le immunità ci sono sempre ──
     Prima una tappa accendeva le *resistenze* solo da una certa ondata in
     poi e mai nell'ultima, perché un terzo del danno tolto alla torre
     sbagliata faceva saltare la taratura in modi misurati. L'immunità è
     un'altra cosa: è **com'è fatto il mostro**, e un pipistrello che
     alla seconda ondata si prende le bombe e alla terza no sarebbe una
     bugia. Quello che una tappa decide adesso è **chi manda e in che
     ordine**: la prima ondata la ferisce sempre l'arciere, che è la
     torre che si compra per prima (lo controlla il validatore), e il
     giocatore modello costruisce prima le torri che servono a coprire la
     fila (`sequenzaTorri` in `data/castello.js`).

     ── le abilità sì, le accende la tappa ──
     Dividersi e rialzarsi arrivano dal Sotterraneo in poi (`abilita`):
     nel Bosco si impara che cosa tocca chi, e un mostro che fa anche
     un'altra cosa è una seconda lezione nella stessa tappa. Il mostro è
     lo stesso; nel Bosco quella cosa non la fa, e il preavviso non la
     dice. */
  bestiaDi(o) {
    const id = this.tappa.mostri ? mostroDiOnda(this.tappa.mostri, o) : mostroLibero(o)
    const m = MOSTRI[id] || {}
    return { id, nome: m.nome, vola: !!m.vola, immune: immuniDi(id),
             abilita: this.tappa.abilita ? m.abilita || null : null,
             capo: this.eCapo(o) }
  }

  /* ── il capo ──
     Nella partita infinita ogni `capi` ondate; nella campagna solo come
     ultima ondata di una tappa che lo dichiara (`capo: true`). I numeri
     del capo stanno in `CAPO` (`data/mostri.js`). */
  eCapo(o) {
    const t = this.tappa
    return !!((t.capi && o > 0 && o % t.capi === 0) ||
              (t.capo && this.campagna && o === this.quante))
  }

  /* Il capo è uno solo, con la vita di tutta l'ondata che sostituisce
     (e un decimo in più), e cammina alla metà.
     E chi ha un'abilità arriva in meno (`folla` in `ABILITA`): chi si
     divide fa tre bersagli di uno, chi si rialza due, e un'ondata
     intera di quelli non la ferma la vita — la ferma quante frecce si
     tirano al secondo. Misurato: un'ondata piena di vermi passava anche
     con cinque punti di vita a testa, perché ogni verme chiedeva tre
     frecce e ne arrivava uno ogni secondo e un quarto. In meno, più
     distanziati — l'ondata dura quanto le altre — e ognuno vale di più
     (`pagaDi`): l'energia dell'ondata non cambia. */
  follaDi(o) {
    if (this.eCapo(o)) return 1
    const b = this.bestiaDi(o)
    return b.abilita ? ABILITA[b.abilita].folla : 1
  }
  quantiDi(o) {
    if (this.eCapo(o)) return 1
    return Math.max(1, Math.round(nemiciDiOnda(o) * this.follaDi(o)))
  }
  intervalloDi(o) { return intervalloDiOnda(o) / this.follaDi(o) }
  /* ── il ritmo dentro l'ondata ──
     Il passo fra un mostro e il dopo, in multipli di `intervalloDi`. Col
     passo fisso uscivano in fila come soldatini, e la fila si legge una
     volta e poi non chiede più niente. Adesso ogni ondata ha un ritmo:
     dalla terza in poi una su tre esce **a gruppetti** — due o tre vicini, poi una
     pausa lunga — e le altre in fila, ma con passi che cambiano di un
     quarto in più o in meno. I gruppetti sono dove le torri ad area
     rendono, e dove quelle su un bersaglio solo fanno fatica.

     Due cose tengono ferma la taratura. Il ritmo lo decide **il numero
     dell'ondata**, non il caso: la stessa ondata esce sempre uguale, e il
     banco che la rigioca misura la stessa cosa. E **in media il passo
     resta 1**: un gruppetto di `g` fa `g − 1` passi corti e uno lungo che
     li ripaga, la fila mossa va da 0,75 a 1,25 — l'ondata dura quanto
     prima, e l'energia che porta arriva negli stessi tempi. */
  ritmoDi(o, k) {
    /* le prime due ondate escono regolari: arrivano addosso all'unica
       torre che il bambino ha appena costruito, e lì due mostri vicini
       sono un cuore perso prima di aver capito il gioco */
    if (o < RITMO.da) return 1
    if (caso(o) < RITMO.quota) {
      const [da, a] = RITMO.gruppo
      const g = da + Math.floor(caso(o, 99) * (a - da + 1))
      return k % g < g - 1 ? RITMO.stretto : g - RITMO.stretto * (g - 1)
    }
    return 1 - RITMO.mosso + 2 * RITMO.mosso * caso(o, k + 1)
  }
  /* ── lo sfalso di chi esce ──
     Di quanto il `k`-esimo mostro dell'ondata `o` esce indietro rispetto
     alla bocca, fra zero e `RITMO.sfalso` unità del mondo: così
     una fila non è una fila di gemelli. Era l'unico numero tirato davvero
     a caso della battaglia, e **si vedeva nei conti**: dove una torre
     sola apre il mostro dell'ondata — i golem, che feriscono solo le
     bombe — quel soffio decide chi finisce sotto la stessa bomba e chi
     ci scappa, e la stessa ondata con le stesse torri e la stessa vita
     una volta si fermava a metà strada e una volta entrava. Il taratore
     misurava il limite con un'uscita, il metro giocava la tappa con
     un'altra, e perdeva un cuore su un'ondata tarata al 65%. Adesso lo
     decide il numero dell'ondata, come il ritmo: la stessa ondata esce
     sempre uguale, e quella che il banco ha misurato è quella che si
     gioca. */
  sfalsoDi(o, k) { return caso(o, k + 1000) * RITMO.sfalso }
  vitaDi(o) {
    const v = vitaNemico(this.tappa, o)
    return this.eCapo(o) ? v * nemiciDiOnda(o) * CAPO.vita : v
  }
  velocitaDi(o) { return velocitaNemico(this.tappa, o) * (this.eCapo(o) ? CAPO.passo : 1) }
  /* quanti nemici vale quando cade: il capo vale l'ondata intera, così
     l'energia che l'ondata lascia è la stessa che si sia capo o no — ed
     è quella che il modello dei `calcoli` conta */
  pagaDi(o) { return nemiciDiOnda(o) / this.quantiDi(o) }

  /* ── da che ingresso arriva l'ondata `o` ──
     Con una strada sola non c'è niente da decidere. Con due, si
     alternano: la prima da una parte, la seconda dall'altra, e ogni
     terza **da tutte e due insieme** (`-1`, che il campo legge come
     «alternali uno per uno»).

     Deterministico, come tutto il resto delle ondate, perché deve poter
     essere annunciato tre ondate prima: sapere che fra due giri arrivano
     da sotto è quello che rende il trascinare una torre una mossa invece
     che una carezza. */
  viaDi(o, quante = 1) { return boccaDellOnda(o, quante, this.daQuandoInsieme) }

  /* ── da quando arrivano da tutte le bocche insieme ──
     Non dalla terza ondata: con tre strade quello vuol dire dividere in
     tre una difesa che ha ancora tre torri di livello uno, e la tappa
     si perde per una ragione che nessuno può vedere. Si comincia a un
     terzo della tappa — mai prima della quinta ondata — quando le torri
     sono cresciute abbastanza da reggere un fronte per parte. */
  /* Una partita libera non ha un numero di ondate: si conta come se ne
     avesse tante quante ne tara `npm run tara` (`ONDATE_TARATE`), così
     il gioco e la taratura giocano la stessa partita. Prima era «6»
     scritto a mano, e la taratura — che gioca la libera a venti ondate
     — le metteva insieme dalla nona: il bivio tarato così cedeva in
     gioco alla sesta. */
  get daQuandoInsieme() { return insiemeDa(this.quante) }

  /* ── il preavviso ──
     Le ondate che arrivano dopo la `dopo`-esima, al massimo `quante`.
     Ognuna sa fra quanto arriva, chi la compone, quanti sono, quanta
     vita ha ciascuno, a quali torri è immune, se fa qualcosa quando
     cade e se è un capo: tutto quello che serve per decidere cosa
     costruire *prima* che serva. */
  prossime(dopo, quante = 3, vie = 1) {
    const out = []
    for (let i = 1; i <= quante; i++) {
      const o = dopo + i
      if (this.campagna && o > this.quante) break
      out.push({ onda: o, fra: i, quanti: this.quantiDi(o), vita: Math.round(this.vitaDi(o)),
                 via: this.viaDi(o, vie), vie,
                 ...this.bestiaDi(o) })
    }
    return out
  }
}
