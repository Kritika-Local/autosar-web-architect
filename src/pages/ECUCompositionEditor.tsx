
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAutosarStore } from '@/store/autosarStore';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { Plus, Trash2, Download, Cable, ArrowLeft } from 'lucide-react';

const ECUCompositionEditor = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    currentProject,
    swcs,
    createECUComposition,
    updateECUComposition,
    deleteECUComposition,
    addSWCInstance,
    removeSWCInstance,
    createConnector,
    deleteConnector,
    exportArxml,
    loadProject
  } = useAutosarStore();

  // State variables
  const [isCreateCompositionDialogOpen, setIsCreateCompositionDialogOpen] = useState(false);
  const [selectedComposition, setSelectedComposition] = useState<string | null>(null);
  const [isAddInstanceDialogOpen, setIsAddInstanceDialogOpen] = useState(false);
  const [selectedSwcForInstance, setSelectedSwcForInstance] = useState<string>('');
  const [isCreateConnectorDialogOpen, setIsCreateConnectorDialogOpen] = useState(false);
  const [sourceInstanceId, setSourceInstanceId] = useState<string>('');
  const [targetInstanceId, setTargetInstanceId] = useState<string>('');
  const [sourcePortId, setSourcePortId] = useState<string>('');
  const [targetPortId, setTargetPortId] = useState<string>('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state for new composition
  const [newCompositionName, setNewCompositionName] = useState('');
  const [newCompositionDescription, setNewCompositionDescription] = useState('');

  // Get ECU compositions from current project
  const ecuCompositions = currentProject?.ecuCompositions || [];

  useEffect(() => {
    if (projectId && !currentProject) {
      loadProject(projectId);
    }
  }, [projectId, currentProject, loadProject]);

  // Helper function to get port by ID
  const getPortById = (portId: string) => {
    for (const swc of swcs) {
      const port = swc.ports.find(p => p.id === portId);
      if (port) return port;
    }
    return null;
  };

  // Handle opening delete dialog
  const openDeleteDialog = (type: string, id: string, name: string) => {
    setDeleteTarget({ type, id, name });
    setIsDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDelete = async () => {
    if (!deleteTarget || !currentProject) return;

    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'composition') {
        deleteECUComposition(currentProject.id, deleteTarget.id);
        if (selectedComposition === deleteTarget.id) {
          setSelectedComposition(null);
        }
        toast({
          title: "Success",
          description: "ECU Composition deleted successfully",
        });
      } else if (deleteTarget.type === 'instance') {
        if (selectedComposition) {
          removeSWCInstance(currentProject.id, selectedComposition, deleteTarget.id);
          toast({
            title: "Success",
            description: "SWC Instance removed successfully",
          });
        }
      } else if (deleteTarget.type === 'connector') {
        if (selectedComposition) {
          deleteConnector(currentProject.id, selectedComposition, deleteTarget.id);
          toast({
            title: "Success",
            description: "Connector deleted successfully",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  // Handle creating new composition
  const handleCreateComposition = () => {
    if (!currentProject || !newCompositionName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a composition name",
        variant: "destructive",
      });
      return;
    }

    try {
      createECUComposition(currentProject.id, {
        name: newCompositionName.trim(),
        description: newCompositionDescription.trim(),
      });
      
      setNewCompositionName('');
      setNewCompositionDescription('');
      setIsCreateCompositionDialogOpen(false);
      
      toast({
        title: "Success",
        description: "ECU Composition created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create ECU Composition",
        variant: "destructive",
      });
    }
  };

  // Handle adding SWC instance
  const handleAddInstance = () => {
    if (!currentProject || !selectedComposition || !selectedSwcForInstance) {
      toast({
        title: "Error",
        description: "Please select an SWC",
        variant: "destructive",
      });
      return;
    }

    const selectedSWC = swcs.find(swc => swc.id === selectedSwcForInstance);
    if (!selectedSWC) {
      toast({
        title: "Error",
        description: "Selected SWC not found",
        variant: "destructive",
      });
      return;
    }

    try {
      addSWCInstance(currentProject.id, selectedComposition, {
        name: `${selectedSWC.name}_Instance`,
        swcId: selectedSwcForInstance,
      });
      
      setSelectedSwcForInstance('');
      setIsAddInstanceDialogOpen(false);
      
      toast({
        title: "Success",
        description: "SWC Instance added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add SWC Instance",
        variant: "destructive",
      });
    }
  };

  // Handle creating connector
  const handleCreateConnector = () => {
    if (!currentProject || !selectedComposition || !sourceInstanceId || !targetInstanceId || !sourcePortId || !targetPortId) {
      toast({
        title: "Error",
        description: "Please fill all connector fields",
        variant: "destructive",
      });
      return;
    }

    try {
      createConnector(currentProject.id, selectedComposition, {
        name: `Connector_${Date.now()}`,
        sourceInstanceId,
        targetInstanceId,
        sourcePortId,
        targetPortId,
      });
      
      setSourceInstanceId('');
      setTargetInstanceId('');
      setSourcePortId('');
      setTargetPortId('');
      setIsCreateConnectorDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Connector created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create connector",
        variant: "destructive",
      });
    }
  };

  // Handle export
  const handleExport = () => {
    if (!currentProject) return;
    
    try {
      exportArxml(currentProject.id);
      toast({
        title: "Success",
        description: "ARXML exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export ARXML",
        variant: "destructive",
      });
    }
  };

  if (!currentProject) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading project...</div>
      </div>
    );
  }

  const selectedCompositionData = ecuCompositions.find(comp => comp.id === selectedComposition);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Button>
          <div>
            <h1 className="text-3xl font-bold">ECU Composition Editor</h1>
            <p className="text-muted-foreground">
              Project: {currentProject.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export ARXML
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ECU Compositions List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              ECU Compositions
              <Dialog open={isCreateCompositionDialogOpen} onOpenChange={setIsCreateCompositionDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create ECU Composition</DialogTitle>
                    <DialogDescription>
                      Create a new ECU composition for your project.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="compositionName">Name</Label>
                      <Input
                        id="compositionName"
                        value={newCompositionName}
                        onChange={(e) => setNewCompositionName(e.target.value)}
                        placeholder="Enter composition name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="compositionDescription">Description</Label>
                      <Textarea
                        id="compositionDescription"
                        value={newCompositionDescription}
                        onChange={(e) => setNewCompositionDescription(e.target.value)}
                        placeholder="Enter composition description"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateCompositionDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreateComposition}>
                        Create
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ecuCompositions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No compositions yet</p>
            ) : (
              <div className="space-y-2">
                {ecuCompositions.map((composition) => (
                  <div
                    key={composition.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedComposition === composition.id
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedComposition(composition.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{composition.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {composition.description}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteDialog('composition', composition.id, composition.name);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SWC Instances */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              SWC Instances
              <Dialog open={isAddInstanceDialogOpen} onOpenChange={setIsAddInstanceDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={!selectedComposition}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Instance
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add SWC Instance</DialogTitle>
                    <DialogDescription>
                      Add an SWC instance to the selected composition.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="swcSelect">Select SWC</Label>
                      <Select value={selectedSwcForInstance} onValueChange={setSelectedSwcForInstance}>
                        <SelectTrigger>
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
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddInstanceDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAddInstance}>
                        Add Instance
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedComposition ? (
              <p className="text-sm text-muted-foreground">Select a composition first</p>
            ) : !selectedCompositionData?.swcInstances?.length ? (
              <p className="text-sm text-muted-foreground">No instances yet</p>
            ) : (
              <div className="space-y-2">
                {selectedCompositionData.swcInstances.map((instance) => (
                  <div key={instance.id} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{instance.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {swcs.find(swc => swc.id === instance.swcId)?.name || 'Unknown SWC'}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openDeleteDialog('instance', instance.id, instance.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
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
                  <Button size="sm" disabled={!selectedComposition || !selectedCompositionData?.swcInstances?.length}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Connector</DialogTitle>
                    <DialogDescription>
                      Create a connection between two SWC instances.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Source Instance</Label>
                      <Select value={sourceInstanceId} onValueChange={setSourceInstanceId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source instance" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedCompositionData?.swcInstances?.map((instance) => (
                            <SelectItem key={instance.id} value={instance.id}>
                              {instance.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Target Instance</Label>
                      <Select value={targetInstanceId} onValueChange={setTargetInstanceId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select target instance" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedCompositionData?.swcInstances?.map((instance) => (
                            <SelectItem key={instance.id} value={instance.id}>
                              {instance.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Source Port</Label>
                      <Select value={sourcePortId} onValueChange={setSourcePortId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source port" />
                        </SelectTrigger>
                        <SelectContent>
                          {sourceInstanceId && (() => {
                            const instance = selectedCompositionData?.swcInstances?.find(i => i.id === sourceInstanceId);
                            const swc = instance ? swcs.find(s => s.id === instance.swcId) : null;
                            return swc?.ports.map((port) => (
                              <SelectItem key={port.id} value={port.id}>
                                {port.name} ({port.direction})
                              </SelectItem>
                            ));
                          })()}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Target Port</Label>
                      <Select value={targetPortId} onValueChange={setTargetPortId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select target port" />
                        </SelectTrigger>
                        <SelectContent>
                          {targetInstanceId && (() => {
                            const instance = selectedCompositionData?.swcInstances?.find(i => i.id === targetInstanceId);
                            const swc = instance ? swcs.find(s => s.id === instance.swcId) : null;
                            return swc?.ports.map((port) => (
                              <SelectItem key={port.id} value={port.id}>
                                {port.name} ({port.direction})
                              </SelectItem>
                            ));
                          })()}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateConnectorDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreateConnector}>
                        Create Connector
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedComposition ? (
              <p className="text-sm text-muted-foreground">Select a composition first</p>
            ) : !selectedCompositionData?.connectors?.length ? (
              <p className="text-sm text-muted-foreground">No connectors yet</p>
            ) : (
              <div className="space-y-2">
                {selectedCompositionData.connectors.map((connector) => {
                  const sourceInstance = selectedCompositionData.swcInstances?.find(i => i.id === connector.sourceInstanceId);
                  const targetInstance = selectedCompositionData.swcInstances?.find(i => i.id === connector.targetInstanceId);
                  const sourcePort = getPortById(connector.sourcePortId);
                  const targetPort = getPortById(connector.targetPortId);
                  
                  return (
                    <div key={connector.id} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{connector.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {sourceInstance?.name}.{sourcePort?.name} → {targetInstance?.name}.{targetPort?.name}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDeleteDialog('connector', connector.id, connector.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={`Delete ${deleteTarget?.type === 'composition' ? 'ECU Composition' : 
               deleteTarget?.type === 'instance' ? 'SWC Instance' : 'Connector'}`}
        description={`Are you sure you want to delete this ${deleteTarget?.type}? This action cannot be undone.`}
        itemName={deleteTarget?.name || ''}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ECUCompositionEditor;
