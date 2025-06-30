
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Box, 
  Cable, 
  Database, 
  Settings, 
  FileCode, 
  Download,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

const Dashboard = () => {
  const recentProjects = [
    {
      name: "Engine Control Unit",
      type: "Application SWC",
      status: "In Progress",
      lastModified: "2 hours ago",
      progress: 75,
      components: 8,
      ports: 24
    },
    {
      name: "Brake System Controller",
      type: "Service SWC",
      status: "Completed",
      lastModified: "1 day ago",
      progress: 100,
      components: 5,
      ports: 16
    },
    {
      name: "Climate Control",
      type: "Composite SWC",
      status: "Draft",
      lastModified: "3 days ago",
      progress: 25,
      components: 12,
      ports: 36
    }
  ];

  const quickActions = [
    {
      title: "Create New SWC",
      description: "Start building a new software component",
      icon: Box,
      color: "bg-blue-500",
      href: "/swc-builder"
    },
    {
      title: "Design Interfaces",
      description: "Create and manage port interfaces",
      icon: Cable,
      color: "bg-green-500",
      href: "/port-editor"
    },
    {
      title: "Define Data Types",
      description: "Configure application data types",
      icon: Database,
      color: "bg-purple-500",
      href: "/data-types"
    },
    {
      title: "Configure Behavior",
      description: "Set up runnables and events",
      icon: Settings,
      color: "bg-orange-500",
      href: "/behavior"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "In Progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-500/10 text-green-500";
      case "In Progress":
        return "bg-blue-500/10 text-blue-500";
      default:
        return "bg-yellow-500/10 text-yellow-500";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your AUTOSAR software components and recent activity
          </p>
        </div>
        <Button className="autosar-button flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <Card key={index} className="autosar-card hover:shadow-xl transition-all duration-300 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Projects */}
      <Card className="autosar-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Recent Projects
          </CardTitle>
          <CardDescription>
            Continue working on your software components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentProjects.map((project, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 autosar-gradient rounded-lg flex items-center justify-center">
                    <Box className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{project.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {project.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {project.components} components • {project.ports} ports
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(project.status)}
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={project.progress} className="w-20" />
                      <span className="text-sm text-muted-foreground">{project.progress}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{project.lastModified}</p>
                    <Button variant="ghost" size="sm" className="mt-1">
                      Open
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="autosar-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Box className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">12</p>
                <p className="text-sm text-muted-foreground">Total SWCs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="autosar-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Cable className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">48</p>
                <p className="text-sm text-muted-foreground">Interfaces</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="autosar-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Download className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">3</p>
                <p className="text-sm text-muted-foreground">ARXML Exports</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
