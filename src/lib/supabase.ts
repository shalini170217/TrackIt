import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://rwcxsfwtigecftmtbpba.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Y3hzZnd0aWdlY2Z0bXRicGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMDQ1MTgsImV4cCI6MjA2NTU4MDUxOH0.v6f83s63MQHvDOhbuuF_3nyGmXioFtkXDwGZjALIgFw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})