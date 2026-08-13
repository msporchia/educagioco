/* ═══════════════════════════════════════════════════════════════════
   COSA PUÒ NASCERE DA SÉ, E DOVE — il catalogo dell'arredatore

   Un livello disegna la pianta: dove sono i muri, dove sta il tesoro,
   da che parte passa l'orco. Quello che **non** deve disegnare è la
   ventesima botte contro la ventesima parete: è lavoro che non insegna
   niente a chi scrive il livello, e non scriverlo è il motivo per cui
   le stanze finivano vuote.

   Qui c'è cosa un ambiente può mettersi in casa da solo. Le regole
   stanno tutte in tre colonne:

     dove    `sulMuro` appesa alla faccia del muro (torce, ragnatele)
             `alMuro`  appoggiata alla parete (botti, casse, stalagmiti)
             `ovunque` roba che si calpesta, sul pavimento
                       (pozzanghere, ossa, funghi)
     suolo   su che terreno ci sta: `null` vuol dire ovunque

   ── E NIENTE DI QUESTO OCCUPA UNA CASELLA ──
   `sulMuro` e `alMuro` finiscono tutti e due **sulla casella di muro**
   che dà sul pavimento: là l'ingombro è già vero e la mappa non cambia
   di un carattere. Quello che sta su `ovunque` è per definizione roba
   che si calpesta. Un mobile che ingombra davvero lo scrive il livello
   in legenda, con `arredo.*`, e allora si vede nella mappa.

   ── PERCHÉ È DATO E NON CODICE ──
   Perché è una tabella di gusto, e il gusto si cambia guardando lo
   schermo. La regola («una botte sta contro una parete») è nel codice
   una volta sola; qui c'è solo **chi** e **quanto**, ambiente per
   ambiente.

   ── E PERCHÉ NON CI SONO LE TORCE CHE FANNO LUCE ──
   Perché quelle le mette il livello, ed è la dichiarazione: una torcia
   scritta a mano serve alla storia e illumina. Quelle che nascono qui
   sono **di scena** — si vedono, non cambiano la vista di nessuno — e
   nella stanza dove il livello ne ha già messa una non ne nasce
   nessuna. La differenza non è un flag: è chi ce l'ha messa.

   Il nome di una cosa è quello del suo pittore
   (`grafica/oggetti/indice.js`): un test lo controlla, perché un
   refuso qui sarebbe una cosa che non si vede e non dice niente.
   ═══════════════════════════════════════════════════════════════════ */

/* quanto di una stanza si arreda: frazione dell'area. 0.06 vuol dire
   che un salone di cinquanta caselle prende tre cose e uno stanzino di
   otto ne prende una — e sotto le sei caselle non prende niente,
   perché una stanzetta arredata è una stanzetta piena. */
const NORMALE = 0.06

export const ARREDAMENTO = {
  corridoio: { riempimento: NORMALE, cose: [
    { che: 'torcia', dove: 'sulMuro', peso: 3 },
    { che: 'ragnatela', dove: 'sulMuro', peso: 1 },
    { che: 'cassa', dove: 'alMuro', peso: 2 },
    { che: 'botte', dove: 'alMuro', peso: 2 },
    { che: 'barile', dove: 'alMuro', peso: 1 },
  ] },
  cortile: { riempimento: NORMALE, cose: [
    { che: 'pozzanghera', dove: 'ovunque', suolo: ['terra', 'lastre'], peso: 2 },
    { che: 'cespuglio', dove: 'alMuro', peso: 3 },
    { che: 'sacco', dove: 'alMuro', peso: 1 },
    { che: 'botte', dove: 'alMuro', peso: 1 },
  ] },
  cripta: { riempimento: 0.08, cose: [
    { che: 'ragnatela', dove: 'sulMuro', peso: 3 },
    { che: 'torcia', dove: 'sulMuro', peso: 2 },
    { che: 'ossa', dove: 'ovunque', peso: 2 },
    { che: 'altare', dove: 'alMuro', peso: 1 },
  ] },
  grotta: { riempimento: 0.08, cose: [
    { che: 'stalagmite', dove: 'alMuro', peso: 3 },
    { che: 'fungo', dove: 'ovunque', peso: 2 },
    { che: 'roccia', dove: 'alMuro', peso: 2 },
  ] },
  miniera: { riempimento: 0.07, cose: [
    { che: 'cristallo', dove: 'alMuro', peso: 2 },
    { che: 'roccia', dove: 'alMuro', peso: 2 },
    { che: 'torcia', dove: 'sulMuro', peso: 2 },
  ] },
  fogne: { riempimento: 0.08, cose: [
    { che: 'pozzanghera', dove: 'ovunque', peso: 3 },
    { che: 'ragnatela', dove: 'sulMuro', peso: 2 },
    { che: 'barile', dove: 'alMuro', peso: 1 },
  ] },
  bosco: { riempimento: 0.07, cose: [
    { che: 'cespuglio', dove: 'alMuro', peso: 3 },
    { che: 'fungo', dove: 'ovunque', suolo: ['erba', 'terra'], peso: 2 },
    { che: 'roccia', dove: 'alMuro', peso: 1 },
  ] },
  camminamento: { riempimento: 0.05, cose: [
    { che: 'torcia', dove: 'sulMuro', peso: 3 },
    { che: 'cassa', dove: 'alMuro', peso: 1 },
  ] },
  trono: { riempimento: 0.05, cose: [
    { che: 'torcia', dove: 'sulMuro', peso: 3 },
    { che: 'bandiera', dove: 'sulMuro', peso: 2 },
    { che: 'colonna', dove: 'alMuro', peso: 2 },
  ] },
  tesoro: { riempimento: 0.07, cose: [
    { che: 'cassa', dove: 'alMuro', peso: 3 },
    { che: 'botte', dove: 'alMuro', peso: 2 },
    { che: 'torcia', dove: 'sulMuro', peso: 2 },
  ] },
  ingranaggi: { riempimento: 0.05, cose: [
    { che: 'catena', dove: 'sulMuro', peso: 2 },
    { che: 'barile', dove: 'alMuro', peso: 2 },
  ] },
}
