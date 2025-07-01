
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Trash2, 
  Settings,
  Box,
  ArrowRight,
  Save
} from "lucide-react";
import { useAutosarStore } from "@/store/autosarStore";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

const ECUCompositionEditor = () => {
  const { toast } = useToast();
  const { 
    currentProject,
    createECUComposition,
    updateECUComposition,
    deleteECUComposition,
    addSWCInstance,
    removeSWCInstance,
    addECUConnector,
    removeECUConnector,
    saveProject
  } = useAutosarStore();
  
  const [selectedComposition, setSelectedComposition] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isInstanceDialogOpen, setIsInstanceDialogOpen] = useState(false);
  const [isConnectorDialogOpen, setIsConnectorDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, name: string, type: 'composition' | 'instance' | 'connector'} | null>(null);
  
  // Form states
  const [compositionName, setCompositionName] = useState("");
  const [compositionDescription, setCompositionDescription] = useState("");
  const [ecuType, setEcuType] = useState("ECU");
  
  // Instance form states
  const [instanceName, setInstanceName] = useState("");
  const [selectedSWC, setSelectedSWC] = useState("");
  
  // Connector form states
  const [connectorName, setConnectorName] = useState("");
  const [sourceInstance, setSourceInstance] = useState("");
  const [sourcePort, setSourcePort] = useState("");
  const [targetInstance, setTargetInstance] = useState("");
  const [targetPort, setTargetPort] = useState("");

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No project loaded. Please create or load a project first.</p>
      </div>
    );
  }

  const currentComposition = currentProject.ecuCompositions.find(c => c.id === selectedComposition);
  
  const handleCreateComposition = () => {
    if (!compositionName.trim()) {
      toast({
        title: "Validation Error",
        description: "Composition name is required",
        variant: "destructive",
      });
      return;
    }

    createECUComposition({
      name: compositionName,
      description: compositionDescription,
      ecuType,
      autosarVersion: currentProject.autosarVersion,
    });

    toast({
      title: "ECU Composition Created",
      description: `${compositionName} has been created successfully`,
    });

    // Reset form
    setCompositionName("");
    setCompositionDescription("");
    setEcuType("ECU");
    setIsCreateDialogOpen(false);
  };

  const handleAddInstance = () => {
    if (!instanceName.trim() || !selectedSWC || !selectedComposition) {
      toast({
        title: "Validation Error",
        description: "Instance name and SWC selection are required",
        variant: "destructive",
      });
      return;
    }

    addSWCInstance(selectedComposition, {
      name: instanceName,
      swcRef: selectedSWC,
      instanceName: instanceName,
      ecuCompositionId: selectedComposition,
    });

    toast({
      title: "SWC Instance Added",
      description: `${instanceName} instance has been added`,
    });

    // Reset form
    setInstanceName("");
    setSelectedSWC("");
    setIsInstanceDialogOpen(false);
  };

  const handleAddConnector = () => {
    if (!connectorName.trim() || !sourceInstance || !sourcePort || !targetInstance || !targetPort || !selectedComposition) {
      toast({
        title: "Validation Error",
        description: "All connector fields are required",
        variant: "destructive",
      });
      return;
    }

    addECUConnector(selectedComposition, {
      name: connectorName,
      sourceInstanceId: sourceInstance,
      sourcePortId: sourcePort,
      targetInstanceId: targetInstance,
      targetPortId: targetPort,
      ecuCompositionId: selectedComposition,
    });

    toast({
      title: "Connector Added",
      description: `${connectorName} connector has been added`,
    });

    // Reset form
    setConnectorName("");
    setSourceInstance("");
    setSourcePort("");
    setTargetInstance("");
    setTargetPort("");
    setIsConnectorDialogOpen(false);
  };

  const handleDelete = () => {
    if (!itemToDelete) return;
    
    try {
      switch (itemToDelete.type) {
        case 'composition':
          deleteECUComposition(itemToDelete.id);
          if (selectedComposition === itemToDelete.id) {
            setSelectedComposition("");
          }
          break;
        case 'instance':
          if (selectedComposition) {
            removeSWCInstance(selectedComposition, itemToDelete.id);
          }
          break;
        case 'connector':
          if (selectedComposition) {
            removeECUConnector(selectedComposition, itemToDelete.id);
          }
          break;
      }
      
      toast({
        title: "Item Deleted",
        description: `${itemToDelete.name} has been deleted successfully`,
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
    
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleSaveProject = () => {
    saveProject();
    toast({
      title: "Project Saved",
      description: "All changes have been saved successfully",
    });
  };

  const getAvailablePorts = (instanceId: string, direction?: 'provided' | 'required') => {
    const instance = currentComposition?.swcInstances.find(i => i.id === instanceId);
    if (!instance) return [];
    
    const swc = currentProject.swcs.find(s => s.id === instance.swcRef);
    if (!swc) return [];
    
    return swc.ports.filter(port => !direction || port.direction === direction);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ECU Composition Editor</h1>
          <p className="text-muted-foreground mt-1">
            Design and manage ECU compositions with SWC instances and connectors
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSaveProject} className="autosar-button">
            <Save className="h-4 w-4 mr-2" />
            Save Project
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="autosar-button">
                <Plus className="h-4 w-4 mr-2" />
                New ECU Composition
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create ECU Composition</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="comp-name">Name *</Label>
                  <Input 
                    id="comp-name"
                    placeholder="Enter composition name" 
                    value={compositionName}
                    onChange={(e) => setCompositionName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="comp-desc">Description</Label>
                  <Input 
                    id="comp-desc"
                    placeholder="Brief description" 
                    value={compositionDescription}
                    onChange={(e) => setCompositionDescription(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ecu-type">ECU Type</Label>
                  <Select value={ecuType} onValueChange={setEcuType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ECU">ECU</SelectItem>
                      <SelectItem value="Gateway">Gateway</SelectItem>
                      <SelectItem value="Sensor">Sensor</SelectItem>
                      <SelectItem value="Actuator">Actuator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="autosar-button" onClick={handleCreateComposition}>
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Composition Selector */}
      <Card className="autosar-card">
        <CardHeader>
          <CardTitle>Select ECU Composition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Select value={selectedComposition} onValueChange={setSelectedComposition}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an ECU composition to edit" />
                </SelectTrigger>
                <SelectContent>
                  {currentProject.ecuCompositions.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.name} ({comp.ecuType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedComposition && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  const comp = currentProject.ecuCompositions.find(c => c.id === selectedComposition);
                  if (comp) {
                    setItemToDelete({id: comp.id, name: comp.name, type: 'composition'});
                    setDeleteDialogOpen(true);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Editor */}
      {currentComposition && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SWC Instances */}
          <Card className="autosar-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>SWC Instances</CardTitle>
                  <CardDescription>
                    Add SWC instances to this composition
                  </CardDescription>
                </div>
                <Dialog open={isInstanceDialogOpen} onOpenChange={setIsInstanceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="autosar-button">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Instance
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add SWC Instance</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label>Instance Name *</Label>
                        <Input 
                          placeholder="Enter instance name" 
                          value={instanceName}
                          onChange={(e) => setInstanceName(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Select SWC *</Label>
                        <Select value={selectedSWC} onValueChange={setSelectedSWC}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose SWC" />
                          </SelectTrigger>
                          <SelectContent>
                            {currentProject.swcs.map((swc) => (
                              <SelectItem key={swc.id} value={swc.id}>
                                {swc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsInstanceDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button className="autosar-button" onClick={handleAddInstance}>
                          Add Instance
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentComposition.swcInstances.map((instance) => {
                  const swc = currentProject.swcs.find(s => s.id === instance.swcRef);
                  return (
                    <div key={instance.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Box className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{instance.instanceName}</p>
                          <p className="text-sm text-muted-foreground">
                            Type: {swc?.name} • Ports: {swc?.ports.length || 0}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setItemToDelete({id: instance.id, name: instance.instanceName, type: 'instance'});
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
                {currentComposition.swcInstances.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No SWC instances added yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Connectors */}
          <Card className="autosar-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Connectors</CardTitle>
                  <CardDescription>
                    Define connections between SWC instances
                  </CardDescription>
                </div>
                <Dialog open={isConnectorDialogOpen} onOpenChange={setIsConnectorDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="autosar-button"
                      disabled={currentComposition.swcInstances.length < 2}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Connector
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Connector</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label>Connector Name *</Label>
                        <Input 
                          placeholder="Enter connector name" 
                          value={connectorName}
                          onChange={(e) => setConnectorName(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Source Instance *</Label>
                        <Select value={sourceInstance} onValueChange={setSourceInstance}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose source instance" />
                          </SelectTrigger>
                          <SelectContent>
                            {currentComposition.swcInstances.map((instance) => (
                              <SelectItem key={instance.id} value={instance.id}>
                                {instance.instanceName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Source Port *</Label>
                        <Select value={sourcePort} onValueChange={setSourcePort}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose source port" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailablePorts(sourceInstance, 'provided').map((port) => (
                              <SelectItem key={port.id} value={port.id}>
                                {port.name} (Provided)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Target Instance *</Label>
                        <Select value={targetInstance} onValueChange={setTargetInstance}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose target instance" />
                          </SelectTrigger>
                          <SelectContent>
                            {currentComposition.swcInstances.filter(i => i.id !== sourceInstance).map((instance) => (
                              <SelectItem key={instance.id} value={instance.id}>
                                {instance.instanceName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Target Port *</Label>
                        <Select value={targetPort} onValueChange={setTargetPort}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose target port" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailablePorts(targetInstance, 'required').map((port) => (
                              <SelectItem key={port.id} value={port.id}>
                                {port.name} (Required)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsConnectorDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button className="autosar-button" onClick={handleAddConnector}>
                          Add Connector
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentComposition.connectors.map((connector) => {
                  const sourceInst = currentComposition.swcInstances.find(i => i.id === connector.sourceInstanceId);
                  const targetInst = currentComposition.swcInstances.find(i => i.id === connector.targetInstanceId);
                  const sourceSwc = currentProject.swcs.find(s => s.id === sourceInst?.swcRef);
                  const targetSwc = currentProject.swcs.find(s => s.id === targetInst?.swcRef);
                  const sourcePortObj = sourceSwc?.ports.find(p => p.id === connector.sourcePortId);
                  const targetPortObj = targetSwc?.ports.find(p => p.id === connector.targetPortId);
                  
                  return (
                    <div key={connector.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <ArrowRight className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{connector.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {sourceInst?.instanceName}.{sourcePortObj?.name} → {targetInst?.instanceName}.{targetPortObj?.name}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setItemToDelete({id: connector.id, name: connector.name, type: 'connector'});
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
                {currentComposition.connectors.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No connectors defined yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={`Delete ${itemToDelete?.type || 'Item'}`}
        description={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ECUCompositionEditor;
