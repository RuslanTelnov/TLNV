import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

// Graceful check for build-time or missing keys
if (!supabaseUrl || !supabaseKey) {
    if (process.env.NODE_ENV !== 'production') {
        // console.warn('Supabase credentials missing.');
    }
}

export const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey, {
        db: {
            schema: process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || process.env.SUPABASE_SCHEMA || 'Parser'
        }
    })
    : null;
