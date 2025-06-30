import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Cable, Plus, ArrowDown, ArrowUp, Edit, Trash2, Settings } from "lucide-react";
import { useAutosarStore, Interface, DataElement } from "@/store/autosarStore";
import { useSearchParams } from "react-router-dom";

const PortEditor = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const selectedSwcId = searchParams.get('swc');
  
  const { 
    currentProject, 
    createPort, 
    updatePort, 
    deletePort,
    createInterface,
    updateInterface,
    deleteInterface
  } = useAutosarStore();
  
  const [isCreatePortDialogOpen, setIsCreatePortDialogOpen] = useState(false);
  const [isCreateInterfaceDialogOpen, setIsCreateInterfaceDialogOpen] = useState(false);
  const [selectedSWC, setSelectedSWC] = useState(selectedSwcId || "");
  
  // Port form states
  const [portName, setPortName] = useState("");
  const [portDirection, setPortDirection] = useState<"provided" | "required">("provided");
  const [portInterface, setPortInterface] = useState("");
  
  // Interface form states
  const [interfaceName, setInterfaceName] = useState("");
  const [interfaceType, setInterfaceType] = useState<Interface['type']>("SenderReceiver");
  const [dataElements, setDataElements] = useState<{name: string; dataTypeRef: string}[]>([]);

  const resetPortForm = () => {
    setPortName("");
    setPortDirection("provided");
    setPortInterface("");
  };

  const resetInterfaceForm = () => {
    setInterfaceName("");
    setInterfaceType("SenderReceiver");
    setDataElements([]);
  };

  const handleCreatePort = () => {
    if (!portName || !portInterface || !selectedSWC) {
      toast({
        title: "Validation Error",
        description: "Port name, interface, and SWC selection are required",
        variant: "destructive",
      });
      return;
    }

    createPort({
      name: portName,
      direction: portDirection,
      interfaceRef: portInterface,
      swcId: selectedSWC,
    });

    toast({
      title: "Port Created",
      description: `${portName} has been created successfully`,
    });

    resetPortForm();
    setIsCreatePortDialogOpen(false);
  };

  const handleCreateInterface = () => {
    if (!interfaceName) {
      toast({
        title: "Validation Error", 
        description: "Interface name is required",
        variant: "destructive",
      });
      return;
    }

    // Convert simple data elements to full DataElement objects
    const fullDataElements: DataElement[] = dataElements.map(element => ({
      id: crypto.randomUUID(),
      name: element.name,
      applicationDataTypeRef: element.dataTypeRef,
      category: 'primitive',
      description: '',
    }));

    createInterface({
      name: interfaceName,
      type: interfaceType,
      ...(interfaceType === "SenderReceiver" && { dataElements: fullDataElements }),
    });

    toast({
      title: "Interface Created",
      description: `${interfaceName} has been created successfully`,
    });

    resetInterfaceForm();
    setIsCreateInterfaceDialogOpen(false);
  };

  const handleDeletePort = (portId: string) => {
    deletePort(portId);
    toast({
      title: "Port Deleted",
      description: "Port has been deleted",
    });
  };

  const addDataElement = () => {
    setDataElements([...dataElements, { name: "", dataTypeRef: "" }]);
  };

  const updateDataElement = (index: number, field: 'name' | 'dataTypeRef', value: string) => {
    const updated = [...dataElements];
    updated[index][field] = value;
    setDataElements(updated);
  };

  const removeDataElement = (index: number) => {
    setDataElements(dataElements.filter((_, i) => i !== index));
  };

  if (!currentProject) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-12">
          <Cable className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">No Project Loaded</h2>
          <p className="text-muted-foreground mb-4">
            Please create or load a project to manage ports
          </p>
          <Button onClick={() => window.location.href = '/projects'}>
            Go to Projects
          </Button>
        </div>
      </div>
    );
  }

  const currentSWC = selectedSWC ? currentProject.swcs.find(swc => swc.id === selectedSWC) : null;
  const providedPorts = currentSWC?.ports.filter(p => p.direction === "provided") || [];
  const requiredPorts = currentSWC?.ports.filter(p => p.direction === "required") || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Port & Interface Editor</h1>
          <p className="text-muted-foreground mt-1">
            Design and manage component ports and their interfaces
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateInterfaceDialogOpen} onOpenChange={setIsCreateInterfaceDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Create Interface
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Interface</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="interface-name">Interface Name *</Label>
                    <Input
                      id="interface-name"
                      placeholder="e.g., EngineSpeed_IF"
                      value={interfaceName}
                      onChange={(e) => setInterfaceName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="interface-type">Interface Type *</Label>
                    <Select value={interfaceType} onValueChange={(value: Interface['type']) => setInterfaceType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger> 
                      <SelectContent>
                        <SelectItem value="SenderReceiver">Sender/Receiver</SelectItem>
                        <SelectItem value="ClientServer">Client/Server</SelectItem>
                        <SelectItem value="ModeSwitch">Mode Switch</SelectItem>
                        <SelectItem value="Parameter">Parameter</SelectItem>
                        <SelectItem value="Trigger">Trigger</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {interfaceType === "SenderReceiver" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Data Elements</Label>
                      <Button type="button" size="sm" onClick={addDataElement}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Element
                      </Button>
                    </div>
                    {dataElements.map((element, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Input
                          placeholder="Element name"
                          value={element.name}
                          onChange={(e) => updateDataElement(index, 'name', e.target.value)}
                        />
                        <Select 
                          value={element.dataTypeRef} 
                          onValueChange={(value) => updateDataElement(index, 'dataTypeRef', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Data Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {currentProject.dataTypes.map((dt) => (
                              <SelectItem key={dt.id} value={dt.name}>{dt.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeDataElement(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => {
                    setIsCreateInterfaceDialogOpen(false);
                    resetInterfaceForm();
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateInterface} className="autosar-button">
                    Create Interface
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreatePortDialogOpen} onOpenChange={setIsCreatePortDialogOpen}>
            <DialogTrigger asChild>
              <Button className="autosar-button flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Port
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Port</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="swc-select">Target SWC *</Label>
                  <Select value={selectedSWC} onValueChange={setSelectedSWC}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select SWC" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentProject.swcs.map((swc) => (
                        <SelectItem key={swc.id} value={swc.id}>{swc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="port-name">Port Name *</Label>
                  <Input
                    id="port-name"
                    placeholder="e.g., PP_EngineSpeed"
                    value={portName}
                    onChange={(e) => setPortName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="port-direction">Direction *</Label>
                  <Select value={portDirection} onValueChange={(value: "provided" | "required") => setPortDirection(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="provided">Provided Port (P-Port)</SelectItem>
                      <SelectItem value="required">Required Port (R-Port)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="port-interface">Interface *</Label>
                  <Select value={portInterface} onValueChange={setPortInterface}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select interface" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentProject.interfaces.map((interface_) => (
                        <SelectItem key={interface_.id} value={interface_.id}>
                          {interface_.name} ({interface_.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => {
                    setIsCreatePortDialogOpen(false);
                    resetPortForm();
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePort} className="autosar-button">
                    Create Port
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* SWC Selection */}
      {!selectedSwcId && (
        <Card className="autosar-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Label>Select SWC to manage ports:</Label>
              <Select value={selectedSWC} onValueChange={setSelectedSWC}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Choose SWC" />
                </SelectTrigger>
                <SelectContent>
                  {currentProject.swcs.map((swc) => (
                    <SelectItem key={swc.id} value={swc.id}>{swc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {currentSWC && (
        <>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Ports for: {currentSWC.name}</h2>
            <p className="text-muted-foreground">Total ports: {currentSWC.ports.length}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="autosar-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUp className="h-5 w-5 text-green-500" />
                  Provided Ports (P-Port)
                </CardTitle>
                <CardDescription>
                  Ports that provide services to other components ({providedPorts.length})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {providedPorts.length > 0 ? (
                  <div className="space-y-3">
                    {providedPorts.map((port) => {
                      const interface_ = currentProject.interfaces.find(i => i.id === port.interfaceRef);
                      return (
                        <div key={port.id} className="p-3 rounded-lg border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{port.name}</h4>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeletePort(port.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>Interface: {interface_?.name || "Unknown"}</p>
                            <p>Type: {interface_?.type || "N/A"}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Cable className="h-8 w-8 mx-auto mb-3 opacity-50" />
                    <p>No provided ports configured</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="autosar-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDown className="h-5 w-5 text-blue-500" />
                  Required Ports (R-Port)
                </CardTitle>
                <CardDescription>
                  Ports that require services from other components ({requiredPorts.length})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {requiredPorts.length > 0 ? (
                  <div className="space-y-3">
                    {requiredPorts.map((port) => {
                      const interface_ = currentProject.interfaces.find(i => i.id === port.interfaceRef);
                      return (
                        <div key={port.id} className="p-3 rounded-lg border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{port.name}</h4>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeletePort(port.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>Interface: {interface_?.name || "Unknown"}</p>
                            <p>Type: {interface_?.type || "N/A"}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Cable className="h-8 w-8 mx-auto mb-3 opacity-50" />
                    <p>No required ports configured</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Available Interfaces */}
      <Card className="autosar-card">
        <CardHeader>
          <CardTitle>Available Interfaces ({currentProject.interfaces.length})</CardTitle>
          <CardDescription>
            Interfaces that can be assigned to ports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentProject.interfaces.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentProject.interfaces.map((interface_) => (
                <div key={interface_.id} className="p-3 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{interface_.name}</h4>
                    <Badge variant="outline">{interface_.type}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {interface_.dataElements && (
                      <p>Data Elements: {interface_.dataElements.length}</p>
                    )}
                    {interface_.operations && (
                      <p>Operations: {interface_.operations.length}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>No interfaces defined yet</p>
              <Button 
                variant="outline" 
                className="mt-3"
                onClick={() => setIsCreateInterfaceDialogOpen(true)}
              >
                Create Interface
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PortEditor;
