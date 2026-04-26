<template>
  <!-- Desktop layer — fills the viewport, catches drag events globally -->
  <div class="w98-desktop" @mousemove="onMouseMove" @mouseup="onMouseUp" @mouseleave="onMouseUp">

    <!-- ── Taskbar (visible only when minimized) ─────────────────── -->
    <div v-if="minimized" class="w98-taskbar">
      <button class="w98-taskbar-btn" @click="restore">
        <span class="w98-taskbar-btn__icon">⎇</span>
        <span>{{ title }}</span>
      </button>
    </div>

    <!-- ── Window ────────────────────────────────────────────────── -->
    <div
      v-show="!minimized"
      class="w98-window"
      :class="{ 'w98-window--maximized': maximized, 'w98-window--dragging': dragging }"
      :style="windowStyle"
      ref="windowEl"
    >
      <!-- Title bar -->
      <div
        class="w98-titlebar"
        @mousedown="onTitlebarMouseDown"
        @dblclick="toggleMaximize"
      >
        <span class="w98-titlebar__icon">⎇</span>
        <span class="w98-titlebar__text">{{ title }}</span>

        <div class="w98-titlebar__controls" @mousedown.stop>
          <button class="w98-chrome-btn w98-chrome-btn--minimize" title="Minimize" disabled></button>
          <button class="w98-chrome-btn w98-chrome-btn--maximize" title="Maximize" :disabled="!maximizable"></button>
          <button class="w98-chrome-btn w98-chrome-btn--close" title="Close" @click.stop="openCloseDialog">✕</button>
        </div>
      </div>

      <!-- Slot: body + footer provided by WizardLayout -->
      <slot />
    </div>

    <!-- ── Boot sequence overlay (BSOD → BIOS → CD → Win98) ────────── -->
    <div v-if="bootPhase" class="boot-overlay" :class="`boot-phase--${bootPhase}`">

      <!-- BSOD -->
      <pre v-if="bootPhase === 'bsod'" class="bsod-text">{{ bsodText }}</pre>

      <!-- BIOS POST screen -->
      <div v-else-if="bootPhase === 'bios'" class="bios-screen">
        <div
          v-for="(item, i) in BIOS_CONTENT"
          :key="i"
          class="boot-line bios-line"
          :class="{ 'bios-line--header': i < 2 }"
          :style="{ '--d': item.delay + 'ms' }"
        >{{ item.text }}</div>
      </div>

      <!-- CD boot -->
      <div v-else-if="bootPhase === 'cdboot'" class="cdboot-screen">
        <div
          v-for="(item, i) in CDBOOT_CONTENT"
          :key="i"
          class="boot-line cdboot-line"
          :style="{ '--d': item.delay + 'ms' }"
        >{{ item.text }}</div>
      </div>

      <!-- Starting Windows 98 -->
      <div v-else-if="bootPhase === 'win98'" class="win98start-screen">
        <div
          v-for="(item, i) in WIN98_CONTENT"
          :key="i"
          class="boot-line win98-line"
          :style="{ '--d': item.delay + 'ms' }"
        >{{ item.text }}</div>
      </div>

      <!-- 'black' phase: just the black background, no content -->
    </div>

    <!-- ── Close-confirm dialog ───────────────────────────────────── -->
    <div v-if="showCloseConfirm" class="w98-overlay" @click.self="showCloseConfirm = false">
      <div class="w98-dialog">
        <div class="w98-dialog__titlebar">
          <span class="w98-dialog__titlebar-icon">⎇</span>
          git-extract Setup
        </div>
        <div class="w98-dialog__body">
          <div class="w98-dialog__icon">⚠️</div>
          <div class="w98-dialog__msg">
            <p>Are you sure you want to exit Setup?</p>
            <p style="color:#666">Your progress will be lost.</p>
          </div>
        </div>
        <div class="w98-dialog__sep" />
        <div class="w98-dialog__footer">
          <button class="w98-btn" @click="confirmClose">Yes</button>
          <button class="w98-btn" @click="showCloseConfirm = false">No</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  title:       { type: String,  default: 'Window' },
  width:       { type: Number,  default: 860 },
  height:      { type: Number,  default: 560 },
  maximizable: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

// ── State ───────────────────────────────────────────────────────
const pos              = ref({ x: 0, y: 0 })
const dragging         = ref(false)
const dragOffset       = ref({ x: 0, y: 0 })
const maximized        = ref(false)
const minimized        = ref(false)
const showCloseConfirm = ref(false)
const bootPhase        = ref(null)   // null|'bsod'|'black'|'bios'|'cdboot'|'win98'
const bsodCountdown    = ref(3)
const vw               = ref(window.innerWidth)
const vh               = ref(window.innerHeight)

