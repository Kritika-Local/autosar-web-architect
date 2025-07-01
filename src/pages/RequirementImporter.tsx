import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAutosarStore, Swc, Interface, DataElement, Port } from "@/store/autosarStore";
import { v4 as uuidv4 } from 'uuid';
import { Database, FileText, Plus, ArrowDown } from "lucide-react";

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
  const { currentProject, createSWC, createInterface, createPort } = useAutosarStore();
  const [requirementsText, setRequirementsText] = useState('');
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [isParsing, setIsParsing] = useState(false);

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
    if (!currentProject) {
      toast({
        title: "No Project",
        description: "Please create or load a project first",
        variant: "destructive",
      });
      return;
    }

    if (requirements.length === 0) {
      toast({
        title: "No Requirements",
        description: "Please parse requirements first",
        variant: "destructive",
      });
      return;
    }

    try {
      for (const requirement of requirements) {
        const parsed = parseRequirement(requirement);
        
        // Create SWC if it doesn't exist
        let swc = currentProject.swcs.find(swc => swc.name === requirement.componentName);
        if (!swc) {
          createSWC(parsed.swc);
          toast({
            title: "SWC Created",
            description: `SWC ${requirement.componentName} created successfully`,
          });
        }

        // Create Interface if it doesn't exist
        let interface_ = currentProject.interfaces.find(iface => iface.name === requirement.interfaceName);
        if (!interface_) {
          createInterface(parsed.interface_);
          toast({
            title: "Interface Created",
            description: `Interface ${requirement.interfaceName} created successfully`,
          });
        }

        // Create Port if it doesn't exist
        swc = currentProject.swcs.find(swc => swc.name === requirement.componentName);
        if (swc) {
          let port = swc.ports?.find(port => port.name === requirement.portName);
          if (!port) {
            createPort({
              swcId: swc.id,
              ...parsed.port
            });
            toast({
              title: "Port Created",
              description: `Port ${requirement.portName} created successfully`,
            });
          }
        }
      }

      toast({
        title: "Requirements Imported",
        description: `${requirements.length} requirements imported successfully`,
      });
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

  if (!currentProject) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-12">
          <Database className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">No Project Loaded</h2>
          <p className="text-muted-foreground mb-4">
            Please create or load a project to import requirements
          </p>
          <Button onClick={() => window.location.href = '/projects'}>
            Go to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Requirement Importer</h1>
          <p className="text-muted-foreground mt-1">
            Import requirements from a JSON file to create SWCs, Interfaces, and Ports
          </p>
        </div>
      </div>

      <Card className="autosar-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Requirements JSON
          </CardTitle>
          <CardDescription>
            Paste your requirements JSON here
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="[
              {
                &quot;id&quot;: &quot;REQ-1&quot;,
                &quot;description&quot;: &quot;Engine speed shall be measured&quot;,
                &quot;componentName&quot;: &quot;EngineController&quot;,
                &quot;interfaceName&quot;: &quot;EngineSpeedInterface&quot;,
                &quot;dataElement&quot;: &quot;EngineSpeed&quot;,
                &quot;dataType&quot;: &quot;uint16&quot;,
                &quot;portName&quot;: &quot;EngineSpeedPort&quot;,
                &quot;portDirection&quot;: &quot;provided&quot;
              }
            ]"
            value={requirementsText}
            onChange={(e) => setRequirementsText(e.target.value)}
            rows={8}
          />
          <Button onClick={parseRequirements} disabled={isParsing} className="autosar-button">
            {isParsing ? "Parsing..." : "Parse Requirements"}
          </Button>
        </CardContent>
      </Card>

      {requirements.length > 0 && (
        <Card className="autosar-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDown className="h-5 w-5" />
              Parsed Requirements
            </CardTitle>
            <CardDescription>
              Review the parsed requirements before importing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {requirements.map((req, index) => (
              <div key={index} className="border rounded-md p-4 space-y-2">
                <p><strong>ID:</strong> {req.id}</p>
                <p><strong>Description:</strong> {req.description}</p>
                <p><strong>Component:</strong> {req.componentName}</p>
                <p><strong>Interface:</strong> {req.interfaceName}</p>
                <p><strong>Data Element:</strong> {req.dataElement}</p>
                <p><strong>Data Type:</strong> {req.dataType}</p>
                <p><strong>Port:</strong> {req.portName} ({req.portDirection})</p>
              </div>
            ))}
            <Button onClick={handleImportRequirements} className="autosar-button">
              Import Requirements
            </Button>
          </CardContent>
        </Card>
      )}

      {requirements.length === 0 && (
        <Card className="autosar-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Requirement Importer
            </CardTitle>
            <CardDescription>
              Import requirements from a JSON file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No requirements to display</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RequirementImporter;
