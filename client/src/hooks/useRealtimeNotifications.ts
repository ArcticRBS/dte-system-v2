/**
 * Hook para receber notificações em tempo real via Supabase Realtime
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase, subscribeToTable, unsubscribe } from '@/lib/supabase';
import { toast } from 'sonner';

interface RealtimeNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  createdAt: string;
}

export function useRealtimeNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const handleNewNotification = useCallback((payload: any) => {
    const newNotification = payload.new as RealtimeNotification;
    
    // Adicionar à lista de notificações
    setNotifications(prev => [newNotification, ...prev]);
    
    // Mostrar toast
    const toastFn = {
      info: toast.info,
      warning: toast.warning,
      error: toast.error,
      success: toast.success,
    }[newNotification.type] || toast.info;
    
    toastFn(newNotification.title, {
      description: newNotification.message,
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    // Inscrever-se nas mudanças da tabela de notificações
    const channel = subscribeToTable(
      'admin_notifications',
      handleNewNotification,
      'INSERT'
    );

    setIsConnected(true);

    return () => {
      unsubscribe(channel);
      setIsConnected(false);
    };
  }, [userId, handleNewNotification]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    isConnected,
    clearNotifications,
    unreadCount: notifications.length,
  };
}

/**
 * Hook para receber atualizações em tempo real de qualquer tabela
 */
export function useRealtimeTable<T>(
  tableName: string,
  onInsert?: (record: T) => void,
  onUpdate?: (record: T) => void,
  onDelete?: (record: T) => void
) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const channels: any[] = [];

    if (onInsert) {
      const insertChannel = subscribeToTable(tableName, (payload) => {
        onInsert(payload.new as T);
      }, 'INSERT');
      channels.push(insertChannel);
    }

    if (onUpdate) {
      const updateChannel = subscribeToTable(tableName, (payload) => {
        onUpdate(payload.new as T);
      }, 'UPDATE');
      channels.push(updateChannel);
    }

    if (onDelete) {
      const deleteChannel = subscribeToTable(tableName, (payload) => {
        onDelete(payload.old as T);
      }, 'DELETE');
      channels.push(deleteChannel);
    }

    setIsConnected(channels.length > 0);

    return () => {
      channels.forEach(channel => unsubscribe(channel));
      setIsConnected(false);
    };
  }, [tableName, onInsert, onUpdate, onDelete]);

  return { isConnected };
}

/**
 * Hook para monitorar status da conexão Realtime
 */
export function useRealtimeStatus() {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    const channel = supabase.channel('system');
    
    channel
      .on('system', { event: '*' }, () => {
        setStatus('connected');
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setStatus('connected');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setStatus('disconnected');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return status;
}
