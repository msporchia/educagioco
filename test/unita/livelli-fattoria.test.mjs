/* I livelli della fattoria: l'esperienza sono **le monete spese qui
   dentro**, e passando di livello arriva roba nuova.

   Le tre cose che questo file difende, e sono decisioni di prodotto:
     1. **spendere è l'unica esperienza** — non i raccolti, non i
        minuti: la fattoria è il money pit, e il livello premia il gesto
        che tiene in piedi tutto il resto;
     2. **non si scende mai**, per nessun motivo, nemmeno mettendo via
        quello che si è comprato;
     3. **al primo livello si può cominciare la catena** — un campo, un
        silo, qualcosa da seminare — e tutto il resto arriva dopo.
   `node test/esegui.mjs livelli-fattoria --niente-build` */
import { Fattoria, borsaInfinita } from '../../src/giochi/fattoria/motore/fattoria.js'
import {
  guastiDeiLivelli, ULTIMO, DECORI_PER_LIVELLO, livelloPer, sogliaDi, avanzamento,
  roba, vuoto, livelloDellaVoce, livelloDellaScheda, zonaDi, premiDi,
} from '../../src/giochi/fattoria/dati/livelli.js'
import { CATALOGO, CATEGORIE, PER_ID, prezzoDellaVoce }
  from '../../src/giochi/fattoria/dati/catalogo.js'
import { COLTURE } from '../../src/giochi/fattoria/dati/coltivazioni.js'
import { ANIMALI } from '../../src/giochi/fattoria/dati/animali.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. le soglie stanno in piedi ══════════ */
const guasti = guastiDeiLivelli()
controlla('i livelli non hanno guasti', guasti.length === 0, guasti.join(' · '))

uguale('si parte dal livello 1 con zero speso', livelloPer(0), 1)
uguale('e la prima soglia è zero', sogliaDi(1), 0)
for (let l = 2; l <= ULTIMO + 3; l++)
  controlla(`la soglia del livello ${l} sale`, sogliaDi(l) > sogliaDi(l - 1))
uguale('un soldo prima della soglia si è ancora di qua',
       livelloPer(sogliaDi(2) - 1), 1)
uguale('e sulla soglia esatta si passa', livelloPer(sogliaDi(2)), 2)
/* I livelli non finiscono: chi ha giocato per mesi deve avere ancora un
   gradino davanti, se no la ragione di spendere sparisce proprio a chi
   ne ha spese di più. */
uguale('oltre l\'ultimo dichiarato si continua a salire',
       livelloPer(sogliaDi(ULTIMO + 2)), ULTIMO + 2)

/* ══════════ 2. DUE O TRE PER LIVELLO, MAI DI PIÙ ══════════
   È la regola che rende lungo il gioco: il catalogo ha quasi duecento
   decorazioni, e date a secchiate diventano una lista da cui non si sa
   cosa scegliere. Date a gocce sono la ragione per cui si torna. */
{
  for (let l = 2; l <= ULTIMO; l++) {
    const belle = roba(l).cose.filter(v => zonaDi(v.id) === 'bello')
    controlla(`al livello ${l} arrivano al massimo ${DECORI_PER_LIVELLO} decorazioni`,
              belle.length <= DECORI_PER_LIVELLO, `${belle.length}`)
  }
  /* E arrivano dalla più economica alla più cara: il vaso da quattro
     monete subito, la casa sull'albero dopo mesi. */
  /* Il confronto è **fra un livello e il seguente**, non voce per
     voce: dentro lo stesso livello l'ordine è quello del catalogo, e
     tre cose che arrivano insieme arrivano insieme. */
  let caro = 0
  for (let l = 1; l <= ULTIMO; l++) {
    const belle = roba(l).cose.filter(v => zonaDi(v.id) === 'bello')
    if (!belle.length) continue
    const prezzi = belle.map(v => v.prezzo)
    controlla(`al livello ${l} non arriva niente di più economico di prima`,
              Math.min(...prezzi) >= caro, `${Math.min(...prezzi)} dopo ${caro}`)
    caro = Math.max(...prezzi)
  }
  /* Il livello 1 è **solo la fattoria**: niente da abbellire finché non
     c'è niente da guardare. */
  uguale('al livello 1 non arriva nessuna decorazione',
         roba(1).cose.filter(v => zonaDi(v.id) === 'bello').length, 0)
  controlla('e il gioco dura: i livelli sono tanti', ULTIMO >= 40)
  nota(`${ULTIMO} livelli, l'ultimo a 🪙${sogliaDi(ULTIMO)} ` +
       `(${(sogliaDi(ULTIMO) / 360).toFixed(0)} ore di esercizi)`)
}

