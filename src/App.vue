<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useThemeStore } from './stores/theme'

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()

const theme = computed({
  get: () => themeStore.resolvedTheme,
  set: (value) => themeStore.setTheme(value),
})

const activeTab = computed({
  get: () => {
    if (route.path === '/search/author') return 0
    if (route.path === '/search/book') return 1
    if (route.path === '/search/series') return 2
    if (route.path === '/settings') return 'settings'
    return 0
  },
  set: (value) => {
    if (value === 'settings') {
      router.push('/settings')
    } else {
      const paths = ['/search/author', '/search/book', '/search/series']
      router.push(paths[value])
    }
  },
})

const tabs = [
  { title: 'By Author', value: 0 },
  { title: 'By Title & Author', value: 1 },
  { title: 'By Series', value: 2 },
  { title: 'Settings', value: 'settings' },
]
</script>

<template>
  <v-app :theme="theme">
    <v-app-bar color="primary" dense>
      <v-toolbar-title class="text-h6">Flibooks</v-toolbar-title>
    </v-app-bar>

    <v-main>
      <v-container class="py-8">
        <v-row>
          <v-col cols="12">
            <div class="d-flex align-center">
              <v-tabs
                v-model="activeTab"
                background-color="secondary"
                color="primary"
                slider-color="primary"
              >
                <v-tab
                  v-for="tab in tabs.filter(t => t.value !== 'settings')"
                  :key="tab.title"
                  :value="tab.value"
                >
                  {{ tab.title }}
                </v-tab>
              </v-tabs>

              <v-spacer></v-spacer>

              <v-tabs
                v-model="activeTab"
                background-color="secondary"
                color="primary"
                slider-color="primary"
              >
                <v-tab
                  value="settings"
                >
                  {{ tabs.find(t => t.value === 'settings').title }}
                </v-tab>
              </v-tabs>
            </div>
          </v-col>
          <v-col cols="12">
            <router-view />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<style>
body {
  margin: 0;
  padding: 0;
}
</style>
