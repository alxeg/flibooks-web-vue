import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref('system')

  // Derived state
  const resolvedTheme = computed(() => {
    if (theme.value === 'system') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
      }
      return 'light'
    }
    return theme.value
  })

  // Actions
  const setTheme = (value) => {
    theme.value = value
    localStorage.setItem('flibooks-theme', value)

    // Update the HTML class for Vuetify
    const html = document.documentElement
    if (value === 'system') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        html.classList.add('dark-theme')
        html.classList.remove('light-theme')
      } else {
        html.classList.add('light-theme')
        html.classList.remove('dark-theme')
      }
    } else if (value === 'dark') {
      html.classList.add('dark-theme')
      html.classList.remove('light-theme')
    } else {
      html.classList.add('light-theme')
      html.classList.remove('dark-theme')
    }
  }

  const initialize = () => {
    const saved = localStorage.getItem('flibooks-theme')
    if (saved) {
      theme.value = saved
      setTheme(saved)
    }
  }

  return {
    theme,
    resolvedTheme,
    setTheme,
    initialize,
  }
})
