import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";

export function LoginScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");
  const [usernameInput, setUsernameInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    setLoading(true);
    setError("");
    try {
      const user = await api.createUser(usernameInput.trim());
      sessionStorage.setItem("currentUser", JSON.stringify(user));
      navigate(redirect || "/lobby");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="w-full max-w-sm p-8 bg-gray-800 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold mb-2">Nero Party</h1>
        <p className="text-gray-400 mb-6">Enter your username to get started</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Your username"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            autoFocus
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !usernameInput.trim()}
            className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 font-semibold transition disabled:opacity-50"
          >
            {loading ? "Joining…" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
