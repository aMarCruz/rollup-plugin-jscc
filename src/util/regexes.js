/**
 * @module regexes
 *
 * Shared regexes
 */
/* eslint-disable max-len */

// Multi-line comment
export const MLCOMMS = /\/\*[^*]*\*+(?:[^*\/][^*]*\*+)*\//g

// Single-line comment
export const SLCOMMS = /\/\/.*$/g

// Quoted strings, take care about embedded eols
export const STRINGS = /"[^"\n\\]*(?:\\[\S\s][^"\n\\]*)*"|'[^'\n\\]*(?:\\[\S\s][^'\n\\]*)*'|`[^`\\]*(?:\\[\S\s][^`\\]*)*`/g

// Allows skip division operators to detect non-regex slash -- $1: the slash
export const DIVISOR = /(?:\b(?:return|yield)\s+|<\/[-a-zA-Z]|(?:[$\w\)\]]|\+\+|--)\s*\/(?![*\/]))/g

// Matches regexes -- $1 last slash of the regex
export const REGEXES = /\/(?=[^*\/>])[^[/\\]*(?:(?:\[(?:\\.|[^\]\\]*)*\]|\\.)[^[/\\]*)*?(\/)[gim]*/g

// Matches valid HTML comments (allowed in ES6 code)
export const HTMLCOMMS = /<!--(?!>)[\S\s]*?-->/g

// Matches the start of a comment
export const ISCOMMENT = /^(?:<--|\/\*|\/\/)/
