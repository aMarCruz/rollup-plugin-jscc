/*
  jscc has extensive test with 100% coverage.
  Here we only check the plugin operation and very basic transforms.
*/
'use strict'

const expect = require('expect.js')
const path   = require('path')
const jscc   = require('../')
const rollup = require('rollup')

process.chdir(__dirname)

// Helpers ================================================

const transformer = (opts) => jscc(Object.assign({ asloader: false }, opts))

const fixturePath = function (name) {
  let file = path
    .join(__dirname, 'fixtures', name)
    .replace(/\\/g, '/')

    if (!path.extname(file)) {
    file += '.js'
  }
  return file
}

const generate = function (file, opts) {
  file = fixturePath(file)

  return jscc(opts).load(file).then((result) => {
    if (typeof result == 'string') {
      return result.replace(/[ \t]*$/gm, '')
    }
    return result && result.code.replace(/[ \t]*$/gm, '')
  })
}

const testFileStr = function (file, expected, opts) {
  opts = opts || {}
  opts.sourceMap = false

  return generate(file, opts).then((result) => {
    expect(result).to.be.a('string')

    if (typeof expected == 'string') {
      expect(result).to.be(expected)
    } else {
      expect(result).to.match(expected)
    }
    return result
  })
}

const rollupFile = (filename, outputOptions, jsccOptions) => {
  outputOptions = Object.assign({ format: 'cjs' }, outputOptions)

  return rollup.rollup({
    input: fixturePath(filename),
    plugins: [
      jscc(jsccOptions),
    ],
  })
    .then((bundle) => bundle.generate(outputOptions))
    .then((result) => result.output[0])
}

// The suites =============================================

describe('rollup-plugin-jscc', function () {

  it('must return an object with the plugin instance as a loader', function () {
    const p = jscc()
    expect(p).to.be.an(Object)
    expect(p).to.have.property('name', 'jscc')
    expect(p).to.have.property('load')
    expect(p.load).to.be.a(Function)
    expect(p).to.not.have.property('transform')
  })

  it('must return the plugin as a transformer if `asloader:false`', function () {
    const p = transformer()
    expect(p).to.be.an(Object)
    expect(p).to.have.property('name', 'jscc')
    expect(p).to.have.property('transform')
    expect(p.transform).to.be.a(Function)
    expect(p).to.not.have.property('load')
  })

  it('predefined `_FILE` value is the relative path of the current dir', function () {
    return rollupFile('def-file-var').then(
      ({code}) => expect(code).to.contain('// fixtures/def-file-var.js\n')
    )
  })

  it('predefined `_VERSION` must get the correct package.json', function () {
    const version = require('../package.json').version

    return transformer().transform('$_VERSION', 'v.js')
      .then((result) => {
        expect(result.code).to.be(version)
      })
  })

  it('predefined `_VERSION` can be overwritten', function () {
    const _VERSION = 'WIP'
    const options = { values: { _VERSION } }

    return transformer(options).transform('$_VERSION', 'v.js')
      .then((result) => {
        expect(result.code).to.be(_VERSION)
      })
  })

  it('must allow to define custom variables from the plugin', function () {
    const values = {
      _ZERO: 0,
      _MYBOOL: false,
      _MYSTRING: 'foo',
      _INFINITY: Infinity,
      _NAN: NaN,
      _NULL: null,
      _UNDEF: undefined,
    }
    const source = [
      '$_ZERO',
      '$_MYBOOL',
      '"$_MYSTRING"',
      '$_INFINITY',
      '$_NAN',
      '$_NULL',
      '$_UNDEF',
      '$_NOT_DEFINED',
    ].join('\n')

    return transformer({ values }).transform(source, 'a.js')
      .then((result) => {
        expect(result).to.ok()
        expect(result.code).to.be([
          '0',
          'false',
          '"foo"',
          'Infinity',
          'NaN',
          'null',
          'undefined',
          '$_NOT_DEFINED',
        ].join('\n'))
      })
  })

  it('varnames as function-like macros', function () {
    testFileStr('var-macros', "//('hello jscc!');\n")
    testFileStr('var-macros', "console.log('hello jscc!');\n", { values: { _DEBUG: 1 } })
  })

  it('supports Buffer objects', function () {
    const buffer = Buffer.from('OK', 'utf8')
    return transformer().transform(buffer, 'a.js')
      .then((res) => expect(res).to.be.an(Object).and.have.property('code', 'OK'))
  })

  it('ignore sources other than string or Buffer objects', function () {
    const some = new Date()
    transformer().transform(some, 'a.js').then(
      (res) => expect(res).to.be(some)
    )
  })

})

describe('Options:', function () {

  it('default preprocess files with extensions [.js, .jsx, .ts, .tsx, .tag]', function () {
    const res = transformer().transform('<a/>', 'a.html')
    expect(res).to.be(null)

    return transformer().transform('//', 'a.ts').then(
      (res) => expect(res).to.be.an(Object).and.have.property('code', '//')
    )
  })

  it('`extensions:"*"` (string) must include all the files', function () {
    return transformer({ extensions: '*' }).transform('<a/>', 'a.html')
      .then((res) => expect(res).to.be.an(Object).and.have.property('code', '<a/>'))
  })

  it('`extensions` can limit jscc to certain files, by ex ".txt"', function () {
    const opts = { extensions: 'txt' }
    const res = transformer(opts).transform('//', 'a.js')
    expect(res).to.be(null)

    transformer(opts).transform('OK', 'a.txt').then(
      (res) => expect(res).to.be.an(Object).and.have.property('code', 'OK')
    )
  })

  it('special files are always ignored (filename starting with `\\0`)', function () {
    expect(jscc(null).load('\0defaults.js')).to.be(null)
  })

  it('`exclude` avoids file preprocessing from given paths', function () {
    const inFile = fixturePath('a.js')
    expect(jscc({ exclude: ['**/fixtures/**'] }).load(inFile)).to.be(null)
  })

  it('`include` limit the preprocesing to certain paths', function () {
    return generate('defaults', { include: ['**/fixtures/**'] }).then((result) => {
      expect(result).to.be.a('string')
    })
  })

})

