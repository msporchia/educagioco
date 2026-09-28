// La spiegazione senza parole: un codice coperto che si scopre, un
// tentativo sotto, e i tre casi mostrati uno alla volta (pieno: le due
// caselle si accendono e vola un pallino verde; vuoto: la casella salta
// fino alla sua e torna; niente: trema e si spegne). Questa classe non
// calcola niente — i passi glieli passa `motore/indizi.js` — così non può
// mai raccontare una regola diversa da quella che il gioco applica.

// I tempi, in millesimi: si ritoccano guardando un bambino guardare.
const T = {
  scopri: 400,      // quando il lucchetto si apre
  perCasella: 120,  // ritardo fra una casella scoperta e la dopo
  primoPasso: 1300, // quando comincia il primo dei tre casi
  pieno: 1700,      // quanto dura il caso «combacia»
  vuoto: 2300,      // il salto è più lungo: c'è da guardarlo
  niente: 1400,
  volo: 620,        // quanto ci mette il pallino ad arrivare nel riquadro
  respiro: 1700,    // la pausa prima di ricominciare da capo
}

const nodo = (tag, classe, testo) => {
  const e = document.createElement(tag)
  if (classe) e.className = classe
  if (testo != null) e.textContent = testo
  return e
}

export class Dimostrazione {
  // `radice` è l'elemento in cui costruirsi; `passi` sono i tre casi già
  // decisi; `suona` riceve 'pieno' | 'vuoto' | 'niente'.
  constructor(radice, { codice, tentativo, passi, suona = null } = {}) {
    this.radice = radice
    this.codice = codice
    this.tentativo = tentativo
    this.passi = passi
    this.suona = suona
    this.orologi = []
    this.costruita = false
  }

  costruisci() {
    const r = this.radice
    r.innerHTML = ''
    r.classList.add('cs-dimo')

    const rigaSeg = nodo('div', 'cs-drigo cs-seg')
    this.lucchetto = nodo('span', 'cs-dicona em', '🔒')
    this.celleSeg = this.codice.map(() => nodo('div', 'cs-dcas em', '?'))
    const boxSeg = nodo('div', 'cs-dcaselle')
    this.celleSeg.forEach(c => boxSeg.appendChild(c))
    rigaSeg.append(this.lucchetto, boxSeg, nodo('div', 'cs-dspazio'))

    const rigaProva = nodo('div', 'cs-drigo cs-tentativo')
    this.celleProva = this.tentativo.map(s => nodo('div', 'cs-dcas em', s))
    const boxProva = nodo('div', 'cs-dcaselle')
    this.celleProva.forEach(c => boxProva.appendChild(c))
    this.indizi = nodo('div', 'cs-dindizi')
    rigaProva.append(nodo('span', 'cs-dicona em', '👆'), boxProva, this.indizi)

    r.append(rigaSeg, rigaProva)
    this.costruita = true
  }

  fra(ms, cosa) { this.orologi.push(setTimeout(cosa, ms)) }

  avvia() {
    if (!this.radice) return
    if (!this.costruita) this.costruisci()
    this.ferma()
    this.giro()
  }

  ferma() {
    this.orologi.forEach(clearTimeout)
    this.orologi = []
    this.radice?.querySelectorAll('.cs-dvolante').forEach(v => v.remove())
  }

  giro() {
    this.daCapo()

    // si sbircia il codice: qui è scoperto perché è solo un esempio
    this.fra(T.scopri, () => {
      this.lucchetto.textContent = '👁️'
      this.celleSeg.forEach((c, i) => this.fra(i * T.perCasella, () => {
        c.textContent = this.codice[i]
        c.classList.add('cs-scoperta')
      }))
    })

    let quando = T.primoPasso
    for (const passo of this.passi) {
      this.mostraPasso(passo, quando)
      quando += T[passo.tipo] || T.pieno
    }
    this.fra(quando + T.respiro, () => this.giro())
  }

  daCapo() {
    this.lucchetto.textContent = '🔒'
    this.celleSeg.forEach(c => { c.textContent = '?'; c.className = 'cs-dcas em' })
    this.celleProva.forEach((c, i) => {
      c.className = 'cs-dcas em'
      c.textContent = this.tentativo[i]
      c.style.removeProperty('--dx')
    })
    this.indizi.innerHTML = ''
    this.radice.querySelectorAll('.cs-dvolante').forEach(v => v.remove())
  }

  mostraPasso(passo, quando) {
    const prova = this.celleProva[passo.prova]
    const seg = passo.seg != null ? this.celleSeg[passo.seg] : null

    if (passo.tipo === 'pieno') {
      this.fra(quando, () => {
        prova.classList.add('cs-acceso')
        seg.classList.add('cs-acceso')
        this.suona?.('pieno')
      })
      this.fra(quando + 600, () => this.vola(prova, 'pieno'))
      this.fra(quando + 1300, () => {
        prova.classList.remove('cs-acceso')
        seg.classList.remove('cs-acceso')
      })
      return
    }

    if (passo.tipo === 'vuoto') {
      // il salto: la casella va fino a dove il disegno sta davvero e torna
      this.fra(quando, () => {
        const da = prova.getBoundingClientRect(), a = seg.getBoundingClientRect()
        prova.style.setProperty('--dx', (a.left - da.left) + 'px')
        prova.classList.add('cs-acceso-v', 'cs-salta')
        seg.classList.add('cs-acceso-v')
        this.suona?.('vuoto')
      })
      this.fra(quando + 1100, () => this.vola(prova, 'vuoto'))
      this.fra(quando + 1900, () => {
        prova.classList.remove('cs-acceso-v', 'cs-salta')
        seg.classList.remove('cs-acceso-v')
      })
      return
    }

    this.fra(quando, () => { prova.classList.add('cs-no'); this.suona?.('niente') })
    this.fra(quando + 500, () => {
      prova.classList.remove('cs-no')
      prova.classList.add('cs-spento')
    })
  }

  // Un pallino che parte dalla casella e atterra nel riquadro degli
  // indizi. Vola un sosia in posizione assoluta; quello vero sta già al
  // suo posto, invisibile, così l'arrivo è esattamente dove sarà.
  vola(daCella, tipo) {
    const cornice = this.radice.getBoundingClientRect()
    const a = daCella.getBoundingClientRect()

    const finto = nodo('div', 'cs-dvolante cs-' + tipo)
    finto.style.left = (a.left - cornice.left + a.width / 2 - 9.5) + 'px'
    finto.style.top = (a.top - cornice.top + a.height / 2 - 9.5) + 'px'
    this.radice.appendChild(finto)

    const posto = nodo('div', 'cs-pallino cs-' + tipo)
    posto.style.visibility = 'hidden'
    this.indizi.appendChild(posto)

    requestAnimationFrame(() => {
      const b = posto.getBoundingClientRect()
      const dx = (b.left - cornice.left + b.width / 2 - 9.5) - parseFloat(finto.style.left)
      const dy = (b.top - cornice.top + b.height / 2 - 9.5) - parseFloat(finto.style.top)
      finto.style.transform = `translate(${dx}px, ${dy}px)`
    })

    this.fra(T.volo, () => {
      posto.style.visibility = ''
      posto.classList.add('cs-nuovo')
      finto.remove()
    })
  }
}
