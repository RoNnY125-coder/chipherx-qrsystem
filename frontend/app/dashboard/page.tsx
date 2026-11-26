
const checkpoints = [
  { id: 1, name: "Checkpoint 01", status: "Completed", points: 100 },
  { id: 2, name: "Checkpoint 02", status: "Completed", points: 100 },
  { id: 3, name: "Checkpoint 03", status: "Pending", points: 0 },
  { id: 4, name: "Checkpoint 04", status: "Locked", points: 0 },
];

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-[#080b18] p-6 text-white md:p-10">

      {/* Header */}
      <nav className="flex items-center justify-between border-b border-white/10 pb-6">
        <h1 className="text-2xl font-bold tracking-wider text-cyan-400">
          CIPHERX
        </h1>
        <a href="/login" className="text-sm text-gray-400 hover:text-cyan-400">
          Logout
        </a>
      </nav>

      {/* Welcome */}
      <section className="mt-10">
        <p className="text-sm tracking-widest text-cyan-400">
          PARTICIPANT DASHBOARD
        </p>
        <h2 className="mt-3 text-3xl font-bold">
          Welcome, Team Alpha!
        </h2>
        <p className="mt-2 text-gray-400">
          Your treasure hunt journey starts here.
        </p>
      </section>

      {/* Stats */}
      <section className="mt-8 grid gap-5 sm:grid-cols-3">
        {[
          { label: "Total Score", value: "200 pts" },
          { label: "Completed", value: "2 / 4" },
          { label: "Current Rank", value: "#03" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-gray-400">{stat.label}</p>
            <h3 className="mt-3 text-3xl font-bold text-cyan-400">
              {stat.value}
            </h3>
          </div>
        ))}
      </section>
      {/* Overall Progress */}
<section className="mt-10 rounded-xl border border-white/10 bg-white/5 p-6">
  <div className="flex justify-between items-center">
    <h3 className="text-lg font-bold">Overall Progress</h3>
    <span className="text-cyan-400 font-semibold">50%</span>
  </div>

  <div className="mt-4 h-3 w-full rounded-full bg-gray-700">
    <div className="h-3 w-1/2 rounded-full bg-cyan-400"></div>
  </div>

  <p className="mt-3 text-sm text-gray-400">
    2 out of 4 checkpoints completed
  </p>
</section>

      {/* Checkpoints */}
      <section className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-2xl font-bold">Your Checkpoints</h3>
          <a
            href="/scanner"
            className="rounded-lg bg-cyan-400 px-5 py-3 font-bold text-black hover:bg-cyan-300"
          >
            Scan QR Code →
          </a>
        </div>

        <div className="mt-6 space-y-4">
          {checkpoints.map((checkpoint) => (
            <div
              key={checkpoint.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-5"
            >
              <div>
                <h4 className="font-semibold">{checkpoint.name}</h4>
                <p className="mt-1 text-sm text-gray-400">
                  {checkpoint.points} points earned
                </p>
              </div>

              <span className={`rounded-full px-4 py-2 text-sm ${
                checkpoint.status === "Completed"
                  ? "bg-green-500/15 text-green-400"
                  : checkpoint.status === "Pending"
                  ? "bg-yellow-500/15 text-yellow-400"
                  : "bg-gray-500/15 text-gray-400"
              }`}>
                {checkpoint.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Leaderboard */}
      <section className="mt-10 rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-xl font-bold">Want to see the competition?</h3>
        <p className="mt-2 text-gray-400">
          Check where your team stands against others.
        </p>
        <a href="/leaderboard" className="mt-4 inline-block font-semibold text-cyan-400 hover:underline">
          View Leaderboard →
        </a>
      </section>

    </main>
  );
}

