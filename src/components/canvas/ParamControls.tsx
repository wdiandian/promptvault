import { useState, useRef, useEffect } from 'react'
import { Settings2 } from 'lucide-react'
import type { ModelParameter } from '../../types/canvas/schema'

interface ParamControlsProps {
  parameters: ModelParameter[]
  values: Record<string, string | number | boolean>
  onChange: (key: string, value: string | number | boolean) => void
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [enabled, onClose, ref])
}

function ParamRow({
  param,
  current,
  onChange,
}: {
  param: ModelParameter
  current: string | number | boolean
  onChange: (v: string | number | boolean) => void
}) {
  const options = param.options ?? []

  if (param.type === 'switch') {
    const on = current === true || current === 'true' || current === 1
    return (
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-zinc-400">{param.label}</span>
        <button
          onClick={() => onChange(on ? 'false' : 'true')}
          className={`relative w-8 h-4 rounded-full transition-colors nodrag ${on ? 'bg-white/20' : 'bg-white/[0.07]'}`}
        >
          <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${on ? 'left-4' : 'left-0.5'}`} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] text-zinc-500">{param.label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => {
          const active = String(opt.value) === String(current)
          return (
            <button
              key={String(opt.value)}
              onClick={() => onChange(opt.value)}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors nodrag ${
                active
                  ? 'bg-white/15 text-white'
                  : 'bg-white/[0.04] text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function ParamControls({ parameters, values, onChange }: ParamControlsProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false), open)

  const visible = parameters.filter((p) => {
    if (!p.showIf) return true
    return String(values[p.showIf.field]) === String(p.showIf.equals)
  })

  if (visible.length === 0) return null

  const summary = visible.map((p) => {
    const opts = p.options ?? []
    const cur = values[p.key] ?? p.default
    return opts.find(o => String(o.value) === String(cur))?.label ?? String(cur)
  }).join(' · ')

  return (
    <div ref={ref} className="relative nodrag">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] transition-colors nodrag ${
          open ? 'bg-white/10 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
        }`}
      >
        <Settings2 size={11} className="shrink-0" />
        <span className="max-w-[160px] truncate">{summary}</span>
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 z-50 w-56 bg-[#1e1e1e] border border-white/[0.08] rounded-2xl shadow-2xl p-3 flex flex-col gap-3 nodrag">
          {visible.map((param) => (
            <ParamRow
              key={param.key}
              param={param}
              current={values[param.key] ?? param.default}
              onChange={(v) => onChange(param.key, v)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
