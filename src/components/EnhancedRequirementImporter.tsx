import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Settings,
  Zap,
  Network,
  Clock,
  Database,
  Play
} from "lucide-react";
import { useAutosarStore } from "@/store/autosarStore";
import { RequirementParser, RequirementDocument } from "@/utils/requirementParser";
import { AutosarGenerator } from "@/utils/autosarGenerator";

const EnhancedRequirementImporter = () => {
  const { toast } = useToast();
  const store = useAutosarStore();
  
  const [requirements, setRequirements] = useState<RequirementDocument[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("functional");
  const [selectedPriority, setSelectedPriority] = useState<string>("medium");

  const sampleRequirements = [
    {
      id: "REQ_001",
      shortName: "Temperature Sensor Communication",
      description: "The software component sensor_swc shall send a temperature value to the software component EMS_swc using a Sender-Receiver communication model, with a transmission period of 10 milliseconds.",
      category: "functional" as const,
      priority: "high" as const,
      derivedElements: {
        swcs: ["sensor_swc", "EMS_swc"],
        interfaces: ["sensor_EMS_portinterface"],
        signals: ["temperature"],
        ports: ["sensor_ProvidedPort", "EMS_RequiredPort"],
        runnables: ["sensor_swc_init", "sensor_swc_10ms", "EMS_swc_init", "EMS_swc_10ms"]
      },
      communication: {
        interfaceType: "SenderReceiver" as const,
        direction: "sender" as const,
        dataElements: [
          { name: "temperature", type: "uint16", category: "VALUE" }
        ]
      },
      timing: {
        type: "periodic" as const,
        period: 10,
        unit: "ms" as const
      },
      ecuBehavior: {
        ecuName: "MainECU"
      }
    },
    {
      id: "REQ_002", 
      shortName: "Brake Pedal Signal Processing",
      description: "The brake pedal sensor shall transmit brake status to the brake controller every 5ms using client-server interface.",
      category: "safety" as const,
      priority: "critical" as const,
      derivedElements: {
        swcs: ["BrakePedalSensor", "BrakeController"],
        interfaces: ["BrakePedal_Interface"],
        signals: ["brakeStatus"],
        ports: ["BrakePedal_ProvidedPort", "BrakeController_RequiredPort"],
        runnables: ["BrakePedalSensor_init", "BrakePedalSensor_5ms", "BrakeController_init", "BrakeController_5ms"]
      },
      communication: {
        interfaceType: "ClientServer" as const,
        direction: "receiver" as const,
        dataElements: [
          { name: "brakeStatus", type: "boolean", category: "VALUE" }
        ]
      },
      timing: {
        type: "periodic" as const,
        period: 5,
        unit: "ms" as const
      },
      ecuBehavior: {
        ecuName: "BrakeECU"
      }
    },
    {
      id: "REQ_003",
      shortName: "Engine RPM Monitoring", 
      description: "The engine speed sensor shall provide RPM data to multiple ECUs including transmission and dashboard display components.",
      category: "diagnostic" as const,
      priority: "medium" as const,
      derivedElements: {
        swcs: ["EngineSpeedSensor", "TransmissionController"],
        interfaces: ["EngineRPM_Interface"],
        signals: ["engineRPM"],
        ports: ["EngineSpeed_ProvidedPort", "Transmission_RequiredPort"],
        runnables: ["EngineSpeedSensor_init", "EngineSpeedSensor_20ms", "TransmissionController_init", "TransmissionController_20ms"]
      },
      timing: {
        type: "periodic" as const,
        period: 20,
        unit: "ms" as const
      },
      communication: {
        interfaceType: "SenderReceiver" as const,
        direction: "both" as const,
        dataElements: [
          { name: "engineRPM", type: "uint16", category: "VALUE" }
        ]
      },
      ecuBehavior: {
        ecuName: "EngineECU"
      }
    }
  ];

  const handleTextProcessing = async () => {
    if (!textInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter requirement text to process",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Parse the text input into requirement documents - parseText returns an array
      const parsedRequirements = RequirementParser.parseText(textInput);

      console.log('Parsed requirements:', parsedRequirements);

      if (parsedRequirements.length === 0) {
        toast({
          title: "No Requirements Found",
          description: "Could not parse any requirements from the input text",
          variant: "destructive",
        });
        return;
      }

      // Update the parsed requirements with selected category and priority
      const updatedRequirements = parsedRequirements.map(req => ({
        ...req,
        category: selectedCategory.toUpperCase() as RequirementDocument['category'],
        priority: selectedPriority.toUpperCase() as RequirementDocument['priority']
      }));

      // Generate AUTOSAR artifacts
      const artifacts = AutosarGenerator.generateArtifacts(updatedRequirements);
      
      console.log('Generated artifacts:', artifacts);

      // Integrate artifacts into the store
      AutosarGenerator.integrateArtifactsIntoStore(artifacts, store);

      // Update requirements state
      setRequirements(updatedRequirements);

      toast({
        title: "Requirements Processed",
        description: `Successfully processed ${updatedRequirements.length} requirement(s) and generated ${artifacts.swcs.length} SWCs with ${artifacts.runnables.length} runnables`,
      });

      // Clear input
      setTextInput("");
      
    } catch (error) {
      console.error('Error processing requirements:', error);
      toast({
        title: "Processing Failed",
        description: "Failed to process requirements. Please check the input format.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSampleLoad = async (sampleReq: RequirementDocument) => {
    setIsProcessing(true);
    try {
      console.log('Loading sample requirement:', sampleReq);

      // Generate AUTOSAR artifacts from sample
      const artifacts = AutosarGenerator.generateArtifacts([sampleReq]);
      
      console.log('Generated artifacts from sample:', artifacts);

      // Integrate artifacts into the store
      AutosarGenerator.integrateArtifactsIntoStore(artifacts, store);

      // Update requirements state
      setRequirements([sampleReq]);

      toast({
        title: "Sample Loaded",
        description: `Successfully loaded sample and generated ${artifacts.swcs.length} SWCs with ${artifacts.runnables.length} runnables`,
      });
      
    } catch (error) {
      console.error('Error loading sample:', error);
      toast({
        title: "Loading Failed",
        description: "Failed to load sample requirement.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const parsedRequirements = await RequirementParser.parseFile(file);
      
      if (parsedRequirements.length === 0) {
        toast({
          title: "No Requirements Found",
          description: "The uploaded file doesn't contain any recognizable requirements.",
          variant: "destructive",
        });
        return;
      }

      // Generate AUTOSAR artifacts
      const artifacts = AutosarGenerator.generateArtifacts(parsedRequirements);
      
      console.log('Generated artifacts from file:', artifacts);

      // Integrate artifacts into the store
      AutosarGenerator.integrateArtifactsIntoStore(artifacts, store);

      setRequirements(parsedRequirements);

      toast({
        title: "File Processed",
        description: `Successfully processed ${parsedRequirements.length} requirements and generated ${artifacts.swcs.length} SWCs`,
      });
      
    } catch (error) {
      console.error('File processing error:', error);
      toast({
        title: "Processing Failed",
        description: "Failed to process the uploaded file. Please check the format.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      // Reset file input
      event.target.value = '';
    }
  };

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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Enhanced Requirement Importer</h1>
          <p className="text-muted-foreground mt-1">
            Import and automatically generate AUTOSAR artifacts from requirements
          </p>
        </div>
      </div>

      {/* Text Input Section */}
      <Card className="autosar-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Text Input Processing
          </CardTitle>
          <CardDescription>
            Enter requirement text and let AI parse it into AUTOSAR components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="functional">Functional</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="diagnostic">Diagnostic</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="text-input">Requirement Description</Label>
              <Textarea
                id="text-input"
                placeholder="Enter your requirement here (e.g., 'The sensor_swc shall send temperature to EMS_swc every 10ms')"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <Button 
              onClick={handleTextProcessing} 
              disabled={isProcessing}
              className="autosar-button"
            >
              {isProcessing ? "Processing..." : "Process Requirement"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Upload Section */}
      <Card className="autosar-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            File Upload
          </CardTitle>
          <CardDescription>
            Upload Word documents, Excel files, or plain text files containing requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".docx,.xlsx,.txt,.csv"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              disabled={isProcessing}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 autosar-gradient rounded-full flex items-center justify-center">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-lg font-medium">
                    {isProcessing ? "Processing..." : "Drop files here or click to browse"}
                  </p>
                  <p className="text-muted-foreground">
                    Supports .docx, .xlsx, .txt, .csv files
                  </p>
                </div>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Sample Requirements */}
      <Card className="autosar-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Sample Requirements
          </CardTitle>
          <CardDescription>
            Try these pre-configured examples to see the tool in action
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {sampleRequirements.map((req, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium">{req.shortName}</h3>
                    <Badge variant="outline" className="mt-1 mr-2 capitalize">
                      {req.category}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {req.priority}
                    </Badge>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSampleLoad(req)}
                    disabled={isProcessing}
                  >
                    Load Sample
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {req.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Settings className="h-3 w-3" />
                    {req.derivedElements.swcs.length} SWCs
                  </span>
                  <span className="flex items-center gap-1">
                    <Network className="h-3 w-3" />
                    {req.derivedElements.interfaces.length} Interfaces
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {req.derivedElements.runnables?.length || 0} Runnables
                  </span>
                  {req.timing && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {req.timing.period}{req.timing.unit}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {requirements.length > 0 && (
        <Card className="autosar-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Processing Results
            </CardTitle>
            <CardDescription>
              Successfully processed requirements and generated AUTOSAR artifacts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requirements.map((req, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{req.shortName}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{req.id}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="capitalize">
                        {req.category}
                      </Badge>
                      <Badge variant="secondary" className="capitalize">
                        {req.priority}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm mb-4">{req.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground">SWCs</p>
                      <p>{req.derivedElements.swcs.join(", ")}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Interfaces</p>
                      <p>{req.derivedElements.interfaces.join(", ")}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Signals</p>
                      <p>{req.derivedElements.signals.join(", ")}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Timing</p>
                      <p>
                        {req.timing ? 
                          `${req.timing.period}${req.timing.unit} (${req.timing.type})` : 
                          "Not specified"
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedRequirementImporter;
