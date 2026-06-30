import { create } from 'zustand';
import { TaskFilters } from '../types/task';

interface FilterState {
  filters: TaskFilters;
  searchKey: number;
  setFilters: (filters: TaskFilters) => void;
  updateFilter: (key: keyof TaskFilters, value: string) => void;
  clearFilters: () => void;
  triggerSearch: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  filters: {
    projectNumber: '',
    person: '',
    customNumber: '',
    customContent: '',
    deliveryPath: '',
    deliveryTime: '',
  },
  searchKey: 0,
  setFilters: (filters) => set({ filters }),
  updateFilter: (key, value) => set((state) => ({
    filters: { ...state.filters, [key]: value },
  })),
  clearFilters: () => set((state) => ({
    filters: {
      projectNumber: '',
      person: '',
      customNumber: '',
      customContent: '',
      deliveryPath: '',
      deliveryTime: '',
    },
    searchKey: state.searchKey + 1,
  })),
  triggerSearch: () => set((state) => ({ searchKey: state.searchKey + 1 })),
}));
