import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Yugen',
  description: 'A framework-agnostic, lightweight, robust and intuitive state manager',
  srcDir: 'pages',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Docs', link: '/what-is-yugen' },
    ],
    sidebar: [
      {
        text: 'Docs',
        items: [
          { text: 'What is Yugen?', link: '/what-is-yugen' },
          { text: 'Design Philosophy', link: '/design-philosophy' },
        ],
      },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/s0h311/yugen' }],
  },
})
