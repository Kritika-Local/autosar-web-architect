import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAutosarStore } from "@/store/autosarStore";
import { RequirementParser, RequirementDocument } from "@/utils/requirementParser";
import { AutosarGenerator } from "@/utils/autosarGenerator";
import { FileText, Upload, Wand2, CheckCircle, AlertCircle, Play, Clock, Zap, Database, Settings } from "lucide-react";

const EnhancedRequirementImporter = () => {
  const { toast } = useToast();
  const { projects, currentProject, createProject, loadProject, createSWC, createInterface, createPort, createRunnable, addAccessPoint } = useAutosarStore();
  
  const [requirements, setRequirements] = useState<RequirementDocument[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [createNewProject, setCreateNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [validationResults, setValidationResults] = useState<{ [key: string]: boolean }>({});
  const [showSampleData, setShowSampleData] = useState(false);

  const validateRequirement = useCallback((req: RequirementDocument): boolean => {
    const hasBasicFields = !!(req.id && req.shortName && req.description && req.description.length > 10);
    const hasValidCategory = ['FUNCTIONAL', 'NON_FUNCTIONAL', 'CONSTRAINT', 'INTERFACE'].includes(req.category);
    const hasValidPriority = ['HIGH', 'MEDIUM', 'LOW'].includes(req.priority);
    
    return hasBasicFields && hasValidCategory && hasValidPriority;
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
    setProcessingStep('Reading file...');
    setProcessingProgress(20);

    try {
      setProcessingStep('Parsing requirements...');
      setProcessingProgress(40);
      
      const parsedRequirements = await RequirementParser.parseFile(file);
      
      setProcessingStep('Validating requirements...');
      setProcessingProgress(70);
      
      // Enhanced validation
      const validation: { [key: string]: boolean } = {};
      for (const req of parsedRequirements) {
        validation[req.id] = validateRequirement(req);
      }
      setValidationResults(validation);

      setProcessingStep('Finalizing...');
      setProcessingProgress(100);
      
      setRequirements(parsedRequirements);

      const validCount = Object.values(validation).filter(Boolean).length;
      const totalCount = parsedRequirements.length;

      toast({
        title: "File Processed Successfully",
        description: `${totalCount} requirements extracted, ${validCount} valid requirements found`,
      });

    } catch (error: any) {
      toast({
        title: "Processing Error",
        description: error.message || "Failed to process the file",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
      setProcessingProgress(0);
    }
  }, [toast, validateRequirement]);

  const loadSampleData = useCallback(() => {
    const sampleRequirements: RequirementDocument[] = [
      {
        id: "REQ-001",
        shortName: "Engine_Speed_Control",
        description: "The Engine Controller shall read engine speed data every 10ms and provide speed information via CAN interface using uint16 data type.",
        category: "FUNCTIONAL",
        priority: "HIGH",
        source: "SAMPLE",
        derivedElements: {
          swcs: ["EngineController"],
          interfaces: ["EngineSpeedInterface"],
          signals: ["EngineSpeedSignal"],
          ports: ["SpeedDataPort"],
          runnables: ["Engine_10ms"]
        },
        timing: {
          period: 10,
          unit: "ms",
          type: "periodic"
        },
        communication: {
          interfaceType: "SenderReceiver",
          direction: "sender",
          dataElements: [
            { name: "EngineSpeed", type: "uint16", category: "VALUE" },
            { name: "SpeedStatus", type: "uint8", category: "VALUE" }
          ]
        }
      },
      {
        id: "REQ-002", 
        shortName: "Brake_Pressure_Monitor",
        description: "The Brake System SWC must receive brake pressure signals and trigger emergency response when pressure exceeds threshold.",
        category: "INTERFACE",
        priority: "HIGH",
        source: "SAMPLE",
        derivedElements: {
          swcs: ["BrakeSystemController"],
          interfaces: ["BrakePressureInterface"],
          signals: ["BrakePressureSignal"],
          ports: ["PressureInputPort"],
          runnables: ["BrakeSystem_Event"]
        },
        timing: {
          type: "event"
        },
        communication: {
          interfaceType: "SenderReceiver",
          direction: "receiver",
          dataElements: [
            { name: "BrakePressure", type: "uint16", category: "VALUE" },
            { name: "EmergencyFlag", type: "boolean", category: "VALUE" }
          ]
        }
      },
      {
        id: "REQ-003",
        shortName: "System_Initialize", 
        description: "The System Controller shall initialize all subsystems during startup and perform self-diagnostics.",
        category: "FUNCTIONAL",
        priority: "MEDIUM",
        source: "SAMPLE",
        derivedElements: {
          swcs: ["SystemController"],
          interfaces: ["DiagnosticInterface"],
          signals: ["DiagnosticSignal"],
          ports: ["DiagnosticOutputPort"],
          runnables: ["System_Init"]
        },
        timing: {
          type: "init"
        },
        communication: {
          interfaceType: "SenderReceiver",
          direction: "both",
          dataElements: [
            { name: "InitStatus", type: "uint8", category: "VALUE" },
            { name: "DiagnosticCode", type: "uint32", category: "VALUE" }
          ]
        }
      }
    ];

    setRequirements(sampleRequirements);
    
    // Validate sample requirements
    const validation: { [key: string]: boolean } = {};
    for (const req of sampleRequirements) {
      validation[req.id] = validateRequirement(req);
    }
    setValidationResults(validation);
    setShowSampleData(true);

    toast({
      title: "Sample Data Loaded",
      description: `${sampleRequirements.length} sample requirements loaded successfully`,
    });
  }, [validateRequirement, toast]);

  const generateArtifacts = useCallback(async () => {
    if (requirements.length === 0) {
      toast({
        title: "No Requirements",
        description: "Please import requirements first or load sample data",
        variant: "destructive",
      });
      return;
    }

    const validRequirements = requirements.filter(req => validationResults[req.id]);
    if (validRequirements.length === 0) {
      toast({
        title: "No Valid Requirements",
        description: "Please ensure at least one requirement passes validation",
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
          description: `Project created from ${validRequirements.length} requirements - ${new Date().toLocaleDateString()}`,
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
      setProcessingStep('Analyzing requirements...');
      setProcessingProgress(10);

      const artifacts = AutosarGenerator.generateArtifacts(validRequirements);

      setProcessingStep('Creating SWCs...');
      setProcessingProgress(30);

      // Create SWCs
      for (const swc of artifacts.swcs) {
        if (!targetProject.swcs.find(s => s.name === swc.name)) {
          createSWC(swc);
        }
      }

      setProcessingStep('Creating interfaces...');
      setProcessingProgress(50);

      // Create Interfaces
      for (const iface of artifacts.interfaces) {
        if (!targetProject.interfaces.find(i => i.name === iface.name)) {
          createInterface(iface);
        }
      }

      setProcessingStep('Creating ports...');
      setProcessingProgress(70);

      // Get updated project state
      const updatedProject = projects.find(p => p.id === targetProject.id) || targetProject;

      // Create Ports
      for (const port of artifacts.ports) {
        const swc = updatedProject.swcs.find(s => s.name === port.swcName);
        if (swc && !swc.ports?.find(p => p.name === port.name)) {
          createPort({ swcId: swc.id, ...port });
        }
      }

      setProcessingStep('Creating runnables...');
      setProcessingProgress(85);

      // Create Runnables
      for (const runnable of artifacts.runnables) {
        const swc = updatedProject.swcs.find(s => s.name === runnable.swcName);
        if (swc && !swc.runnables?.find(r => r.name === runnable.name)) {
          createRunnable({ swcId: swc.id, ...runnable });
        }
      }

      setProcessingStep('Creating access points...');
      setProcessingProgress(95);

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

      setProcessingStep('Finalizing...');
      setProcessingProgress(100);

      toast({
        title: "Artifacts Generated Successfully",
        description: `Created ${artifacts.swcs.length} SWCs, ${artifacts.interfaces.length} interfaces, ${artifacts.ports.length} ports, and ${artifacts.runnables.length} runnables from ${validRequirements.length} requirements`,
      });

      // Clear form
      setRequirements([]);
      setValidationResults({});
      setSelectedProjectId('');
      setCreateNewProject(false);
      setNewProjectName('');
      setShowSampleData(false);

    } catch (error: any) {
      toast({
        title: "Generation Error",
        description: `Failed to generate artifacts: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
      setProcessingProgress(0);
    }
  }, [requirements, validationResults, currentProject, createNewProject, newProjectName, selectedProjectId, projects, toast, createProject, loadProject, createSWC, createInterface, createPort, createRunnable, addAccessPoint]);

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

  const getTimingIcon = (timing: RequirementDocument['timing']) => {
    if (!timing) return null;
    switch (timing.type) {
      case 'periodic': return <Clock className="h-4 w-4" />;
      case 'event': return <Zap className="h-4 w-4" />;
      case 'init': return <Play className="h-4 w-4" />;
      default: return null;
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
        <Button 
          variant="outline" 
          onClick={loadSampleData}
          disabled={isProcessing}
        >
          <Database className="h-4 w-4 mr-2" />
          Load Sample Data
        </Button>
      </div>

      {/* Progress indicator */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{processingStep}</span>
                <span className="text-sm text-muted-foreground">{processingProgress}%</span>
              </div>
              <Progress value={processingProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

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
            Supported formats: .txt, .doc, .docx, .xls, .xlsx | Natural language processing enabled
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
              {showSampleData ? 'Sample Requirements' : 'Imported Requirements'} ({requirements.length})
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
                <TabsTrigger value="preview">Generation Preview</TabsTrigger>
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
                          {req.timing && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              {getTimingIcon(req.timing)}
                              {req.timing.type === 'periodic' ? `${req.timing.period}${req.timing.unit}` : req.timing.type}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm">{req.description}</p>
                      
                      {/* Enhanced information display */}
                      {(req.communication || req.ecuBehavior || req.derivedElements) && (
                        <div className="pt-2 border-t space-y-2">
                          {req.communication && (
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">Communication:</span> {req.communication.direction}
                              {req.communication.dataElements && (
                                <span> | Data: {req.communication.dataElements.map(de => `${de.name}(${de.type})`).join(', ')}</span>
                              )}
                            </div>
                          )}
                          {req.derivedElements && req.derivedElements.swcs.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">Derived SWCs:</span> {req.derivedElements.swcs.join(', ')}
                            </div>
                          )}
                        </div>
                      )}
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

              <TabsContent value="preview" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Preview of AUTOSAR artifacts to be generated from valid requirements:
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Settings className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <div className="font-semibold">SWCs</div>
                    <div className="text-sm text-muted-foreground">Software Components</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Database className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <div className="font-semibold">Interfaces</div>
                    <div className="text-sm text-muted-foreground">Port Interfaces</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                    <div className="font-semibold">Runnables</div>
                    <div className="text-sm text-muted-foreground">Executable Functions</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                    <div className="font-semibold">Access Points</div>
                    <div className="text-sm text-muted-foreground">RTE Access</div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end pt-4 border-t">
              <Button 
                onClick={generateArtifacts} 
                disabled={isProcessing || Object.values(validationResults).filter(Boolean).length === 0}
                className="flex items-center gap-2"
                size="lg"
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
