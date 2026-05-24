function App() {
  return (
    <div className="flex h-screen">
      <aside className="w-48 bg-gray-800 p-4 border-r border-gray-700">
        <h2 className="text-sm font-bold text-gray-400 uppercase mb-4">Groups</h2>
        <p className="text-gray-500 text-sm">Loading...</p>
      </aside>
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">Claude Launcher</h1>
        <p className="text-gray-400">Projects will appear here.</p>
      </main>
    </div>
  )
}

export default App
