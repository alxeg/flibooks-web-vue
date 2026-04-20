<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { searchSeries } from '../api'
import { useSettingsStore } from '../stores/settings'
import { useSearchStore } from '../stores/search'
import { storeToRefs } from 'pinia'
import BookDetailsDialog from '../components/BookDetailsDialog.vue'
import HighlightText from '../components/HighlightText.vue'

const router = useRouter()
const settingsStore = useSettingsStore()
const searchStore = useSearchStore()
const { searchDeletedBooks, limitSearchResults, searchResultsLimit, selectedLanguages } = storeToRefs(settingsStore)

const searchTitle = computed({
  get: () => searchStore.seriesSearchTitle,
  set: (value) => searchStore.setSeriesSearchTitle(value),
})
const searchSeriesName = computed({
  get: () => searchStore.seriesSearchName,
  set: (value) => searchStore.setSeriesSearchName(value),
})
const searchResults = computed({
  get: () => searchStore.seriesSearchResults,
  set: (value) => searchStore.setSeriesSearchResults(value),
})
const loading = computed({
  get: () => searchStore.seriesLoading,
  set: (value) => searchStore.setSeriesLoading(value),
})
const error = computed({
  get: () => searchStore.seriesError,
  set: (value) => searchStore.setSeriesError(value),
})
const showDialog = ref(false)
const selectedBookId = ref(null)
const selectedBookIds = ref([])

const getBookId = (book) => book.id

const allSelected = computed({
  get: () => searchResults.value.length > 0 && selectedBookIds.value.length === searchResults.value.length,
  set: (selectAll) => {
    if (selectAll) {
      selectedBookIds.value = [...new Set([...selectedBookIds.value, ...searchResults.value.map(getBookId)])]
    } else {
      selectedBookIds.value = []
    }
  },
})

const toggleBookSelection = (bookId) => {
  const index = selectedBookIds.value.indexOf(bookId)
  if (index > -1) {
    selectedBookIds.value.splice(index, 1)
  } else {
    selectedBookIds.value.push(bookId)
  }
}

const downloadSelected = () => {
  if (selectedBookIds.value.length === 0) return

  const params = new URLSearchParams()
  selectedBookIds.value.forEach(id => {
    params.append('id', id)
  })

  const link = document.createElement('a')
  link.href = `/api/book/archive?${params.toString()}`
  link.download = 'books_archive.zip'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const toggleAllBooks = () => {
  allSelected.value = !allSelected.value
}

const handleDownloadFb2 = (bookId) => {
  const link = document.createElement('a')
  link.href = `/api/book/${bookId}/download?format=fb2`
  link.download = `book-${bookId}.fb2`
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const handleSearch = async () => {
  loading.value = true
  error.value = null
  try {
    const params = {
      series: searchSeriesName.value,
      title: searchTitle.value,
      deleted: searchDeletedBooks.value,
      langs: selectedLanguages.value.length > 0 ? selectedLanguages.value : undefined,
    }
    if (limitSearchResults.value) {
      params.limit = searchResultsLimit.value
    }
    const response = await searchSeries(params)
    searchResults.value = response
    searchStore.saveAll()
  } catch (err) {
    error.value = err.response?.data || 'Search failed'
    console.error('Search error:', err)
  } finally {
    loading.value = false
  }
}

const handleBookClick = (book) => {
  selectedBookId.value = getBookId(book)
  showDialog.value = true
}

const handleCloseDialog = () => {
  showDialog.value = false
  selectedBookId.value = null
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
</script>

<template>
  <div>
    <v-card class="pa-4">
      <v-row align="center" class="px-1">
        <v-col cols="12" md="4" class="d-flex align-center px-1">
          <v-text-field
            v-model="searchTitle"
            variant="solo-filled"
            placeholder="Book title..."
            @keyup.enter="handleSearch"
            clearable
            density="compact"
            hide-details
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="4" class="d-flex align-center">
          <v-text-field
            v-model="searchSeriesName"
            variant="solo-filled"
            placeholder="Series name..."
            @keyup.enter="handleSearch"
            clearable
            density="compact"
            hide-details
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="4" class="d-flex align-center justify-center">
          <v-btn
            color="primary"
            @click="handleSearch"
          >
            Search
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-card class="mt-4">
      <v-card-text v-if="loading">
        <v-skeleton-loader type="list-item-three-line" repeat="5"></v-skeleton-loader>
      </v-card-text>

      <v-card-text v-else-if="error">
        <v-alert type="error" variant="toned">
          {{ error }}
        </v-alert>
      </v-card-text>

      <v-card-text v-else-if="searchResults.length === 0 && (searchTitle || searchSeries)">
        <v-alert type="info" variant="toned">
          No series found matching your criteria
        </v-alert>
      </v-card-text>

      <v-card-text v-else>
        <v-list>
          <!-- Select All Header -->
          <v-list-item class="pa-0">
            <v-row align="center" no-gutters class="w-100">
              <v-col cols="1" class="d-flex justify-start px-2">
                <v-checkbox-btn
                  :model-value="allSelected"
                  @update:model-value="toggleAllBooks"
                  indeterminate
                ></v-checkbox-btn>
              </v-col>
              <v-col cols="11" class="pl-2">
                <v-list-item-title>Select All</v-list-item-title>
              </v-col>
            </v-row>
          </v-list-item>
          <v-divider></v-divider>

          <!-- Individual Items -->
          <template v-for="book in searchResults" :key="getBookId(book)">
            <v-list-item
              @click="handleBookClick(book)"
              link
              class="pa-0"
            >
              <v-row align="center" no-gutters class="w-100">
                <v-col cols="1" class="d-flex justify-start px-2">
                  <v-checkbox-btn
                    :model-value="selectedBookIds.includes(getBookId(book))"
                    @update:model-value="toggleBookSelection(getBookId(book))"
                    @click.stop
                  ></v-checkbox-btn>
                </v-col>
                <v-col cols="9" class="px-2">
                  <div class="d-flex flex-column">
                    <v-list-item-title class="mb-1">
                      <HighlightText :text="book.title" :highlight="searchStore.seriesSearchTitle" />
                    </v-list-item-title>
                    <div class="d-flex align-center flex-wrap justify-space-between">
                      <v-list-item-subtitle v-if="book.authors?.length" class="text-caption flex-grow-1">
                        {{ book.authors.join(', ') }}
                      </v-list-item-subtitle>
                      <v-list-item-subtitle v-if="book.series" class="text-caption flex-shrink-0 ml-3">
                        <HighlightText :text="book.series" :highlight="searchStore.seriesSearchName" /> {{ book.ser_no ? '[ '+book.ser_no+' ]' : ''}}
                      </v-list-item-subtitle>
                    </div>
                  </div>
                </v-col>
                <v-col cols="2" class="d-flex justify-end px-2">
                  <v-btn
                    icon="mdi-download"
                    variant="text"
                    size="small"
                    @click.stop="handleDownloadFb2(getBookId(book))"
                  ></v-btn>
                </v-col>
              </v-row>
            </v-list-item>
            <v-divider v-if="!$last"></v-divider>
          </template>
        </v-list>
      </v-card-text>
    </v-card>

    <v-card class="mt-4">
      <v-card-text class="text-center py-4">
        <v-btn
          color="primary"
          :disabled="selectedBookIds.length === 0"
          @click="downloadSelected"
        >
          Download {{ selectedBookIds.length }} books
        </v-btn>
      </v-card-text>
    </v-card>

    <BookDetailsDialog
      v-model="showDialog"
      :book-id="selectedBookId"
      @close="handleCloseDialog"
    />
  </div>
</template>
