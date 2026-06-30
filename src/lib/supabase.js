import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zpdvslhrnxuqxrnbsrkg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwZHZzbGhybnh1cXhybmJzcmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MDgxNjksImV4cCI6MjA5ODM4NDE2OX0.48cDy0YRqilklXphGc2vIDmr2EecfMGR7-gYBeGm7tQ'

// We will use the Supabase client for syncing, but the primary source of truth for the offline-first app will be localStorage.
export const supabase = createClient(supabaseUrl, supabaseKey)
