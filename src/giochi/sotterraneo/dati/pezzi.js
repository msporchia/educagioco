// La roba ha un livello e una rarità (docs/sotterraneo/rarita.md): comune, magico, raro, leggendario, coi colori
// di Diablo. I pezzi magici e rari hanno abilità prese da una decina, e il nome nasce da loro. Dato puro: chi legge
// una chiave composta («spada@7.m.fuoco.att») sta in dati/cose.js, chi pesca il bottino in motore/bottino.js.

// le quattro rarità: `molt` moltiplica il prezzo, `forza` le abilità, `quante` quante abilità si pescano, `pregio`
// fra quali figure sceglie il suo aspetto (dati/aspetti.js): un pezzo comune ha l'aria da bottega
export const RARITA = {
  comune: { lettera: 'c', nome: 'comune', colore: '#e9e6df', molt: 1, forza: 0, quante: [0, 0], pregio: [1, 2] },
  magico: { lettera: 'm', nome: 'magico', colore: '#6f8dff', molt: 1.6, forza: 1, quante: [1, 2], pregio: [2, 3] },
  raro: { lettera: 'r', nome: 'raro', colore: '#ffd23f', molt: 2.6, forza: 1.4, quante: [2, 3], pregio: [3, 4] },
  leggendario: { lettera: 'l', nome: 'leggendario', colore: '#ff9a2e', molt: 4, forza: 1.8, quante: [3, 3], pregio: [4, 4] },
}
export const ORDINE_RARITA = ['comune', 'magico', 'raro', 'leggendario']
export const rangoDellaRarita = r => Math.max(0, ORDINE_RARITA.indexOf(r))
export const RARITA_DA_LETTERA = Object.fromEntries(Object.entries(RARITA).map(([k, r]) => [r.lettera, k]))

// Le abilità dei pezzi: `campo` è quello che il motore somma (Corredo.addosso), `dove` le caselle dove nascono,
// `valore` quanto vale al livello `L` con la forza `f` della rarità. Il nome: l'aggettivo (maschile e
// femminile) e il complemento («della volpe»). Parole da sette anni, un po' epiche (docs/sotterraneo/rarita.md)
const T = ['mano', 'mancina', 'corpo', 'dito']
export const ABILITA_DEI_PEZZI = {
  att: { em: '⚔️', nome: 'Attacco', dove: ['mano', 'mancina'], agg: ['affilato', 'affilata'], di: 'del leone',
         valore: (L, f) => Math.max(1, Math.round((0.5 + L / 10) * f)) },
  dif: { em: '🛡️', nome: 'Difesa', dove: ['mancina', 'corpo', 'dito'], agg: ['corazzato', 'corazzata'], di: 'della tartaruga',
         valore: (L, f) => Math.max(1, Math.round((0.4 + L / 20) * f)) },
  vita: { em: '❤️', nome: 'Vita', dove: T, agg: ['robusto', 'robusta'], di: 'dell\'orso',
          valore: (L, f) => Math.max(2, Math.round((2 + L / 3) * f)) },
  rigenera: { em: '💚', nome: 'Rigenera', dove: T, agg: ['vivo', 'viva'], di: 'del troll',
              valore: (L, f) => Math.max(1, Math.round((0.5 + L / 12) * f)) },
  fuoco: { em: '🔥', nome: 'Fuoco', dove: ['mano', 'dito'], agg: ['fiammeggiante', 'fiammeggiante'], di: 'del drago',
           valore: (L, f) => Math.max(1, Math.round((0.5 + L / 12) * f)) },
  schivata: { em: '🌀', nome: 'Schivata', dove: ['mancina', 'corpo', 'dito'], agg: ['leggero', 'leggera'], di: 'della volpe',
              valore: (L, f) => Math.min(40, Math.round((4 + L / 3) * f)) },
  gemme: { em: '💎', nome: 'Gemme', dove: ['mano', 'dito'], agg: ['luccicante', 'luccicante'], di: 'della gazza',
           valore: (L, f) => Math.round((0.1 + L * 0.005) * f * 100) / 100 },
  fortuna: { em: '🍀', nome: 'Fortuna', dove: ['mano', 'corpo', 'dito'], agg: ['fortunato', 'fortunata'], di: 'del quadrifoglio',
             valore: (L, f) => Math.max(1, Math.round((0.5 + L / 12) * f)) },
  pozioni: { em: '🧪', nome: 'Pozioni', dove: ['corpo', 'dito'], agg: ['incantato', 'incantata'], di: 'della strega',
             valore: (L, f) => Math.round((10 + L) * f) },
  torcia: { em: '⏳', nome: 'Torcia', dove: ['mancina', 'dito'], agg: ['lucente', 'lucente'], di: 'della lucciola',
            valore: (L, f) => Math.max(1, Math.round((2 + L / 6) * f)) },
}
export const CHIAVI_ABILITA = Object.keys(ABILITA_DEI_PEZZI)

