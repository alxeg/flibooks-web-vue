import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createRouter, createWebHistory } from 'vue-router'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'

import App from './App.vue'
import router from './router'

import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

// Register highlight.js language
hljs.registerLanguage('javascript', javascript)

const app = createApp(App)

// Create Pinia store
const pinia = createPinia()
app.use(pinia)

// Configure Vuetify (theme is handled by theme store)
const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
})

app.use(router)
app.use(vuetify)
app.use(hljs)

// Initialize stores
import { useThemeStore } from './stores/theme'
import { useSettingsStore } from './stores/settings'
const themeStore = useThemeStore()
themeStore.initialize()
const settingsStore = useSettingsStore()
settingsStore.initialize()

app.mount('#app')
