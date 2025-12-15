/**
 * Página de callback para autenticação OAuth do Supabase
 * Processa o retorno do login social (Google/GitHub)
 */

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Verificar se há um código de autorização na URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const errorDescription = queryParams.get('error_description') || hashParams.get('error_description');
        
        if (errorDescription) {
          setError(errorDescription);
          return;
        }

        if (accessToken && refreshToken) {
          // Definir a sessão manualmente se os tokens estiverem na URL
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            setError(sessionError.message);
            return;
          }
        }

        // Verificar se há uma sessão válida
        const { data: { session }, error: getSessionError } = await supabase.auth.getSession();
        
        if (getSessionError) {
          setError(getSessionError.message);
          return;
        }

        if (session) {
          // Login bem-sucedido, redirecionar para o dashboard
          setLocation("/dashboard");
        } else {
          // Sem sessão, redirecionar para login
          setLocation("/login");
        }
      } catch (err: any) {
        setError(err.message || "Erro ao processar autenticação");
      }
    };

    handleAuthCallback();
  }, [setLocation]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 border border-red-500/20 rounded-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Erro na Autenticação</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => setLocation("/login")}
            className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <img
          src="/logo-dte.png"
          alt="DTE Logo"
          className="w-20 h-20 rounded-full object-cover border-2 border-teal-500/30"
        />
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
          <span className="text-slate-300">Processando autenticação...</span>
        </div>
      </div>
    </div>
  );
}
