/* ═══════════════════════════════════════════════════════════════════
   IL BESTIARIO — che le creature siano fatte per bene

   Nessun pixel: qui non si guarda **come** viene una creatura, si
   controlla che sia *dichiarata* in modo che il disegno possa
   funzionare. La differenza conta, perché i guasti di questo cassetto
   sono di due specie e solo una delle due si vede giocando:

   · una creatura brutta la vede chiunque, e si aggiusta guardandola;
   · una creatura **che non c'è** non si vede affatto — il pittore
     ripiega su un'altra, e a schermo compare un ragno dove doveva
     esserci un drago. È il guasto che questo file esiste per trovare.

   Un test che aprisse il browser per contare i pixel costerebbe cinque
   minuti e direbbe meno di così.
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { CREATURE, NOMI_CREATURE, ingombroDi } from '../../src/grafica/bestiario/indice.js'
import { AMBIENTI, guastiDegliAmbienti } from '../../src/giochi/dungeon/dati/mostri.js'

/* ══════════ 1. ogni creatura è disegnabile ══════════ */
{
  let senzaColori = 0, senzaPittore = 0, senzaBordo = 0
  for (const [nome, cfg] of Object.entries(CREATURE)) {
    if (!cfg.col || typeof cfg.col !== 'object') { senzaColori++; continue }
    /* il bordo è l'unica tinta che tutte devono avere: `corpo.js` lo
       passa a ogni forma, e senza le figure si appiattiscono sul
       fondo della caverna invece di staccarsene */
    if (!cfg.col.bordo) { senzaBordo++; nota(`${nome} non ha un colore di bordo`) }
    /* chi ha quattro zampe si disegna da sé, chi ne ha due lascia
       fare a `persona()` e le passa le sue parti */
    const sa = cfg.quadrupede
      ? typeof cfg.disegna === 'function'
      : typeof cfg.tronco === 'function' && typeof cfg.testa === 'function'
    if (!sa) { senzaPittore++; nota(`${nome} non sa disegnarsi`) }
  }
  uguale('tutte hanno una tavolozza', senzaColori, 0)
  uguale('tutte hanno un bordo', senzaBordo, 0)
  uguale('tutte sanno disegnarsi', senzaPittore, 0)
  controlla('e ce n\'è abbastanza per nove ambienti', NOMI_CREATURE.length >= 20)
}

/* ══════════ 2. le tavolozze reggono la tinta degli stati ══════════ */
{
  /* `tinge()` prende solo le stringhe `#rrggbb`: un colore scritto in
     tre cifre o con un nome inglese resta com'è, e allora quella parte
     della creatura **non sbianca quando la colpisci** — mezza figura
     lampeggia e mezza no, che è peggio di niente. */
  let storti = 0
  for (const [nome, cfg] of Object.entries(CREATURE))
    for (const [chiave, v] of Object.entries(cfg.col || {}))
      if (typeof v === 'string' && !/^#[0-9a-f]{6}$/i.test(v)) {
        storti++
        nota(`${nome}.${chiave} = "${v}" non è un #rrggbb: non si tingerà`)
      }
  uguale('ogni colore è scritto per esteso', storti, 0)
}

/* ══════════ 3. l'ingombro è dichiarato dove serve ══════════ */
{
  /* Serve a non far uscire la creatura dal riquadro. Chi non lo
     dichiara prende il valore di un bipede, che va bene per un bipede
     e non per chi ha le ali: qui si controlla solo che nessuno abbia
     un numero assurdo, perché il resto lo dice l'occhio. */
  let fuoriMisura = 0
  for (const nome of NOMI_CREATURE) {
    const i = ingombroDi(nome)
    if (!(i >= 10 && i <= 60)) { fuoriMisura++; nota(`${nome} ingombra ${i}, che non è una misura`) }
  }
  uguale('nessun ingombro assurdo', fuoriMisura, 0)
  controlla('il drago ingombra più del topo', ingombroDi('drago') > ingombroDi('topo') * 2)
}

/* ══════════ 4. il dungeon non cita creature che non esistono ══════════ */
{
  /* È **questo** file a mettere insieme le due metà, e per un motivo
     preciso: i dati del dungeon non importano la grafica — se lo
     facessero, il motore si porterebbe dietro i pittori e smetterebbe
     di essere una cosa che gira in Node senza schermo. Quindi di là
     `guastiDegliAmbienti` accetta l'elenco delle creature disegnate e
     non se lo va a prendere; qui glielo si passa. */
  const guasti = guastiDegliAmbienti(AMBIENTI, NOMI_CREATURE)
  for (const g of guasti) nota(g)
  uguale('ogni mostro del dungeon è disegnato', guasti.length, 0)

  /* e che il controllo non sia una formalità: tolto il drago, il
     dungeon deve accorgersene */
  const senzaDrago = NOMI_CREATURE.filter(n => n !== 'drago')
  controlla('un mostro non disegnato viene trovato',
            guastiDegliAmbienti(AMBIENTI, senzaDrago).length > 0)
}

riassunto('il bestiario')
