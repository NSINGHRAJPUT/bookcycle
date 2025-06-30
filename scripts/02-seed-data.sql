-- Insert admin user
INSERT INTO users (name, email, password_hash, role, reward_points) VALUES
('Admin User', 'admin@bookcycle.com', '$2b$10$dummy.hash.for.demo', 'admin', 0)
ON CONFLICT (email) DO NOTHING;

-- Insert sample book manager
INSERT INTO users (name, email, password_hash, role, institution, reward_points) VALUES
('Dr. Sarah Wilson', 'sarah@university.edu', '$2b$10$dummy.hash.for.demo', 'manager', 'University of Technology', 0)
ON CONFLICT (email) DO NOTHING;

-- Insert sample student with welcome bonus
INSERT INTO users (name, email, password_hash, role, reward_points) VALUES
('John Doe', 'john@student.edu', '$2b$10$dummy.hash.for.demo', 'student', 100)
ON CONFLICT (email) DO NOTHING;

-- Insert sample books for demonstration
WITH sample_users AS (
  SELECT id, role FROM users WHERE email IN ('john@student.edu', 'sarah@university.edu')
),
student_id AS (
  SELECT id FROM sample_users WHERE role = 'student' LIMIT 1
),
manager_id AS (
  SELECT id FROM sample_users WHERE role = 'manager' LIMIT 1
)
INSERT INTO books (title, author, subject, mrp, condition, description, status, points_price, donor_id, verifier_id, images) 
SELECT 
  'Introduction to Algorithms',
  'Thomas H. Cormen',
  'Computer Science',
  800,
  'good',
  'Well-maintained textbook with minimal highlighting',
  'verified',
  480,
  (SELECT id FROM student_id),
  (SELECT id FROM manager_id),
  ARRAY['/placeholder.svg?height=200&width=150']
WHERE EXISTS (SELECT 1 FROM student_id) AND EXISTS (SELECT 1 FROM manager_id);
