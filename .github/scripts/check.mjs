// Checks what `mint validate` and `mint broken-links` don't: run with node .github/scripts/check.mjs
//
// - Every page is in the navigation, and every page in the navigation exists.
// - Every page has a title, a description and an icon.
// - Screenshots name ones the app's repository has, in light and dark, loaded lazily.
// - Icons are ones Mintlify's Lucide has (aliases like `terminal-square` aren't).
// - Every `{{variable}}` is defined in docs.json, or the build fails.
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('../..', import.meta.url).pathname
const SCREENSHOTS =
  'https://cdn.jsdelivr.net/gh/Lumovi/Lumovi@main/docs/screenshots/screenshots.json'
// The Lucide version Mintlify serves icons from.
const ICONS = 'https://unpkg.com/lucide-static@1.16.0/tags.json'

const config = JSON.parse(readFileSync(join(ROOT, 'docs.json'), 'utf8'))
const [shots, icons] = await Promise.all(
  [SCREENSHOTS, ICONS].map(async (url) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`${url}: ${res.status}`)
    return res.json()
  }),
)
const screenshotNames = new Set(shots.screenshots.map((s) => s.name))
const iconNames = new Set(Object.keys(icons))
const variables = new Set(Object.keys(config.variables ?? {}))

const navigation = []
const walk = (node) => {
  if (typeof node === 'string') navigation.push(node)
  else if (Array.isArray(node)) node.forEach(walk)
  else if (node && typeof node === 'object') {
    for (const key of ['tabs', 'groups', 'pages']) walk(node[key])
  }
}
walk(config.navigation)

const files = readdirSync(ROOT, { recursive: true })
  .filter((f) => f.endsWith('.mdx') && !f.split('/').some((part) => part.startsWith('.')))
  .map((f) => f.replace(/\.mdx$/, ''))

const problems = []
const problem = (page, text) => problems.push(`${page}: ${text}`)

for (const page of navigation) {
  if (!files.includes(page)) problem(page, 'in docs.json, but no such page')
}
for (const page of files) {
  if (!navigation.includes(page)) problem(page, 'not in docs.json')
}

for (const page of files) {
  const text = readFileSync(join(ROOT, `${page}.mdx`), 'utf8')
  const front = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ''
  for (const field of ['title', 'description', 'icon']) {
    if (!new RegExp(`^${field}:`, 'm').test(front)) problem(page, `no ${field} in its frontmatter`)
  }

  for (const [, name] of text.matchAll(/icon[=:]\s*"([a-z0-9-]+)"/g)) {
    if (!iconNames.has(name)) problem(page, `no Lucide icon is called "${name}"`)
  }

  for (const [img] of text.matchAll(/<img [^>]*docs\/screenshots\/[^>]*>/g)) {
    const [, name, theme, size] =
      img.match(/screenshots\/([a-z0-9-]+?)-(light|dark)(-1x)?\.webp/) ?? []
    if (!name) problem(page, `can't read the screenshot in ${img.slice(0, 80)}…`)
    else if (!screenshotNames.has(name)) problem(page, `the app has no screenshot called "${name}"`)
    else if (!size) problem(page, `"${name}-${theme}" should be the 1440 px one (-1x.webp)`)
    if (!img.includes('loading="lazy"')) problem(page, `a screenshot isn't loaded lazily: ${name}`)
  }
  const light = [...text.matchAll(/screenshots\/([a-z0-9-]+)-light-1x\.webp/g)].map((m) => m[1])
  const dark = [...text.matchAll(/screenshots\/([a-z0-9-]+)-dark-1x\.webp/g)].map((m) => m[1])
  if (light.sort().join() !== dark.sort().join()) {
    problem(page, 'a screenshot is missing its light or dark twin')
  }

  for (const [, name] of text.matchAll(/\{\{([A-Za-z0-9-]+)\}\}/g)) {
    if (!variables.has(name)) problem(page, `{{${name}}} isn't a variable in docs.json`)
  }
  if (text.includes('<!--')) problem(page, 'HTML comments break MDX: use {/* … */}')

  // A table cell that opens with a straight quote shows it backwards (”like this“): write “…”.
  let fenced = false
  for (const [i, line] of text.split('\n').entries()) {
    if (/^\s*```/.test(line)) fenced = !fenced
    if (!fenced && /^\s*\|/.test(line) && /\|\s*"/.test(line)) {
      problem(page, `line ${i + 1}: a table cell opens with a straight quote, shown backwards: write “…”`)
    }
  }
}

if (problems.length) {
  console.error(problems.join('\n'))
  console.error(`\n${problems.length} problem${problems.length === 1 ? '' : 's'}`)
  process.exit(1)
}
console.log(`${files.length} pages checked: no problems`)