// Effective dimensions — shrink to fit the viewport if needed
const winW = computed(() => Math.min(props.width,  vw.value))
const winH = computed(() => Math.min(props.height, vh.value))

// ── Helpers ─────────────────────────────────────────────────────
function clampPos(x, y) {
  return {
    x: Math.max(0, Math.min(x, vw.value - winW.value)),
    y: Math.max(0, Math.min(y, vh.value - winH.value)),
  }
}

// ── Lifecycle ───────────────────────────────────────────────────
onMounted(() => {
  // Centre window on load
  pos.value = clampPos(
    Math.round((vw.value - winW.value) / 2),
    Math.round((vh.value - winH.value) / 2),
  )
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup',   onMouseUp)
  window.addEventListener('resize', onViewportResize)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup',   onMouseUp)
  window.removeEventListener('resize', onViewportResize)
})

// ── Computed style ──────────────────────────────────────────────
const windowStyle = computed(() => {
  if (maximized.value) return {}          // CSS class handles full-screen
  return {
    position: 'absolute',
    left:   pos.value.x + 'px',
    top:    pos.value.y + 'px',
    width:  winW.value  + 'px',
    height: winH.value  + 'px',
  }
})

// ── Drag ────────────────────────────────────────────────────────
function onTitlebarMouseDown(e) {
  if (maximized.value || e.button !== 0) return
  dragging.value = true
  dragOffset.value = { x: e.clientX - pos.value.x, y: e.clientY - pos.value.y }
  e.preventDefault()
}

function onMouseMove(e) {
  if (!dragging.value) return
  pos.value = clampPos(
    e.clientX - dragOffset.value.x,
    e.clientY - dragOffset.value.y,
  )
}

// ── Viewport resize ─────────────────────────────────────────────
function onViewportResize() {
  vw.value = window.innerWidth
  vh.value = window.innerHeight
  // Re-clamp so the window never sits outside the new viewport
  pos.value = clampPos(pos.value.x, pos.value.y)
}

function onMouseUp() {
  dragging.value = false
}

// ── Window controls ─────────────────────────────────────────────
function restore() {
  minimized.value = false
}

function toggleMaximize() {
  if (!props.maximizable) return
  maximized.value = !maximized.value
}

function openCloseDialog() {
  showCloseConfirm.value = true
}

// ── Boot sequence content ───────────────────────────────────────
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

// ── Boot sequence logic ─────────────────────────────────────────
function go(phase, ms) { setTimeout(() => { bootPhase.value = phase }, ms) }

function confirmClose() {
  showCloseConfirm.value = false
  bsodCountdown.value    = 3
  bootPhase.value        = 'bsod'

  const ticker = setInterval(() => {
    bsodCountdown.value--
    if (bsodCountdown.value <= 0) clearInterval(ticker)
  }, 1000)

  go('black',  3000)   // brief black after BSOD
  go('bios',   3500)   // BIOS POST screen
  go('black',  7900)   // brief black
  go('cdboot', 8300)   // CD boot prompt
  go('black',  9900)   // brief black
  go('win98',  10300)  // Starting Windows 98...
  go('black',  12000)  // final black — screen off

  setTimeout(() => {
    bootPhase.value = null
    emit('close')
  }, 12500)
}

const bsodText = computed(() => `\
Windows

A fatal exception 0E has occurred at 0028:C061B3F7 in VxD git-
extract(09) + 0000B3F7. The current application will be
terminated.

*  Press any key to terminate the current application.

*  Press CTRL+ALT+DEL to restart your computer. You will
   lose any unsaved information in all applications.


Restarting git-extract setup in ${bsodCountdown.value}...\
`)
</script>

<style lang="scss">
* { font-family: 'Tahoma', 'MS Sans Serif', Arial, sans-serif; }

// ── Desktop ────────────────────────────────────────────────────
.w98-desktop {
  position: fixed;
  inset: 0;
  background: $primary;      // #011826 dark navy
  overflow: hidden;
  user-select: none;         // prevent text-select while dragging

  // subtle scanline texture so it reads as a "surface"
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(255,255,255,0.018) 2px,
    rgba(255,255,255,0.018) 4px
  );
}

