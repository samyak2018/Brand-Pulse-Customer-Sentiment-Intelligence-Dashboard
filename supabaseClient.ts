import { createClient } from "@supabase/supabase-js";

console.log("ENV URL:", process.env.REACT_APP_SUPABASE_URL);
console.log("ENV KEY:", process.env.REACT_APP_SUPABASE_ANON_KEY ? "Loaded" : "Missing");

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
