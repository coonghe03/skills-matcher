import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function AssignSkills() {
  const { id } = useParams(); // personnel id
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [skills, setSkills] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [proficiency, setProficiency] = useState(3);

  useEffect(() => {
    (async () => {
      const p = await fetch(`http://localhost:5000/api/personnel/${id}`).then(r => r.json());
      setPerson(p);
      const s = await fetch(`http://localhost:5000/api/skills?limit=200`).then(r => r.json());
      setSkills(s.data || []);
      const a = await fetch(`http://localhost:5000/api/personnel/${id}/skills`).then(r => r.json());
      setAssigned(a);
    })();
  }, [id]);

  const addOrUpdate = async () => {
    if (!selectedSkillId) return;
    await fetch(`http://localhost:5000/api/personnel/${id}/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill_id: Number(selectedSkillId), proficiency: Number(proficiency) })
    });
    const a = await fetch(`http://localhost:5000/api/personnel/${id}/skills`).then(r => r.json());
    setAssigned(a);
  };

  const remove = async (skillId) => {
    await fetch(`http://localhost:5000/api/personnel/${id}/skills/${skillId}`, { method: 'DELETE' });
    const a = await fetch(`http://localhost:5000/api/personnel/${id}/skills`).then(r => r.json());
    setAssigned(a);
  };

  if (!person) return <div className="container">Loading…</div>;

  return (
    <div className="container">
      <h2>Assign Skills: {person.name}</h2>
      <div className="toolbar">
        <select value={selectedSkillId} onChange={e => setSelectedSkillId(e.target.value)}>
          <option value="">Select a skill</option>
          {skills.map(s => (
            <option key={s.id} value={s.id}>{s.category} — {s.name}</option>
          ))}
        </select>
        <select value={proficiency} onChange={e => setProficiency(e.target.value)}>
          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <button onClick={addOrUpdate}>Add/Update</button>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>

      <table className="table">
        <thead><tr>
          <th>Category</th><th>Skill</th><th>Proficiency</th><th></th>
        </tr></thead>
        <tbody>
          {assigned.map(a => (
            <tr key={a.skill_id}>
              <td>{a.category}</td>
              <td>{a.name}</td>
              <td>{a.proficiency}</td>
              <td><button onClick={() => remove(a.skill_id)}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
