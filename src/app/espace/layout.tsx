import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import Sidebar from "@/components/espace/Sidebar";

export const metadata = {
  title: "Mon espace — Roazhon Kastell",
  robots: { index: false, follow: false },
};

export default async function EspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentUser();

  if (!profile) {
    redirect("/?login=1");
  }

  if (profile.member_status === "en_attente") {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-3">Compte en attente de validation</h1>
          <p className="text-zinc-500 leading-relaxed">
            Votre compte a bien été créé. Un responsable doit valider votre accès
            avant que vous puissiez utiliser l&apos;espace membres.
          </p>
          <p className="text-sm text-zinc-400 mt-4">
            Vous recevrez un email une fois votre compte activé.
          </p>
          <a
            href="/"
            className="inline-block mt-8 px-6 py-2.5 bg-zinc-900 text-white rounded-2xl text-sm font-semibold hover:bg-zinc-800 transition-colors"
          >
            Retour à l&apos;accueil
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Sidebar profile={profile} />
      <div className="lg:pl-64">
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
