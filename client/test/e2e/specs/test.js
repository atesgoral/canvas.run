// For authoring Nightwatch tests, see
// http://nightwatchjs.org/guide#usage

module.exports = {
  'default e2e tests': function (browser) {
    // automatically uses dev Server port from /config.index.js
    // default: http://localhost:8080
    // see nightwatch.conf.js
    const devServer = browser.globals.devServerURL

    browser
      .url(devServer)
      .waitForElementVisible('._right-aligned', 5000)
      // .assert.elementPresent('.logo')
      .assert.containsText('._right-aligned button', 'SIGN IN')
      // .assert.elementCount('p', 3)
      .end()
  }
}
