//#set _FOO 'foo'

let bar = '$_FOO'.toUpperCase();  // bar = 'FOO'
let baz = { $_FOO: 'bar' };       // baz = { foo: 'bar' }

console.log('$_FOO');             // outputs 'foo'
console.log(baz['$_FOO']);        // outputs 'bar'
console.log(baz.$_FOO);           // outputs 'bar'
