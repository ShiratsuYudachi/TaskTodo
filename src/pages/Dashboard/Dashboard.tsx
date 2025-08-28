import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Text,
  Group,
  Button,
  Stack,
  Badge,
  ActionIcon,
  Card,
} from '@mantine/core';
import {
  IconRefresh,
  IconBulb,
  IconTarget,
  IconClock,
  IconTrendingUp,
} from '@tabler/icons-react';
import { Task, ProgressEntry } from '@/types';
import { TaskList, AddTaskModal, InlineAddTaskRow } from '@/components';
import { TaskScheduler } from '@/services/TaskScheduler';
import { StorageService } from '@/services/StorageService';
import { NotificationService } from '@/services/NotificationService';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [plannedTasks, setPlannedTasks] = useState<Task[]>([]);
  const [recommendedTasks, setRecommendedTasks] = useState<Task[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTaskCount: 0,
  });

  const scheduler = new TaskScheduler();
  const storage = new StorageService();
  const notification = new NotificationService();

  const loadData = () => {
    // 自动调度清理
    scheduler.autoSchedule();
    
    // 获取今日计划任务
    const planned = scheduler.getPlannedTasks();
    setPlannedTasks(planned);

    // 获取推荐任务
    const recommended = scheduler.recommendDailyTasks().slice(0, 4);
    setRecommendedTasks(recommended);

    // 计算统计数据
    const state = storage.load();
    const allTasks = state.tasks;
    const now = new Date();
    
    setStats({
      totalTasks: allTasks.length,
      completedTasks: allTasks.filter(t => t.status === 'completed').length,
      inProgressTasks: state.plannedTasks.length, // 今日计划任务数量作为"进行中"
      overdueTaskCount: allTasks.filter(t => 
        t.deadline && t.deadline < now && t.status !== 'completed'
      ).length,
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCompleteTask = (taskId: string) => {
    scheduler.completeTask(taskId);
    const state = storage.load();
    const task = state.tasks.find(t => t.id === taskId);
    
    if (task) {
      notification.showSuccess(`任务"${task.title}"已完成！`);
    }
    
    loadData();
  };

  const handleDeferTask = (taskId: string, progressEntry: ProgressEntry) => {
    scheduler.deferTask(taskId, progressEntry);
    const state = storage.load();
    const task = state.tasks.find(t => t.id === taskId);
    
    if (task) {
      notification.showInfo(`任务"${task.title}"的进度已记录，移出今日计划`);
    }
    
    loadData();
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsAddModalOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    storage.deleteTask(taskId);
    notification.showInfo('任务已删除');
    loadData();
  };

  const handleAddToPlanned = (taskId: string) => {
    scheduler.addToPlannedTasks(taskId);
    notification.showSuccess('任务已添加到今日计划');
    loadData();
  };


  const handleTaskSubmit = (task: Task) => {
    storage.saveTask(task);
    notification.showSuccess(editingTask ? '任务已更新' : '任务已创建');
    setEditingTask(null);
    loadData();
  };

  

  const handleEditProgress = (taskId: string, progressId: string, newContent: string) => {
    storage.editTaskProgress(taskId, progressId, newContent);
    notification.showSuccess('进度已更新');
    loadData();
  };

  const handleDeleteProgress = (taskId: string, progressId: string) => {
    storage.deleteTaskProgress(taskId, progressId);
    notification.showInfo('进度已删除');
    loadData();
  };

  const statsCards = [
    {
      title: '总任务数',
      value: stats.totalTasks,
      icon: IconTarget,
      color: 'blue',
    },
    {
      title: '进行中',
      value: stats.inProgressTasks,
      icon: IconTrendingUp,
      color: 'orange',
    },
    {
      title: '已完成',
      value: stats.completedTasks,
      icon: IconTarget,
      color: 'green',
    },
    {
      title: '逾期任务',
      value: stats.overdueTaskCount,
      icon: IconClock,
      color: 'red',
    },
  ];

  return (
    <Container fluid>
      <Stack gap="lg">
        {/* 页面标题和操作 */}
        <Group justify="space-between">
          <div>
            <Text size="xl" fw={600}>
              今日仪表板
            </Text>
            <Text c="dimmed" size="sm">
              欢迎回来！这里是您今天的任务概览
            </Text>
          </div>
          <Group gap="sm">
            <Button
              leftSection={<IconRefresh size={16} />}
              variant="subtle"
              onClick={loadData}
            >
              刷新
            </Button>
            <InlineAddTaskRow
              onSubmit={(task) => {
                storage.saveTask(task);
                notification.showSuccess('任务已创建');
                loadData();
              }}
              width={520}
            />
          </Group>
        </Group>

        {/* 统计卡片 */}
        <Grid>
          {statsCards.map((stat) => (
            <Grid.Col key={stat.title} span={{ base: 12, sm: 6, md: 3 }}>
              <Card shadow="sm" padding="lg">
                <Group justify="space-between">
                  <div>
                    <Text c="dimmed" size="sm" fw={500}>
                      {stat.title}
                    </Text>
                    <Text size="xl" fw={700}>
                      {stat.value}
                    </Text>
                  </div>
                  <ActionIcon
                    size="lg"
                    radius="xl"
                    variant="light"
                    color={stat.color}
                  >
                    <stat.icon size={20} />
                  </ActionIcon>
                </Group>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        {/* 主要内容区域 */}
        <Grid>
          {/* 今日计划 */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Paper shadow="sm" p="md" withBorder>
              <TaskList
                title="今日计划"
                tasks={plannedTasks}
                emptyText="今日暂无计划任务，试试从候选池添加一些任务吧！"
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onComplete={handleCompleteTask}
                onToggleComplete={(taskId, completed) => {
                  const state = storage.load();
                  const task = state.tasks.find(t => t.id === taskId);
                  if (task) {
                    task.status = completed ? 'completed' : 'todo';
                    task.updatedAt = new Date();
                    storage.saveTask(task);
                    notification.showSuccess(completed ? '任务已完成' : '已恢复为未完成');
                    loadData();
                  }
                }}
                onDeferTask={handleDeferTask}
                onEditProgress={handleEditProgress}
                onDeleteProgress={handleDeleteProgress}
                onRefresh={loadData}
                onAddNew={() => onNavigate('candidate')}
              />
              
              {plannedTasks.length > 0 && (
                <Group justify="center" mt="md">
                  <Text size="sm" c="dimmed">
                    从计划中移除任务请使用任务卡片的操作菜单
                  </Text>
                </Group>
              )}
            </Paper>
          </Grid.Col>

          {/* 推荐任务 */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper shadow="sm" p="md" withBorder>
              <Group justify="space-between" mb="md">
                <Group gap="xs">
                  <IconBulb size={20} />
                  <Text fw={600}>智能推荐</Text>
                </Group>
                <Button
                  size="xs"
                  variant="subtle"
                  onClick={() => onNavigate('candidate')}
                >
                  查看更多
                </Button>
              </Group>
              
              {recommendedTasks.length === 0 ? (
                <Text c="dimmed" size="sm" ta="center" py="xl">
                  暂无推荐任务
                </Text>
              ) : (
                <Stack gap="sm">
                  {recommendedTasks.map((task) => (
                    <Card key={task.id} shadow="xs" padding="sm" withBorder>
                      <Group justify="space-between" align="flex-start">
                        <div className="flex-1 min-w-0">
                          <Text size="sm" fw={500} className="truncate">
                            {task.title}
                          </Text>
                          <Group gap="xs" mt="xs">
                            <Badge size="xs" color="blue">
                              P{task.priority}
                            </Badge>
                            <Badge size="xs" variant="outline">
                              {task.duration === 'short' ? '短' :
                               task.duration === 'medium' ? '中' :
                               task.duration === 'long' ? '长' : '持续'}
                            </Badge>
                          </Group>
                        </div>
                        <Button
                          size="xs"
                          onClick={() => handleAddToPlanned(task.id)}
                        >
                          添加
                        </Button>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              )}
            </Paper>
          </Grid.Col>
        </Grid>
      </Stack>

      {/* 添加/编辑任务模态框 */}
      <AddTaskModal
        opened={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleTaskSubmit}
        editTask={editingTask}
      />
    </Container>
  );
}