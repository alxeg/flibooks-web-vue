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
const toc = ref([])
const tocOpen = ref(false)

const flattenToc = (items, depth = 0) => (items || []).flatMap(item => [
  { label: item.label, href: item.href, depth },
  ...flattenToc(item.subitems, depth + 1),
])

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

  toc.value = []
  tocOpen.value = false

  try {
    const response = await downloadBook(bookId.value, 'fb2')
    const file = new File([response.data], `${bookId.value}.fb2`, {
      type: 'application/x-fictionbook+xml',
    })

    const view = foliateView.value
    await view.open(file)
    applyReaderStyles()
    toc.value = flattenToc(view.book?.toc)

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

const toggleToc = () => {
  tocOpen.value = !tocOpen.value
}

const closeToc = () => {
  tocOpen.value = false
}

const selectTocItem = (item) => {
  if (item.href != null) {
    foliateView.value?.goTo(item.href)
  }
  closeToc()
}

const handleKeydown = (event) => {
  if (tocOpen.value) {
    if (event.key === 'Escape') closeToc()
    return
  }
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

    <v-btn
      v-if="!loading && toc.length"
      icon="mdi-format-list-bulleted"
      class="toc-button"
      variant="tonal"
      title="Table of contents"
      @click="toggleToc"
    ></v-btn>

    <template v-if="tocOpen">
      <div class="toc-backdrop" @click="closeToc"></div>
      <div class="toc-popup bg-surface elevation-8">
        <div class="toc-header bg-surface">
          <span class="text-subtitle-1 font-weight-bold text-truncate text-on-surface">{{ bookData?.title }}</span>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            title="Close"
            @click="closeToc"
          ></v-btn>
        </div>
        <v-list density="compact" nav class="toc-list">
          <v-list-item
            v-for="(item, i) in toc"
            :key="i"
            :title="item.label"
            :style="{ paddingLeft: `${16 + item.depth * 16}px` }"
            link
            @click="selectTocItem(item)"
          ></v-list-item>
        </v-list>
      </div>
    </template>
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

.toc-button {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
}

.toc-backdrop {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: rgba(0, 0, 0, 0.3);
}

.toc-popup {
  position: absolute;
  top: 56px;
  right: 8px;
  bottom: 8px;
  z-index: 3;
  width: 90%;
  min-width: 280px;
  max-width: calc(100vw - 16px);
  overflow-y: auto;
  border-radius: 8px;
}

@media (orientation: landscape) {
  .toc-popup {
    width: 50%;
  }
}

.toc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  position: sticky;
  top: 0;
}
</style>