/* ══════════ 2b. ogni livello porta qualcosa, e una volta sola ══════════
   Un livello che non porta niente si presenta come «hai fatto qualcosa,
   ecco: niente», ed è peggio di non averlo. */
for (let l = 1; l <= ULTIMO; l++)
  controlla(`al livello ${l} arriva qualcosa`, !vuoto(roba(l)))

{
  /* Niente arriva due volte, e tutto arriva prima o poi: sono le due
     metà della stessa cosa, e senza la seconda una voce dichiarata a un
     livello che non esiste sarebbe invisibile per sempre. */
  const visti = new Set()
  for (let l = 1; l <= ULTIMO; l++)
    for (const v of roba(l).cose) {
      controlla(`${v.id} arriva una volta sola`, !visti.has(v.id))
      visti.add(v.id)
    }
  for (const v of CATALOGO)
    controlla(`${v.id} arriva entro l'ultimo livello`, livelloDellaVoce(v) <= ULTIMO)
}

/* ══════════ 3. al primo livello si comincia ══════════ */
{
  const f = new Fattoria({ borsa: borsaInfinita() })
  uguale('una fattoria nuova è al livello 1', f.livello, 1)
  controlla('e ha il campo', f.sbloccata('orto'))
  controlla('e il silo del raccolto', f.sbloccata('silo'))
  controlla('ma non il mulino', !f.sbloccata('mulino'))
  controlla('né i recinti', !f.sbloccata('pollaio'))
  controlla('c\'è qualcosa da seminare', COLTURE.some(c => (c.liv || 1) === 1))
  /* Un baule di duecento voci al primo minuto è il problema che i
     livelli risolvono: se un giorno la metà del catalogo tornasse
     disponibile subito, questo controllo lo dice. */
  const subito = CATALOGO.filter(v => livelloDellaVoce(v) === 1).length
  controlla(`al primo livello si vede una fetta del catalogo (${subito} su ${CATALOGO.length})`,
            subito < CATALOGO.length / 2)
  nota(`livello 1: ${subito} cose su ${CATALOGO.length}, ` +
       `${COLTURE.filter(c => (c.liv || 1) === 1).length} colture, ` +
       `${Object.values(ANIMALI).filter(a => (a.liv || 1) === 1).length} bestie`)
}

/* ══════════ 4. si sale spendendo, e non si scende ══════════ */
{
  const f = new Fattoria({ borsa: borsaInfinita() })
  uguale('appena nata non ha speso niente', f.speso, 0)

  const dove = f.cellaLibera(14, 14)
  const r = f.posa('orto', dove.x, dove.y)
  controlla('il campo si posa', r.ok)
  uguale('e quello che è costato è esperienza', f.speso, r.costo)

  /* Raccogliere, sgomberare, avviare: ogni moneta che esce di qui
     dentro conta. È il motivo per cui nel motore non si chiama più
     `borsa.paga()` da nessuna parte.

     Si guarda **il raccolto** e non la semina: da quando un campo dà una
     cosa sola, seminare è gratis e si paga raccogliendo — se no un
     grano costerebbe due monete e la catena verrebbe più cara che
     comprare (`dati/coltivazioni.js`). */
  const campo = r.cosa
  /* Senza silo la capienza è **zero**, quindi non si raccoglie e non si
     paga: è la regola dei campi, e qui serve solo a poter arrivare al
     gesto che si vuole misurare. */
  const dovesilo = f.cellaLibera(20, 20)
  f.posa('silo', dovesilo.x, dovesilo.y)
  const prima = f.speso
  f.seminaCampo(campo, 'grano', 1000)
  controlla('si raccoglie', f.raccogli(campo, 1000 + 99 * 60000).ok)
  controlla('e anche il raccolto conta', f.speso > prima)

  /* E non si scende: mettere via quello che hai comprato non
     disimpara niente. */
  f.speso = sogliaDi(3)
  uguale('speso abbastanza, il livello è salito', f.livello, 3)
  f.mettiVia(f.cose.find(c => c.id === 'orto') || {})
  uguale('e mettendo via le cose non scende', f.livello, 3)
}

