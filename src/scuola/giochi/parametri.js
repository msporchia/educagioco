// L'editor della maestra per i giochi che hanno un contenuto loro (`tipo` nella scheda): docs/scuola/giochi.md
import { defineAsyncComponent } from 'vue'

export const PARAMETRI = {
  asteroidi: defineAsyncComponent(() => import('./asteroidi/Parametri.vue')),
  'passo-passo': defineAsyncComponent(() => import('./passo-passo/Parametri.vue')),
  robot: defineAsyncComponent(() => import('./robot/Parametri.vue')),
  inglese: defineAsyncComponent(() => import('./inglese/Parametri.vue')),
  pozioni: defineAsyncComponent(() => import('./pozioni/Parametri.vue')),
  cucina: defineAsyncComponent(() => import('./cucina/Parametri.vue')),
  castello: defineAsyncComponent(() => import('./castello/Parametri.vue')),
}
