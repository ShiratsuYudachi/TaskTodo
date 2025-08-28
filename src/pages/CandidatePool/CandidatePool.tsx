import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Text,
  Group,
  Button,
  Stack,
  Card,
  Select,
  TextInput,
} from '@mantine/core';
import {
  IconSearch,
  IconFilter,
  IconRefresh,
  IconCalendarPlus,
  IconSortDescending,
  IconBulb,
} from '@tabler/icons-react';
import { Task } from '@/types';
import { TaskList, AddTaskModal } from '@/components';
import { TaskScheduler } from '@/services/TaskScheduler';
import { StorageService } from '@/services/StorageService';
import { NotificationService } from '@/services/NotificationService';
import { filterTasks } from '@/utils/taskUtils';

export function CandidatePool() {
  const [candidates, setCandidates] = useState<Task[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Task[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('score');

  const scheduler = new TaskScheduler();
  const storage = new StorageService();
  const notification = new NotificationService();

  const loadCandidates = () => {
    const candidatePool = scheduler.getCandidatePool();
    setCandidates(candidatePool);
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  useEffect(() => {
    let filtered = [...candidates];

    // 应用搜索和过滤
    const filters: any = {};
    if (searchQuery) filters.search = searchQuery;
    if (priorityFilter) filters.priority = [parseInt(priorityFilter)];
    if (statusFilter) filters.status = [statusFilter as Task['status']];

    filtered = filterTasks(filtered, filters);

    // 应用排序
    if (sortBy === 'priority') {
      filtered.sort((a, b) => a.priority - b.priority);
    } else if (sortBy === 'deadline') {
      filtered.sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.getTime() - b.deadline.getTime();
      });
    } else if (sortBy === 'created') {
      filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    // 默认按智能分数排序
    // TODO: 这里可以实现计算分数的逻辑

    setFilteredCandidates(filtered);
  }, [candidates, searchQuery, priorityFilter, statusFilter, sortBy]);

  const handleCompleteTask = (taskId: string) => {
    scheduler.completeTask(taskId);
    const state = storage.load();
    const task = state.tasks.find(t => t.id === taskId);
    
    if (task) {
      notification.showSuccess(`任务"${task.title}"已完成！`);
    }
    
    loadCandidates();
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsAddModalOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    storage.deleteTask(taskId);
    notification.showInfo('任务已删除');
    loadCandidates();
  };

  const handleAddToPlanned = (taskId: string) => {
    scheduler.addToPlannedTasks(taskId);
    notification.showSuccess('任务已添加到今日计划');
    loadCandidates();
  };

  const handleTaskSubmit = (task: Task) => {
    storage.saveTask(task);
    notification.showSuccess(editingTask ? '任务已更新' : '任务已创建');
    setEditingTask(null);
    loadCandidates();
  };

  const handleBatchAddRecommended = () => {
    const recommended = scheduler.recommendDailyTasks().slice(0, 3);
    recommended.forEach(task => {
      scheduler.addToPlannedTasks(task.id);
    });
    
    if (recommended.length > 0) {
      notification.showSuccess(`已添加${recommended.length}个推荐任务到今日计划`);
      loadCandidates();
    }
  };

  const handleEditProgress = (taskId: string, progressId: string, newContent: string) => {
    storage.editTaskProgress(taskId, progressId, newContent);
    notification.showSuccess('进度已更新');
    loadCandidates();
  };

  const handleDeleteProgress = (taskId: string, progressId: string) => {
    storage.deleteTaskProgress(taskId, progressId);
    notification.showInfo('进度已删除');
    loadCandidates();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setPriorityFilter('');
    setStatusFilter('');
    setSortBy('score');
  };

  const priorityOptions = [
    { value: '', label: '全部优先级' },
    { value: '0', label: 'P0 紧急' },
    { value: '1', label: 'P1 高' },
    { value: '2', label: 'P2 中' },
    { value: '3', label: 'P3 低' },
  ];

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'todo', label: '待开始' },
    { value: 'in_progress', label: '进行中' },
  ];

  const sortOptions = [
    { value: 'score', label: '智能推荐' },
    { value: 'priority', label: '优先级' },
    { value: 'deadline', label: '截止时间' },
    { value: 'created', label: '创建时间' },
  ];

  return (
    <Container fluid>
      <Stack gap="lg">
        {/* 页面标题和操作 */}
        <Group justify="space-between">
          <div>
            <Group gap="xs">
              <IconBulb size={24} />
              <Text size="xl" fw={600}>
                候选池
              </Text>
            </Group>
            <Text c="dimmed" size="sm">
              所有可执行的任务，基于智能算法排序
            </Text>
          </div>
          <Group gap="sm">
            <Button
              leftSection={<IconRefresh size={16} />}
              variant="subtle"
              onClick={loadCandidates}
            >
              刷新
            </Button>
            <Button
              leftSection={<IconCalendarPlus size={16} />}
              onClick={handleBatchAddRecommended}
              disabled={candidates.length === 0}
            >
              批量添加推荐
            </Button>
          </Group>
        </Group>

        {/* 搜索和过滤栏 */}
        <Paper shadow="sm" p="md" withBorder>
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <TextInput
                placeholder="搜索任务..."
                leftSection={<IconSearch size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
              <Select
                placeholder="优先级"
                data={priorityOptions}
                value={priorityFilter}
                onChange={(value) => setPriorityFilter(value || '')}
                clearable
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
              <Select
                placeholder="状态"
                data={statusOptions}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value || '')}
                clearable
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
              <Select
                placeholder="排序方式"
                leftSection={<IconSortDescending size={16} />}
                data={sortOptions}
                value={sortBy}
                onChange={(value) => setSortBy(value || 'score')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 12, md: 3 }}>
              <Group gap="xs" justify="flex-end">
                <Button
                  variant="subtle"
                  leftSection={<IconFilter size={16} />}
                  onClick={clearFilters}
                  disabled={!searchQuery && !priorityFilter && !statusFilter}
                >
                  清除过滤
                </Button>
              </Group>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* 候选池统计 */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Card shadow="sm" padding="lg">
              <Text c="dimmed" size="sm" fw={500}>
                候选任务总数
              </Text>
              <Text size="xl" fw={700}>
                {candidates.length}
              </Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Card shadow="sm" padding="lg">
              <Text c="dimmed" size="sm" fw={500}>
                筛选后任务
              </Text>
              <Text size="xl" fw={700}>
                {filteredCandidates.length}
              </Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Card shadow="sm" padding="lg">
              <Text c="dimmed" size="sm" fw={500}>
                高优先级任务
              </Text>
              <Text size="xl" fw={700}>
                {candidates.filter(t => t.priority <= 1).length}
              </Text>
            </Card>
          </Grid.Col>
        </Grid>

        {/* 任务列表 */}
        <Paper shadow="sm" p="md" withBorder>
          <TaskList
            title="候选任务"
            tasks={filteredCandidates}
            emptyText={candidates.length === 0 ? 
              "候选池为空，所有任务都已完成或在今日计划中！" : 
              "没有符合条件的任务"}
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
                loadCandidates();
              }
            }}
            onAddToPlanned={handleAddToPlanned}
            onEditProgress={handleEditProgress}
            onDeleteProgress={handleDeleteProgress}
          />
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
      />
    </Container>
  );
}