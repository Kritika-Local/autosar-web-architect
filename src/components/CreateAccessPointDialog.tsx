
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";
import { useAutosarStore } from "@/store/autosarStore";

interface CreateAccessPointDialogProps {
  runnableId: string;
  swcId: string;
}

const CreateAccessPointDialog = ({ runnableId, swcId }: CreateAccessPointDialogProps) => {
  const { toast } = useToast();
  const { currentProject, addAccessPoint, generateRteAccessPointName } = useAutosarStore();
  
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<'iRead' | 'iWrite' | 'iCall'>("iRead");
  const [access, setAccess] = useState<'implicit' | 'explicit'>("implicit");
  const [selectedPortId, setSelectedPortId] = useState("");
  const [selectedDataElementId, setSelectedDataElementId] = useState("");

  // Get the current SWC and its ports
  const currentSwc = currentProject?.swcs.find(swc => swc.id === swcId);
  const availablePorts = currentSwc?.ports || [];
  
  // Get data elements from the selected port's interface
  const selectedPort = availablePorts.find(port => port.id === selectedPortId);
  const selectedInterface = currentProject?.interfaces.find(iface => iface.id === selectedPort?.interfaceRef);
  const availableDataElements = selectedInterface?.dataElements || [];

  const handleGenerateRteName = () => {
    if (selectedPortId && selectedDataElementId) {
      const port = availablePorts.find(p => p.id === selectedPortId);
      const dataElement = availableDataElements.find(de => de.id === selectedDataElementId);
      
      if (port && dataElement) {
        const accessType = type === 'iRead' ? 'Read' : 'Write';
        const rteName = generateRteAccessPointName(port.name, dataElement.name, accessType);
        setName(rteName);
      }
    }
  };

  const handleCreate = () => {
    if (!name || !selectedPortId || !selectedDataElementId) {
      toast({
        title: "Validation Error",
        description: "Name, Port Prototype, and Data Element are required",
        variant: "destructive",
      });
      return;
    }

    addAccessPoint(runnableId, {
      name,
      type,
      access,
      swcId,
      runnableId,
      portRef: selectedPortId,
      dataElementRef: selectedDataElementId,
    });

    toast({
      title: "Access Point Created",
      description: `RTE access point ${name} has been created successfully`,
    });

    // Reset form
    setName("");
    setType("iRead");
    setAccess("implicit");
    setSelectedPortId("");
    setSelectedDataElementId("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="autosar-button">
          <Plus className="h-4 w-4 mr-1" />
          Add RTE Access Point
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create RTE Access Point</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="access-type">Access Type *</Label>
            <Select value={type} onValueChange={(value) => setType(value as 'iRead' | 'iWrite' | 'iCall')}>
              <SelectTrigger id="access-type">
                <SelectValue placeholder="Select access type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="iRead">Read Data</SelectItem>
                <SelectItem value="iWrite">Write Data</SelectItem>
                <SelectItem value="iCall">Service Call</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="port-prototype">Port Prototype *</Label>
            <Select value={selectedPortId} onValueChange={(value) => {
              setSelectedPortId(value);
              setSelectedDataElementId(""); // Reset data element when port changes
              setName(""); // Reset name when port changes
            }}>
              <SelectTrigger id="port-prototype">
                <SelectValue placeholder="Select port prototype" />
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

          <div className="grid gap-2">
            <Label htmlFor="data-element">Data Element *</Label>
            <Select 
              value={selectedDataElementId} 
              onValueChange={(value) => {
                setSelectedDataElementId(value);
                setName(""); // Reset name when data element changes
              }}
              disabled={!selectedPortId}
            >
              <SelectTrigger id="data-element">
                <SelectValue placeholder="Select data element" />
              </SelectTrigger>
              <SelectContent>
                {availableDataElements.map((dataElement) => (
                  <SelectItem key={dataElement.id} value={dataElement.id}>
                    {dataElement.name} ({dataElement.applicationDataTypeRef})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="access-point-name">RTE Function Name *</Label>
            <div className="flex gap-2">
              <Input 
                id="access-point-name" 
                placeholder="Rte_Read_<Port>_<DataElement>" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                onClick={handleGenerateRteName}
                disabled={!selectedPortId || !selectedDataElementId}
              >
                Generate RTE
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="access-mode">Access Mode</Label>
            <Select value={access} onValueChange={(value) => setAccess(value as 'implicit' | 'explicit')}>
              <SelectTrigger id="access-mode">
                <SelectValue placeholder="Select access mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="implicit">Implicit</SelectItem>
                <SelectItem value="explicit">Explicit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button className="autosar-button" onClick={handleCreate}>
            Create RTE Access Point
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAccessPointDialog;
