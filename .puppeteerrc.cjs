const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Puppeteer'ın tarayıcıyı arayacağı ve saklayacağı cache dizini
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};