<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getBook, downloadBook } from '../api'
import { useSettingsStore } from '../stores/settings'
import { storeToRefs } from 'pinia'
import 'foliate-js/view.js'

const BACKGROUND_PRESETS = {
  white: { background: '#ffffff', color: '#000000' },
  sepia: { background: '#f4ecd8', color: '#5b4636' },
  dark: { background: '#202020', color: '#d4d4d4' },
}

const buildReaderCSS = ({ fontFamily, fontSize, background }) => {
  const preset = BACKGROUND_PRESETS[background]
  return `
    @namespace epub "http://www.idpf.org/2007/ops";
    html {
      font-size: ${fontSize}% !important;
    }
    ${preset ? `
    html, body {
      background: ${preset.background} !important;
      color: ${preset.color} !important;
    }
    ` : ''}
    ${typeof fontFamily === 'string' && fontFamily !== 'default' ? `
    body, p, li, blockquote, dd, div, span, h1, h2, h3, h4, h5, h6 {
      font-family: "${fontFamily}", sans-serif !important;
    }
    ` : ''}
  `
}

const route = useRoute()
const router = useRouter()
const settingsStore = useSettingsStore()
const { readerFontFamily, readerFontSize, readerBackground } = storeToRefs(settingsStore)

const bookId = ref(route.query.bookId)
const bookData = ref(null)
const foliateView = ref(null)
const loading = ref(true)
const canGoBack = ref(false)

const readViewStyle = computed(() => {
  const preset = BACKGROUND_PRESETS[readerBackground.value]
  return preset ? { background: preset.background } : {}
})

const applyReaderStyles = () => {
  foliateView.value?.renderer?.setStyles?.(buildReaderCSS({
    fontFamily: readerFontFamily.value,
    fontSize: readerFontSize.value,
    background: readerBackground.value,
  }))
}

const loadBookData = async () => {
  try {
    bookData.value = await getBook(bookId.value)
    await loadBookWithFoliate()
    addToRecents()
  } catch (error) {
    console.error('Failed to load book data:', error)
  } finally {
    loading.value = false
  }
}

const addToRecents = () => {
  try {
    const recents = JSON.parse(localStorage.getItem('flibooks-recents') || '[]')
    const existingIndex = recents.findIndex(item => item.id === bookId.value)
    
    const bookDataFull = {
      id: bookId.value,
      title: bookData.value.title,
      authors: bookData.value.authors,
      series: bookData.value.series,
      ser_no: bookData.value.ser_no,
      lastRead: Date.now(),
      progress: null,
    }
    
    if (existingIndex !== -1) {
      recents[existingIndex] = bookDataFull
    } else {
      recents.push(bookDataFull)
    }
    
    localStorage.setItem('flibooks-recents', JSON.stringify(recents))
  } catch (error) {
    console.error('Failed to add to recents:', error)
  }
}

const loadBookWithFoliate = async () => {
  if (!foliateView.value) return

  try {
    const response = await downloadBook(bookId.value, 'fb2')
    const file = new File([response.data], `${bookId.value}.fb2`, {
      type: 'application/x-fictionbook+xml',
    })

    const view = foliateView.value
    await view.open(file)
    applyReaderStyles()

    const savedProgress = getSavedProgress()
    await view.init({ lastLocation: savedProgress?.cfi, showTextStart: true })

    view.addEventListener('relocate', handleRelocate)
    view.addEventListener('load', handleLoad)
    view.history.addEventListener('index-change', handleHistoryChange)
    handleHistoryChange()
  } catch (error) {
    console.error('Failed to load book with Foliate:', error)
  }
}

const handleHistoryChange = () => {
  canGoBack.value = !!foliateView.value?.history?.canGoBack
}

const goBack = () => {
  foliateView.value?.history?.back()
}

const goPrev = () => {
  foliateView.value?.goLeft()
}

const goNext = () => {
  foliateView.value?.goRight()
}

const handleKeydown = (event) => {
  if (event.key === 'ArrowLeft') goPrev()
  else if (event.key === 'ArrowRight') goNext()
}

const handleLoad = ({ detail: { doc } }) => {
  doc.addEventListener('keydown', handleKeydown)
}

const getSavedProgress = () => {
  try {
    const saved = localStorage.getItem(`flibooks-progress-${bookId.value}`)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('Failed to load saved progress:', error)
  }
  return null
}

const handleRelocate = (event) => {
  saveProgress(event.detail.cfi)
}

const saveProgress = (cfi) => {
  if (!cfi) return

  try {
    const progressData = {
      cfi: cfi,
      savedAt: Date.now(),
    }
    localStorage.setItem(`flibooks-progress-${bookId.value}`, JSON.stringify(progressData))
    
    updateRecentsProgress(progressData)
  } catch (error) {
    console.error('Failed to save progress:', error)
  }
}

const updateRecentsProgress = (progressData) => {
  try {
    const recents = JSON.parse(localStorage.getItem('flibooks-recents') || '[]')
    const index = recents.findIndex(book => book.id === bookId.value)
    if (index !== -1) {
      recents[index].lastRead = Date.now()
      recents[index].progress = progressData
      localStorage.setItem('flibooks-recents', JSON.stringify(recents))
    }
  } catch (error) {
    console.error('Failed to update recents:', error)
  }
}

const handleBeforeUnload = () => {
  if (foliateView.value) {
    foliateView.value.removeEventListener('relocate', handleRelocate)
    foliateView.value.removeEventListener('load', handleLoad)
    foliateView.value.history.removeEventListener('index-change', handleHistoryChange)
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown)

  await loadBookData()

  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  handleBeforeUnload()
})

watch(() => route.query.bookId, async (newId) => {
  if (newId) {
    bookId.value = newId
    await loadBookData()
  }
})

watch([readerFontFamily, readerFontSize, readerBackground], applyReaderStyles)
</script>

<template>
  <div class="read-view" :style="readViewStyle">
    <v-progress-circular
      v-if="loading"
      indeterminate
      class="pa-4 loading-overlay"
    ></v-progress-circular>

    <foliate-view
      ref="foliateView"
      class="foliate-view"
    ></foliate-view>

    <v-btn
      v-if="!loading && canGoBack"
      icon="mdi-arrow-left-top"
      class="back-button"
      variant="tonal"
      title="Back to where you left off"
      @click="goBack"
    ></v-btn>

    <v-btn
      v-if="!loading"
      icon="mdi-chevron-left"
      class="nav-button nav-button-left"
      variant="tonal"
      @click="goPrev"
    ></v-btn>
    <v-btn
      v-if="!loading"
      icon="mdi-chevron-right"
      class="nav-button nav-button-right"
      variant="tonal"
      @click="goNext"
    ></v-btn>
  </div>
</template>

<style>
.read-view {
  flex: 1 1 auto;
  min-height: 0;
  margin-top: 8px;
  position: relative;
}

.foliate-view {
  width: 100%;
  height: 100%;
  display: block;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: block;
  margin: 0 auto;
  margin-top: 20vh;
}

.nav-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.nav-button-left {
  left: 8px;
}

.nav-button-right {
  right: 8px;
}

.back-button {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 1;
}
</style>
