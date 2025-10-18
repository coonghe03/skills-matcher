-- Create database (safe if it already exists)
CREATE DATABASE IF NOT EXISTS skills_matcher
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE skills_matcher;

-- PERSONNEL
CREATE TABLE IF NOT EXISTS personnel (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  role_title VARCHAR(120) NOT NULL,
  experience_level ENUM('Junior','Mid','Senior') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX idx_personnel_experience ON personnel (experience_level);

-- SKILLS (central catalog)
CREATE TABLE IF NOT EXISTS skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  name VARCHAR(100) NOT NULL,
  UNIQUE KEY uq_skill_category_name (category, name)
) ENGINE=InnoDB;

-- PERSONNEL ↔ SKILLS (with proficiency 1–5)
CREATE TABLE IF NOT EXISTS personnel_skills (
  personnel_id INT NOT NULL,
  skill_id INT NOT NULL,
  proficiency TINYINT UNSIGNED NOT NULL CHECK (proficiency BETWEEN 1 AND 5),
  PRIMARY KEY (personnel_id, skill_id),
  CONSTRAINT fk_ps_personnel FOREIGN KEY (personnel_id) REFERENCES personnel(id) ON DELETE CASCADE,
  CONSTRAINT fk_ps_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_personnel_skills_prof ON personnel_skills (proficiency);

-- PROJECTS
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status ENUM('Planning','Active','Completed') NOT NULL DEFAULT 'Planning',
  team_capacity INT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX idx_projects_status ON projects (status);

-- REQUIRED SKILLS for each project (with minimum proficiency)
CREATE TABLE IF NOT EXISTS project_required_skills (
  project_id INT NOT NULL,
  skill_id INT NOT NULL,
  min_proficiency TINYINT UNSIGNED NOT NULL CHECK (min_proficiency BETWEEN 1 AND 5),
  PRIMARY KEY (project_id, skill_id),
  CONSTRAINT fk_prs_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_prs_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ALLOCATIONS (who is assigned where and when)
CREATE TABLE IF NOT EXISTS allocations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  personnel_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  percent_alloc TINYINT UNSIGNED NOT NULL DEFAULT 100 CHECK (percent_alloc BETWEEN 1 AND 100),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_alloc_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_alloc_personnel FOREIGN KEY (personnel_id) REFERENCES personnel(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Helpful indexes for availability checks and matching
CREATE INDEX idx_alloc_personnel_dates ON allocations (personnel_id, start_date, end_date);
CREATE INDEX idx_alloc_project ON allocations (project_id);
