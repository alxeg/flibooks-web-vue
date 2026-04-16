<script setup>
import { computed, ref, onMounted } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { storeToRefs } from 'pinia'

const props = defineProps({
  searchQuery: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:searchQuery', 'search'])

const settingsStore = useSettingsStore()
const { searchDeletedBooks, limitSearchResults, searchResultsLimit, selectedLanguages } = storeToRefs(settingsStore)

const localQuery = computed({
  get: () => props.searchQuery,
  set: (value) => emit('update:searchQuery', value),
})

const handleSearch = () => {
  const searchParams = {
    title: localQuery.value,
    author: localQuery.value,
    series: localQuery.value,
    deleted: searchDeletedBooks.value,
    langs: selectedLanguages.value.length > 0 ? selectedLanguages.value : undefined,
  }
  if (limitSearchResults.value) {
    searchParams.limit = searchResultsLimit.value
  }
  emit('search', searchParams)
}
</script>

<template>
  <v-card class="pa-4">
    <v-row align="center" class="ma-n1 px-1">
      <v-col cols="12" md="8" class="d-flex align-center px-1">
        <v-text-field
          v-model="localQuery"
          variant="solo-filled"
          placeholder="Enter search query..."
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
</template>
