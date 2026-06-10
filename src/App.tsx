export function App() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 40, maxWidth: 720, margin: '0 auto' }}>
      <h1>PANACEA ERGO v3 — scaffold</h1>
      <p>F1+F2 listo. La UI se construye en F3+ sobre estos cálculos puros.</p>
      <ul>
        <li>Vite + React 18 + TypeScript estricto</li>
        <li><code>src/lib/calc/*</code> — REBA, RULA, OWAS, NIOSH, MMC con tipos</li>
        <li><code>tests/calc/*</code> — vitest con casos canónicos</li>
      </ul>
    </main>
  )
}
