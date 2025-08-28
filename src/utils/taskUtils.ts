import { Task, Event, ProgressEntry, SubTask } from '@/types';
import { nanoid } from 'nanoid';

/**
 * 创建新任务
 */
export function createTask(data: Partial<Task>): Task {
  const now = new Date();
  
  return {
    id: nanoid(),
    type: 'task',
    title: data.title || '',
    description: data.description || '',
    priority: data.priority ?? 3,
    status: data.status || 'todo',
    duration: data.duration || 'medium',
    tags: data.tags || [],
    progressHistory: data.progressHistory || [],
    createdAt: now,
    updatedAt: now,
    deadline: data.deadline,
    conditions: data.conditions,
    ...data,
  };
}

/**
 * 创建进度记录
 */
export function createProgressEntry(content: string, sessionDuration?: number): ProgressEntry {
  return {
    id: nanoid(),
    content: content.trim(),
    timestamp: new Date(),
    sessionDuration,
  };
}

/**
 * 创建子任务
 */
export function createSubTask(title: string, overrides?: Partial<SubTask>): SubTask {
  const now = new Date();
  return {
    id: nanoid(),
    title: title.trim(),
    status: overrides?.status || 'todo',
    createdAt: now,
    updatedAt: now,
    deadline: overrides?.deadline,
    priority: overrides?.priority,
    ...overrides,
  };
}

/**
 * 创建新事件
 */
export function createEvent(data: Partial<Event>): Event {
  const now = new Date();
  
  return {
    id: nanoid(),
    type: 'event',
    title: data.title || '',
    description: data.description || '',
    priority: data.priority ?? 3,
    tags: data.tags || [],
    createdAt: now,
    updatedAt: now,
    date: data.date || now,
    isCompleted: data.isCompleted || false,
    ...data,
  };
}

/**
 * 获取优先级标签
 */
export function getPriorityLabel(priority: number): string {
  const labels: Record<number, string> = {
    0: 'P0 紧急',
    1: 'P1 高',
    2: 'P2 中',
    3: 'P3 低',
  };
  return labels[priority] || 'P3 低';
}

/**
 * 获取优先级颜色
 */
export function getPriorityColor(priority: number): string {
  const colors: Record<number, string> = {
    0: 'red',
    1: 'orange',
    2: 'yellow',
    3: 'green',
  };
  return colors[priority] || 'green';
}

/**
 * 获取任务时长标签
 */
export function getDurationLabel(duration: Task['duration']): string {
  const labels: Record<Task['duration'], string> = {
    short: '短期',
    medium: '中期',
    long: '长期',
    ongoing: '持续',
  };
  return labels[duration];
}

/**
 * 获取任务状态标签（基于状态和进度）
 */
export function getStatusLabel(task: Task): string {
  if (task.status === 'completed') return '已完成';
  if (task.scheduledDate && isToday(task.scheduledDate)) return '今日计划';
  if (task.subtasks && task.subtasks.some(st => st.status === 'completed')) return '有进展';
  if (task.progressHistory && task.progressHistory.length > 0) return '有进展';
  return '待开始';
}

/**
 * 获取任务状态颜色
 */
export function getStatusColor(task: Task): string {
  if (task.status === 'completed') return 'green';
  if (task.scheduledDate && isToday(task.scheduledDate)) return 'blue';
  if (task.subtasks && task.subtasks.length > 0) return 'cyan';
  if (task.progressHistory && task.progressHistory.length > 0) return 'cyan';
  return 'gray';
}

/**
 * 判断是否为今天
 */
function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * 获取任务最新进度
 */
export function getLatestProgress(task: Task): string {
  if (task.subtasks && task.subtasks.length > 0) {
    const last = [...task.subtasks].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
    return last ? last.title : '';
  }
  if (!task.progressHistory || task.progressHistory.length === 0) return '';
  return task.progressHistory[task.progressHistory.length - 1].content;
}

/**
 * 获取任务总进度数量
 */
export function getProgressCount(task: Task): number {
  const progressCount = task.progressHistory ? task.progressHistory.length : 0;
  const subCount = task.subtasks ? task.subtasks.length : 0;
  return progressCount + subCount;
}

/**
 * 判断任务是否在今日计划中
 */
export function isInTodayPlan(task: Task): boolean {
  return !!(task.scheduledDate && isToday(task.scheduledDate));
}

/**
 * 检查任务是否逾期
 */
export function isTaskOverdue(task: Task): boolean {
  if (!task.deadline || task.status === 'completed') return false;
  return task.deadline < new Date();
}

/**
 * 计算距离截止时间的天数
 */
export function getDaysUntilDeadline(deadline: Date): number {
  const now = new Date();
  const diffTime = deadline.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 格式化日期显示
 */
export function formatDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (targetDate.getTime() === today.getTime()) {
    return '今天';
  } else if (targetDate.getTime() === tomorrow.getTime()) {
    return '明天';
  } else if (targetDate.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
    return '昨天';
  }
  
  return date.toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short'
  });
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffTime / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays}天前`;
  } else if (diffHours > 0) {
    return `${diffHours}小时前`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes}分钟前`;
  } else {
    return '刚刚';
  }
}

/**
 * 过滤和搜索任务
 */
export function filterTasks(
  tasks: Task[],
  filters: {
    search?: string;
    status?: ('todo' | 'completed' | 'in_plan' | 'has_progress')[];
    priority?: number[];
    duration?: Task['duration'][];
    tags?: string[];
    hasDeadline?: boolean;
    overdue?: boolean;
  }
): Task[] {
  return tasks.filter(task => {
    // 搜索过滤
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const progressText = task.progressHistory ? 
        task.progressHistory.map(p => p.content).join(' ') : '';
      const subText = task.subtasks ? task.subtasks.map(s => s.title).join(' ') : '';
      if (!task.title.toLowerCase().includes(searchLower) &&
          !task.description?.toLowerCase().includes(searchLower) &&
          !progressText.toLowerCase().includes(searchLower) &&
          !subText.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // 状态过滤（扩展状态概念）
    if (filters.status && filters.status.length > 0) {
      const taskStatuses: string[] = [];
      
      if (task.status === 'todo') taskStatuses.push('todo');
      if (task.status === 'completed') taskStatuses.push('completed');
      if (isInTodayPlan(task)) taskStatuses.push('in_plan');
      if (task.progressHistory && task.progressHistory.length > 0) taskStatuses.push('has_progress');
      
      if (!filters.status.some(status => taskStatuses.includes(status))) return false;
    }

    // 优先级过滤
    if (filters.priority && filters.priority.length > 0) {
      if (!filters.priority.includes(task.priority)) return false;
    }

    // 时长过滤
    if (filters.duration && filters.duration.length > 0) {
      if (!filters.duration.includes(task.duration)) return false;
    }

    // 标签过滤
    if (filters.tags && filters.tags.length > 0) {
      if (!filters.tags.some(tag => task.tags.includes(tag))) return false;
    }

    // 截止时间过滤
    if (filters.hasDeadline !== undefined) {
      const hasDeadline = !!task.deadline;
      if (hasDeadline !== filters.hasDeadline) return false;
    }

    // 逾期过滤
    if (filters.overdue !== undefined) {
      const overdue = isTaskOverdue(task);
      if (overdue !== filters.overdue) return false;
    }

    return true;
  });
}