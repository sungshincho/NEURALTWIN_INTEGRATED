-- Add missing hour column to zone_metrics
ALTER TABLE public.zone_metrics ADD COLUMN IF NOT EXISTS hour integer;

-- Create index on hour column for better query performance
CREATE INDEX IF NOT EXISTS idx_zone_metrics_hour ON public.zone_metrics(hour);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_zone_metrics_store_date_hour ON public.zone_metrics(store_id, date, hour);