import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ProjectRequiredSkills() {
  const { id } = useParams(); // project id
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [skills, setSkills] = useState([]);
  const [required, setRequired] = useState([]);
  const [skillId, setSkillId] = useState('');
  const [minProf, setMinProf] = useState(3);

  useEffect(() => {
    (async () => {
      const p = await fetch(`http://localhost:5000/api/projects/${id}`).then(r => r.json());
      setProject(p);
      const s = await fetch(`http://localhost:5000/api/skills?limit=200`).then(r => r.json());
      setSkills(s.data || []);
      const reqs = await fetch(`http://localhost:5000/api/projects/${id}/required-skills`).then(r => r.json());
      setRequired(reqs);
    })();
  }, [id]);

  const addOrUpdate = async () => {
    if (!skillId) return;
    await fetch(`http://localhost:5000/api/projects/${id}/required-skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill_id: Number(skillId), min_proficiency: Number(minProf) })
    });
    const reqs = await fetch(`http://localhost:5000/api/projects/${id}/required-skills`).then(r => r.json());
    setRequired(reqs);
  };

  const remove = async (sid) => {
    await fetch(`http://localhost:5000/api/projects/${id}/required-skills/${sid}`, { method: 'DELETE' });
    const reqs = await fetch(`http://localhost:5000/api/projects/${id}/required-skills`).then(r => r.json());
    setRequired(reqs);
  };

  if (!project) return <div className="container">Loading…</div>;

  return (
    <div className="container">
      <h2>Required Skills — {project.name}</h2>

      <div className="toolbar">
        <select value={skillId} onChange={e => setSkillId(e.target.value)}>
          <option value="">Select skill</option>
          {skills.map(s => <option key={s.id} value={s.id}>{s.category} — {s.name}</option>)}
        </select>
        <select value={minProf} onChange={e => setMinProf(e.target.value)}>
          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <button onClick={addOrUpdate}>Add/Update</button>
        <button onClick={() => navigate('/projects')}>Back</button>
      </div>

      <table className="table">
        <thead><tr>
          <th>Category</th><th>Skill</th><th>Min Proficiency</th><th></th>
        </tr></thead>
        <tbody>
          {required.map(r => (
            <tr key={r.skill_id}>
              <td>{r.category}</td>
              <td>{r.name}</td>
              <td>{r.min_proficiency}</td>
              <td><button onClick={() => remove(r.skill_id)}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
