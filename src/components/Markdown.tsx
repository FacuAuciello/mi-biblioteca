import type { ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from './CodeBlock'

const components = {
  code({ className, children }: { className?: string; children?: ReactNode }) {
    const lang = /language-(\w+)/.exec(className ?? '')?.[1]
    const text = String(children).replace(/\n$/, '')
    if (!lang && !text.includes('\n')) return <code>{children}</code>
    return <CodeBlock code={text} lang={lang ?? 'text'} />
  },
  pre: ({ children }: { children?: ReactNode }) => <>{children}</>,
}

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  )
}
