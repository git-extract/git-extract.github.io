<template>
  <div class="wiz-page">
    <div class="wiz-page__head">
      <div class="wiz-page__head-icon">{{ headIcon }}</div>
      <div class="wiz-page__head-text">
        <div class="wiz-page__step-label">Step 6 of 7</div>
        <h1 class="wiz-page__title">{{ headTitle }}</h1>
        <p class="wiz-page__desc">{{ headDesc }}</p>
      </div>
    </div>

    <div class="wiz-page__body">

      <!-- Current action label -->
      <div class="prg-action">{{ actionLabel }}</div>

      <!-- Win98-style segmented progress bar -->
      <div class="prg-bar-wrap">
        <div class="prg-bar">
          <div
            v-for="i in TOTAL_SEGS"
            :key="i"
            class="prg-bar__seg"
            :class="{ 'prg-bar__seg--on': i <= filledSegs }"
          />
        </div>
        <div class="prg-pct">{{ pctLabel }}</div>
      </div>

      <!-- InstallShield-style status log -->
      <div class="w98-panel prg-log-panel">
        <div class="w98-panel__head">📋 Status Log</div>
        <div ref="logBodyEl" class="w98-panel__body prg-log-body">
          <div
            v-for="(line, i) in logLines"
            :key="i"
            class="prg-log-line"
          >
            <span class="prg-log-line__msg">{{ line.msg }}</span>
            <span
              v-if="line.badge"
              class="prg-log-line__badge"
              :class="`prg-log-line__badge--${line.variant}`"
            >{{ line.badge }}</span>
          </div>
          <div v-if="!logLines.length" class="prg-log-empty">Starting…</div>
        </div>
      </div>

      <!-- Error banner -->
      <div v-if="errorMsg" class="prg-error">⚠ {{ errorMsg }}</div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useReposStore } from '../stores/repos.js'
import { useAuthStore } from '../stores/auth.js'
import { useWizardNav } from '../composables/useWizardNav.js'

// ── Constants ──────────────────────────────────────────────────
const TOTAL_SEGS = 28   // number of blocks in the progress bar

// ── Stores / composables ───────────────────────────────────────
const store  = useReposStore()
const auth   = useAuthStore()
const router = useRouter()
const nav    = useWizardNav()

// ── State ──────────────────────────────────────────────────────
const progress  = ref(0)         // 0–100
const logLines  = ref([])
const errorMsg  = ref('')
const phase     = ref('idle')    // idle | submitting | running | done | error
const logBodyEl = ref(null)

let pollTimer = null
let rampTimer = null

// ── Computed ───────────────────────────────────────────────────
const filledSegs = computed(() => Math.round((progress.value / 100) * TOTAL_SEGS))
const pctLabel   = computed(() => `${Math.round(progress.value)}%`)

const headIcon = computed(() => {
  if (phase.value === 'done')  return '✔'
  if (phase.value === 'error') return '✖'
  return '⟳'
})
const headTitle = computed(() => {
  if (phase.value === 'done')  return 'Extraction Complete'
  if (phase.value === 'error') return 'Extraction Failed'
  return 'Extracting Files…'
})
const headDesc = computed(() => {
  if (phase.value === 'done')  return 'All files were copied to the target repository.'
  if (phase.value === 'error') return 'An error occurred. See the status log for details.'
  return 'Please wait while git-extract copies your files. Do not close this window.'
})
const actionLabel = computed(() => {
  if (phase.value === 'submitting') return 'Submitting extraction job…'
  if (phase.value === 'running')    return 'Copying files…'
  if (phase.value === 'done')       return 'Setup complete.'
  if (phase.value === 'error')      return 'Setup did not complete.'
  return 'Initialising…'
})

// ── Helpers ────────────────────────────────────────────────────
function log(msg, badge = '', variant = 'info') {
  logLines.value.push({ msg, badge, variant })
  nextTick(() => {
    if (logBodyEl.value) logBodyEl.value.scrollTop = logBodyEl.value.scrollHeight
  })
}

function setNav(done = false, hasError = false) {
  nav.value = {
    backLabel: '< Back', backDisabled: !done && !hasError,
    onBack: (done || hasError) ? () => router.push('/extract/options') : null,
    nextLabel: 'Next >', nextDisabled: !done || hasError,
    onNext: (done && !hasError) ? () => router.push('/extract/finish') : null,
    finishLabel: 'Finish', finishDisabled: true, onFinish: null,
  }
}

/** Smoothly ramp `progress` toward `target` over `ms` milliseconds. */
function rampTo(target, ms) {
  clearInterval(rampTimer)
  const origin = progress.value
  const t0     = Date.now()
  rampTimer = setInterval(() => {
    const frac = Math.min((Date.now() - t0) / ms, 1)
    progress.value = origin + (target - origin) * frac
    if (frac >= 1) clearInterval(rampTimer)
  }, 50)
}

