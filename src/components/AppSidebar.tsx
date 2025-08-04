import { Book, Lightbulb, Workflow, Home, Plus, FileText, Upload, GitBranch, BookOpen, Grid3x3 } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar, SidebarGroupLabel } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardView } from "@/pages/Dashboard";

interface AppSidebarProps {
  currentView: DashboardView;
  onNavigate: (view: DashboardView) => void;
  isMobile?: boolean;
  graphControls?: {
    layoutMode: 'hierarchical' | 'spatial';
    onLayoutChange: (mode: 'hierarchical' | 'spatial') => void;
    onAddInsight: () => void;
    multiSelectedConcepts: string[];
    nodeStats: {
      concepts: number;
      hypotheses: number;
      notebooks: number;
      sources: number;
      insights: number;
      connections: number;
    };
  };
}

const menuItems = [
  { id: 'dashboard' as DashboardView, title: "Dashboard", icon: Home },
  { id: 'new-project' as DashboardView, title: "New Project", icon: Plus },
  { id: 'manage-projects' as DashboardView, title: "Projects", icon: FileText },
  { id: 'workflow' as DashboardView, title: "Research Workflow", icon: Workflow },
  { id: 'graph-view' as DashboardView, title: "Literature Map", icon: GitBranch },
  { id: 'prompts' as DashboardView, title: "Prompt Library", icon: Lightbulb },
];

export function AppSidebar({ currentView, onNavigate, graphControls, isMobile = false }: AppSidebarProps) {
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;

  return (
    <Sidebar 
      className="glass-card border-r-0 flex flex-col" 
      collapsible={isMobile ? "offcanvas" : "icon"}
    >
      <SidebarContent className={`${isMobile ? 'p-2' : 'p-4'} flex flex-col h-full overflow-hidden`}>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <Book className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-lg gradient-text">Lit Review AI</h1>
                <p className="text-xs text-muted-foreground">Research Learning Hub</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => {
                      onNavigate(item.id);
                      if (isMobile) {
                        setOpenMobile(false);
                      }
                    }}
                    className={`glass-button w-full justify-start gap-3 py-3 ${
                      currentView === item.id 
                        ? "bg-primary/20 text-primary border-primary/30 glow-effect" 
                        : "hover:bg-white/10"
                    }`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {!collapsed && <span className="font-medium">{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Graph Controls - Only shown on Literature Map view */}
        {currentView === 'graph-view' && graphControls && (
          <SidebarGroup className="mt-6 flex-1 min-h-0">
            <SidebarGroupLabel>Graph Controls</SidebarGroupLabel>
            <SidebarGroupContent className="overflow-hidden">
              <div className="space-y-4 h-full max-h-96 overflow-y-auto pr-2">
                {/* Layout Toggle & Add Insight Button */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-1">
                    <Button
                      variant={graphControls.layoutMode === 'hierarchical' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => graphControls.onLayoutChange('hierarchical')}
                      className="flex items-center gap-1 text-xs flex-1"
                    >
                      <GitBranch className="h-3 w-3" />
                      {!collapsed && "Hierarchical"}
                    </Button>
                    <Button
                      variant={graphControls.layoutMode === 'spatial' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => graphControls.onLayoutChange('spatial')}
                      className="flex items-center gap-1 text-xs flex-1"
                    >
                      <Grid3x3 className="h-3 w-3" />
                      {!collapsed && "Spatial"}
                    </Button>
                  </div>
                  <Button
                    onClick={graphControls.onAddInsight}
                    size="sm"
                    className="w-full"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {!collapsed && `Add Insight${graphControls.multiSelectedConcepts.length > 0 ? ` (${graphControls.multiSelectedConcepts.length})` : ''}`}
                  </Button>
                </div>

                {!collapsed && (
                  <>
                    {/* Node Types */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Node Types</h4>
                      <div className="grid grid-cols-1 gap-1 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                          <span>Research Focus</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span>Concept</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <span>Research Gap</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span>Discrepancy</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span>Publication</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                          <span>Notebook</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                          <span>Source</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                          <span>Insight</span>
                        </div>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Statistics</h4>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {graphControls.nodeStats.concepts} Concepts
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {graphControls.nodeStats.hypotheses} Research Focus
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {graphControls.nodeStats.notebooks} Notebook
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {graphControls.nodeStats.sources} Source
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {graphControls.nodeStats.insights} Insight
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {graphControls.nodeStats.connections} Connections
                      </div>
                    </div>
                  </>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}