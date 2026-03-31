import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

const DEBOUNCE_MS = 400;

export function useRealtimeSubscription(projectId: string | undefined) {
  const queryClient = useQueryClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const scheduleInvalidate = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        queryClient.invalidateQueries({ queryKey: ['items'] });
        queryClient.invalidateQueries({ queryKey: ['project-items', projectId] });
        queryClient.invalidateQueries({ queryKey: ['rooms', projectId] });
        queryClient.invalidateQueries({ queryKey: ['item-options'] });
        queryClient.invalidateQueries({ queryKey: ['item-comments'] });
        queryClient.invalidateQueries({ queryKey: ['transactions', projectId] });
      }, DEBOUNCE_MS);
    };

    const channel = supabase
      .channel(`project-${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items', filter: `project_id=eq.${projectId}` },
        scheduleInvalidate
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `project_id=eq.${projectId}` },
        scheduleInvalidate
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'item_options' },
        scheduleInvalidate
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'item_comments' },
        scheduleInvalidate
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `project_id=eq.${projectId}` },
        scheduleInvalidate
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);
}
