import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Text,
  Group,
  Stack,
  Card,
  Grid,
  Progress,
  Badge,
  Center,
} from '@mantine/core';
import {
  IconChartBar,
  IconTarget,
  IconTrendingUp,
  IconCalendar,
  IconClock,
} from '@tabler/icons-react';
import { StorageService } from '@/services/StorageService';

export function Statistics() {
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    todoTasks: 0,
    overdueTaskCount: 0,
    completionRate: 0,
    tasksCreatedThisWeek: 0,
    tasksCompletedThisWeek: 0,
  });

  const storage = new StorageService();

  const loadStatistics = () => {
    const state = storage.load();
    const allTasks = state.tasks;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const completedTasks = allTasks.filter(t => t.status === 'completed');
    const todoTasks = allTasks.filter(t => t.status === 'todo');
    const inProgressTasks = allTasks.filter(t => state.plannedTasks.includes(t.id) && t.status === 'todo');
    const overdueTasks = allTasks.filter(t => 
      t.deadline && t.deadline < now && t.status !== 'completed'
    );

    const tasksCreatedThisWeek = allTasks.filter(t => t.createdAt >= weekAgo);
    const tasksCompletedThisWeek = completedTasks.filter(t => t.updatedAt >= weekAgo);

    const completionRate = allTasks.length > 0 ? 
      (completedTasks.length / allTasks.length) * 100 : 0;

    setStats({
      totalTasks: allTasks.length,
      completedTasks: completedTasks.length,
      inProgressTasks: inProgressTasks.length,
      todoTasks: todoTasks.length,
      overdueTaskCount: overdueTasks.length,
      completionRate: Math.round(completionRate),
      tasksCreatedThisWeek: tasksCreatedThisWeek.length,
      tasksCompletedThisWeek: tasksCompletedThisWeek.length,
    });
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  const statsCards = [
    {
      title: '任务总数',
      value: stats.totalTasks,
      icon: IconTarget,
      color: 'blue',
    },
    {
      title: '已完成',
      value: stats.completedTasks,
      icon: IconTarget,
      color: 'green',
    },
    {
      title: '进行中',
      value: stats.inProgressTasks,
      icon: IconTrendingUp,
      color: 'orange',
    },
    {
      title: '待开始',
      value: stats.todoTasks,
      icon: IconClock,
      color: 'gray',
    },
  ];

  return (
    <Container fluid>
      <Stack gap="lg">
        {/* 页面标题 */}
        <div>
          <Group gap="xs">
            <IconChartBar size={24} />
            <Text size="xl" fw={600}>
              统计面板
            </Text>
          </Group>
          <Text c="dimmed" size="sm">
            查看任务完成情况和工作统计
          </Text>
        </div>

        {/* 基础统计卡片 */}
        <Grid>
          {statsCards.map((stat) => (
            <Grid.Col key={stat.title} span={{ base: 12, sm: 6, md: 3 }}>
              <Card shadow="sm" padding="lg" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text c="dimmed" size="sm" fw={500}>
                      {stat.title}
                    </Text>
                    <Text size="xl" fw={700}>
                      {stat.value}
                    </Text>
                  </div>
                  <stat.icon size={24} color={stat.color} />
                </Group>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        {/* 详细统计 */}
        <Grid>
          {/* 完成率 */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper shadow="sm" p="lg" withBorder>
              <Group justify="space-between" mb="md">
                <Text fw={600} size="lg">
                  任务完成率
                </Text>
                <Badge color="green" variant="light">
                  {stats.completionRate}%
                </Badge>
              </Group>
              <Progress
                value={stats.completionRate}
                size="xl"
                color="green"
                mb="md"
              />
              <Text size="sm" c="dimmed">
                总共完成了 {stats.completedTasks} / {stats.totalTasks} 个任务
              </Text>
            </Paper>
          </Grid.Col>

          {/* 本周统计 */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper shadow="sm" p="lg" withBorder>
              <Group gap="xs" mb="md">
                <IconCalendar size={20} />
                <Text fw={600} size="lg">
                  本周统计
                </Text>
              </Group>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="sm">新建任务</Text>
                  <Badge variant="outline">
                    {stats.tasksCreatedThisWeek}
                  </Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">完成任务</Text>
                  <Badge color="green" variant="light">
                    {stats.tasksCompletedThisWeek}
                  </Badge>
                </Group>
              </Stack>
            </Paper>
          </Grid.Col>

          {/* 任务状态分布 */}
          <Grid.Col span={{ base: 12 }}>
            <Paper shadow="sm" p="lg" withBorder>
              <Text fw={600} size="lg" mb="md">
                任务状态分布
              </Text>
              <Grid>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Center>
                    <Stack align="center" gap="xs">
                      <Text size="xl" fw={700} c="green">
                        {stats.completedTasks}
                      </Text>
                      <Text size="sm" c="dimmed">已完成</Text>
                    </Stack>
                  </Center>
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Center>
                    <Stack align="center" gap="xs">
                      <Text size="xl" fw={700} c="orange">
                        {stats.inProgressTasks}
                      </Text>
                      <Text size="sm" c="dimmed">进行中</Text>
                    </Stack>
                  </Center>
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Center>
                    <Stack align="center" gap="xs">
                      <Text size="xl" fw={700} c="gray">
                        {stats.todoTasks}
                      </Text>
                      <Text size="sm" c="dimmed">待开始</Text>
                    </Stack>
                  </Center>
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Center>
                    <Stack align="center" gap="xs">
                      <Text size="xl" fw={700} c="red">
                        {stats.overdueTaskCount}
                      </Text>
                      <Text size="sm" c="dimmed">已逾期</Text>
                    </Stack>
                  </Center>
                </Grid.Col>
              </Grid>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* 占位区域 - 未来可以添加图表 */}
        <Paper shadow="sm" p="lg" withBorder>
          <Center py="xl">
            <Stack align="center" gap="sm">
              <IconChartBar size={48} color="gray" />
              <Text c="dimmed" ta="center">
                更多图表和可视化功能正在开发中
              </Text>
              <Text size="xs" c="dimmed" ta="center">
                未来将支持任务完成趋势、工作效率分析等功能
              </Text>
            </Stack>
          </Center>
        </Paper>
      </Stack>
    </Container>
  );
}