import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const empty = {
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  status: 'Planning',
  team_capacity: 1
};

export default function ProjectForm() {
  const { id } = useParams(); // 'new' or numeric
  const navigate = useNavigate();
  const [model, setModel] = useState(empty);
  const isEdit = id && id !== 'new';

  useEffect(() => {
    if (isEdit) {
      fetch(`http://localhost:5000/api/projects/${id}`)
        .then(r => r.json())
        .then(p => setModel({
          name: p.name || '',
          description: p.description || '',
          start_date: p.start_date || '',
          end_date: p.end_date || '',
          status: p.status || 'Planning',
          team_capacity: p.team_capacity || 1
        }));
    }
  }, [id, isEdit]);

  const save = async () => {
    const payload = { ...model, team_capacity: Number(model.team_capacity) };
    const url = isEdit ? `http://localhost:5000/api/projects/${id}` : `http://localhost:5000/api/projects`;
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) navigate('/projects');
  };

  return (
    <div className="container">
      <h2>{isEdit ? 'Edit Project' : 'Create Project'}</h2>
      <div className="form-grid">
        <label>Name<input value={model.name} onChange={e => setModel({ ...model, name: e.target.value })} /></label>
        <label>Status
          <select value={model.status} onChange={e => setModel({ ...model, status: e.target.value })}>
            <option>Planning</option>
            <option>Active</option>
            <option>Completed</option>
          </select>
        </label>
        <label>Capacity
          <input type="number" min="1" value={model.team_capacity}
                 onChange={e => setModel({ ...model, team_capacity: e.target.value })} />
        </label>
        <label>Start Date<input type="date" value={model.start_date || ''} onChange={e => setModel({ ...model, start_date: e.target.value })} /></label>
        <label>End Date<input type="date" value={model.end_date || ''} onChange={e => setModel({ ...model, end_date: e.target.value })} /></label>
        <label className="full">Description
          <textarea rows="4" value={model.description}
                    onChange={e => setModel({ ...model, description: e.target.value })} />
        </label>
      </div>

      <div className="toolbar">
        <button onClick={save}>{isEdit ? 'Update' : 'Create'}</button>
        <button onClick={() => navigate('/projects')}>Cancel</button>
      </div>
    </div>
  );
}
