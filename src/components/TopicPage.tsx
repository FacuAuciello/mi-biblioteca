import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AREAS, TOPICS, findTopic } from '../lib/content'
import { Markdown } from './Markdown'

type Section = { title: string; body: string }

function splitSections(body: string): Section[] {
  const parts = body.split(/^## /m)
  return parts
    .slice(1)
    .map((p) => {
      const i = p.indexOf('\n')
      return { title: p.slice(0, i).trim(), body: p.slice(i + 1) }
    })
}

function Questions({ body }: { body: string }) {
  const items = body.split(/^### /m).slice(1)
  return (
    <>
      {items.map((it) => {
        const i = it.indexOf('\n')
        return (
          <details key={it} className="question">
            <summary>{it.slice(0, i).trim()}</summary>
            <Markdown>{it.slice(i + 1)}</Markdown>
          </details>
        )
      })}
    </>
  )
}

function Notes({ id }: { id: string }) {
  const key = `notes:${id}`
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem(key) ?? ''
    } catch {
      return ''
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, text)
    } catch {
      /* sin storage */
    }
  }, [key, text])
  return (
    <textarea
      className="notes"
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder="Tus notas sobre este tema (se guardan en este navegador)…"
    />
  )
}

export function TopicPage() {
  const { area = '', slug = '' } = useParams()
  const topic = findTopic(area, slug)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [area, slug])
  if (!topic) return <p>Tema no encontrado.</p>

  const sections = splitSections(topic.body)
  const related = topic.related
    .map((r) => TOPICS.find((t) => t.slug === r))
    .filter((t) => t !== undefined)

  return (
    <article>
      <p className="eyebrow">
        {AREAS[topic.area]} · {topic.level}
      </p>
      <h1>{topic.title}</h1>
      <p className="lead">{topic.summary}</p>
      <div className="tags">
        {topic.tags.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      {sections.map((s) => (
        <section key={s.title}>
          <h2>{s.title}</h2>
          {s.title.toLowerCase().startsWith('preguntas') ? (
            <Questions body={s.body} />
          ) : (
            <Markdown>{s.body}</Markdown>
          )}
        </section>
      ))}
      {related.length > 0 && (
        <section>
          <h2>Se conecta con</h2>
          <ul>
            {related.map((t) => (
              <li key={t.slug}>
                <Link to={`/${t.area}/${t.slug}`}>{t.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {topic.sources.length > 0 && (
        <section>
          <h2>Fuentes oficiales</h2>
          <ul>
            {topic.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section>
        <h2>Notas</h2>
        <Notes id={`${topic.area}/${topic.slug}`} />
      </section>
    </article>
  )
}
