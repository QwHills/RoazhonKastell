"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MeetingStatus, TodoStatus, SubjectStatus } from "@/lib/supabase/types";
import Link from "next/link";

interface MeetingRow {
  id: string;
  title: string;
  meeting_date: string;
  summary: string | null;
  agenda: string | null;
  location: string | null;
  video_link: string | null;
  referent_id: string | null;
  starts_time: string | null;
  ends_time: string | null;
  status: MeetingStatus;
  raw_notes: string | null;
  audio_url: string | null;
  created_by: string | null;
  profiles?: { first_name: string; last_name: string } | null;
}

interface SubjectRow {
  id: string;
  meeting_id: string | null;
  proposed_by: string | null;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  sort_order: number;
  status: string;
  notes: string | null;
  profiles?: { first_name: string; last_name: string } | null;
}

interface AttendeeRow {
  id: string;
  meeting_id: string;
  user_id: string;
  response: string;
  profiles?: { first_name: string; last_name: string } | null;
}

interface TodoRow {
  id: string;
  meeting_id: string | null;
  title: string;
  assigned_to: string | null;
  due_date: string | null;
  done: boolean;
  todo_status: TodoStatus;
  progress_note: string | null;
  profiles?: { first_name: string; last_name: string } | null;
}

interface ExecMember {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  planifie: "Planifié",
  en_cours: "En cours",
  termine: "Terminé",
  archive: "Archivé",
};

const STATUS_COLORS: Record<string, string> = {
  brouillon: "bg-zinc-100 text-zinc-600",
  planifie: "bg-emerald-100 text-emerald-700",
  en_cours: "bg-red-100 text-red-700",
  termine: "bg-zinc-100 text-zinc-500",
  archive: "bg-zinc-50 text-zinc-400",
};

const SUBJECT_STATUS_LABELS: Record<string, string> = {
  propose: "Proposé",
  a_traiter: "À traiter",
  en_cours: "En cours",
  traite: "Traité",
  reporte: "Reporté",
  mis_de_cote: "Mis de côté",
};

const TODO_STATUS_LABELS: Record<string, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  bloquee: "Bloquée",
  terminee: "Terminée",
};

