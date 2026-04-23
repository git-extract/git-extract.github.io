<template>
  <div>
    <!-- Running -->
    <template v-if="!done">
      <q-linear-progress indeterminate color="primary" class="q-mb-sm" />
      <div class="text-center text-grey">{{ statusText }}</div>
    </template>

    <!-- Success -->
    <q-banner v-else-if="success" rounded class="bg-positive text-white q-mt-md">
      <template #avatar><q-icon name="check_circle" /></template>
      Extraction complete!
      <template v-if="targetRepoUrl">
        <a :href="targetRepoUrl" target="_blank" class="text-white q-ml-sm">View target repo →</a>
      </template>
    </q-banner>

    <!-- Failure / cancelled -->
    <q-banner v-else rounded class="bg-negative text-white q-mt-md">
      <template #avatar><q-icon name="error" /></template>
      Extraction {{ conclusion }}.
      <a :href="runUrl" target="_blank" class="text-white q-ml-sm">View logs →</a>
    </q-banner>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  runId: { type: String, required: true },
  runUrl: { type: String, required: true },
  targetRepoUrl: { type: String, default: '' },
})

const status = ref('queued')
const conclusion = ref(null)
let timer = null

const done = computed(() => status.value === 'completed')
const success = computed(() => conclusion.value === 'success')
const statusText = computed(() => {
  const map = { queued: 'Queued…', in_progress: 'Running…', waiting: 'Waiting…' }
  return map[status.value] || 'Working…'
})

async function poll() {
  try {
    const res = await fetch(
      `${process.env.WORKER_URL}/status?runId=${encodeURIComponent(props.runId)}`,
    )
    const data = await res.json()
    status.value = data.status || status.value
    conclusion.value = data.conclusion || null
    if (done.value) clearInterval(timer)
  } catch {
    // network error — keep polling
  }
}

onMounted(() => {
  poll()
  timer = setInterval(poll, 5000)
})

onUnmounted(() => clearInterval(timer))
</script>
