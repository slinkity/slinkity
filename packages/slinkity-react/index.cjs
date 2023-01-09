const pkg = require('./package.json');
const ssr = require('./ssr.cjs');
const { default: viteReact } = require('@vitejs/plugin-react');

module.exports = function slinkityReact() {
  return {
    name: 'react',
    extensions: ['jsx', 'tsx'],
    clientEntrypoint: `${pkg.name}/client`,
    ssr,
    viteConfig: {
      plugins: [viteReact()],
      optimizeDeps: {
        include: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom'],
      },
      resolve: {
        dedupe: ['react', 'react-dom'],
      },
      ssr: {
        external: ['react-dom/server.js'],
      },
    },
    page({ Component }) {
      return {
        getData() {
          return Component.frontmatter ?? Component.frontMatter ?? {};
        },
        getIslandMeta() {
          return Component.island;
        },
      };
    },
  };
};