const TODO_STATUS_COLORS: Record<string, string> = {
  a_faire: "bg-amber-100 text-amber-700",
  en_cours: "bg-blue-100 text-blue-700",
  bloquee: "bg-red-100 text-red-700",
  terminee: "bg-emerald-100 text-emerald-700",
};

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function MeetingDetailClient({
  meeting: initMeeting,
  subjects: initSubjects,
  attendees: initAttendees,
  todos: initTodos,
  execMembers,
  userId,
}: {
  meeting: MeetingRow;
  subjects: SubjectRow[];
  attendees: AttendeeRow[];
  todos: TodoRow[];
  execMembers: ExecMember[];
  userId: string;
}) {
  const [meeting, setMeeting] = useState(initMeeting);
  const [subjects, setSubjects] = useState(initSubjects);
  const [attendees, setAttendees] = useState(initAttendees);
  const [todos, setTodos] = useState(initTodos);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showTodoForm, setShowTodoForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tf, setTf] = useState({ title: "", assigned_to: "", due_date: "" });

  // Live mode state
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [subjectTimers, setSubjectTimers] = useState<Record<string, number>>({});
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [subjectNotes, setSubjectNotes] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    initSubjects.forEach((s) => { if (s.notes) init[s.id] = s.notes; });
    return init;
  });

  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(meeting.audio_url);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Dictation (Web Speech API)
  const [dictating, setDictating] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const dictationTargetRef = useRef<string | null>(null);

  // Compte rendu
  const [generatingCR, setGeneratingCR] = useState(false);

  const isLive = meeting.status === "en_cours";
  const isFinished = meeting.status === "termine" || meeting.status === "archive";

  function getMemberName(id: string | null) {
    if (!id) return null;
    const m = execMembers.find((x) => x.id === id);
    return m ? `${m.first_name || ""} ${m.last_name || ""}`.trim() : null;
  }

  function flash(type: "success" | "error", text: string) {
    setMessage({ type, text });
    if (type === "success") setTimeout(() => setMessage(null), 4000);
  }

  const myAttendance = attendees.find((a) => a.user_id === userId);
  const presentCount = attendees.filter((a) => a.response === "present").length;
  const absentCount = attendees.filter((a) => a.response === "absent").length;
  const totalDuration = subjects.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

  // ---- Timer logic ----

  const tickTimer = useCallback(() => {
    setSubjectTimers((prev) => {
      if (!activeSubjectId) return prev;
      const current = prev[activeSubjectId] || 0;
      return { ...prev, [activeSubjectId]: current + 1 };
    });
  }, [activeSubjectId]);

  useEffect(() => {
    if (timerRunning && activeSubjectId) {
      timerRef.current = setInterval(tickTimer, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, activeSubjectId, tickTimer]);

  function startSubject(subjectId: string) {
    if (activeSubjectId && activeSubjectId !== subjectId) {
      setTimerRunning(false);
    }
    setActiveSubjectId(subjectId);
    setTimerRunning(true);
    updateSubjectStatus(subjectId, "en_cours");
  }

  function pauseTimer() {
    setTimerRunning(false);
  }

  function resumeTimer() {
    if (activeSubjectId) setTimerRunning(true);
  }

  function finishSubject(subjectId: string) {
    setTimerRunning(false);
    setActiveSubjectId(null);
    updateSubjectStatus(subjectId, "traite");
    saveSubjectNotes(subjectId);
  }

  // ---- Meeting status ----

  async function changeMeetingStatus(newStatus: MeetingStatus) {
    const res = await fetch("/api/reunions/meetings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: meeting.id, status: newStatus }),
    });
    if (res.ok) {
      const data = await res.json();
      setMeeting(data);
      flash("success", newStatus === "en_cours" ? "Réunion lancée !" : "Réunion terminée.");
    } else {
      flash("error", "Erreur lors du changement de statut.");
    }
  }

  // ---- Subject notes ----

  async function saveSubjectNotes(subjectId: string) {
    const notes = subjectNotes[subjectId] || "";
    await fetch("/api/reunions/subjects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: subjectId, notes }),
    });
    setSubjects((prev) => prev.map((s) => (s.id === subjectId ? { ...s, notes } : s)));
  }

  async function saveAllNotes() {
    for (const s of subjects) {
      if (subjectNotes[s.id] !== undefined) {
        await saveSubjectNotes(s.id);
      }
    }
    const allNotes = subjects
      .map((s) => {
        const n = subjectNotes[s.id];
        return n ? `## ${s.title}\n${n}` : null;
      })
      .filter(Boolean)
      .join("\n\n");

    if (allNotes) {
      await fetch("/api/reunions/meetings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: meeting.id, raw_notes: allNotes }),
      });
    }
    flash("success", "Notes sauvegardées !");
  }

  // ---- Attendance ----

  async function respondAttendance(response: string) {
    const res = await fetch("/api/reunions/attendees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meeting_id: meeting.id, response }),
    });
    if (res.ok) {
      const data = await res.json();
      setAttendees((prev) => {
        const idx = prev.findIndex((a) => a.user_id === userId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], response: data.response };
          return updated;
        }
        return [...prev, data];
      });
    }
  }

  async function updateSubjectStatus(id: string, status: SubjectStatus) {
    const res = await fetch("/api/reunions/subjects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    }
  }

  // ---- Todos ----

  async function updateTodoStatus(id: string, newStatus: TodoStatus) {
    const supabase = createClient();
    const done = newStatus === "terminee";
    const { error } = await supabase
      .from("meeting_todos")
      .update({ todo_status: newStatus, done, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) {
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, todo_status: newStatus, done } : t)));
    }
  }

  async function saveTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!tf.title.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("meeting_todos")
      .insert({
        title: tf.title.trim(),
        assigned_to: tf.assigned_to || null,
        due_date: tf.due_date || null,
        meeting_id: meeting.id,
        todo_status: "a_faire",
      })
      .select("*, profiles!meeting_todos_assigned_to_fkey(first_name, last_name)")
      .single();
    if (!error && data) {
      setTodos((prev) => [...prev, data]);
      setShowTodoForm(false);
      setTf({ title: "", assigned_to: "", due_date: "" });
      flash("success", "Action ajoutée !");
    } else {
      flash("error", error?.message || "Erreur");
    }
    setSaving(false);
  }

  // ---- Audio recording ----

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      flash("error", "Impossible d'accéder au microphone.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }

  async function uploadAudio() {
    if (!audioBlob) return;
    setUploadingAudio(true);
    const formData = new FormData();
    formData.append("file", audioBlob, `reunion-${meeting.id}.webm`);
    formData.append("meeting_id", meeting.id);

    const res = await fetch("/api/reunions/audio", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      setAudioUrl(data.url);
      setAudioBlob(null);
      flash("success", "Enregistrement sauvegardé !");
    } else {
      flash("error", "Erreur lors de l'envoi de l'enregistrement.");
    }
    setUploadingAudio(false);
  }

  // ---- Dictation (Web Speech API) ----

  function startDictation(subjectId: string) {
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition; webkitSpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      flash("error", "La dictée vocale n'est pas supportée par ce navigateur.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setSubjectNotes((prev) => ({
          ...prev,
          [subjectId]: (prev[subjectId] || "") + finalTranscript + " ",
        }));
      }
    };

    recognition.onerror = () => {
      setDictating(false);
      dictationTargetRef.current = null;
    };

    recognition.onend = () => {
      if (dictating && dictationTargetRef.current === subjectId) {
        try { recognition.start(); } catch { /* already ended */ }
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    dictationTargetRef.current = subjectId;
    setDictating(true);
  }

  function stopDictation() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    dictationTargetRef.current = null;
    setDictating(false);
  }

  // ---- Compte rendu IA ----

  async function generateCompteRendu() {
    setGeneratingCR(true);
    await saveAllNotes();

    const res = await fetch("/api/reunions/compte-rendu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meeting_id: meeting.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setMeeting((prev) => ({ ...prev, summary: data.summary, status: "termine" }));
      flash("success", "Compte rendu généré !");
    } else {
      flash("error", "Erreur lors de la génération du compte rendu.");
    }
    setGeneratingCR(false);
  }

  // ---- Render ----

  return (
    <div>
      {/* Back link */}
      <Link href="/espace/reunions" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 mb-4">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Retour aux réunions
      </Link>

      {message && (
        <div className={`rounded-xl p-4 mb-6 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className={`bg-white border rounded-2xl p-6 mb-6 ${isLive ? "border-red-300 ring-2 ring-red-100" : "border-zinc-200"}`}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-zinc-900">{meeting.title}</h1>
              <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium ${STATUS_COLORS[meeting.status] || STATUS_COLORS.brouillon}`}>
                {isLive && (
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse" />
                )}
                {STATUS_LABELS[meeting.status] || meeting.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-zinc-500">
              <span>
                {new Date(meeting.meeting_date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                {meeting.starts_time && ` · ${meeting.starts_time}`}
                {meeting.ends_time && ` – ${meeting.ends_time}`}
              </span>
              {meeting.location && <span>{meeting.location}</span>}
              {meeting.referent_id && <span>Référent : {getMemberName(meeting.referent_id)}</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {meeting.video_link && (
              <a href={meeting.video_link} target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700">
                Rejoindre en visio
              </a>
            )}
            {meeting.status === "planifie" && (
              <button onClick={() => changeMeetingStatus("en_cours")}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Lancer la réunion
              </button>
            )}
            {isLive && (
              <button onClick={() => { saveAllNotes(); changeMeetingStatus("termine"); }}
                className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800">
                Terminer la réunion
              </button>
            )}
          </div>
        </div>

        {/* Attendance */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-zinc-100">
          <div className="flex -space-x-2">
            {attendees.filter((a) => a.response === "present").map((a) => (
              <span key={a.id} className="w-7 h-7 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-emerald-700"
                title={a.profiles ? `${a.profiles.first_name} ${a.profiles.last_name}` : ""}>
                {a.profiles ? `${a.profiles.first_name?.[0] || ""}${a.profiles.last_name?.[0] || ""}` : "?"}
              </span>
            ))}
          </div>
          <span className="text-xs text-zinc-400">
            {presentCount} présent{presentCount > 1 ? "s" : ""} · {absentCount} absent{absentCount > 1 ? "s" : ""}
          </span>
          <div className="flex gap-1.5 ml-auto">
            {(["present", "absent"] as const).map((resp) => (
              <button key={resp} onClick={() => respondAttendance(resp)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  myAttendance?.response === resp
                    ? resp === "present" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}>
                {resp === "present" ? "Présent" : "Absent"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audio controls — visible in live or after */}
      {(isLive || audioUrl || audioBlob) && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-3">
          <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
          {isLive && !isRecording && !audioBlob && (
            <button onClick={startRecording}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-white rounded-full" />
              Enregistrer la réunion
            </button>
          )}
          {isRecording && (
            <>
              <span className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Enregistrement en cours…
              </span>
              <button onClick={stopRecording}
                className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800">
                Arrêter
              </button>
            </>
          )}
          {audioBlob && !isRecording && (
            <>
              <audio controls src={URL.createObjectURL(audioBlob)} className="h-8" />
              <button onClick={uploadAudio} disabled={uploadingAudio}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50">
                {uploadingAudio ? "Envoi…" : "Sauvegarder l'enregistrement"}
              </button>
            </>
          )}
          {audioUrl && !audioBlob && (
            <audio controls src={audioUrl} className="h-8" />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Ordre du jour */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-zinc-900">Ordre du jour</h2>
              <div className="flex items-center gap-3">
                {totalDuration > 0 && (
                  <span className="text-xs text-zinc-400">{totalDuration} min estimées</span>
                )}
                {isLive && (
                  <button onClick={saveAllNotes}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                    Sauvegarder les notes
                  </button>
                )}
              </div>
            </div>

            {subjects.length === 0 ? (
              <p className="text-sm text-zinc-400 py-6 text-center">Aucun sujet à l&apos;ordre du jour.</p>
            ) : (
              <div className="space-y-3">
                {subjects.map((s, i) => {
                  const elapsed = subjectTimers[s.id] || 0;
                  const budgetSec = (s.duration_minutes || 0) * 60;
                  const isActive = activeSubjectId === s.id;
                  const isOver = budgetSec > 0 && elapsed > budgetSec;
                  const isDone = s.status === "traite";

                  return (
                    <div key={s.id} className={`rounded-xl border p-4 transition-all ${
                      isActive ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100" :
                      isDone ? "border-emerald-200 bg-emerald-50/50" :
                      "border-zinc-100 bg-zinc-50"
                    }`}>
                      <div className="flex items-start gap-3">
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0 mt-0.5 ${
                          isDone ? "bg-emerald-500 text-white" :
                          isActive ? "bg-blue-600 text-white" :
                          "bg-zinc-900 text-white"
                        }`}>
                          {isDone ? (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          ) : i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={`text-sm font-medium ${isDone ? "text-emerald-700 line-through" : "text-zinc-800"}`}>{s.title}</p>
                              {s.description && <p className="text-xs text-zinc-500 mt-0.5">{s.description}</p>}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* Timer display */}
                              {(isLive || elapsed > 0) && (
                                <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded ${
                                  isOver ? "bg-red-100 text-red-700" :
                                  isActive ? "bg-blue-100 text-blue-700" :
                                  "bg-zinc-100 text-zinc-500"
                                }`}>
                                  {formatTimer(elapsed)}
                                  {budgetSec > 0 && ` / ${formatTimer(budgetSec)}`}
                                </span>
                              )}
                              {!isLive && (
                                <select value={s.status}
                                  onChange={(e) => updateSubjectStatus(s.id, e.target.value as SubjectStatus)}
                                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600 border-0 cursor-pointer">
                                  {Object.entries(SUBJECT_STATUS_LABELS).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </div>

                          {/* Live controls */}
                          {isLive && !isDone && (
                            <div className="flex items-center gap-2 mt-2">
                              {!isActive && (
                                <button onClick={() => startSubject(s.id)}
                                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700">
                                  Démarrer
                                </button>
                              )}
                              {isActive && timerRunning && (
                                <button onClick={pauseTimer}
                                  className="px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600">
                                  Pause
                                </button>
                              )}
                              {isActive && !timerRunning && (
                                <button onClick={resumeTimer}
                                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700">
                                  Reprendre
                                </button>
                              )}
                              {isActive && (
                                <button onClick={() => finishSubject(s.id)}
                                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700">
                                  Terminer ce sujet
                                </button>
                              )}
                            </div>
                          )}

                          {/* Notes per subject in live mode */}
                          {(isLive || (subjectNotes[s.id] && !isFinished)) && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] font-medium text-zinc-500">Notes</label>
                                {isLive && (
                                  <button
                                    onClick={() => {
                                      if (dictating && dictationTargetRef.current === s.id) {
                                        stopDictation();
                                      } else {
                                        if (dictating) stopDictation();
                                        startDictation(s.id);
                                      }
                                    }}
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium ${
                                      dictating && dictationTargetRef.current === s.id
                                        ? "bg-red-100 text-red-700"
                                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                                    }`}>
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                                    </svg>
                                    {dictating && dictationTargetRef.current === s.id ? "Arrêter" : "Dicter"}
                                  </button>
                                )}
                              </div>
                              <textarea
                                value={subjectNotes[s.id] || ""}
                                onChange={(e) => setSubjectNotes((prev) => ({ ...prev, [s.id]: e.target.value }))}
                                onBlur={() => isLive && saveSubjectNotes(s.id)}
                                rows={3}
                                readOnly={isFinished}
                                placeholder="Prendre des notes sur ce sujet…"
                                className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                              />
                            </div>
                          )}

                          {/* Show saved notes for finished meetings */}
                          {isFinished && s.notes && (
                            <div className="mt-2 px-3 py-2 bg-zinc-100 rounded-lg">
                              <p className="text-[11px] font-medium text-zinc-500 mb-1">Notes</p>
                              <p className="text-xs text-zinc-600 whitespace-pre-wrap">{s.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Compte rendu */}
          {meeting.summary && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-5">
              <h2 className="font-semibold text-zinc-900 mb-3">Compte rendu</h2>
              <div className="prose prose-sm prose-zinc max-w-none text-sm text-zinc-600 whitespace-pre-wrap">
                {meeting.summary}
              </div>
            </div>
          )}

          {/* Generate CR button */}
          {(isLive || meeting.status === "termine") && !meeting.summary && (
            <button onClick={generateCompteRendu} disabled={generatingCR}
              className="w-full py-3 bg-zinc-900 text-white rounded-2xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              {generatingCR ? "Génération du compte rendu…" : "Générer le compte rendu avec l'IA"}
            </button>
          )}
        </div>

        {/* Sidebar (1/3) */}
        <div className="space-y-4">
          {/* Présences */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5">
            <h3 className="font-semibold text-zinc-900 mb-3 text-sm">Présences</h3>
            <div className="space-y-1.5">
              {attendees.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-1">
                  <span className="text-sm text-zinc-700">
                    {a.profiles ? `${a.profiles.first_name} ${a.profiles.last_name}` : "Membre"}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${
                    a.response === "present" ? "bg-emerald-500" : a.response === "absent" ? "bg-red-400" : "bg-zinc-300"
                  }`} title={a.response === "present" ? "Présent" : a.response === "absent" ? "Absent" : "En attente"} />
                </div>
              ))}
              {attendees.length === 0 && (
                <p className="text-xs text-zinc-400 py-2 text-center">Aucun membre invité.</p>
              )}
            </div>
          </div>

          {/* Actions de cette réunion */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-zinc-900 text-sm">Actions</h3>
              <button onClick={() => { setTf({ title: "", assigned_to: "", due_date: "" }); setShowTodoForm(true); }}
                className="text-xs text-zinc-500 hover:text-zinc-700">+ Ajouter</button>
            </div>

            {showTodoForm && (
              <form onSubmit={saveTodo} className="mb-3 space-y-2 bg-zinc-50 rounded-xl p-3">
                <input type="text" required value={tf.title}
                  onChange={(e) => setTf({ ...tf, title: e.target.value })}
                  placeholder="Titre de l'action"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900" />
                <select value={tf.assigned_to} onChange={(e) => setTf({ ...tf, assigned_to: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900">
                  <option value="">Responsable...</option>
                  {execMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                  ))}
                </select>
                <input type="date" value={tf.due_date} onChange={(e) => setTf({ ...tf, due_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900" />
                <div className="flex gap-2">
                  <button type="submit" disabled={saving}
                    className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-semibold disabled:opacity-50">
                    {saving ? "…" : "Ajouter"}
                  </button>
                  <button type="button" onClick={() => setShowTodoForm(false)}
                    className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs">Annuler</button>
                </div>
              </form>
            )}

            {todos.length === 0 ? (
              <p className="text-xs text-zinc-400 py-2 text-center">Aucune action.</p>
            ) : (
              <div className="space-y-2">
                {todos.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-zinc-50 last:border-0">
                    <div className="min-w-0">
                      <p className={`text-sm truncate ${t.done ? "text-zinc-400 line-through" : "text-zinc-700"}`}>{t.title}</p>
                      {t.profiles && <p className="text-[11px] text-zinc-400">{t.profiles.first_name} {t.profiles.last_name}</p>}
                    </div>
                    <select value={t.todo_status || "a_faire"}
                      onChange={(e) => updateTodoStatus(t.id, e.target.value as TodoStatus)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border-0 cursor-pointer flex-shrink-0 ${TODO_STATUS_COLORS[t.todo_status] || TODO_STATUS_COLORS.a_faire}`}>
                      {Object.entries(TODO_STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audio */}
          {audioUrl && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-5">
              <h3 className="font-semibold text-zinc-900 text-sm mb-3">Enregistrement</h3>
              <audio controls src={audioUrl} className="w-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
