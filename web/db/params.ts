/**
 * Parameter binding with better-sqlite3 semantics, on top of drivers that only
 * accept positional "?" parameters (sql.js, Hrana).
 *
 *  - positional args fill "?" placeholders in order; arrays are flattened
 *  - one plain object supplies named parameters (@name, :name, $name)
 *  - too few / too many values, or a missing named value, throw exactly like
 *    better-sqlite3 (sql.js would silently bind NULL instead)
 */
import { toSqlValue, type SqlValue } from "./compat"

type Slot = { kind: "positional" } | { kind: "named"; name: string }

export interface ParsedSql {
  sql: string
  slots: Slot[]
  hasNamed: boolean
}

const cache = new Map<string, ParsedSql>()

function isIdentChar(ch: string) {
  return /[A-Za-z0-9_]/.test(ch)
}

/** Rewrites named placeholders to "?" while skipping strings, identifiers and comments. */
export function parseSql(source: string): ParsedSql {
  const cached = cache.get(source)
  if (cached) return cached

  const slots: Slot[] = []
  let out = ""
  let hasNamed = false
  let i = 0
  const n = source.length

  while (i < n) {
    const ch = source[i]
    const next = source[i + 1]

    // String literals and quoted identifiers.
    if (ch === "'" || ch === '"' || ch === "`") {
      let j = i + 1
      while (j < n) {
        if (source[j] === ch) {
          if (source[j + 1] === ch) {
            j += 2
            continue
          }
          break
        }
        j++
      }
      out += source.slice(i, j + 1)
      i = j + 1
      continue
    }
    if (ch === "[") {
      const j = source.indexOf("]", i + 1)
      const end = j === -1 ? n : j + 1
      out += source.slice(i, end)
      i = end
      continue
    }
    // Comments.
    if (ch === "-" && next === "-") {
      const j = source.indexOf("\n", i)
      const end = j === -1 ? n : j
      out += source.slice(i, end)
      i = end
      continue
    }
    if (ch === "/" && next === "*") {
      const j = source.indexOf("*/", i + 2)
      const end = j === -1 ? n : j + 2
      out += source.slice(i, end)
      i = end
      continue
    }
    // Placeholders.
    if (ch === "?") {
      let j = i + 1
      while (j < n && /[0-9]/.test(source[j])) j++
      if (j > i + 1) throw new TypeError("Numbered parameters (?NNN) are not supported")
      slots.push({ kind: "positional" })
      out += "?"
      i = j
      continue
    }
    if ((ch === "@" || ch === ":" || ch === "$") && next !== undefined && /[A-Za-z_]/.test(next)) {
      // Avoid treating "::" casts or identifiers like a:b inside words as params.
      const prev = source[i - 1]
      if (!(prev && isIdentChar(prev)) && !(ch === ":" && prev === ":")) {
        let j = i + 1
        while (j < n && isIdentChar(source[j])) j++
        slots.push({ kind: "named", name: source.slice(i + 1, j) })
        hasNamed = true
        out += "?"
        i = j
        continue
      }
    }
    out += ch
    i++
  }

  const parsed = { sql: out, slots, hasNamed }
  if (cache.size > 5000) cache.clear()
  cache.set(source, parsed)
  return parsed
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false
  if (Array.isArray(value) || value instanceof Uint8Array || value instanceof ArrayBuffer || value instanceof Date) return false
  return true
}

/** Resolves call arguments into the SQL to run and the positional values for it. */
export function bindParams(source: string, args: unknown[]): { sql: string; values: SqlValue[] } {
  const positional: unknown[] = []
  let named: Record<string, unknown> | null = null

  for (const arg of args) {
    if (Array.isArray(arg)) {
      for (const inner of arg) {
        if (isPlainObject(inner)) {
          if (named) throw new TypeError("You cannot specify named parameters in two different objects")
          named = inner
        } else positional.push(inner)
      }
    } else if (isPlainObject(arg)) {
      if (named) throw new TypeError("You cannot specify named parameters in two different objects")
      named = arg
    } else {
      positional.push(arg)
    }
  }

  const parsed = parseSql(source)
  const values: SqlValue[] = []
  let p = 0
  for (const slot of parsed.slots) {
    if (slot.kind === "positional") {
      if (p >= positional.length) throw new RangeError("Too few parameter values were provided")
      values.push(toSqlValue(positional[p++]))
    } else {
      if (!named) throw new RangeError("Too few parameter values were provided")
      if (!(slot.name in named)) throw new RangeError(`Missing named parameter "${slot.name}"`)
      values.push(toSqlValue(named[slot.name]))
    }
  }
  if (p < positional.length) throw new RangeError("Too many parameter values were provided")

  return { sql: parsed.hasNamed ? parsed.sql : source, values }
}
