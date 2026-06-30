import express, { Request, Response } from 'express';
import { taskService } from '../services/taskService.js';
import { Task } from '../types/task.js';

const router = express.Router();

function getFiltersFromQuery(req: Request): Partial<Task> {
  return {
    projectNumber: req.query.projectNumber as string,
    person: req.query.person as string,
    customNumber: req.query.customNumber as string,
    customContent: req.query.customContent as string,
    deliveryPath: req.query.deliveryPath as string,
    deliveryTime: req.query.deliveryTime as string,
  };
}

router.get('/person', (req: Request, res: Response) => {
  const filters = getFiltersFromQuery(req);
  const hasFilters = Object.values(filters).some(Boolean);
  const stats = hasFilters ? taskService.getStatsByPerson(filters) : taskService.getStatsByPerson();
  res.json(stats);
});

router.get('/project', (req: Request, res: Response) => {
  const filters = getFiltersFromQuery(req);
  const hasFilters = Object.values(filters).some(Boolean);
  const stats = hasFilters ? taskService.getStatsByProject(filters) : taskService.getStatsByProject();
  res.json(stats);
});

router.get('/time', (req: Request, res: Response) => {
  const filters = getFiltersFromQuery(req);
  const hasFilters = Object.values(filters).some(Boolean);
  const stats = hasFilters ? taskService.getStatsByTime(filters) : taskService.getStatsByTime();
  res.json(stats);
});

router.get('/time-comparison', (req: Request, res: Response) => {
  const filters = getFiltersFromQuery(req);
  const hasFilters = Object.values(filters).some(Boolean);
  const timeRange = (req.query.timeRange as string) || 'month';
  const compareYear = req.query.compareYear ? parseInt(req.query.compareYear as string) : undefined;
  const baseYear = req.query.baseYear ? parseInt(req.query.baseYear as string) : undefined;
  const yearComparison = compareYear ? { compareYear, baseYear: baseYear || compareYear - 1 } : undefined;
  
  const comparison = hasFilters 
    ? taskService.getTimeComparison(filters, timeRange as any, yearComparison) 
    : taskService.getTimeComparison(undefined, timeRange as any, yearComparison);
  res.json(comparison);
});

export default router;
