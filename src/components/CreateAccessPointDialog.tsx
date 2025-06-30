
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
  const { currentProject, addAccessPoint, generateAccessPointName } = useAutosarStore();
  
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<'iRead' | 'iWrite' | 'iCall'>("iRead");
  const [access, setAccess] = useState<'implicit' | 'explicit'>("implicit");
  const [targetSwcId, setTargetSwcId] = useState(swcId);
  const [targetRunnableId, setTargetRunnableId] = useState(runnableId);

  const selectedSwc = currentProject?.swcs.find(swc => swc.id === targetSwcId);
  const availableRunnables = selectedSwc?.runnables || [];

  const handleGenerateName = () => {
    if (targetSwcId && targetRunnableId) {
      const swc = currentProject?.swcs.find(s => s.id === targetSwcId);
      const runnable = swc?.runnables.find(r => r.id === targetRunnableId);
      if (swc && runnable) {
        const generatedName = generateAccessPointName(swc.name, runnable.name, type);
        setName(generatedName);
      }
    }
  };

  const handleCreate = () => {
    if (!name || !targetSwcId || !targetRunnableId) {
      toast({
        title: "Validation Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    addAccessPoint(runnableId, {
      name,
      type,
      access,
      swcId: targetSwcId,
      runnableId: targetRunnableId,
    });

    toast({
      title: "Access Point Created",
      description: `Access point ${name} has been created successfully`,
    });

    // Reset form
    setName("");
    setType("iRead");
    setAccess("implicit");
    setTargetSwcId(swcId);
    setTargetRunnableId(runnableId);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="autosar-button">
          <Plus className="h-4 w-4 mr-1" />
          Add Access Point
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Access Point</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="access-point-name">Access Point Name *</Label>
            <div className="flex gap-2">
              <Input 
                id="access-point-name" 
                placeholder="Enter access point name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                onClick={handleGenerateName}
                disabled={!targetSwcId || !targetRunnableId}
              >
                Generate
              </Button>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="access-type">Access Type *</Label>
            <Select value={type} onValueChange={(value) => setType(value as 'iRead' | 'iWrite' | 'iCall')}>
              <SelectTrigger id="access-type">
                <SelectValue placeholder="Select access type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="iRead">iRead (Read Data)</SelectItem>
                <SelectItem value="iWrite">iWrite (Write Data)</SelectItem>
                <SelectItem value="iCall">iCall (Service Call)</SelectItem>
              </SelectContent>
            </Select>
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

          <div className="grid gap-2">
            <Label htmlFor="target-swc">Target SWC *</Label>
            <Select value={targetSwcId} onValueChange={(value) => {
              setTargetSwcId(value);
              setTargetRunnableId(""); // Reset runnable selection when SWC changes
            }}>
              <SelectTrigger id="target-swc">
                <SelectValue placeholder="Select target SWC" />
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
            <Label htmlFor="target-runnable">Target Runnable *</Label>
            <Select value={targetRunnableId} onValueChange={setTargetRunnableId} disabled={!targetSwcId}>
              <SelectTrigger id="target-runnable">
                <SelectValue placeholder="Select target runnable" />
              </SelectTrigger>
              <SelectContent>
                {availableRunnables.map((runnable) => (
                  <SelectItem key={runnable.id} value={runnable.id}>
                    {runnable.name} ({runnable.runnableType})
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
            Create Access Point
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAccessPointDialog;
