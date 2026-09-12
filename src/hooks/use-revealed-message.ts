"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Message } from "@/src/types/chat.types"

/** Total time the reveal should take, however long the reply is. */
const REVEAL_DURATION_MS = 600
const FRAME_MS = 25

/**
 * Reveals an already-received assistant message progressively.
 *
 * The API returns the whole reply in one response, so this is presentation only: it
 * keeps a long answer from slamming into view in a single frame. The duration is
 * fixed rather than per-character, so a long reply is not punished with extra delay
 * on top of the time the model already took.
 *
 * `reveal` resolves with the full text still displayed. The caller is expected to
 * append the real message and call `cancel` together, so React batches both and the
 * reply never blinks out between the two.
 *
 * Real token-by-token streaming needs a streaming endpoint on the API; this hook is
 * the seam where that would plug in.
 */
export function useRevealedMessage() {
  const [revealing, setRevealing] = useState<Message | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Never leave a timer running against an unmounted component.
  useEffect(() => stop, [stop])

  const reveal = useCallback(
    (message: Message) =>
      new Promise<void>((resolve) => {
        stop()

        const full = message.content ?? ""
        if (!full) {
          setRevealing(null)
          resolve()
          return
        }

        const steps = Math.max(1, Math.round(REVEAL_DURATION_MS / FRAME_MS))
        const perStep = Math.max(1, Math.ceil(full.length / steps))
        let shown = 0

        setRevealing({ ...message, content: "" })

        timerRef.current = setInterval(() => {
          shown = Math.min(shown + perStep, full.length)
          setRevealing({ ...message, content: full.slice(0, shown) })

          if (shown >= full.length) {
            stop()
            resolve()
          }
        }, FRAME_MS)
      }),
    [stop]
  )

  const cancel = useCallback(() => {
    stop()
    setRevealing(null)
  }, [stop])

  return { revealing, reveal, cancel }
}
