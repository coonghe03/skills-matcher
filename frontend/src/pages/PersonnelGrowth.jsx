import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend
} from 'chart.js';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

export default function PersonnelGrowth() {
  const [granularity, setGran] = useState('month');
  const [from, setFrom] = useState('2025-01-01');
  const [to, setTo] = useState(new Date().toISOString().slice(0,10));
  const [rows, setRows] = useState([]);

  const load = async () => {
    const params = new URLSearchParams({ granularity, from, to });
    const res = await fetch(`http://localhost:5000/api/analytics/personnel-growth?${params.toString()}`);
    const json = await res.json();
    setRows(json.data || []);
  };

  useEffect(() => { load(); /* eslint-disable */ }, []);

  const labels = rows.map(r => r.period);
  const countData = rows.map(r => r.count);
  const cumData = rows.map(r => r.cumulative);

  const data = {
    labels,
    datasets: [
      { label: 'New Personnel', data: countData },
      { label: 'Cumulative', data: cumData }
    ]
  };

  const options = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true } }
  };

  return (
    <div className="container">
      <h2>Personnel Growth</h2>

      <div className="toolbar">
        <select value={granularity} onChange={e => setGran(e.target.value)}>
          <option value="day">Daily</option>
          <option value="month">Monthly</option>
        </select>
        <label>From <input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
        <label>To <input type="date" value={to} onChange={e => setTo(e.target.value)} /></label>
        <button onClick={load}>Refresh</button>
      </div>

      <div style={{ maxWidth: 900 }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
