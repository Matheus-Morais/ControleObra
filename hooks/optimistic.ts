import type { QueryClient, QueryKey } from '@tanstack/react-query';
import type { Item } from '../types';

export type ListSnapshot = [QueryKey, Item[]][];

/**
 * Aplica um patch a um item onde quer que ele apareça nos caches de lista
 * (`['items', ...]` e `['project-items', ...]`) e devolve snapshots dos
 * caches alterados para permitir rollback em caso de erro.
 */
export function patchItemInLists(
  qc: QueryClient,
  itemId: string,
  patch: (item: Item) => Item
): ListSnapshot {
  const snapshots: ListSnapshot = [];
  for (const prefix of [['items'], ['project-items']] as const) {
    for (const [key, data] of qc.getQueriesData<Item[]>({ queryKey: prefix })) {
      if (!Array.isArray(data)) continue;
      snapshots.push([key, data]);
      qc.setQueryData<Item[]>(
        key,
        data.map((it) => (it.id === itemId ? patch(it) : it))
      );
    }
  }
  return snapshots;
}

export function restoreListSnapshots(qc: QueryClient, snapshots: ListSnapshot | undefined) {
  snapshots?.forEach(([key, data]) => qc.setQueryData(key, data));
}