// l'aspetto di un pezzo trovato richiama la sua prima abilità: gli elementi delle figure (dati/aspetti.js) che le
// stanno bene, nell'ordine. La spada fiammeggiante è una spada del fuoco, l'anello della gazza è d'oro
export const TINTE_DELLE_ABILITA = {
  att: ['fulmine', 'sangue'], dif: ['ghiaccio', 'morte'], vita: ['sangue', 'natura'], rigenera: ['natura', 'acqua'],
  fuoco: ['fuoco'], schivata: ['ombra', 'arcano'], gemme: ['oro', 'luce'], fortuna: ['oro', 'natura'],
  pozioni: ['arcano', 'acqua', 'veleno'], torcia: ['luce', 'fuoco'],
}

// Il livello rende più forte anche un pezzo comune, sul suo numero principale: le armi picchiano, gli scudi e le
// armature parano, i gioielli che danno vita ne danno di più. Lento apposta: nella storia (livelli 1–12) un'arma
// prende al più due punti, la crescita vera sta nell'eroe; nell'abisso, senza tetto, il livello fa la differenza
export const ATT_OGNI_LIVELLI = 5, DIF_OGNI_LIVELLI = 15, VITA_OGNI_LIVELLI = 4
// il prezzo cresce in linea retta col livello (mai esponenziale, docs/apprendimento/calibrazione.md)
export const PREZZO_PER_LIVELLO = 0.12
export const valoreDelLivello = L => 1 + PREZZO_PER_LIVELLO * (Math.max(1, L) - 1)

// sopra questo livello un pezzo raro si chiama con l'aggettivo epico (temprata, runica, demoniaca, antica)
export const EPICI = [
  { da: 1, agg: ['temprato', 'temprata'] },
  { da: 7, agg: ['runico', 'runica'] },
  { da: 14, agg: ['demoniaco', 'demoniaca'] },
  { da: 22, agg: ['antico', 'antica'] },
]

