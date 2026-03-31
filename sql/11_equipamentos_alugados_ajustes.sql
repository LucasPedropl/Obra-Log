ALTER TABLE public.catalogs ADD COLUMN IF NOT EXISTS is_rented_equipment boolean DEFAULT false; 
ALTER TABLE public.rented_equipments ADD COLUMN IF NOT EXISTS inventory_id uuid REFERENCES public.site_inventory(id); 
ALTER TABLE public.rented_equipments ALTER COLUMN entry_date TYPE timestamp with time zone; 
ALTER TABLE public.rented_equipments ALTER COLUMN exit_date TYPE timestamp with time zone; 
ALTER TABLE public.rented_equipments ALTER COLUMN name DROP NOT NULL; 
ALTER TABLE public.rented_equipments ALTER COLUMN category DROP NOT NULL; 
ALTER TABLE public.rented_equipments ALTER COLUMN supplier DROP NOT NULL; 
