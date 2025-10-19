import { useEffect, useState } from 'react';

export default function PersonnelList() {
  const [data, setData] = useState({ data: [], total: 0, page: 1, limit: 20 });
  const [q, setQ] = useState('');
  const [level, setLevel] = useState('');

  const load = async (page = 1) => {
    const params = new URLSearchParams({ page, limit: 20 });
    if (q) params.append('q', q);
    if (level) params.append('level', level);
    const res = await fetch(`http://localhost:5000/api/personnel?${params.toString()}`);
    const json = await res.json();
    setData(json);
  };

  useEffect(() => { load(1); /* initial */ }, []); // eslint-disable-line

  return (
    <div className="container">
      <h2>Personnel</h2>
      <div className="toolbar">
        <input placeholder="Search name or role" value={q} onChange={e => setQ(e.target.value)} />
        <select value={level} onChange={e => setLevel(e.target.value)}>
          <option value="">All Levels</option>
          <option>Junior</option>
          <option>Mid</option>
          <option>Senior</option>
        </select>
        <button onClick={() => load(1)}>Search</button>
      </div>

      <table className="table">
        <thead><tr>
          <th>ID</th><th>Name</th><th>Role</th><th>Level</th><th>Created</th>
        </tr></thead>
        <tbody>
          {data.data.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.role_title}</td>
              <td>{p.experience_level}</td>
              <td>{new Date(p.created_at).toLocaleString()}</td>
              <td><a href={`/personnel/${p.id}/assign-skills`}>{p.name}</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
