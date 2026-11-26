
export default function Register() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080b18] px-5 py-10 text-white">

      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl">

        <h1 className="text-center text-3xl font-bold text-cyan-400">
          CIPHERX
        </h1>

        <h2 className="mt-6 text-center text-2xl font-bold">
          Join the Hunt
        </h2>

        <p className="mt-2 text-center text-gray-400">
          Register your team and begin your adventure.
        </p>

        <form className="mt-8 space-y-5">

          <div>
            <label className="mb-2 block text-sm">Team Name</label>
            <input
              type="text"
              placeholder="Enter your team name"
              className="w-full rounded-lg border border-white/10 bg-[#111629] p-3 outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm">Team Leader Name</label>
            <input
              type="text"
              placeholder="Enter leader name"
              className="w-full rounded-lg border border-white/10 bg-[#111629] p-3 outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm">Email Address</label>
            <input
              type="email"
              placeholder="Enter email"
              className="w-full rounded-lg border border-white/10 bg-[#111629] p-3 outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm">Password</label>
            <input
              type="password"
              placeholder="Create password"
              className="w-full rounded-lg border border-white/10 bg-[#111629] p-3 outline-none focus:border-cyan-400"
            />
          </div>

          <button
            type="button"
            className="w-full rounded-lg bg-cyan-400 py-3 font-bold text-black transition hover:bg-cyan-300"
          >
            Create Team Account
          </button>

        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already registered?{" "}
          <a href="/login" className="text-cyan-400 hover:underline">
            Login
          </a>
        </p>

      </div>
    </main>
  );
}

