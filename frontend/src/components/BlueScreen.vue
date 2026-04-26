<template>
  <pre class="bsod-text">{{ text }}</pre>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  countdown: { type: Number, default: 3 },
})

const text = computed(() => `\
Windows

A fatal exception 0E has occurred at 0028:C061B3F7 in VxD git-
extract(09) + 0000B3F7. The current application will be
terminated.

*  Press any key to terminate the current application.

*  Press CTRL+ALT+DEL to restart your computer. You will
   lose any unsaved information in all applications.


Restarting git-extract setup in ${props.countdown}...\
`)
</script>

<style scoped>
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
</style>
