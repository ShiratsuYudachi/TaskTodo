import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Text,
  Group,
  Button,
  Stack,
  Tabs,
  Badge,
  MultiSelect,
} from '@mantine/core';
import {
  IconRefresh,
  IconArchive,
  IconCheck,
  IconClock,
  IconTarget,
} from '@tabler/icons-react';
import { Task } from '@/types';
import { TaskList, AddTaskModal, InlineAddTaskRow } from '@/components';
import { StorageService } from '@/services/StorageService';
import { NotificationService } from '@/services/NotificationService';
import { createSubTask } from '@/utils/taskUtils';

export function TaskLibrary() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string[]>([]);

  const storage = new StorageService();
  const notification = new NotificationService();

  const loadTasks = () => {
    const state = storage.load();
    setAllTasks(state.tasks);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsAddModalOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    storage.deleteTask(taskId);
    notification.showInfo('任务已删除');
    loadTasks();
  };

  const handleTaskSubmit = (task: Task) => {
    storage.saveTask(task);
    notification.showSuccess(editingTask ? '任务已更新' : '任务已创建');
    setEditingTask(null);
    loadTasks();
  };

  const handleEditProgress = (taskId: string, progressId: string, newContent: string) => {
    storage.editTaskProgress(taskId, progressId, newContent);
    notification.showSuccess('进度已更新');
    loadTasks();
  };

  const handleDeleteProgress = (taskId: string, progressId: string) => {
    storage.deleteTaskProgress(taskId, progressId);
    notification.showInfo('进度已删除');
    loadTasks();
  };

  const getTasksByStatus = (status: 'todo' | 'completed' | 'in_plan') => {
    if (status === 'todo') {
      return allTasks.filter(task => task.status === 'todo');
    } else if (status === 'completed') {
      return allTasks.filter(task => task.status === 'completed');
    } else if (status === 'in_plan') {
      const state = storage.load();
      return allTasks.filter(task => 
        state.plannedTasks.includes(task.id) && task.status === 'todo'
      );
    }
    return [];
  };

  const getTasksWithDeadline = () => {
    return allTasks.filter(task => task.deadline && task.status !== 'completed');
  };

  const renderTaskList = () => {
    let tasks: Task[] = [];
    let emptyText = '暂无任务';

    switch (activeTab) {
      case 'all':
        tasks = allTasks;
        emptyText = '还没有创建任何任务';
        break;
      case 'todo':
        tasks = getTasksByStatus('todo');
        emptyText = '没有待办任务';
        break;
      case 'in_plan':
        tasks = getTasksByStatus('in_plan');
        emptyText = '没有计划中的任务';
        break;
      case 'completed':
        tasks = getTasksByStatus('completed');
        emptyText = '还没有完成任何任务';
        break;
      case 'deadline':
        tasks = getTasksWithDeadline().sort((a, b) => {
          if (!a.deadline || !b.deadline) return 0;
          return a.deadline.getTime() - b.deadline.getTime();
        });
        emptyText = '没有设置截止时间的未完成任务';
        break;
      default:
        tasks = allTasks;
    }

    if (tagFilter.length > 0) {
      tasks = tasks.filter(t => (t.tags || []).some(tag => tagFilter.includes(tag)));
    }
    return (
      <TaskList
        title=""
        tasks={tasks}
        emptyText={emptyText}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        onToggleComplete={(taskId, completed) => {
          const state = storage.load();
          const task = state.tasks.find(t => t.id === taskId);
          if (task) {
            task.status = completed ? 'completed' : 'todo';
            task.updatedAt = new Date();
            storage.saveTask(task);
            notification.showSuccess(completed ? '任务已完成' : '已恢复为未完成');
            loadTasks();
          }
        }}
        onEditProgress={handleEditProgress}
        onDeleteProgress={handleDeleteProgress}
        onAddSubtask={(taskId, title) => {
          const st = createSubTask(title);
          storage.addSubTask(taskId, st);
          notification.showSuccess('子任务已创建');
          loadTasks();
        }}
        onToggleSubtask={(taskId, subtaskId, completed) => {
          storage.toggleSubTask(taskId, subtaskId, completed);
          loadTasks();
        }}
        onDeleteSubtask={(taskId, subtaskId) => {
          storage.deleteSubTask(taskId, subtaskId);
          notification.showInfo('子任务已删除');
          loadTasks();
        }}
      />
    );
  };

  return (
    <Container fluid>
      <Stack gap="lg">
        {/* 页面标题和操作 */}
        <Group justify="space-between">
          <div>
            <Group gap="xs">
              <IconArchive size={24} />
              <Text size="xl" fw={600}>
                任务库
              </Text>
            </Group>
            <Text c="dimmed" size="sm">
              管理所有任务，查看完整历史记录
            </Text>
          </div>
          <Group gap="sm" align="center">
            <Button
              leftSection={<IconRefresh size={16} />}
              variant="subtle"
              onClick={loadTasks}
            >
              刷新
            </Button>
            <InlineAddTaskRow
              onSubmit={(task) => {
                storage.saveTask(task);
                notification.showSuccess('任务已创建');
                loadTasks();
              }}
              width={520}
              suggestedTags={storage.getAllTags()}
            />
          </Group>
        </Group>

        {/* 统计概览 */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper shadow="sm" p="lg" withBorder>
              <Group justify="space-between">
                <div>
                  <Text c="dimmed" size="sm" fw={500}>
                    全部任务
                  </Text>
                  <Text size="xl" fw={700}>
                    {allTasks.length}
                  </Text>
                </div>
                <IconTarget size={24} color="blue" />
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper shadow="sm" p="lg" withBorder>
              <Group justify="space-between">
                <div>
                  <Text c="dimmed" size="sm" fw={500}>
                    待办任务
                  </Text>
                  <Text size="xl" fw={700}>
                    {getTasksByStatus('todo').length}
                  </Text>
                </div>
                <IconClock size={24} color="orange" />
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper shadow="sm" p="lg" withBorder>
              <Group justify="space-between">
                <div>
                  <Text c="dimmed" size="sm" fw={500}>
                    计划中
                  </Text>
                  <Text size="xl" fw={700}>
                    {getTasksByStatus('in_plan').length}
                  </Text>
                </div>
                <IconTarget size={24} color="blue" />
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper shadow="sm" p="lg" withBorder>
              <Group justify="space-between">
                <div>
                  <Text c="dimmed" size="sm" fw={500}>
                    已完成
                  </Text>
                  <Text size="xl" fw={700}>
                    {getTasksByStatus('completed').length}
                  </Text>
                </div>
                <IconCheck size={24} color="green" />
              </Group>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* 任务分类标签页 */}
        <Paper shadow="sm" withBorder>
          <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'all')}>
            <Tabs.List>
              <Tabs.Tab value="all" leftSection={<IconArchive size={16} />}>
                全部
                <Badge size="sm" ml="xs">
                  {allTasks.length}
                </Badge>
              </Tabs.Tab>
              <Tabs.Tab value="todo" leftSection={<IconClock size={16} />}>
                待办
                <Badge size="sm" ml="xs">
                  {getTasksByStatus('todo').length}
                </Badge>
              </Tabs.Tab>
              <Tabs.Tab value="in_plan" leftSection={<IconTarget size={16} />}>
                计划中
                <Badge size="sm" ml="xs">
                  {getTasksByStatus('in_plan').length}
                </Badge>
              </Tabs.Tab>
              <Tabs.Tab value="completed" leftSection={<IconCheck size={16} />}>
                已完成
                <Badge size="sm" ml="xs">
                  {getTasksByStatus('completed').length}
                </Badge>
              </Tabs.Tab>
              <Tabs.Tab value="deadline">
                有截止时间
                <Badge size="sm" ml="xs">
                  {getTasksWithDeadline().length}
                </Badge>
              </Tabs.Tab>
              <div style={{ marginLeft: 'auto', paddingRight: 12, minWidth: 240 }}>
                <MultiSelect
                  placeholder="按标签筛选"
                  data={storage.getAllTags()}
                  value={tagFilter}
                  onChange={setTagFilter}
                  searchable
                  clearable
                />
              </div>
            </Tabs.List>

            <Tabs.Panel value={activeTab} pt="lg">
              {renderTaskList()}
            </Tabs.Panel>
          </Tabs>
        </Paper>
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
        suggestedTags={storage.getAllTags()}
      />
    </Container>
  );
}