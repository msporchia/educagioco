/* ═══════════════════════════════════════════════════════════════════
   COSA SI TROVA, E COSA DICE UNA PORTA

   Due caselle addosso — mano e corpo — e sei tasche (`TASCHE` in
   `mondo.js`). Le tasche non sono decorazione: sono **il limite**. Uno
   zaino pieno vuol dire scegliere cosa lasciare per terra, ed è la
   stessa domanda del bivio fatta con le mani invece che con una freccia.

   ── LE ARMATURE NON HANNO UNO SPRITE, E SI VEDE ───────────────────
   0x72 equipaggia solo le mani: nel foglio ci sono tre armi e nessun
   elmo, scudo o corazza (cercati in tutti e 370 i nomi). Panciotto,
   corazza e manto restano quindi **emoji**, e stonano in mezzo a uno
   schermo disegnato a mano. È il buco che decide se un set basta, e va
   guardato prima di innamorarsene; qui si dichiara `sprite: null`
   invece di puntare a un pezzo che non c'è, perché un nome sbagliato si
   presenta a schermo come un buco senza dire perché.

   ── IL PREZZO È DAL MERCANTE, NON PER TERRA ───────────────────────
   `prezzo` serve solo al banco del mercante: quello che si trova in
   giro non costa niente, si raccoglie camminandoci sopra.
   ═══════════════════════════════════════════════════════════════════ */

export const COSE = {
  spadino: { em: '🗡️', nome: 'Spadino', sprite: 'arma-1', dove: 'mano', att: 1, prezzo: 8,
             dice: 'I mostri cadono un po\' prima.' },
  spada: { em: '⚔️', nome: 'Spada', sprite: 'arma-2', dove: 'mano', att: 2, prezzo: 16,
           dice: 'Ogni risposta giusta fa più male.' },
  ascia: { em: '🪓', nome: 'Ascia', sprite: 'arma-3', dove: 'mano', att: 3, prezzo: 26,
           dice: 'Anche i grossi cadono in pochi colpi.' },

  panciotto: { em: '🦺', nome: 'Panciotto', sprite: null, dove: 'corpo', dif: 1, prezzo: 9,
               dice: 'Sbagliare fa un po\' meno male.' },
  corazza: { em: '🛡️', nome: 'Corazza', sprite: null, dove: 'corpo', dif: 2, prezzo: 18,
             dice: 'Sbagliare fa molto meno male.' },
  manto: { em: '🧥', nome: 'Manto', sprite: null, dove: 'corpo', dif: 3, prezzo: 28,
           dice: 'Sbagliare non fa quasi più male.' },

  pozione: { em: '🧪', nome: 'Pozione', sprite: 'pozione-rossa', usa: 'cura', cura: 10, prezzo: 10,
             dice: 'Dieci punti di vita, subito.' },
  torcia: { em: '🔦', nome: 'Torcia', sprite: null, usa: 'luce', prezzo: 7,
            dice: 'Vedi più lontano, per un po\'.' },
  chiave: { em: '🗝️', nome: 'Chiave', sprite: null, usa: 'porta', prezzo: 6,
            dice: 'Apre una porta senza rispondere.' },
}

export const CHIAVI_COSE = Object.keys(COSE)

/* Quello che il mercante può avere in banco, e quello che salta fuori da
   un forziere. Sono due elenchi diversi apposta: dal forziere non escono
   chiavi né spadini — è la cosa che si è pagata cara, e deve valere. */
export const IN_VENDITA = CHIAVI_COSE.filter(k => COSE[k].prezzo)
export const NEI_FORZIERI = ['spada', 'corazza', 'ascia', 'manto', 'pozione', 'torcia']

/* ── quello che una porta chiusa lascia intravedere ──
   È l'informazione con cui si sceglie dove andare, quindi **non mente
   mai**: dietro un teschio c'è davvero una guardia. Se un segno
   promettesse a vuoto diventerebbe una decorazione, e in due minuti
   nessuno lo guarderebbe più — e con lui se ne andrebbe l'unico motivo
   per cui tornare indietro è una scelta invece che una penitenza. */
export const SEGNI = {
  guardia: { em: '💀', dice: 'C\'è qualcosa di grosso, là dentro.' },
  tesoro: { em: '💎', dice: 'Da qui si sente odore di roba buona.' },
  mercante: { em: '🏪', dice: 'Qualcuno, là dentro, vende.' },
  fonte: { em: '⛲', dice: 'Si sente acqua.' },
  vuoto: { em: '·', dice: 'Non si sente niente.' },
}

export function guastiDelleCose() {
  const g = []
  for (const [k, c] of Object.entries(COSE)) {
    if (!c.em || !c.nome) g.push(`${k}: senza emoji o senza nome`)
    if (!c.dice) g.push(`${k}: non dice cosa fa, e il mercante lo mostra`)
    if (!c.dove && !c.usa) g.push(`${k}: né si indossa né si usa, quindi non fa niente`)
    if (c.dove && !['mano', 'corpo'].includes(c.dove)) g.push(`${k}: si indossa su "${c.dove}"?`)
    if (c.usa === 'cura' && !c.cura) g.push(`${k}: cura zero`)
  }
  for (const k of NEI_FORZIERI) if (!COSE[k]) g.push(`nei forzieri c'è "${k}", che non esiste`)
  if (!IN_VENDITA.length) g.push('il mercante non ha niente da vendere')
  for (const [k, s] of Object.entries(SEGNI))
    if (!s.em || !s.dice) g.push(`segno ${k}: senza emoji o senza frase`)
  return g
}
