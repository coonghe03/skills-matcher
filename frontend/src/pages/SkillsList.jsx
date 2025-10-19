import { useEffect, useState } from 'react';

export default function SkillsList() {
  const [data, setData] = useState({ data: [], total: 0, page: 1, limit: 20 });
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');

  const load = async (page = 1) => {
    const params = new URLSearchParams({ page, limit: 20 });
    if (q) params.append('q', q);
    if (category) params.append('category', category);
    const res = await fetch(`http://localhost:5000/api/skills?${params.toString()}`);
    const json = await res.json();
    setData(json);
  };

  useEffect(() => { load(1); }, []); // eslint-disable-line

  // derive categories from list (quick & dirty)
  const categories = Array.from(new Set(data.data.map(s => s.category)));

  return (
    <div className="container">
      <h2>Skills</h2>
      <div className="toolbar">
        <input placeholder="Search category or name" value={q} onChange={e => setQ(e.target.value)} />
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <button onClick={() => load(1)}>Search</button>
      </div>

      <table className="table">
        <thead><tr>
          <th>ID</th><th>Category</th><th>Name</th>
        </tr></thead>
        <tbody>
          {data.data.map(s => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.category}</td>
              <td>{s.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
