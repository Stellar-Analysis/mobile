import React from 'react';
import { Platform } from 'react-native';
import { useAppStore } from '@store/appStore';

export interface InfiniteScrollItem {
  id: string;
  title: string;
  description: string;
}

export interface InfiniteScrollState {
  items: InfiniteScrollItem[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  error?: string;
  platformThreshold: number;
}

export interface UseInfiniteScrollOptions {
  pageSize?: number;
  initialPage?: number;
}

export interface UseInfiniteScrollResult extends InfiniteScrollState {
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

function createItems(page: number, pageSize: number): InfiniteScrollItem[] {
  return Array.from({ length: pageSize }, (_, index) => {
    const itemNumber = (page - 1) * pageSize + index + 1;

    return {
      id: `insight-${itemNumber}`,
      title: `Insight ${itemNumber}`,
      description: `Loaded from page ${page}`,
    };
  });
}

export function useInfiniteScroll(options: UseInfiniteScrollOptions = {}): UseInfiniteScrollResult {
  const isOnline = useAppStore(state => state.isOnline);
  const pageSize = options.pageSize ?? Platform.select({ ios: 12, android: 10, default: 10 }) ?? 10;
  const initialPage = options.initialPage ?? 1;
  const platformThreshold = Platform.select({ ios: 0.35, android: 0.45, default: 0.4 }) ?? 0.4;
  const [state, setState] = React.useState<InfiniteScrollState>({
    items: createItems(initialPage, pageSize),
    page: initialPage,
    hasMore: true,
    isLoading: false,
    platformThreshold,
  });

  const loadMore = React.useCallback(async () => {
    if (state.isLoading || !state.hasMore) {
      return;
    }

    if (!isOnline) {
      setState(current => ({ ...current, error: 'Connect to the internet to load more results' }));
      return;
    }

    setState(current => ({ ...current, isLoading: true, error: undefined }));

    try {
      const nextPage = state.page + 1;
      const nextItems = createItems(nextPage, pageSize);

      setState(current => ({
        ...current,
        items: [...current.items, ...nextItems],
        page: nextPage,
        hasMore: nextPage < 5,
        isLoading: false,
      }));
    } catch {
      setState(current => ({ ...current, isLoading: false, error: 'Unable to load more results' }));
    }
  }, [isOnline, pageSize, state.hasMore, state.isLoading, state.page]);

  const refresh = React.useCallback(async () => {
    setState(current => ({ ...current, isLoading: true, error: undefined }));

    try {
      setState({
        items: createItems(initialPage, pageSize),
        page: initialPage,
        hasMore: true,
        isLoading: false,
        platformThreshold,
      });
    } catch {
      setState(current => ({ ...current, isLoading: false, error: 'Unable to refresh results' }));
    }
  }, [initialPage, pageSize, platformThreshold]);

  return {
    ...state,
    loadMore,
    refresh,
  };
}
