export interface BaseItem {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  priority: number; // 0-3, 0最高优先级
  tags: string[];
}

export interface Task extends BaseItem {
  type: 'task';
  status: 'todo' | 'in_progress' | 'completed';
  deadline?: Date;
  duration: 'short' | 'medium' | 'long' | 'ongoing';
  progress?: string; // 记录完成了什么
  conditions?: string[]; // await的条件
  scheduledDate?: Date; // 被调度到计划清单的日期
  lastScheduled?: Date; // 上次被调度的时间（用于防止饥饿）
}

export interface Event extends BaseItem {
  type: 'event';
  date: Date;
  isCompleted: boolean;
}

export type TodoItem = Task | Event;

export interface SchedulingConfig {
  maxDailyTasks: number;
  priorityWeights: Record<number, number>;
  durationWeights: Record<Task['duration'], number>;
  starvationThresholdDays: number;
}

export interface AppState {
  tasks: Task[];
  events: Event[];
  plannedTasks: string[]; // 今日计划的任务ID列表
  config: SchedulingConfig;
}