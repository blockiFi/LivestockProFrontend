export type SpeechRecognitionResultLike = {
  isFinal: boolean
  0: { transcript: string }
}

export type SpeechRecognitionEventLike = {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}

export type SpeechRecognitionErrorEventLike = {
  error: string
}

export type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

export function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function isWebSpeechSupported(): boolean {
  return getSpeechRecognitionConstructor() !== null
}

export type WebSpeechHandlers = {
  onInterim?: (text: string) => void
  onFinal?: (text: string) => void
  onError?: (code: string) => void
  onEnd?: () => void
  lang?: string
}

/**
 * Starts browser Web Speech recognition. Returns a stop function.
 * Throws if unsupported.
 */
export function startWebSpeechRecognition(handlers: WebSpeechHandlers): () => void {
  const Ctor = getSpeechRecognitionConstructor()
  if (!Ctor) {
    throw new Error("unsupported")
  }

  const recognition = new Ctor()
  recognition.continuous = false
  recognition.interimResults = true
  recognition.lang = handlers.lang || "en-NG"

  let finalTranscript = ""
  let emitted = false

  recognition.onresult = (event) => {
    let interim = ""
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i]
      const piece = result[0]?.transcript ?? ""
      if (result.isFinal) {
        finalTranscript += `${piece} `
      } else {
        interim += piece
      }
    }
    if (interim) handlers.onInterim?.(interim)
    else if (finalTranscript.trim()) handlers.onInterim?.(finalTranscript.trim())
  }

  recognition.onerror = (event) => {
    handlers.onError?.(event.error || "unknown")
  }

  recognition.onend = () => {
    const text = finalTranscript.trim()
    if (text && !emitted) {
      emitted = true
      handlers.onFinal?.(text)
    }
    handlers.onEnd?.()
  }

  recognition.start()

  return () => {
    try {
      recognition.onresult = null
      recognition.onerror = null
      // Keep onend so final transcript can still emit once
      recognition.stop()
    } catch {
      try {
        recognition.abort()
      } catch {
        // ignore
      }
    }
  }
}

export function pickRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]
  return candidates.find((t) => MediaRecorder.isTypeSupported(t))
}
