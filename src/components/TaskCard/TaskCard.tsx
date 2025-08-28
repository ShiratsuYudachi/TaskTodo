import {
  Card,
  Group,
  Text,
  Badge,
  ActionIcon,
  Menu,
} from '@mantine/core';
import {
  IconDots,
  IconEdit,
  IconTrash,
  IconFlag,
  IconPlayerStop,
  IconCheck,
  IconCalendar,
} from '@tabler/icons-react';
import { Task } from '@/types';
import {
  getPriorityLabel,
  getPriorityColor,
  getDurationLabel,
  getStatusLabel,
  getStatusColor,
  isTaskOverdue,
  getDaysUntilDeadline,
  formatDate,
} from '@/utils/taskUtils';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: Task['status']) => void;
  onAddToPlanned?: (taskId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onAddToPlanned,
  showActions = true,
  compact = false,
}: TaskCardProps) {
  const isOverdue = isTaskOverdue(task);
  const daysUntilDeadline = task.deadline ? getDaysUntilDeadline(task.deadline) : null;

  const handleStatusChange = (newStatus: Task['status']) => {
    onStatusChange?.(task.id, newStatus);
  };

  const renderDeadlineInfo = () => {
    if (!task.deadline) return null;

    const isUrgent = daysUntilDeadline !== null && daysUntilDeadline <= 3;
    
    return (
      <Group gap="xs">
        <IconCalendar size={14} />
        <Text
          size="xs"
          c={isOverdue ? 'red' : isUrgent ? 'orange' : 'dimmed'}
          fw={isOverdue || isUrgent ? 600 : 400}
        >
          {formatDate(task.deadline)}
          {daysUntilDeadline !== null && (
            <span>
              {isOverdue
                ? ` (逾期${Math.abs(daysUntilDeadline)}天)`
                : daysUntilDeadline === 0
                ? ' (今天)'
                : daysUntilDeadline === 1
                ? ' (明天)'
                : ` (${daysUntilDeadline}天后)`}
            </span>
          )}
        </Text>
      </Group>
    );
  };

  return (
    <Card
      shadow="sm"
      padding={compact ? "sm" : "md"}
      radius="md"
      withBorder
      className={`transition-all duration-200 hover:shadow-md ${
        isOverdue ? 'border-red-300 bg-red-50' : ''
      }`}
    >
      <Card.Section inheritPadding py="sm">
        <Group justify="space-between" align="flex-start">
          <div className="flex-1 min-w-0">
            <Group gap="xs" mb="xs">
              <Badge
                size="xs"
                color={getPriorityColor(task.priority)}
                variant="light"
              >
                {getPriorityLabel(task.priority)}
              </Badge>
              <Badge
                size="xs"
                color={getStatusColor(task.status)}
                variant="filled"
              >
                {getStatusLabel(task.status)}
              </Badge>
              <Badge size="xs" variant="outline">
                {getDurationLabel(task.duration)}
              </Badge>
            </Group>

            <Text fw={600} size={compact ? "sm" : "md"} className="truncate">
              {task.title}
            </Text>

            {!compact && task.description && (
              <Text size="sm" c="dimmed" lineClamp={2} mt="xs">
                {task.description}
              </Text>
            )}

            {task.progress && (
              <div className="mt-2">
                <Text size="xs" c="dimmed" mb="xs">
                  进度：{task.progress}
                </Text>
              </div>
            )}

            {task.tags.length > 0 && (
              <Group gap="xs" mt="xs">
                {task.tags.map((tag) => (
                  <Badge key={tag} size="xs" variant="dot">
                    {tag}
                  </Badge>
                ))}
              </Group>
            )}

            {renderDeadlineInfo()}
          </div>

          {showActions && (
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon variant="subtle" size="sm">
                  <IconDots size={16} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                {task.status !== 'in_progress' && (
                  <Menu.Item
                    leftSection={<IconPlayerStop size={14} />}
                    onClick={() => handleStatusChange('in_progress')}
                  >
                    开始任务
                  </Menu.Item>
                )}

                {task.status !== 'completed' && (
                  <Menu.Item
                    leftSection={<IconCheck size={14} />}
                    onClick={() => handleStatusChange('completed')}
                  >
                    标记完成
                  </Menu.Item>
                )}

                {task.status !== 'todo' && (
                  <Menu.Item
                    leftSection={<IconFlag size={14} />}
                    onClick={() => handleStatusChange('todo')}
                  >
                    重置为待办
                  </Menu.Item>
                )}

                <Menu.Divider />

                {onAddToPlanned && (
                  <Menu.Item
                    leftSection={<IconCalendar size={14} />}
                    onClick={() => onAddToPlanned(task.id)}
                  >
                    添加到今日计划
                  </Menu.Item>
                )}

                {onEdit && (
                  <Menu.Item
                    leftSection={<IconEdit size={14} />}
                    onClick={() => onEdit(task)}
                  >
                    编辑
                  </Menu.Item>
                )}

                {onDelete && (
                  <Menu.Item
                    color="red"
                    leftSection={<IconTrash size={14} />}
                    onClick={() => onDelete(task.id)}
                  >
                    删除
                  </Menu.Item>
                )}
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </Card.Section>
    </Card>
  );
}