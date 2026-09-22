"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (authError) {
      setError("Une erreur est survenue. Vérifiez votre email et réessayez.");
      return;
    }

    setSent(true);
  }

  function handleClose() {
    setEmail("");
    setSent(false);
    setError("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-600"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {sent ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-3">Vérifiez votre boîte mail</h2>
            <p className="text-zinc-500 leading-relaxed">
              Un lien de connexion a été envoyé à <strong className="text-zinc-700">{email}</strong>.
              Cliquez dessus pour accéder à votre espace.
            </p>
            <p className="text-sm text-zinc-400 mt-4">
              Pensez à vérifier vos spams si vous ne voyez rien.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-zinc-900 mb-2">Mon espace</h2>
              <p className="text-zinc-500">
                Connectez-vous avec votre adresse email.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Adresse email
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.fr"
                  className="w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition placeholder:text-zinc-400"
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-zinc-900 text-white font-semibold rounded-2xl hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Envoi en cours…
                  </span>
                ) : (
                  "Recevoir un lien de connexion"
                )}
              </button>
            </form>

            <p className="text-xs text-zinc-400 text-center mt-6">
              Pas de mot de passe nécessaire. Un lien sécurisé vous sera envoyé par email.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
