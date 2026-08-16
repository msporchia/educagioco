/* ═══════════════════════════════════════════════════════════════════
   POSA — il gemello di `prendi`, giocato per davvero
     node test/esegui.mjs posa --niente-build

   `posa` c'era già dappertutto — nel vocabolario, nell'indice delle
   azioni, dentro `Oggetto.ricevi`, nella tabella del formato delle
   mappe — e non aveva un test che lo giocasse: la nota che lo dava per
   «dichiarato nel formato ma non nel motore» era vecchia. Questo file
   è la prova che manca, e serve perché senza `posa` non si dice mezza
   storia: la lanterna che si lascia dov'è buio, la chiave che passa di
   mano, le mani che si liberano.

   Non si prova col mondo finto (quello lo fa `azioni/prendi.test.mjs`
   per il suo gemello): qui si fanno partite intere, perché quello che
   c'era da dimostrare non è che l'azione consegni un comando — è che
   una cosa posata **resti dove l'hai lasciata** e che un altro la
   trovi. È la riga di `Oggetto.lascia` che, sbagliata, farebbe
   ricomparire la chiave dove stava all'inizio senza che niente sembri
   rotto.
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, riassunto } from '../../aiuto/verifica.mjs'
import { livello, campo, cose, chi, fai, se } from '../../../src/data/livelli/scrivi.js'
import { creaMondo, esegui, verbiDi } from '../../../src/motore/generale.js'

const gioca = (liv, piano) => esegui(creaMondo(liv, 0), piano)
const detto = e => e.traccia.map(r => r.testo).join(' | ')

/* ---------- 1. il passamano ----------
   L'eroe prende la chiave, la porta di là e la posa; Marta la
   raccoglie e apre. Senza `posa` questa storia si mima con due
   posizioni: la chiave sarebbe uscita dal mondo appena presa. */
{
  const eroe = chi.eroe()
  const marta = chi.nostro('marta', 'Marta', { corpo: 'ladra' })
  const chiave = cose.chiave()
  const portone = cose.porta('portone', 'il portone', { chiave: 'chiave' })
  const tesoro = cose.forziere()

  const LIV = livello({
    id: 'prova-posa-passamano', nome: 'Il passamano', prove: 0,
    scena: campo([
      '##|##|##|##|##|##|##|##|##',
      '##|@@|..|k1|..|p1|..|T$|##',
      '##|mm|..|..|..|##|..|..|##',
      '##|##|##|##|##|##|##|##|##',
    ], { '@@': eroe, 'mm': marta, 'k1': chiave, 'p1': portone, 'T$': tesoro }),
    vince: [se.aperto(tesoro)],
  })

  const consegna = gioca(LIV, {
    eroe: [fai.prendi(chiave), fai.vai('1,2'), fai.posa(chiave)],
    marta: [fai.aspettaUnPo(6), fai.prendi(chiave), fai.apri(portone), fai.apri(tesoro)],
  })
  controlla('posa: una chiave posata la raccoglie un altro', consegna.vinto, consegna.motivo)

  /* e la posa **dove sei**, non dove l'avevi trovata: se Marta non va a
     cercarla dove l'eroe l'ha lasciata, non la trova */
  const dovEra = gioca(LIV, {
    eroe: [fai.prendi(chiave), fai.vai('1,2'), fai.posa(chiave)],
    marta: [fai.vai(chiave), fai.aspettaUnPo(9), fai.prendi(chiave)],
  })
  controlla('posa: la cosa resta dove l\'hai lasciata, non dov\'era prima',
            !dovEra.vinto, dovEra.motivo)

  /* senza il `posa` in mezzo, la chiave resta nello zaino dell'eroe e
     Marta trova le mani di qualcun altro */
  const senza = gioca(LIV, {
    eroe: [fai.prendi(chiave), fai.vai('1,2')],
    marta: [fai.aspettaUnPo(6), fai.prendi(chiave), fai.apri(portone), fai.apri(tesoro)],
  })
  controlla('posa: senza, la chiave non torna nel mondo e il piano cade', !senza.vinto)
  controlla('posa: e il registro dice di chi ce l\'ha',
            detto(senza).includes('ce l\'ha già qualcun altro'), detto(senza))
}

/* ---------- 2. quello che non hai in mano non si posa ----------
   Non è un guasto: è un rifiuto, e la fila prosegue. */
{
  const eroe = chi.eroe()
  const chiave = cose.chiave()
  const tesoro = cose.forziere()
  const LIV = livello({
    id: 'prova-posa-vuota', nome: 'Mani vuote', prove: 0,
    scena: campo([
      '##|##|##|##|##|##',
      '##|@@|..|k1|T$|##',
      '##|##|##|##|##|##',
    ], { '@@': eroe, 'k1': chiave, 'T$': tesoro }),
    vince: [se.aperto(tesoro)],
  })
  const e = gioca(LIV, { eroe: [fai.posa(chiave), fai.apri(tesoro)] })
  controlla('posa: quello che non hai in mano non si posa, e lo dice',
            detto(e).includes('non ce l\'ho'), detto(e))
  controlla('posa: ma non ferma la fila — il forziere si apre lo stesso', e.vinto, e.motivo)
}

