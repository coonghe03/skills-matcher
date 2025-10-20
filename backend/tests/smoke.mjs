const base = process.env.API_BASE || 'http://localhost:5000';

async function check(path) {
  const res = await fetch(`${base}${path}`);
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json();
}

(async () => {
  try {
    const h = await check('/api/health');
    const db = await check('/api/health/db');
    console.log('Health:', h.ok, 'DB:', db.ok);

    const people = await check('/api/personnel?page=1&limit=1');
    console.log('Personnel listed:', Array.isArray(people.data));

    const skills = await check('/api/skills?page=1&limit=1');
    console.log('Skills listed:', Array.isArray(skills.data));

    console.log('✅ Smoke OK');
  } catch (e) {
    console.error('❌ Smoke failed:', e.message);
    process.exit(1);
  }
})();
