/**
 * Cliente Supabase para o servidor
 * Configurado para autenticação, realtime e acesso ao banco PostgreSQL
 */

import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://tmcdfdpbnkmcvjzqedvw.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtY2RmZHBibmttY3ZqenFlZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3OTc1NDEsImV4cCI6MjA4MTM3MzU0MX0.sdj_kO0Qxy01nmXqp86dy9ZfFU7vBosxrSoW0x-k-XA';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtY2RmZHBibmttY3ZqenFlZHZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTc5NzU0MSwiZXhwIjoyMDgxMzczNTQxfQ.Sx-AOlxSACHI5ekpjfD6pGbRxstx_vxd9WDHwNbs6W0';

// Cliente público (para operações do lado do cliente)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Cliente admin (para operações do lado do servidor com privilégios elevados)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Tipos para autenticação
export type AuthProvider = 'google' | 'github';

// Função para login com provedor OAuth
export async function signInWithProvider(provider: AuthProvider, redirectTo?: string) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectTo || `${process.env.VITE_APP_URL || 'http://localhost:3000'}/auth/callback`,
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

// Configurar listener de mudanças de autenticação
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

// Funções de Realtime
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

export function unsubscribeFromChannel(channel: any) {
  return supabase.removeChannel(channel);
}

// Exportar URL e chaves para uso em outros módulos
export const config = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
};
