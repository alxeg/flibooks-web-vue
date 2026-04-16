<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { searchAuthors } from '../api'
import { useSettingsStore } from '../stores/settings'
import { useSearchStore } from '../stores/search'
import { storeToRefs } from 'pinia'
import SearchBar from '../components/SearchBar.vue'
import HighlightText from '../components/HighlightText.vue'

const router = useRouter()
const settingsStore = useSettingsStore()
const searchStore = useSearchStore()
const { limitSearchResults, searchResultsLimit } = storeToRefs(settingsStore)

const searchQuery = computed({
  get: () => searchStore.authorSearchQuery,
  set: (value) => searchStore.setAuthorSearchQuery(value),
})
const searchResults = computed({
  get: () => searchStore.authorSearchResults,
  set: (value) => searchStore.setAuthorSearchResults(value),
})
const loading = computed({
  get: () => searchStore.authorLoading,
  set: (value) => searchStore.setAuthorLoading(value),
})
const error = computed({
  get: () => searchStore.authorError,
  set: (value) => searchStore.setAuthorError(value),
})

const handleSearch = async (searchParams) => {
  loading.value = true
  error.value = null
  try {
    const params = {
      author: searchParams.author,
    }
    if (limitSearchResults.value) {
      params.limit = searchResultsLimit.value
    }
    const response = await searchAuthors(params)
    searchResults.value = response
    searchStore.saveAll()
  } catch (err) {
    error.value = err.response?.data || 'Search failed'
    console.error('Search error:', err)
  } finally {
    loading.value = false
  }
}

const getAuthorId = (author) => author.ID || author.lib_id || author.id

const handleAuthorClick = (author) => {
  searchStore.saveAll()
  router.push(`/authors/${getAuthorId(author)}`)
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
    <SearchBar
      v-model:search-query="searchQuery"
      @search="handleSearch"
    />

    <v-card class="mt-4">
      <v-card-text v-if="loading">
        <v-skeleton-loader type="list-item-three-line" repeat="5"></v-skeleton-loader>
      </v-card-text>

      <v-card-text v-else-if="error">
        <v-alert type="error" variant="toned">
          {{ error }}
        </v-alert>
      </v-card-text>

      <v-card-text v-else-if="searchResults.length === 0 && searchQuery">
        <v-alert type="info" variant="toned">
          No authors found for "{{ searchQuery }}"
        </v-alert>
      </v-card-text>

      <v-card-text v-else>
        <v-list>
          <v-list-item
            v-for="author in searchResults"
            :key="getAuthorId(author)"
            @click="handleAuthorClick(author)"
            link
          >
            <v-list-item-avatar>
              <v-icon icon="mdi-account" color="primary"></v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title>
                <HighlightText :text="author.name" :highlight="searchStore.authorSearchQuery" />
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </div>
</template>
