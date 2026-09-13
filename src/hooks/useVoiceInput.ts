import { useCallback, useEffect, useRef, useState } from "react"

import {
  isWebSpeechSupported,
  pickRecorderMimeType,
  startWebSpeechRecognition,
} from "@/lib/speechRecognition"
import { transcribeBatchChatAudio } from "@/lib/request"

export type VoiceInputStatus =
  | "idle"
  | "listening"
  | "recording"
  | "transcribing"
  | "unsupported"

type Options = {
  token: string | null
  farmId: number
  flockId: number
  disabled?: boolean
  /** Called with final transcript (Web Speech or Whisper). */
  onTranscript: (text: string) => void
  onError?: (message: string) => void
}

/**
 * Hybrid voice input: Web Speech first; MediaRecorder + Whisper fallback.
 */
export function useVoiceInput({
  token,
  farmId,
  flockId,
  disabled = false,
  onTranscript,
  onError,
}: Options) {
  const [status, setStatus] = useState<VoiceInputStatus>("idle")
  const [interim, setInterim] = useState("")
  const stopSpeechRef = useRef<(() => void) | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const preferWhisperRef = useRef(false)
  const onTranscriptRef = useRef(onTranscript)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  const cleanupMedia = useCallback(() => {
    mediaRecorderRef.current = null
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop())
      mediaStreamRef.current = null
    }
    chunksRef.current = []
  }, [])

  const stop = useCallback(() => {
    if (stopSpeechRef.current) {
      stopSpeechRef.current()
      stopSpeechRef.current = null
    }
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop()
      } catch {
        cleanupMedia()
        setStatus("idle")
        setInterim("")
      }
      return
    }
    cleanupMedia()
    setStatus("idle")
    setInterim("")
  }, [cleanupMedia])

  useEffect(() => () => stop(), [stop])

  const startWhisperRecording = useCallback(async () => {
    if (!token) {
      onErrorRef.current?.("You must be signed in to use voice input.")
      return
    }
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported")
      onErrorRef.current?.("Microphone recording is not supported in this browser.")
      return
    }

    preferWhisperRef.current = true

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      const mimeType = pickRecorderMimeType()
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        const blobType = recorder.mimeType || mimeType || "audio/webm"
        const blob = new Blob(chunksRef.current, { type: blobType })
        cleanupMedia()
        setInterim("")

        if (blob.size < 500) {
          setStatus("idle")
          onErrorRef.current?.("No speech captured. Try again.")
          return
        }

        setStatus("transcribing")
        const ext = blobType.includes("mp4") ? "mp4" : blobType.includes("ogg") ? "ogg" : "webm"
        const res = await transcribeBatchChatAudio(token, farmId, flockId, blob, `voice.${ext}`)
        if (res.success && res.data?.text?.trim()) {
          onTranscriptRef.current(res.data.text.trim())
          setStatus("idle")
        } else {
          setStatus("idle")
          const msg = Array.isArray(res.error) ? res.error[0] : undefined
          onErrorRef.current?.(msg || "Could not transcribe audio.")
        }
      }

      recorder.start()
      setStatus("recording")
    } catch {
      cleanupMedia()
      setStatus("idle")
      onErrorRef.current?.("Microphone permission denied.")
    }
  }, [token, farmId, flockId, cleanupMedia])

  const startWebSpeech = useCallback(() => {
    try {
      stopSpeechRef.current = startWebSpeechRecognition({
        onInterim: (text) => setInterim(text),
        onFinal: (text) => {
          setInterim("")
          if (text.trim()) {
            onTranscriptRef.current(text.trim())
          }
        },
        onError: (code) => {
          stopSpeechRef.current = null
          if (code === "not-allowed" || code === "service-not-allowed") {
            setStatus("idle")
            setInterim("")
            onErrorRef.current?.("Microphone permission denied.")
            return
          }
          if (code === "no-speech") {
            setStatus("idle")
            setInterim("")
            onErrorRef.current?.("No speech detected. Try again.")
            return
          }
          if (code === "aborted") {
            setStatus("idle")
            setInterim("")
            return
          }
          void startWhisperRecording()
        },
        onEnd: () => {
          stopSpeechRef.current = null
          setStatus((s) => (s === "listening" ? "idle" : s))
        },
      })
      setStatus("listening")
    } catch {
      void startWhisperRecording()
    }
  }, [startWhisperRecording])

  const toggle = useCallback(() => {
    if (disabled) return
    if (status === "listening" || status === "recording") {
      stop()
      return
    }
    if (status === "transcribing") return

    if (preferWhisperRef.current || !isWebSpeechSupported()) {
      void startWhisperRecording()
      return
    }
    startWebSpeech()
  }, [disabled, status, stop, startWebSpeech, startWhisperRecording])

  return {
    status,
    interim,
    isActive: status === "listening" || status === "recording" || status === "transcribing",
    toggle,
    stop,
  }
}
