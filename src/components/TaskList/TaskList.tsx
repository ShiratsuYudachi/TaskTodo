import { Stack, Text, Group, ActionIcon, Tooltip } from '@mantine/core';
import { IconPlus, IconRefresh } from '@tabler/icons-react';
import { Task, ProgressEntry } from '@/types';
import { TaskCard } from '../TaskCard';

interface TaskListProps {
  tasks: Task[];
  title: string;
  emptyText?: string;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onComplete?: (taskId: string) => void;
  onToggleComplete?: (taskId: string, completed: boolean) => void;
  onDeferTask?: (taskId: string, progressEntry: ProgressEntry) => void;
  onAddToPlanned?: (taskId: string) => void;
  onEditProgress?: (taskId: string, progressId: string, newContent: string) => void;
  onDeleteProgress?: (taskId: string, progressId: string) => void;
  onRefresh?: () => void;
  onAddNew?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

export function TaskList({
  tasks,
  title,
  emptyText = '暂无任务',
  onEdit,
  onDelete,
  onComplete,
  onDeferTask,
  onAddToPlanned,
  onEditProgress,
  onDeleteProgress,
  onRefresh,
  onToggleComplete,
  onAddNew,
  showActions = true,
  compact = false,
}: TaskListProps) {
  return (
    <div>
      <Group justify="space-between" mb="md">
        <Text fw={600} size="lg">
          {title}
          <Text component="span" size="sm" c="dimmed" ml="xs">
            ({tasks.length})
          </Text>
        </Text>
        
        <Group gap="xs">
          {onRefresh && (
            <Tooltip label="刷新">
              <ActionIcon variant="subtle" onClick={onRefresh}>
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>
          )}
          
          {onAddNew && (
            <Tooltip label="添加新任务">
              <ActionIcon variant="subtle" onClick={onAddNew}>
                <IconPlus size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>

      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <Text c="dimmed" size="sm">
            {emptyText}
          </Text>
        </div>
      ) : (
        <Stack gap="sm">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onComplete={onComplete}
              onToggleComplete={onToggleComplete}
              onDeferTask={onDeferTask}
              onAddToPlanned={onAddToPlanned}
              onEditProgress={onEditProgress}
              onDeleteProgress={onDeleteProgress}
              showActions={showActions}
              compact={compact}
            />
          ))}
        </Stack>
      )}
    </div>
  );
}