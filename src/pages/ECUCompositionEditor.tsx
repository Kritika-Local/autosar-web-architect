
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
            Design ECU compositions and manage SWC instances
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleSaveProject}
            className="autosar-button"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Project
          </Button>
          <Dialog open={isCreateCompositionDialogOpen} onOpenChange={setIsCreateCompositionDialogOpen}>
            <DialogTrigger asChild>
              <Button className="autosar-button flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New ECU Composition
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New ECU Composition</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input 
                    id="name" 
                    placeholder="Enter composition name" 
                    value={compositionName}
                    onChange={(e) => setCompositionName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input 
                    id="description" 
                    placeholder="Brief description" 
                    value={compositionDescription}
                    onChange={(e) => setCompositionDescription(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ecu-type">ECU Type</Label>
                  <Input 
                    id="ecu-type" 
                    placeholder="ECU type (e.g., Engine Control Unit)" 
                    value={ecuType}
                    onChange={(e) => setEcuType(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateCompositionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="autosar-button" onClick={handleCreateComposition}>
                  Create Composition
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Composition Selection */}
      {ecuCompositions.length > 0 && (
        <Card className="autosar-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Label htmlFor="composition-select">Active Composition:</Label>
              <Select value={selectedCompositionId || ""} onValueChange={setSelectedCompositionId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a composition" />
                </SelectTrigger>
                <SelectContent>
                  {ecuCompositions.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id}>{comp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedComposition && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => openDeleteDialog(selectedComposition.id, selectedComposition.name, 'composition')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Composition
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedComposition ? (
        <>
          {/* SWC Instances Section */}
          <Card className="autosar-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Box className="h-5 w-5" />
                    SWC Instances
                  </CardTitle>
                  <CardDescription>
                    Add SWC instances to this ECU composition
                  </CardDescription>
                </div>
                <Dialog open={isAddInstanceDialogOpen} onOpenChange={setIsAddInstanceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Instance
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add SWC Instance</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="swc-select">Select SWC *</Label>
                        <Select onValueChange={setSelectedSwcForInstance}>
                          <SelectTrigger id="swc-select">
                            <SelectValue placeholder="Select a SWC" />
                          </SelectTrigger>
                          <SelectContent>
                            {currentProject?.swcs.map((swc) => (
                              <SelectItem key={swc.id} value={swc.id}>{swc.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="instance-name">Instance Name *</Label>
                        <Input 
                          id="instance-name" 
                          placeholder="Enter instance name" 
                          value={instanceName}
                          onChange={(e) => setInstanceName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAddInstanceDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button className="autosar-button" onClick={handleAddInstance}>
                        Add Instance
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {selectedComposition.swcInstances.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No SWC instances added yet
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedComposition.swcInstances.map((instance) => {
                    const swc = currentProject?.swcs.find(s => s.id === instance.swcRef);
                    return (
                      <Card key={instance.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{instance.instanceName}</h4>
                            <p className="text-sm text-muted-foreground">
                              Type: {swc?.name || 'Unknown'}
                            </p>
                            <Badge variant="outline" className="mt-2 capitalize">
                              {swc?.category || 'Unknown'}
                            </Badge>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openDeleteDialog(instance.id, instance.instanceName, 'instance')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Connectors Section */}
          <Card className="autosar-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Cable className="h-5 w-5" />
                    Connectors
                  </CardTitle>
                  <CardDescription>
                    Define connections between SWC instance ports
                  </CardDescription>
                </div>
                <Dialog open={isCreateConnectorDialogOpen} onOpenChange={setIsCreateConnectorDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Connector
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Create Connector</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="connector-name">Connector Name *</Label>
                        <Input 
                          id="connector-name" 
                          placeholder="Enter connector name" 
                          value={connectorName}
                          onChange={(e) => setConnectorName(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="source-instance">Source Instance *</Label>
                          <Select onValueChange={setSourceInstanceId}>
                            <SelectTrigger id="source-instance">
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedComposition.swcInstances.map((instance) => (
                                <SelectItem key={instance.id} value={instance.id}>
                                  {instance.instanceName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="target-instance">Target Instance *</Label>
                          <Select onValueChange={setTargetInstanceId}>
                            <SelectTrigger id="target-instance">
                              <SelectValue placeholder="Select target" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedComposition.swcInstances.map((instance) => (
                                <SelectItem key={instance.id} value={instance.id}>
                                  {instance.instanceName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="source-port">Source Port *</Label>
                          <Select onValueChange={setSourcePortId}>
                            <SelectTrigger id="source-port">
                              <SelectValue placeholder="Select port" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailablePorts(sourceInstanceId, 'provided').map((port) => (
                                <SelectItem key={port.id} value={port.id}>
                                  {port.name} (Provided)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="target-port">Target Port *</Label>
                          <Select onValueChange={setTargetPortId}>
                            <SelectTrigger id="target-port">
                              <SelectValue placeholder="Select port" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailablePorts(targetInstanceId, 'required').map((port) => (
                                <SelectItem key={port.id} value={port.id}>
                                  {port.name} (Required)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsCreateConnectorDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button className="autosar-button" onClick={handleCreateConnector}>
                        Create Connector
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {selectedComposition.connectors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No connectors defined yet
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedComposition.connectors.map((connector) => {
                    const sourceInstance = selectedComposition.swcInstances.find(i => i.id === connector.sourceInstanceId);
                    const targetInstance = selectedComposition.swcInstances.find(i => i.id === connector.targetInstanceId);
                    const sourcePort = getPortById(connector.sourcePortId);
                    const targetPort = getPortById(connector.targetPortId);
                    
                    return (
                      <Card key={connector.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-sm">
                              <span className="font-medium">{connector.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{sourceInstance?.instanceName}.{sourcePort?.name}</span>
                              <ArrowRight className="h-3 w-3" />
                              <span>{targetInstance?.instanceName}.{targetPort?.name}</span>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openDeleteDialog(connector.id, connector.name, 'connector')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="autosar-card">
          <CardContent className="text-center py-12">
            <Box className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">
              {ecuCompositions.length === 0 
                ? "No ECU compositions created yet"
                : "Select an ECU composition to start editing"
              }
            </p>
            {ecuCompositions.length === 0 && (
              <Button 
                onClick={() => setIsCreateCompositionDialogOpen(true)}
                className="autosar-button"
              >
                Create Your First ECU Composition
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={`Delete ${itemToDelete?.type === 'composition' ? 'ECU Composition' : 
               itemToDelete?.type === 'instance' ? 'SWC Instance' : 'Connector'}`}
        description={`Are you sure you want to delete this ${itemToDelete?.type}? This action cannot be undone.`}
        itemName={itemToDelete?.name || "Unknown Item"}
        onConfirm={handleDeleteItem}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ECUCompositionEditor;
