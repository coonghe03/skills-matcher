import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function ProjectAllocations() {
  const { id } = useParams();
  const [rows, setRows] = useState([]);

  const load = async () => {
    const res = await fetch(`http://localhost:5000/api/projects/${id}/allocations`);
    setRows(await res.json());
  };

  const removeAlloc = async (allocId) => {
    const r = await fetch(`http://localhost:5000/api/allocations/${allocId}`, { method: 'DELETE' });
    if (r.status === 204) load();
  };

  useEffect(() => { load(); }, [id]);

  return (
    <div className="container">
      <h2>Allocations for Project #{id}</h2>
      <table className="table">
        <thead><tr>
          <th>ID</th><th>Person</th><th>Role</th><th>Dates</th><th>%</th><th></th>
        </tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.name}</td>
              <td>{r.role_title}</td>
              <td>{r.start_date} → {r.end_date || '-'}</td>
              <td>{r.percent_alloc}</td>
              <td><button onClick={() => removeAlloc(r.id)}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
