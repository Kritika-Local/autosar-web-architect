
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Cable, Settings } from "lucide-react";
import { useAutosarStore } from "@/store/autosarStore";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

const ECUCompositionEditor = () => {
  const {
    currentProject,
    createECUComposition,
    updateECUComposition,
    deleteECUComposition,
    addSWCInstance,
    removeSWCInstance,
    addECUConnector,
    removeECUConnector,
  } = useAutosarStore();

  // State for composition management
  const [selectedComposition, setSelectedComposition] = useState<string>('');
  const [isCreateCompositionDialogOpen, setIsCreateCompositionDialogOpen] = useState(false);
  const [isAddInstanceDialogOpen, setIsAddInstanceDialogOpen] = useState(false);
  const [isCreateConnectorDialogOpen, setIsCreateConnectorDialogOpen] = useState(false);
  
  // State for new composition
  const [newCompositionName, setNewCompositionName] = useState('');
  const [newCompositionDescription, setNewCompositionDescription] = useState('');
  const [newCompositionEcuType, setNewCompositionEcuType] = useState('');
  
  // State for new instance
  const [selectedSwcForInstance, setSelectedSwcForInstance] = useState('');
  const [newInstanceName, setNewInstanceName] = useState('');
  
  // State for new connector
  const [sourceInstanceId, setSourceInstanceId] = useState('');
  const [sourcePortId, setSourcePortId] = useState('');
  const [targetInstanceId, setTargetInstanceId] = useState('');
  const [targetPortId, setTargetPortId] = useState('');
  const [connectorName, setConnectorName] = useState('');
  
  // State for deletion
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const ecuCompositions = currentProject?.ecuCompositions || [];
  const swcs = currentProject?.swcs || [];

  const currentComposition = ecuCompositions.find(comp => comp.id === selectedComposition);

  const handleCreateComposition = () => {
    if (!newCompositionName.trim()) {
      toast.error("Composition name is required");
      return;
    }

    createECUComposition({
      name: newCompositionName,
      description: newCompositionDescription,
      ecuType: newCompositionEcuType,
      autosarVersion: currentProject?.autosarVersion || "4.0.3",
    });

    setNewCompositionName('');
    setNewCompositionDescription('');
    setNewCompositionEcuType('');
    setIsCreateCompositionDialogOpen(false);
    toast.success("ECU Composition created successfully");
  };

  const handleAddInstance = () => {
    if (!selectedSwcForInstance || !newInstanceName.trim() || !selectedComposition) {
      toast.error("Please fill all required fields");
      return;
    }

    addSWCInstance(selectedComposition, {
      name: newInstanceName,
      swcRef: selectedSwcForInstance,
      instanceName: newInstanceName,
      ecuCompositionId: selectedComposition,
    });

    setSelectedSwcForInstance('');
    setNewInstanceName('');
    setIsAddInstanceDialogOpen(false);
    toast.success("SWC Instance added successfully");
  };

  const handleCreateConnector = () => {
    if (!sourceInstanceId || !sourcePortId || !targetInstanceId || !targetPortId || !connectorName.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!selectedComposition) {
      toast.error("No composition selected");
      return;
    }

    addECUConnector(selectedComposition, {
      name: connectorName,
      sourceInstanceId,
      sourcePortId,
      targetInstanceId,
      targetPortId,
      ecuCompositionId: selectedComposition,
    });

    // Reset form
    setSourceInstanceId('');
    setSourcePortId('');
    setTargetInstanceId('');
    setTargetPortId('');
    setConnectorName('');
    setIsCreateConnectorDialogOpen(false);
    toast.success("Connector created successfully");
  };

  const openDeleteDialog = (type: string, id: string, name: string) => {
    setItemToDelete({ type, id, name });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    try {
      switch (itemToDelete.type) {
        case 'composition':
          deleteECUComposition(itemToDelete.id);
          setSelectedComposition('');
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
      toast.success(`${itemToDelete.type} deleted successfully`);
    } catch (error) {
      toast.error(`Failed to delete ${itemToDelete.type}`);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const getPortById = (portId: string) => {
    for (const swc of swcs) {
      const port = swc.ports.find(p => p.id === portId);
      if (port) return port;
    }
    return null;
  };

  const getInstanceName = (instanceId: string) => {
    return currentComposition?.swcInstances.find(inst => inst.id === instanceId)?.instanceName || 'Unknown';
  };

  if (!currentProject) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No project loaded. Please create or load a project first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">ECU Composition Editor</h1>
          <p className="text-muted-foreground">Design and manage ECU compositions</p>
        </div>
        <Dialog open={isCreateCompositionDialogOpen} onOpenChange={setIsCreateCompositionDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Composition
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New ECU Composition</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="composition-name">Name</Label>
                <Input
                  id="composition-name"
                  value={newCompositionName}
                  onChange={(e) => setNewCompositionName(e.target.value)}
                  placeholder="Enter composition name"
                />
              </div>
              <div>
                <Label htmlFor="composition-description">Description</Label>
                <Textarea
                  id="composition-description"
                  value={newCompositionDescription}
                  onChange={(e) => setNewCompositionDescription(e.target.value)}
                  placeholder="Enter description"
                />
              </div>
              <div>
                <Label htmlFor="composition-ecu-type">ECU Type</Label>
                <Input
                  id="composition-ecu-type"
                  value={newCompositionEcuType}
                  onChange={(e) => setNewCompositionEcuType(e.target.value)}
                  placeholder="Enter ECU type"
                />
              </div>
              <Button onClick={handleCreateComposition} className="w-full">
                Create Composition
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Composition Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select ECU Composition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="composition-select">Composition</Label>
              <Select value={selectedComposition} onValueChange={setSelectedComposition}>
                <SelectTrigger id="composition-select">
                  <SelectValue placeholder="Select a composition" />
                </SelectTrigger>
                <SelectContent>
                  {ecuCompositions.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedComposition && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => openDeleteDialog('composition', selectedComposition, currentComposition?.name || '')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Composition Details */}
      {currentComposition && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Composition Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <p className="text-sm text-muted-foreground">{currentComposition.name}</p>
                </div>
                <div>
                  <Label>ECU Type</Label>
                  <p className="text-sm text-muted-foreground">{currentComposition.ecuType}</p>
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground">{currentComposition.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SWC Instances */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                SWC Instances
                <Dialog open={isAddInstanceDialogOpen} onOpenChange={setIsAddInstanceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Instance
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add SWC Instance</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="swc-select">Select SWC</Label>
                        <Select value={selectedSwcForInstance} onValueChange={setSelectedSwcForInstance}>
                          <SelectTrigger id="swc-select">
                            <SelectValue placeholder="Select an SWC" />
                          </SelectTrigger>
                          <SelectContent>
                            {swcs.map((swc) => (
                              <SelectItem key={swc.id} value={swc.id}>
                                {swc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="instance-name">Instance Name</Label>
                        <Input
                          id="instance-name"
                          value={newInstanceName}
                          onChange={(e) => setNewInstanceName(e.target.value)}
                          placeholder="Enter instance name"
                        />
                      </div>
                      <Button onClick={handleAddInstance} className="w-full">
                        Add Instance
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentComposition.swcInstances.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No SWC instances added yet</p>
              ) : (
                <div className="space-y-2">
                  {currentComposition.swcInstances.map((instance) => {
                    const swc = swcs.find(s => s.id === instance.swcRef);
                    return (
                      <div key={instance.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{instance.instanceName}</div>
                          <div className="text-sm text-muted-foreground">
                            <Badge variant="secondary">{swc?.name || 'Unknown SWC'}</Badge>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteDialog('instance', instance.id, instance.instanceName)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Connectors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cable className="h-5 w-5" />
                  Connectors
                </div>
                <Dialog open={isCreateConnectorDialogOpen} onOpenChange={setIsCreateConnectorDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Connector
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Connector</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="connector-name">Connector Name</Label>
                        <Input
                          id="connector-name"
                          value={connectorName}
                          onChange={(e) => setConnectorName(e.target.value)}
                          placeholder="Enter connector name"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="source-instance">Source Instance</Label>
                          <Select value={sourceInstanceId} onValueChange={setSourceInstanceId}>
                            <SelectTrigger id="source-instance">
                              <SelectValue placeholder="Select source instance" />
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
                        <div>
                          <Label htmlFor="target-instance">Target Instance</Label>
                          <Select value={targetInstanceId} onValueChange={setTargetInstanceId}>
                            <SelectTrigger id="target-instance">
                              <SelectValue placeholder="Select target instance" />
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
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="source-port">Source Port</Label>
                          <Select value={sourcePortId} onValueChange={setSourcePortId}>
                            <SelectTrigger id="source-port">
                              <SelectValue placeholder="Select source port" />
                            </SelectTrigger>
                            <SelectContent>
                              {sourceInstanceId && (() => {
                                const instance = currentComposition.swcInstances.find(inst => inst.id === sourceInstanceId);
                                const swc = swcs.find(s => s.id === instance?.swcRef);
                                return swc?.ports.map((port) => (
                                  <SelectItem key={port.id} value={port.id}>
                                    {port.name} ({port.direction})
                                  </SelectItem>
                                )) || [];
                              })()}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="target-port">Target Port</Label>
                          <Select value={targetPortId} onValueChange={setTargetPortId}>
                            <SelectTrigger id="target-port">
                              <SelectValue placeholder="Select target port" />
                            </SelectTrigger>
                            <SelectContent>
                              {targetInstanceId && (() => {
                                const instance = currentComposition.swcInstances.find(inst => inst.id === targetInstanceId);
                                const swc = swcs.find(s => s.id === instance?.swcRef);
                                return swc?.ports.map((port) => (
                                  <SelectItem key={port.id} value={port.id}>
                                    {port.name} ({port.direction})
                                  </SelectItem>
                                )) || [];
                              })()}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button onClick={handleCreateConnector} className="w-full">
                        Create Connector
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentComposition.connectors.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No connectors created yet</p>
              ) : (
                <div className="space-y-2">
                  {currentComposition.connectors.map((connector) => {
                    const sourceInstance = currentComposition.swcInstances.find(inst => inst.id === connector.sourceInstanceId);
                    const targetInstance = currentComposition.swcInstances.find(inst => inst.id === connector.targetInstanceId);
                    const sourceSwc = swcs.find(s => s.id === sourceInstance?.swcRef);
                    const targetSwc = swcs.find(s => s.id === targetInstance?.swcRef);
                    const sourcePort = getPortById(connector.sourcePortId);
                    const targetPort = getPortById(connector.targetPortId);
                    
                    return (
                      <div key={connector.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{connector.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {sourceInstance?.instanceName}.{sourcePort?.name} → {targetInstance?.instanceName}.{targetPort?.name}
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteDialog('connector', connector.id, connector.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={`Delete ${itemToDelete?.type || 'Item'}`}
        description={`Are you sure you want to delete this ${itemToDelete?.type}? This action cannot be undone.`}
        itemName={itemToDelete?.name || ''}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ECUCompositionEditor;