// ── Main extraction flow ───────────────────────────────────────
async function run() {
  phase.value = 'submitting'
  setNav()

  log('Connecting to extraction server…')
  rampTo(8, 800)

  const base   = auth.provider === 'github'
    ? 'https://github.com'
    : `https://${auth.gitlabHost}`
  const source = store.selectedSource
  const target = store.selectedTarget

  let data
  try {
    const res = await fetch(`${process.env.WORKER_URL}/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceRepoUrl:       `${base}/${source.fullName}`,
        sourceToken:          auth.token,
        sourcePath:           store.sourcePath,
        targetRepoUrl:       `${base}/${target.fullName}`,
        targetToken:          auth.token,
        targetBranch:         store.targetBranch,
        targetPath:           store.targetPath,
        generateProjectFile:  store.generateProjectFile,
      }),
    })
    data = await res.json()
  } catch {
    fail('Network error — could not reach the extraction server.')
    return
  }

  if (data.error) {
    fail(data.error)
    return
  }

  store.extractRunId  = data.runId  || ''
  store.extractRunUrl = data.runUrl || ''
  log('Job submitted successfully', 'OK', 'ok')
  rampTo(18, 600)

  phase.value = 'running'
  log('Workflow queued, waiting for runner…')
  rampTo(22, 1200)

  // Start polling
  pollTimer = setInterval(poll, 4000)
  await poll()
}

async function poll() {
  if (!store.extractRunId) return
  try {
    const res  = await fetch(
      `${process.env.WORKER_URL}/status?runId=${encodeURIComponent(store.extractRunId)}`,
    )
    const data = await res.json()
    const st   = data.status     || 'queued'
    const con  = data.conclusion || null

    // Sprinkle fake progress messages as the job advances
    if (st === 'in_progress') {
      if (logLines.value.length === 3) {
        log('Fetching source tree…')
        rampTo(45, 5000)
      } else if (logLines.value.length === 4) {
        log('Reading and staging files…')
        rampTo(72, 6000)
      } else if (logLines.value.length === 5) {
        log('Writing to target repository…')
        rampTo(88, 5000)
      }
    }

    if (st === 'completed') {
      clearInterval(pollTimer)
      if (con === 'success') {
        log('Files written successfully', 'OK', 'ok')
        if (store.generateProjectFile) log('Project file written (.git-extract.json)', 'OK', 'ok')
        log('Workflow completed', 'OK', 'ok')
        rampTo(100, 500)
        setTimeout(() => {
          phase.value         = 'done'
          store.extractStatus = 'done'
          store.extractResult = data
          setNav(true, false)
        }, 600)
      } else {
        log(`Workflow ended: ${con || 'failed'}`, 'ERR', 'err')
        fail(`Extraction ${con || 'failed'}. Check your run logs for details.`)
      }
    }
  } catch {
    // Network blip — keep polling silently
  }
}

function fail(msg) {
  clearInterval(pollTimer)
  clearInterval(rampTimer)
  errorMsg.value      = msg
  phase.value         = 'error'
  store.extractStatus = 'error'
  log(msg, 'ERR', 'err')
  setNav(false, true)
}

// ── Lifecycle ──────────────────────────────────────────────────
onMounted(() => { setNav(); run() })
onUnmounted(() => { clearInterval(pollTimer); clearInterval(rampTimer) })
</script>

<style lang="scss" scoped>
// ── Current-action label ───────────────────────────────────────
.prg-action {
  font-size: 12px;
  color: #000;
  margin-bottom: 10px;
  min-height: 1.4em;
}

// ── Win98 segmented progress bar ──────────────────────────────
.prg-bar-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.prg-bar {
  flex: 1;
  height: 18px;
  padding: 2px;
  display: flex;
  gap: 2px;
  // Classic Win98 inset border
  box-shadow:
    inset  1px  1px #0a0a0a,
    inset -1px -1px #ffffff,
    inset  2px  2px #808080,
    inset -2px -2px #e8e8e8;
  background: #fff;

  &__seg {
    flex: 1;
    height: 100%;
    background: #c8c8c8;

    &--on {
      background: $secondary;  // forest green — same as Win98 setup progress
    }
  }
}

.prg-pct {
  width: 34px;
  flex-shrink: 0;
  text-align: right;
  font-size: 11px;
  color: #444;
}

// ── Status log panel ───────────────────────────────────────────
.prg-log-panel  { margin-bottom: 10px; }

.prg-log-body {
  min-height: 90px;
  max-height: 160px;
  overflow-y: auto;
  font-family: 'Courier New', Courier, monospace;
  font-size: 11px;
  line-height: 1.7;
  padding: 6px 8px;
}

.prg-log-empty { color: #808080; }

.prg-log-line {
  display: flex;
  justify-content: space-between;
  gap: 12px;

  &__msg   { color: #222; flex: 1; }
  &__badge {
    flex-shrink: 0;
    font-weight: 700;

    &--ok   { color: $secondary; }
    &--err  { color: $negative; }
    &--info { color: #808080; }
  }
}

// ── Error banner ───────────────────────────────────────────────
.prg-error {
  font-size: 11px;
  padding: 6px 10px;
  border: 2px solid $negative;
  background: #ffeeee;
  color: $negative;
}
</style>
