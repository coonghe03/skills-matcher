import { useEffect, useState } from 'react';

export default function AdvancedSearch() {
  const [skills, setSkills] = useState([]);
  const [q, setQ] = useState('');
  const [level, setLevel] = useState('');
  const [skillId, setSkillId] = useState('');
  const [minProf, setMinProf] = useState(3);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    (async () => {
      const s = await fetch('http://localhost:5000/api/skills?limit=500').then(r => r.json());
      setSkills(s.data || []);
    })();
  }, []);

  const search = async () => {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (level) params.append('level', level);
    if (skillId) params.append('skillId', skillId);
    if (minProf) params.append('minProf', minProf);
    if (start) params.append('available_start', start);
    if (end) params.append('available_end', end);
    const res = await fetch(`http://localhost:5000/api/search/personnel?${params.toString()}`);
    const json = await res.json();
    setResults(json.data || []);
  };

  return (
    <div className="container">
      <h2>Advanced Personnel Search</h2>

      <div className="toolbar" style={{ flexWrap: 'wrap' }}>
        <input placeholder="Search name or role" value={q} onChange={e => setQ(e.target.value)} />
        <select value={level} onChange={e => setLevel(e.target.value)}>
          <option value="">All Levels</option>
          <option>Junior</option>
          <option>Mid</option>
          <option>Senior</option>
        </select>
        <select value={skillId} onChange={e => setSkillId(e.target.value)}>
          <option value="">Any Skill</option>
          {skills.map(s => (
            <option key={s.id} value={s.id}>{s.category} — {s.name}</option>
          ))}
        </select>
        <select value={minProf} onChange={e => setMinProf(e.target.value)}>
          {[1,2,3,4,5].map(n => <option key={n} value={n}>Min {n}</option>)}
        </select>
        <label>Avail. Start <input type="date" value={start} onChange={e => setStart(e.target.value)} /></label>
        <label>Avail. End <input type="date" value={end} onChange={e => setEnd(e.target.value)} /></label>
        <button onClick={search}>Search</button>
      </div>

      <table className="table">
        <thead><tr>
          <th>ID</th><th>Name</th><th>Role</th><th>Level</th><th>Skills</th><th>Availability</th>
        </tr></thead>
        <tbody>
          {results.map(r => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.name}</td>
              <td>{r.role_title}</td>
              <td>{r.experience_level}</td>
              <td style={{ maxWidth: 420 }}>
                {(r.skills || []).map(s => `${s.name}(${s.proficiency})`).join(', ')}
              </td>
              <td>
                {r.availability
                  ? <>Free {r.availability.freePercent}% (Util {r.availability.requestedUtilization}%)</>
                  : <em>—</em>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
