// Supabase Configuration
const SUPABASE_URL = 'https://zcgbiidybbyuwbacucah.supabase.co'; // Ganti dengan URL Anda
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjZ2JpaWR5YmJ5dXdiYWN1Y2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2Njc1MTEsImV4cCI6MjA4NjI0MzUxMX0.wlYLh_dPOOSUXJQGMeFGzIcMWPilEZgV_FLxt-QRgY4'; // Ganti dengan key Anda

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export { supabase };
