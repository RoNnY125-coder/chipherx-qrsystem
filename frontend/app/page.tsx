
export default function Home() {
  return (
    <main className="min-h-screen bg-[#080b18] text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-white/10">
        <h1 className="text-2xl font-bold tracking-wider text-cyan-400">
          CIPHERX
        </h1>

        <div className="flex gap-6 items-center">
          <a href="#about" className="text-gray-300 hover:text-cyan-400">
            About
          </a>
          <a href="/login" className="rounded-lg border border-cyan-400 px-5 py-2 hover:bg-cyan-400 hover:text-black">
            Login
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <p className="mb-5 text-sm font-semibold tracking-[0.4em] text-cyan-400">
          THE ULTIMATE TECH TREASURE HUNT
        </p>

        <h2 className="max-w-4xl text-5xl font-extrabold leading-tight md:text-7xl">
          THINK. SCAN. <span className="text-cyan-400">SOLVE.</span>
        </h2>

        <p className="mt-6 max-w-xl text-lg text-gray-400">
          Follow the clues, scan the checkpoints, solve the challenges
          and race your way to the top of the leaderboard.
        </p>

        <a
          href="/register"
          className="mt-10 rounded-lg bg-cyan-400 px-8 py-4 font-bold text-black transition hover:bg-cyan-300"
        >
          Join the Hunt →
        </a>

        <p className="mt-5 text-sm text-gray-500">
          Your adventure begins here.
        </p>
      </section>

      {/* About Section */}
      <section id="about" className="px-8 py-16 text-center">
        <h3 className="text-3xl font-bold">
          How It Works
        </h3>

        <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-3">
          {[
            {
              number: "01",
              title: "Find the Clue",
              description: "Explore the event venue and discover checkpoints."
            },
            {
              number: "02",
              title: "Scan & Solve",
              description: "Scan QR codes and solve the challenges."
            },
            {
              number: "03",
              title: "Climb the Ranks",
              description: "Earn points and compete on the leaderboard."
            }
          ].map((step) => (
            <div
              key={step.number}
              className="rounded-xl border border-white/10 bg-white/5 p-7"
            >
              <p className="text-3xl font-bold text-cyan-400">
                {step.number}
              </p>
              <h4 className="mt-4 text-xl font-semibold">
                {step.title}
              </h4>
              <p className="mt-3 text-gray-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-6 text-center text-sm text-gray-500">
        © 2026 CipherX. All rights reserved.
      </footer>
    </main>
  );
}
