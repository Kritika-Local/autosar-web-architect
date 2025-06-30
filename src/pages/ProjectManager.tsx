
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Box, 
  Calendar, 
  Settings,
  Trash2,
  Copy,
  Edit,
  Upload
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAutosarStore } from "@/store/autosarStore";

const ProjectManager = () => {
  const { toast } = useToast();
  const { 
    projects, 
    currentProject,
    createProject, 
    loadProject,
    importArxml 
  } = useAutosarStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  
  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [autosarVersion, setAutosarVersion] = useState("4.3.1");

  const handleCreateProject = () => {
    if (!name) {
      toast({
        title: "Validation Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }

    createProject({
      name,
      description,
      autosarVersion,
      swcs: [],
      interfaces: [],
      dataTypes: [],
    });

    toast({
      title: "Project Created",
      description: `${name} has been created successfully`,
    });

    // Reset form
    setName("");
    setDescription("");
    setAutosarVersion("4.3.1");
    setIsCreateDialogOpen(false);
  };

  const handleLoadProject = (projectId: string) => {
    loadProject(projectId);
    toast({
      title: "Project Loaded",
      description: "Project has been loaded successfully",
    });
  };

  const handleImportArxml = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await importArxml(file);
        toast({
          title: "Import Successful",
          description: `${file.name} has been imported`,
        });
        setIsImportDialogOpen(false);
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Failed to import ARXML file",
          variant: "destructive",
        });
      }
    }
  };

  const getStatusColor = (project: any) => {
    const hasComponents = project.swcs?.length > 0;
    const hasPorts = project.swcs?.some((swc: any) => swc.ports?.length > 0);
    const hasInterfaces = project.interfaces?.length > 0;
    
    if (hasComponents && hasPorts && hasInterfaces) {
      return "bg-green-500/10 text-green-500";
    } else if (hasComponents) {
      return "bg-yellow-500/10 text-yellow-500";
    } else {
      return "bg-gray-500/10 text-gray-500";
    }
  };

  const getProjectStatus = (project: any) => {
    const hasComponents = project.swcs?.length > 0;
    const hasPorts = project.swcs?.some((swc: any) => swc.ports?.length > 0);
    const hasInterfaces = project.interfaces?.length > 0;
    
    if (hasComponents && hasPorts && hasInterfaces) {
      return "Active";
    } else if (hasComponents) {
      return "In Progress";
    } else {
      return "Draft";
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
        <div className="flex gap-2">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import ARXML
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import ARXML Workspace</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="arxml-import">Select ARXML or DBC Files</Label>
                  <Input
                    id="arxml-import"
                    type="file"
                    accept=".arxml,.xml,.dbc"
                    onChange={handleImportArxml}
                    className="mt-2"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Supported formats: .arxml, .xml (AUTOSAR), .dbc (CAN Database)
                </p>
              </div>
            </DialogContent>
          </Dialog>
          
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
                  <Label htmlFor="name">Project Name *</Label>
                  <Input 
                    id="name" 
                    placeholder="Enter project name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input 
                    id="description" 
                    placeholder="Brief description of the project" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="autosar-version">AUTOSAR Version</Label>
                  <Select value={autosarVersion} onValueChange={setAutosarVersion}>
                    <SelectTrigger>
                      <SelectValue />
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
                <Button className="autosar-button" onClick={handleCreateProject}>
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
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
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Current Project Indicator */}
      {currentProject && (
        <Card className="autosar-card border-primary/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Box className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Current Project: {currentProject.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {currentProject.swcs.length} SWCs • {currentProject.interfaces.length} Interfaces • {currentProject.dataTypes.length} Data Types
                  </p>
                </div>
              </div>
              <Badge className="bg-primary/10 text-primary">Active</Badge>
            </div>
          </CardContent>
        </Card>
      )}

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
                      AUTOSAR {project.autosarVersion}
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
                    <DropdownMenuItem onClick={() => handleLoadProject(project.id)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Load Project
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
                {project.description || "No description provided"}
              </CardDescription>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">SWCs:</span>
                  <span className="font-medium">{project.swcs?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Interfaces:</span>
                  <span className="font-medium">{project.interfaces?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Data Types:</span>
                  <span className="font-medium">{project.dataTypes?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Modified:</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span className="font-medium">
                      {new Date(project.lastModified).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <Badge className={getStatusColor(project)}>
                  {getProjectStatus(project)}
                </Badge>
                <Button 
                  size="sm" 
                  className="autosar-button"
                  onClick={() => handleLoadProject(project.id)}
                >
                  {currentProject?.id === project.id ? "Current" : "Load"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <Card className="autosar-car">
          <CardContent className="text-center py-12">
            <Box className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">
              {projects.length === 0 ? "No projects created yet" : "No projects match your search"}
            </p>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="autosar-button"
            >
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectManager;
