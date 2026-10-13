// Checks reference/plugin-kit against what Lumovi's door declares: run with node .github/scripts/kit.mjs
//
// - The parts in "Every part, exactly" are the door's, each with what it holds, takes, needs and
//   tells the page: none missing, none the door doesn't have.
// - Every limit the door has is one this check knows: said on a page, with its number as the door
//   has it now, or left unsaid here on purpose. A limit added to Lumovi fails this until it's said.
//
// The door's side is docs/plugin-kit.json in Lumovi (made from its declarations, and held to them by
// Lumovi's own tests), read from the branch these docs describe. KIT_JSON names a file instead.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('../..', import.meta.url).pathname
const KIT = 'https://raw.githubusercontent.com/Lumovi/Lumovi/main/docs/plugin-kit.json'

const kit = process.env.KIT_JSON
  ? JSON.parse(readFileSync(process.env.KIT_JSON, 'utf8'))
  : await fetch(KIT).then((res) => {
      if (!res.ok) throw new Error(`${KIT}: ${res.status}`)
      return res.json()
    })
const page = (name) => readFileSync(join(ROOT, `${name}.mdx`), 'utf8')
const problems = []

// --- The parts ---
const kitPage = page('reference/plugin-kit')
const section = kitPage.split('### Every part, exactly')[1]?.split(/\n#{2,3} /)[0] ?? ''
const listed = (cell) => (cell.trim() === 'nothing' ? [] : [...cell.matchAll(/`([^`]+)`/g)].map((m) => m[1]))
const said = new Map(
  section
    .split('\n')
    .filter((line) => /^\| `/.test(line))
    .map((line) => {
      const [part, holds, takes, needs, tells] = line.split('|').slice(1, -1)
      return [listed(part)[0], { holds: listed(holds), props: listed(takes), required: listed(needs), events: listed(tells) }]
    }),
)
const same = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort())
for (const [name, part] of Object.entries(kit.parts)) {
  const row = said.get(name)
  if (!row) {
    problems.push(`reference/plugin-kit: the door has the part ${name}, and "Every part, exactly" doesn't`)
    continue
  }
  const holds = part.holds === 'nothing' ? [] : part.holds
  for (const [what, door, docs] of [
    ['holds', holds, row.holds],
    ['takes', part.props, row.props],
    ['needs', part.required, row.required],
    ['tells the page', part.events, row.events],
  ]) {
    if (!same(door, docs)) {
      problems.push(`reference/plugin-kit: ${name} ${what} ${door.join(', ') || 'nothing'} at the door, and the page says ${docs.join(', ') || 'nothing'}`)
    }
  }
}
for (const name of said.keys()) {
  if (!Object.hasOwn(kit.parts, name)) problems.push(`reference/plugin-kit: "Every part, exactly" has ${name}, which the door doesn't`)
}

