import { useState } from 'react'
import { Copy, Check, Link } from 'lucide-react'

interface Props {
  url: string
  compact?: boolean
}

export default function WebhookUrlCopy({ url, compact = false }: Props) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (compact) {
    return (
      <button
        onClick={handleCopy}
        title={copied ? 'Copiado!' : 'Copiar URL'}
        className={`flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded transition-colors ${
          copied ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? 'Copiado!' : 'Copiar URL'}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
      <Link className="h-3.5 w-3.5 text-slate-500 shrink-0" />
      <code className="flex-1 text-xs text-slate-400 font-mono truncate">{url}</code>
      <button
        onClick={handleCopy}
        className={`shrink-0 flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
          copied
            ? 'text-emerald-400 bg-emerald-500/10'
            : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
        }`}
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? 'Copiado!' : 'Copiar'}
      </button>
    </div>
  )
}
