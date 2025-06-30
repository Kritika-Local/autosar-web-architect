
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";
import { useAutosarStore } from "@/store/autosarStore";

const CreatePortDialog = () => {
  const { toast } = useToast();
  const { currentProject, createPort } = useAutosarStore();
  
  const [open, setOpen] = useState(false);
  const [portName, setPortName] = useState("");
  const [direction, setDirection] = useState<'provided' | 'required'>("required");
  const [selectedSwcId, setSelectedSwcId] = useState("");
  const [selectedInterfaceId, setSelectedInterfaceId] = useState("");

  const handleCreate = () => {
    if (!portName || !selectedSwcId || !selectedInterfaceId) {
      toast({
        title: "Validation Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    // Validate interface exists
    const selectedInterface = currentProject?.interfaces.find(int => int.id === selectedInterfaceId);
    if (!selectedInterface) {
      toast({
        title: "Interface Error",
        description: "Selected interface is not valid",
        variant: "destructive",
      });
      return;
    }

    createPort({
      name: portName,
      direction,
      interfaceRef: selectedInterfaceId,
      swcId: selectedSwcId,
    });

    toast({
      title: "Port Created",
      description: `Port ${portName} has been created successfully`,
    });

    // Reset form
    setPortName("");
    setDirection("required");
    setSelectedSwcId("");
    setSelectedInterfaceId("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="autosar-button">
          <Plus className="h-4 w-4 mr-2" />
          Add Port
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Port</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="port-name">Port Name *</Label>
            <Input 
              id="port-name" 
              placeholder="Enter port name" 
              value={portName}
              onChange={(e) => setPortName(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="port-direction">Port Direction *</Label>
            <Select value={direction} onValueChange={(value) => setDirection(value as 'provided' | 'required')}>
              <SelectTrigger id="port-direction">
                <SelectValue placeholder="Select direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="required">Required Port (R-Port)</SelectItem>
                <SelectItem value="provided">Provided Port (P-Port)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="swc-selection">Target SWC *</Label>
            <Select value={selectedSwcId} onValueChange={setSelectedSwcId}>
              <SelectTrigger id="swc-selection">
                <SelectValue placeholder="Select SWC" />
              </SelectTrigger>
              <SelectContent>
                {currentProject?.swcs.map((swc) => (
                  <SelectItem key={swc.id} value={swc.id}>
                    {swc.name} ({swc.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="interface-selection">Port Interface *</Label>
            <Select value={selectedInterfaceId} onValueChange={setSelectedInterfaceId}>
              <SelectTrigger id="interface-selection">
                <SelectValue placeholder="Select port interface" />
              </SelectTrigger>
              <SelectContent>
                {currentProject?.interfaces.map((interface_) => (
                  <SelectItem key={interface_.id} value={interface_.id}>
                    {interface_.name} ({interface_.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button className="autosar-button" onClick={handleCreate}>
            Create Port
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePortDialog;
