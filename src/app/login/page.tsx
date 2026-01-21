export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="max-w-md w-full mx-auto p-8">
        <h1 className="text-3xl font-bold text-white mb-4">Sign In</h1>
        <p className="text-white/70 mb-8">
          Welcome back to Alcaster. Sign in to access your family vault.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
              placeholder="••••••••"
            />
          </div>
          <button className="w-full bg-white text-black rounded-full px-6 py-3 font-semibold transition-all hover:bg-white/90">
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
