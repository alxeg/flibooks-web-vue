import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSearchStore = defineStore('search', () => {
  // Author search state
  const authorSearchQuery = ref('')
  const authorSearchResults = ref([])
  const authorLoading = ref(false)
  const authorError = ref(null)

  // Book search state
  const bookSearchTitle = ref('')
  const bookSearchAuthor = ref('')
  const bookSearchResults = ref([])
  const bookLoading = ref(false)
  const bookError = ref(null)

  // Series search state
  const seriesSearchTitle = ref('')
  const seriesSearchName = ref('')
  const seriesSearchResults = ref([])
  const seriesLoading = ref(false)
  const seriesError = ref(null)

  // Actions - Author search
  const setAuthorSearchQuery = (query) => {
    authorSearchQuery.value = query
  }
  const setAuthorSearchResults = (results) => {
    authorSearchResults.value = results
  }
  const setAuthorLoading = (loading) => {
    authorLoading.value = loading
  }
  const setAuthorError = (error) => {
    authorError.value = error
  }
  const clearAuthorSearch = () => {
    authorSearchQuery.value = ''
    authorSearchResults.value = []
    authorLoading.value = false
    authorError.value = null
  }

  // Actions - Book search
  const setBookSearchTitle = (title) => {
    bookSearchTitle.value = title
  }
  const setBookSearchAuthor = (author) => {
    bookSearchAuthor.value = author
  }
  const setBookSearchResults = (results) => {
    bookSearchResults.value = results
  }
  const setBookLoading = (loading) => {
    bookLoading.value = loading
  }
  const setBookError = (error) => {
    bookError.value = error
  }
  const clearBookSearch = () => {
    bookSearchTitle.value = ''
    bookSearchAuthor.value = ''
    bookSearchResults.value = []
    bookLoading.value = false
    bookError.value = null
  }

  // Actions - Series search
  const setSeriesSearchTitle = (title) => {
    seriesSearchTitle.value = title
  }
  const setSeriesSearchName = (name) => {
    seriesSearchName.value = name
  }
  const setSeriesSearchResults = (results) => {
    seriesSearchResults.value = results
  }
  const setSeriesLoading = (loading) => {
    seriesLoading.value = loading
  }
  const setSeriesError = (error) => {
    seriesError.value = error
  }
  const clearSeriesSearch = () => {
    seriesSearchTitle.value = ''
    seriesSearchName.value = ''
    seriesSearchResults.value = []
    seriesLoading.value = false
    seriesError.value = null
  }

  // Persist and restore
  const saveAll = () => {
    localStorage.setItem('flibooks-search-author', JSON.stringify({
      query: authorSearchQuery.value,
      results: authorSearchResults.value,
    }))
    localStorage.setItem('flibooks-search-book', JSON.stringify({
      title: bookSearchTitle.value,
      author: bookSearchAuthor.value,
      results: bookSearchResults.value,
    }))
    localStorage.setItem('flibooks-search-series', JSON.stringify({
      title: seriesSearchTitle.value,
      name: seriesSearchName.value,
      results: seriesSearchResults.value,
    }))
  }

  const restore = () => {
    const savedAuthor = localStorage.getItem('flibooks-search-author')
    if (savedAuthor) {
      const parsed = JSON.parse(savedAuthor)
      authorSearchQuery.value = parsed.query || ''
      authorSearchResults.value = parsed.results || []
      // Don't restore loading state - we want fresh data when returning
    }

    const savedBook = localStorage.getItem('flibooks-search-book')
    if (savedBook) {
      const parsed = JSON.parse(savedBook)
      bookSearchTitle.value = parsed.title || ''
      bookSearchAuthor.value = parsed.author || ''
      bookSearchResults.value = parsed.results || []
      // Don't restore loading state
    }

    const savedSeries = localStorage.getItem('flibooks-search-series')
    if (savedSeries) {
      const parsed = JSON.parse(savedSeries)
      seriesSearchTitle.value = parsed.title || ''
      seriesSearchName.value = parsed.name || ''
      seriesSearchResults.value = parsed.results || []
      // Don't restore loading state
    }
  }

  return {
    // Author search state
    authorSearchQuery,
    authorSearchResults,
    authorLoading,
    authorError,
    setAuthorSearchQuery,
    setAuthorSearchResults,
    setAuthorLoading,
    setAuthorError,
    clearAuthorSearch,

    // Book search state
    bookSearchTitle,
    bookSearchAuthor,
    bookSearchResults,
    bookLoading,
    bookError,
    setBookSearchTitle,
    setBookSearchAuthor,
    setBookSearchResults,
    setBookLoading,
    setBookError,
    clearBookSearch,

    // Series search state
    seriesSearchTitle,
    seriesSearchName,
    seriesSearchResults,
    seriesLoading,
    seriesError,
    setSeriesSearchTitle,
    setSeriesSearchName,
    setSeriesSearchResults,
    setSeriesLoading,
    setSeriesError,
    clearSeriesSearch,

    saveAll,
    restore,
  }
})
