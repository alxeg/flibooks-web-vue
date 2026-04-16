import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getLangs } from '../api'

export const useSettingsStore = defineStore('settings', () => {
  // State
  const availableLanguages = ref([])
  const searchDeletedBooks = ref(false)
  const limitSearchResults = ref(false)
  const searchResultsLimit = ref(50)
  const selectedLanguages = ref([])
  const isLoadingLanguages = ref(false)

  // Derived state
  const languagesOptions = computed(() => {
    return availableLanguages.value.map(lang => ({
      title: lang,
      value: lang,
    }))
  })

  // Actions
  const loadLanguages = async () => {
    isLoadingLanguages.value = true
    try {
      const langs = await getLangs()
      availableLanguages.value = langs || []
      // Default to all languages selected
      if (availableLanguages.value.length > 0 && selectedLanguages.value.length === 0) {
        selectedLanguages.value = [...availableLanguages.value]
      }
    } catch (error) {
      console.error('Failed to load languages:', error)
      availableLanguages.value = []
    } finally {
      isLoadingLanguages.value = false
    }
  }

  const updateSearchDeletedBooks = (value) => {
    searchDeletedBooks.value = value
  }

  const updateLimitSearchResults = (value) => {
    limitSearchResults.value = value
  }

  const updateSearchResultsLimit = (value) => {
    searchResultsLimit.value = value
  }

  const updateSelectedLanguages = (langs) => {
    selectedLanguages.value = langs
  }

  const toggleLanguage = (lang) => {
    if (selectedLanguages.value.includes(lang)) {
      selectedLanguages.value = selectedLanguages.value.filter(l => l !== lang)
    } else {
      selectedLanguages.value.push(lang)
    }
  }

  const setSelectedLanguages = (langs) => {
    selectedLanguages.value = langs
  }

  // Persist state to localStorage
  const loadFromStorage = () => {
    const saved = localStorage.getItem('flibooks-settings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        searchDeletedBooks.value = parsed.searchDeletedBooks ?? false
        limitSearchResults.value = parsed.limitSearchResults ?? false
        searchResultsLimit.value = parsed.searchResultsLimit ?? 50
        selectedLanguages.value = parsed.selectedLanguages ?? []
      } catch (e) {
        console.error('Failed to parse saved settings:', e)
      }
    }
  }

  const saveToStorage = () => {
    localStorage.setItem('flibooks-settings', JSON.stringify({
      searchDeletedBooks: searchDeletedBooks.value,
      limitSearchResults: limitSearchResults.value,
      searchResultsLimit: searchResultsLimit.value,
      selectedLanguages: selectedLanguages.value,
    }))
  }

  const initialize = async () => {
    loadFromStorage()
    await loadLanguages()
  }

  return {
    // State
    availableLanguages,
    searchDeletedBooks,
    limitSearchResults,
    searchResultsLimit,
    selectedLanguages,
    isLoadingLanguages,

    // Derived
    languagesOptions,

    // Actions
    loadLanguages,
    updateSearchDeletedBooks,
    updateLimitSearchResults,
    updateSearchResultsLimit,
    updateSelectedLanguages,
    toggleLanguage,
    setSelectedLanguages,
    saveToStorage,
    initialize,
  }
})
