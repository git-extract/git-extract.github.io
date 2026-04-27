/* eslint-env node */
const { configure } = require('quasar/wrappers')

module.exports = configure(function (/* ctx */) {
  return {
    eslint: {
      fix: true,
      warnings: true,
      errors: true,
    },

    boot: ['pinia'],

    css: ['app.scss'],

    extras: ['roboto-font', 'material-icons', 'fontawesome-v6'],

    build: {
      target: {
        browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
        node: 'node24',
      },

      vueRouterMode: 'hash',

      env: {
        GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
        GITLAB_CLIENT_ID: process.env.GITLAB_CLIENT_ID,
        WORKER_URL: process.env.WORKER_URL,
      },
    },

    devServer: {
      open: true,
    },

    framework: {
      config: {},
      plugins: [],
    },

    animations: [],
  }
})
