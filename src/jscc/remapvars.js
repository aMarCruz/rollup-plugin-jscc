
import { REPVARS } from './revars'

// for matching all vars inside code
export function remapVars (magicStr, values, str, start) {
  let re = REPVARS
  let mm
  let changes = false

  re.lastIndex = 0  // `re` is global, so reset

  while ((mm = re.exec(str))) {
    let v = mm[2]
    if (v && v in values) {
      let idx = start + mm.index + mm[1].length
      magicStr.overwrite(idx, idx + v.length + 1, '' + values[v])
      changes = true
    }
  }

  return changes
}
