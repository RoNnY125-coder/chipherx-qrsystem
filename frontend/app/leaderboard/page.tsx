
const teams = [
  { rank: 1, name: "Team Alpha", points: 500 },
  { rank: 2, name: "Team Beta", points: 420 },
  { rank: 3, name: "Team Gamma", points: 350 },
  { rank: 4, name: "Team Delta", points: 280 },
];

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen bg-[#080b18] p-6 text-white md:p-10">
      <nav className="flex items-center justify-between border-b border-white/10 pb-6">
        <h1 className="text-2xl font-bold tracking-wider text-cyan-400">
          CIPHERX
        </h1>
        <a href="/dashboard" className="text-sm text-gray-400 hover:text-cyan-400">
          Back to Dashboard
        </a>
      </nav>

      <section className="mx-auto mt-12 max-w-3xl">
        <p className="text-center text-sm tracking-widest text-cyan-400">
          LIVE RANKINGS
        </p>

        <h2 className="mt-3 text-center text-4xl font-bold">
          Leaderboard
        </h2>

        <p className="mt-3 text-center text-gray-400">
          See how teams are performing in the treasure hunt.
        </p>

        <div className="mt-10 space-y-4">
          {teams.map((team) => (
            <div
              key={team.rank}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex items-center gap-5">
                <span className="text-2xl font-bold text-cyan-400">
                  #{team.rank}
                </span>
                <div>
                  <h3 className="font-semibold">{team.name}</h3>
                  <p className="text-sm text-gray-400">Team Ranking</p>
                </div>
              </div>

              <span className="font-bold text-cyan-400">
                {team.points} pts
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5 text-center">
          <p className="text-gray-300">
            Rankings will update when connected to the backend.
          </p>
        </div>
      </section>
    </main>
  );
}