// --- The limits ---
const n = (value) => value.toLocaleString('en-US')
/** Each limit the door has: where it's said and how, or why it isn't. */
const LIMITS = {
  'door.message': ['reference/plugin-kit', () => '1 MiB'],
  'door.stepsACommit': ['reference/plugin-kit', (v) => `${n(v)} steps in one commit`],
  'door.stepsASecond': ['reference/plugin-kit', (v) => `${n(v)} steps`],
  'door.commitsASecond': ['reference/plugin-kit', (v) => `${v} commits`],
  'door.secondsAtOnce': 'how the door counts a second, not something a page can use',
  'door.nodes': ['reference/plugin-kit', (v) => `| ${n(v)}, `],
  'door.logStreamsPage': ['reference/plugin-kit', (v) => `| Logs shown at once | ${v} by a page, `],
  'door.logStreamsPlugin': ['reference/plugin-kit', (v) => `${v} by a plugin: more wait`],
  'door.depth': ['reference/plugin-kit', (v) => `${v} deep`],
  'door.inOnePart': ['reference/plugin-kit', (v) => `${n(v)} in one part`],
  'door.text': ['reference/plugin-kit', (v) => `${n(v)} characters`],
  'door.held': ['reference/plugin-kit', () => '| 2 MB |'],
  'reads.listsAPage': ['reference/plugin-kit', (v) => `| Lists kept up to date | ${v} by a page, `],
  'reads.listsAPlugin': ['reference/plugin-kit', (v) => `${v} by all of a plugin's pages`],
  'reads.keptAPage': ['reference/plugin-kit', (v) => `| Reads going at once | ${v} by a page, `],
  'reads.keptAPlugin': ['reference/plugin-kit', (v) => `${v} by a plugin, `],
  'reads.asksASecond': ['reference/plugin-kit', (v) => `${v} asks`],
  'reads.waiting': ['reference/plugin-kit', (v) => `${v} not yet answered`],
  'reads.refreshEveryMs': ['reference/plugin-kit', (v) => `Once in ${v / 1000} seconds`],
  'reads.logLines': ['custom-resources/plugins', (v) => `last ${v} lines`],
  'reads.logSeconds': ['custom-resources/plugins', (v) => (v === 3600 ? 'the last hour' : `the last ${v} seconds`)],
  'reads.logBytes': ['custom-resources/plugins', (v) => `${v / 1024} KiB`],
  'frame.tiles.least': ['reference/plugin-kit', (v) => `| ${v} to `],
  'frame.tiles.most': ['reference/plugin-kit', (v) => ` to ${v} \`tiles\``],
  'frame.buttons': ['reference/plugin-kit', (v) => `up to ${v} \`buttons\``],
  'frame.picks': ['reference/plugin-kit', (v) => `| ${n(v)} rows |`],
  'frame.key': 'a key is as long as a name: said with the name',
  'frame.text': ['reference/plugin-kit', (v) => `a cell ${v}`],
  'frame.line': ['reference/plugin-kit', (v) => `a line ${v}`],
  'frame.note': ['reference/plugin-kit', (v) => `up to ${v} characters, under the buttons`],
  'frame.off': ['reference/plugin-kit', (v) => `up to ${v} characters. It's drawn off`],
  'frame.about': ['reference/plugin-kit', (v) => `up to ${v} characters, shown quietly`],
  'frame.counts.groups': ['reference/plugin-kit', (v) => `Up to ${v} \`groups\``],
  'frame.counts.rows': ['reference/plugin-kit', (v) => `up to ${v} \`rows\``],
  'table.rows': ['reference/plugin-kit', (v) => `| ${n(v)}, with `],
  'table.nested': ['reference/plugin-kit', (v) => `${v} inside one row`],
  'table.columns': ['reference/plugin-kit', (v) => `and ${v} columns`],
  'table.text': 'the same as a name: said once',
  'table.line': 'the same as a line: said once',
  'table.depth': ['reference/plugin-kit', (v) => (v === 1 ? 'Rows may hold rows, one level' : `rows ${v} deep`)],
  'table.leadHeading': 'a heading is short: its limit is the door\'s to say when one is too long',
  'graph.drawn.cards': ['reference/plugin-kit', (v) => `Past ${v} cards`],
  'graph.drawn.lines': ['reference/plugin-kit', (v) => `or ${v} lines`],
  'graph.cards': ['reference/plugin-kit', (v) => `${n(v)} cards`],
  'graph.lines': ['reference/plugin-kit', (v) => `${n(v)} lines`],
  'graph.text': 'the same as a name: said once',
  'graph.label': 'a line\'s label is cut where it\'s drawn, and whole in its tooltip',
  'server.paths': ['reference/plugin-format', (v) => `up to ${v} \`paths\``],
  'server.pathLength': ['reference/plugin-format', (v) => `each up to ${v} characters`],
  'server.labels': ['reference/plugin-format', (v) => `up to ${v} \`labels\``],
  'server.fills': 'said by the file check, when a path fills more',
  'server.timeoutMs': ['custom-resources/plugins', (v) => `at most ${v / 1000} seconds`],
  'server.bytes': ['custom-resources/plugins', () => 'at most 1 MiB'],
  'server.depth': 'how deep an answer nests: a server past it is said to answer something other than JSON',
  'server.waitingAPage': ['reference/plugin-kit', (v) => `| Asks of its server not yet answered | ${v} by a page; `],
  'server.waitingAPlugin': ['reference/plugin-kit', (v) => `${v} by a plugin, and more wait`],
}
const leaves = (value, at = []) =>
  typeof value === 'object' && value !== null
    ? Object.entries(value).flatMap(([key, inner]) => leaves(inner, [...at, key]))
    : [[at.join('.'), value]]
const doors = new Map(leaves(kit.limits))
for (const [key, value] of doors) {
  const how = LIMITS[key]
  if (how === undefined) {
    problems.push(`the door has the limit ${key} (${value}), and nothing here says where the docs say it, or why they don't`)
  } else if (Array.isArray(how)) {
    const [where, text] = how
    if (!page(where).includes(text(value))) problems.push(`${where}: should say “${text(value)}” (the door's ${key} is ${value})`)
  }
}
for (const key of Object.keys(LIMITS)) {
  if (!doors.has(key)) problems.push(`this check knows the limit ${key}, which the door doesn't have any more`)
}

if (problems.length > 0) {
  console.error(problems.join('\n'))
  console.error(`\n${problems.length === 1 ? '1 problem' : `${problems.length} problems`}`)
  process.exit(1)
}
console.log(`reference/plugin-kit: ${Object.keys(kit.parts).length} parts and ${doors.size} limits, as the door has them`)
