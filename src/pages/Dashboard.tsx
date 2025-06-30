
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Box, 
  Plus, 
  FolderOpen, 
  Database, 
  Cable, 
  Settings, 
  FileCode,
  BarChart3,
  Clock,
  Save,
  Download
} from "lucide-react";
import { useAutosarStore } from "@/store/autosarStore";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentProject, projects, saveProjectAsDraft, autoSave, exportArxml } = useAutosarStore();

  const stats = {
    totalProjects: projects.length,
    totalSWCs: currentProject?.swcs.length || 0,
    totalInterfaces: currentProject?.interfaces.length || 0,
    totalDataTypes: currentProject?.dataTypes.length || 0,
    totalDataElements: currentProject?.dataElements.length || 0,
  };

  const handleSaveDraft = () => {
    saveProjectAsDraft();
  };

  const handleAutoSave = () => {
    autoSave();
  };

  const handleExportArxml = () => {
    exportArxml();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          AUTOSAR SWC Designer
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Professional AUTOSAR Software Component modeling tool inspired by Vector DaVinci Developer
        </p>
        {currentProject && (
          <div className="mt-4 flex items-center justify-center gap-4">
            <Badge variant="outline" className="text-sm px-3 py-1">
              Current Project: {currentProject.name}
            </Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              AUTOSAR {currentProject.autosarVersion}
            </Badge>
            {currentProject.isDraft && (
              <Badge variant="destructive" className="text-sm px-3 py-1">
                Draft
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          className="autosar-card hover:shadow-lg transition-all duration-300 cursor-pointer"
          onClick={() => navigate('/projects')}
        >
          <CardHeader className="text-center pb-3">
            <Plus className="h-12 w-12 mx-auto mb-3 text-autosar-primary" />
            <CardTitle className="text-lg">New Project</CardTitle>
            <CardDescription>Create a new AUTOSAR project</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button className="w-full autosar-button" onClick={(e) => {
              e.stopPropagation();
              navigate('/projects');
            }}>
              Create Project
            </Button>
          </CardContent>
        </Card>

        <Card 
          className="autosar-card hover:shadow-lg transition-all duration-300 cursor-pointer"
          onClick={() => navigate('/projects')}
        >
          <CardHeader className="text-center pb-3">
            <FolderOpen className="h-12 w-12 mx-auto mb-3 text-autosar-secondary" />
            <CardTitle className="text-lg">Open Project</CardTitle>
            <CardDescription>Load an existing project</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button variant="outline" className="w-full" onClick={(e) => {
              e.stopPropagation();
              navigate('/projects');
            }}>
              Browse Projects
            </Button>
          </CardContent>
        </Card>

        <Card 
          className="autosar-card hover:shadow-lg transition-all duration-300 cursor-pointer"
          onClick={() => navigate('/data-types')}
        >
          <CardHeader className="text-center pb-3">
            <Database className="h-12 w-12 mx-auto mb-3 text-blue-500" />
            <CardTitle className="text-lg">Data Types</CardTitle>
            <CardDescription>Manage application data types</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button variant="outline" className="w-full" onClick={(e) => {
              e.stopPropagation();
              navigate('/data-types');
            }}>
              View Data Types
            </Button>
          </CardContent>
        </Card>

        <Card 
          className="autosar-card hover:shadow-lg transition-all duration-300 cursor-pointer"
          onClick={() => navigate('/port-editor')}
        >
          <CardHeader className="text-center pb-3">
            <Cable className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <CardTitle className="text-lg">Interfaces</CardTitle>
            <CardDescription>Design component interfaces</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button variant="outline" className="w-full" onClick={(e) => {
              e.stopPropagation();
              navigate('/port-editor');
            }}>
              View Interfaces
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Current Project Overview */}
      {currentProject && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="autosar-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Project Overview
              </CardTitle>
              <CardDescription>
                Current project statistics and quick access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-autosar-primary">{stats.totalSWCs}</div>
                  <div className="text-sm text-muted-foreground">SWCs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-autosar-secondary">{stats.totalInterfaces}</div>
                  <div className="text-sm text-muted-foreground">Interfaces</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{stats.totalDataTypes}</div>
                  <div className="text-sm text-muted-foreground">Data Types</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{stats.totalDataElements}</div>
                  <div className="text-sm text-muted-foreground">Data Elements</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button 
                  onClick={() => navigate('/swc-builder')}
                  className="autosar-button"
                >
                  <Box className="h-4 w-4 mr-2" />
                  SWC Builder
                </Button>
                <Button 
                  onClick={() => navigate('/behavior-designer')}
                  variant="outline"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Behavior Designer
                </Button>
                <Button 
                  onClick={() => navigate('/data-element-editor')}
                  variant="outline"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Data Elements
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="autosar-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                Project Actions
              </CardTitle>
              <CardDescription>
                Save and manage your project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button 
                  onClick={handleSaveDraft}
                  variant="outline" 
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>
                <Button 
                  onClick={handleAutoSave}
                  variant="outline" 
                  className="w-full"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Manual Save
                </Button>
                <Button 
                  onClick={handleExportArxml}
                  className="w-full autosar-button"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export ARXML
                </Button>
              </div>
              
              <div className="pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  <p>Last modified: {new Date(currentProject.lastModified).toLocaleString()}</p>
                  <p>AUTOSAR Version: {currentProject.autosarVersion}</p>
                  <p>Auto-save: {currentProject.autoSaveEnabled ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Getting Started */}
      {!currentProject && (
        <Card className="autosar-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Get Started</CardTitle>
            <CardDescription>
              Create your first AUTOSAR project or import existing components
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex justify-center gap-4">
              <Button 
                onClick={() => navigate('/projects')}
                className="autosar-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Project
              </Button>
              <Button 
                onClick={() => navigate('/projects')}
                variant="outline"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Import ARXML
              </Button>
            </div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Start by creating a new project to define your AUTOSAR software components, 
              interfaces, and data types.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Workspace Stats */}
      <Card className="autosar-card">
        <CardHeader>
          <CardTitle>Workspace Statistics</CardTitle>
          <CardDescription>
            Overview of all projects in your workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-autosar-primary mb-2">{stats.totalProjects}</div>
              <div className="text-sm text-muted-foreground">Total Projects</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-autosar-secondary mb-2">
                {projects.filter(p => p.isDraft).length}
              </div>
              <div className="text-sm text-muted-foreground">Draft Projects</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">
                {projects.filter(p => p.autosarVersion === '4.2.2').length}
              </div>
              <div className="text-sm text-muted-foreground">AUTOSAR 4.2.2</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-2">
                {projects.filter(p => p.autosarVersion === '4.3.1').length}
              </div>
              <div className="text-sm text-muted-foreground">AUTOSAR 4.3.1</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
