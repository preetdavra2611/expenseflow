import React, { createContext, useContext, useState } from 'react';
import { FilterState } from '../types';

interface FilterContextType {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  setDateRange: (range: FilterState['dateRange'], startDate?: string, endDate?: string) => void;
  resetFilters: () => void;
}

const defaultFilters: FilterState = {
  dateRange: 'this_month',
  search: '',
  categoryId: '',
  type: '',
  paymentMethod: '',
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const setDateRange = (range: FilterState['dateRange'], startDate?: string, endDate?: string) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: range,
      startDate: range === 'custom' ? startDate : undefined,
      endDate: range === 'custom' ? endDate : undefined,
    }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  return (
    <FilterContext.Provider value={{ filters, setFilters, setDateRange, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};
