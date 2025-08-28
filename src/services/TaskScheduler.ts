import { Task, SchedulingConfig } from '@/types';
import { StorageService } from './StorageService';

export class TaskScheduler {
  private storage: StorageService;

  constructor() {
    this.storage = new StorageService();
  }

  /**
   * 获取候选池任务
   * 排除已完成、已计划、有阻塞条件的任务
   */
  getCandidatePool(): Task[] {
    const state = this.storage.load();

    return state.tasks.filter(task => {
      // 排除已完成的任务
      if (task.status === 'completed') return false;
      
      // 排除今天已经在计划清单中的任务
      if (state.plannedTasks.includes(task.id)) return false;
      
      // 排除有未满足条件的任务
      if (task.conditions && task.conditions.length > 0) return false;
      
      return true;
    });
  }

  /**
   * 计算任务优先级分数
   * 考虑：基础优先级、截止时间紧急程度、饥饿问题、持续时间、近期活跃度
   */
  private calculateTaskScore(task: Task, config: SchedulingConfig): number {
    const now = new Date();
    let score = 0;

    // 基础优先级权重
    score += config.priorityWeights[task.priority] || 1;

    // 时长权重（短任务优先）
    score += config.durationWeights[task.duration] || 1;

    // 截止时间紧急度
    if (task.deadline) {
      const daysUntilDeadline = Math.ceil((task.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDeadline <= 1) {
        score += 20; // 今明两天截止的任务加大权重
      } else if (daysUntilDeadline <= 3) {
        score += 10; // 3天内截止的任务
      } else if (daysUntilDeadline <= 7) {
        score += 5; // 一周内截止的任务
      }
      
      // 越接近截止时间分数越高
      score += Math.max(0, 30 - daysUntilDeadline);
    }

    // 饥饿问题处理：长期没有被调度的任务
    if (task.lastScheduled) {
      const daysSinceLastScheduled = Math.ceil((now.getTime() - task.lastScheduled.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLastScheduled >= config.starvationThresholdDays) {
        score += daysSinceLastScheduled * 2; // 防止饥饿
      }
    } else {
      // 从未被调度的任务，根据创建时间给予额外分数
      const daysSinceCreated = Math.ceil((now.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceCreated >= config.starvationThresholdDays) {
        score += daysSinceCreated;
      }
    }

    // 🔥 近期活跃度惩罚：降低刚做过的任务优先级
    if (task.lastWorkedOn) {
      const daysSinceLastWorked = Math.ceil((now.getTime() - task.lastWorkedOn.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastWorked <= 1) {
        score -= 8; // 昨天刚做过，大幅降低优先级
      } else if (daysSinceLastWorked <= 3) {
        score -= 5; // 3天内做过，中等降低
      } else if (daysSinceLastWorked <= 7) {
        score -= 2; // 一周内做过，轻微降低
      }
    }

    // 有进度记录的任务稍微降低优先级（表示已经开始过）
    if (task.progressHistory && task.progressHistory.length > 0) {
      const latestProgress = task.progressHistory[task.progressHistory.length - 1];
      const daysSinceLatestProgress = Math.ceil((now.getTime() - latestProgress.timestamp.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLatestProgress <= 2) {
        score -= 3; // 近期有进展，稍微降低优先级
      }
    }

    // 确保分数不为负数
    return Math.max(0, score);
  }

  /**
   * 智能推荐今日任务
   * 从候选池中选择合适的任务添加到计划清单
   */
  recommendDailyTasks(): Task[] {
    const candidates = this.getCandidatePool();
    const state = this.storage.load();
    const config = state.config;

    // 按分数排序
    const scoredTasks = candidates
      .map(task => ({
        task,
        score: this.calculateTaskScore(task, config)
      }))
      .sort((a, b) => b.score - a.score);

    // 选择推荐任务，考虑任务组合的平衡
    const recommended: Task[] = [];
    const maxTasks = Math.min(config.maxDailyTasks, scoredTasks.length);
    
    // 优先选择高分任务
    for (let i = 0; i < maxTasks && i < scoredTasks.length; i++) {
      const { task } = scoredTasks[i];
      
      // 避免全都是长任务
      const longTaskCount = recommended.filter(t => t.duration === 'long').length;
      if (task.duration === 'long' && longTaskCount >= 2) {
        continue;
      }
      
      recommended.push(task);
    }

    return recommended;
  }

  /**
   * 添加任务到今日计划
   */
  addToPlannedTasks(taskId: string): void {
    const state = this.storage.load();
    if (!state.plannedTasks.includes(taskId)) {
      state.plannedTasks.push(taskId);
      
      // 更新任务的lastScheduled时间
      const task = state.tasks.find(t => t.id === taskId);
      if (task) {
        task.lastScheduled = new Date();
        task.scheduledDate = new Date();
        this.storage.saveTask(task);
      }
      
      this.storage.savePlannedTasks(state.plannedTasks);
    }
  }

  /**
   * 从今日计划中移除任务
   */
  removeFromPlannedTasks(taskId: string): void {
    const state = this.storage.load();
    const newPlannedTasks = state.plannedTasks.filter(id => id !== taskId);
    this.storage.savePlannedTasks(newPlannedTasks);
  }

  /**
   * 获取今日计划任务
   */
  getPlannedTasks(): Task[] {
    const state = this.storage.load();
    const tasks = state.tasks.filter(task => state.plannedTasks.includes(task.id));
    
    // 按优先级和截止时间排序
    return tasks.sort((a, b) => {
      // 优先级排序（0是最高优先级）
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      
      // 截止时间排序
      if (a.deadline && b.deadline) {
        return a.deadline.getTime() - b.deadline.getTime();
      }
      if (a.deadline && !b.deadline) return -1;
      if (!a.deadline && b.deadline) return 1;
      
      return 0;
    });
  }

  /**
   * 暂存任务（记录进度并从今日计划移除）
   */
  deferTask(taskId: string, progressEntry: { id: string; content: string; timestamp: Date; sessionDuration?: number }): void {
    const state = this.storage.load();
    const task = state.tasks.find(t => t.id === taskId);
    
    if (task) {
      // 确保progressHistory存在
      if (!task.progressHistory) {
        task.progressHistory = [];
      }
      
      // 添加进度记录
      task.progressHistory.push(progressEntry);
      
      // 更新最后工作时间
      task.lastWorkedOn = new Date();
      task.updatedAt = new Date();
      
      // 保存任务
      this.storage.saveTask(task);
      
      // 从今日计划中移除
      this.removeFromPlannedTasks(taskId);
    }
  }

  /**
   * 完成任务
   */
  completeTask(taskId: string): void {
    const state = this.storage.load();
    const task = state.tasks.find(t => t.id === taskId);
    
    if (task) {
      task.status = 'completed';
      task.updatedAt = new Date();
      
      // 从今日计划中移除
      this.removeFromPlannedTasks(taskId);
      
      this.storage.saveTask(task);
    }
  }

  /**
   * 自动调度：清理过期计划并推荐新任务
   */
  autoSchedule(): void {
    const state = this.storage.load();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 清理昨天的计划任务
    const tasksToKeep: string[] = [];
    state.plannedTasks.forEach(taskId => {
      const task = state.tasks.find(t => t.id === taskId);
      if (task && task.scheduledDate) {
        const scheduledDate = new Date(task.scheduledDate.getFullYear(), 
          task.scheduledDate.getMonth(), task.scheduledDate.getDate());
        
        // 保留今天的任务
        if (scheduledDate.getTime() === today.getTime()) {
          tasksToKeep.push(taskId);
        }
      }
    });

    this.storage.savePlannedTasks(tasksToKeep);
  }
}