import { useEffect, useState } from 'react'
import { createHighlighter, type Highlighter } from 'shiki'

const LANGS = ['java', 'typescript', 'tsx', 'javascript', 'sql', 'bash', 'yaml', 'dockerfile', 'json', 'xml']
let hl: Promise<Highlighter> | null = null
const getHl = () =>
  (hl ??= createHighlighter({ themes: ['github-light', 'github-dark'], langs: LANGS }))

export function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [html, setHtml] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let alive = true
    getHl().then((h) => {
      const l = LANGS.includes(lang) ? lang : 'text'
      const out = h.codeToHtml(code, {
        lang: l,
        themes: { light: 'github-light', dark: 'github-dark' },
        defaultColor: false,
      })
      if (alive) setHtml(out)
    })
    return () => {
      alive = false
    }
  }, [code, lang])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard no disponible */
    }
  }

  return (
    <div className="codeblock">
      <div className="codeblock-bar">
        <span>{lang}</span>
        <button onClick={copy}>{copied ? 'Copiado' : 'Copiar'}</button>
      </div>
      {html ? (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre>
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}
