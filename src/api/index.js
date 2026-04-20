import axios from 'axios'
import {
  normalizeAuthor,
  normalizeAuthors,
  normalizeBook,
  normalizeBooks
} from './adapters'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Determine API version from environment (default to v1)
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1'

// Get available languages
export const getLangs = async () => {
  const response = await api.get('/book/langs')
  return response.data
}

// Search books
export const searchBooks = async (searchParams) => {
  const response = await api.post('/book/search', searchParams)
  return normalizeBooks(response.data)
}

// Search series
export const searchSeries = async (searchParams) => {
  const response = await api.post('/book/series', searchParams)
  // V2 returns wrapped format, normalize to unified format
  return normalizeBooks(response.data)
}

// Search authors
export const searchAuthors = async (searchParams) => {
  const response = await api.post('/author/search', searchParams)
  // V2 returns array of author names (strings), v1 returns author objects
  return normalizeAuthors(response.data)
}

// Get author by ID (v1 only - v2 doesn't have this endpoint)
export const getAuthor = async (authorId) => {
  const response = await api.get(`/author/${authorId}`)
  return normalizeAuthor(response.data)
}

// List author's books via POST /api/author/books
// For v1: author is passed as numeric ID in 'author' field
// For v2: author is passed as author name in 'author' field
export const listAuthorBooks = async (searchParams) => {
  const response = await api.post('/author/books', searchParams)
  return normalizeBooks(response.data)
}

// Get book by ID
export const getBook = async (bookId) => {
  const response = await api.get(`/book/${bookId}`)
  return normalizeBook(response.data)
}

// Download book
export const downloadBook = async (bookId, format = 'fb2') => {
  const response = await api.get(`/book/${bookId}/download`, {
    params: { format },
    responseType: 'blob',
  })
  return response
}

// Download books archive
export const downloadBooksArchive = async (bookIds) => {
  const response = await api.get('/book/archive', {
    params: { id: bookIds },
    responseType: 'blob',
  })
  return response
}

// Export API version for use in views
export { API_VERSION }

export default api
