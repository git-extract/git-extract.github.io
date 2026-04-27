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

      <!-- Top-right logo — pixel-art canvas, 80×50 px drawn natively, scaled 3× -->
      <canvas ref="biosLogoCanvas" class="bios-logo" />
    </div>

    <!-- BIOS SETUP UTILITY (DEL) -->
    <div v-else-if="phase === 'bios-setup'" class="setup-screen">
      <div class="setup-topbar">
        <span>ROM PCI/ISA BIOS (2A59G529)</span>
        <span>CMOS SETUP UTILITY — AWARD SOFTWARE, INC.</span>
      </div>

      <div class="setup-body">
        <div class="setup-menu">
          <div
            v-for="(item, i) in SETUP_MENU"
            :key="i"
            class="setup-menu__item"
            :class="{ 'setup-menu__item--active': biosSetupItem === i }"
          >{{ item }}</div>
        </div>

        <div class="setup-hints">
          <span>Esc : Quit</span>
          <span>↑ ↓ → ← : Select Item</span>
          <span>Enter / F10 : Save &amp; Exit</span>
        </div>
      </div>

      <div class="setup-botbar">
        <span>Time : {{ setupTime }}</span>
        <span>Date : {{ setupDate }}</span>
        <span>Base Memory : 640K</span>
        <span>Ext Memory : 523264K</span>
      </div>
    </div>

    <!-- BOOT DEVICE MENU (F12) -->
    <div v-else-if="phase === 'boot-menu'" class="bootmenu-screen">
      <div class="bootmenu-box">
        <div class="bootmenu-title">Boot Device Priority</div>
        <div class="bootmenu-line" />
        <div
          v-for="(dev, i) in BOOT_DEVICES"
          :key="i"
          class="bootmenu-item"
          :class="{ 'bootmenu-item--active': bootMenuDeviceIdx === i }"
        >
          <span class="bootmenu-item__arrow">{{ bootMenuDeviceIdx === i ? '►' : ' ' }}</span>
          <span>{{ dev.label }}</span>
        </div>
        <div class="bootmenu-line" />
        <div class="bootmenu-hint">↑ ↓ Select &nbsp;&nbsp; Enter Boot &nbsp;&nbsp; Esc Cancel</div>
      </div>
    </div>

    <!-- HDD BOOT FAILURE (when user picks Hard Disk from boot menu) -->
    <div v-else-if="phase === 'hdd-error'" class="hdd-error-screen">
      <div class="hdd-error-msg">DISK BOOT FAILURE, INSERT SYSTEM DISK AND PRESS ENTER</div>
      <div class="hdd-error-fallback">Switching to CD-ROM boot…</div>
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
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import BlueScreen from './BlueScreen.vue'

const emit = defineEmits(['done'])

// ── State ──────────────────────────────────────────────────────
const phase          = ref('bsod')
const bsodCountdown  = ref(3)
const biosLogoCanvas = ref(null)
const biosSetupItem  = ref(6)     // pre-select "SAVE & EXIT SETUP"
const bootMenuDeviceIdx = ref(0)

// ── Timer management ───────────────────────────────────────────
const timers = []   // plain array — not reactive, just for cleanup

function go(p, ms) {
  timers.push(setTimeout(() => { phase.value = p }, ms))
}

function cancelAll() {
  timers.forEach(clearTimeout)
  timers.length = 0
}

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
  { text: 'Microtough Winders 98',           delay: 0 },
  { text: '',                                delay: 200 },
  { text: '         Starting Winders 98...', delay: 400 },
]

// ── BIOS setup menu items (2-column grid) ──────────────────────
const SETUP_MENU = [
  'STANDARD CMOS SETUP',    'SUPERVISOR PASSWORD',
  'BIOS FEATURES SETUP',    'USER PASSWORD',
  'CHIPSET FEATURES SETUP', 'IDE HDD AUTO DETECTION',
  'POWER MANAGEMENT SETUP', 'HDD LOW LEVEL FORMAT',
  'PNP/PCI CONFIGURATION',  'SAVE & EXIT SETUP',
  'LOAD BIOS DEFAULTS',     'EXIT WITHOUT SAVING',
]

