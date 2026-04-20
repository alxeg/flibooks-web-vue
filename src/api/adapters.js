/**
 * API Response Adapters
 *
 * Normalizes responses from both v1 and v2 APIs to a unified format.
 * V2 API uses different field names and structure (e.g., author names as strings,
 * wrapped book objects with {id, book} format).
 */

// Determine API version from environment (default to v1)
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1'

// Normalize a single book to unified format
export function normalizeBook(book) {
  if (!book) return null

  let result = API_VERSION === 'v1' ? {
    ...book,

    id: book.ID,
    authors: book.authors.map(author => author.name),
    genres: book.genres ? book.genres.map(genre => genre.genre_code) : [],
    container: book.container.file_name,
  } : {
    ... book.book,

    id: book.id,
  }
  return result
}

// Normalize array of books
export function normalizeBooks(books) {
  if (!books) return []
  if (!Array.isArray(books)) return []
  return books.map(normalizeBook).filter(Boolean)
}

// Normalize author - handles both v1 objects and v2 strings
export function normalizeAuthor(author) {
  if (!author) return null
  let result = API_VERSION === 'v1' ?
    author : { ID: null, name: author }

  return result
}

// Normalize array of authors (handles mixed v1/v2)
export function normalizeAuthors(authors) {
  if (!authors) return []
  if (!Array.isArray(authors)) return []
  return authors.map(normalizeAuthor)
}