/* ══════════ 5. il motore rifiuta quello che non è arrivato ══════════
   Il baule mostra solo lo sbloccato, ma la regola sta nel motore: una
   schermata che filtra è una comodità, un motore che accetta tutto è un
   buco — e il motore lo usa anche chi scrive un test. */
{
  const f = new Fattoria({ borsa: borsaInfinita() })
  const dove = f.cellaLibera(20, 20)
  const no = f.posa('mulino', dove.x, dove.y)
  uguale('al livello 1 il mulino non si posa', no.ok, false)
  uguale('e dice perché', no.motivo, 'non-sbloccato')
  uguale('e a che livello arriva', no.liv, PER_ID.mulino.liv)
  uguale('nemmeno comprandolo per il baule', f.compra('mulino').ok, false)

  const campo = f.posa('orto', dove.x, dove.y).cosa
  const zucche = f.seminaCampo(campo, 'zucche', 1000)
  uguale('e una coltura di là da venire non si semina', zucche.ok, false)
  uguale('col suo perché', zucche.motivo, 'non-sbloccato')

  const bestia = f.compraBestia('pappagallo', 120, 'Coco')
  uguale('e nemmeno una bestia', bestia.ok, false)

  /* Cresciuta, tutto si apre: il livello non chiude niente per sempre.
     Ma **aprire non è avere**: il livello dà il diritto di prendere un
     premio, e finché non lo si prende (sezione 8) il mulino non sta nel
     baule. È la stessa riga di prima con un gesto in mezzo. */
  f.speso = 100000
  uguale('salito di livello il mulino è arrivato, ma non è ancora preso',
         f.posa('mulino', dove.x + 6, dove.y + 6).ok, false)
  f.reclamaTutto()
  controlla('preso il premio, da grande il mulino si posa',
            f.posa('mulino', dove.x + 6, dove.y + 6).ok)
}

/* ══════════ 5b. quello che produce rincara, i silos sono unici ══════════
   Due conigliere fanno il doppio della lana, quindi la seconda costa di
   più: a prezzo fisso l'unica strategia sarebbe riempire il prato di
   recinti uguali. Due silos dello stesso tipo invece non contengono
   niente di più — la capienza è del tipo — quindi il secondo non si
   vende affatto: un oggetto che si compra due volte e la seconda non fa
   niente è peggio di uno che non si può comprare. */
{
  for (const id of ['orto', 'mulino', 'conigliera', 'pollaio', 'ovile', 'stalla', 'porcile'])
    controlla(`${id} rincara a ogni copia`, !!PER_ID[id].cresce)
  const uno = prezzoDellaVoce(PER_ID.conigliera, 0)
  const due = prezzoDellaVoce(PER_ID.conigliera, 1)
  controlla('la seconda conigliera costa di più', due > uno, `${uno} → ${due}`)
  /* Lineare, non esponenziale: la decima copia non deve costare due ore
     di esercizi (`CALIBRAZIONE.md`). */
  const dieci = prezzoDellaVoce(PER_ID.orto, 9)
  controlla(`il decimo campo resta abbordabile (🪙${dieci})`, dieci < 6 * 60 * 2)

  const f = new Fattoria({ borsa: borsaInfinita() })
  f.speso = 100000
  f.reclamaTutto()
  const dove = f.cellaLibera(14, 14)
  controlla('il primo silo si posa', f.posa('silo', dove.x, dove.y).ok)
  const bis = f.posa('silo', dove.x + 6, dove.y)
  uguale('il secondo silo uguale no', bis.ok, false)
  uguale('e dice perché', bis.motivo, 'ne-hai-gia')
  controlla('ma quello dell\'altra famiglia sì',
            f.posa('silo_bianco', dove.x + 6, dove.y).ok)
}

/* ══════════ 6. una fattoria di ieri non torna al livello 1 ══════════
   I salvataggi di prima non hanno `speso`: si stima da quello che
   hanno in mappa, se no chi aveva mezza fattoria la ritroverebbe
   richiusa — che a schermo somiglia a «mi hanno tolto la roba». */
{
  const f = new Fattoria({ borsa: borsaInfinita() })
  f.speso = 100000
  f.reclamaTutto()
  const dove = f.cellaLibera(14, 14)
  f.posa('mulino', dove.x, dove.y)
  f.posa('pollaio', dove.x + 8, dove.y)

  const dato = JSON.parse(JSON.stringify(f.serializza()))
  delete dato.speso
  /* E nemmeno i premi presi, che sono ancora più recenti: una fattoria
     di ieri li ha tutti aperti e nessuno segnato. Ritrovarsi il baule
     svuotato e sessanta quadratini da premere sarebbe la propria roba
     tolta e restituita a rate. */
  delete dato.reclamati
  const g = new Fattoria({ dato })
  controlla('la spesa si stima da quello che c\'è in mappa', g.speso > 0)
  controlla('e il mulino resta sbloccato', g.sbloccata('mulino'))
  uguale('e non c\'è niente da reclamare: era già tutto suo',
         g.daReclamare().length, 0)
}

