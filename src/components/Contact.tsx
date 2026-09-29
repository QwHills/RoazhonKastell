export default function Contact() {
  return (
    <section id="contact" className="pt-2 pb-12 sm:pb-14 bg-zinc-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Nous contacter</h2>
        <p className="mt-3 text-zinc-500">Une question ? Écrivez-nous.</p>
        <a
          href="mailto:gianni.schiariti@iadfrance.fr?subject=Contact%20Roazhon%20Kastell"
          className="mt-6 inline-block px-10 py-4 bg-zinc-900 text-white font-semibold rounded-3xl hover:bg-zinc-800 transition-colors"
        >
          Nous contacter
        </a>
      </div>
    </section>
  );
}