// I leggendari: rari davvero, ognuno col suo nome, la sua riga di storia e le sue abilità (forza 2). Uno nuovo si
// aggiunge qui; la pagina «Tesori» li mostra tutti, i trovati e il posto vuoto per gli altri. Ognuno ha la sua figura,
// chiamata come lui nell'atlante (docs/sotterraneo/figure.md); così anche i pezzi dei grossi
export const LEGGENDARI = {
  'zanna-del-drago': { base: 'spada', nome: 'Zanna del drago', abilita: ['fuoco', 'att', 'vita'],
                       storia: 'Forgiata col dente di un drago che dormiva da mille anni.' },
  'ascia-del-re-nano': { base: 'ascia', nome: 'Ascia del re dei nani', abilita: ['att', 'dif', 'fortuna'],
                         storia: 'Il re dei nani ci spaccava le montagne a colazione.' },
  'arco-della-luna': { base: 'arco-lungo', nome: 'Arco della luna', abilita: ['att', 'schivata', 'torcia'],
                       storia: 'Le sue frecce brillano come la luna piena.' },
  'bastone-della-tempesta': { base: 'bastone-magico', nome: 'Bastone della tempesta', abilita: ['fuoco', 'att', 'pozioni'],
                              storia: 'Quando lo alzi, fuori dal sotterraneo tuona.' },
  'scettro-delle-stelle': { base: 'scettro', nome: 'Scettro delle stelle', abilita: ['att', 'fuoco', 'fortuna'],
                            storia: 'Un mago lo usava per accendere le stelle, una per una.' },
  'pugnale-dell-ombra': { base: 'pugnale-vampiro', nome: 'Pugnale dell\'ombra', abilita: ['att', 'schivata', 'rigenera'],
                          storia: 'Chi lo tiene diventa veloce come la sua ombra.' },
  'scudo-del-gigante': { base: 'scudo-ferro', nome: 'Scudo del gigante buono', abilita: ['dif', 'vita', 'rigenera'],
                         storia: 'Un gigante buono lo usava come piatto per la minestra.' },
  'corazza-del-drago': { base: 'corazza', nome: 'Corazza di scaglie di drago', abilita: ['dif', 'vita', 'fuoco'],
                         storia: 'Ogni scaglia è calda, come se il drago respirasse ancora.' },
  'manto-della-notte': { base: 'manto', nome: 'Manto della notte', abilita: ['dif', 'schivata', 'vita'],
                         storia: 'Cucito col buio di una notte senza luna.' },
  'anello-del-tesoriere': { base: 'anello-verde', nome: 'Anello del tesoriere', abilita: ['gemme', 'fortuna', 'pozioni'],
                            storia: 'Il tesoriere del re non perdeva mai una moneta. Mai.' },
  'amuleto-della-fenice': { base: 'amuleto-rosso', nome: 'Amuleto della fenice', abilita: ['vita', 'rigenera', 'pozioni'],
                            storia: 'Dentro c\'è una piuma che non smette di scaldare.' },
}

// I pezzi dei mostri grossi (dati/grossi.js): uno ciascuno, col suo nome; rari (giallo), di sicuro quando lui cade.
// Nessuno ha famiglia: li porta chiunque, perché il mostro grosso è di tutti e quattro gli eroi
export const DEI_GROSSI = {
  'ciondolo-di-ossuto': { base: 'amuleto-osso', nome: 'Ciondolo di Re Ossuto', abilita: ['dif', 'vita'] },
  'mazza-di-grumo': { base: 'mazza', nome: 'Mazza di Grumo', abilita: ['vita', 'rigenera'] },
  'scudo-di-fiammetta': { base: 'scudo-legno', nome: 'Scudo di Fiammetta', abilita: ['dif', 'torcia', 'vita'] },
  'anello-di-zannaverde': { base: 'anello-ambra', nome: 'Anello di Zannaverde', abilita: ['schivata', 'fortuna'] },
  'amuleto-di-gorgo': { base: 'amuleto-azzurro', nome: 'Amuleto di Gorgo', abilita: ['rigenera', 'vita', 'pozioni'] },
  'giubbone-di-minotto': { base: 'panciotto', nome: 'Giubbone di Minotto', abilita: ['dif', 'vita', 'rigenera'] },
  'martello-di-carbonchio': { base: 'martello', nome: 'Martello di Carbonchio', abilita: ['att', 'fuoco'] },
}

// i pezzi col nome proprio (leggendari e dei capi) nella stessa chiave: `u` nella chiave composta
export const UNICI = {
  ...Object.fromEntries(Object.entries(LEGGENDARI).map(([k, v]) => [k, { ...v, rarita: 'leggendario' }])),
  ...Object.fromEntries(Object.entries(DEI_GROSSI).map(([k, v]) => [k, { ...v, rarita: 'raro' }])),
}
