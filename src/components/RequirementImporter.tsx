
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAutosarStore } from "@/store/autosarStore";
import { RequirementParser, RequirementDocument } from "@/utils/requirementParser";
import { AutosarGenerator } from "@/utils/autosarGenerator";
import { FileText, Upload, Wand2, CheckCircle, AlertCircle, Database } from "lucide-react";

const RequirementImporter = () => {
  const { toast } = useToast();
  const { currentProject, createProject, createSWC, createInterface, createPort, createRunnable, addAccessPoint } = useAutosarStore();
  
  const [requirements, setRequirements] = useState<RequirementDocument[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    setProcessingProgress(25);

    try {
      setProcessingStep('Parsing requirements...');
      setProcessingProgress(50);
      
      const parsedRequirements = await RequirementParser.parseFile(file);
      
      setProcessingStep('Analyzing natural language...');
      setProcessingProgress(75);
      
      setProcessingStep('Complete!');
      setProcessingProgress(100);
      
      setRequirements(parsedRequirements);
      setShowPreview(true);

      toast({
        title: "File Processed Successfully",
        description: `${parsedRequirements.length} requirements extracted and analyzed`,
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
  };

  const loadSampleData = () => {
    const sampleRequirements: RequirementDocument[] = [
      {
        id: "REQ-001",
        shortName: "Engine_Speed_Control_10ms",
        description: "The Engine Controller shall read engine speed data every 10ms from the sensor interface and provide the processed speed information to other ECUs via CAN communication using uint16 data type.",
        category: "FUNCTIONAL",
        priority: "HIGH",
        source: "SAMPLE",
        derivedElements: {
          swcs: ["EngineController"],
          interfaces: ["EngineSpeedInterface", "CanCommunicationInterface"],
          ports: ["SpeedSensorInputPort", "CanOutputPort"],
          runnables: ["Engine_Init", "Engine_10ms"]
        },
        timing: {
          period: 10,
          unit: "ms",
          type: "periodic"
        },
        communication: {
          direction: "both",
          interfaceType: "SenderReceiver",
          dataElements: [
            { name: "EngineSpeed", type: "uint16" },
            { name: "SpeedStatus", type: "uint8" }
          ]
        }
      },
      {
        id: "REQ-002", 
        shortName: "Brake_System_Event_Handler",
        description: "The Brake System Controller must receive brake pressure signals from hydraulic sensors and trigger emergency brake response when pressure exceeds 150 bar threshold. The system shall send brake status to vehicle controller.",
        category: "INTERFACE",
        priority: "HIGH",
        source: "SAMPLE",
        derivedElements: {
          swcs: ["BrakeSystemController"],
          interfaces: ["BrakePressureInterface", "VehicleStatusInterface"],
          ports: ["PressureInputPort", "StatusOutputPort"],
          runnables: ["BrakeSystem_Init", "BrakeSystem_Event"]
        },
        timing: {
          type: "event"
        },
        communication: {
          direction: "both",
          interfaceType: "SenderReceiver",
          dataElements: [
            { name: "BrakePressure", type: "uint16" },
            { name: "EmergencyFlag", type: "boolean" },
            { name: "BrakeStatus", type: "uint8" }
          ]
        }
      }
    ];

    setRequirements(sampleRequirements);
    setShowPreview(true);

    toast({
      title: "Sample Data Loaded",
      description: `${sampleRequirements.length} sample requirements loaded for demonstration`,
    });
  };

  const generateArtifacts = async () => {
    if (requirements.length === 0) {
      toast({
        title: "No Requirements",
        description: "Please import requirements first or load sample data",
        variant: "destructive",
      });
      return;
    }

    if (!currentProject) {
      toast({
        title: "No Project Selected",
        description: "Please create or select a project first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingStep('Generating AUTOSAR artifacts...');
      setProcessingProgress(10);

      const artifacts = AutosarGenerator.generateArtifacts(requirements);

      setProcessingStep('Creating SWCs...');
      setProcessingProgress(30);

      // Create SWCs
      for (const swc of artifacts.swcs) {
        createSWC(swc);
      }

      setProcessingStep('Creating interfaces...');
      setProcessingProgress(50);

      // Create Interfaces
      for (const iface of artifacts.interfaces) {
        createInterface(iface);
      }

      setProcessingStep('Creating ports and runnables...');
      setProcessingProgress(70);

      // Get updated project state
      const updatedProject = currentProject;

      // Create Ports
      for (const port of artifacts.ports) {
        const swc = updatedProject.swcs.find(s => s.name === port.swcName);
        if (swc) {
          createPort({ swcId: swc.id, ...port });
        }
      }

      // Create Runnables
      for (const runnable of artifacts.runnables) {
        const swc = updatedProject.swcs.find(s => s.name === runnable.swcName);
        if (swc) {
          createRunnable({ swcId: swc.id, ...runnable });
        }
      }

      setProcessingStep('Creating access points...');
      setProcessingProgress(90);

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

      setProcessingStep('Complete!');
      setProcessingProgress(100);

      toast({
        title: "AUTOSAR Artifacts Generated",
        description: `Successfully created ${artifacts.swcs.length} SWCs, ${artifacts.interfaces.length} interfaces, ${artifacts.ports.length} ports, and ${artifacts.runnables.length} runnables`,
      });

      // Reset state
      setRequirements([]);
      setShowPreview(false);

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
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Requirement Importer</h1>
          <p className="text-muted-foreground mt-1">
            Import requirements and automatically generate AUTOSAR 4.2.2 compliant artifacts
          </p>
        </div>
        <Button variant="outline" onClick={loadSampleData} disabled={isProcessing}>
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

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Requirements Document
          </CardTitle>
          <CardDescription>
            Supported formats: .txt, .doc, .docx, .xls, .xlsx | Advanced natural language processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="file"
            accept=".txt,.doc,.docx,.xls,.xlsx"
            onChange={handleFileUpload}
            disabled={isProcessing}
          />
        </CardContent>
      </Card>

      {/* Requirements Preview */}
      {showPreview && requirements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Parsed Requirements ({requirements.length})
            </CardTitle>
            <CardDescription>
              Review extracted requirements and their derived AUTOSAR elements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {requirements.map((req) => (
                <div key={req.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold">{req.shortName}</h3>
                      <p className="text-sm font-mono text-muted-foreground">{req.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <Badge variant="secondary">{req.category}</Badge>
                      <Badge variant="outline">{req.priority}</Badge>
                      {req.timing && (
                        <Badge variant="outline">
                          {req.timing.type === 'periodic' ? `${req.timing.period}${req.timing.unit}` : req.timing.type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm">{req.description}</p>
                  
                  {/* Derived Elements */}
                  <div className="pt-2 border-t space-y-2">
                    {req.derivedElements.swcs.length > 0 && (
                      <div className="text-xs">
                        <span className="font-medium text-blue-600">SWCs:</span> {req.derivedElements.swcs.join(', ')}
                      </div>
                    )}
                    {req.derivedElements.interfaces.length > 0 && (
                      <div className="text-xs">
                        <span className="font-medium text-green-600">Interfaces:</span> {req.derivedElements.interfaces.join(', ')}
                      </div>
                    )}
                    {req.communication?.dataElements && req.communication.dataElements.length > 0 && (
                      <div className="text-xs">
                        <span className="font-medium text-purple-600">Data Elements:</span>{' '}
                        {req.communication.dataElements.map(de => `${de.name}(${de.type})`).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button 
                onClick={generateArtifacts} 
                disabled={isProcessing || !currentProject}
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

export default RequirementImporter;
