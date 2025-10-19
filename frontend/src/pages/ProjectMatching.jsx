import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function ProjectMatching() {
  const { id } = useParams(); // project id
  const [project, setProject] = useState(null);
  const [required, setRequired] = useState([]);
  const [matches, setMatches] = useState([]);
  const [sort, setSort] = useState('fit');

  const [alloc, setAlloc] = useState({ personnel_id: '', start_date: '', end_date: '', percent_alloc: 100 });

  const load = async () => {
    const base = 'http://localhost:5000/api';
    const proj = await fetch(`${base}/projects/${id}`).then(r => r.json());
    setProject(proj);
    const res = await fetch(`${base}/match/${id}?sort=${sort}`).then(r => r.json());
    setRequired(res.required || []);
    setMatches(res.matches || []);
  };

  useEffect(() => { load(); /* eslint-disable */ }, [id, sort]);

  const allocate = async () => {
    if (!alloc.personnel_id || !alloc.start_date) return;
    const payload = {
      project_id: Number(id),
      personnel_id: Number(alloc.personnel_id),
      start_date: alloc.start_date,
      end_date: alloc.end_date || null,
      percent_alloc: Number(alloc.percent_alloc || 100)
    };
    const r = await fetch('http://localhost:5000/api/allocations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const j = await r.json();
    if (r.ok) {
      alert('Allocated!');
      setAlloc({ personnel_id: '', start_date: '', end_date: '', percent_alloc: 100 });
      load();
    } else {
      alert(j.error || 'Allocation failed');
    }
  };

  if (!project) return <div className="container">Loading…</div>;

  return (
    <div className="container">
      <h2>Matches — {project.name}</h2>

      <div style={{ marginBottom: 8 }}>
        <strong>Required:</strong>{' '}
        {required.map(r => `${r.skill_name} (≥${r.min_proficiency})`).join(', ')}
      </div>

      <div className="toolbar">
        <label>Sort:
          <select value={sort} onChange={e => setSort(e.target.value)}>
            <option value="fit">Best Fit</option>
            <option value="availability">Availability</option>
          </select>
        </label>
      </div>

      <table className="table">
        <thead><tr>
          <th>Person</th><th>Role</th><th>Level</th><th>Fit Score</th><th>Availability %</th><th>Details</th><th>Pick</th>
        </tr></thead>
        <tbody>
          {matches.map(m => (
            <tr key={m.personnel_id}>
              <td>{m.name}</td>
              <td>{m.role_title}</td>
              <td>{m.experience_level}</td>
              <td>{m.fit_score}</td>
              <td>{m.availability}</td>
              <td>
                {m.details.map(d => `${d.skill_name}: ${d.has}/${d.required}`).join(', ')}
              </td>
              <td>
                <button onClick={() => setAlloc(a => ({ ...a, personnel_id: m.personnel_id }))}>
                  Select
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: 16 }}>Allocate Selected</h3>
      <div className="form-grid">
        <label>Personnel ID
          <input value={alloc.personnel_id} onChange={e => setAlloc({ ...alloc, personnel_id: e.target.value })} />
        </label>
        <label>Start Date
          <input type="date" value={alloc.start_date} onChange={e => setAlloc({ ...alloc, start_date: e.target.value })} />
        </label>
        <label>End Date
          <input type="date" value={alloc.end_date} onChange={e => setAlloc({ ...alloc, end_date: e.target.value })} />
        </label>
        <label>Percent
          <input type="number" min="1" max="100" value={alloc.percent_alloc}
                 onChange={e => setAlloc({ ...alloc, percent_alloc: e.target.value })} />
        </label>
      </div>
      <div className="toolbar">
        <button onClick={allocate}>Allocate</button>
        <a href={`/projects/${id}/allocations`}><button>View Allocations</button></a>
      </div>
    </div>
  );
}
