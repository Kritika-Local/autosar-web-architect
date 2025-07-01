
import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAutosarStore, Swc, Interface, DataElement, Port } from "@/store/autosarStore";
import { v4 as uuidv4 } from 'uuid';
import { Database, FileText, Plus, ArrowDown, Upload } from "lucide-react";

interface Requirement {
  id: string;
  description: string;
  componentName: string;
  interfaceName: string;
  dataElement: string;
  dataType: string;
  portName: string;
  portDirection: 'required' | 'provided';
}

interface ParsedRequirement {
  swc: Omit<Swc, 'id'>;
  interface_: Omit<Interface, 'id'>;
  dataElements: DataElement[];
  port: Omit<Port, 'id'>;
}

const RequirementImporter = () => {
  const { toast } = useToast();
  const { projects, currentProject, createProject, loadProject, createSWC, createInterface, createPort } = useAutosarStore();
  const [requirementsText, setRequirementsText] = useState('');
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [createNewProject, setCreateNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Sample requirement format for user reference
  const sampleRequirements = `[
  {
    "id": "REQ-001",
    "description": "Engine speed shall be measured and transmitted",
    "componentName": "EngineController",
    "interfaceName": "EngineSpeedInterface",
    "dataElement": "EngineSpeed",
    "dataType": "uint16",
    "portName": "EngineSpeedPort",
    "portDirection": "provided"
  },
  {
    "id": "REQ-002", 
    "description": "Vehicle speed shall be received and processed",
    "componentName": "SpeedController",
    "interfaceName": "VehicleSpeedInterface",
    "dataElement": "VehicleSpeed",
    "dataType": "uint32",
    "portName": "VehicleSpeedPort",
    "portDirection": "required"
  }
]`;

  const parseRequirements = useCallback(() => {
    setIsParsing(true);
    try {
      const parsed = JSON.parse(requirementsText) as Requirement[];
      setRequirements(parsed);
      toast({
        title: "Requirements Parsed",
        description: `${parsed.length} requirements parsed successfully`,
      });
    } catch (error) {
      toast({
        title: "Parse Error",
        description: "Failed to parse requirements. Please ensure the JSON is valid.",
        variant: "destructive",
      });
    } finally {
      setIsParsing(false);
    }
  }, [requirementsText, toast]);

  const handleImportRequirements = async () => {
    if (requirements.length === 0) {
      toast({
        title: "No Requirements",
        description: "Please parse requirements first",
        variant: "destructive",
      });
      return;
    }

    let targetProject = currentProject;

    // If no current project, create new or load existing
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
          description: `Project created from requirement import - ${new Date().toLocaleDateString()}`,
          autosarVersion: "4.3.1",
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
      for (const requirement of requirements) {
        const parsed = parseRequirement(requirement);
        
        // Create SWC if it doesn't exist
        let swc = targetProject.swcs.find(swc => swc.name === requirement.componentName);
        if (!swc) {
          createSWC(parsed.swc);
        }

        // Create Interface if it doesn't exist
        let interface_ = targetProject.interfaces.find(iface => iface.name === requirement.interfaceName);
        if (!interface_) {
          createInterface(parsed.interface_);
        }

        // Create Port if it doesn't exist
        swc = targetProject.swcs.find(swc => swc.name === requirement.componentName);
        if (swc) {
          let port = swc.ports?.find(port => port.name === requirement.portName);
          if (!port) {
            createPort({
              swcId: swc.id,
              ...parsed.port
            });
          }
        }
      }

      toast({
        title: "Requirements Imported",
        description: `${requirements.length} requirements imported successfully`,
      });

      // Clear form
      setRequirements([]);
      setRequirementsText('');
      setSelectedProjectId('');
      setCreateNewProject(false);
      setNewProjectName('');

    } catch (error: any) {
      toast({
        title: "Import Error",
        description: `Failed to import requirements: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const parseRequirement = (requirement: Requirement): ParsedRequirement => {
    const swc: Omit<Swc, 'id'> = {
      name: requirement.componentName,
      description: `Component for ${requirement.description}`,
      category: 'application',
      type: 'atomic',
    };
    
    const interface_: Omit<Interface, 'id'> = {
      name: requirement.interfaceName,
      type: 'SenderReceiver',
      dataElements: [],
    };

    const dataElements: DataElement[] = [
      {
        id: uuidv4(),
        name: requirement.dataElement || 'DefaultDataElement',
        applicationDataTypeRef: requirement.dataType || 'uint32',
        category: 'VALUE',
        description: `Data element for ${requirement.description}`,
      }
    ];

    const port: Omit<Port, 'id'> = {
      name: requirement.portName,
      direction: requirement.portDirection,
      interfaceRef: requirement.interfaceName,
    };

    return { swc, interface_, dataElements, port };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'application/json' || file.name.endsWith('.json') || file.name.endsWith('.txt'))) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setRequirementsText(content);
      };
      reader.readAsText(file);
      
      toast({
        title: "File Loaded",
        description: `${file.name} has been loaded`,
      });
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a JSON or text file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Requirement Importer</h1>
          <p className="text-muted-foreground mt-1">
            Import requirements from JSON to create SWCs, Interfaces, and Ports
          </p>
        </div>
      </div>

      {/* Project Selection */}
      <Card className="autosar-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Target Project
          </CardTitle>
          <CardDescription>
            Select a project to import requirements into
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentProject ? (
            <div className="p-4 bg-primary/10 rounded-lg">
              <h3 className="font-medium text-primary">Current Project: {currentProject.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Requirements will be imported into this project
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
                        {project.name} - {project.autosarVersion}
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
      <Card className="autosar-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Requirements File
          </CardTitle>
          <CardDescription>
            Upload a JSON file containing your requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="file"
            accept=".json,.txt"
            onChange={handleFileUpload}
            className="mb-4"
          />
        </CardContent>
      </Card>

      {/* Manual Input */}
      <Card className="autosar-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Requirements JSON
          </CardTitle>
          <CardDescription>
            Paste or edit your requirements JSON here
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder={sampleRequirements}
            value={requirementsText}
            onChange={(e) => setRequirementsText(e.target.value)}
            rows={12}
            className="font-mono text-sm"
          />
          <div className="flex gap-2">
            <Button onClick={parseRequirements} disabled={isParsing} className="autosar-button">
              {isParsing ? "Parsing..." : "Parse Requirements"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setRequirementsText(sampleRequirements)}
            >
              Load Sample
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Parsed Requirements */}
      {requirements.length > 0 && (
        <Card className="autosar-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDown className="h-5 w-5" />
              Parsed Requirements ({requirements.length})
            </CardTitle>
            <CardDescription>
              Review the parsed requirements before importing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-96 overflow-y-auto space-y-3">
              {requirements.map((req, index) => (
                <div key={index} className="border rounded-md p-4 space-y-2 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{req.id}</p>
                    <span className={`px-2 py-1 text-xs rounded ${
                      req.portDirection === 'provided' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {req.portDirection}
                    </span>
                  </div>
                  <p className="text-sm">{req.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <strong>Component:</strong> {req.componentName}
                    </div>
                    <div>
                      <strong>Interface:</strong> {req.interfaceName}
                    </div>
                    <div>
                      <strong>Data Element:</strong> {req.dataElement}
                    </div>
                    <div>
                      <strong>Type:</strong> {req.dataType}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={handleImportRequirements} className="autosar-button w-full">
              <Plus className="h-4 w-4 mr-2" />
              Import {requirements.length} Requirements
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RequirementImporter;
