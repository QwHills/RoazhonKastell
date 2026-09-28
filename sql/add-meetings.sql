-- Comptes rendus de réunions du bureau exécutif
CREATE TABLE IF NOT EXISTS meetings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  meeting_date date NOT NULL,
  summary text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- To-do list associée aux réunions
CREATE TABLE IF NOT EXISTS meeting_todos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id uuid REFERENCES meetings(id) ON DELETE CASCADE,
  title text NOT NULL,
  assigned_to uuid REFERENCES profiles(id),
  due_date date,
  done boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meetings_select" ON meetings FOR SELECT USING (true);
CREATE POLICY "meetings_insert" ON meetings FOR INSERT WITH CHECK (true);
CREATE POLICY "meetings_update" ON meetings FOR UPDATE USING (true);
CREATE POLICY "meetings_delete" ON meetings FOR DELETE USING (true);

CREATE POLICY "meeting_todos_select" ON meeting_todos FOR SELECT USING (true);
CREATE POLICY "meeting_todos_insert" ON meeting_todos FOR INSERT WITH CHECK (true);
CREATE POLICY "meeting_todos_update" ON meeting_todos FOR UPDATE USING (true);
CREATE POLICY "meeting_todos_delete" ON meeting_todos FOR DELETE USING (true);
