import { useState, useRef, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardContent } from "@/components/DashboardContent";
import { PromptLibrary } from "@/components/PromptLibrary";
import { WorkflowBuilder } from "@/components/WorkflowBuilder";
import { WorkflowManager } from "@/components/WorkflowManager";
import { EntryModule } from "@/components/EntryModule";
import { ProjectManager } from "@/components/ProjectManager";
import { NotebookUpload } from "@/components/NotebookUpload";
import { GraphView } from "@/components/GraphView";
import { NotebookManager } from "@/components/NotebookManager";

export type DashboardView = 'dashboard' | 'prompts' | 'workflow' | 'manage-workflows' | 'new-project' | 'manage-projects' | 'upload-data' | 'graph-view' | 'notebook-manager';

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
      case 'upload-data':
        return selectedWorkflowId ? <NotebookUpload projectId={selectedWorkflowId} /> : 
               <div className="text-center p-8">Please select a project first</div>;
      case 'graph-view':
        return selectedWorkflowId ? <GraphView projectId={selectedWorkflowId} /> : 
               <div className="text-center p-8">Please select a project first</div>;
      case 'notebook-manager':
        return selectedWorkflowId ? <NotebookManager projectId={selectedWorkflowId} /> : 
               <div className="text-center p-8">Please select a project first</div>;
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