// ── Window ─────────────────────────────────────────────────────
.w98-window {
  display: flex;
  flex-direction: column;
  background: #F2F2F2;

  // Classic Win98 raised outer border — white top/left, grey bottom/right
  // This is the KEY fix: visible contrast against the dark desktop
  border: 2px solid;
  border-color: #e8e8e8 #606060 #606060 #e8e8e8;
  outline: 1px solid #000;

  // Drop shadow for depth
  box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.7);

  &--maximized {
    position: fixed !important;
    inset: 0 !important;
    width:  100vw !important;
    height: 100vh !important;
    border: none;
    outline: none;
    box-shadow: none;
  }

  &--dragging { cursor: grabbing; }
}

// ── Title bar ──────────────────────────────────────────────────
// Gradient from a clear blue — NOT the same as the desktop navy
// so the top edge of the window is always distinguishable.
.w98-titlebar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 4px 3px 6px;
  background: linear-gradient(to right, #0d4a88 0%, #1a78cc 100%);
  flex-shrink: 0;
  cursor: default;

  &__icon { font-size: 13px; color: $accent; flex-shrink: 0; }

  &__text {
    flex: 1;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__controls { display: flex; gap: 2px; }
}

// ── Chrome buttons ─────────────────────────────────────────────
.w98-chrome-btn {
  width: 16px;
  height: 14px;
  background: #F2F2F2;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #000;
  border: none;
  padding: 0;
  position: relative;   // anchor for ::before pseudo-element shapes
  flex-shrink: 0;
  box-shadow:
    inset -1px -1px #0a0a0a,
    inset  1px  1px #ffffff,
    inset -2px -2px #808080,
    inset  2px  2px #e8e8e8;

  &:active:not(:disabled) {
    box-shadow:
      inset -1px -1px #ffffff,
      inset  1px  1px #0a0a0a,
      inset -2px -2px #e8e8e8,
      inset  2px  2px #808080;
    // shift icon 1px to give "pressed" feel
    &::before { transform: translate(-50%, -50%) translate(1px, 1px); }
  }

  &:disabled {
    opacity: 1;       // cancel browser opacity dimming
    cursor: default;
    // icon shape turns grey + gets a white emboss shadow via filter
    &::before {
      background: #808080;
      border-color: #808080;
      filter: drop-shadow(1px 1px 0 #fff);
    }
    &:active { box-shadow: inset -1px -1px #0a0a0a, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #e8e8e8; }
    &:active::before { transform: translate(-50%, -50%); } // no press shift when disabled
  }

  // ── Minimize icon: horizontal bar near bottom ─────────────────
  &--minimize::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%) translate(0, 2px); // nudge toward bottom
    width: 8px;
    height: 2px;
    background: currentColor;
  }

  // ── Maximize icon: rectangle with thick top (Win98 style) ─────
  &--maximize::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 7px;
    background: transparent;
    border: 1px solid currentColor;
    border-top-width: 2px;  // thick top = title bar of a window
  }

  // ── Close button ──────────────────────────────────────────────
  &--close {
    margin-left: 2px;
    font-size: 9px;
    font-weight: 700;
    line-height: 1;

    &:hover:not(:disabled) { background: #e04040; color: #fff; }
  }
}

// ── Taskbar ────────────────────────────────────────────────────
.w98-taskbar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 28px;
  background: #F2F2F2;
  border-top: 2px solid;
  border-color: #e8e8e8 #606060 #606060 #e8e8e8;
  outline-top: 1px solid #000;
  display: flex;
  align-items: center;
  padding: 2px 4px;
  gap: 4px;
}

.w98-taskbar-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 8px;
  font-size: 11px;
  background: #F2F2F2;
  border: none;
  cursor: pointer;
  box-shadow:
    inset -1px -1px #0a0a0a,
    inset  1px  1px #ffffff,
    inset -2px -2px #808080,
    inset  2px  2px #e8e8e8;

  &:active {
    box-shadow:
      inset -1px -1px #ffffff,
      inset  1px  1px #0a0a0a,
      inset -2px -2px #e8e8e8,
      inset  2px  2px #808080;
    padding: 1px 7px 0 9px;
  }

  &__icon { color: $secondary; }
}

