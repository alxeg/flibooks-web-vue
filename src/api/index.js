import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Get available languages
export const getLangs = async () => {
  const response = await api.get('/book/langs')
  return response.data
}

// Search books
export const searchBooks = async (searchParams) => {
  const response = await api.post('/book/search', searchParams)
  return response.data
}

// Search series
export const searchSeries = async (searchParams) => {
  const response = await api.post('/book/series', searchParams)
  return response.data
}

// Search authors
export const searchAuthors = async (searchParams) => {
  const response = await api.post('/author/search', searchParams)
  return response.data
}

// Get author by ID
export const getAuthor = async (authorId) => {
  const response = await api.get(`/author/${authorId}`)
  return response.data
}

// List author's books via POST /api/author/books
// authorId must be passed as string field 'author' in payload
export const listAuthorBooks = async (searchParams) => {
  const response = await api.post('/author/books', searchParams)
  return response.data
}

// Get book by ID
export const getBook = async (bookId) => {
  const response = await api.get(`/book/${bookId}`)
  return response.data
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

export default api
