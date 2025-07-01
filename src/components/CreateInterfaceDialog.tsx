
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus, X } from "lucide-react";
import { useAutosarStore, DataElement } from "@/store/autosarStore";

const CreateInterfaceDialog = () => {
  const { toast } = useToast();
  const { currentProject, createInterface } = useAutosarStore();
  
  const [open, setOpen] = useState(false);
  const [interfaceName, setInterfaceName] = useState("");
  const [interfaceType, setInterfaceType] = useState<'SenderReceiver' | 'ClientServer'>("SenderReceiver");
  const [selectedDataElements, setSelectedDataElements] = useState<string[]>([]);

  const availableDataTypes = [
    { name: "uint8", type: "primitive" },
    { name: "uint16", type: "primitive" },
    { name: "uint32", type: "primitive" },
    { name: "float32", type: "primitive" },
    { name: "boolean", type: "primitive" },
    ...currentProject?.dataTypes.map(dt => ({ name: dt.name, type: dt.category })) || []
  ];

  const handleAddDataElement = () => {
    const newElementName = `DataElement_${selectedDataElements.length + 1}`;
    setSelectedDataElements(prev => [...prev, newElementName]);
  };

  const handleRemoveDataElement = (index: number) => {
    setSelectedDataElements(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreate = () => {
    if (!interfaceName) {
      toast({
        title: "Validation Error",
        description: "Interface name is required",
        variant: "destructive",
      });
      return;
    }

    const dataElements: DataElement[] = selectedDataElements.map((name, index) => ({
      id: `de_${Date.now()}_${index}`,
      name,
      applicationDataTypeRef: "uint32",
      category: "VALUE",
      description: `Data element ${name}`,
    }));

    createInterface({
      name: interfaceName,
      type: interfaceType,
      dataElements,
    });

    toast({
      title: "Interface Created",
      description: `Interface ${interfaceName} has been created successfully`,
    });

    // Reset form
    setInterfaceName("");
    setInterfaceType("SenderReceiver");
    setSelectedDataElements([]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="autosar-button">
          <Plus className="h-4 w-4 mr-2" />
          Add Interface
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Port Interface</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="interface-name">Interface Name *</Label>
            <Input 
              id="interface-name" 
              placeholder="Enter interface name" 
              value={interfaceName}
              onChange={(e) => setInterfaceName(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="interface-type">Interface Type *</Label>
            <Select value={interfaceType} onValueChange={(value) => setInterfaceType(value as 'SenderReceiver' | 'ClientServer')}>
              <SelectTrigger id="interface-type">
                <SelectValue placeholder="Select interface type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SenderReceiver">Sender-Receiver</SelectItem>
                <SelectItem value="ClientServer">Client-Server</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Data Elements</Label>
            <div className="space-y-2">
              {selectedDataElements.map((element, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  <Input 
                    value={element}
                    onChange={(e) => {
                      const newElements = [...selectedDataElements];
                      newElements[index] = e.target.value;
                      setSelectedDataElements(newElements);
                    }}
                    placeholder="Data element name"
                  />
                  <Select defaultValue="uint32">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDataTypes.map((dt) => (
                        <SelectItem key={dt.name} value={dt.name}>
                          {dt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveDataElement(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={handleAddDataElement}>
                <Plus className="h-4 w-4 mr-2" />
                Add Data Element
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button className="autosar-button" onClick={handleCreate}>
            Create Interface
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateInterfaceDialog;
