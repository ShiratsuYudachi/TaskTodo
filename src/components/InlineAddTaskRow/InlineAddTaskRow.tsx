import { useState, useEffect } from 'react';
import { Group, TextInput, Button, HoverCard, Stack, Popover, ActionIcon, rem, Tooltip, MultiSelect } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { IconFlag3, IconClock, IconCalendar, IconX } from '@tabler/icons-react';
import { Task } from '@/types';
import { createTask } from '@/utils/taskUtils';

interface InlineAddTaskRowProps {
  onSubmit: (task: Task) => void;
  width?: number | string;
  suggestedTags?: string[];
}

export function InlineAddTaskRow({ onSubmit, width = 420, suggestedTags = [] }: InlineAddTaskRowProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<number>(3);
  const [duration, setDuration] = useState<Task['duration']>('short');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [dateOpened, setDateOpened] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagData, setTagData] = useState<string[]>(suggestedTags);
  const [tagPopoverOpened, setTagPopoverOpened] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [isTagComposing, setIsTagComposing] = useState(false);

  useEffect(() => {
    setTagData((prev) => {
      const set = new Set([...prev, ...suggestedTags]);
      return Array.from(set);
    });
  }, [suggestedTags]);

  const handleCreate = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const task = createTask({
      title: trimmed,
      priority,
      duration,
      deadline: deadline || undefined,
      status: 'todo',
      tags,
    });
    onSubmit(task);
    setTitle('');
    setPriority(3);
    setDuration('short');
    setDeadline(null);
    // 保留已选择的tags，方便连续创建同标签任务
  };

  return (
    <Group gap="xs" wrap="nowrap" style={{ width }}>
      <TextInput
        placeholder="Add a task"
        value={title}
        onChange={(e) => setTitle(e.currentTarget.value)}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (!isComposing) handleCreate();
          }
        }}
        style={{ flex: 1, minWidth: rem(220) }}
      />

      <HoverCard position="bottom" shadow="md" openDelay={80} closeDelay={80} withinPortal>
        <HoverCard.Target>
          <Button
            variant="light"
            size="sm"
            leftSection={<IconFlag3 size={14} />}
            style={{ whiteSpace: 'nowrap', overflow: 'visible', minWidth: rem(56) }}
          >
            P{priority}
          </Button>
        </HoverCard.Target>
        <HoverCard.Dropdown>
          <Stack gap="xs">
            {[0, 1, 2, 3].map((p) => (
              <Button key={p} size="xs" variant={p === priority ? 'filled' : 'light'} onClick={() => setPriority(p)}>
                P{p}
              </Button>
            ))}
          </Stack>
        </HoverCard.Dropdown>
      </HoverCard>

      <HoverCard position="bottom" shadow="md" openDelay={80} closeDelay={80} withinPortal>
        <HoverCard.Target>
          <Button
            variant="light"
            size="sm"
            leftSection={<IconClock size={14} />}
            style={{ whiteSpace: 'nowrap', overflow: 'visible', minWidth: rem(84) }}
          >
            {duration === 'short' ? 'Short' : duration === 'medium' ? 'Medium' : duration === 'long' ? 'Long' : 'Ongoing'}
          </Button>
        </HoverCard.Target>
        <HoverCard.Dropdown>
          <Stack gap="xs">
            {(['short', 'medium', 'long', 'ongoing'] as Task['duration'][]).map((d) => (
              <Button key={d} size="xs" variant={d === duration ? 'filled' : 'light'} onClick={() => setDuration(d)}>
                {d === 'short' ? 'Short' : d === 'medium' ? 'Medium' : d === 'long' ? 'Long' : 'Ongoing'}
              </Button>
            ))}
          </Stack>
        </HoverCard.Dropdown>
      </HoverCard>

      <Popover opened={dateOpened} onChange={setDateOpened} withinPortal position="bottom">
        <Popover.Target>
          <ActionIcon
            variant={deadline ? 'filled' : 'light'}
            color={deadline ? 'blue' : undefined}
            size="md"
            onClick={() => setDateOpened((o) => !o)}
            aria-label={deadline ? 'Due date selected' : 'Pick a due date'}
          >
            <IconCalendar size={16} />
          </ActionIcon>
        </Popover.Target>
        <Popover.Dropdown>
          <DatePicker
            value={deadline}
            onChange={(d) => {
              setDeadline(d);
              if (d) setDateOpened(false);
            }}
            allowDeselect
          />
        </Popover.Dropdown>
      </Popover>
      <Popover opened={tagPopoverOpened} onChange={setTagPopoverOpened} withinPortal position="bottom">
        <Popover.Target>
          <Button
            variant="light"
            size="sm"
            onClick={() => setTagPopoverOpened((o) => !o)}
            style={{ whiteSpace: 'nowrap', overflow: 'visible', minWidth: rem(64) }}
          >
            {tags.length > 0 ? `Tags(${tags.length})` : 'Tags'}
          </Button>
        </Popover.Target>
        <Popover.Dropdown style={{ width: rem(240) }}>
          <Stack gap="xs">
            <MultiSelect
              placeholder="选择标签"
              data={tagData}
              value={tags}
              onChange={setTags}
              searchable
              clearable
              searchValue={tagSearch}
              onSearchChange={setTagSearch}
              onCompositionStart={() => setIsTagComposing(true)}
              onCompositionEnd={() => setIsTagComposing(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (!isTagComposing) {
                    const q = tagSearch.trim();
                    if (!q) return;
                    if (!tagData.includes(q)) setTagData((cur) => [...cur, q]);
                    setTags((cur) => (cur.includes(q) ? cur : [...cur, q]));
                    setTagSearch('');
                  }
                }
              }}
            />
          </Stack>
        </Popover.Dropdown>
      </Popover>
      {deadline && (
        <Tooltip label="清除日期">
          <ActionIcon
            variant="light"
            color="red"
            size="md"
            onClick={() => setDeadline(null)}
            aria-label="Clear due date"
          >
            <IconX size={16} />
          </ActionIcon>
        </Tooltip>
      )}

      <Button size="xs" onClick={handleCreate} disabled={!title.trim()}>
        Add
      </Button>
    </Group>
  );
}


