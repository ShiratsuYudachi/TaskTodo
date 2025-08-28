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
  onComplete?: (taskId: string) => void;
  onToggleComplete?: (taskId: string, completed: boolean) => void;
  onDeferTask?: (taskId: string, progressEntry: ProgressEntry) => void; // 暂存任务
  onAddToPlanned?: (taskId: string) => void;
  onEditProgress?: (taskId: string, progressId: string, newContent: string) => void;
  onDeleteProgress?: (taskId: string, progressId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onComplete,
  onToggleComplete,
  onDeferTask,
  onAddToPlanned,
  onEditProgress,
  onDeleteProgress,
  showActions = true,
  compact = false,
}: TaskCardProps) {
  const [progressInput, setProgressInput] = useState('');
  const [showProgressHistory, setShowProgressHistory] = useState(false);
  const [editingProgressId, setEditingProgressId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  
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

  // 保留兼容：若上层仍传入 onComplete，我们通过圆圈触发

  const handleToggleCircle = () => {
    if (onToggleComplete) {
      onToggleComplete(task.id, !isCompleted);
    } else if (!isCompleted && onComplete) {
      onComplete(task.id);
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

  const handleStartEditProgress = (progressId: string, currentContent: string) => {
    setEditingProgressId(progressId);
    setEditingContent(currentContent);
  };

  const handleSaveEditProgress = () => {
    if (editingProgressId && editingContent.trim() && onEditProgress) {
      onEditProgress(task.id, editingProgressId, editingContent.trim());
      setEditingProgressId(null);
      setEditingContent('');
    }
  };

  const handleCancelEditProgress = () => {
    setEditingProgressId(null);
    setEditingContent('');
  };

  const handleDeleteProgress = (progressId: string) => {
    if (onDeleteProgress) {
      onDeleteProgress(task.id, progressId);
    }
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
            {editingProgressId === entry.id ? (
              // 编辑模式
              <Stack gap="xs">
                <TextInput
                  size="xs"
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  placeholder="修改进度记录..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveEditProgress();
                    } else if (e.key === 'Escape') {
                      handleCancelEditProgress();
                    }
                  }}
                  autoFocus
                />
                <Group justify="flex-end" gap="xs">
                  <Button size="xs" variant="light" onClick={handleSaveEditProgress}>
                    保存
                  </Button>
                  <Button size="xs" variant="subtle" onClick={handleCancelEditProgress}>
                    取消
                  </Button>
                </Group>
              </Stack>
            ) : (
              // 显示模式
              <Group justify="space-between" align="flex-start">
                <Text size="xs" style={{ flex: 1 }}>
                  {entry.content}
                </Text>
                <Group gap="xs" align="center">
                  <Text size="xs" c="dimmed">
                    {new Date(entry.timestamp).toLocaleDateString('zh-CN', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  {showActions && (
                    <>
                      <Tooltip label="编辑">
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color="blue"
                          onClick={() => handleStartEditProgress(entry.id, entry.content)}
                        >
                          <IconEdit size={12} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="删除">
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color="red"
                          onClick={() => handleDeleteProgress(entry.id)}
                        >
                          <IconX size={12} />
                        </ActionIcon>
                      </Tooltip>
                    </>
                  )}
                </Group>
              </Group>
            )}
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

        {/* 底部主要操作区移除：按钮已放到顶部同一行 */}
      </Stack>
    </Card>
  );
}