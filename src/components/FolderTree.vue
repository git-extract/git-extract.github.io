<template>
  <q-tree
    :nodes="nodes"
    node-key="path"
    label-key="label"
    v-model:selected="selected"
    no-selection-unset
  />
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  items: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])

const selected = ref(props.modelValue)

watch(selected, (val) => emit('update:modelValue', val))
watch(
  () => props.modelValue,
  (val) => {
    selected.value = val
  },
)

const nodes = computed(() => buildTree(props.items))

function buildTree(items) {
  const dirs = items.filter((i) => i.type === 'tree')
  const root = []
  const map = new Map()

  for (const { path } of dirs) {
    const parts = path.split('/')
    let parent = root
    let fullPath = ''

    for (const part of parts) {
      fullPath = fullPath ? `${fullPath}/${part}` : part
      if (!map.has(fullPath)) {
        const node = { label: part, path: fullPath, children: [] }
        map.set(fullPath, node)
        parent.push(node)
      }
      parent = map.get(fullPath).children
    }
  }

  // strip empty children arrays for leaf dirs
  for (const node of map.values()) {
    if (node.children.length === 0) delete node.children
  }

  return root
}
</script>
