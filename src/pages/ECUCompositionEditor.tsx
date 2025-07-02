
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  Plus, 
  Cpu, 
  Trash2,
  Edit,
  Download,
  Link,
  Unlink
} from "lucide-react";
import { useAutosarStore } from "@/store/autosarStore";
import { ECUComposition, SWCInstance } from "@/store/autosarStore";

const ECUCompositionEditor = () => {
  const { toast } = useToast();
  const { 
    currentProject, 
    createECUComposition, 
    deleteECUComposition,
    addSWCInstance,
    removeSWCInstance 
  } = useAutosarStore();
  
  const [selectedComposition, setSelectedComposition] = useState<ECUComposition | null>(null);

  // Auto-select first composition if available
  useEffect(() => {
    if (currentProject?.ecuCompositions && currentProject.ecuCompositions.length > 0 && !selectedComposition) {
      setSelectedComposition(currentProject.ecuCompositions[0]);
    }
  }, [currentProject?.ecuCompositions, selectedComposition]);

  const handleCreateComposition = () => {
    const compositionName = `ECU_${Date.now()}`;
    createECUComposition({
      name: compositionName,
      description: "Manually created ECU Composition",
      ecuType: "ApplicationECU",
      autosarVersion: "4.2.2"
    });
    
    toast({
      title: "ECU Composition Created",
      description: `Created new ECU composition: ${compositionName}`,
    });
  };

  const handleDeleteComposition = (compositionId: string) => {
    deleteECUComposition(compositionId);
    setSelectedComposition(null);
    toast({
      title: "ECU Composition Deleted",
      description: "ECU composition has been deleted successfully",
    });
  };

  const handleAddSWCInstance = (swcId: string) => {
    if (!selectedComposition) return;
    
    const swc = currentProject?.swcs.find(s => s.id === swcId);
    if (!swc) return;
    
    const instanceName = `${swc.name}_Instance_${Date.now()}`;
    
    addSWCInstance(selectedComposition.id, {
      name: instanceName,
      swcRef: swcId,
      instanceName: instanceName,
      ecuCompositionId: selectedComposition.id
    });
    
    toast({
      title: "SWC Instance Added",
      description: `Added ${swc.name} to ECU composition`,
    });
  };

  const handleRemoveSWCInstance = (instanceId: string) => {
    if (!selectedComposition) return;
    
    removeSWCInstance(selectedComposition.id, instanceId);
    toast({
      title: "SWC Instance Removed",
      description: "SWC instance has been removed from composition",
    });
  };

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No project loaded. Please create or load a project first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ECU Composition Editor</h1>
          <p className="text-muted-foreground mt-1">
            Manage ECU compositions and SWC instances
          </p>
        </div>
        <Button onClick={handleCreateComposition} className="autosar-button">
          <Plus className="h-4 w-4 mr-2" />
          Create ECU Composition
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ECU Compositions List */}
        <Card className="autosar-card">
          <CardHeader>
            <CardTitle>ECU Compositions</CardTitle>
            <CardDescription>
              Available ECU compositions in the project
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentProject.ecuCompositions && currentProject.ecuCompositions.length > 0 ? (
              <div className="space-y-3">
                {currentProject.ecuCompositions.map((composition) => (
                  <div 
                    key={composition.id} 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedComposition?.id === composition.id ? 'bg-muted/50 border-primary' : 'hover:bg-muted/30'
                    }`}
                    onClick={() => setSelectedComposition(composition)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Cpu className="h-4 w-4" />
                          <h3 className="font-medium">{composition.name}</h3>
                          <Badge variant="outline">{composition.ecuType}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {composition.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>SWC Instances: {composition.swcInstances?.length || 0}</span>
                          <span>Connectors: {composition.connectors?.length || 0}</span>
                          <span>AUTOSAR: {composition.autosarVersion}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteComposition(composition.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Cpu className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No ECU compositions found</p>
                <p className="text-sm">Create a new ECU composition to get started</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Composition Details */}
        <Card className="autosar-card">
          <CardHeader>
            <CardTitle>
              {selectedComposition ? `${selectedComposition.name} - Details` : 'Select Composition'}
            </CardTitle>
            <CardDescription>
              {selectedComposition ? 'Manage SWC instances and connections' : 'Select a composition to view details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedComposition ? (
              <div className="space-y-6">
                {/* SWC Instances */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">SWC Instances</h4>
                    <div className="flex gap-2">
                      <select 
                        className="text-sm border rounded px-2 py-1"
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddSWCInstance(e.target.value);
                            e.target.value = '';
                          }
                        }}
                      >
                        <option value="">Add SWC Instance...</option>
                        {currentProject.swcs
                          .filter(swc => !selectedComposition.swcInstances?.find(inst => inst.swcRef === swc.id))
                          .map(swc => (
                            <option key={swc.id} value={swc.id}>{swc.name}</option>
                          ))
                        }
                      </select>
                    </div>
                  </div>
                  
                  {selectedComposition.swcInstances && selectedComposition.swcInstances.length > 0 ? (
                    <div className="space-y-2">
                      {selectedComposition.swcInstances.map((instance) => {
                        const swc = currentProject.swcs.find(s => s.id === instance.swcRef);
                        return (
                          <div key={instance.id} className="flex items-center justify-between p-3 bg-muted rounded">
                            <div>
                              <span className="font-medium">{instance.name}</span>
                              <p className="text-sm text-muted-foreground">
                                Type: {swc?.name || 'Unknown'} ({swc?.category || 'Unknown'})
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleRemoveSWCInstance(instance.id)}
                              >
                                <Unlink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">No SWC instances in this composition</p>
                    </div>
                  )}
                </div>

                {/* Connectors */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">ECU Connectors</h4>
                    <Button variant="outline" size="sm">
                      <Link className="h-4 w-4 mr-2" />
                      Add Connector
                    </Button>
                  </div>
                  
                  {selectedComposition.connectors && selectedComposition.connectors.length > 0 ? (
                    <div className="space-y-2">
                      {selectedComposition.connectors.map((connector) => (
                        <div key={connector.id} className="flex items-center justify-between p-3 bg-muted rounded">
                          <div>
                            <span className="font-medium">{connector.name}</span>
                            <p className="text-sm text-muted-foreground">
                              Connection between SWC instances
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">No connectors defined</p>
                    </div>
                  )}
                </div>

                {/* Export Options */}
                <div className="pt-4 border-t">
                  <Button className="w-full" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Composition ARXML
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Select an ECU composition to view its details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ECUCompositionEditor;
