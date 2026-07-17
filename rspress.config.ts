import { defineConfig } from '@rspress/core'
import i18n from './docs/i18n.json'

export default defineConfig({
  root: 'docs',
  base: '/kerros/',
  siteOrigin: 'https://violetflux.github.io',
  lang: 'en',
  i18nSource: i18n,
  locales: [
    {
      lang: 'en',
      label: 'English',
      title: 'Kerros',
      description: 'Tiny selector-first React stores',
    },
    {
      lang: 'zh',
      label: '简体中文',
      title: 'Kerros',
      description: '小巧、selector 优先的 React Store',
    },
    {
      lang: 'ja',
      label: '日本語',
      title: 'Kerros',
      description: '小さな selector-first React Store',
    },
    {
      lang: 'ko',
      label: '한국어',
      title: 'Kerros',
      description: '작고 selector 중심적인 React Store',
    },
    {
      lang: 'de',
      label: 'Deutsch',
      title: 'Kerros',
      description: 'Kleine selector-first React Stores',
    },
    {
      lang: 'fr',
      label: 'Français',
      title: 'Kerros',
      description: 'Des stores React légers centrés sur les sélecteurs',
    },
    {
      lang: 'es',
      label: 'Español',
      title: 'Kerros',
      description: 'Stores de React pequeños centrados en selectores',
    },
  ],
})
