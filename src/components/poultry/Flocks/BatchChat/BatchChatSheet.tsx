import { useCallback, useEffect, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"
import {
  Brain,
  Check,
  History,
  Loader2,
  MessageSquarePlus,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"

import { AiGate } from "@/components/general/AiGate"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { RootState } from "@/store"
import type {
  BatchChatMessage,
  BatchChatPendingAction,
  BatchChatSessionSummary,
} from "@/lib/types"
import {
  cancelBatchChatAction,
  clearBatchChatMemories,
  confirmBatchChatAction,
  createBatchChatSession,
  deleteBatchChatSession,
  getBatchChatMessages,
  listBatchChatMemories,
  listBatchChatSessions,
  sendBatchChatMessage,
} from "@/lib/request"

type Props = {
  isOpen: boolean
  onClose: () => void
  farmId: number
  flockId: number
  flockName?: string
  batchNumber?: string
  onRefreshNeeded?: () => void
}

const SUGGESTIONS = [
  "What's my available egg stock?",
  "Summarize mortality this week",
  "What's the profit and loss for this batch?",
  "Record today's egg collection",
]

function relativeTime(value?: string | null) {
  if (!value) return ""
  const t = new Date(value).getTime()
  if (Number.isNaN(t)) return ""
  const diff = Date.now() - t
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function BatchChatSheet({
  isOpen,
  onClose,
  farmId,
  flockId,
  flockName,
  batchNumber,
  onRefreshNeeded,
}: Props) {
  const token = useSelector((state: RootState) => state.authentication.token)

  const [sessions, setSessions] = useState<BatchChatSessionSummary[]>([])
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [messages, setMessages] = useState<BatchChatMessage[]>([])
  const [pending, setPending] = useState<BatchChatPendingAction[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [memoryCount, setMemoryCount] = useState(0)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, pending, loading])

  const loadMemories = useCallback(async () => {
    if (!token) return
    const res = await listBatchChatMemories(token, farmId, flockId)
    if (res.success && res.data) {
      setMemoryCount(res.data.memories.length)
    }
  }, [token, farmId, flockId])

  const loadSessions = useCallback(async () => {
    if (!token) return [] as BatchChatSessionSummary[]
    const res = await listBatchChatSessions(token, farmId, flockId)
    if (res.success && res.data) {
      setSessions(res.data.sessions)
      return res.data.sessions
    }
    return []
  }, [token, farmId, flockId])

  const openSession = useCallback(
    async (id: number) => {
      if (!token) return
      setBootstrapping(true)
      try {
        const res = await getBatchChatMessages(token, farmId, flockId, id)
        if (res.success && res.data) {
          setSessionId(id)
          setMessages(res.data.messages)
          const lastAssistant = [...res.data.messages]
            .reverse()
            .find((m) => m.role === "assistant" && m.pending_actions?.length)
          setPending(lastAssistant?.pending_actions ?? [])
        } else {
          toast.error(res.error?.[0] || "Could not load chat")
        }
      } finally {
        setBootstrapping(false)
      }
    },
    [token, farmId, flockId]
  )

  const startNewChat = useCallback(async () => {
    if (!token) return
    setBootstrapping(true)
    try {
      const res = await createBatchChatSession(token, farmId, flockId)
      if (res.success && res.data) {
        setSessionId(res.data.id)
        setMessages([])
        setPending([])
        await loadSessions()
      } else {
        toast.error(res.error?.[0] || "Could not start chat")
      }
    } finally {
      setBootstrapping(false)
    }
  }, [token, farmId, flockId, loadSessions])

  useEffect(() => {
    if (!isOpen || !token) return
    let cancelled = false
    ;(async () => {
      setBootstrapping(true)
      try {
        const list = await loadSessions()
        await loadMemories()
        if (cancelled) return
        const latestActive = list.find((s) => s.status === "active") ?? list[0]
        if (latestActive) {
          await openSession(latestActive.id)
        } else {
          await startNewChat()
        }
      } finally {
        if (!cancelled) setBootstrapping(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isOpen, token, farmId, flockId]) // eslint-disable-line react-hooks/exhaustive-deps

  const applyTurn = (data: {
    messages: BatchChatMessage[]
    pending_actions?: BatchChatPendingAction[]
    refresh?: string[]
    session?: BatchChatSessionSummary
  }) => {
    setMessages(data.messages)
    setPending(data.pending_actions ?? [])
    if (data.session?.id) setSessionId(data.session.id)
    if (data.refresh && data.refresh.length > 0) {
      onRefreshNeeded?.()
    }
    void loadSessions()
    void loadMemories()
  }

  const send = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || !token || !sessionId || loading) return
    setInput("")
    setLoading(true)
    // Optimistic user bubble
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: "user",
        content,
        created_at: new Date().toISOString(),
      },
    ])
    try {
      const res = await sendBatchChatMessage(token, farmId, flockId, sessionId, content)
      if (res.success && res.data) {
        applyTurn(res.data)
      } else {
        toast.error(res.error?.[0] || "Failed to send message")
      }
    } finally {
      setLoading(false)
    }
  }

  const confirmAction = async (actionId: string) => {
    if (!token || !sessionId) return
    setLoading(true)
    try {
      const res = await confirmBatchChatAction(token, farmId, flockId, sessionId, actionId)
      if (res.success && res.data) {
        applyTurn(res.data)
        if (res.data.tool_result?.ok === false) {
          toast.error(res.data.tool_result.message || "Action failed")
        } else {
          toast.success(res.data.tool_result?.message || "Action confirmed")
        }
      } else {
        toast.error(res.error?.[0] || "Could not confirm")
      }
    } finally {
      setLoading(false)
    }
  }

  const cancelAction = async (actionId: string) => {
    if (!token || !sessionId) return
    setLoading(true)
    try {
      const res = await cancelBatchChatAction(token, farmId, flockId, sessionId, actionId)
      if (res.success && res.data) {
        applyTurn(res.data)
      } else {
        toast.error(res.error?.[0] || "Could not cancel")
      }
    } finally {
      setLoading(false)
    }
  }

  const removeSession = async (id: number) => {
    if (!token) return
    const res = await deleteBatchChatSession(token, farmId, flockId, id)
    if (res.success) {
      const list = await loadSessions()
      if (sessionId === id) {
        if (list[0]) await openSession(list[0].id)
        else await startNewChat()
      }
    }
  }

  const clearMemories = async () => {
    if (!token) return
    const res = await clearBatchChatMemories(token, farmId, flockId)
    if (res.success) {
      setMemoryCount(0)
      toast.success("Batch memories cleared")
    } else {
      toast.error(res.error?.[0] || "Could not clear memories")
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col gap-0 h-full max-h-screen">
        <SheetHeader className="px-4 py-3 border-b border-slate-200 space-y-1 text-left">
          <div className="flex items-center justify-between gap-2 pr-6">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              Batch Assistant
            </SheetTitle>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 px-2"
                onClick={() => setShowHistory((v) => !v)}
              >
                <History className="h-4 w-4" />
              </Button>
              <Button type="button" size="sm" variant="ghost" className="h-8 px-2" onClick={() => void startNewChat()}>
                <MessageSquarePlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <SheetDescription className="text-xs">
            {flockName || "Flock"}
            {batchNumber ? ` · ${batchNumber}` : ""} — ask questions or propose record actions
          </SheetDescription>
          {memoryCount > 0 && (
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <Brain className="h-3.5 w-3.5" />
              Remembered {memoryCount} note{memoryCount === 1 ? "" : "s"}
              <button type="button" className="underline hover:text-slate-800" onClick={() => void clearMemories()}>
                Clear
              </button>
            </div>
          )}
        </SheetHeader>

        <AiGate>
          <div className="flex flex-1 min-h-0">
            {showHistory && (
              <div className="w-44 border-r border-slate-200 bg-slate-50/80 flex flex-col">
                <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  History
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div className="px-2 pb-3 space-y-1">
                    {sessions.map((s) => (
                      <div
                        key={s.id}
                        className={cn(
                          "group rounded-md px-2 py-1.5 text-left text-xs cursor-pointer",
                          sessionId === s.id ? "bg-emerald-100 text-emerald-900" : "hover:bg-white"
                        )}
                      >
                        <button type="button" className="w-full text-left" onClick={() => void openSession(s.id)}>
                          <div className="font-medium truncate">{s.title || "New chat"}</div>
                          <div className="text-[10px] text-slate-500">{relativeTime(s.last_message_at)}</div>
                        </button>
                        <button
                          type="button"
                          className="opacity-0 group-hover:opacity-100 mt-1 text-rose-600"
                          onClick={() => void removeSession(s.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {bootstrapping ? (
                  <div className="flex items-center justify-center py-16 text-slate-500 text-sm gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading chat…
                  </div>
                ) : messages.length === 0 ? (
                  <div className="space-y-4 py-6">
                    <p className="text-sm text-slate-600">
                      Ask anything about this batch — stock, performance, schedules, P&amp;L — or request an action.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => void send(s)}
                          className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-800 hover:bg-emerald-100"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[90%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                            m.role === "user"
                              ? "bg-emerald-600 text-white rounded-br-md"
                              : "bg-slate-100 text-slate-800 rounded-bl-md"
                          )}
                        >
                          {m.content}
                        </div>
                      </div>
                    ))}
                    {pending.length > 0 && (
                      <div className="space-y-2">
                        {pending.map((action) => (
                          <div
                            key={action.id}
                            className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-950"
                          >
                            <p className="text-xs font-medium">{action.summary}</p>
                            <div className="mt-2 flex gap-2">
                              <Button
                                size="sm"
                                className="h-7 bg-emerald-600 hover:bg-emerald-700"
                                disabled={loading}
                                onClick={() => void confirmAction(action.id)}
                              >
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7"
                                disabled={loading}
                                onClick={() => void cancelAction(action.id)}
                              >
                                <X className="h-3.5 w-3.5 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {loading && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Thinking…
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 p-3 space-y-2">
                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about this batch…"
                    className="min-h-[44px] max-h-28 resize-none text-sm"
                    disabled={loading || !sessionId}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        void send()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    className="shrink-0 bg-emerald-600 hover:bg-emerald-700"
                    disabled={loading || !input.trim() || !sessionId}
                    onClick={() => void send()}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </AiGate>
      </SheetContent>
    </Sheet>
  )
}
