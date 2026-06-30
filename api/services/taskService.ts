import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Task, CreateTaskRequest, PersonStats, ProjectStats, TimeStats, TimeComparison, TimeRangeType, YearComparison } from '../types/task.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../data');
const dataFile = path.join(dataDir, 'tasks.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function readTasks(): Task[] {
  if (!fs.existsSync(dataFile)) {
    return [];
  }
  try {
    const content = fs.readFileSync(dataFile, 'utf-8');
    const data = JSON.parse(content);
    return data.tasks || [];
  } catch {
    return [];
  }
}

function writeTasks(tasks: Task[]): void {
  fs.writeFileSync(dataFile, JSON.stringify({ tasks }, null, 2), 'utf-8');
}

export const taskService = {
  getAllTasks(): Task[] {
    return readTasks();
  },

  searchTasks(filters: Partial<Task>): Task[] {
    const tasks = readTasks();
    return tasks.filter(task => {
      if (filters.projectNumber && !task.projectNumber.includes(filters.projectNumber)) {
        return false;
      }
      if (filters.person && !task.person.includes(filters.person)) {
        return false;
      }
      if (filters.customNumber && !task.customNumber.includes(filters.customNumber)) {
        return false;
      }
      if (filters.customContent && !task.customContent.includes(filters.customContent)) {
        return false;
      }
      if (filters.deliveryPath && !task.deliveryPath.includes(filters.deliveryPath)) {
        return false;
      }
      if (filters.deliveryTime && !task.deliveryTime.includes(filters.deliveryTime)) {
        return false;
      }
      return true;
    });
  },

  getTaskById(id: string): Task | undefined {
    const tasks = readTasks();
    return tasks.find(task => task.id === id);
  },

  createTask(request: CreateTaskRequest): Task {
    const tasks = readTasks();
    const newTask: Task = {
      id: generateId(),
      ...request,
    };
    tasks.push(newTask);
    writeTasks(tasks);
    return newTask;
  },

  updateTask(id: string, updates: Partial<CreateTaskRequest>): Task | undefined {
    const tasks = readTasks();
    const index = tasks.findIndex(task => task.id === id);
    if (index === -1) {
      return undefined;
    }
    tasks[index] = { ...tasks[index], ...updates };
    writeTasks(tasks);
    return tasks[index];
  },

  deleteTask(id: string): boolean {
    const tasks = readTasks();
    const initialLength = tasks.length;
    const filteredTasks = tasks.filter(task => task.id !== id);
    writeTasks(filteredTasks);
    return filteredTasks.length < initialLength;
  },

  getStatsByPerson(filters?: Partial<Task>): PersonStats[] {
    const tasks = filters ? this.searchTasks(filters) : readTasks();
    const statsMap = new Map<string, PersonStats>();
    
    tasks.forEach(task => {
      if (!statsMap.has(task.person)) {
        statsMap.set(task.person, { person: task.person, taskCount: 0, totalHours: 0 });
      }
      const stats = statsMap.get(task.person)!;
      stats.taskCount++;
      stats.totalHours += task.hours;
    });
    
    return Array.from(statsMap.values()).sort((a, b) => b.totalHours - a.totalHours);
  },

  getStatsByProject(filters?: Partial<Task>): ProjectStats[] {
    const tasks = filters ? this.searchTasks(filters) : readTasks();
    const statsMap = new Map<string, ProjectStats>();
    
    tasks.forEach(task => {
      if (!statsMap.has(task.projectNumber)) {
        statsMap.set(task.projectNumber, { projectNumber: task.projectNumber, taskCount: 0, totalHours: 0 });
      }
      const stats = statsMap.get(task.projectNumber)!;
      stats.taskCount++;
      stats.totalHours += task.hours;
    });
    
    return Array.from(statsMap.values()).sort((a, b) => b.totalHours - a.totalHours);
  },

  getStatsByTime(filters?: Partial<Task>): TimeStats[] {
    const tasks = filters ? this.searchTasks(filters) : readTasks();
    const statsMap = new Map<string, TimeStats>();
    
    tasks.forEach(task => {
      const deliveryTime = task.deliveryTime.substring(0, 7);
      if (!statsMap.has(deliveryTime)) {
        statsMap.set(deliveryTime, { deliveryTime, taskCount: 0, totalHours: 0 });
      }
      const stats = statsMap.get(deliveryTime)!;
      stats.taskCount++;
      stats.totalHours += task.hours;
    });
    
    return Array.from(statsMap.values()).sort((a, b) => a.deliveryTime.localeCompare(b.deliveryTime));
  },

  getTimeComparison(filters?: Partial<Task>, timeRange: TimeRangeType = 'month', yearComparison?: YearComparison): TimeComparison {
    const tasks = filters ? this.searchTasks(filters) : readTasks();
    const now = new Date();
    
    const compareYear = yearComparison?.compareYear || now.getFullYear();
    const baseYear = yearComparison?.baseYear || (compareYear - 1);
    
    let currentStart: Date;
    let currentEnd: Date;
    let previousStart: Date;
    let previousEnd: Date;
    let lastYearStart: Date;
    let lastYearEnd: Date;
    let currentLabel: string;
    let previousLabel: string;
    let lastYearLabel: string;
    
    switch (timeRange) {
      case 'month': {
        currentStart = new Date(compareYear, now.getMonth(), 1);
        currentEnd = new Date(compareYear, now.getMonth() + 1, 0);
        previousStart = new Date(compareYear, now.getMonth() - 1, 1);
        previousEnd = new Date(compareYear, now.getMonth(), 0);
        lastYearStart = new Date(baseYear, now.getMonth(), 1);
        lastYearEnd = new Date(baseYear, now.getMonth() + 1, 0);
        currentLabel = `${compareYear}年${now.getMonth() + 1}月`;
        previousLabel = `${previousStart.getFullYear()}年${previousStart.getMonth() + 1}月`;
        lastYearLabel = `${baseYear}年${now.getMonth() + 1}月`;
        break;
      }
      case 'quarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        currentStart = new Date(compareYear, quarter * 3, 1);
        currentEnd = new Date(compareYear, quarter * 3 + 3, 0);
        const prevQuarter = quarter === 0 ? 3 : quarter - 1;
        const prevQuarterYear = quarter === 0 ? compareYear - 1 : compareYear;
        previousStart = new Date(prevQuarterYear, prevQuarter * 3, 1);
        previousEnd = new Date(prevQuarterYear, prevQuarter * 3 + 3, 0);
        lastYearStart = new Date(baseYear, quarter * 3, 1);
        lastYearEnd = new Date(baseYear, quarter * 3 + 3, 0);
        currentLabel = `${compareYear}年Q${quarter + 1}`;
        previousLabel = `${prevQuarterYear}年Q${prevQuarter + 1}`;
        lastYearLabel = `${baseYear}年Q${quarter + 1}`;
        break;
      }
      case 'halfYear': {
        const isFirstHalf = now.getMonth() < 6;
        if (isFirstHalf) {
          currentStart = new Date(compareYear, 0, 1);
          currentEnd = new Date(compareYear, 5, 30);
          previousStart = new Date(compareYear - 1, 6, 1);
          previousEnd = new Date(compareYear - 1, 11, 31);
          lastYearStart = new Date(baseYear, 0, 1);
          lastYearEnd = new Date(baseYear, 5, 30);
          currentLabel = `${compareYear}年上半年`;
          previousLabel = `${compareYear - 1}年下半年`;
          lastYearLabel = `${baseYear}年上半年`;
        } else {
          currentStart = new Date(compareYear, 6, 1);
          currentEnd = new Date(compareYear, 11, 31);
          previousStart = new Date(compareYear, 0, 1);
          previousEnd = new Date(compareYear, 5, 30);
          lastYearStart = new Date(baseYear, 6, 1);
          lastYearEnd = new Date(baseYear, 11, 31);
          currentLabel = `${compareYear}年下半年`;
          previousLabel = `${compareYear}年上半年`;
          lastYearLabel = `${baseYear}年下半年`;
        }
        break;
      }
      case 'year':
      default: {
        currentStart = new Date(compareYear, 0, 1);
        currentEnd = new Date(compareYear, 11, 31);
        previousStart = new Date(compareYear - 1, 0, 1);
        previousEnd = new Date(compareYear - 1, 11, 31);
        lastYearStart = new Date(baseYear, 0, 1);
        lastYearEnd = new Date(baseYear, 11, 31);
        currentLabel = `${compareYear}年`;
        previousLabel = `${compareYear - 1}年`;
        lastYearLabel = `${baseYear}年`;
        break;
      }
    }
    
    const getPeriodStats = (start: Date, end: Date) => {
      const startStr = start.toISOString().slice(0, 10);
      const endStr = end.toISOString().slice(0, 10);
      const periodTasks = tasks.filter(task => 
        task.deliveryTime >= startStr && task.deliveryTime <= endStr
      );
      const taskCount = periodTasks.length;
      const totalHours = periodTasks.reduce((sum, task) => sum + task.hours, 0);
      return { taskCount, totalHours };
    };
    
    const currentStats = getPeriodStats(currentStart, currentEnd);
    const previousStats = getPeriodStats(previousStart, previousEnd);
    const lastYearStats = getPeriodStats(lastYearStart, lastYearEnd);
    
    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) {
        return current > 0 ? 100 : 0;
      }
      return ((current - previous) / previous) * 100;
    };
    
    const taskCountChange = calculateChange(currentStats.taskCount, previousStats.taskCount);
    const totalHoursChange = calculateChange(currentStats.totalHours, previousStats.totalHours);
    const taskCountYoY = calculateChange(currentStats.taskCount, lastYearStats.taskCount);
    const totalHoursYoY = calculateChange(currentStats.totalHours, lastYearStats.totalHours);
    
    return {
      timeRange,
      currentPeriod: currentLabel,
      previousPeriod: previousLabel,
      samePeriodLastYear: lastYearLabel,
      taskCountChange,
      totalHoursChange,
      taskCountYoY,
      totalHoursYoY,
    };
  },
};
