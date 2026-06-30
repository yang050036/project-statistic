import { Task, PersonStats, ProjectStats, TimeStats, TimeComparison, TimeRangeType, YearComparison, TaskFilters } from '../types/task';
import { QCResult } from '../types/qc';

const BASE_URL = '/api';

export const apiClient = {
  getAllTasks: async (): Promise<Task[]> => {
    const response = await fetch(`${BASE_URL}/tasks`);
    return response.json();
  },

  searchTasks: async (filters: TaskFilters): Promise<Task[]> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });
    const response = await fetch(`${BASE_URL}/tasks/search?${params.toString()}`);
    return response.json();
  },

  getTaskById: async (id: string): Promise<Task> => {
    const response = await fetch(`${BASE_URL}/tasks/${id}`);
    return response.json();
  },

  createTask: async (task: Omit<Task, 'id'>): Promise<Task> => {
    const response = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    return response.json();
  },

  updateTask: async (id: string, updates: Partial<Omit<Task, 'id'>>): Promise<Task> => {
    const response = await fetch(`${BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return response.json();
  },

  deleteTask: async (id: string): Promise<{ success: boolean }> => {
    const response = await fetch(`${BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  getPersonStats: async (filters?: TaskFilters): Promise<PersonStats[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });
    }
    const response = await fetch(`${BASE_URL}/statistics/person?${params.toString()}`);
    return response.json();
  },

  getProjectStats: async (filters?: TaskFilters): Promise<ProjectStats[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });
    }
    const response = await fetch(`${BASE_URL}/statistics/project?${params.toString()}`);
    return response.json();
  },

  getTimeStats: async (filters?: TaskFilters): Promise<TimeStats[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });
    }
    const response = await fetch(`${BASE_URL}/statistics/time?${params.toString()}`);
    return response.json();
  },

  getTimeComparison: async (filters?: TaskFilters, timeRange: TimeRangeType = 'month', yearComparison?: YearComparison): Promise<TimeComparison> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });
    }
    params.append('timeRange', timeRange);
    if (yearComparison) {
      params.append('compareYear', yearComparison.compareYear.toString());
      params.append('baseYear', yearComparison.baseYear.toString());
    }
    const response = await fetch(`${BASE_URL}/statistics/time-comparison?${params.toString()}`);
    return response.json();
  },

  getQCData: async (yearMonth?: string): Promise<QCResult> => {
    const params = new URLSearchParams();
    if (yearMonth) {
      params.append('yearMonth', yearMonth);
    }
    const response = await fetch(`${BASE_URL}/qc?${params.toString()}`);
    return response.json();
  },
};
