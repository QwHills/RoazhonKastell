"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TYPE_LABELS: Record<string, string> = {
  vente_partage: "Vente partagée",
  dossier_partenaire: "Dossier partenaire",
  coup_de_pouce: "Coup de pouce",
};

const ORIGIN_LABELS: Record<string, string> = {
  mardi_presentation: "Mardi présentation",
  mardi_recherche: "Mardi recherche",
  mardi_conseil: "Mardi conseil",
  rencontre_chateau: "Rencontre au château",
  autre: "Autre",
};

const STAGE_LABELS: Record<string, string> = {
  en_cours: "En cours",
  compromis: "Compromis signé",
  vente_definitive: "Vente définitive",
  finalise: "Finalisé",
  annule: "Annulé",
};

const STATUS_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  soumis: "Soumis",
  confirme: "Confirmé",
  publie: "Publié",
  refuse: "Refusé",
  retire: "Retiré",
};

const STATUS_COLORS: Record<string, string> = {
  brouillon: "bg-zinc-100 text-zinc-600",
  soumis: "bg-blue-50 text-blue-700",
  confirme: "bg-green-50 text-green-700",
  publie: "bg-emerald-50 text-emerald-700",
  refuse: "bg-red-50 text-red-700",
  retire: "bg-zinc-100 text-zinc-400",
};

type Participant = {
  id: string;
  user_id: string | null;
  partner_id: string | null;
  role: string;
  confirmation_status: string;
  confirmation_note: string | null;
  publish_consent: boolean;
  anonymized_consent: boolean;
  confirmed_at: string | null;
};

type SuccessRow = {
  id: string;
  type: string;
  title: string;
  story: string | null;
  origin: string;
  stage: string;
  stage_date: string | null;
  photo_url: string | null;
  status: string;
  featured: boolean;
  admin_note: string | null;
  declared_by: string;
  created_at: string;
  updated_at: string;
  success_participants: Participant[];
};

interface Props {
  successes: SuccessRow[];
  profileMap: Record<string, { first_name: string; last_name: string; photo_url: string | null }>;
  partnerMap: Record<string, string>;
  financialMap: Record<string, {
    total_fees: number | null;
    share_percent: number;
    calculated_amount: number | null;
    actual_amount: number | null;
    encashment_date: string | null;
  }>;
  userId: string;
  isAdmin: boolean;
  myParticipationIds: string[];
}

type Tab = "reseau" | "mes_declarations" | "bilan";