// ── Close-confirm overlay ──────────────────────────────────────
.w98-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.w98-dialog {
  background: #F2F2F2;
  border: 2px solid;
  border-color: #e8e8e8 #606060 #606060 #e8e8e8;
  outline: 1px solid #000;
  min-width: 300px;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5);

  &__titlebar {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 3px 6px;
    background: linear-gradient(to right, #0d4a88 0%, #1a78cc 100%);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
  }

  &__titlebar-icon { color: $accent; }

  &__body {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 20px 20px 14px;
    user-select: text;
  }

  &__icon { font-size: 28px; flex-shrink: 0; }

  &__msg {
    p { margin: 0 0 4px; font-size: 12px; }
  }

  &__sep {
    height: 0;
    margin: 0 4px 8px;
    border-top: 1px solid #808080;
    border-bottom: 1px solid #fff;
  }

  &__footer {
    display: flex;
    justify-content: center;
    gap: 8px;
    padding: 0 20px 14px;
  }
}

// ── Win98 regular buttons (used in dialog + footer) ────────────
.w98-btn {
  min-width: 75px;
  height: 23px;
  padding: 0 10px;
  background: #F2F2F2;
  color: #000;
  font-family: 'Tahoma', 'MS Sans Serif', Arial, sans-serif;
  font-size: 11px;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  box-shadow:
    inset -1px -1px #0a0a0a,
    inset  1px  1px #ffffff,
    inset -2px -2px #808080,
    inset  2px  2px #e8e8e8;

  &:active:not(:disabled) {
    box-shadow:
      inset -1px -1px #ffffff,
      inset  1px  1px #0a0a0a,
      inset -2px -2px #e8e8e8,
      inset  2px  2px #808080;
    padding: 1px 9px 0 11px;
  }

  &:disabled {
    opacity: 1;
    color: #808080;
    text-shadow: 1px 1px 0 #fff;
    cursor: default;
  }

  // Win98 "default" button — same grey but with a black focus border
  // to indicate it's the recommended action (no green)
  &--default {
    outline: 2px solid #000;
    outline-offset: -4px;
    font-weight: 700;

    &:disabled {
      opacity: 1;
      outline-color: #808080;
      color: #808080;
      text-shadow: 1px 1px 0 #fff;
      cursor: default;
    }
  }
}

.w98-link-btn {
  background: none;
  border: none;
  color: $accent;
  font-size: 11px;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  font-family: inherit;
}

.w98-btn-sep {
  width: 1px;
  height: 20px;
  background: #808080;
  margin: 0 4px;
  box-shadow: 1px 0 #fff;
}

// ── Boot overlay ───────────────────────────────────────────────
// Base: always covers the full screen in black
.boot-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #000;
  overflow: hidden;

  // BSOD phase snaps to blue
  &.boot-phase--bsod { background: #0000AA; }
}

// Whole overlay flickers in like a CRT turning on
@keyframes boot-flicker {
  0%   { opacity: 0; }
  6%   { opacity: 1; }
  10%  { opacity: 0; }
  14%  { opacity: 1; }
  100% { opacity: 1; }
}
.boot-overlay { animation: boot-flicker 0.25s steps(1) forwards; }

// ── BSOD text ──────────────────────────────────────────────────
.bsod-text {
  display: block;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  line-height: 1.65;
  color: #fff;
  white-space: pre;
  margin: 48px 10% 0;
  padding: 0;
}

// ── Shared line-reveal animation ───────────────────────────────
// Each line starts invisible and pops in at its own --d delay.
@keyframes line-appear {
  to { opacity: 1; }
}

.boot-line {
  opacity: 0;
  animation: line-appear 1ms var(--d, 0ms) step-end forwards;
  white-space: pre;        // preserve indent
  min-height: 1em;         // blank lines still take up space
  font-family: 'Courier New', Courier, monospace;
}

// ── BIOS POST screen ───────────────────────────────────────────
.bios-screen {
  padding: 18px 36px;
  font-size: 13px;
  line-height: 1.65;
  color: #aaaaaa;          // default grey like a real BIOS
}

.bios-line {
  &--header { color: #ffffff; } // copyright lines brighter
}

// ── CD boot screen ─────────────────────────────────────────────
.cdboot-screen {
  padding: 18px 36px;
  font-size: 14px;
  line-height: 1.8;
  color: #ffffff;
}

// blinking cursor on last CD boot line
.cdboot-line:last-child::after {
  content: '_';
  animation: blink-cur 1s step-end infinite;
  animation-delay: 1.3s;
  opacity: 0;
}
@keyframes blink-cur { 50% { opacity: 1; } }

// ── Windows 98 start screen ────────────────────────────────────
.win98start-screen {
  padding: 18px 36px;
  font-size: 14px;
  line-height: 2;
  color: #ffffff;
}
</style>
