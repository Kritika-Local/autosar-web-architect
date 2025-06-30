
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Settings, Plus, Edit, Trash2, Play, Database, Eye, PenTool, Phone, Clock, Zap } from "lucide-react";
import { useAutosarStore, Runnable, AccessPoint } from "@/store/autosarStore";

const BehaviorDesigner = () => {
  const { toast } = useToast();
  const { 
    currentProject, 
    createRunnable, 
    updateRunnable, 
    deleteRunnable,
    addAccessPoint,
    updateAccessPoint,
    removeAccessPoint
  } = useAutosarStore();
  
  const [isCreateRunnableDialogOpen, setIsCreateRunnableDialogOpen] = useState(false);
  const [isAccessPointDialogOpen, setIsAccessPointDialogOpen] = useState(false);
  const [selectedSWC, setSelectedSWC] = useState("");
  const [selectedRunnable, setSelectedRunnable] = useState<Runnable | null>(null);
  
  // Runnable form states
  const [runnableName, setRunnableName] = useState("");
  const [runnableType, setRunnableType] = useState<"init" | "periodic" | "event">("periodic");
  const [period, setPeriod] = useState<number>(100);
  const [canBeInvokedConcurrently, setCanBeInvokedConcurrently] = useState(false);
  
  // Access point form states
  const [accessPointName, setAccessPointName] = useState("");
  const [accessPointType, setAccessPointType] = useState<"iRead" | "iWrite" | "iCall">("iRead");
  const [accessType, setAccessType] = useState<"implicit" | "explicit">("implicit");
  const [selectedPort, setSelectedPort] = useState("");
  const [selectedDataElement, setSelectedDataElement] = useState("");

  const resetRunnableForm = () => {
    setRunnableName("");
    setRunnableType("periodic");
    setPeriod(100);
    setCanBeInvokedConcurrently(false);
  };

  const resetAccessPointForm = () => {
    setAccessPointName("");
    setAccessPointType("iRead");
    setAccessType("implicit");
    setSelectedPort("");
    setSelectedDataElement("");
  };

  const handleCreateRunnable = () => {
    if (!runnableName || !selectedSWC) {
      toast({
        title: "Validation Error",
        description: "Runnable name and SWC selection are required",
        variant: "destructive",
      });
      return;
    }

    const runnableData = {
      name: runnableName,
      swcId: selectedSWC,
      runnableType,
      canBeInvokedConcurrently,
      events: [],
      ...(runnableType === "periodic" && { period })
    };

    createRunnable(runnableData);

    toast({
      title: "Runnable Created",
      description: `${runnableName} (${runnableType}) has been created successfully`,
    });

    resetRunnableForm();
    setIsCreateRunnableDialogOpen(false);
  };

  const handleAddAccessPoint = () => {
    if (!selectedRunnable || !accessPointName || !selectedPort || !selectedDataElement) {
      toast({
        title: "Validation Error",
        description: "All access point fields are required",
        variant: "destructive",
      });
      return;
    }

    addAccessPoint(selectedRunnable.id, {
      name: accessPointName,
      type: accessPointType,
      access: accessType,
      swcId: selectedRunnable.swcId,
      runnableId: selectedRunnable.id,
      portRef: selectedPort,
      dataElementRef: selectedDataElement,
    });

    toast({
      title: "Access Point Added",
      description: `${accessPointName} (${accessPointType}) has been added to ${selectedRunnable.name}`,
    });

    resetAccessPointForm();
    setIsAccessPointDialogOpen(false);
  };

  const handleDeleteRunnable = (runnableId: string) => {
    deleteRunnable(runnableId);
    toast({
      title: "Runnable Deleted",
      description: "Runnable has been deleted",
    });
  };

  const handleRemoveAccessPoint = (runnableId: string, accessPointId: string) => {
    removeAccessPoint(runnableId, accessPointId);
    toast({
      title: "Access Point Removed",
      description: "Access point has been removed",
    });
  };

  const getRunnableIcon = (type: string) => {
    switch (type) {
      case 'init': return Zap;
      case 'periodic': return Clock;
      case 'event': return Play;
      default: return Play;
    }
  };

  const getAccessPointIcon = (type: string) => {
    switch (type) {
      case 'iRead': return Eye;
      case 'iWrite': return PenTool;
      case 'iCall': return Phone;
      default: return Database;
    }
  };

  if (!currentProject) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-12">
          <Settings className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">No Project Loaded</h2>
          <p className="text-muted-foreground mb-4">
            Please create or load a project to design behavior
          </p>
          <Button onClick={() => window.location.href = '/projects'}>
            Go to Projects
          </Button>
        </div>
      </div>
    );
  }

  const currentSWC = selectedSWC ? currentProject.swcs.find(swc => swc.id === selectedSWC) : null;
  const availablePorts = currentSWC?.ports || [];
  const availableDataElements: Array<{portId: string; portName: string; element: any}> = [];
  
  // Collect all data elements from interfaces assigned to ports
  availablePorts.forEach(port => {
    const interface_ = currentProject.interfaces.find(i => i.id === port.interfaceRef);
    if (interface_?.dataElements) {
      interface_.dataElements.forEach(element => {
        availableDataElements.push({
          portId: port.id,
          portName: port.name,
          element
        });
      });
    }
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Internal Behavior Designer</h1>
          <p className="text-muted-foreground mt-1">
            Configure runnables, events, and access points with AUTOSAR compliance
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAccessPointDialogOpen} onOpenChange={setIsAccessPointDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={!selectedRunnable}>
                <Database className="h-4 w-4 mr-2" />
                Add Access Point
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Access Point</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ap-name">Access Point Name *</Label>
                  <Input
                    id="ap-name"
                    placeholder="e.g., AP_EngineSpeed_iRead"
                    value={accessPointName}
                    onChange={(e) => setAccessPointName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ap-type">Access Type *</Label>
                    <Select value={accessPointType} onValueChange={(value: "iRead" | "iWrite" | "iCall") => setAccessPointType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="iRead">iRead (Data Read)</SelectItem>
                        <SelectItem value="iWrite">iWrite (Data Write)</SelectItem>
                        <SelectItem value="iCall">iCall (Operation Call)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="access-mode">Access Mode *</Label>
                    <Select value={accessType} onValueChange={(value: "implicit" | "explicit") => setAccessType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="implicit">Implicit</SelectItem>
                        <SelectItem value="explicit">Explicit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="ap-port">Target Port *</Label>
                  <Select value={selectedPort} onValueChange={setSelectedPort}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select port" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePorts.map((port) => (
                        <SelectItem key={port.id} value={port.id}>
                          {port.name} ({port.direction})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ap-data-element">Data Element *</Label>
                  <Select value={selectedDataElement} onValueChange={setSelectedDataElement}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select data element" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDataElements
                        .filter(de => de.portId === selectedPort)
                        .map((de, index) => (
                          <SelectItem key={index} value={de.element.name}>
                            {de.element.name} ({de.element.applicationDataTypeRef})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => {
                    setIsAccessPointDialogOpen(false);
                    resetAccessPointForm();
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddAccessPoint} className="autosar-button">
                    Add Access Point
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateRunnableDialogOpen} onOpenChange={setIsCreateRunnableDialogOpen}>
            <DialogTrigger asChild>
              <Button className="autosar-button flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Runnable
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Runnable</DialogTitle>
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
                  <Label htmlFor="runnable-name">Runnable Name *</Label>
                  <Input
                    id="runnable-name"
                    placeholder="e.g., RE_EngineControl_100ms"
                    value={runnableName}
                    onChange={(e) => setRunnableName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="runnable-type">Runnable Type *</Label>
                  <Select value={runnableType} onValueChange={(value: "init" | "periodic" | "event") => setRunnableType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="init">Init Runnable</SelectItem>
                      <SelectItem value="periodic">Periodic Runnable</SelectItem>
                      <SelectItem value="event">Event-based Runnable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {runnableType === "periodic" && (
                  <div>
                    <Label htmlFor="period">Period (ms) *</Label>
                    <Input
                      id="period"
                      type="number"
                      placeholder="100"
                      value={period}
                      onChange={(e) => setPeriod(parseInt(e.target.value) || 100)}
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="concurrent"
                    checked={canBeInvokedConcurrently}
                    onCheckedChange={(checked) => setCanBeInvokedConcurrently(!!checked)}
                  />
                  <Label htmlFor="concurrent">Can be invoked concurrently</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => {
                    setIsCreateRunnableDialogOpen(false);
                    resetRunnableForm();
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRunnable} className="autosar-button">
                    Create Runnable
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* SWC Selection */}
      <Card className="autosar-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Label>Select SWC to manage behavior:</Label>
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

      {currentSWC && (
        <>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Runnables for: {currentSWC.name}</h2>
            <p className="text-muted-foreground">Total runnables: {currentSWC.runnables.length}</p>
          </div>

          {/* Runnables List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {currentSWC.runnables.map((runnable) => {
              const IconComponent = getRunnableIcon(runnable.runnableType);
              return (
                <Card key={runnable.id} className="autosar-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <IconComponent className="h-5 w-5" />
                          {runnable.name}
                        </CardTitle>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="capitalize">
                            {runnable.runnableType}
                          </Badge>
                          {runnable.period && (
                            <Badge variant="secondary">
                              {runnable.period}ms
                            </Badge>
                          )}
                          <Badge variant={runnable.canBeInvokedConcurrently ? "default" : "secondary"}>
                            {runnable.canBeInvokedConcurrently ? "Concurrent" : "Sequential"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedRunnable(runnable);
                            setIsAccessPointDialogOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteRunnable(runnable.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Access Points:</span>
                        <span className="font-medium">{runnable.accessPoints.length}</span>
                      </div>
                      
                      {runnable.accessPoints.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm">Access Points:</Label>
                          {runnable.accessPoints.map((ap) => {
                            const APIcon = getAccessPointIcon(ap.type);
                            return (
                              <div key={ap.id} className="flex items-center justify-between p-2 rounded border border-border">
                                <div className="flex items-center gap-2">
                                  <APIcon className={`h-4 w-4 ${
                                    ap.type === 'iRead' ? 'text-blue-500' : 
                                    ap.type === 'iWrite' ? 'text-green-500' : 'text-purple-500'
                                  }`} />
                                  <div>
                                    <p className="text-sm font-medium">{ap.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {ap.type} • {ap.access} • {ap.dataElementRef || 'N/A'}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveAccessPoint(runnable.id, ap.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {currentSWC.runnables.length === 0 && (
            <Card className="autosar-card">
              <CardContent className="text-center py-12">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">No runnables configured</p>
                <Button 
                  onClick={() => setIsCreateRunnableDialogOpen(true)}
                  className="autosar-button"
                >
                  Create Runnable
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default BehaviorDesigner;
