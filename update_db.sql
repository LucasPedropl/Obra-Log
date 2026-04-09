"ALTER TABLE companies ADD COLUMN max_instances INTEGER DEFAULT 1; ALTER TABLE companies ADD COLUMN parent_id UUID REFERENCES companies(id);" 
