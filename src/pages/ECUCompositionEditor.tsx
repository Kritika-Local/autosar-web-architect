
import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, Link, Settings } from 'lucide-react';
import { useAutosarStore, ECUComposition, SWCInstance, ECUConnector } from '@/store/autosarStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface ECUCompositionFormData {
  name: string;
  description: string;
  ecuType: string;
  autosarVersion: string;
}

interface SWCInstanceFormData {
  name: string;
  swcRef: string;
  instanceName: string;
}

interface ECUConnectorFormData {
  name: string;
  sourceInstanceId: string;
  sourcePortId: string;
  targetInstanceId: string;
  targetPortId: string;
}

const ECUCompositionEditor = () => {
  const { 
    currentProject, 
    createECUComposition, 
    updateECUComposition, 
    deleteECUComposition,
    addSWCInstance,
    updateSWCInstance,
    removeSWCInstance,
    addECUConnector,
    updateECUConnector,
    removeECUConnector
  } = useAutosarStore();

  const [selectedComposition, setSelectedComposition] = useState<ECUComposition | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isInstanceDialogOpen, setIsInstanceDialogOpen] = useState(false);
  const [isConnectorDialogOpen, setIsConnectorDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('compositions');

  const [compositionForm, setCompositionForm] = useState<ECUCompositionFormData>({
    name: '',
    description: '',
    ecuType: 'ApplicationECU',
    autosarVersion: '4.3.1'
  });

  const [instanceForm, setInstanceForm] = useState<SWCInstanceFormData>({
    name: '',
    swcRef: '',
    instanceName: ''
  });

  const [connectorForm, setConnectorForm] = useState<ECUConnectorFormData>({
    name: '',
    sourceInstanceId: '',
    sourcePortId: '',
    targetInstanceId: '',
    targetPortId: ''
  });

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please create or load a project first</p>
      </div>
    );
  }

  const handleCreateComposition = () => {
    if (!compositionForm.name.trim()) {
      toast.error('Please enter a composition name');
      return;
    }

    createECUComposition({
      name: compositionForm.name,
      description: compositionForm.description,
      ecuType: compositionForm.ecuType,
      autosarVersion: compositionForm.autosarVersion
    });

    setCompositionForm({
      name: '',
      description: '',
      ecuType: 'ApplicationECU',
      autosarVersion: '4.3.1'
    });
    setIsCreateDialogOpen(false);
    toast.success('ECU Composition created successfully');
  };

  const handleUpdateComposition = () => {
    if (!selectedComposition) return;

    updateECUComposition(selectedComposition.id, {
      name: compositionForm.name,
      description: compositionForm.description,
      ecuType: compositionForm.ecuType,
      autosarVersion: compositionForm.autosarVersion
    });

    setIsEditDialogOpen(false);
    toast.success('ECU Composition updated successfully');
  };

  const handleDeleteComposition = (compositionId: string) => {
    deleteECUComposition(compositionId);
    if (selectedComposition?.id === compositionId) {
      setSelectedComposition(null);
    }
    toast.success('ECU Composition deleted successfully');
  };

  const handleAddInstance = () => {
    if (!selectedComposition || !instanceForm.swcRef || !instanceForm.instanceName.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    addSWCInstance(selectedComposition.id, {
      name: instanceForm.instanceName,
      swcRef: instanceForm.swcRef,
      instanceName: instanceForm.instanceName,
      ecuCompositionId: selectedComposition.id
    });

    setInstanceForm({
      name: '',
      swcRef: '',
      instanceName: ''
    });
    setIsInstanceDialogOpen(false);
    toast.success('SWC Instance added successfully');
  };

  const handleAddConnector = () => {
    if (!selectedComposition || !connectorForm.sourceInstanceId || !connectorForm.targetInstanceId) {
      toast.error('Please select source and target instances');
      return;
    }

    addECUConnector(selectedComposition.id, {
      name: connectorForm.name || `${connectorForm.sourceInstanceId}_to_${connectorForm.targetInstanceId}`,
      sourceInstanceId: connectorForm.sourceInstanceId,
      sourcePortId: connectorForm.sourcePortId,
      targetInstanceId: connectorForm.targetInstanceId,
      targetPortId: connectorForm.targetPortId,
      ecuCompositionId: selectedComposition.id
    });

    setConnectorForm({
      name: '',
      sourceInstanceId: '',
      sourcePortId: '',
      targetInstanceId: '',
      targetPortId: ''
    });
    setIsConnectorDialogOpen(false);
    toast.success('Connector added successfully');
  };

  const openEditDialog = (composition: ECUComposition) => {
    setSelectedComposition(composition);
    setCompositionForm({
      name: composition.name,
      description: composition.description,
      ecuType: composition.ecuType,
      autosarVersion: composition.autosarVersion
    });
    setIsEditDialogOpen(true);
  };

  const getAvailablePorts = (instanceId: string) => {
    const instance = selectedComposition?.swcInstances.find(i => i.id === instanceId);
    if (!instance) return [];
    
    const swc = currentProject.swcs.find(s => s.id === instance.swcRef);
    return swc?.ports || [];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ECU Composition Editor</h1>
          <p className="text-muted-foreground mt-2">
            Design and manage ECU compositions with SWC instances and connectors
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Composition
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create ECU Composition</DialogTitle>
              <DialogDescription>
                Create a new ECU composition to organize your SWC instances
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="comp-name">Name *</Label>
                <Input
                  id="comp-name"
                  value={compositionForm.name}
                  onChange={(e) => setCompositionForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter composition name"
                />
              </div>
              <div>
                <Label htmlFor="comp-description">Description</Label>
                <Textarea
                  id="comp-description"
                  value={compositionForm.description}
                  onChange={(e) => setCompositionForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter composition description"
                />
              </div>
              <div>
                <Label htmlFor="comp-ecu-type">ECU Type</Label>
                <Select
                  value={compositionForm.ecuType}
                  onValueChange={(value) => setCompositionForm(prev => ({ ...prev, ecuType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ApplicationECU">Application ECU</SelectItem>
                    <SelectItem value="GatewayECU">Gateway ECU</SelectItem>
                    <SelectItem value="SensorECU">Sensor ECU</SelectItem>
                    <SelectItem value="ActuatorECU">Actuator ECU</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="comp-autosar-version">AUTOSAR Version</Label>
                <Select
                  value={compositionForm.autosarVersion}
                  onValueChange={(value) => setCompositionForm(prev => ({ ...prev, autosarVersion: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4.3.1">4.3.1</SelectItem>
                    <SelectItem value="4.4.0">4.4.0</SelectItem>
                    <SelectItem value="4.5.0">4.5.0</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateComposition}>
                  Create Composition
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="compositions">Compositions</TabsTrigger>
          {selectedComposition && (
            <>
              <TabsTrigger value="instances">SWC Instances</TabsTrigger>
              <TabsTrigger value="connectors">Connectors</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="compositions" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {currentProject.ecuCompositions.map((composition) => (
              <Card key={composition.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{composition.name}</CardTitle>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedComposition(composition)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(composition)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComposition(composition.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{composition.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ECU Type:</span>
                      <span>{composition.ecuType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Instances:</span>
                      <span>{composition.swcInstances.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Connectors:</span>
                      <span>{composition.connectors.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">AUTOSAR:</span>
                      <span>{composition.autosarVersion}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {selectedComposition && (
          <>
            <TabsContent value="instances" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">
                  SWC Instances - {selectedComposition.name}
                </h3>
                <Dialog open={isInstanceDialogOpen} onOpenChange={setIsInstanceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Instance
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add SWC Instance</DialogTitle>
                      <DialogDescription>
                        Add a new SWC instance to the composition
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="instance-swc">SWC Reference *</Label>
                        <Select
                          value={instanceForm.swcRef}
                          onValueChange={(value) => setInstanceForm(prev => ({ ...prev, swcRef: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select SWC" />
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
                      <div>
                        <Label htmlFor="instance-name">Instance Name *</Label>
                        <Input
                          id="instance-name"
                          value={instanceForm.instanceName}
                          onChange={(e) => setInstanceForm(prev => ({ ...prev, instanceName: e.target.value }))}
                          placeholder="Enter instance name"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsInstanceDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddInstance}>
                          Add Instance
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4">
                {selectedComposition.swcInstances.map((instance) => {
                  const swc = currentProject.swcs.find(s => s.id === instance.swcRef);
                  return (
                    <Card key={instance.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{instance.instanceName}</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSWCInstance(selectedComposition.id, instance.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <CardDescription>Instance of {swc?.name}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">SWC Type:</span>
                            <span>{swc?.category}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ports:</span>
                            <span>{swc?.ports.length || 0}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="connectors" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">
                  Connectors - {selectedComposition.name}
                </h3>
                <Dialog open={isConnectorDialogOpen} onOpenChange={setIsConnectorDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Link className="mr-2 h-4 w-4" />
                      Add Connector
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Connector</DialogTitle>
                      <DialogDescription>
                        Create a connection between SWC instances
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="connector-name">Name</Label>
                        <Input
                          id="connector-name"
                          value={connectorForm.name}
                          onChange={(e) => setConnectorForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Auto-generated if empty"
                        />
                      </div>
                      <div>
                        <Label htmlFor="source-instance">Source Instance *</Label>
                        <Select
                          value={connectorForm.sourceInstanceId}
                          onValueChange={(value) => setConnectorForm(prev => ({ ...prev, sourceInstanceId: value, sourcePortId: '' }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select source instance" />
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
                      {connectorForm.sourceInstanceId && (
                        <div>
                          <Label htmlFor="source-port">Source Port</Label>
                          <Select
                            value={connectorForm.sourcePortId}
                            onValueChange={(value) => setConnectorForm(prev => ({ ...prev, sourcePortId: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select source port" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailablePorts(connectorForm.sourceInstanceId)
                                .filter(port => port.direction === 'provided')
                                .map((port) => (
                                <SelectItem key={port.id} value={port.id}>
                                  {port.name} (P-Port)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div>
                        <Label htmlFor="target-instance">Target Instance *</Label>
                        <Select
                          value={connectorForm.targetInstanceId}
                          onValueChange={(value) => setConnectorForm(prev => ({ ...prev, targetInstanceId: value, targetPortId: '' }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select target instance" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedComposition.swcInstances
                              .filter(instance => instance.id !== connectorForm.sourceInstanceId)
                              .map((instance) => (
                              <SelectItem key={instance.id} value={instance.id}>
                                {instance.instanceName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {connectorForm.targetInstanceId && (
                        <div>
                          <Label htmlFor="target-port">Target Port</Label>
                          <Select
                            value={connectorForm.targetPortId}
                            onValueChange={(value) => setConnectorForm(prev => ({ ...prev, targetPortId: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select target port" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailablePorts(connectorForm.targetInstanceId)
                                .filter(port => port.direction === 'required')
                                .map((port) => (
                                <SelectItem key={port.id} value={port.id}>
                                  {port.name} (R-Port)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsConnectorDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddConnector}>
                          Add Connector
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4">
                {selectedComposition.connectors.map((connector) => {
                  const sourceInstance = selectedComposition.swcInstances.find(i => i.id === connector.sourceInstanceId);
                  const targetInstance = selectedComposition.swcInstances.find(i => i.id === connector.targetInstanceId);
                  const sourceSwc = currentProject.swcs.find(s => s.id === sourceInstance?.swcRef);
                  const targetSwc = currentProject.swcs.find(s => s.id === targetInstance?.swcRef);
                  const sourcePort = sourceSwc?.ports.find(p => p.id === connector.sourcePortId);
                  const targetPort = targetSwc?.ports.find(p => p.id === connector.targetPortId);
                  
                  return (
                    <Card key={connector.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{connector.name}</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeECUConnector(selectedComposition.id, connector.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <CardDescription>
                          {sourceInstance?.instanceName} → {targetInstance?.instanceName}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Source Port:</span>
                            <span>{sourcePort?.name || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Target Port:</span>
                            <span>{targetPort?.name || 'N/A'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Edit Composition Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit ECU Composition</DialogTitle>
            <DialogDescription>
              Update the ECU composition details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-comp-name">Name *</Label>
              <Input
                id="edit-comp-name"
                value={compositionForm.name}
                onChange={(e) => setCompositionForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter composition name"
              />
            </div>
            <div>
              <Label htmlFor="edit-comp-description">Description</Label>
              <Textarea
                id="edit-comp-description"
                value={compositionForm.description}
                onChange={(e) => setCompositionForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter composition description"
              />
            </div>
            <div>
              <Label htmlFor="edit-comp-ecu-type">ECU Type</Label>
              <Select
                value={compositionForm.ecuType}
                onValueChange={(value) => setCompositionForm(prev => ({ ...prev, ecuType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ApplicationECU">Application ECU</SelectItem>
                  <SelectItem value="GatewayECU">Gateway ECU</SelectItem>
                  <SelectItem value="SensorECU">Sensor ECU</SelectItem>
                  <SelectItem value="ActuatorECU">Actuator ECU</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-comp-autosar-version">AUTOSAR Version</Label>
              <Select
                value={compositionForm.autosarVersion}
                onValueChange={(value) => setCompositionForm(prev => ({ ...prev, autosarVersion: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4.3.1">4.3.1</SelectItem>
                  <SelectItem value="4.4.0">4.4.0</SelectItem>
                  <SelectItem value="4.5.0">4.5.0</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateComposition}>
                <Save className="mr-2 h-4 w-4" />
                Update Composition
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ECUCompositionEditor;
