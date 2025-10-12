import { useState, useEffect, useMemo } from 'react';

interface UsePaginationProps<T> {
  items: T[];
  itemsPerPage?: number;
  resetDependencies?: any[];
}

export function usePagination<T>({
  items,
  itemsPerPage = 10,
  resetDependencies = [],
}: UsePaginationProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when dependencies change
  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDependencies);

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = items.slice(startIndex, endIndex);

    return {
      currentPage,
      totalPages,
      paginatedItems,
      totalItems: items.length,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, items.length),
      setCurrentPage,
      goToNextPage: () => setCurrentPage((prev) => Math.min(totalPages, prev + 1)),
      goToPreviousPage: () => setCurrentPage((prev) => Math.max(1, prev - 1)),
      goToPage: (page: number) => setCurrentPage(Math.max(1, Math.min(totalPages, page))),
    };
  }, [items, itemsPerPage, currentPage]);

  return paginationData;
}
