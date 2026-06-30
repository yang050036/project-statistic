import express, { Request, Response } from 'express';
import { taskService } from '../services/taskService.js';
import { CreateTaskRequest } from '../types/task.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  const tasks = taskService.getAllTasks();
  res.json(tasks);
});

router.get('/search', (req: Request, res: Response) => {
  const filters = {
    projectNumber: req.query.projectNumber as string,
    person: req.query.person as string,
    customNumber: req.query.customNumber as string,
    customContent: req.query.customContent as string,
    deliveryPath: req.query.deliveryPath as string,
    deliveryTime: req.query.deliveryTime as string,
  };
  const tasks = taskService.searchTasks(filters);
  res.json(tasks);
});

router.get('/:id', (req: Request, res: Response) => {
  const task = taskService.getTaskById(req.params.id);
  if (task) {
    res.json(task);
  } else {
    res.status(404).json({ success: false, message: 'Task not found' });
  }
});

router.post('/', (req: Request, res: Response) => {
  const request: CreateTaskRequest = req.body;
  const newTask = taskService.createTask(request);
  res.status(201).json(newTask);
});

router.put('/:id', (req: Request, res: Response) => {
  const updates = req.body;
  const updatedTask = taskService.updateTask(req.params.id, updates);
  if (updatedTask) {
    res.json(updatedTask);
  } else {
    res.status(404).json({ success: false, message: 'Task not found' });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  const success = taskService.deleteTask(req.params.id);
  res.json({ success });
});

export default router;
