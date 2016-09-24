/**
 * The loading of buble/register can fail, try two places here.
 */
'use strict'

try {
  module.exports = require('buble/register')
} catch (_) {
  try {
    module.exports = require('node_modules/rollup-plugin-buble/node_modules/buble/register')
  } catch (e) {
    throw new Error('buble/register not found. Please install Bublé with `npm i buble -D`.')
  }
}
