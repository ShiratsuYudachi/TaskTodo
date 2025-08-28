import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Text,
  Group,
  Stack,
  NumberInput,
  Button,
  Alert,
  Card,
  Switch,
} from '@mantine/core';
import {
  IconSettings,
  IconInfoCircle,
  IconDeviceFloppy,
  IconTrash,
  IconDownload,
} from '@tabler/icons-react';
import { SchedulingConfig } from '@/types';
import { StorageService } from '@/services/StorageService';
import { NotificationService } from '@/services/NotificationService';

export function Settings() {
  const [config, setConfig] = useState<SchedulingConfig>({
    maxDailyTasks: 8,
    priorityWeights: { 0: 10, 1: 7, 2: 4, 3: 1 },
    durationWeights: { short: 5, medium: 3, long: 2, ongoing: 1 },
    starvationThresholdDays: 7,
  });
  
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const storage = new StorageService();
  const notification = new NotificationService();

  useEffect(() => {
    const state = storage.load();
    setConfig(state.config);
    
    // 检查通知权限
    if ('Notification' in window) {
      setNotificationEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handleConfigChange = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value,
    }));
    setHasUnsavedChanges(true);
  };

  const handleWeightChange = (category: 'priorityWeights' | 'durationWeights', key: string, value: number) => {
    setConfig(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    storage.updateConfig(config);
    setHasUnsavedChanges(false);
    notification.showSuccess('设置已保存');
  };

  const handleReset = () => {
    const defaultConfig: SchedulingConfig = {
      maxDailyTasks: 8,
      priorityWeights: { 0: 10, 1: 7, 2: 4, 3: 1 },
      durationWeights: { short: 5, medium: 3, long: 2, ongoing: 1 },
      starvationThresholdDays: 7,
    };
    setConfig(defaultConfig);
    setHasUnsavedChanges(true);
    notification.showInfo('已重置为默认设置，请点击保存按钮确认');
  };

  const handleNotificationToggle = async () => {
    if (!notificationEnabled) {
      const granted = await notification.requestPermission();
      if (granted) {
        setNotificationEnabled(true);
        notification.showSuccess('通知权限已启用');
      } else {
        notification.showError('无法启用通知权限');
      }
    } else {
      notification.showInfo('要禁用通知，请在浏览器设置中更改权限');
    }
  };

  const handleExportData = () => {
    const state = storage.load();
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `tasktodo-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    notification.showSuccess('数据导出成功');
  };

  const handleClearAllData = () => {
    if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
      localStorage.clear();
      notification.showInfo('所有数据已清除，页面将刷新');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  return (
    <Container fluid>
      <Stack gap="lg">
        {/* 页面标题 */}
        <div>
          <Group gap="xs">
            <IconSettings size={24} />
            <Text size="xl" fw={600}>
              设置
            </Text>
          </Group>
          <Text c="dimmed" size="sm">
            配置任务调度参数和系统设置
          </Text>
        </div>

        {/* 未保存更改提示 */}
        {hasUnsavedChanges && (
          <Alert
            icon={<IconInfoCircle size={16} />}
            title="有未保存的更改"
            color="orange"
          >
            您已修改了设置，请记得保存更改。
          </Alert>
        )}

        {/* 调度器设置 */}
        <Paper shadow="sm" p="lg" withBorder>
          <Text fw={600} size="lg" mb="md">
            任务调度器设置
          </Text>
          
          <Stack gap="md">
            <NumberInput
              label="每日最大任务数"
              description="计划清单中同时显示的最大任务数量"
              value={config.maxDailyTasks}
              onChange={(value) => handleConfigChange('maxDailyTasks', value || 8)}
              min={1}
              max={20}
            />

            <NumberInput
              label="饥饿阈值天数"
              description="任务多少天未被调度后提高优先级（防止长期被忽略）"
              value={config.starvationThresholdDays}
              onChange={(value) => handleConfigChange('starvationThresholdDays', value || 7)}
              min={1}
              max={30}
            />
          </Stack>
        </Paper>

        {/* 优先级权重设置 */}
        <Paper shadow="sm" p="lg" withBorder>
          <Text fw={600} size="lg" mb="md">
            优先级权重设置
          </Text>
          <Text size="sm" c="dimmed" mb="md">
            调整不同优先级任务在调度算法中的权重，数值越大优先级越高
          </Text>
          
          <Stack gap="md">
            <Group grow>
              <NumberInput
                label="P0 紧急"
                value={config.priorityWeights[0]}
                onChange={(value) => handleWeightChange('priorityWeights', '0', Number(value) || 10)}
                min={1}
                max={20}
              />
              <NumberInput
                label="P1 高"
                value={config.priorityWeights[1]}
                onChange={(value) => handleWeightChange('priorityWeights', '1', Number(value) || 7)}
                min={1}
                max={20}
              />
              <NumberInput
                label="P2 中"
                value={config.priorityWeights[2]}
                onChange={(value) => handleWeightChange('priorityWeights', '2', Number(value) || 4)}
                min={1}
                max={20}
              />
              <NumberInput
                label="P3 低"
                value={config.priorityWeights[3]}
                onChange={(value) => handleWeightChange('priorityWeights', '3', Number(value) || 1)}
                min={1}
                max={20}
              />
            </Group>
          </Stack>
        </Paper>

        {/* 时长权重设置 */}
        <Paper shadow="sm" p="lg" withBorder>
          <Text fw={600} size="lg" mb="md">
            任务时长权重设置
          </Text>
          <Text size="sm" c="dimmed" mb="md">
            调整不同时长任务的权重，通常短任务权重更高以便优先完成
          </Text>
          
          <Group grow>
            <NumberInput
              label="短期任务"
              value={config.durationWeights.short}
              onChange={(value) => handleWeightChange('durationWeights', 'short', Number(value) || 5)}
              min={1}
              max={10}
            />
            <NumberInput
              label="中期任务"
              value={config.durationWeights.medium}
              onChange={(value) => handleWeightChange('durationWeights', 'medium', Number(value) || 3)}
              min={1}
              max={10}
            />
            <NumberInput
              label="长期任务"
              value={config.durationWeights.long}
              onChange={(value) => handleWeightChange('durationWeights', 'long', Number(value) || 2)}
              min={1}
              max={10}
            />
            <NumberInput
              label="持续任务"
              value={config.durationWeights.ongoing}
              onChange={(value) => handleWeightChange('durationWeights', 'ongoing', Number(value) || 1)}
              min={1}
              max={10}
            />
          </Group>
        </Paper>

        {/* 通知设置 */}
        <Paper shadow="sm" p="lg" withBorder>
          <Text fw={600} size="lg" mb="md">
            通知设置
          </Text>
          
          <Card withBorder p="md">
            <Group justify="space-between">
              <div>
                <Text size="sm" fw={500}>
                  桌面通知
                </Text>
                <Text size="xs" c="dimmed">
                  启用后可以接收任务提醒和截止时间通知
                </Text>
              </div>
              <Switch
                checked={notificationEnabled}
                onChange={handleNotificationToggle}
                disabled={!('Notification' in window)}
              />
            </Group>
          </Card>
        </Paper>

        {/* 数据管理 */}
        <Paper shadow="sm" p="lg" withBorder>
          <Text fw={600} size="lg" mb="md">
            数据管理
          </Text>
          
          <Stack gap="sm">
            <Button
              leftSection={<IconDownload size={16} />}
              variant="outline"
              onClick={handleExportData}
            >
              导出数据
            </Button>
            
            <Button
              leftSection={<IconTrash size={16} />}
              color="red"
              variant="outline"
              onClick={handleClearAllData}
            >
              清除所有数据
            </Button>
          </Stack>
        </Paper>

        {/* 保存按钮 */}
        <Group justify="flex-end">
          <Button variant="subtle" onClick={handleReset}>
            重置默认
          </Button>
          <Button
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
          >
            保存设置
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}