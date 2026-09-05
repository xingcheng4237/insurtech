import { useEffect, useState } from 'react'

function App() {
  const [health, setHealth] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || '/api'
    fetch(`${apiUrl}/v1/health`)
      .then(r => r.json())
      .then(setHealth)
      .catch(e => setError(e.message))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">Insurtech Platform</h1>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Welcome to Insurtech</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Insurance Technology platform for policy management and claims processing.
          </p>
          
          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded">
            <h3 className="font-medium mb-2">Backend Health</h3>
            {health ? (
              <pre className="text-sm text-green-600 dark:text-green-400">
                {JSON.stringify(health, null, 2)}
              </pre>
            ) : error ? (
              <p className="text-red-500">Error: {error}</p>
            ) : (
              <p className="text-gray-500">Loading...</p>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-500">
            <p>Domain: www.chengxing.org</p>
            <p>Frontend: React 18 + TypeScript + Tailwind CSS</p>
            <p>Backend: Java 17 + Spring Boot 3.x</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
