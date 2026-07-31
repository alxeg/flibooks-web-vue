import { createRouter, createWebHistory } from 'vue-router'
import SearchAuthorView from '../views/SearchAuthorView.vue'
import SearchBookView from '../views/SearchBookView.vue'
import SearchSeriesView from '../views/SearchSeriesView.vue'
import SettingsView from '../views/SettingsView.vue'
import AuthorBooksView from '../views/AuthorBooksView.vue'
import ReadBookView from '../views/ReadBookView.vue'
import RecentsView from '../views/RecentsView.vue'
import BookDetailsDialog from '../components/BookDetailsDialog.vue'

const routes = [
  {
    path: '/',
    redirect: '/search/author',
  },
  {
    path: '/search/author',
    name: 'SearchAuthor',
    component: SearchAuthorView,
  },
  {
    path: '/search/book',
    name: 'SearchBook',
    component: SearchBookView,
  },
  {
    path: '/search/series',
    name: 'SearchSeries',
    component: SearchSeriesView,
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsView,
  },
  {
    path: '/authors/:id',
    name: 'AuthorBooks',
    component: AuthorBooksView,
    props: true,
  },
  {
    path: '/read',
    name: 'ReadBook',
    component: ReadBookView,
    props: (route) => ({
      bookId: route.query.bookId,
    }),
  },
  {
    path: '/recents',
    name: 'Recents',
    component: RecentsView,
  },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
