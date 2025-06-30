
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAutosarStore, Port } from "@/store/autosarStore";

interface EditPortDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  port: Port | null;
}

const EditPortDialog = ({ open, onOpenChange, port }: EditPortDialogProps) => {
  const { toast } = useToast();
  const { currentProject, updatePort } = useAutosarStore();
  
  const [name, setName] = useState("");
  const [direction, setDirection] = useState<'provided' | 'required'>("required");
  const [interfaceRef, setInterfaceRef] = useState("");

  useEffect(() => {
    if (port) {
      setName(port.name);
      setDirection(port.direction);
      setInterfaceRef(port.interfaceRef);
    }
  }, [port]);

  const handleSave = () => {
    if (!port || !name || !interfaceRef) {
      toast({
        title: "Validation Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    updatePort(port.id, {
      name,
      direction,
      interfaceRef,
    });

    toast({
      title: "Port Updated",
      description: `Port ${name} has been updated successfully`,
    });

    onOpenChange(false);
  };

  const resetForm = () => {
    setName("");
    setDirection("required");
    setInterfaceRef("");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Port</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="port-name">Port Name *</Label>
            <Input 
              id="port-name" 
              placeholder="Enter port name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="port-direction">Direction *</Label>
            <Select value={direction} onValueChange={(value) => setDirection(value as 'provided' | 'required')}>
              <SelectTrigger id="port-direction">
                <SelectValue placeholder="Select direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="required">Required (R-Port)</SelectItem>
                <SelectItem value="provided">Provided (P-Port)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="interface-selection">Port Interface *</Label>
            <Select value={interfaceRef} onValueChange={setInterfaceRef}>
              <SelectTrigger id="interface-selection">
                <SelectValue placeholder="Select interface" />
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
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button className="autosar-button" onClick={handleSave}>
            Update Port
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPortDialog;
