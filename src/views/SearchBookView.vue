<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { searchBooks } from '../api'
import { useSettingsStore } from '../stores/settings'
import { useSearchStore } from '../stores/search'
import { storeToRefs } from 'pinia'
import BookDetailsDialog from '../components/BookDetailsDialog.vue'
import HighlightText from '../components/HighlightText.vue'

const router = useRouter()
const settingsStore = useSettingsStore()
const searchStore = useSearchStore()
const { searchDeletedBooks, selectedLanguages } = storeToRefs(settingsStore)

const searchTitle = computed({
  get: () => searchStore.bookSearchTitle,
  set: (value) => searchStore.setBookSearchTitle(value),
})
const searchAuthor = computed({
  get: () => searchStore.bookSearchAuthor,
  set: (value) => searchStore.setBookSearchAuthor(value),
})
const searchResults = computed({
  get: () => searchStore.bookSearchResults,
  set: (value) => searchStore.setBookSearchResults(value),
})
const loading = computed({
  get: () => searchStore.bookLoading,
  set: (value) => searchStore.setBookLoading(value),
})
const error = computed({
  get: () => searchStore.bookError,
  set: (value) => searchStore.setBookError(value),
})
const showDialog = ref(false)
const selectedBookId = ref(null)

const selectedBookIds = ref([])

const getBookId = (book) => book.ID || book.lib_id || book.id

const handleSearch = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await searchBooks({
      title: searchTitle.value,
      author: searchAuthor.value,
      deleted: searchDeletedBooks.value,
      langs: selectedLanguages.value.length > 0 ? selectedLanguages.value : undefined,
      limit: 50,
    })
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

const handleDownload = async (url, fallbackName) => {
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = fallbackName
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Failed to download:', error)
  }
}

const handleDownloadEpub = (bookId) => {
  handleDownload(`/api/book/${bookId}/download?format=epub`, `book-${bookId}.epub`)
}

const handleDownloadFb2 = (bookId) => {
  handleDownload(`/api/book/${bookId}/download?format=fb2`, `book-${bookId}.fb2`)
}

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

  handleDownload(`/api/book/archive?${params.toString()}`, 'books_archive.zip')
}

const handleCloseDialog = () => {
  showDialog.value = false
  selectedBookId.value = null
}

onMounted(() => {
  searchStore.restore()
})

onUnmounted(() => {
  searchStore.saveAll()
})
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
            v-model="searchAuthor"
            variant="solo-filled"
            placeholder="Author name..."
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

      <v-card-text v-else-if="searchResults.length === 0 && (searchTitle || searchAuthor)">
        <v-alert type="info" variant="toned">
          No books found matching your criteria
        </v-alert>
      </v-card-text>

      <v-card-text v-else>
       <v-list>
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
                      <HighlightText :text="book.title" :highlight="searchStore.bookSearchTitle" />
                    </v-list-item-title>
                    <v-list-item-subtitle class="text-caption">
                      <HighlightText :text="book.authors?.map(a => a.name).join(', ') || 'Unknown author'" :highlight="searchStore.bookSearchAuthor" />
                    </v-list-item-subtitle>
                    <v-list-item-subtitle v-if="book.series" class="text-caption">
                      <HighlightText :text="book.series" :highlight="searchStore.bookSearchTitle" /> {{ book.ser_no ? '[ '+book.ser_no+' ]' : ''}}
                    </v-list-item-subtitle>
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

        <div class="text-center py-4">
          <v-btn
            color="primary"
            :disabled="selectedBookIds.length === 0"
            @click="downloadSelected"
          >
            Download {{ selectedBookIds.length }} books
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <BookDetailsDialog
      v-model="showDialog"
      :book-id="selectedBookId"
      @close="handleCloseDialog"
    />
  </div>
</template>
