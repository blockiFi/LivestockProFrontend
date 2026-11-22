import { Fragment, useEffect, useRef, useState, type ReactElement } from "react"
import { useSelector } from "react-redux"
import { Loader2, MessageCircle, RotateCcw, Send } from "lucide-react"
import type { RootState } from "@/store"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { sendEggCellChat, type CellChatMessage } from "@/lib/eggCollection"

interface CellInsightsChatProps {
  flockId: number
  date: string
  windowDays: number
  /** Cell labels on the map (A1, B12...), so labels in answers can be tapped. */
  knownLabels: Set<string>
  onCells: (labels: string[]) => void
  /** Ready-made questions shown before the first message. */
  suggestions: string[]
}

/** Chat about the selected day's cell collection. The conversation lives here and resets when the day changes. */
export default function CellInsightsChat({ flockId, date, windowDays, knownLabels, onCells, suggestions }: CellInsightsChatProps) {
  const token = useSelector((s: RootState) => s.authentication.token)
  const farmId = useSelector((s: RootState) => s.authentication.activeFarm?.id)
  const [messages, setMessages] = useState<CellChatMessage[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setMessages([])
    setError(null)
  }, [date, windowDays, flockId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [messages, sending])

  const send = async (text: string) => {
    const question = text.trim()
    if (!question || sending || !token || !farmId) return
    const next: CellChatMessage[] = [...messages, { role: "user", content: question }]
    setMessages(next)
    setInput("")
    setSending(true)
    setError(null)
    const res = await sendEggCellChat(token, farmId, flockId, { date, window: windowDays, messages: next })
    setSending(false)
    if (res.success && res.data?.reply) {
      setMessages([...next, { role: "assistant", content: res.data.reply }])
    } else {
      setError(
        res.success ? "The AI couldn't be reached just now. Try again in a moment." : res.error?.join(", ") || "Failed to get a reply"
      )
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <MessageCircle className="h-4 w-4 text-sky-600" /> Ask about this day's collection
        </div>
        {messages.length > 0 && (
          <Button type="button" size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => setMessages([])} disabled={sending}>
            <RotateCcw className="h-3 w-3" /> New chat
          </Button>
        )}
      </div>

      <div className="max-h-[420px] space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-slate-500">
              Ask anything about the cells, rows or trend, for example why a row dropped or how a cell has done this week.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void send(q)}
                  className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs text-sky-900 hover:bg-sky-100"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
                m.role === "user" ? "bg-slate-900 text-white" : "border border-slate-200 bg-slate-50 text-slate-800"
              )}
            >
              {m.role === "user" ? (
                <span className="whitespace-pre-wrap">{m.content}</span>
              ) : (
                <Answer text={m.content} knownLabels={knownLabels} onCells={onCells} />
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
          </div>
        )}
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div ref={endRef} />
      </div>

      <form
        className="flex items-end gap-2 border-t border-slate-100 p-3"
        onSubmit={(e) => {
          e.preventDefault()
          void send(input)
        }}
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              void send(input)
            }
          }}
          rows={1}
          maxLength={4000}
          placeholder="e.g. Which cells in row C dropped this week?"
          className="min-h-[40px] resize-none"
        />
        <Button type="submit" disabled={sending || !input.trim()} className="h-10 gap-1">
          <Send className="h-4 w-4" /> Send
        </Button>
      </form>
    </div>
  )
}

/** Renders a reply: "- " bullets, **bold**, and cell labels as buttons that highlight the cell on the map. */
function Answer({ text, knownLabels, onCells }: { text: string; knownLabels: Set<string>; onCells: (labels: string[]) => void }) {
  const inline = (line: string, key: string) =>
    line.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
      const bold = part.startsWith("**") && part.endsWith("**")
      const body = bold ? part.slice(2, -2) : part
      const pieces = body.split(/\b([A-Z]{1,2}\d{1,3})\b/g).map((p, j) =>
        knownLabels.has(p) ? (
          <button
            key={j}
            type="button"
            onClick={() => onCells([p])}
            className="rounded bg-sky-100 px-1 font-semibold text-sky-900 hover:bg-sky-200"
            title={`Show ${p} on the map`}
          >
            {p}
          </button>
        ) : (
          <Fragment key={j}>{p}</Fragment>
        )
      )
      return bold ? (
        <strong key={`${key}-${i}`}>{pieces}</strong>
      ) : (
        <Fragment key={`${key}-${i}`}>{pieces}</Fragment>
      )
    })

  const lines = text.split("\n")
  const blocks: ReactElement[] = []
  let bullets: string[] = []
  const flush = () => {
    if (bullets.length) {
      const items = bullets
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="list-disc space-y-0.5 pl-4">
          {items.map((b, i) => (
            <li key={i}>{inline(b, `li-${blocks.length}-${i}`)}</li>
          ))}
        </ul>
      )
      bullets = []
    }
  }
  lines.forEach((raw, i) => {
    const line = raw.trimEnd()
    const bullet = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/)
    if (bullet) {
      bullets.push(bullet[1])
      return
    }
    flush()
    if (line.trim()) blocks.push(<p key={`p-${i}`}>{inline(line.replace(/^#+\s*/, ""), `p-${i}`)}</p>)
  })
  flush()
  return <div className="space-y-1.5 leading-relaxed">{blocks}</div>
}
