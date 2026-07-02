-- Create a secure public view for aggregating product views and likes counts.
-- This allows anonymous visitors to see the counts without reading sensitive user logs (IPs, user agents).
CREATE OR REPLACE VIEW public.product_stats AS
SELECT 
  page_path, 
  event_type, 
  COUNT(*) as count
FROM public.visitor_log
WHERE event_type IN ('product viewed', 'product liked', 'product unliked')
GROUP BY page_path, event_type;

-- Grant read permission on the view to public anonymous connections
GRANT SELECT ON public.product_stats TO anon, authenticated;
