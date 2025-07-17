import { useState, useRef, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardContent } from "@/components/DashboardContent";
import { PromptLibrary } from "@/components/PromptLibrary";
import { WorkflowBuilder } from "@/components/WorkflowBuilder";
import { WorkflowManager } from "@/components/WorkflowManager";

export type DashboardView = 'dashboard' | 'prompts' | 'workflow' | 'manage-workflows';

const Dashboard = () => {
  const [currentView, setCurrentView] = useState<DashboardView>('dashboard');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const mainRef = useRef<HTMLElement>(null);

  const handleNavigate = (view: DashboardView) => {
    setCurrentView(view);
    setRefreshTrigger(prev => prev + 1); // Trigger data refresh
    // Scroll to top when switching views
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardContent key={refreshTrigger} onNavigate={handleNavigate} onSelectWorkflow={setSelectedWorkflowId} />;
      case 'prompts':
        return <PromptLibrary key={refreshTrigger} />;
      case 'workflow':
        return <WorkflowBuilder key={refreshTrigger} workflowId={selectedWorkflowId} />;
      case 'manage-workflows':
        return <WorkflowManager key={refreshTrigger} onSelectWorkflow={(id) => {
          setSelectedWorkflowId(id);
          setCurrentView('workflow');
        }} />;
      default:
        return <DashboardContent key={refreshTrigger} onNavigate={handleNavigate} onSelectWorkflow={setSelectedWorkflowId} />;
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <AppSidebar currentView={currentView} onNavigate={handleNavigate} />
        <main ref={mainRef} className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;