
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Box, 
  Calendar, 
  Settings,
  Trash2,
  Copy,
  Edit
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ProjectManager = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const projects = [
    {
      id: 1,
      name: "Engine Control Unit",
      description: "Main engine management system with fuel injection control",
      type: "Application SWC",
      autosarVersion: "4.3.1",
      components: 8,
      interfaces: 24,
      lastModified: "2024-12-30",
      status: "Active"
    },
    {
      id: 2,
      name: "Brake System Controller",
      description: "ABS and ESP brake control system",
      type: "Service SWC",
      autosarVersion: "4.2.2",
      components: 5,
      interfaces: 16,
      lastModified: "2024-12-29",
      status: "Completed"
    },
    {
      id: 3,
      name: "Climate Control",
      description: "HVAC system control with temperature regulation",
      type: "Composite SWC",
      autosarVersion: "4.3.1",
      components: 12,
      interfaces: 36,
      lastModified: "2024-12-27",
      status: "Draft"
    },
    {
      id: 4,
      name: "Door Control Module",
      description: "Central door locking and window control",
      type: "Application SWC",
      autosarVersion: "4.3.1",
      components: 6,
      interfaces: 18,
      lastModified: "2024-12-25",
      status: "Active"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500/10 text-green-500";
      case "Completed":
        return "bg-blue-500/10 text-blue-500";
      case "Draft":
        return "bg-yellow-500/10 text-yellow-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Project Manager</h1>
          <p className="text-muted-foreground mt-1">
            Manage your AUTOSAR SWC projects and configurations
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="autosar-button flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Project Name</Label>
                <Input id="name" placeholder="Enter project name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" placeholder="Brief description of the project" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Component Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select component type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="application">Application SWC</SelectItem>
                    <SelectItem value="service">Service SWC</SelectItem>
                    <SelectItem value="composite">Composite SWC</SelectItem>
                    <SelectItem value="ecu-abstraction">ECU Abstraction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="autosar-version">AUTOSAR Version</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select AUTOSAR version" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4.3.1">AUTOSAR 4.3.1</SelectItem>
                    <SelectItem value="4.2.2">AUTOSAR 4.2.2</SelectItem>
                    <SelectItem value="4.4.0">AUTOSAR 4.4.0</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="autosar-button" onClick={() => setIsCreateDialogOpen(false)}>
                Create Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card className="autosar-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="autosar-card hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 autosar-gradient rounded-lg flex items-center justify-center">
                    <Box className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {project.type}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-500">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                {project.description}
              </CardDescription>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Components:</span>
                  <span className="font-medium">{project.components}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Interfaces:</span>
                  <span className="font-medium">{project.interfaces}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">AUTOSAR:</span>
                  <span className="font-medium">{project.autosarVersion}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Modified:</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span className="font-medium">{project.lastModified}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <Badge className={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
                <Button size="sm" className="autosar-button">
                  Open
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProjectManager;
