/**
 * Cliente Supabase para o frontend
 * Configurado para autenticação social e realtime
 */

import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase (usando variáveis de ambiente do Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tmcdfdpbnkmcvjzqedvw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtY2RmZHBibmttY3ZqenFlZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3OTc1NDEsImV4cCI6MjA4MTM3MzU0MX0.sdj_kO0Qxy01nmXqp86dy9ZfFU7vBosxrSoW0x-k-XA';

// Cliente Supabase para o frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Tipos para autenticação
export type AuthProvider = 'google' | 'github';

// Função para login com provedor OAuth (Google ou GitHub)
export async function signInWithProvider(provider: AuthProvider) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  
  if (error) throw error;
  return data;
}

// Função para login com email/senha
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

// Função para cadastro com email/senha
export async function signUpWithEmail(email: string, password: string, metadata?: Record<string, any>) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  
  if (error) throw error;
  return data;
}

// Função para logout
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Função para obter sessão atual
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

// Função para obter usuário atual
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// Hook para mudanças de autenticação
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

// Funções de Realtime para notificações
export function subscribeToNotifications(
  userId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes' as any,
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'admin_notifications',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();
}

// Função para se inscrever em mudanças de qualquer tabela
export function subscribeToTable(
  table: string,
  callback: (payload: any) => void,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*'
) {
  return supabase
    .channel(`public:${table}`)
    .on(
      'postgres_changes' as any,
      { event, schema: 'public', table },
      callback
    )
    .subscribe();
}

// Função para cancelar inscrição
export function unsubscribe(channel: any) {
  return supabase.removeChannel(channel);
}

// Exportar configurações
export const config = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
};