// ── Boot device menu ───────────────────────────────────────────
const BOOT_DEVICES = [
  { label: 'CD-ROM Drive      (AZUS CD-524E)',  key: 'cd'  },
  { label: 'Hard Disk Drive   (XS320423A)',     key: 'hdd' },
  { label: 'Floppy Disk Drive (A:)',            key: 'fdd' },
]

// ── Fake BIOS clock (shows real time) ─────────────────────────
const now = new Date()
const setupTime = now.toTimeString().slice(0, 8)
const setupDate = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' })

// ── Resume helpers ─────────────────────────────────────────────
/** Cancel all pending timeouts and schedule the boot tail from the cdboot phase. */
function resumeFromCdBoot(flashMs = 400) {
  cancelAll()
  phase.value = 'black'
  go('cdboot', flashMs)
  go('black',  flashMs + 1650)
  go('win98',  flashMs + 2050)
  go('black',  flashMs + 3750)
  timers.push(setTimeout(() => emit('done'), flashMs + 4250))
}

// ── Keyboard handler ───────────────────────────────────────────
function onKeyDown(e) {
  const p = phase.value

  // ── BIOS POST: DEL → Setup, F12 → Boot Menu ─────────────────
  if (p === 'bios') {
    if (e.key === 'Delete') {
      e.preventDefault()
      cancelAll()
      biosSetupItem.value = 6       // pre-select "SAVE & EXIT SETUP"
      phase.value = 'bios-setup'
    } else if (e.key === 'F12') {
      e.preventDefault()
      cancelAll()
      bootMenuDeviceIdx.value = 0
      phase.value = 'boot-menu'
    }
    return
  }

  // ── BIOS Setup utility ───────────────────────────────────────
  if (p === 'bios-setup') {
    e.preventDefault()
    const len = SETUP_MENU.length
    if (e.key === 'ArrowDown')  biosSetupItem.value = (biosSetupItem.value + 2) % len
    if (e.key === 'ArrowUp')    biosSetupItem.value = (biosSetupItem.value - 2 + len) % len
    if (e.key === 'ArrowRight') biosSetupItem.value = biosSetupItem.value % 2 === 0 ? Math.min(biosSetupItem.value + 1, len - 1) : biosSetupItem.value
    if (e.key === 'ArrowLeft')  biosSetupItem.value = biosSetupItem.value % 2 === 1 ? biosSetupItem.value - 1 : biosSetupItem.value
    if (e.key === 'Escape' || e.key === 'F10' || e.key === 'Enter') {
      resumeFromCdBoot(400)
    }
    return
  }

  // ── Boot device menu ─────────────────────────────────────────
  if (p === 'boot-menu') {
    e.preventDefault()
    const len = BOOT_DEVICES.length
    if (e.key === 'ArrowDown') bootMenuDeviceIdx.value = (bootMenuDeviceIdx.value + 1) % len
    if (e.key === 'ArrowUp')   bootMenuDeviceIdx.value = (bootMenuDeviceIdx.value - 1 + len) % len
    if (e.key === 'Enter') {
      const dev = BOOT_DEVICES[bootMenuDeviceIdx.value]
      if (dev.key === 'hdd') {
        // HDD path: show disk-boot failure, then fall back to CD
        cancelAll()
        phase.value = 'hdd-error'
        timers.push(setTimeout(() => resumeFromCdBoot(0), 2800))
      } else {
        resumeFromCdBoot(0)
      }
    }
    if (e.key === 'Escape') resumeFromCdBoot(0)
    return
  }

  // ── CD boot: any key skips the "press any key" wait ──────────
  if (p === 'cdboot') {
    e.preventDefault()
    cancelAll()
    phase.value = 'black'
    go('win98',  300)
    go('black',  2000)
    timers.push(setTimeout(() => emit('done'), 2500))
  }
}

// ── BIOS logo (pixel art) ─────────────────────────────────────
watch(phase, val => { if (val === 'bios') nextTick(() => drawBiosLogo()) })

