export type Topic = {
  slug: string
  area: string
  title: string
  summary: string
  level: string
  tags: string[]
  related: string[]
  sources: { label: string; url: string }[]
  body: string
}

export const AREAS: Record<string, string> = {
  'java-spring': 'Java + Spring',
  'js-ts-react': 'JavaScript / TypeScript / React',
  'bases-de-datos': 'Bases de datos',
  despliegue: 'Despliegue',
}

const raw = import.meta.glob('../../content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function parseList(v: string): string[] {
  return v
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function parse(path: string, text: string): Topic {
  const [, area, file] = path.match(/content\/([^/]+)\/([^/]+)\.md$/)!
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  const meta: Record<string, string> = {}
  const body = m ? m[2] : text
  if (m) {
    for (const line of m[1].split('\n')) {
      const i = line.indexOf(':')
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
    }
  }
  const sources = parseList(meta.sources ?? '').map((s) => {
    const [label, url] = s.split('|').map((x) => x.trim())
    return { label, url }
  })
  return {
    slug: file,
    area,
    title: meta.title ?? file,
    summary: meta.summary ?? '',
    level: meta.level ?? '',
    tags: parseList(meta.tags ?? ''),
    related: parseList(meta.related ?? ''),
    sources,
    body,
  }
}

export const TOPICS: Topic[] = Object.entries(raw)
  .map(([p, t]) => parse(p, t))
  .sort((a, b) => a.title.localeCompare(b.title, 'es'))

export const topicsByArea = (area: string) => TOPICS.filter((t) => t.area === area)
export const findTopic = (area: string, slug: string) =>
  TOPICS.find((t) => t.area === area && t.slug === slug)

export function search(q: string): Topic[] {
  const s = q.trim().toLowerCase()
  if (!s) return []
  return TOPICS.filter((t) =>
    [t.title, t.summary, t.tags.join(' '), t.body].join(' ').toLowerCase().includes(s),
  )
}
