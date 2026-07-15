-- Add workday_schedule_json column to construction_sites and remove standard_workday_hours
ALTER TABLE public.construction_sites ADD COLUMN workday_schedule_json jsonb;
ALTER TABLE public.construction_sites DROP COLUMN standard_workday_hours;
