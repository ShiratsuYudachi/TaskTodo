import { Task, Event, AppState, SchedulingConfig } from '@/types';

export class StorageService {
  private readonly STORAGE_KEY = 'task-todo-data';

  private defaultConfig: SchedulingConfig = {
    maxDailyTasks: 8,
    priorityWeights: { 0: 10, 1: 7, 2: 4, 3: 1 },
    durationWeights: { short: 5, medium: 3, long: 2, ongoing: 1 },
    starvationThresholdDays: 7,
  };

  private defaultState: AppState = {
    tasks: [],
    events: [],
    plannedTasks: [],
    config: this.defaultConfig,
  };

  load(): AppState {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return this.defaultState;

      const parsed = JSON.parse(data);
      
      // 转换日期字符串为Date对象
      return {
        ...parsed,
        tasks: parsed.tasks?.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          deadline: task.deadline ? new Date(task.deadline) : undefined,
          scheduledDate: task.scheduledDate ? new Date(task.scheduledDate) : undefined,
          lastScheduled: task.lastScheduled ? new Date(task.lastScheduled) : undefined,
          lastWorkedOn: task.lastWorkedOn ? new Date(task.lastWorkedOn) : undefined,
          progressHistory: task.progressHistory ? task.progressHistory.map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp),
          })) : [],
        })) || [],
        events: parsed.events?.map((event: any) => ({
          ...event,
          createdAt: new Date(event.createdAt),
          updatedAt: new Date(event.updatedAt),
          date: new Date(event.date),
        })) || [],
        config: { ...this.defaultConfig, ...parsed.config },
      };
    } catch (error) {
      console.error('加载数据失败:', error);
      return this.defaultState;
    }
  }

  save(state: AppState): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('保存数据失败:', error);
    }
  }

  saveTask(task: Task): void {
    const state = this.load();
    const existingIndex = state.tasks.findIndex(t => t.id === task.id);
    
    if (existingIndex >= 0) {
      state.tasks[existingIndex] = { ...task, updatedAt: new Date() };
    } else {
      state.tasks.push(task);
    }
    
    this.save(state);
  }

  saveTasks(tasks: Task[]): void {
    const state = this.load();
    state.tasks = tasks;
    this.save(state);
  }

  saveEvent(event: Event): void {
    const state = this.load();
    const existingIndex = state.events.findIndex(e => e.id === event.id);
    
    if (existingIndex >= 0) {
      state.events[existingIndex] = { ...event, updatedAt: new Date() };
    } else {
      state.events.push(event);
    }
    
    this.save(state);
  }

  deleteTask(taskId: string): void {
    const state = this.load();
    state.tasks = state.tasks.filter(t => t.id !== taskId);
    state.plannedTasks = state.plannedTasks.filter(id => id !== taskId);
    this.save(state);
  }

  deleteEvent(eventId: string): void {
    const state = this.load();
    state.events = state.events.filter(e => e.id !== eventId);
    this.save(state);
  }

  savePlannedTasks(taskIds: string[]): void {
    const state = this.load();
    state.plannedTasks = taskIds;
    this.save(state);
  }

  updateConfig(config: Partial<SchedulingConfig>): void {
    const state = this.load();
    state.config = { ...state.config, ...config };
    this.save(state);
  }
}