function drawBiosLogo() {
  const canvas = biosLogoCanvas.value
  if (!canvas) return

  const W = 80, H = 50
  canvas.width  = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Dithered dark-blue background (2-colour checkerboard)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#00007B' : '#000055'
      ctx.fillRect(x, y, 1, 1)
    }
  }

  // 1-px border
  ctx.fillStyle = '#4444AA'
  ctx.fillRect(0, 0, W, 1);      ctx.fillRect(0, H - 1, W, 1)
  ctx.fillRect(0, 0, 1, H);      ctx.fillRect(W - 1, 0, 1, H)

  // ── Big pixel font (5×5) — "FENIX" ────────────────────────────
  const BIG = {
    F: [[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0]],
    E: [[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,1,1,1,1]],
    N: [[1,0,0,0,1],[1,1,0,0,1],[1,0,1,0,1],[1,0,0,1,1],[1,0,0,0,1]],
    I: [[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[1,1,1,1,1]],
    X: [[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,1,0,1,0],[1,0,0,0,1]],
  }
  const ps = 2
  const bigStr = 'FENIX'
  const bigW = bigStr.length * 5 * ps + (bigStr.length - 1) * 2
  const bigX = Math.floor((W - bigW) / 2)
  const bigY = 6

  ctx.fillStyle = '#FFFF55'
  bigStr.split('').forEach((ch, ci) => {
    const ox = bigX + ci * (5 * ps + 2)
    BIG[ch].forEach((row, ry) =>
      row.forEach((bit, rx) => { if (bit) ctx.fillRect(ox + rx * ps, bigY + ry * ps, ps, ps) })
    )
  })

  // Horizontal separator
  ctx.fillStyle = '#5555CC'
  ctx.fillRect(3, 22, W - 6, 1)

  // ── Small variable-width pixel font (4-5 × 5) ─────────────────
  const SM = {
    A: [[0,1,1,0],[1,0,0,1],[1,1,1,1],[1,0,0,1],[1,0,0,1]],
    B: [[1,1,1,0],[1,0,0,1],[1,1,1,0],[1,0,0,1],[1,1,1,0]],
    C: [[0,1,1,0],[1,0,0,0],[1,0,0,0],[1,0,0,0],[0,1,1,0]],
    D: [[1,1,1,0],[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,1,1,0]],
    E: [[1,1,1,1],[1,0,0,0],[1,1,1,0],[1,0,0,0],[1,1,1,1]],
    G: [[0,1,1,1],[1,0,0,0],[1,0,1,1],[1,0,0,1],[0,1,1,1]],
    I: [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[1,1,1]],
    O: [[0,1,1,0],[1,0,0,1],[1,0,0,1],[1,0,0,1],[0,1,1,0]],
    P: [[1,1,1,0],[1,0,0,1],[1,1,1,0],[1,0,0,0],[1,0,0,0]],
    R: [[1,1,1,0],[1,0,0,1],[1,1,1,0],[1,0,1,0],[1,0,0,1]],
    S: [[0,1,1,1],[1,0,0,0],[0,1,1,0],[0,0,0,1],[1,1,1,0]],
    T: [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[0,1,0]],
    V: [[1,0,0,0,1],[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,0,0,0,0]],
    W: [[1,0,0,0,1],[1,0,0,0,1],[1,0,1,0,1],[1,1,0,1,1],[1,0,0,0,1]],
    X: [[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,1,0,1,0],[1,0,0,0,1]],
    '0': [[0,1,1,0],[1,0,0,1],[1,0,0,1],[1,0,0,1],[0,1,1,0]],
    '6': [[0,1,1,0],[1,0,0,0],[1,1,1,0],[1,0,0,1],[0,1,1,0]],
    '.': [[0],[0],[0],[0],[1]],
    '-': [[0,0,0],[0,0,0],[1,1,1],[0,0,0],[0,0,0]],
    ' ': [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],
  }

  function smWidth(str) {
    let w = 0
    for (const ch of str) { const b = SM[ch] ?? SM[' ']; w += b[0].length + 1 }
    return w - 1
  }
  function drawSmText(str, y, color) {
    ctx.fillStyle = color
    let cx = Math.floor((W - smWidth(str)) / 2)
    for (const ch of str) {
      const bmp = SM[ch] ?? SM[' ']
      bmp.forEach((row, ry) =>
        row.forEach((bit, rx) => { if (bit) ctx.fillRect(cx + rx, y + ry, 1, 1) })
      )
      cx += bmp[0].length + 1
    }
  }

  drawSmText('REWARDBIOS', 26, '#FFFFFF')
  drawSmText('V6.00PG',    35, '#AAAAAA')
  drawSmText('GIT-EXTRACT', 43, '#666699')
}

