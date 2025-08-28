import { useState } from 'react';
import {
  Card,
  Group,
  Text,
  Badge,
  Button,
  TextInput,
  Stack,
  Collapse,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconCheck,
  IconClock,
  IconChevronDown,
  IconChevronUp,
  IconEdit,
  IconTrash,
  IconCalendar,
} from '@tabler/icons-react';
import { Task, ProgressEntry } from '@/types';
import {
  getPriorityLabel,
  getPriorityColor,
  getDurationLabel,
  getStatusLabel,
  getStatusColor,
  isTaskOverdue,
  getDaysUntilDeadline,
  formatDate,
  getProgressCount,
  isInTodayPlan,
  createProgressEntry,
} from '@/utils/taskUtils';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onComplete?: (taskId: string) => void;
  onDeferTask?: (taskId: string, progressEntry: ProgressEntry) => void; // 暂存任务
  onAddToPlanned?: (taskId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onComplete,
  onDeferTask,
  onAddToPlanned,
  showActions = true,
  compact = false,
}: TaskCardProps) {
  const [progressInput, setProgressInput] = useState('');
  const [showProgressHistory, setShowProgressHistory] = useState(false);
  
  const isOverdue = isTaskOverdue(task);
  const daysUntilDeadline = task.deadline ? getDaysUntilDeadline(task.deadline) : null;
  const isCompleted = task.status === 'completed';
  const inTodayPlan = isInTodayPlan(task);
  const progressCount = getProgressCount(task);

  const handleProgressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressInput.trim() || !onDeferTask) return;
    
    const progressEntry = createProgressEntry(progressInput.trim());
    onDeferTask(task.id, progressEntry);
    setProgressInput('');
  };

  const handleCompleteTask = () => {
    if (!onComplete) return;
    onComplete(task.id);
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

  const renderProgressHistory = () => {
    if (task.progressHistory.length === 0) {
      return (
        <Text size="xs" c="dimmed" ta="center" py="sm">
          还没有进度记录
        </Text>
      );
    }

    return (
      <Stack gap="xs" mt="sm">
        {task.progressHistory.slice(-3).reverse().map((entry) => (
          <Card key={entry.id} padding="xs" withBorder radius="sm" bg="gray.0">
            <Group justify="space-between" align="flex-start">
              <Text size="xs" style={{ flex: 1 }}>
                {entry.content}
              </Text>
              <Text size="xs" c="dimmed">
                {new Date(entry.timestamp).toLocaleDateString('zh-CN', {
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </Group>
          </Card>
        ))}
        
        {task.progressHistory.length > 3 && (
          <Text size="xs" c="dimmed" ta="center">
            共 {task.progressHistory.length} 条记录，显示最近 3 条
          </Text>
        )}
      </Stack>
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
      } ${isCompleted ? 'opacity-60' : ''}`}
    >
      <Stack gap="sm">
        {/* 任务头部信息 */}
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
                color={getStatusColor(task)}
                variant="filled"
              >
                {getStatusLabel(task)}
              </Badge>
              <Badge size="xs" variant="outline">
                {getDurationLabel(task.duration)}
              </Badge>
              
              {progressCount > 0 && (
                <Badge size="xs" color="blue" variant="dot">
                  {progressCount} 次进展
                </Badge>
              )}
            </Group>

            <Text fw={600} size={compact ? "sm" : "md"} className="truncate">
              {task.title}
            </Text>

            {!compact && task.description && (
              <Text size="sm" c="dimmed" lineClamp={2} mt="xs">
                {task.description}
              </Text>
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

          {/* 编辑和删除操作 */}
          {showActions && (
            <Group gap="xs">
              {onEdit && (
                <Tooltip label="编辑任务">
                  <ActionIcon 
                    variant="subtle" 
                    size="sm"
                    onClick={() => onEdit(task)}
                  >
                    <IconEdit size={14} />
                  </ActionIcon>
                </Tooltip>
              )}
              
              {onDelete && (
                <Tooltip label="删除任务">
                  <ActionIcon 
                    variant="subtle" 
                    size="sm" 
                    color="red"
                    onClick={() => onDelete(task.id)}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          )}
        </Group>

        {/* 进度输入区域 - 仅在未完成且在今日计划中时显示 */}
        {!isCompleted && inTodayPlan && (
          <form onSubmit={handleProgressSubmit}>
            <TextInput
              placeholder="记录今日进展，回车保存..."
              value={progressInput}
              onChange={(e) => setProgressInput(e.target.value)}
              size="sm"
              leftSection={<IconClock size={14} />}
            />
          </form>
        )}

        {/* 进度历史展示控制 */}
        {progressCount > 0 && (
          <Group justify="space-between">
            <Button
              variant="subtle"
              size="xs"
              leftSection={showProgressHistory ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
              onClick={() => setShowProgressHistory(!showProgressHistory)}
            >
              进度记录 ({progressCount})
            </Button>
          </Group>
        )}

        <Collapse in={showProgressHistory}>
          {renderProgressHistory()}
        </Collapse>

        {/* 主要操作按钮 */}
        {showActions && !isCompleted && (
          <Group justify="flex-end" gap="sm">
            {/* 添加到今日计划按钮 */}
            {!inTodayPlan && onAddToPlanned && (
              <Button
                size="xs"
                variant="light"
                leftSection={<IconCalendar size={14} />}
                onClick={() => onAddToPlanned(task.id)}
              >
                加入计划
              </Button>
            )}
            
            {/* 暂存按钮 - 仅在今日计划中显示 */}
            {inTodayPlan && onDeferTask && (
              <Button
                size="xs"
                variant="outline"
                leftSection={<IconClock size={14} />}
                onClick={() => {
                  if (progressInput.trim()) {
                    // 如果有输入内容，保存进度并暂存
                    const progressEntry = createProgressEntry(progressInput.trim());
                    onDeferTask(task.id, progressEntry);
                    setProgressInput('');
                  } else {
                    // 没有输入内容，直接暂存
                    const progressEntry = createProgressEntry('今日部分完成');
                    onDeferTask(task.id, progressEntry);
                  }
                }}
              >
                今日完成
              </Button>
            )}

            {/* 完成按钮 */}
            <Button
              size="xs"
              color="green"
              leftSection={<IconCheck size={14} />}
              onClick={handleCompleteTask}
            >
              完成任务
            </Button>
          </Group>
        )}
      </Stack>
    </Card>
  );
}