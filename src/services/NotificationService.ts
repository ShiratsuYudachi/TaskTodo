import { Task, Event } from '@/types';
import { notifications } from '@mantine/notifications';

export class NotificationService {
  
  /**
   * 显示任务提醒
   */
  showTaskReminder(task: Task, level: 'low' | 'medium' | 'high' = 'medium'): void {
    const colors = {
      low: 'blue',
      medium: 'orange',
      high: 'red'
    };

    const title = level === 'high' ? '⚠️ 紧急提醒' : 
                 level === 'medium' ? '📋 任务提醒' : 
                 '💡 温馨提示';

    notifications.show({
      title,
      message: task.deadline ? 
        `"${task.title}" 截止时间：${task.deadline.toLocaleDateString()}` :
        `"${task.title}"`,
      color: colors[level],
      autoClose: level === 'high' ? false : 5000,
    });
  }

  /**
   * 显示事件提醒
   */
  showEventReminder(event: Event): void {
    notifications.show({
      title: '📅 事件提醒',
      message: `"${event.title}" - ${event.date.toLocaleString()}`,
      color: 'purple',
      autoClose: false,
    });
  }

  /**
   * 显示成功消息
   */
  showSuccess(message: string): void {
    notifications.show({
      title: '✅ 成功',
      message,
      color: 'green',
      autoClose: 3000,
    });
  }

  /**
   * 显示错误消息
   */
  showError(message: string): void {
    notifications.show({
      title: '❌ 错误',
      message,
      color: 'red',
      autoClose: 5000,
    });
  }

  /**
   * 显示信息消息
   */
  showInfo(message: string): void {
    notifications.show({
      title: 'ℹ️ 信息',
      message,
      color: 'blue',
      autoClose: 3000,
    });
  }

  /**
   * 检查截止时间提醒
   */
  checkDeadlineReminders(tasks: Task[]): void {
    const now = new Date();
    
    tasks.forEach(task => {
      if (!task.deadline || task.status === 'completed') return;
      
      const timeUntilDeadline = task.deadline.getTime() - now.getTime();
      const hoursUntil = timeUntilDeadline / (1000 * 60 * 60);
      
      if (hoursUntil <= 24 && hoursUntil > 0) {
        // 24小时内截止
        this.showTaskReminder(task, 'high');
      } else if (hoursUntil <= 72 && hoursUntil > 24) {
        // 3天内截止
        this.showTaskReminder(task, 'medium');
      }
    });
  }

  /**
   * 检查事件提醒
   */
  checkEventReminders(events: Event[]): void {
    const now = new Date();
    
    events.forEach(event => {
      if (event.isCompleted) return;
      
      const timeUntilEvent = event.date.getTime() - now.getTime();
      const hoursUntil = timeUntilEvent / (1000 * 60 * 60);
      
      if (hoursUntil <= 1 && hoursUntil > 0) {
        // 1小时内的事件
        this.showEventReminder(event);
      }
    });
  }

  /**
   * 请求通知权限（浏览器原生通知）
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('此浏览器不支持桌面通知');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  /**
   * 发送桌面通知
   */
  sendDesktopNotification(title: string, options?: { body?: string; icon?: string; badge?: string }): void {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    }
  }
}