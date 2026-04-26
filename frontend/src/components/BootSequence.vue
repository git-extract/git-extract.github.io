<template>
  <div class="boot-overlay" :class="`boot-phase--${phase}`">

    <!-- BSOD -->
    <BlueScreen v-if="phase === 'bsod'" :countdown="bsodCountdown" />

    <!-- BIOS POST screen -->
    <div v-else-if="phase === 'bios'" class="bios-screen">
      <div
        v-for="(item, i) in BIOS_CONTENT"
        :key="i"
        class="boot-line bios-line"
        :class="{ 'bios-line--header': i < 2 }"
        :style="{ '--d': item.delay + 'ms' }"
      >{{ item.text }}</div>
    </div>

    <!-- CD boot -->
    <div v-else-if="phase === 'cdboot'" class="cdboot-screen">
      <div
        v-for="(item, i) in CDBOOT_CONTENT"
        :key="i"
        class="boot-line cdboot-line"
        :style="{ '--d': item.delay + 'ms' }"
      >{{ item.text }}</div>
    </div>

    <!-- Starting Winders 98 -->
    <div v-else-if="phase === 'win98'" class="win98start-screen">
      <div
        v-for="(item, i) in WIN98_CONTENT"
        :key="i"
        class="boot-line win98-line"
        :style="{ '--d': item.delay + 'ms' }"
      >{{ item.text }}</div>
    </div>

    <!-- 'black' phase: just the black background, no content -->

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import BlueScreen from './BlueScreen.vue'

const emit = defineEmits(['done'])

// ── State ──────────────────────────────────────────────────────
const phase         = ref('bsod')
const bsodCountdown = ref(3)

// ── Boot content ───────────────────────────────────────────────
const BIOS_CONTENT = [
  { text: 'Fenix - RewardBIOS v6.00PG, An Energy Star Companion',      delay: 0 },
  { text: 'Copyright (C) 1984-2001, Fenix Technologies, LTD',          delay: 60 },
  { text: '',                                                            delay: 150 },
  { text: 'git-extract Systems, Inc.',                                  delay: 220 },
  { text: '',                                                            delay: 310 },
  { text: 'Main Processor  : Intek Pentagram III 450MHz',               delay: 380 },
  { text: 'Math Coprocessor: Installed',                                delay: 450 },
  { text: 'Floppy Drive A  : 1.44MB  3.5"',                            delay: 520 },
  { text: '',                                                            delay: 600 },
  { text: 'Memory Test :      16384K',                                  delay: 750 },
  { text: 'Memory Test :     131072K',                                  delay: 950 },
  { text: 'Memory Test :     524288K  OK',                              delay: 1150 },
  { text: '',                                                            delay: 1350 },
  { text: 'Detecting Primary Master   ...  XS320423A      Ultra DXA Mode 5', delay: 1550 },
  { text: 'Detecting Primary Slave    ...  None',                       delay: 1830 },
  { text: 'Detecting Secondary Master ...  AZUS CD-524E   PIO Mode 4', delay: 2110 },
  { text: 'Detecting Secondary Slave  ...  None',                       delay: 2390 },
  { text: '',                                                            delay: 2600 },
  { text: 'Press <DEL> to enter SETUP   Press <F12> for Boot Menu',    delay: 2800 },
  { text: '',                                                            delay: 3100 },
  { text: 'Booting from CD-ROM...',                                     delay: 3400 },
]

const CDBOOT_CONTENT = [
  { text: 'ATAPI CD-ROM: AZUS CD-524E',         delay: 0 },
  { text: '',                                    delay: 300 },
  { text: 'Loading boot sector...',              delay: 500 },
  { text: '',                                    delay: 850 },
  { text: 'Press any key to boot from CD-ROM.', delay: 1100 },
]

const WIN98_CONTENT = [
  { text: 'Microtough Winders 98',                delay: 0 },
  { text: '',                                     delay: 200 },
  { text: '         Starting Winders 98...', delay: 400 },
]

// ── Sequence ───────────────────────────────────────────────────
function go(p, ms) { setTimeout(() => { phase.value = p }, ms) }

onMounted(() => {
  bsodCountdown.value = 3

  const ticker = setInterval(() => {
    bsodCountdown.value--
    if (bsodCountdown.value <= 0) clearInterval(ticker)
  }, 1000)

  go('black',  3000)
  go('bios',   3500)
  go('black',  7900)
  go('cdboot', 8300)
  go('black',  9900)
  go('win98',  10300)
  go('black',  12000)

  setTimeout(() => emit('done'), 12500)
})
</script>

<style lang="scss" scoped>
// ── Overlay ────────────────────────────────────────────────────
.boot-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #000;
  overflow: hidden;

  &.boot-phase--bsod { background: #0000AA; }
}

@keyframes boot-flicker {
  0%   { opacity: 0; }
  6%   { opacity: 1; }
  10%  { opacity: 0; }
  14%  { opacity: 1; }
  100% { opacity: 1; }
}
.boot-overlay { animation: boot-flicker 0.25s steps(1) forwards; }

// ── Shared line-reveal ─────────────────────────────────────────
@keyframes line-appear {
  to { opacity: 1; }
}

.boot-line {
  opacity: 0;
  animation: line-appear 1ms var(--d, 0ms) step-end forwards;
  white-space: pre;
  min-height: 1em;
  font-family: 'Courier New', Courier, monospace;
}

// ── BIOS POST ──────────────────────────────────────────────────
.bios-screen {
  padding: 18px 36px;
  font-size: 13px;
  line-height: 1.65;
  color: #aaaaaa;
}

.bios-line {
  &--header { color: #ffffff; }
}

// ── CD boot ────────────────────────────────────────────────────
.cdboot-screen {
  padding: 18px 36px;
  font-size: 14px;
  line-height: 1.8;
  color: #ffffff;
}

.cdboot-line:last-child::after {
  content: '_';
  opacity: 0;
  animation: blink-cur 1s step-end infinite;
  animation-delay: 1.3s;
}

@keyframes blink-cur { 50% { opacity: 1; } }

// ── Winders 98 start ───────────────────────────────────────────
.win98start-screen {
  padding: 18px 36px;
  font-size: 14px;
  line-height: 2;
  color: #ffffff;
}
</style>
