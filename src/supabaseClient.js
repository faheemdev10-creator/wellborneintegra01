import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://idzgsunyksiqkilbkeck.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkemdzdW55a3NpcWtpbGJrZWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNjIzNjQsImV4cCI6MjEwMzczODM2NH0.SKranEIHB4ABJovikMmzubTVCYkJJ98rSTS1quXViMU';

export const supabase = createClient(supabaseUrl, supabaseKey);
