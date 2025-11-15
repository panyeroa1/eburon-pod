
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pnqmdgvfxuybhoufjpxc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBucW1kZ3ZmeHV5YmhvdWZqcHhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTc1NTUsImV4cCI6MjA3ODA5MzU1NX0.9Rk7hnQpI3pOSrajdzfVfYWmPFOIJULdyq9j4PYmHEQ';

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL or Key is not set.");
}

// Note: In a real-world production app, you would use anonymous keys on the client-side
// and secure keys in a backend environment. For this showcase, we use the provided anon key.
export const supabase = createClient(supabaseUrl, supabaseKey);