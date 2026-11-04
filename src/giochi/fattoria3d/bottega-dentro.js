/* Dentro una bottega del paese, la parte di Gioco.vue (docs/fattoria3d/botteghe.md, «Dentro»): entrare e uscire, la scena della sala
   (scena3d/bottega3d.js) su una tela sua mentre la fattoria aspetta ferma, e i fumetti dei clienti. Servire un cliente è la stessa
   consegna del foglio della bottega (`consegna`, da Gioco.vue): qui si dice solo chi. */
import { ref, nextTick } from 'vue'
import { EDIFICI } from './dati/catalogo.js'

/** `dammi()` → { motore, mondo }; `consegna(tipo, id)`: Gioco.vue consegna, festeggia e, se manca roba, apre il foglio col perché e il consiglio. */
export function usaBottegaDentro({ dammi, tela, sopra, q, cambio, abito, consegna, apriElenco, altriFogli, avvisa }) {
  const tipo = ref(null)                  // la bottega in cui si è, o null
  const chiave = ref(0)                   // una tela nuova a ogni ingresso: un contesto WebGL non si riusa
  const fumetti = ref([])                 // un fumetto per bancone: chi aspetta e cosa vuole, o fra quanto arriva qualcuno
  let sala = null, vivo = true

  const ui = {
    cambio() { cambio() },
    fogliAperti: () => altriFogli(),
    servi(id) { consegna(tipo.value, id) },
    apriElenco() { apriElenco(tipo.value) },
    esci() { esci() },
    fumetti(l) { fumetti.value = l },
  }

  async function entra(t) {
    if (tipo.value) return
    const { motore, mondo } = dammi(); if (!motore || !mondo) return
    tipo.value = t; fumetti.value = []; chiave.value++
    mondo.ferma()
    try {
      await nextTick()
      const { Bottega3d } = await import('./scena3d/bottega3d.js')
      if (!vivo || tipo.value !== t) return
      sala = new Bottega3d({ canvas: tela.value, sopra: sopra.value, motore, ui, qualita: q, abito: abito.value, tipo: t, nome: EDIFICI[t].nome })
      sala.avvia()
    } catch (e) {
      sala = null; tipo.value = null; mondo.avvia()
      avvisa('La porta non si apre: riprova più tardi')
    }
  }
  function esci() {
    if (!tipo.value) return
    sala?.via(); sala = null
    tipo.value = null; fumetti.value = []
    dammi().mondo?.avvia()
    cambio()
  }
  /** Il fumetto toccato: come toccare il cliente (il contadino va da lui). */
  function tocca(k) { const f = fumetti.value.find(x => x.k === k); if (f && f.id && sala) sala.servizio(f.id) }
  const vesti = a => sala?.vesti(a)
  function via() { vivo = false; sala?.via(); sala = null }
  return { tipo, chiave, fumetti, entra, esci, tocca, vesti, via, scena: () => sala }
}
