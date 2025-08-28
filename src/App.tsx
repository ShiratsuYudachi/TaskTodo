import { useState, useEffect } from 'react';
import { Layout } from '@/components';
import {
  Dashboard,
  CandidatePool,
  TaskLibrary,
  Statistics,
  Settings,
} from '@/pages';
import { TaskScheduler } from '@/services/TaskScheduler';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [plannedCount, setPlannedCount] = useState(0);
  const [candidateCount, setCandidateCount] = useState(0);

  const scheduler = new TaskScheduler();

  useEffect(() => {
    updateCounts();
  }, [activeTab]);

  const updateCounts = () => {
    // 获取计划任务数量
    const plannedTasks = scheduler.getPlannedTasks();
    setPlannedCount(plannedTasks.length);

    // 获取候选池任务数量
    const candidates = scheduler.getCandidatePool();
    setCandidateCount(candidates.length);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={handleTabChange} />;
      case 'candidate':
        return <CandidatePool />;
      case 'library':
        return <TaskLibrary />;
      case 'statistics':
        return <Statistics />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={handleTabChange} />;
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      plannedCount={plannedCount}
      candidateCount={candidateCount}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;