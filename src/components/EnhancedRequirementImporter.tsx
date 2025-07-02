import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAutosarStore } from "@/store/autosarStore";
import { RequirementParser, RequirementDocument } from "@/utils/requirementParser";
import { AutosarGenerator } from "@/utils/autosarGenerator";
import { FileText, Upload, Wand2, CheckCircle, AlertCircle, Play } from "lucide-react";

const EnhancedRequirementImporter = () => {
  const { toast } = useToast();
  const { projects, currentProject, createProject, loadProject, createSWC, createInterface, createPort, createRunnable, addAccessPoint } = useAutosarStore();
  
  const [requirements, setRequirements] = useState<RequirementDocument[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [createNewProject, setCreateNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [validationResults, setValidationResults] = useState<{ [key: string]: boolean }>({});

  const validateRequirement = useCallback((req: RequirementDocument): boolean => {
    return !!(req.id && req.shortName && req.description && req.description.length > 10);
  }, []);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['.txt', '.doc', '.docx', '.xls', '.xlsx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      toast({
        title: "Unsupported File Format",
        description: "Please upload .txt, .doc, .docx, .xls, or .xlsx files",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const parsedRequirements = await RequirementParser.parseFile(file);
      setRequirements(parsedRequirements);
      
      // Validate requirements
      const validation: { [key: string]: boolean } = {};
      for (const req of parsedRequirements) {
        validation[req.id] = validateRequirement(req);
      }
      setValidationResults(validation);

      toast({
        title: "File Processed",
        description: `${parsedRequirements.length} requirements extracted from ${file.name}`,
      });
    } catch (error: any) {
      toast({
        title: "Processing Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast, validateRequirement]);

  const generateArtifacts = useCallback(async () => {
    if (requirements.length === 0) {
      toast({
        title: "No Requirements",
        description: "Please import requirements first",
        variant: "destructive",
      });
      return;
    }

    let targetProject = currentProject;

    // Handle project selection/creation
    if (!targetProject) {
      if (createNewProject) {
        if (!newProjectName.trim()) {
          toast({
            title: "Project Name Required",
            description: "Please enter a name for the new project",
            variant: "destructive",
          });
          return;
        }

        createProject({
          name: newProjectName,
          description: `Project created from requirements - ${new Date().toLocaleDateString()}`,
          autosarVersion: "4.2.2",
          swcs: [],
          interfaces: [],
          dataTypes: [],
          dataElements: [],
          connections: [],
          ecuCompositions: [],
          isDraft: true,
          autoSaveEnabled: true,
        });

        targetProject = projects[projects.length - 1];
      } else if (selectedProjectId) {
        loadProject(selectedProjectId);
        targetProject = projects.find(p => p.id === selectedProjectId) || null;
      } else {
        toast({
          title: "No Project Selected",
          description: "Please select an existing project or create a new one",
          variant: "destructive",
        });
        return;
      }
    }

    if (!targetProject) {
      toast({
        title: "Project Error",
        description: "Unable to load or create project",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      const artifacts = AutosarGenerator.generateArtifacts(requirements);

      // Create SWCs
      for (const swc of artifacts.swcs) {
        if (!targetProject.swcs.find(s => s.name === swc.name)) {
          createSWC(swc);
        }
      }

      // Create Interfaces
      for (const iface of artifacts.interfaces) {
        if (!targetProject.interfaces.find(i => i.name === iface.name)) {
          createInterface(iface);
        }
      }

      // Get updated project state
      const updatedProject = projects.find(p => p.id === targetProject.id) || targetProject;

      // Create Ports
      for (const port of artifacts.ports) {
        const swc = updatedProject.swcs.find(s => s.name === port.swcName);
        if (swc && !swc.ports?.find(p => p.name === port.name)) {
          createPort({ swcId: swc.id, ...port });
        }
      }

      // Create Runnables
      for (const runnable of artifacts.runnables) {
        const swc = updatedProject.swcs.find(s => s.name === runnable.swcName);
        if (swc && !swc.runnables?.find(r => r.name === runnable.name)) {
          createRunnable({ swcId: swc.id, ...runnable });
        }
      }

      // Create Access Points
      for (const ap of artifacts.accessPoints) {
        const swc = updatedProject.swcs.find(s => s.name === ap.swcName);
        const runnable = swc?.runnables?.find(r => r.name === ap.runnableName);
        if (swc && runnable) {
          addAccessPoint(runnable.id, {
            ...ap,
            swcId: swc.id,
            runnableId: runnable.id
          });
        }
      }

      toast({
        title: "Artifacts Generated",
        description: `Successfully created ${artifacts.swcs.length} SWCs, ${artifacts.interfaces.length} interfaces, ${artifacts.ports.length} ports, and ${artifacts.runnables.length} runnables`,
      });

      // Clear form
      setRequirements([]);
      setValidationResults({});
      setSelectedProjectId('');
      setCreateNewProject(false);
      setNewProjectName('');

    } catch (error: any) {
      toast({
        title: "Generation Error",
        description: `Failed to generate artifacts: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [requirements, currentProject, createNewProject, newProjectName, selectedProjectId, projects, toast, createProject, loadProject, createSWC, createInterface, createPort, createRunnable, addAccessPoint]);

  const getCategoryColor = (category: RequirementDocument['category']) => {
    switch (category) {
      case 'FUNCTIONAL': return 'bg-blue-100 text-blue-800';
      case 'NON_FUNCTIONAL': return 'bg-purple-100 text-purple-800';
      case 'INTERFACE': return 'bg-green-100 text-green-800';
      case 'CONSTRAINT': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: RequirementDocument['priority']) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Requirement Importer</h1>
          <p className="text-muted-foreground mt-1">
            Import requirements from documents and generate AUTOSAR 4.2.2 compliant artifacts
          </p>
        </div>
      </div>

      {/* Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Target Project</CardTitle>
          <CardDescription>Select or create a project for artifact generation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentProject ? (
            <div className="p-4 bg-primary/10 rounded-lg">
              <h3 className="font-medium text-primary">Current Project: {currentProject.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                AUTOSAR {currentProject.autosarVersion} | Artifacts will be generated here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="existing"
                  name="projectOption"
                  checked={!createNewProject}
                  onChange={() => setCreateNewProject(false)}
                />
                <Label htmlFor="existing">Use existing project</Label>
              </div>
              
              {!createNewProject && (
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name} - AUTOSAR {project.autosarVersion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="new"
                  name="projectOption"
                  checked={createNewProject}
                  onChange={() => setCreateNewProject(true)}
                />
                <Label htmlFor="new">Create new project</Label>
              </div>

              {createNewProject && (
                <Input
                  placeholder="Enter new project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Requirements Document
          </CardTitle>
          <CardDescription>
            Supported formats: .txt, .doc, .docx, .xls, .xlsx
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="file"
            accept=".txt,.doc,.docx,.xls,.xlsx"
            onChange={handleFileUpload}
            disabled={isProcessing}
          />
          {isProcessing && (
            <p className="text-sm text-muted-foreground mt-2">Processing document...</p>
          )}
        </CardContent>
      </Card>

      {/* Requirements Display */}
      {requirements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Imported Requirements ({requirements.length})
            </CardTitle>
            <CardDescription>
              Review and validate requirements before generating AUTOSAR artifacts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="list" className="w-full">
              <TabsList>
                <TabsTrigger value="list">Requirements List</TabsTrigger>
                <TabsTrigger value="validation">Validation Report</TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="space-y-4">
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {requirements.map((req) => (
                    <div key={req.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold">{req.shortName}</h3>
                          <p className="text-sm font-mono text-muted-foreground">{req.id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {validationResults[req.id] ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          <Badge className={getCategoryColor(req.category)}>
                            {req.category}
                          </Badge>
                          <Badge className={getPriorityColor(req.priority)}>
                            {req.priority}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm">{req.description}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="validation" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-medium text-green-600">Valid Requirements</h3>
                    <div className="text-2xl font-bold text-green-600">
                      {Object.values(validationResults).filter(Boolean).length}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium text-red-600">Invalid Requirements</h3>
                    <div className="text-2xl font-bold text-red-600">
                      {Object.values(validationResults).filter(v => !v).length}
                    </div>
                  </div>
                </div>
                
                {Object.entries(validationResults).some(([_, valid]) => !valid) && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Issues Found:</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      {Object.entries(validationResults)
                        .filter(([_, valid]) => !valid)
                        .map(([reqId, _]) => {
                          const req = requirements.find(r => r.id === reqId);
                          return (
                            <li key={reqId}>
                              {reqId}: {!req?.description || req.description.length < 10 ? 'Description too short' : 'Missing required fields'}
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end pt-4 border-t">
              <Button 
                onClick={generateArtifacts} 
                disabled={isProcessing || Object.values(validationResults).filter(Boolean).length === 0}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Generate AUTOSAR Artifacts
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedRequirementImporter;
