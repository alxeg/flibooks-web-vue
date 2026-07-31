<script setup>
import { ref, computed, onMounted } from 'vue'
import { getBook } from '../api'

const recents = ref([])
const loading = ref(false)

const loadRecents = async () => {
  loading.value = true
  try {
    const saved = localStorage.getItem('flibooks-recents')
    if (saved) {
      const recentsList = JSON.parse(saved)
      const books = []
      for (const item of recentsList) {
        try {
          const book = await getBook(item.id)
          books.push({
            ...book,
            lastRead: item.lastRead,
            progress: item.progress,
          })
        } catch (error) {
          console.error(`Failed to load book ${item.id}:`, error)
        }
      }
      recents.value = books.sort((a, b) => b.lastRead - a.lastRead)
    }
  } catch (error) {
    console.error('Failed to load recents:', error)
  } finally {
    loading.value = false
  }
}

const openBook = (book) => {
  window.open(`/read?bookId=${book.id}`, '_blank')
}

const removeBook = (bookId, event) => {
  event.stopPropagation()
  try {
    const saved = localStorage.getItem('flibooks-recents')
    if (saved) {
      const recentsList = JSON.parse(saved)
      const filtered = recentsList.filter(item => item.id !== bookId)
      localStorage.setItem('flibooks-recents', JSON.stringify(filtered))
      loadRecents()
    }
  } catch (error) {
    console.error('Failed to remove book from recents:', error)
  }
}

const formatProgress = (progress) => {
  if (!progress?.position) return ''
  return `Page ${progress.position}`
}

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString()
}

onMounted(() => {
  loadRecents()
})
</script>

<template>
  <div>
    <v-card class="pa-4">
      <v-card-title class="text-h5">
        Recents
      </v-card-title>
      <v-card-text v-if="loading">
        <v-skeleton-loader type="list-item-three-line" repeat="5"></v-skeleton-loader>
      </v-card-text>

      <v-card-text v-else-if="recents.length === 0">
        <v-alert type="info" variant="toned">
          No recent books. Click "Read" on a book to add it to your history.
        </v-alert>
      </v-card-text>

      <v-card-text v-else>
        <v-list dense>
          <template v-for="book in recents" :key="book.id">
            <v-list-item
              @click="openBook(book)"
              link
              class="pa-0"
            >
              <v-row align="center" no-gutters class="w-100">
                <v-col cols="9" class="px-2">
                  <div class="d-flex flex-column">
                    <v-list-item-title class="mb-1">
                      {{ book.title }}
                    </v-list-item-title>
                    <div class="d-flex align-center flex-wrap">
                      <v-list-item-subtitle class="text-caption flex-grow-1">
                        {{ book.authors?.join(', ') || 'Unknown author' }}
                      </v-list-item-subtitle>
                      <v-list-item-subtitle v-if="book.series" class="text-caption flex-shrink-0 ml-3">
                        {{ book.series }} {{ book.ser_no ? '[ '+book.ser_no+' ]' : ''}}
                      </v-list-item-subtitle>
                    </div>
                    <v-list-item-subtitle class="text-caption mt-1">
                      <span v-if="formatProgress(book.progress)" class="me-2">
                        {{ formatProgress(book.progress) }}
                      </span>
                      <span class="text-grey-darken-1">
                        Last read: {{ formatDate(book.lastRead) }}
                      </span>
                    </v-list-item-subtitle>
                  </div>
                </v-col>
                <v-col cols="3" class="d-flex justify-end px-2">
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    size="small"
                    @click.stop="removeBook(book.id, $event)"
                  ></v-btn>
                </v-col>
              </v-row>
            </v-list-item>
            <v-divider v-if="!$last"></v-divider>
          </template>
        </v-list>
      </v-card-text>
    </v-card>
  </div>
</template>
