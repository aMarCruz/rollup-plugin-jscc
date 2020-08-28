//
// Type definitions for rollup-plugin-jscc v1.0.x
// Definitions by aMarCruz
//
export = jsccPlugin

declare function jsccPlugin (options: jsccPlugin.Options): import('rollup').Plugin

declare namespace jsccPlugin {
  //
  type QuoteType = 'single' | 'double' | 'both'

  interface Options {
    /**
     * If `false`, run the plugin as a `transformer`, otherwise run as `loader`
     * @default true
     */
    asloader?: boolean

    /**
     * String with the type of quotes to escape in the output of strings:
     * 'single', 'double' or 'both'.
     *
     * It does not affects the output of regexes or strings contained in the
     * JSON output of objects.
     */
    escapeQuotes?: QuoteType

    /**
     * Preserves the empty lines of the directives and blocks that were removed.
     *
     * Use this option with `sourceMap:false` if you are interested only in
     * keeping the line numbering.
     * @default false
     */
    keepLines?: boolean

    /**
     * Make a hi-res source-map, if `sourceMap:true` (the default).
     * @default true
     */
    mapHires?: boolean

    /**
     * String, regex or array of strings or regex matching the start of a directive.
     * That is, the characters before the '#', usually the start of comments.
     * @default /\/[/*]|<!--/
     */
    prefixes?: string | RegExp | Array<string | RegExp>

    /**
     * Must include a sourceMap?
     * @default true
     */
    sourcemap?: boolean

    /**
     * Alias for `sourcemap`
     * @deprecated
     */
    sourceMap?: boolean

    /**
     * Include the original source in the sourcemap
     * @default true
     */
    mapContent?: boolean

    /**
     * Plain object defining the variables used by jscc during the preprocessing.
     *
     * Each key is a varname matching the regex `_[0-9A-Z][_0-9A-Z]*`, the value
     * can have any type.
     *
     * It has two predefined, readonly properties:
     * - `_FILE` : Name of the source file, relative to the current directory
     * - `_VERSION` : The version property in the package.json
     */
    values?: { [k: string]: any }

    /**
     * Array of strings that specifies the file extensions to process.
     *
     * _Note:_ Do not use wildcards here.
     * @default ['js','jsx','ts','tsx','mjs','tag']
     */
    extensions?: string | string[]

    /**
     * [minimatch](https://github.com/isaacs/minimatch) or array of minimatch
     * patterns for paths that must be included in the processing.
     * @default (none)
     */
    include?: string | string[]

    /**
     * [minimatch](https://github.com/isaacs/minimatch) or array of minimatch
     * patterns for paths that should be ignored.
     * @default (none)
     */
    exclude?: string | string[]
  }
}
