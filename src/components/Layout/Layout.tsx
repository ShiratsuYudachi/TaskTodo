import { ReactNode } from 'react';
import {
  AppShell,
  Text,
  NavLink,
  Group,
  Badge,
  Burger,
} from '@mantine/core';
import {
  IconHome,
  IconArchive,
  IconSettings,
  IconChartBar,
  IconBulb,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  plannedCount?: number;
  candidateCount?: number;
}

export function Layout({
  children,
  activeTab,
  onTabChange,
  plannedCount = 0,
  candidateCount = 0,
}: LayoutProps) {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure(false);

  const navItems = [
    {
      id: 'dashboard',
      label: '仪表板',
      icon: IconHome,
      badge: plannedCount > 0 ? plannedCount : undefined,
    },
    {
      id: 'candidate',
      label: '候选池',
      icon: IconBulb,
      badge: candidateCount > 0 ? candidateCount : undefined,
    },
    {
      id: 'library',
      label: '任务库',
      icon: IconArchive,
    },
    {
      id: 'statistics',
      label: '统计面板',
      icon: IconChartBar,
    },
    {
      id: 'settings',
      label: '设置',
      icon: IconSettings,
    },
  ];

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
            <Text fw={600} size="xl" c="blue">
              TaskTodo
            </Text>
            <Text size="sm" c="dimmed">
              智能任务调度系统
            </Text>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <div>
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              leftSection={<item.icon size={20} />}
              label={item.label}
              rightSection={
                item.badge ? (
                  <Badge size="sm" variant="filled">
                    {item.badge}
                  </Badge>
                ) : null
              }
              active={activeTab === item.id}
              onClick={() => onTabChange(item.id)}
              className="mb-1"
            />
          ))}
        </div>
      </AppShell.Navbar>

      <AppShell.Main>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </AppShell.Main>
    </AppShell>
  );
}