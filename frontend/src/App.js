import { useEffect, useState } from 'react';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import PersonnelList from './pages/PersonnelList';
import SkillsList from './pages/SkillsList';
import './App.css';

function Home() {
  const [health, setHealth] = useState(null);
  useEffect(() => {
    fetch('http://localhost:5000/api/health')
      .then(r => r.json())
      .then(setHealth)
      .catch(() => setHealth({ ok: false }));
  }, []);
  return (
    <div className="container">
      <h1>Skills Matcher</h1>
      <p>React (frontend) + Node/Express (backend) + MySQL.</p>
      <pre>{JSON.stringify(health, null, 2)}</pre>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <nav>
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/personnel">Personnel</NavLink>
        <NavLink to="/skills">Skills</NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/personnel" element={<PersonnelList />} />
        <Route path="/skills" element={<SkillsList />} />
      </Routes>
    </BrowserRouter>
  );
}
