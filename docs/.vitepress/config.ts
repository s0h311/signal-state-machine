import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid({
  title: 'Yugen',
  description: 'A framework-agnostic, lightweight, robust and intuitive state manager',
  srcDir: 'pages',
  markdown: {
    math: true,
  },
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
          { text: 'Example Project', link: '/example-project' },
          { text: 'Comparison', link: '/comparison' },
          { text: 'Developing Yugen', link: '/developing-yugen' },
        ],
      },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/s0h311/yugen' }],
  },
})
