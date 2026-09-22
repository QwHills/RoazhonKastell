"use client";

import { useState } from "react";

interface Video {
  titre: string;
  description: string;
  youtubeId?: string;
  auteur?: string;
}

const videos: Video[] = [
  {
    titre: "De soldat à leader international",
    description: "Comment il a bâti une équipe de 85 personnes. Un parcours inspirant, de l'armée au leadership dans l'immobilier.",
    youtubeId: "SbLDu_e5IUg",
    auteur: "Peter Gibaud",
  },
  {
    titre: "Les secrets d'un courtier top performer",
    description: "Florian Morgant, courtier en financement immobilier, partage ses méthodes et ses secrets pour performer.",
    youtubeId: "g2f_1oKMEYU",
    auteur: "Florian Morgant",
  },
  {
    titre: "Ancien cavalier pro, aujourd'hui entrepreneur",
    description: "Entre les deux ? Un mindset hors norme. Hugo Prin, ancien cavalier professionnel devenu entrepreneur, partage son parcours atypique.",
    youtubeId: "VIpuQLvFqsk",
    auteur: "Hugo Prin",
  },
  {
    titre: "Elle a eu le courage d'entreprendre à 22 ans",
    description: "Océane Pirault, conseillère IAD, partage son parcours et son courage d'entreprendre à seulement 22 ans.",
    youtubeId: "IKgsRVcrWM4",
    auteur: "Océane Pirault",
  },
  {
    titre: "De salariée à conseillère indépendante",
    description: "Aurélie Peltier, conseillère IAD, raconte comment elle a quitté le salariat pour se lancer dans l'immobilier en toute indépendance.",
    youtubeId: "x4JFoSnqUrg",
    auteur: "Aurélie Peltier",
  },
];

function VideoCard({ video }: { video: Video }) {
  const [playing, setPlaying] = useState(false);
  const isReal = !!video.youtubeId;

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden hover:shadow-lg transition-shadow">
      {/* Thumbnail / Player */}
      <div className="relative aspect-video bg-zinc-100">
        {isReal && playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={video.titre}
          />
        ) : isReal ? (
          <button
            onClick={() => setPlaying(true)}
            className="absolute inset-0 w-full h-full group cursor-pointer"
          >
            <img
              src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`}
              alt={video.titre}
              className="w-full h-full object-cover"
            />
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-zinc-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </button>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-zinc-200 flex items-center justify-center">
              <svg className="w-8 h-8 text-zinc-400 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="absolute top-3 right-3 bg-zinc-900 text-white text-xs font-semibold px-3 py-1 rounded-full">
              À venir
            </span>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-zinc-900">{video.titre}</h3>
        {video.auteur && (
          <p className="mt-1 text-sm font-medium text-zinc-600">{video.auteur}</p>
        )}
        <p className="mt-2 text-sm text-zinc-500 leading-relaxed">{video.description}</p>
      </div>
    </div>
  );
}

export default function Videos() {
  return (
    <section id="videos" className="py-20 sm:py-28 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
            Vidéos témoignages
          </h2>
          <p className="mt-4 text-zinc-500 text-lg max-w-2xl mx-auto">
            Des vidéos réalisées par les conseillers du réseau pour partager leur expérience et leur quotidien.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <VideoCard key={video.titre} video={video} />
          ))}
        </div>
      </div>
    </section>
  );
}
