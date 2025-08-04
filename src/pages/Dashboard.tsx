import { useState, useRef, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardContent } from "@/components/DashboardContent";
import { PromptLibrary } from "@/components/PromptLibrary";
import { WorkflowBuilder } from "@/components/WorkflowBuilder";
import { WorkflowManager } from "@/components/WorkflowManager";
import { EntryModule } from "@/components/EntryModule";
import { ProjectManager } from "@/components/ProjectManager";
import { NotebookUpload } from "@/components/NotebookUpload";
import { GraphView } from "@/components/GraphView";
import { useIsMobile } from "@/hooks/use-mobile";

export type DashboardView = 'dashboard' | 'prompts' | 'workflow' | 'new-project' | 'manage-projects' | 'graph-view';

const Dashboard = () => {
  const [currentView, setCurrentView] = useState<DashboardView>('dashboard');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [graphControls, setGraphControls] = useState<any>(null);
  const mainRef = useRef<HTMLElement>(null);
  const isMobile = useIsMobile();

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
        return selectedWorkflowId ? <NotebookUpload projectId={selectedWorkflowId} /> : 
               <div className="text-center p-8">Please select a project first</div>;
      case 'new-project':
        return <EntryModule onProjectCreated={(projectId) => {
          console.log('Project created:', projectId);
          setCurrentView('manage-projects');
          setRefreshTrigger(prev => prev + 1);
        }} />;
      case 'manage-projects':
        return <ProjectManager 
          onSelectProject={(projectId) => {
            setSelectedWorkflowId(projectId);
            setCurrentView('workflow');
            setRefreshTrigger(prev => prev + 1);
          }}
          onCreateNew={() => setCurrentView('new-project')}
        />;
      case 'graph-view':
        return selectedWorkflowId ? <GraphView projectId={selectedWorkflowId} onGraphControlsChange={setGraphControls} /> : 
               <div className="text-center p-8">Please select a project first</div>;
      default:
        return <DashboardContent key={refreshTrigger} onNavigate={handleNavigate} onSelectWorkflow={setSelectedWorkflowId} />;
    }
  };

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full">
        <AppSidebar 
          currentView={currentView} 
          onNavigate={handleNavigate} 
          graphControls={graphControls}
          isMobile={isMobile}
        />
        <main ref={mainRef} className={`flex-1 overflow-auto ${isMobile ? 'p-4' : 'p-6'}`}>
          {isMobile && (
            <div className="mb-4">
              <SidebarTrigger />
            </div>
          )}
          {renderContent()}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;