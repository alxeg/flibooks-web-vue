<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getAuthor, getAuthorBooksBySearch } from '../api'
import { useSearchStore } from '../stores/search'
import { useSettingsStore } from '../stores/settings'
import { storeToRefs } from 'pinia'
import BookDetailsDialog from '../components/BookDetailsDialog.vue'
import HighlightText from '../components/HighlightText.vue'

const props = defineProps({
  id: {
    type: [String, Number],
    required: true,
  },
})

const router = useRouter()
const searchStore = useSearchStore()
const settingsStore = useSettingsStore()
const { searchDeletedBooks, limitSearchResults, searchResultsLimit, selectedLanguages } = storeToRefs(settingsStore)

const authorId = computed(() => Number(props.id))

const author = ref(null)
const allBooks = ref([])
const filteredBooks = computed({
  get: () => {
    if (!searchQuery.value) return allBooks.value
    const query = searchQuery.value.toLowerCase()
    return allBooks.value.filter(book =>
      book.title && book.title.toLowerCase().includes(query)
    )
  },
  set: (val) => { allBooks.value = val }
})
const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')
const showDialog = ref(false)
const selectedBookId = ref(null)
const selectedBookIds = ref([])

const allSelected = computed({
  get: () => filteredBooks.value.length > 0 && selectedBookIds.value.length === filteredBooks.value.length,
  set: (selectAll) => {
    if (selectAll) {
      selectedBookIds.value = [...new Set([...selectedBookIds.value, ...filteredBooks.value.map(getBookId)])]
    } else {
      selectedBookIds.value = []
    }
  },
})

const getBookId = (book) => book.ID || book.lib_id || book.id

const toggleAllBooks = () => {
  allSelected.value = !allSelected.value
}

const loadAuthor = async () => {
  try {
    author.value = await getAuthor(authorId.value)
  } catch (err) {
    console.error('Failed to load author:', err)
  }
}

const loadBooks = async () => {
  loading.value = true
  try {
    const payload = {
      deleted: searchDeletedBooks.value,
      langs: selectedLanguages.value.length > 0 ? selectedLanguages.value : undefined,
    }
    if (limitSearchResults.value) {
      payload.limit = searchResultsLimit.value
    }
    allBooks.value = await getAuthorBooksBySearch(authorId.value, payload, { 'no-details': true })
  } catch (err) {
    error.value = err.response?.data || 'Failed to load books'
    console.error('Load books error:', err)
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

const handleDownloadFb2 = (bookId) => {
  const link = document.createElement('a')
  link.href = `/api/book/${bookId}/download?format=fb2`
  link.download = `book-${bookId}.fb2`
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

onMounted(() => {
  searchStore.restore()
  loadAuthor()
  loadBooks()
})

onUnmounted(() => {
  searchStore.saveAll()
})

// Watch for settings changes and reload books
watch([searchDeletedBooks, limitSearchResults, searchResultsLimit, selectedLanguages], () => {
  loadBooks()
})
</script>

<template>
  <div>
    <v-card class="mb-4">
      <v-card-title class="text-h5 d-flex align-center">
        <v-icon icon="mdi-account" class="mr-2" color="primary"></v-icon>
        <span v-if="author">{{ author.name }}</span>
        <v-skeleton-loader v-else-if="loading" type="text" class="ml-2" width="200"></v-skeleton-loader>
      </v-card-title>
      <v-card-subtitle v-if="author" class="pt-2">
        Books
      </v-card-subtitle>
    </v-card>

    <v-card class="mb-4">
      <v-card-text>
        <v-text-field
          v-model="searchQuery"
          variant="solo-filled"
          placeholder="Filter by title..."
          clearable
          density="compact"
        ></v-text-field>
      </v-card-text>
    </v-card>

    <v-card>
      <v-card-text v-if="loading">
        <v-skeleton-loader type="list-item-three-line" repeat="5"></v-skeleton-loader>
      </v-card-text>

      <v-card-text v-else-if="error">
        <v-alert type="error" variant="toned">
          {{ error }}
        </v-alert>
      </v-card-text>

      <v-card-text v-else-if="filteredBooks.length === 0">
        <v-alert type="info" variant="toned">
          <span v-if="searchQuery">No books found for "{{ searchQuery }}"</span>
          <span v-else>No books found for this author</span>
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
          <template v-for="book in filteredBooks" :key="getBookId(book)">
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
                    <v-list-item-subtitle v-if="book.series" class="text-caption">
                      <HighlightText :text="book.series" :highlight="searchStore.bookSearchTitle" /> {{ book.ser_no ? '[ '+book.ser_no+' ]' : ''}}
                    </v-list-item-subtitle>
                    <!-- <v-list-item-subtitle v-else class="text-caption">
                      {{ book.lang ? '' + book.lang : '' }}
                    </v-list-item-subtitle> -->
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
