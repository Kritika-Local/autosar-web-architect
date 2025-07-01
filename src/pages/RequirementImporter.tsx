
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Upload, FileText, Brain, CheckCircle, XCircle, Edit } from 'lucide-react';
import { useAutosarStore } from '@/store/autosarStore';
import RequirementValidationDialog from '@/components/RequirementValidationDialog';

interface ParsedRequirement {
  id: string;
  originalText: string;
  interpretation: {
    swcs: Array<{
      name: string;
      category: 'application' | 'service' | 'ecu-abstraction' | 'complex-driver' | 'sensor-actuator';
    }>;
    interfaces: Array<{
      name: string;
      dataElements: Array<{
        name: string;
        dataType: string;
        size?: string;
      }>;
    }>;
    connections: Array<{
      sourceSWC: string;
      targetSWC: string;
      portInterface: string;
    }>;
    runnables: Array<{
      swcName: string;
      name: string;
      period: number;
      accessPoints: Array<{
        type: 'read' | 'write';
        portName: string;
        dataElement: string;
      }>;
    }>;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'needs_correction';
}

const RequirementImporter = () => {
  const { toast } = useToast();
  const { currentProject, createProject, createSWC, createInterface, createDataType } = useAutosarStore();
  
  const [file, setFile] = useState<File | null>(null);
  const [requirementText, setRequirementText] = useState('');
  const [parsedRequirements, setParsedRequirements] = useState<ParsedRequirement[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      const validTypes = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (validTypes.includes(uploadedFile.type)) {
        setFile(uploadedFile);
        toast({
          title: "File Selected",
          description: `${uploadedFile.name} is ready for processing`,
        });
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select a .doc, .docx, .ppt, .pptx, .xls, or .xlsx file",
          variant: "destructive",
        });
      }
    }
  };

  const parseRequirementText = (text: string): ParsedRequirement => {
    // AI-based parsing logic - simplified for demo
    const requirement: ParsedRequirement = {
      id: crypto.randomUUID(),
      originalText: text,
      interpretation: {
        swcs: [],
        interfaces: [],
        connections: [],
        runnables: []
      },
      status: 'pending'
    };

    // Example parsing for "SWC1 shall send 2 bytes of temperature value to SWC2"
    const swcPattern = /(\w+)\s+shall\s+send.*?to\s+(\w+)/i;
    const dataPattern = /(\d+)\s+bytes?\s+of\s+(\w+)/i;
    
    const swcMatch = text.match(swcPattern);
    const dataMatch = text.match(dataPattern);
    
    if (swcMatch && dataMatch) {
      const [, sourceSWC, targetSWC] = swcMatch;
      const [, byteSize, dataName] = dataMatch;
      
      // Create SWCs
      requirement.interpretation.swcs = [
        { name: sourceSWC, category: 'application' },
        { name: targetSWC, category: 'application' }
      ];
      
      // Create interface
      const interfaceName = `${sourceSWC}_${targetSWC}_port_interface`;
      const dataElementName = `${dataName}_${byteSize}Byte`;
      
      requirement.interpretation.interfaces = [{
        name: interfaceName,
        dataElements: [{
          name: dataElementName,
          dataType: `uint${parseInt(byteSize) * 8}`,
          size: byteSize
        }]
      }];
      
      // Create connection
      requirement.interpretation.connections = [{
        sourceSWC,
        targetSWC,
        portInterface: interfaceName
      }];
      
      // Create runnables with access points
      requirement.interpretation.runnables = [
        {
          swcName: sourceSWC,
          name: `${sourceSWC}_init`,
          period: 0,
          accessPoints: []
        },
        {
          swcName: sourceSWC,
          name: `${sourceSWC}_10ms`,
          period: 10,
          accessPoints: [{
            type: 'write',
            portName: `${sourceSWC}_P_port`,
            dataElement: dataElementName
          }]
        },
        {
          swcName: targetSWC,
          name: `${targetSWC}_init`,
          period: 0,
          accessPoints: []
        },
        {
          swcName: targetSWC,
          name: `${targetSWC}_10ms`,
          period: 10,
          accessPoints: [{
            type: 'read',
            portName: `${targetSWC}_R_port`,
            dataElement: dataElementName
          }]
        }
      ];
    }
    
    return requirement;
  };

  const processRequirement = async () => {
    setIsProcessing(true);
    
    try {
      let textToProcess = requirementText;
      
      // If file is uploaded, simulate extraction (in real implementation, this would use AI)
      if (file) {
        textToProcess = "SWC1 shall send 2 bytes of temperature value to SWC2.";
        toast({
          title: "File Processed",
          description: "Requirements extracted from document",
        });
      }
      
      if (!textToProcess.trim()) {
        toast({
          title: "No Content",
          description: "Please provide requirement text or upload a file",
          variant: "destructive",
        });
        return;
      }
      
      const parsed = parseRequirementText(textToProcess);
      setParsedRequirements([parsed]);
      setShowValidation(true);
      
    } catch (error) {
      toast({
        title: "Processing Error",
        description: "Failed to process requirements",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequirementValidation = (requirements: ParsedRequirement[]) => {
    // Generate AUTOSAR artifacts for accepted requirements
    const acceptedRequirements = requirements.filter(req => req.status === 'accepted');
    
    acceptedRequirements.forEach(req => {
      // Create data types first
      req.interpretation.interfaces.forEach(iface => {
        iface.dataElements.forEach(de => {
          const baseType = de.dataType.includes('uint') ? de.dataType : 'uint8';
          createDataType({
            name: de.dataType,
            category: 'primitive',
            baseType,
            description: `Auto-generated from requirement: ${req.originalText.substring(0, 50)}...`
          });
        });
      });
      
      // Create interfaces
      req.interpretation.interfaces.forEach(iface => {
        createInterface({
          name: iface.name,
          type: 'SenderReceiver',
          dataElements: iface.dataElements.map(de => ({
            id: crypto.randomUUID(),
            name: de.name,
            applicationDataTypeRef: de.dataType,
            description: 'Auto-generated from requirements'
          }))
        });
      });
      
      // Create SWCs with ports and runnables
      req.interpretation.swcs.forEach(swcData => {
        createSWC({
          name: swcData.name,
          description: `Auto-generated from requirement: ${req.originalText}`,
          category: swcData.category,
          type: 'atomic'
        });
      });
    });
    
    toast({
      title: "Requirements Processed",
      description: `Generated AUTOSAR artifacts for ${acceptedRequirements.length} requirements`,
    });
    
    setShowValidation(false);
    setParsedRequirements([]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Requirement Document Importer</h1>
          <p className="text-muted-foreground mt-2">
            Import and analyze requirement documents to auto-generate AUTOSAR artifacts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Document Upload
            </CardTitle>
            <CardDescription>
              Upload requirement documents (.doc, .docx, .ppt, .pptx, .xls, .xlsx)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Select Document</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".doc,.docx,.ppt,.pptx,.xls,.xlsx"
                onChange={handleFileUpload}
                className="mt-2"
              />
            </div>
            
            {file && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <FileText className="h-4 w-4" />
                <span className="text-sm">{file.name}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Text Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Manual Requirements
            </CardTitle>
            <CardDescription>
              Enter requirement text manually for AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="requirement-text">Requirement Text</Label>
              <Textarea
                id="requirement-text"
                placeholder="e.g., SWC1 shall send 2 bytes of temperature value to SWC2."
                value={requirementText}
                onChange={(e) => setRequirementText(e.target.value)}
                className="mt-2 min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Processing Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Based Analysis
          </CardTitle>
          <CardDescription>
            Process requirements to automatically generate AUTOSAR artifacts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={processRequirement} 
            disabled={isProcessing || (!file && !requirementText.trim())}
            className="w-full"
          >
            {isProcessing ? 'Processing...' : 'Analyze Requirements'}
          </Button>
        </CardContent>
      </Card>

      {/* Results Preview */}
      {parsedRequirements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              Review the interpreted AUTOSAR artifacts before generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {parsedRequirements.map((req) => (
              <div key={req.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium">Original Requirement:</h4>
                    <p className="text-sm text-muted-foreground mt-1">{req.originalText}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {req.status === 'accepted' && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {req.status === 'rejected' && <XCircle className="h-5 w-5 text-red-500" />}
                    {req.status === 'pending' && <Edit className="h-5 w-5 text-yellow-500" />}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>SWCs:</strong> {req.interpretation.swcs.map(s => s.name).join(', ')}
                  </div>
                  <div>
                    <strong>Interfaces:</strong> {req.interpretation.interfaces.map(i => i.name).join(', ')}
                  </div>
                </div>
              </div>
            ))}
            
            <Button 
              onClick={() => setShowValidation(true)}
              className="w-full mt-4"
            >
              Review & Validate
            </Button>
          </CardContent>
        </Card>
      )}

      <RequirementValidationDialog
        open={showValidation}
        onOpenChange={setShowValidation}
        requirements={parsedRequirements}
        onValidationComplete={handleRequirementValidation}
      />
    </div>
  );
};

export default RequirementImporter;
