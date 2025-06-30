
import { useState } from "react";
import { Circle, Square, Plus, Folder, Database, Cable, Settings, Hash, BarChart3, FolderOpen, Download } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAutosarStore } from "@/store/autosarStore";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
  { title: "Projects", url: "/projects", icon: Folder },
];

const designItems = [
  { title: "SWC Builder", url: "/swc-builder", icon: Square },
  { title: "Port & Interface Editor", url: "/port-editor", icon: Cable },
  { title: "Data Types", url: "/data-types", icon: Database },
  { title: "Data Elements", url: "/data-element-editor", icon: Hash },
  { title: "Behavior Designer", url: "/behavior-designer", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { projects, exportMultipleArxml } = useAutosarStore();
  const currentPath = location.pathname;
  
  const [recentProjectsOpen, setRecentProjectsOpen] = useState(false);

  const isActive = (path: string) => currentPath === path;
  const isMainExpanded = mainItems.some((item) => isActive(item.url));
  const isDesignExpanded = designItems.some((item) => isActive(item.url));
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  const handleExportArxml = () => {
    exportMultipleArxml();
  };

  return (
    <Sidebar
      className={state === "collapsed" ? "w-14" : "w-60"}
      collapsible="icon"
    >
      <SidebarContent>
        {/* Header */}
        <div className="p-4 border-b border-border">
          {state !== "collapsed" && (
            <h2 className="text-lg font-bold text-autosar-primary">AUTOSAR Designer</h2>
          )}
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Design Tools */}
        <SidebarGroup>
          <SidebarGroupLabel>Design Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {designItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Export Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Export</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleExportArxml}>
                  <Download className="mr-2 h-4 w-4" />
                  {state !== "collapsed" && <span>Export ARXML</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent Projects */}
        {projects.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Recent Projects</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {projects.slice(0, 5).map((project) => (
                  <SidebarMenuItem key={project.id}>
                    <SidebarMenuButton asChild>
                      <NavLink to={`/projects?load=${project.id}`} className={getNavCls}>
                        <FolderOpen className="mr-2 h-4 w-4" />
                        {state !== "collapsed" && (
                          <span className="truncate">{project.name}</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
