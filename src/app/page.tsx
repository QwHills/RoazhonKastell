import { Suspense } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Lieu from "@/components/Lieu";
import Adhesions from "@/components/Adhesions";
import Adherents from "@/components/Adherents";
import Partenaires from "@/components/Partenaires";
import Evenements from "@/components/Evenements";
import Videos from "@/components/Videos";
import Contact from "@/components/Contact";
import Inscriptions from "@/components/Inscriptions";
import FloatingCTA from "@/components/FloatingCTA";
import Footer from "@/components/Footer";
import DevChecks from "@/components/DevChecks";

export default function Home() {
  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <main>
        <Hero />
        <Lieu />
        <Evenements />
        <Adhesions />
        <Adherents />
        <Partenaires />
        <Videos />
        <Contact />
        <Inscriptions />
      </main>
      <Footer />
      <FloatingCTA />
      <DevChecks />
    </>
  );
}
