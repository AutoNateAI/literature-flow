import { Book, Lightbulb, Workflow, Home } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { DashboardView } from "@/pages/Dashboard";

interface AppSidebarProps {
  currentView: DashboardView;
  onNavigate: (view: DashboardView) => void;
}

const menuItems = [
  { id: 'dashboard' as DashboardView, title: "Dashboard", icon: Home },
  { id: 'manage-workflows' as DashboardView, title: "Manage Workflows", icon: Book },
  { id: 'workflow' as DashboardView, title: "Grant Writing Workflow", icon: Workflow },
  { id: 'prompts' as DashboardView, title: "Prompt Library", icon: Lightbulb },
];

export function AppSidebar({ currentView, onNavigate }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar className="glass-card border-r-0" collapsible="icon">
      <SidebarContent className="p-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <Book className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-lg gradient-text">Grant AI</h1>
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
                    onClick={() => onNavigate(item.id)}
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
      </SidebarContent>
    </Sidebar>
  );
}