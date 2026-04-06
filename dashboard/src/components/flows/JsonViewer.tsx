import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

function highlight(json: string): string {
  return json
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, match => {
      let cls = 'text-sky-300'           // number
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'text-violet-300' : 'text-emerald-300'  // key vs string
      } else if (/true|false/.test(match)) {
        cls = 'text-amber-300'
      } else if (/null/.test(match)) {
        cls = 'text-[var(--text-tertiary)]'
      }
      return `<span class="${cls}">${match}</span>`
    })
}

interface Props {
  data: unknown
  collapsed?: boolean
  maxHeight?: number
}

export default function JsonViewer({ data, collapsed = false, maxHeight = 300 }: Props) {
  const [open, setOpen] = useState(!collapsed)

  const json = JSON.stringify(data, null, 2)
  const lineCount = json.split('\n').length

  if (lineCount <= 3 && !collapsed) {
    return (
      <pre
        className="text-[11px] font-mono bg-[var(--bg-sidebar)] border border-[var(--border-default)] rounded-lg px-3 py-2 overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: highlight(json) }}
      />
    )
  }

  return (
    <div className="bg-[var(--bg-sidebar)] border border-[var(--border-default)] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-page)]/40 transition-colors"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <span className="font-mono text-[var(--text-tertiary)]">{open ? 'Recolher' : `Ver JSON (${lineCount} linhas)`}</span>
      </button>
      {open && (
        <div style={{ maxHeight }} className="overflow-auto">
          <pre
            className="text-[11px] font-mono px-3 pb-3 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: highlight(json) }}
          />
        </div>
      )}
    </div>
  )
}
