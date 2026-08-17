import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss'
import { defineConfig } from '@rspress/core'
import i18n from './docs/i18n.json'

const rootDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: 'docs',
  base: '/kerros/',
  siteOrigin: 'https://violetflux.github.io',
  title: 'Kerros',
  description: 'Hook-native state sharing for React',
  icon: '/favicon.png',
  logo: '/logo.png',
  logoText: 'Kerros',
  lang: 'en',
  llms: true,
  // Tailwind CSS v4 入口（仅 theme/ 首页使用工具类；跳过 preflight，见 tailwind.css 注释）。
  // Rspress 会把路径原样写进 .rspress/runtime 下的虚拟模块，因此用绝对路径保证可解析。
  globalStyles: join(rootDir, 'tailwind.css'),
  builderConfig: {
    plugins: [pluginTailwindcss()],
  },
  i18nSource: i18n,
  locales: [
    {
      lang: 'en',
      label: 'English',
      title: 'Kerros',
      description: 'Hook-native state sharing for React',
    },
    {
      lang: 'zh',
      label: '简体中文',
      title: 'Kerros',
      description: '基于 React Hook 的轻量状态共享方案',
    },
    {
      lang: 'ja',
      label: '日本語',
      title: 'Kerros',
      description: 'React Hook を自動追跡 Store に変換する軽量な状態共有方案',
    },
    {
      lang: 'ko',
      label: '한국어',
      title: 'Kerros',
      description: '어떤 React Hook이든 자동 추적 Store로 바꾸는 경량 상태 공유 솔루션',
    },
    {
      lang: 'de',
      label: 'Deutsch',
      title: 'Kerros',
      description: 'Hook-natives State-Sharing für React: Jeder Hook wird zum automatisch verfolgten Store',
    },
    {
      lang: 'fr',
      label: 'Français',
      title: 'Kerros',
      description: 'Partage d\'état natif des Hooks pour React : chaque Hook React devient un Store à suivi automatique',
    },
    {
      lang: 'es',
      label: 'Español',
      title: 'Kerros',
      description: 'Compartición de estado nativa de Hooks para React: cada Hook de React se convierte en un Store con seguimiento automático',
    },
  ],
})
