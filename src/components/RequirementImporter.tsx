
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Play,
  Download,
  RefreshCw,
  FileUp,
  Zap
} from "lucide-react";
import { RequirementParser, RequirementDocument } from '@/utils/requirementParser';
import { AutosarGenerator } from '@/utils/autosarGenerator';
import { useAutosarStore } from '@/store/autosarStore';
import { v4 as uuidv4 } from 'uuid';

interface FileProcessingState {
  isProcessing: boolean;
  progress: number;
  currentStep: string;
  error: string | null;
}

interface GenerationPreview {
  swcs: Array<{ name: string; category: string }>;
  interfaces: Array<{ name: string; type: string; dataElements: number }>;
  ports: Array<{ name: string; direction: string; swcName: string }>;
  runnables: Array<{ name: string; period: number; type: string; swcName: string }>;
}

const RequirementImporter = () => {
  const { toast } = useToast();
  const store = useAutosarStore();
  
  // File processing state
  const [files, setFiles] = useState<File[]>([]);
  const [processingState, setProcessingState] = useState<FileProcessingState>({
    isProcessing: false,
    progress: 0,
    currentStep: '',
    error: null
  });
  
  // Requirements and generation state
  const [requirements, setRequirements] = useState<RequirementDocument[]>([]);
  const [generationPreview, setGenerationPreview] = useState<GenerationPreview | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [activeTab, setActiveTab] = useState('upload');

  // Sample data for demonstration
  const sampleRequirements = `ECU EngineControlUnit shall implement EngineController SWC.
EngineController shall execute Main runnable every 10ms.
EngineController shall send ThrottlePosition signal via SenderReceiver interface.
ThrottlePosition signal shall be of type uint16 with range 0-4095.
FuelInjector SWC shall receive FuelCommand signal every 5ms.
FuelCommand interface shall contain FuelAmount (uint32) and InjectionTiming (uint16) data elements.`;

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const validFiles = selectedFiles.filter(file => {
      const extension = file.name.toLowerCase().split('.').pop();
      return ['txt', 'doc', 'docx', 'xls', 'xlsx'].includes(extension || '');
    });

    if (validFiles.length !== selectedFiles.length) {
      toast({
        title: "Invalid File Types",
        description: "Some files were ignored. Only .txt, .doc, .docx, .xls, .xlsx files are supported.",
        variant: "destructive"
      });
    }

    setFiles(validFiles);
    setProcessingState(prev => ({ ...prev, error: null }));
  }, [toast]);

  const processFiles = useCallback(async () => {
    if (files.length === 0 && !manualInput.trim()) {
      toast({
        title: "No Input",
        description: "Please upload files or enter requirements manually.",
        variant: "destructive"
      });
      return;
    }

    if (!store.currentProject) {
      toast({
        title: "No Project",
        description: "Please create or load a project first.",
        variant: "destructive"
      });
      return;
    }

    console.info('🚀 Starting requirement processing...');
    console.info('Store state check:', {
      hasCurrentProject: !!store.currentProject,
      projectId: store.currentProject?.id,
      storeArrays: {
        interfaces: Array.isArray(store.interfaces) ? store.interfaces.length : 'not array',
        swcs: Array.isArray(store.swcs) ? store.swcs.length : 'not array',
        ports: Array.isArray(store.ports) ? store.ports.length : 'not array',
        runnables: Array.isArray(store.runnables) ? store.runnables.length : 'not array',
        accessPoints: Array.isArray(store.accessPoints) ? store.accessPoints.length : 'not array'
      }
    });

    setProcessingState({
      isProcessing: true,
      progress: 0,
      currentStep: 'Initializing...',
      error: null
    });

    try {
      // Step 1: Parse files
      setProcessingState(prev => ({ ...prev, progress: 20, currentStep: 'Reading files...' }));
      let allRequirements: RequirementDocument[] = [];

      if (files.length > 0) {
        console.info('Processing', files.length, 'files...');
        for (const file of files) {
          console.info('Parsing file:', file.name);
          const parsed = await RequirementParser.parseFile(file);
          console.info('Parsed', parsed.length, 'requirements from', file.name);
          allRequirements.push(...parsed);
        }
      }

      // Step 2: Parse manual input
      if (manualInput.trim()) {
        setProcessingState(prev => ({ ...prev, progress: 40, currentStep: 'Parsing manual input...' }));
        console.info('Parsing manual input...');
        const manualParsed = RequirementParser.parseText(manualInput);
        console.info('Parsed', manualParsed.length, 'requirements from manual input');
        allRequirements.push(...manualParsed);
      }

      console.info('Total requirements parsed:', allRequirements.length);

      if (allRequirements.length === 0) {
        throw new Error('No requirements were successfully parsed from the input');
      }

      // Step 3: Generate artifacts
      setProcessingState(prev => ({ ...prev, progress: 60, currentStep: 'Generating AUTOSAR artifacts...' }));
      console.info('Generating AUTOSAR artifacts...');
      const artifacts = AutosarGenerator.generateArtifacts(allRequirements);
      console.info('Generated artifacts:', {
        swcs: artifacts.swcs.length,
        interfaces: artifacts.interfaces.length,
        ports: artifacts.ports.length,
        runnables: artifacts.runnables.length,
        accessPoints: artifacts.accessPoints.length
      });
      
      // Step 4: Integrate artifacts
      setProcessingState(prev => ({ ...prev, progress: 80, currentStep: 'Integrating into project...' }));
      console.info('Integrating artifacts into store...');
      AutosarGenerator.integrateArtifactsIntoStore(artifacts, store);

      // Step 5: Create preview
      setProcessingState(prev => ({ ...prev, progress: 90, currentStep: 'Creating preview...' }));
      
      const preview: GenerationPreview = {
        swcs: artifacts.swcs.map(swc => ({ name: swc.name, category: swc.category })),
        interfaces: artifacts.interfaces.map(iface => ({ 
          name: iface.name, 
          type: iface.type, 
          dataElements: iface.dataElements.length 
        })),
        ports: artifacts.ports.map(port => {
          const swc = artifacts.swcs.find(s => s.id === port.swcRef);
          return { 
            name: port.name, 
            direction: port.direction, 
            swcName: swc?.name || 'Unknown SWC'
          };
        }),
        runnables: artifacts.runnables.map(runnable => {
          const swc = artifacts.swcs.find(s => s.id === runnable.swcRef);
          return { 
            name: runnable.name, 
            period: runnable.period || 0, 
            type: runnable.runnableType, 
            swcName: swc?.name || 'Unknown SWC'
          };
        })
      };

      // Step 6: Force GUI refresh
      setProcessingState(prev => ({ ...prev, progress: 100, currentStep: 'Complete!' }));
      
      // Force a complete refresh of all data using custom event
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('autosar-refresh'));
      }, 100);

      setRequirements(allRequirements);
      setGenerationPreview(preview);
      setActiveTab('preview');

      toast({
        title: "Processing Complete",
        description: `Successfully processed ${allRequirements.length} requirements and generated ${artifacts.swcs.length} SWCs with ${artifacts.runnables.length} runnables and ${artifacts.accessPoints.length} access points.`
      });
      
    } catch (error) {
      console.error('Processing error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      setProcessingState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isProcessing: false
      }));
      
      toast({
        title: "Processing Failed",
        description: `Failed to process requirements: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      if (!processingState.error) {
        setProcessingState(prev => ({ ...prev, isProcessing: false }));
      }
    }
  }, [files, manualInput, toast, store, processingState.error]);

  const loadSampleData = useCallback(() => {
    setManualInput(sampleRequirements);
    setActiveTab('manual');
  }, []);

  const resetAll = useCallback(() => {
    setFiles([]);
    setRequirements([]);
    setGenerationPreview(null);
    setManualInput('');
    setProcessingState({
      isProcessing: false,
      progress: 0,
      currentStep: '',
      error: null
    });
    setActiveTab('upload');
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Requirement Importer</h1>
          <p className="text-muted-foreground mt-1">
            Import and parse requirements to automatically generate AUTOSAR artifacts with GUI synchronization
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSampleData}>
            <FileText className="h-4 w-4 mr-2" />
            Load Sample
          </Button>
          <Button variant="outline" onClick={resetAll}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">File Upload</TabsTrigger>
          <TabsTrigger value="manual">Manual Input</TabsTrigger>
          <TabsTrigger value="preview">Preview & Results</TabsTrigger>
        </TabsList>

        {/* File Upload Tab */}
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Requirement Files
              </CardTitle>
              <CardDescription>
                Supported formats: .txt, .doc, .docx, .xls, .xlsx
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <FileUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Drop files here or click to browse</h3>
                  <p className="text-sm text-muted-foreground">
                    Select one or more requirement files to process
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept=".txt,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileUpload}
                  className="mt-4 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                />
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Selected Files:</h4>
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{file.name}</span>
                      <Badge variant="secondary">{(file.size / 1024).toFixed(1)} KB</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Input Tab */}
        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Manual Requirement Input
              </CardTitle>
              <CardDescription>
                Enter requirements in natural language, one per line
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter your requirements here, for example:&#10;ECU shall implement EngineController SWC.&#10;EngineController shall execute Main runnable every 10ms.&#10;EngineController shall send ThrottlePosition signal..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview & Results Tab */}
        <TabsContent value="preview" className="space-y-4">
          {!generationPreview ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No results available. Please process requirements first.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SWCs Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Software Components</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {generationPreview.swcs.map((swc, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="font-medium">{swc.name}</span>
                        <Badge variant="outline">{swc.category}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Interfaces Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Port Interfaces</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {generationPreview.interfaces.map((iface, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <span className="font-medium">{iface.name}</span>
                          <p className="text-xs text-muted-foreground">{iface.type}</p>
                        </div>
                        <Badge variant="secondary">{iface.dataElements} elements</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Ports Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {generationPreview.ports.map((port, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <span className="font-medium">{port.name}</span>
                          <p className="text-xs text-muted-foreground">{port.swcName}</p>
                        </div>
                        <Badge variant={port.direction === 'provided' ? 'default' : 'secondary'}>
                          {port.direction === 'provided' ? 'P-Port' : 'R-Port'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Runnables Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Runnables</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {generationPreview.runnables.map((runnable, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <span className="font-medium">{runnable.name}</span>
                          <p className="text-xs text-muted-foreground">{runnable.swcName}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{runnable.type}</Badge>
                          {runnable.period > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">{runnable.period}ms</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Processing Status */}
      {processingState.isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{processingState.currentStep}</span>
                <span className="text-sm text-muted-foreground">{processingState.progress}%</span>
              </div>
              <Progress value={processingState.progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {processingState.error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Processing Error:</span>
            </div>
            <p className="mt-2 text-sm">{processingState.error}</p>
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      <div className="flex justify-center">
        <Button 
          onClick={processFiles} 
          disabled={processingState.isProcessing || (files.length === 0 && !manualInput.trim()) || !store.currentProject}
          size="lg"
        >
          <Play className="h-4 w-4 mr-2" />
          Process Requirements & Generate Artifacts
        </Button>
      </div>
    </div>
  );
};

export default RequirementImporter;