export default function ReussitesClient({
  successes,
  profileMap,
  partnerMap,
  financialMap,
  userId,
  isAdmin,
  myParticipationIds,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("reseau");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const myDeclarations = successes.filter((s) => s.declared_by === userId);
  const networkSuccesses = successes.filter((s) => s.status === "publie");

  const bilanItems = successes.filter((s) => myParticipationIds.includes(s.id) && financialMap[s.id]);

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "reseau", label: "Réseau", count: networkSuccesses.length },
    { key: "mes_declarations", label: "Mes déclarations", count: myDeclarations.length },
    { key: "bilan", label: "Mon bilan" },
  ];

  function getParticipantName(p: Participant): string {
    if (p.user_id && profileMap[p.user_id]) {
      const prof = profileMap[p.user_id];
      return `${prof.first_name} ${prof.last_name}`;
    }
    if (p.partner_id && partnerMap[p.partner_id]) {
      return partnerMap[p.partner_id];
    }
    return "Inconnu";
  }

  async function handleUnpublish(successId: string) {
    setLoading(true);
    await fetch("/api/successes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: successId, action: "unpublish" }),
    });
    setLoading(false);
    router.refresh();
  }

  async function handleFeature(successId: string) {
    setLoading(true);
    await fetch("/api/successes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: successId, action: "feature" }),
    });
    setLoading(false);
    router.refresh();
  }

  const totalFees = Object.values(financialMap).reduce((sum, f) => {
    if (f.total_fees && f.share_percent) {
      return sum + f.total_fees * (f.share_percent / 100) * 0.80 * 0.69;
    }
    return sum;
  }, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Les réussites</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Déclarez et suivez les réussites issues du collectif.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Déclarer
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-zinc-100 rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="ml-1.5 text-xs text-zinc-400">({t.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "reseau" && (
        <div className="space-y-4">
          {networkSuccesses.length === 0 ? (
            <EmptyState text="Aucune réussite publiée pour le moment." />
          ) : (
            networkSuccesses.map((s) => (
              <SuccessCard
                key={s.id}
                s={s}
                getParticipantName={getParticipantName}
                isAdmin={isAdmin}
                onUnpublish={handleUnpublish}
                onFeature={handleFeature}
                loading={loading}
              />
            ))
          )}
        </div>
      )}

      {tab === "mes_declarations" && (
        <div className="space-y-4">
          {myDeclarations.length === 0 ? (
            <EmptyState text="Vous n'avez pas encore déclaré de réussite." />
          ) : (
            myDeclarations.map((s) => (
              <SuccessCard
                key={s.id}
                s={s}
                getParticipantName={getParticipantName}
                isAdmin={isAdmin}
                onUnpublish={handleUnpublish}
                onFeature={handleFeature}
                loading={loading}
                showStatus
              />
            ))
          )}
        </div>
      )}

      {tab === "bilan" && (
        <div>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 text-center">
              <p className="text-3xl font-bold text-zinc-900">
                {myParticipationIds.length}
              </p>
              <p className="mt-1 text-sm text-zinc-500">Réussites</p>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 text-center">
              <p className="text-3xl font-bold text-zinc-900">
                {myDeclarations.length}
              </p>
              <p className="mt-1 text-sm text-zinc-500">Déclarées</p>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 text-center">
              <p className="text-3xl font-bold text-emerald-600">
                {totalFees > 0
                  ? `${totalFees.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €`
                  : "—"}
              </p>
              <p className="mt-1 text-sm text-zinc-500">Gains estimés nets</p>
            </div>
          </div>
          <div className="space-y-4">
            {bilanItems.length === 0 ? (
              <EmptyState text="Aucune donnée financière renseignée." />
            ) : (
              bilanItems.map((s) => {
                const fin = financialMap[s.id];
                const net =
                  fin.total_fees && fin.share_percent
                    ? fin.total_fees * (fin.share_percent / 100) * 0.80 * 0.69
                    : null;
                return (
                  <div key={s.id} className="bg-white rounded-2xl border border-zinc-200 p-6">
                    <h3 className="font-semibold text-zinc-900">{s.title}</h3>
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-zinc-400">Honoraires totaux</p>
                        <p className="font-medium text-zinc-700">
                          {fin.total_fees ? `${fin.total_fees.toLocaleString("fr-FR")} €` : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-400">Part</p>
                        <p className="font-medium text-zinc-700">{fin.share_percent}%</p>
                      </div>
                      <div>
                        <p className="text-zinc-400">Net estimé</p>
                        <p className="font-medium text-emerald-600">
                          {net ? `${net.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €` : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-400">Encaissement</p>
                        <p className="font-medium text-zinc-700">
                          {fin.encashment_date
                            ? new Date(fin.encashment_date).toLocaleDateString("fr-FR")
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Declaration form modal */}
      {showForm && (
        <DeclarationForm
          profileMap={profileMap}
          partnerMap={partnerMap}
          userId={userId}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-16">
      <svg className="w-12 h-12 text-zinc-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0116.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.98 6.98 0 01-2.77.952m-4.998 0a6.98 6.98 0 01-2.77-.952" />
      </svg>
      <p className="text-zinc-400">{text}</p>
    </div>
  );
}

function SuccessCard({
  s,
  getParticipantName,
  isAdmin,
  onUnpublish,
  onFeature,
  loading,
  showStatus,
}: {
  s: SuccessRow;
  getParticipantName: (p: Participant) => string;
  isAdmin: boolean;
  onUnpublish: (id: string) => void;
  onFeature: (id: string) => void;
  loading: boolean;
  showStatus?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600">
              {TYPE_LABELS[s.type] || s.type}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-50 text-zinc-400">
              {STAGE_LABELS[s.stage] || s.stage}
            </span>
            {showStatus && (
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[s.status] || "bg-zinc-100 text-zinc-600"}`}>
                {STATUS_LABELS[s.status] || s.status}
              </span>
            )}
            {s.featured && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                Mise en avant
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-zinc-900">{s.title}</h3>
          {s.story && <p className="mt-2 text-sm text-zinc-500 line-clamp-2">{s.story}</p>}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(s.success_participants || []).map((p) => (
              <span key={p.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-zinc-50 text-xs text-zinc-600 border border-zinc-100">
                {getParticipantName(p)}
                {p.confirmation_status === "confirme" && (
                  <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                )}
              </span>
            ))}
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            {ORIGIN_LABELS[s.origin] || s.origin}
            {s.stage_date && ` — ${new Date(s.stage_date).toLocaleDateString("fr-FR")}`}
          </div>
        </div>
        {isAdmin && s.status === "publie" && (
          <div className="flex gap-2">
            <button
              onClick={() => onUnpublish(s.id)}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              Dépublier
            </button>
            <button
              onClick={() => onFeature(s.id)}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              Mettre en avant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DeclarationForm({
  profileMap,
  partnerMap,
  userId,
  onClose,
  onCreated,
}: {
  profileMap: Record<string, { first_name: string; last_name: string; photo_url: string | null }>;
  partnerMap: Record<string, string>;
  userId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [origin, setOrigin] = useState("mardi_presentation");
  const [stage, setStage] = useState("en_cours");
  const [stageDate, setStageDate] = useState("");
  const [binomeId, setBinomeId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [totalFees, setTotalFees] = useState("");
  const [sharePercent, setSharePercent] = useState("50");
  const [submitting, setSubmitting] = useState(false);

  const availableProfiles = Object.entries(profileMap)
    .filter(([id, p]) => id !== userId && p.first_name)
    .sort((a, b) => a[1].first_name.localeCompare(b[1].first_name));

  const availablePartners = Object.entries(partnerMap).sort((a, b) =>
    a[1].localeCompare(b[1]),
  );

  const net =
    totalFees && sharePercent
      ? parseFloat(totalFees) * (parseFloat(sharePercent) / 100) * 0.80 * 0.69
      : 0;

  async function handleSubmit(asDraft: boolean) {
    setSubmitting(true);
    const participants: { user_id?: string; partner_id?: string; role: string }[] = [];
    if (binomeId) participants.push({ user_id: binomeId, role: "binome" });
    if (partnerId) participants.push({ partner_id: partnerId, role: "partenaire" });

    const body: Record<string, unknown> = {
      type,
      title,
      story: story || null,
      origin,
      stage,
      stage_date: stageDate || null,
      participants,
      submit: !asDraft,
    };
    if (type === "vente_partage" && totalFees) {
      body.financials = {
        total_fees: parseFloat(totalFees),
        share_percent: parseFloat(sharePercent) || 50,
      };
    }

    await fetch("/api/successes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSubmitting(false);
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-zinc-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold text-zinc-900">Déclarer une réussite</h2>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-zinc-900" : "bg-zinc-200"}`}
              />
            ))}
          </div>

          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Type de réussite
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { value: "vente_partage", label: "Vente partagée", desc: "Inter-cabinet avec partage d'honoraires" },
                    { value: "dossier_partenaire", label: "Dossier partenaire", desc: "Collaboration avec un partenaire du réseau" },
                    { value: "coup_de_pouce", label: "Coup de pouce", desc: "Aide d'un collègue sur un dossier" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setType(opt.value)}
                      className={`text-left px-4 py-3 rounded-xl border transition-colors ${
                        type === opt.value
                          ? "border-zinc-900 bg-zinc-50"
                          : "border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      <p className="text-sm font-medium text-zinc-900">{opt.label}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Titre</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex : Vente appartement T3 Saint-Grégoire"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
                />
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!type || !title}
                className="w-full py-2.5 text-sm font-semibold text-white bg-zinc-900 rounded-xl hover:bg-zinc-800 disabled:opacity-40 transition-colors"
              >
                Suivant
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Origine</label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                >
                  {Object.entries(ORIGIN_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Avancement</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                >
                  {Object.entries(STAGE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Date (optionnel)</label>
                <input
                  type="date"
                  value={stageDate}
                  onChange={(e) => setStageDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  {type === "vente_partage" ? "Binôme" : type === "dossier_partenaire" ? "Partenaire" : "Collègue"}
                </label>
                {type === "dossier_partenaire" ? (
                  <select
                    value={partnerId}
                    onChange={(e) => setPartnerId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  >
                    <option value="">Sélectionner un partenaire</option>
                    {availablePartners.map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={binomeId}
                    onChange={(e) => setBinomeId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  >
                    <option value="">Sélectionner un conseiller</option>
                    {availableProfiles.map(([id, p]) => (
                      <option key={id} value={id}>{p.first_name} {p.last_name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Témoignage (optionnel)</label>
                <textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  rows={3}
                  placeholder="Racontez comment cette réussite est née du collectif..."
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={() => setStep(type === "vente_partage" ? 3 : 3)}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors"
                >
                  Suivant
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              {type === "vente_partage" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                      Honoraires totaux (€)
                    </label>
                    <input
                      type="number"
                      value={totalFees}
                      onChange={(e) => setTotalFees(e.target.value)}
                      placeholder="Ex : 8000"
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                      Votre part (%)
                    </label>
                    <input
                      type="number"
                      value={sharePercent}
                      onChange={(e) => setSharePercent(e.target.value)}
                      min={0}
                      max={100}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                    />
                  </div>
                  {net > 0 && (
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                      <p className="text-sm text-emerald-700">
                        Gain net estimé :{" "}
                        <span className="font-bold">
                          {net.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €
                        </span>
                      </p>
                      <p className="text-xs text-emerald-500 mt-1">
                        Calcul : {totalFees} € × {sharePercent}% × 0,80 × 0,69
                      </p>
                    </div>
                  )}
                </>
              )}
              <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                <h3 className="text-sm font-semibold text-zinc-700 mb-2">Récapitulatif</h3>
                <dl className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-zinc-400">Type</dt>
                    <dd className="text-zinc-700">{TYPE_LABELS[type]}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-400">Titre</dt>
                    <dd className="text-zinc-700">{title}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-400">Origine</dt>
                    <dd className="text-zinc-700">{ORIGIN_LABELS[origin]}</dd>
                  </div>
                  {binomeId && profileMap[binomeId] && (
                    <div className="flex justify-between">
                      <dt className="text-zinc-400">Avec</dt>
                      <dd className="text-zinc-700">
                        {profileMap[binomeId].first_name} {profileMap[binomeId].last_name}
                      </dd>
                    </div>
                  )}
                  {partnerId && partnerMap[partnerId] && (
                    <div className="flex justify-between">
                      <dt className="text-zinc-400">Partenaire</dt>
                      <dd className="text-zinc-700">{partnerMap[partnerId]}</dd>
                    </div>
                  )}
                </dl>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-2.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={submitting}
                  className="flex-1 py-2.5 text-sm font-medium text-zinc-700 border border-zinc-300 rounded-xl hover:bg-zinc-50 transition-colors disabled:opacity-50"
                >
                  Brouillon
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={submitting}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  Publier
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
