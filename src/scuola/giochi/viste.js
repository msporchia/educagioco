// Le viste dei giochi per la pagina dei bambini, caricate a richiesta (docs/scuola/giochi.md)
import { defineAsyncComponent } from 'vue'

export const VISTE = {
  asteroidi: defineAsyncComponent(() => import('./asteroidi/Vista.vue')),
  survivors: defineAsyncComponent(() => import('./survivors/Vista.vue')),
  'passo-passo': defineAsyncComponent(() => import('./passo-passo/Vista.vue')),
  robot: defineAsyncComponent(() => import('./robot/Vista.vue')),
  inglese: defineAsyncComponent(() => import('./inglese/Vista.vue')),
  pozioni: defineAsyncComponent(() => import('./pozioni/Vista.vue')),
  cucina: defineAsyncComponent(() => import('./cucina/Vista.vue')),
  castello: defineAsyncComponent(() => import('./castello/Vista.vue')),
  sotterraneo: defineAsyncComponent(() => import('./sotterraneo/Vista.vue')),
}
