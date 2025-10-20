import { useEffect, useState } from 'react';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';

import PersonnelList from './pages/PersonnelList';
import SkillsList from './pages/SkillsList';
import AssignSkills from './pages/AssignSkills';
import ProjectList from './pages/ProjectList';
import ProjectForm from './pages/ProjectForm';
import ProjectRequiredSkills from './pages/ProjectRequiredSkills';
import ProjectMatching from './pages/ProjectMatching';
import ProjectAllocations from './pages/ProjectAllocations';
import AdvancedSearch from './pages/AdvancedSearch';
import PersonnelGrowth from './pages/PersonnelGrowth';
import UtilizationView from './pages/UtilizationView';

import './index.css';
import './App.css';

function StatusPill({ ok }) {
  return (
    <span className={`status-pill ${ok ? 'ok' : 'bad'}`}>
      {ok ? 'Operational' : 'Down'}
    </span>
  );
}

function Home() {
  const [health, setHealth] = useState(null);
  const [db, setDb] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const h = await fetch('http://localhost:5000/api/health').then(r => r.json());
        setHealth(h);
      } catch {
        setHealth({ ok: false });
      }
      try {
        const d = await fetch('http://localhost:5000/api/health/db').then(r => r.json());
        setDb(d);
      } catch {
        setDb({ ok: false });
      }
    };
    load();
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <h1>Skills Matcher</h1>
          <p className="sub">
            Match people to projects by skills, proficiency & availability — fast and transparent.
          </p>
          <div className="hero-actions">
            <a className="btn primary" href="/projects">View Projects</a>
            <a className="btn ghost" href="/personnel">Manage Personnel</a>
          </div>
          <div className="system-status">
            <div className="status-card">
              <div className="label">API</div>
              <div><StatusPill ok={!!health?.ok} /></div>
            </div>
            <div className="status-card">
              <div className="label">Database</div>
              <div><StatusPill ok={!!db?.ok} /></div>
            </div>
            <div className="status-card">
              <div className="label">Timestamp</div>
              <div className="mono">{health?.timestamp ? new Date(health.timestamp).toLocaleString() : '—'}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="grid-3">
          <a className="card kpi" href="/personnel">
            <div className="kpi-icon">👤</div>
            <div className="kpi-title">Personnel</div>
            <div className="kpi-desc">Profiles, experience level & skill assignments.</div>
          </a>
          <a className="card kpi" href="/projects">
            <div className="kpi-icon">📁</div>
            <div className="kpi-title">Projects</div>
            <div className="kpi-desc">Status, timelines, required skills & allocations.</div>
          </a>
          <a className="card kpi" href="/search">
            <div className="kpi-icon">🔎</div>
            <div className="kpi-title">Advanced Search</div>
            <div className="kpi-desc">Filter by level, skill proficiency & availability window.</div>
          </a>
        </div>

        <div className="grid-2 mt-24">
          <a className="card quick" href="/growth">
            <div className="quick-title">👥 Personnel Growth</div>
            <div className="quick-desc">See daily/monthly counts & cumulative trends.</div>
          </a>
          <a className="card quick" href="/utilization">
            <div className="quick-title">📈 Utilization</div>
            <div className="quick-desc">12-week utilization view — find capacity quickly.</div>
          </a>
        </div>
      </section>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <header className="topbar">
        <div className="topbar-inner">
          <a href="/" className="brand">Skills Matcher</a>
          <nav className="menu">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/personnel">Personnel</NavLink>
            <NavLink to="/skills">Skills</NavLink>
            <NavLink to="/projects">Projects</NavLink>
            <NavLink to="/search">Search</NavLink>
            <NavLink to="/growth">Growth</NavLink>
            <NavLink to="/utilization">Utilization</NavLink>
          </nav>
        </div>
      </header>

      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/personnel" element={<PersonnelList />} />
          <Route path="/personnel/:id/assign-skills" element={<AssignSkills />} />
          <Route path="/skills" element={<SkillsList />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/projects/:id/edit" element={<ProjectForm />} />
          <Route path="/projects/new" element={<ProjectForm />} />
          <Route path="/projects/:id/required-skills" element={<ProjectRequiredSkills />} />
          <Route path="/projects/:id/matching" element={<ProjectMatching />} />
          <Route path="/projects/:id/allocations" element={<ProjectAllocations />} />
          <Route path="/search" element={<AdvancedSearch />} />
          <Route path="/growth" element={<PersonnelGrowth />} />
          <Route path="/utilization" element={<UtilizationView />} />
        </Routes>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <span>© {new Date().getFullYear()} Skills Matcher</span>
          <span className="muted">React • Node/Express • MySQL</span>
        </div>
      </footer>
    </BrowserRouter>
  );
}
