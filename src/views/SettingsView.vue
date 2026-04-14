<script setup>
import { ref, watch, onMounted } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { useThemeStore } from '../stores/theme'
import { storeToRefs } from 'pinia'

const settingsStore = useSettingsStore()
const themeStore = useThemeStore()
const { searchDeletedBooks, selectedLanguages } = storeToRefs(settingsStore)

const tempDeletedBooks = ref(false)
const tempLanguages = ref([])
const tempTheme = ref('system')

onMounted(() => {
  tempDeletedBooks.value = searchDeletedBooks.value
  tempLanguages.value = [...selectedLanguages.value]
  tempTheme.value = themeStore.theme
})

watch(tempDeletedBooks, (val) => {
  settingsStore.updateSearchDeletedBooks(val)
  settingsStore.saveToStorage()
})

watch(tempLanguages, (langs) => {
  settingsStore.updateSelectedLanguages(langs)
  settingsStore.saveToStorage()
}, { deep: true })

watch(tempTheme, (val) => {
  themeStore.setTheme(val)
})
</script>

<template>
  <v-card class="pa-4">
    <v-card-title class="text-h5 mb-4">
      <v-icon icon="mdi-settings" class="mr-2"></v-icon>
      Settings
    </v-card-title>

    <!-- Theme Selection -->
    <v-card class="mb-4">
      <v-card-title class="text-subtitle-1 mb-2">
        Theme
      </v-card-title>
      <v-card-text>
        <v-select
          v-model="tempTheme"
          :items="[
            { title: 'Light', value: 'light' },
            { title: 'Dark', value: 'dark' },
            { title: 'System', value: 'system' },
          ]"
          label="Select theme"
          variant="outlined"
          density="compact"
        ></v-select>
      </v-card-text>
    </v-card>

    <!-- Search Deleted Books Option -->
    <v-card class="mb-4">
      <v-card-text>
        <v-switch
          v-model="tempDeletedBooks"
          label="Include deleted books in search results"
          color="primary"
          inset
        ></v-switch>
      </v-card-text>
    </v-card>

    <!-- Language Selection -->
    <v-card>
      <v-card-title class="text-subtitle-1 mb-2">
        Available Languages for Search
      </v-card-title>
      <v-card-text v-if="settingsStore.isLoadingLanguages">
        <v-skeleton-loader type="list-item-two-line"></v-skeleton-loader>
      </v-card-text>
      <v-card-text v-else>
        <v-chip-group
          v-model="tempLanguages"
          multiple
          column
        >
          <v-chip
            v-for="lang in settingsStore.availableLanguages"
            :key="lang"
            :value="lang"
            filter
            closable
            color="primary"
            variant="outlined"
          >
            {{ lang }}
          </v-chip>
        </v-chip-group>
        <v-alert
          v-if="settingsStore.availableLanguages.length === 0"
          type="warning"
          variant="toned"
          class="mt-4"
        >
          No languages available. Please check your flibooks server.
        </v-alert>
      </v-card-text>
    </v-card>
  </v-card>
</template>
