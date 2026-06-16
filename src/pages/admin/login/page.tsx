'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()

      if (data.success) {
        // Login successful, redirect to admin dashboard
        router.push('/admin')
      } else {
        setError('Galt password hai!')
      }
    } catch (err) {
      setError('Kuch error aaya hai')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1120]">
      <div className="bg-[#13293D] p-8 rounded-2xl border border-[#1E3A52] w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-white mb-6">Admin Login 🔒</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#0B1120] border border-[#1E3A52] rounded-xl text-white focus:outline-none focus:border-[#F5A623]"
              required
            />
          </div>
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F5A623] hover:bg-[#e6951a] text-black font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}