/* ---------- 3. le mani, e perché `posa` è necessario ----------
   Le mani sono due (una, qui): con una cosa a braccia non se ne
   raccoglie un'altra, e l'unico modo di liberarsi è posare. */
{
  const eroe = chi.eroe('eroe', { mani: 1 })
  const cesto = cose.oggetto('cesto', 'il cesto', { pittore: 'cassa' })
  const sacco = cose.oggetto('sacco', 'il sacco', { pittore: 'cassa' })
  const banco = cose.posto('banco', 'il banco')
  const LIV = livello({
    id: 'prova-posa-mani', nome: 'Le mani', prove: 0,
    scena: campo([
      '##|##|##|##|##|##|##',
      '##|@@|c1|s1|..|b1|##',
      '##|##|##|##|##|##|##',
    ], { '@@': eroe, 'c1': cesto, 's1': sacco, 'b1': banco }),
    vince: [se.ha(eroe, sacco)],
  })

  const pieno = gioca(LIV, { eroe: [fai.prendi(cesto), fai.prendi(sacco)] })
  controlla('posa: con le mani piene non si raccoglie', !pieno.vinto, pieno.motivo)
  controlla('posa: e il motivo lo dice per esteso',
            detto(pieno).includes('prima devo posare qualcosa'), detto(pieno))

  const libero = gioca(LIV, { eroe: [fai.prendi(cesto), fai.posa(cesto), fai.prendi(sacco)] })
  controlla('posa: posando si libera una mano', libero.vinto, libero.motivo)
}

/* ---------- 4. la lanterna posata continua a fare luce ----------
   È la storia che ha fatto nascere il verbo: la luce si mette dove vuoi
   tu, e chi la posa se ne va al buio. */
{
  const tilde = chi.nostro('tilde', 'Tilde', { vista: 6 })
  const bea = chi.nostro('bea', 'Bea', { vista: 6 })
  const lanterna = cose.lanterna('lanterna', 'la lanterna', { raggio: 2 })
  const orco = chi.nemico('orco', "l'orco", { vista: 0, vita: 1, sa: ['vai'] })
  const ora = cose.segnale('ora', 'al mio segnale')

  const LIV = livello({
    id: 'prova-posa-lanterna', nome: 'La lanterna posata', prove: 0,
    vistaAlBuio: 0,
    scena: campo([
      '##|##|##|##|##|##|##|##|##',
      '##|tt|..|..|..|o1|..|bb|##',
      '##|ll|..|..|..|..|..|..|##',
      '##|##|##|##|##|##|##|##|##',
    ], { 'tt': tilde, 'bb': bea, 'll': lanterna, 'o1': orco }),
    segnali: [ora],
    /* Bea deve arrivare all'orco, e a un orco non ci si va se non lo si
       è mai visto: al buio è come se non ci fosse */
    vince: [se.caduto(orco)],
  })

  /* Tilde tiene la lanterna con sé: quando torna indietro il buio si
     richiude, e Bea non ha mai niente da vedere */
  const senzaPosa = gioca(LIV, {
    tilde: [fai.prendi(lanterna), fai.vai('4,2'), fai.vai('1,1'), fai.suona(ora)],
    bea: [fai.quando(ora, fai.attacca(orco))],
  })
  controlla('posa: la luce che te ne va con chi la porta non serve a nessuno',
            !senzaPosa.vinto, senzaPosa.motivo)
  controlla('posa: e l\'orco resta in piedi — al buio Bea non lo trova più',
            senzaPosa.mondo.perId.orco.eInPiedi(), detto(senzaPosa))

  /* la stessa identica fila, con un `posa` in mezzo */
  const conPosa = gioca(LIV, {
    tilde: [fai.prendi(lanterna), fai.vai('4,2'), fai.posa(lanterna), fai.vai('1,1'), fai.suona(ora)],
    bea: [fai.quando(ora, fai.attacca(orco))],
  })
  controlla('posa: una lanterna lasciata lì illumina anche quando chi la portava se n\'è andato',
            conPosa.vinto, conPosa.motivo)
}

/* ---------- 5. e sta in cassetta dove c'è qualcosa da posare ---------- */
{
  const eroe = chi.eroe()
  const chiave = cose.chiave()
  const tesoro = cose.forziere()
  const LIV = livello({
    id: 'prova-posa-cassetta', nome: 'La cassetta', prove: 0,
    scena: campo([
      '##|##|##|##|##',
      '##|@@|k1|T$|##',
      '##|##|##|##|##',
    ], { '@@': eroe, 'k1': chiave, 'T$': tesoro }),
    vince: [se.aperto(tesoro)],
  })
  const m = creaMondo(LIV, 0)
  controlla('posa: si offre dove c\'è un oggetto', verbiDi(m).includes('posa'))
  uguale('posa: e i suoi bersagli sono gli oggetti', m.nomi('posa').join(','), 'chiave')
}

riassunto('posa')