describe('Error handling', function () {

  it('you can reject with custom message through `#error`', function () {
    return rollupFile('cc-error').then(
      (res) => expect().fail(`Expected a rejected Promise, but it was resolved to "${res}"`),
      (err) => expect('' + err).to.contain('boom!')
    )
  })

  it('unclosed conditional blocks must throw an exception', function () {
    return rollupFile('cc-unclosed').then(
      (res) => expect().fail(`Expected a rejected Promise, but it was resolved to "${res}"`),
      (err) => expect('' + err).to.match(/Unexpected end of file/)
    )
  })

  it('syntax errors in expressions rejects during the evaluation', function () {
    return rollupFile('var-eval-error').then(
      (res) => expect().fail(`Expected a rejected Promise, but it was resolved to "${res}"`),
      (err) => expect(err).to.be.an(Error)
    )
  })

  it('as loader, rejects on un-existing files', function () {
    return rollupFile('no-file').then(
      (res) => expect().fail(`Expected a rejected Promise, but it was resolved to "${res}"`),
      (err) => expect(err).to.be.an(Error)
    )
  })
})

describe('Source Map', function () {
  
  it('generate sourcemap without cc comments', function () {
    return jscc({
      sourceMap: true
    }).load(fixturePath('no-cc')).then((res)=>{
      expect(res).to.be.an(Object).and.have.property('map', null)
    })
  })

  it('generate sourcemap with cc comments', function () {
    return jscc({
      sourceMap: true
    }).load(fixturePath('cc')).then((res)=>{
      expect(res).to.be.an(Object).and.have.property('map')
      
      const map = res.map

      expect(map).to.be.an(Object)
      // file is null
      // expect(map.file).to.be('cc.js')
      expect(map.sources[0]).to.match(/test\/fixtures\/cc\.js/)
      expect(map.sourcesContent[0]).to.be(null)
      expect(map.mappings).not.empty()
    })
  })

  it('generate sourcemap with cc comments and map content', function () {
    return jscc({
      sourceMap: true,
      mapContent: true
    }).load(fixturePath('cc')).then((res)=>{
      expect(res).to.be.an(Object).and.have.property('map')
      
      const map = res.map

      expect(map).to.be.an(Object)
      // file is null
      // expect(map.file).to.be('cc.js')
      expect(map.sources[0]).to.match(/test\/fixtures\/cc\.js/)
      expect(map.sourcesContent[0]).to.be('//#if _EXPROT_DEFAULT\nexport function main () {\n  return \'test\'\n}\n/*#else\nexport default function main () {\n  return \'test\'\n}\n//#endif */\n')
      expect(map.mappings).not.empty()
    })
  })

  it('generate sourcemap without cc comments on rollup', function () {
    return rollupFile('no-cc', {
      sourcemap: true,
      sourceRoot: "root"
    }, {
      sourceMap: true
    }).then(
      ({code, map}) => {
        expect(map.file).to.be('no-cc.js')
        expect(map.sources[0]).to.be('fixtures/no-cc.js')
        expect(map.sourcesContent[0]).to.be('export function main () {\n  return \'test\'\n}\n')
        expect(map.mappings).not.empty()
      }
    )
  })

  it('generate sourcemap without cc comments and map content on rollup', function () {
    return rollupFile('no-cc', {
      sourcemap: true,
      sourceRoot: "root"
    }, {
      sourceMap: true,
      mapContent: true
    }).then(
      ({code, map}) => {
        expect(map.file).to.be('no-cc.js')
        expect(map.sources[0]).to.be('fixtures/no-cc.js')
        expect(map.sourcesContent[0]).to.be('export function main () {\n  return \'test\'\n}\n')
        expect(map.mappings).not.empty()
      }
    )
  })

  it('generate sourcemap with cc comments on rollup', function () {
    return rollupFile('cc', {
      sourcemap: true,
      sourceRoot: "root"
    }, {
      sourceMap: true
    }).then(
      ({code, map}) => {
        expect(map.file).to.be('cc.js')
        expect(map.sources[0]).to.be('fixtures/cc.js')
        expect(map.sourcesContent[0]).to.be(null)
        expect(map.mappings).not.empty()
      }
    )
  })

  it('generate sourcemap with cc comments and map content on rollup', function () {
    return rollupFile('cc', {
      sourcemap: true,
      sourceRoot: "root"
    }, {
      sourceMap: true,
      mapContent: true
    }).then(
      ({code, map}) => {
        expect(map.file).to.be('cc.js')
        expect(map.sources[0]).to.be('fixtures/cc.js')
        expect(map.sourcesContent[0]).to.be('//#if _EXPROT_DEFAULT\nexport function main () {\n  return \'test\'\n}\n/*#else\nexport default function main () {\n  return \'test\'\n}\n//#endif */\n')
        expect(map.mappings).not.empty()
      }
    )
  })
})