import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://auydhmadfjymkxurrqjo.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1eWRobWFkZmp5bWt4dXJycWpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MDQwMTEsImV4cCI6MjA4MTM4MDAxMX0.8BnbXyCdkYBMYtPqlq80--twBV_R3N3DtJru5PZURtg';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface UserProfile {
  id?: string;
  firebase_uid: string;
  email: string;
  name: string;
  nickname?: string;
  avatar_emoji?: string;
  age?: number;
  gender?: string;
  domain?: string;
  experience_years?: number;
  experience_level?: string;
  market_preference?: string;
  dob?: string;
  mobile?: string;
  created_at?: string;
  updated_at?: string;
}

export async function createUserProfile(profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert([profile])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserProfile(firebaseUid: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('firebase_uid', firebaseUid)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
  return data;
}

export async function updateUserProfile(firebaseUid: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('firebase_uid', firebaseUid)
    .select()
    .single();

  if (error) throw error;
  return data;
}