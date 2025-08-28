import { Task, Event } from '@/types';
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
    createdAt: now,
    updatedAt: now,
    deadline: data.deadline,
    progress: data.progress,
    conditions: data.conditions,
    ...data,
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
 * 获取任务状态标签
 */
export function getStatusLabel(status: Task['status']): string {
  const labels: Record<Task['status'], string> = {
    todo: '待开始',
    in_progress: '进行中',
    completed: '已完成',
  };
  return labels[status];
}

/**
 * 获取任务状态颜色
 */
export function getStatusColor(status: Task['status']): string {
  const colors: Record<Task['status'], string> = {
    todo: 'gray',
    in_progress: 'blue',
    completed: 'green',
  };
  return colors[status];
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
    status?: Task['status'][];
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
      if (!task.title.toLowerCase().includes(searchLower) &&
          !task.description?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // 状态过滤
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(task.status)) return false;
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