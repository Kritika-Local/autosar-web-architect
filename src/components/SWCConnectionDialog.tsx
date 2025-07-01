
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Cable } from "lucide-react";
import { useAutosarStore } from "@/store/autosarStore";

const SWCConnectionDialog = () => {
  const { toast } = useToast();
  const { currentProject, createConnection } = useAutosarStore();
  
  const [open, setOpen] = useState(false);
  const [connectionName, setConnectionName] = useState("");
  const [sourceSwcId, setSourceSwcId] = useState("");
  const [sourcePortId, setSourcePortId] = useState("");
  const [targetSwcId, setTargetSwcId] = useState("");
  const [targetPortId, setTargetPortId] = useState("");

  const sourceSwc = currentProject?.swcs.find(swc => swc.id === sourceSwcId);
  const targetSwc = currentProject?.swcs.find(swc => swc.id === targetSwcId);
  
  const sourceProvidedPorts = sourceSwc?.ports?.filter(port => port.direction === 'provided') || [];
  const targetRequiredPorts = targetSwc?.ports?.filter(port => port.direction === 'required') || [];

  const handleCreate = () => {
    if (!connectionName || !sourceSwcId || !sourcePortId || !targetSwcId || !targetPortId) {
      toast({
        title: "Validation Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    // Validate that source port is provided and target port is required
    const sourcePort = sourceSwc?.ports?.find(p => p.id === sourcePortId);
    const targetPort = targetSwc?.ports?.find(p => p.id === targetPortId);
    
    if (sourcePort?.direction !== 'provided') {
      toast({
        title: "Validation Error",
        description: "Source port must be a Provided Port (P-Port)",
        variant: "destructive",
      });
      return;
    }
    
    if (targetPort?.direction !== 'required') {
      toast({
        title: "Validation Error",
        description: "Target port must be a Required Port (R-Port)",
        variant: "destructive",
      });
      return;
    }

    // Validate that both ports use the same interface
    if (sourcePort?.interfaceRef !== targetPort?.interfaceRef) {
      toast({
        title: "Validation Error",
        description: "Source and target ports must use the same interface",
        variant: "destructive",
      });
      return;
    }

    createConnection({
      name: connectionName,
      sourceSwcId,
      sourcePortId,
      targetSwcId,
      targetPortId,
      providingComponent: sourceSwcId,
      requiringComponent: targetSwcId,
      providingPort: sourcePortId,
      requiringPort: targetPortId,
      interfaceRef: sourcePort?.interfaceRef || '',
    });

    toast({
      title: "Connection Created",
      description: `Connection ${connectionName} has been created successfully`,
    });

    // Reset form
    setConnectionName("");
    setSourceSwcId("");
    setSourcePortId("");
    setTargetSwcId("");
    setTargetPortId("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="autosar-button">
          <Cable className="h-4 w-4 mr-2" />
          Connect SWCs
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create SWC Connection</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="connection-name">Connection Name *</Label>
            <Input 
              id="connection-name" 
              placeholder="Enter connection name" 
              value={connectionName}
              onChange={(e) => setConnectionName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <h3 className="font-medium">Source (Provided Port)</h3>
              
              <div className="grid gap-2">
                <Label htmlFor="source-swc">Source SWC *</Label>
                <Select value={sourceSwcId} onValueChange={(value) => {
                  setSourceSwcId(value);
                  setSourcePortId(""); // Reset port selection
                }}>
                  <SelectTrigger id="source-swc">
                    <SelectValue placeholder="Select source SWC" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentProject?.swcs.map((swc) => (
                      <SelectItem key={swc.id} value={swc.id}>
                        {swc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="source-port">Source P-Port *</Label>
                <Select value={sourcePortId} onValueChange={setSourcePortId} disabled={!sourceSwcId}>
                  <SelectTrigger id="source-port">
                    <SelectValue placeholder="Select provided port" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceProvidedPorts.map((port) => {
                      const interface_ = currentProject?.interfaces.find(i => i.id === port.interfaceRef);
                      return (
                        <SelectItem key={port.id} value={port.id}>
                          {port.name} ({interface_?.name})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Target (Required Port)</h3>
              
              <div className="grid gap-2">
                <Label htmlFor="target-swc">Target SWC *</Label>
                <Select value={targetSwcId} onValueChange={(value) => {
                  setTargetSwcId(value);
                  setTargetPortId(""); // Reset port selection
                }}>
                  <SelectTrigger id="target-swc">
                    <SelectValue placeholder="Select target SWC" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentProject?.swcs.filter(swc => swc.id !== sourceSwcId).map((swc) => (
                      <SelectItem key={swc.id} value={swc.id}>
                        {swc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="target-port">Target R-Port *</Label>
                <Select value={targetPortId} onValueChange={setTargetPortId} disabled={!targetSwcId}>
                  <SelectTrigger id="target-port">
                    <SelectValue placeholder="Select required port" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetRequiredPorts.map((port) => {
                      const interface_ = currentProject?.interfaces.find(i => i.id === port.interfaceRef);
                      return (
                        <SelectItem key={port.id} value={port.id}>
                          {port.name} ({interface_?.name})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button className="autosar-button" onClick={handleCreate}>
            Create Connection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SWCConnectionDialog;
