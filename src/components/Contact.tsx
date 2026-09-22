export default function Contact() {
  return (
    <section id="contact" className="py-20 sm:py-28 bg-zinc-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">Nous contacter</h2>
        <p className="mt-4 text-zinc-500 text-lg">Une question ? Écrivez-nous.</p>
        <a
          href="mailto:roazhonkastell@gmail.com?subject=Contact%20Roazhon%20Kastell"
          className="mt-8 inline-block px-10 py-4 bg-zinc-900 text-white font-semibold rounded-3xl hover:bg-zinc-800 transition-colors text-lg"
        >
          Nous contacter
        </a>
      </div>
    </section>
  );
}
