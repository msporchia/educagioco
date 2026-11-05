<template>
  <!-- le due spade incrociate: lo stemma di Castle Battle, disegnato e non un'emoji -->
  <svg viewBox="0 0 64 64" aria-hidden="true">
    <defs>
      <linearGradient id="ar-lama" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#c8d4e4"/><stop offset="1" stop-color="#7f8fa8"/></linearGradient>
      <linearGradient id="ar-oro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a0"/><stop offset="1" stop-color="#c98a1e"/></linearGradient>
    </defs>
    <g v-for="v in [1, -1]" :key="v" :transform="v < 0 ? 'matrix(-1 0 0 1 64 0)' : ''" stroke="#2b1c10" stroke-width="1.4" stroke-linejoin="round">
      <path d="M8 5 L13 4 L46 40 L41 45 L7 11 Z" fill="url(#ar-lama)"/>
      <path d="M36 50 L50 36 L54 40 L40 54 Z" fill="url(#ar-oro)"/>
      <path d="M46 47 L53 54 L50 57 L43 50 Z" fill="#6b3f1e"/>
      <circle cx="53.5" cy="55.5" r="3.6" fill="url(#ar-oro)"/>
    </g>
  </svg>
</template>
