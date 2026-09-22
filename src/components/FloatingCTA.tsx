"use client";

import { useEffect, useState } from "react";

export default function FloatingCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <a
      href="#adhesions"
      className="fixed bottom-6 right-6 z-50 px-6 py-3 bg-zinc-900 text-white font-semibold rounded-3xl shadow-2xl hover:bg-zinc-800 hover:scale-105 transition-all duration-200"
    >
      Adhérer
    </a>
  );
}