/* ══════════ 7. l'avanzamento è quello che la pagina mostra ══════════ */
{
  const a = avanzamento(sogliaDi(2))
  uguale('appena saliti si è al livello giusto', a.livello, 2)
  uguale('e la barra riparte da zero', a.quanto, 0)
  uguale('e dice quanto manca al prossimo', a.manca, sogliaDi(3) - sogliaDi(2))
  const b = avanzamento((sogliaDi(2) + sogliaDi(3)) / 2)
  controlla('a metà strada la barra è a metà', Math.abs(b.quanto - 0.5) < 0.01)
  controlla('ogni livello ha un nome', a.nome && a.nome.length > 2)
}

/* ══════════ 8. i premi si vanno a prendere ══════════
   Salire di livello **apre** dei premi; averli vuol dire averli presi,
   premendoli nella pagina dei livelli. Le tre cose che questo blocco
   difende, e sono decisioni di prodotto:
     1. **niente arriva da solo** — perché il livello sale sempre in
        mezzo a un acquisto, e quello che compariva da sé spezzava il
        gesto invece di premiarlo;
     2. **il livello 1 è già preso** — una fattoria appena nata deve
        avere in mano campo, silo e un seme, non tre quadratini;
     3. **prendere non regala** — apre la voce nel baule, dove si paga
        come sempre: la fattoria è il posto dove si spende. */
{
  const f = new Fattoria({ borsa: borsaInfinita() })
  uguale('appena nata non ha niente da prendere', f.daReclamare().length, 0)
  controlla('perché il livello 1 è già suo', f.sbloccata('orto'))

  f.speso = sogliaDi(3)
  const aspetta = f.daReclamare()
  controlla('salita di due livelli, ha dei premi che aspettano', aspetta.length > 0)
  controlla('e sono tutti di livelli già raggiunti',
            aspetta.every(p => p.liv <= f.livello))
  controlla('il mulino è fra quelli', aspetta.some(p => p.chiave === 'cosa:mulino'))
  controlla('ma non sta ancora nel baule', !f.sbloccata('mulino'))

  const preso = f.reclama('cosa:mulino')
  controlla('si prende', preso.ok)
  controlla('e da lì è nel baule', f.sbloccata('mulino'))
  uguale('preso una volta non si riprende', f.reclama('cosa:mulino').ok, false)
  uguale('e prenderlo non ha regalato niente',
         f.quantiNe('mulino'), 0)

  /* Un premio di là da venire non si prende scrivendone la chiave: la
     regola sta nel motore, come tutte le altre. */
  const avanti = premiDi(ULTIMO)[0]
  uguale('un premio che non è ancora arrivato non si prende',
         f.reclama(avanti.chiave).ok, false)
  uguale('e una chiave che non esiste nemmeno',
         f.reclama('cosa:non-esiste').ok, false)

  /* Quello che si è preso resta preso attraverso un salvataggio: è
     l'unica cosa nuova che il profilo si porta dietro. */
  const g = new Fattoria({ dato: JSON.parse(JSON.stringify(f.serializza())) })
  controlla('il premio preso sopravvive al salvataggio', g.sbloccata('mulino'))
  uguale('e gli altri restano da prendere',
         g.daReclamare().length, aspetta.length - 1)
}

/* ══════════ 8b. il silo non racconta il futuro ══════════
   Gli scomparti erano tutte le merci del silo, e al primo raccolto di
   grano si leggevano già latte, uova, lana e tartufi: il magazzino
   diceva in anticipo tutta la scaletta del gioco. */
{
  const f = new Fattoria({ borsa: borsaInfinita() })
  const dentro = f.scomparti('terra').map(s => s.prodotto)
  uguale('al primo livello nel silo c\'è solo quello che si semina',
         dentro.join(','), 'grano')
  controlla('e il silo della stalla non anticipa niente',
            f.scomparti('stalla').length === 0)

  f.speso = 100000
  f.reclamaTutto()
  controlla('da grande ci sono tutte', f.scomparti('terra').length > 3)
  controlla('e anche quelle degli animali', f.scomparti('stalla').length > 3)
  nota(`silo della terra: da ${dentro.length} a ${f.scomparti('terra').length} scomparti`)
}

nota(`${ULTIMO} livelli · dal livello 2 (🪙${sogliaDi(2)}) al ${ULTIMO} ` +
     `(🪙${sogliaDi(ULTIMO)}, ${(sogliaDi(ULTIMO) / 360).toFixed(0)} ore di esercizi)`)
for (let l = 2; l <= ULTIMO; l++) {
  const r = roba(l)
  nota(`  ${l}. 🪙${sogliaDi(l)} — ` + [
    ...r.schede.map(s => s.nome.toLowerCase()),
    ...r.cose.map(c => c.nome.toLowerCase()),
    ...r.colture.map(c => c.nome.toLowerCase()),
    ...r.animali.map(a => a.nome.toLowerCase()),
  ].join(', '))
}

riassunto('i livelli della fattoria')
