/*
  Special use of multiline comment (like this one) allows hide content.
  It is a usefull feature for linters.
*/
//#set _DEBUG 1
//#set _TEST 'test'

/*#if _DEBUG
// Generate options in debug mode
function initialize(options) {
  // You can put almost anything here, except multiline comments.
  const _DEBUG = true
  const stderr = console.error.bind(console) //eslint-disable-line no-console
  const errstr = '$_TEST'   // <-- cc variables are ok
  // ...it can have a lot of code
}
//#else // */
function initialize() {}
//#endif

function main() {
  initialize()
}
