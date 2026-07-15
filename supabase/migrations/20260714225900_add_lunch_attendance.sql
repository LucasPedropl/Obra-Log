-- Add lunch_start and lunch_end to attendance_records
ALTER TABLE public.attendance_records ADD COLUMN lunch_start time without time zone;
ALTER TABLE public.attendance_records ADD COLUMN lunch_end time without time zone;
