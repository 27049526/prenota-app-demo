import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cmeinjnlywuhjcgqnszz.supabase.co";
const supabaseKey = "sb_publishable_tTwENz-Lf-E4WQTI8tiC0w_yKt2B2dl";

export const supabase = createClient(supabaseUrl, supabaseKey);
