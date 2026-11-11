import { useState } from 'react'
import { BrowserRouter, Link, NavLink, Route, Routes } from 'react-router-dom'
import { AREAS, TOPICS, search, topicsByArea } from './lib/content'
import { TopicPage } from './components/TopicPage'

function Sidebar() {
  const [q, setQ] = useState('')
  const results = search(q)
  return (
    <aside className="sidebar">
      <Link to="/" className="brand">
        Mi Biblioteca
      </Link>
      <input
        type="search"
        placeholder="Buscar…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {q ? (
        <nav>
          {results.length === 0 && <p className="muted">Sin resultados</p>}
          {results.map((t) => (
            <NavLink key={t.area + t.slug} to={`/${t.area}/${t.slug}`} onClick={() => setQ('')}>
              {t.title}
            </NavLink>
          ))}
        </nav>
      ) : (
        Object.entries(AREAS).map(([id, name]) => (
          <nav key={id}>
            <h3>{name}</h3>
            {topicsByArea(id).map((t) => (
              <NavLink key={t.slug} to={`/${id}/${t.slug}`}>
                {t.title}
              </NavLink>
            ))}
          </nav>
        ))
      )}
    </aside>
  )
}

function Home() {
  return (
    <div>
      <h1>Mi Biblioteca</h1>
      <p className="lead">
        Apuntes de estudio para entrevistas: teoría, código, cómo funciona por dentro y fuentes
        oficiales. {TOPICS.length} temas.
      </p>
      <div className="grid">
        {Object.entries(AREAS).map(([id, name]) => (
          <div key={id} className="card">
            <h3>{name}</h3>
            {topicsByArea(id).map((t) => (
              <Link key={t.slug} to={`/${id}/${t.slug}`}>
                {t.title}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="layout">
        <Sidebar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/:area/:slug" element={<TopicPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
