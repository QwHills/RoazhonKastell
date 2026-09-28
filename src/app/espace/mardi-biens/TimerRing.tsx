"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface TimerRingProps {
  sessionId: string;
  timerState: { status: string; remaining_ms: number; started_at: string | null };
  onFinish?: () => void;
  onSync?: (state: { status: string; remaining_ms: number; started_at: string | null }) => void;
  compact?: boolean;
}

const TOTAL_MS = 60000;
const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function TimerRing({ sessionId, timerState, onFinish, onSync, compact }: TimerRingProps) {
  const [remaining, setRemaining] = useState(timerState.remaining_ms);
  const [status, setStatus] = useState(timerState.status);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const startRemainingRef = useRef<number>(0);

  useEffect(() => {
    setStatus(timerState.status);
    if (timerState.status === "running" && timerState.started_at) {
      const serverStart = new Date(timerState.started_at).getTime();
      const elapsed = Date.now() - serverStart;
      const left = Math.max(0, timerState.remaining_ms - elapsed);
      setRemaining(left);
      startTimeRef.current = Date.now();
      startRemainingRef.current = left;
    } else {
      setRemaining(timerState.remaining_ms);
    }
  }, [timerState]);

  const tick = useCallback(() => {
    if (status !== "running") return;
    const elapsed = Date.now() - startTimeRef.current;
    const left = Math.max(0, startRemainingRef.current - elapsed);
    setRemaining(left);
    if (left <= 0) {
      setStatus("finished");
      onFinish?.();
      return;
    }
    animRef.current = requestAnimationFrame(tick);
  }, [status, onFinish]);

  useEffect(() => {
    if (status === "running") {
      startTimeRef.current = Date.now();
      startRemainingRef.current = remaining;
      animRef.current = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [status, tick]);

  async function timerAction(action: string) {
    const res = await fetch("/api/mardi/timer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, action }),
    });
    if (res.ok) {
      const data = await res.json();
      onSync?.(data.timer);
    }
  }

  const secs = Math.ceil(remaining / 1000);
  const progress = remaining / TOTAL_MS;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const isUrgent = remaining <= 10000 && remaining > 0;

  const ringColor = status === "finished"
    ? "stroke-zinc-300"
    : isUrgent
      ? "stroke-orange-500"
      : "stroke-zinc-900";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={"relative " + (compact ? "w-24 h-24" : "w-36 h-36")}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="currentColor" strokeWidth="6" className="text-zinc-100" />
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className={`${ringColor} transition-colors duration-300`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${compact ? 'text-xl' : 'text-3xl'} font-bold tabular-nums ${isUrgent && status !== "finished" ? "text-orange-500" : "text-zinc-900"}`}>
            {secs}s
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        {(status === "ready" || status === "paused") && (
          <button
            onClick={() => timerAction(status === "ready" ? "start" : "resume")}
            className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            {status === "ready" ? "Démarrer la minute" : "Reprendre"}
          </button>
        )}
        {status === "running" && (
          <button
            onClick={() => timerAction("pause")}
            className="px-4 py-2 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Pause
          </button>
        )}
        {status === "finished" && (
          <span className="px-4 py-2 text-sm font-medium text-zinc-400">Temps écoulé</span>
        )}
      </div>
    </div>
  );
}
