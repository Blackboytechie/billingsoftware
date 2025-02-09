-- Add tax settings columns
ALTER TABLE public.companies 
ADD COLUMN gst_rate decimal(5,2) default 18.00,
ADD COLUMN enable_discount boolean default true,
ADD COLUMN default_discount_rate decimal(5,2) default 5.00;

-- Update existing companies with default values
UPDATE public.companies 
SET 
	gst_rate = COALESCE(gst_rate, 18.00),
	enable_discount = COALESCE(enable_discount, true),
	default_discount_rate = COALESCE(default_discount_rate, 5.00);