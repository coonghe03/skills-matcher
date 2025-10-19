import { useEffect, useState } from 'react';

export default function ProjectList() {
  const [data, setData] = useState({ data: [], total: 0 });
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  const load = async () => {
    const params = new URLSearchParams({ limit: 50 });
    if (q) params.append('q', q);
    if (status) params.append('status', status);
    const res = await fetch(`http://localhost:5000/api/projects?${params.toString()}`);
    const json = await res.json();
    setData(json);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  return (
    <div className="container">
      <h2>Projects</h2>
      <div className="toolbar">
        <input placeholder="Search" value={q} onChange={e => setQ(e.target.value)} />
        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All</option>
          <option>Planning</option>
          <option>Active</option>
          <option>Completed</option>
        </select>
        <button onClick={load}>Search</button>
        <a href="/projects/new"><button>Create Project</button></a>
      </div>

      <table className="table">
        <thead><tr>
          <th>ID</th><th>Name</th><th>Status</th><th>Capacity</th><th>Dates</th><th></th>
        </tr></thead>
        <tbody>
          {data.data.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td><a href={`/projects/${p.id}/edit`}>{p.name}</a></td>
              <td>{p.status}</td>
              <td>{p.team_capacity}</td>
              <td>{p.start_date || '-'} → {p.end_date || '-'}</td>
              <td><a href={`/projects/${p.id}/required-skills`}>Required Skills</a></td>
              <a href={`/projects/${p.id}/required-skills`}>Required Skills</a> |{' '}
              <a href={`/projects/${p.id}/matching`}>Matching</a>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
