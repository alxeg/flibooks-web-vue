<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getBook, downloadBook } from '../api'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  bookId: {
    type: [String, Number],
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'close'])

const book = ref(null)
const loading = ref(false)
const epubDownloading = ref(false)
const fb2Downloading = ref(false)
const dialog = ref(false)

watch(() => props.modelValue, (val) => {
  dialog.value = val
})

watch(dialog, (val) => {
  if (val) {
    loadBookDetails()
  } else {
    // Reset book when dialog closes
    book.value = null
    loading.value = false
  }
  emit('update:modelValue', val)
})

watch(() => props.bookId, (newId, oldId) => {
  if (dialog.value && newId !== oldId) {
    loadBookDetails()
  }
})

onMounted(() => {
  dialog.value = props.modelValue
})

const loadBookDetails = async () => {
  loading.value = true
  book.value = null
  try {
    book.value = await getBook(props.bookId)
  } catch (error) {
    console.error('Failed to load book details:', error)
  } finally {
    loading.value = false
  }
}

const formatFileSize = (size) => {
  if (!size) return ''
  const numSize = parseFloat(size)
  if (isNaN(numSize)) return size
  if (numSize > 1024 * 1024) {
    return (numSize / (1024 * 1024)).toFixed(2) + ' MB'
  }
  return (numSize / 1024).toFixed(2) + ' KB'
}

const downloadEpub = async () => {
  epubDownloading.value = true
  try {
    const response = await downloadBook(props.bookId, 'epub')
    downloadFile(response, `${book.value?.title || 'book'}.epub`)
  } catch (error) {
    console.error('Failed to download EPUB:', error)
  } finally {
    epubDownloading.value = false
  }
}

const downloadFb2 = async () => {
  fb2Downloading.value = true
  try {
    const response = await downloadBook(props.bookId, 'fb2')
    downloadFile(response, `${book.value?.title || 'book'}.fb2`)
  } catch (error) {
    console.error('Failed to download FB2:', error)
  } finally {
    fb2Downloading.value = false
  }
}

const downloadFile = (response, filename) => {
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

const authorsText = computed(() => {
  if (!book.value?.authors) return ''
  return book.value.authors.map(a => a.name).join(', ')
})

const genresText = computed(() => {
  if (!book.value?.genres) return ''
  return book.value.genres.map(g => g.genre_code).join(', ')
})

const handleClose = () => {
  dialog.value = false
  emit('close')
}
</script>

<template>
  <v-dialog
    v-model="dialog"
    max-width="600px"
    @click:outside="handleClose"
  >
    <v-card v-if="book">
      <v-card-title class="text-h5">
        {{ book.title }}
      </v-card-title>
      <v-card-subtitle class="pt-2">
        by {{ authorsText }}
      </v-card-subtitle>

      <v-card-text v-if="loading">
        <v-skeleton-loader type="text, list"></v-skeleton-loader>
      </v-card-text>

      <v-card-text v-else>
        <v-list dense>
          <v-list-item>
            <v-list-item-title>Series</v-list-item-title>
            <v-list-item-subtitle>{{ book.series || 'N/A' }}</v-list-item-subtitle>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>Language</v-list-item-title>
            <v-list-item-subtitle>{{ book.lang || 'N/A' }}</v-list-item-subtitle>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>File size</v-list-item-title>
            <v-list-item-subtitle>{{ formatFileSize(book.file_size) }}</v-list-item-subtitle>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>Library ID</v-list-item-title>
            <v-list-item-subtitle>{{ book.lib_id }}</v-list-item-subtitle>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>Genres</v-list-item-title>
            <v-list-item-subtitle>{{ genresText || 'N/A' }}</v-list-item-subtitle>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>File extension</v-list-item-title>
            <v-list-item-subtitle>{{ book.ext || 'N/A' }}</v-list-item-subtitle>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>Deleted</v-list-item-title>
            <v-list-item-subtitle>{{ book.del === '1' ? 'Yes' : 'No' }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="outlined"
          :loading="epubDownloading"
          @click="downloadEpub"
        >
          Download EPUB
        </v-btn>
        <v-btn
          color="primary"
          variant="toned"
          :loading="fb2Downloading"
          @click="downloadFb2"
        >
          Download FB2
        </v-btn>
        <v-btn
          variant="text"
          color="grey"
          @click="handleClose"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
