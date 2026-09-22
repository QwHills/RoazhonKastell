"use client";

import { useEffect } from "react";

export default function DevChecks() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const sections = ["accueil", "lieu", "adhesions", "adherents", "partenaires", "videos", "contact", "inscriptions"];
    sections.forEach((id) => {
      console.assert(
        document.getElementById(id) !== null,
        `Section #${id} manquante`
      );
    });

    const allLinks = Array.from(document.querySelectorAll("a"));
    const ctaInscription = allLinks.filter((a) => a.textContent?.trim() === "Je m'inscris");
    console.assert(ctaInscription.length === 4, `Il devrait y avoir 4 CTA "Je m'inscris", trouvé: ${ctaInscription.length}`);

    const pageText = document.body.textContent || "";
    console.assert(pageText.includes("19,99€"), 'Le texte "19,99€" est manquant');
    console.assert(pageText.includes("TTC"), 'Le texte "TTC" est manquant');
    console.assert(pageText.includes("RIB"), 'Le texte "RIB" est manquant');

    // Adherents checks
    console.assert(pageText.includes("Nos adhérents"), 'Section "Nos adhérents" manquante');
    const memberCards = document.querySelectorAll("#adherents .grid > div");
    console.assert(memberCards.length > 0, "Aucune carte adhérent affichée");

    // Hero background check
    const heroSection = document.getElementById("accueil");
    const heroImg = heroSection?.querySelector("img");
    console.assert(heroImg !== null, "Image de fond du Hero manquante");

    console.log("Dev checks passed.");
  }, []);

  return null;
}
