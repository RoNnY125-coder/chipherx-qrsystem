
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#080b18] text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-white/10">
        <h1 className="text-2xl font-bold tracking-wider text-cyan-400">
          CIPHERX
        </h1>

        <a href="#about" className="text-gray-300 hover:text-cyan-400">
          About
        </a>
      </nav>

      {/* Hero Section */}
      <section className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <p className="mb-5 text-sm font-semibold tracking-[0.4em] text-cyan-400">
          CIPHERX ATTENDANCE SYSTEM
        </p>

        <h2 className="max-w-4xl text-5xl font-extrabold leading-tight md:text-7xl">
          SCAN. <span className="text-cyan-400">VERIFY.</span> GO.
        </h2>

        <p className="mt-6 max-w-xl text-lg text-gray-400">
          Welcome to CipherX! Scan your unique QR code received
          through email to mark your event attendance.
        </p>

        <Link
          href="/scanner"
          className="mt-10 rounded-lg bg-cyan-400 px-8 py-4 font-bold text-black transition hover:bg-cyan-300"
        >
          Scan Attendance QR →
        </Link>

        <p className="mt-5 text-sm text-gray-500">
          No login required. Just scan your QR code.
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
              title: "Receive Your QR",
              description: "Get your unique QR code through email."
            },
            {
              number: "02",
              title: "Scan Your QR",
              description: "Open the website scanner and scan your QR code."
            },
            {
              number: "03",
              title: "Mark Attendance",
              description: "Your QR code will be verified and attendance recorded."
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


