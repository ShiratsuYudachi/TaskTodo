import { useState, useEffect } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Stack,
  TagsInput,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { Task } from '@/types';
import { createTask, getPriorityLabel, getDurationLabel } from '@/utils/taskUtils';

interface AddTaskModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (task: Task) => void;
  editTask?: Task | null;
  suggestedTags?: string[];
}

export function AddTaskModal({
  opened,
  onClose,
  onSubmit,
  editTask,
  suggestedTags = [],
}: AddTaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 3,
    duration: 'medium' as Task['duration'],
    deadline: null as Date | null,
    tags: [] as string[],
    conditions: [] as string[],
  });

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 3,
      duration: 'medium',
      deadline: null,
      tags: [],
      conditions: [],
    });
  };

  // 编辑模式下填充表单
  useEffect(() => {
    if (editTask) {
      setFormData({
        title: editTask.title,
        description: editTask.description || '',
        priority: editTask.priority,
        duration: editTask.duration,
        deadline: editTask.deadline || null,
        tags: editTask.tags,
        conditions: editTask.conditions || [],
      });
    } else {
      resetForm();
    }
  }, [editTask, opened]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) return;

    const taskData: Partial<Task> = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      deadline: formData.deadline || undefined,
    };

    if (editTask) {
      // 编辑模式
      const updatedTask: Task = {
        ...editTask,
        ...taskData,
        updatedAt: new Date(),
      };
      onSubmit(updatedTask);
    } else {
      // 新建模式
      const newTask = createTask(taskData);
      onSubmit(newTask);
    }

    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const priorityOptions = [
    { value: '0', label: getPriorityLabel(0) },
    { value: '1', label: getPriorityLabel(1) },
    { value: '2', label: getPriorityLabel(2) },
    { value: '3', label: getPriorityLabel(3) },
  ];

  const durationOptions = [
    { value: 'short', label: getDurationLabel('short') },
    { value: 'medium', label: getDurationLabel('medium') },
    { value: 'long', label: getDurationLabel('long') },
    { value: 'ongoing', label: getDurationLabel('ongoing') },
  ];

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={editTask ? '编辑任务' : '添加新任务'}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="任务标题"
            placeholder="输入任务标题"
            required
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          />

          <Textarea
            label="任务描述"
            placeholder="输入任务详细描述（可选）"
            minRows={3}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />

          <Group grow>
            <Select
              label="优先级"
              data={priorityOptions}
              value={formData.priority.toString()}
              onChange={(value) => setFormData(prev => ({ 
                ...prev, 
                priority: parseInt(value || '3') 
              }))}
            />

            <Select
              label="预计时长"
              data={durationOptions}
              value={formData.duration}
              onChange={(value) => setFormData(prev => ({ 
                ...prev, 
                duration: (value as Task['duration']) || 'medium'
              }))}
            />
          </Group>

          <DateTimePicker
            label="截止时间（可选）"
            placeholder="选择截止时间"
            value={formData.deadline}
            onChange={(date) => setFormData(prev => ({ ...prev, deadline: date }))}
            clearable
          />

          <TagsInput
            label="标签"
            placeholder="添加标签"
            value={formData.tags}
            onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
            data={suggestedTags}
            clearable
            splitChars={[',',';',' ']}
          />

          <TagsInput
            label="前置条件"
            placeholder="添加需要等待的条件（可选）"
            description="有前置条件的任务不会出现在候选池中"
            value={formData.conditions}
            onChange={(conditions) => setFormData(prev => ({ ...prev, conditions }))}
          />

          <Group justify="flex-end">
            <Button variant="subtle" onClick={handleClose}>
              取消
            </Button>
            <Button type="submit" disabled={!formData.title.trim()}>
              {editTask ? '更新任务' : '创建任务'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}