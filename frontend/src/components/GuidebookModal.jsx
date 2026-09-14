import { useEffect, useMemo, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import guidebookMd from '../content/Coding_Guidebook_V1.2_for_tool.md?raw'

const SCROLL_KEY = 'spc_guidebook_scroll'

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function textFromChildren(children) {
  if (children == null || typeof children === 'boolean') return ''
  if (typeof children === 'string' || typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(textFromChildren).join('')
  if (children?.props?.children) return textFromChildren(children.props.children)
  return ''
}

function extractToc(md) {
  const toc = []
  for (const line of md.split('\n')) {
    const m = /^##\s+(.+)$/.exec(line)
    if (!m) continue
    const title = m[1].trim()
    toc.push({ id: slugify(title), title })
  }
  return toc
}

export default function GuidebookModal({ onClose }) {
  const bodyRef = useRef(null)
  const toc = useMemo(() => extractToc(guidebookMd), [])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const el = bodyRef.current
    if (el) {
      const saved = sessionStorage.getItem(SCROLL_KEY)
      if (saved != null) el.scrollTop = Number(saved) || 0
    }

    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      if (bodyRef.current) {
        sessionStorage.setItem(SCROLL_KEY, String(bodyRef.current.scrollTop))
      }
    }
  }, [onClose])

  function jumpTo(id) {
    const target = bodyRef.current?.querySelector(`#${CSS.escape(id)}`)
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const components = useMemo(
    () => ({
      h2: ({ children, ...props }) => {
        const id = slugify(textFromChildren(children))
        return (
          <h2 id={id} {...props}>
            {children}
          </h2>
        )
      },
      h3: ({ children, ...props }) => {
        const id = slugify(textFromChildren(children))
        return (
          <h3 id={id} {...props}>
            {children}
          </h3>
        )
      },
    }),
    [],
  )

  return (
    <div
      className="modal-backdrop guidebook-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guidebook-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="guidebook-modal">
        <div className="guidebook-head">
          <div>
            <div id="guidebook-title" className="guidebook-title">
              Coding Guidebook
            </div>
            <div className="guidebook-version">v1.2 · quick reference for the tool</div>
          </div>
          <button type="button" className="close-x" onClick={onClose} aria-label="Close guidebook">
            ×
          </button>
        </div>

        <div className="guidebook-layout">
          <nav className="guidebook-toc" aria-label="Guidebook sections">
            <div className="guidebook-toc-label">Contents</div>
            {toc.map((item) => (
              <button
                key={item.id}
                type="button"
                className="guidebook-toc-link"
                onClick={() => jumpTo(item.id)}
              >
                {item.title}
              </button>
            ))}
          </nav>

          <div className="guidebook-body" ref={bodyRef}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
              {guidebookMd}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}