// ── Sequence ───────────────────────────────────────────────────
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
  timers.push(setTimeout(() => emit('done'), 12500))

  document.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown)
  cancelAll()
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

  &.boot-phase--bsod    { background: #0000AA; }
  &.boot-phase--bios-setup  { background: #0000AA; }
  &.boot-phase--hdd-error   { background: #000; }
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
@keyframes line-appear { to { opacity: 1; } }

.boot-line {
  opacity: 0;
  animation: line-appear 1ms var(--d, 0ms) step-end forwards;
  white-space: pre;
  min-height: 1em;
  font-family: 'Courier New', Courier, monospace;
}

// ── BIOS POST ──────────────────────────────────────────────────
.bios-screen {
  position: relative;
  padding: 18px 36px;
  font-size: 13px;
  line-height: 1.65;
  color: #aaaaaa;
}

.bios-line { &--header { color: #ffffff; } }

// ── BIOS logo (top-right corner) ───────────────────────────────
.bios-logo {
  position: absolute;
  top: 18px;
  right: 36px;
  width:  240px;
  height: 150px;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

// ── BIOS Setup Utility ─────────────────────────────────────────
.setup-screen {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  line-height: 1.5;
  background: #0000AA;
}

.setup-topbar {
  flex-shrink: 0;
  background: #AAAAAA;
  color: #000;
  display: flex;
  justify-content: space-between;
  padding: 2px 8px;
  font-size: 12px;
}

.setup-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.setup-menu {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  border: 1px solid #AAAAAA;
  width: min(680px, 100%);

  &__item {
    padding: 3px 16px;
    color: #FFFFFF;
    white-space: nowrap;
    cursor: default;

    // Divide left and right columns
    &:nth-child(odd)  { border-right: 1px solid #555599; }

    &--active {
      background: #AAAAAA;
      color: #000080;
    }
  }
}

.setup-hints {
  display: flex;
  gap: 24px;
  margin-top: 12px;
  color: #FFFF55;
  font-size: 11px;
}

.setup-botbar {
  flex-shrink: 0;
  background: #AAAAAA;
  color: #000;
  display: flex;
  justify-content: space-around;
  padding: 2px 8px;
  font-size: 12px;
}

// ── Boot Device Menu ───────────────────────────────────────────
.bootmenu-screen {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.bootmenu-box {
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  color: #CCCCCC;
  border: 1px solid #666;
  min-width: 320px;
  padding: 0;
}

.bootmenu-title {
  background: #0000AA;
  color: #FFFF55;
  padding: 4px 14px;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.bootmenu-line {
  border: none;
  border-top: 1px solid #444;
}

.bootmenu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 14px;
  color: #CCCCCC;
  cursor: default;

  &__arrow { width: 10px; flex-shrink: 0; color: #FFFF55; }

  &--active {
    background: #0000AA;
    color: #FFFFFF;
  }
}

.bootmenu-hint {
  padding: 4px 14px;
  font-size: 11px;
  color: #888;
}

// ── HDD boot failure ───────────────────────────────────────────
.hdd-error-screen {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px 60px;
  font-family: 'Courier New', Courier, monospace;
}

.hdd-error-msg {
  font-size: 14px;
  color: #cccccc;
  margin-bottom: 20px;
}

.hdd-error-fallback {
  font-size: 13px;
  color: #888888;

  @keyframes blink-fallback { 50% { opacity: 0; } }
  animation: blink-fallback 1s step-end infinite;
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
