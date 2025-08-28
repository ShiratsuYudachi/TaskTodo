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
  IconX,
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
  onToggleComplete?: (taskId: string, completed: boolean) => void;
  onDeferTask?: (taskId: string, progressEntry: ProgressEntry) => void; // 暂存任务
  onAddToPlanned?: (taskId: string) => void;
  onEditProgress?: (taskId: string, progressId: string, newContent: string) => void;
  onDeleteProgress?: (taskId: string, progressId: string) => void;
  onAddSubtask?: (taskId: string, title: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string, completed: boolean) => void;
  onDeleteSubtask?: (taskId: string, subtaskId: string) => void;
  onEditSubtask?: (taskId: string, subtaskId: string, newTitle: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onToggleComplete,
  onDeferTask,
  onAddToPlanned,
  // 兼容旧签名（未使用）
  onEditProgress: _onEditProgress,
  onDeleteProgress: _onDeleteProgress,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  // 预留编辑子任务但暂未启用
  onEditSubtask: _onEditSubtask,
  showActions = true,
  compact = false,
}: TaskCardProps) {
  const [progressInput, setProgressInput] = useState('');
  const [subtaskInput, setSubtaskInput] = useState('');
  const [showProgressHistory, setShowProgressHistory] = useState(false);
  // 旧的进度编辑状态已不需要
  
  const isOverdue = isTaskOverdue(task);
  const daysUntilDeadline = task.deadline ? getDaysUntilDeadline(task.deadline) : null;
  const isCompleted = task.status === 'completed';
  const inTodayPlan = isInTodayPlan(task);
  const progressCount = getProgressCount(task);

  // 进度表单已由子任务输入取代

  const renderSubtasks = () => {
    if (!task.subtasks || task.subtasks.length === 0) return null;
    const recent = [...task.subtasks].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return (
      <Stack gap="xs">
        {recent.slice(0, 4).map((st) => (
          <Group key={st.id} justify="space-between" align="center">
            <Group gap="xs" align="center" style={{ flex: 1, minWidth: 0 }}>
              <button
                aria-label={st.status === 'completed' ? 'Mark subtask as todo' : 'Mark subtask as completed'}
                onClick={() => onToggleSubtask && onToggleSubtask(task.id, st.id, st.status !== 'completed')}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: `2px solid ${st.status === 'completed' ? '#16a34a' : '#cbd5e1'}`,
                  background: st.status === 'completed' ? '#16a34a' : 'transparent',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                {st.status === 'completed' && <IconCheck size={10} color="#fff" />}
              </button>
              <Text size="sm" c={st.status === 'completed' ? 'dimmed' : undefined} lineClamp={1}>
                {st.title}
              </Text>
            </Group>
            {showActions && onDeleteSubtask && (
              <Tooltip label="删除子任务">
                <ActionIcon size="sm" variant="subtle" color="red" onClick={() => onDeleteSubtask(task.id, st.id)}>
                  <IconX size={12} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        ))}
      </Stack>
    );
  };

  const handleToggleCircle = () => {
    if (onToggleComplete) {
      onToggleComplete(task.id, !isCompleted);
    }
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

  // 旧的进度编辑函数已移除

  // 进度历史渲染已由子任务渲染取代

  return (
    <Card
      shadow="sm"
      padding={"sm"}
      radius="md"
      withBorder
      className={`transition-all duration-200 hover:shadow-md ${
        isOverdue ? 'border-red-300 bg-red-50' : ''
      } ${isCompleted ? 'opacity-60' : ''}`}
    >
      <Stack gap="xs">
        {/* 任务头部信息 */}
        <Group justify="space-between" align="center">
          {/* 完成圆圈 */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              aria-label={isCompleted ? 'Mark as todo' : 'Mark as completed'}
              onClick={handleToggleCircle}
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: `2px solid ${isCompleted ? '#16a34a' : '#cbd5e1'}`,
                background: isCompleted ? '#16a34a' : 'transparent',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
                cursor: 'pointer',
              }}
            >
              {isCompleted && <IconCheck size={12} color="#fff" />}
            </button>
          </div>

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

          {/* 右侧操作区：主要按钮和编辑删除同一行 */}
          {showActions && (
            <Group gap="xs" wrap="nowrap" align="center">
              {!isCompleted && !inTodayPlan && onAddToPlanned && (
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<IconCalendar size={14} />}
                  onClick={() => onAddToPlanned(task.id)}
                >
                  加入计划
                </Button>
              )}
              {!isCompleted && inTodayPlan && onDeferTask && (
                <Button
                  size="xs"
                  variant="outline"
                  leftSection={<IconClock size={14} />}
                  onClick={() => {
                    if (progressInput.trim()) {
                      const progressEntry = createProgressEntry(progressInput.trim());
                      onDeferTask(task.id, progressEntry);
                      setProgressInput('');
                    } else {
                      const progressEntry = createProgressEntry('今日部分完成');
                      onDeferTask(task.id, progressEntry);
                    }
                  }}
                >
                  今日完成
                </Button>
              )}
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
        {!isCompleted && (
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!subtaskInput.trim() || !onAddSubtask) return;
            onAddSubtask(task.id, subtaskInput.trim());
            setSubtaskInput('');
          }}>
            <TextInput
              placeholder="添加子任务，回车创建..."
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
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
          {renderSubtasks()}
        </Collapse>

        {/* 底部主要操作区移除：按钮已放到顶部同一行 */}
      </Stack>
    </Card>
  );
}