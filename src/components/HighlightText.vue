<script setup>
import { computed } from 'vue'

const props = defineProps({
  text: {
    type: String,
    default: '',
  },
  highlight: {
    type: String,
    default: '',
  },
})

const parts = computed(() => {
  const highlightValue = String(props.highlight || '')
  const textValue = String(props.text || '')

  if (!highlightValue || !textValue) {
    return [{ text: textValue, isHighlight: false }]
  }

  const regex = new RegExp(`(${escapeRegExp(highlightValue)})`, 'gi')
  const result = textValue.split(regex)
  const highlightLower = highlightValue.toLowerCase()
  return result.map((part) => ({
    text: part,
    isHighlight: part.toLowerCase() === highlightLower,
  }))
})

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
</script>

<template>
  <span>
    <template v-for="(part, index) in parts" :key="index">
      <span v-if="part.isHighlight" class="highlighted-text">{{ part.text }}</span>
      <span v-else>{{ part.text }}</span>
    </template>
  </span>
</template>

<style scoped>
.highlighted-text {
  color: #90caf9;
  font-weight: 500;
}
</style>
