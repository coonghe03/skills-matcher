import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const API_BASE = 'http://localhost:5000/api';

export default function ProjectForm() {
  const navigate = useNavigate();
  const { id } = useParams();                     // "new" or a numeric id
  const isEdit = id && id !== 'new';

  const [model, setModel] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'Planning',
    team_capacity: 1,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/projects/${id}`);
        if (!res.ok) throw new Error('Failed to load project');
        const p = await res.json();
        setModel({
          name: p.name || '',
          description: p.description || '',
          start_date: p.start_date || '',
          end_date: p.end_date || '',
          status: p.status || 'Planning',
          team_capacity: p.team_capacity ?? 1,
        });
      } catch (e) {
        console.error(e);
        setErr('Could not load the project.');
      }
    })();
  }, [id, isEdit]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setModel((m) => ({ ...m, [name]: name === 'team_capacity' ? Number(value) : value }));
  };

  const save = async (e) => {
    e.preventDefault();
    setErr('');
    if (!model.name.trim()) {
      setErr('Project name is required.');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...model, team_capacity: Number(model.team_capacity || 1) };
      const url = isEdit ? `${API_BASE}/projects/${id}` : `${API_BASE}/projects`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Save failed');
      }
      navigate('/projects');
    } catch (e) {
      console.error(e);
      setErr(e.message || 'Failed to save project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="form-card">
        <h2>{isEdit ? 'Edit Project' : 'Create New Project'}</h2>
        <p className="sub">Fill in project details and click Save.</p>

        {err && <div className="alert error">{err}</div>}

        <form className="project-form" onSubmit={save}>
          <label>
            <span>Project Name *</span>
            <input
              name="name"
              type="text"
              value={model.name}
              onChange={onChange}
              placeholder="e.g. Client Portal"
              required
            />
          </label>

          <label className="full">
            <span>Description</span>
            <textarea
              name="description"
              rows={3}
              value={model.description}
              onChange={onChange}
              placeholder="Brief project summary"
            />
          </label>

          <div className="grid-2">
            <label>
              <span>Start Date</span>
              <input
                name="start_date"
                type="date"
                value={model.start_date || ''}
                onChange={onChange}
              />
            </label>
            <label>
              <span>End Date</span>
              <input
                name="end_date"
                type="date"
                value={model.end_date || ''}
                onChange={onChange}
              />
            </label>
          </div>

          <div className="grid-2">
            <label>
              <span>Status</span>
              <select name="status" value={model.status} onChange={onChange}>
                <option>Planning</option>
                <option>Active</option>
                <option>Completed</option>
              </select>
            </label>
            <label>
              <span>Team Capacity</span>
              <input
                name="team_capacity"
                type="number"
                min="1"
                value={model.team_capacity}
                onChange={onChange}
              />
            </label>
          </div>

          <div className="actions">
            <button
              type="button"
              className="btn ghost"
              onClick={() => navigate('/projects')}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? 'Saving…' : 'Save Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
