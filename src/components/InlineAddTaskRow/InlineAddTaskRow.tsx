import { useState } from 'react';
import { Group, TextInput, Button, HoverCard, Stack, Popover, ActionIcon, rem } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconFlag3, IconClock, IconCalendar } from '@tabler/icons-react';
import { Task } from '@/types';
import { createTask } from '@/utils/taskUtils';

interface InlineAddTaskRowProps {
  onSubmit: (task: Task) => void;
  width?: number | string;
}

export function InlineAddTaskRow({ onSubmit, width = 420 }: InlineAddTaskRowProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<number>(3);
  const [duration, setDuration] = useState<Task['duration']>('short');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [dateOpened, setDateOpened] = useState(false);

  const handleCreate = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const task = createTask({
      title: trimmed,
      priority,
      duration,
      deadline: deadline || undefined,
      status: 'todo',
    });
    onSubmit(task);
    setTitle('');
    setPriority(3);
    setDuration('short');
    setDeadline(null);
  };

  return (
    <Group gap="xs" wrap="nowrap" style={{ width }}>
      <TextInput
        placeholder="Add a task"
        value={title}
        onChange={(e) => setTitle(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleCreate();
          }
        }}
        style={{ flex: 1, minWidth: rem(220) }}
      />

      <HoverCard position="bottom" shadow="md" openDelay={80} closeDelay={80} withinPortal>
        <HoverCard.Target>
          <Button variant="light" size="xs" leftSection={<IconFlag3 size={14} />}>
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
          <Button variant="light" size="xs" leftSection={<IconClock size={14} />}>
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
          <ActionIcon variant="light" size="md" onClick={() => setDateOpened((o) => !o)}>
            <IconCalendar size={16} />
          </ActionIcon>
        </Popover.Target>
        <Popover.Dropdown>
          <DatePickerInput
            value={deadline}
            onChange={setDeadline}
            placeholder="Pick a date"
            clearable
          />
        </Popover.Dropdown>
      </Popover>

      <Button size="xs" onClick={handleCreate} disabled={!title.trim()}>
        Add
      </Button>
    </Group>
  );
}


