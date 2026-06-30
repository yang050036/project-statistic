export interface Task {
  id: string;
  projectNumber: string;
  person: string;
  customNumber: string;
  customContent: string;
  deliveryPath: string;
  hours: number;
  deliveryTime: string;
}

export interface CreateTaskRequest {
  projectNumber: string;
  person: string;
  customNumber: string;
  customContent: string;
  deliveryPath: string;
  hours: number;
  deliveryTime: string;
}

export interface PersonStats {
  person: string;
  taskCount: number;
  totalHours: number;
}

export interface ProjectStats {
  projectNumber: string;
  taskCount: number;
  totalHours: number;
}

export interface TimeStats {
  deliveryTime: string;
  taskCount: number;
  totalHours: number;
}

export type TimeRangeType = 'month' | 'quarter' | 'halfYear' | 'year';

export interface YearComparison {
  compareYear: number;
  baseYear: number;
}

export interface TimeComparison {
  timeRange: TimeRangeType;
  currentPeriod: string;
  previousPeriod: string;
  samePeriodLastYear: string;
  taskCountChange: number;
  totalHoursChange: number;
  taskCountYoY: number;
  totalHoursYoY: number;
}
