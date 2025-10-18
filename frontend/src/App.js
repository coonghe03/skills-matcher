import { useEffect, useState } from 'react';

function App() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/health')
      .then(r => r.json())
      .then(setHealth)
      .catch(() => setHealth({ ok: false }));
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, Arial' }}>
      <h1>Skills Matcher</h1>
      <p>React (frontend) + Node/Express (backend) scaffolded.</p>
      <pre>{JSON.stringify(health, null, 2)}</pre>
    </div>
  );
}

export default App;
