
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
import { Settings, Plus, Edit, Trash2, Play, Database, Eye, PenTool } from "lucide-react";
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
  const [canBeInvokedConcurrently, setCanBeInvokedConcurrently] = useState(false);
  
  // Access point form states
  const [accessPointName, setAccessPointName] = useState("");
  const [accessPointType, setAccessPointType] = useState<"read" | "write">("read");
  const [accessType, setAccessType] = useState<"implicit" | "explicit">("implicit");
  const [selectedPort, setSelectedPort] = useState("");
  const [selectedDataElement, setSelectedDataElement] = useState("");

  const resetRunnableForm = () => {
    setRunnableName("");
    setCanBeInvokedConcurrently(false);
  };

  const resetAccessPointForm = () => {
    setAccessPointName("");
    setAccessPointType("read");
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

    createRunnable({
      name: runnableName,
      swcId: selectedSWC,
      canBeInvokedConcurrently,
      events: [],
    });

    toast({
      title: "Runnable Created",
      description: `${runnableName} has been created successfully`,
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
      portRef: selectedPort,
      dataElementRef: selectedDataElement,
    });

    toast({
      title: "Access Point Added",
      description: `${accessPointName} has been added to ${selectedRunnable.name}`,
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
            Configure runnables, events, and access points
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
                    placeholder="e.g., AP_EngineSpeed_Read"
                    value={accessPointName}
                    onChange={(e) => setAccessPointName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ap-type">Access Type *</Label>
                    <Select value={accessPointType} onValueChange={(value: "read" | "write") => setAccessPointType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="read">Read Access</SelectItem>
                        <SelectItem value="write">Write Access</SelectItem>
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
                            {de.element.name} ({de.element.dataTypeRef})
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
            {currentSWC.runnables.map((runnable) => (
              <Card key={runnable.id} className="autosar-card">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Play className="h-5 w-5" />
                        {runnable.name}
                      </CardTitle>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">
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
                        {runnable.accessPoints.map((ap) => (
                          <div key={ap.id} className="flex items-center justify-between p-2 rounded border border-border">
                            <div className="flex items-center gap-2">
                              {ap.type === "read" ? (
                                <Eye className="h-4 w-4 text-blue-500" />
                              ) : (
                                <PenTool className="h-4 w-4 text-green-500" />
                              )}
                              <div>
                                <p className="text-sm font-medium">{ap.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {ap.type} • {ap.access} • {ap.dataElementRef}
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
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
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
