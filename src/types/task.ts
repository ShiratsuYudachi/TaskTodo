export interface BaseItem {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  priority: number; // 0-3, 0最高优先级
  tags: string[];
}

export interface ProgressEntry {
  id: string;
  content: string;
  timestamp: Date;
  sessionDuration?: number; // 本次工作时长(分钟)
}

export interface SubTask {
  id: string;
  title: string;
  status: 'todo' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  deadline?: Date;
  priority?: number;
}

export interface Task extends BaseItem {
  type: 'task';
  status: 'todo' | 'completed'; // 移除in_progress，改为通过scheduledDate判断
  deadline?: Date;
  duration: 'short' | 'medium' | 'long' | 'ongoing';
  progressHistory: ProgressEntry[]; // 进度历史记录
  subtasks?: SubTask[]; // 子任务列表
  conditions?: string[]; // await的条件
  scheduledDate?: Date; // 被调度到计划清单的日期
  lastScheduled?: Date; // 上次被调度的时间
  lastWorkedOn?: Date; // 最后一次工作时间（用于降低近期活跃任务优先级）
  snoozedAt?: Date; // 任务被推迟的时间，用于动态调整优先级分数
  snoozeCount?: number; // 被推迟的次数，多次推迟会有更大的惩罚
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