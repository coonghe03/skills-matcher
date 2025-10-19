import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend
} from 'chart.js';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

export default function UtilizationView() {
  const [from, setFrom] = useState(new Date().toISOString().slice(0,10));
  const [weeks, setWeeks] = useState(12);
  const [personnelId, setPersonnelId] = useState('');
  const [people, setPeople] = useState([]);
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('http://localhost:5000/api/personnel?limit=200');
      const json = await res.json();
      setPeople(json.data || []);
    })();
  }, []);

  const load = async () => {
    const params = new URLSearchParams({ from, weeks });
    if (personnelId) params.append('personnel_id', personnelId);
    const res = await fetch(`http://localhost:5000/api/analytics/utilization?${params.toString()}`);
    const json = await res.json();
    setPayload(json);
  };

  useEffect(() => { load(); /* eslint-disable */ }, []);

  const labels = payload?.bucketStartDates || [];
  const datasets = (payload?.data || []).map((p, idx) => ({
    label: `${p.name} (${p.role_title})`,
    data: p.weekly
  }));

  const data = { labels, datasets };
  const options = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true, max: 100 } }
  };

  return (
    <div className="container">
      <h2>Utilization — Next {weeks} Weeks</h2>
      <div className="toolbar" style={{ flexWrap: 'wrap' }}>
        <label>From <input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
        <label>Weeks
          <input type="number" min="1" max="26" value={weeks} onChange={e => setWeeks(e.target.value)} />
        </label>
        <select value={personnelId} onChange={e => setPersonnelId(e.target.value)}>
          <option value="">All Personnel</option>
          {people.map(p => <option key={p.id} value={p.id}>{p.name} — {p.role_title}</option>)}
        </select>
        <button onClick={load}>Refresh</button>
      </div>

      <div style={{ maxWidth: 1000 }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
