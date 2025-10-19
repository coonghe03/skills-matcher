import { useEffect, useState } from 'react';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import PersonnelList from './pages/PersonnelList';
import SkillsList from './pages/SkillsList';
import './App.css';
import ProjectList from './pages/ProjectList';
import ProjectForm from './pages/ProjectForm';
import ProjectRequiredSkills from './pages/ProjectRequiredSkills';
import AssignSkills from './pages/AssignSkills';
import ProjectMatching from './pages/ProjectMatching';
import ProjectAllocations from './pages/ProjectAllocations';
import AdvancedSearch from './pages/AdvancedSearch';
import PersonnelGrowth from './pages/PersonnelGrowth';
import UtilizationView from './pages/UtilizationView';

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
  <NavLink to="/projects">Projects</NavLink>
  <NavLink to="/search">Search</NavLink>      
  <NavLink to="/growth">Growth</NavLink>         
  <NavLink to="/utilization">Utilization</NavLink>
</nav>
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
    </BrowserRouter>
  );
}
