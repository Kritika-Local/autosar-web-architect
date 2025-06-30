
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAutosarStore, AccessPoint } from "@/store/autosarStore";

interface EditAccessPointDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessPoint: AccessPoint | null;
}

const EditAccessPointDialog = ({ open, onOpenChange, accessPoint }: EditAccessPointDialogProps) => {
  const { toast } = useToast();
  const { currentProject, updateAccessPoint, generateAccessPointName } = useAutosarStore();
  
  const [name, setName] = useState("");
  const [type, setType] = useState<'iRead' | 'iWrite' | 'iCall'>("iRead");
  const [access, setAccess] = useState<'implicit' | 'explicit'>("implicit");
  const [swcId, setSwcId] = useState("");
  const [runnableId, setRunnableId] = useState("");

  useEffect(() => {
    if (accessPoint) {
      setName(accessPoint.name);
      setType(accessPoint.type);
      setAccess(accessPoint.access);
      setSwcId(accessPoint.swcId);
      setRunnableId(accessPoint.runnableId);
    }
  }, [accessPoint]);

  const selectedSwc = currentProject?.swcs.find(swc => swc.id === swcId);
  const availableRunnables = selectedSwc?.runnables || [];

  const handleGenerateName = () => {
    if (swcId && runnableId) {
      const swc = currentProject?.swcs.find(s => s.id === swcId);
      const runnable = swc?.runnables.find(r => r.id === runnableId);
      if (swc && runnable) {
        const generatedName = generateAccessPointName(swc.name, runnable.name, type);
        setName(generatedName);
      }
    }
  };

  const handleSave = () => {
    if (!accessPoint || !name || !swcId || !runnableId) {
      toast({
        title: "Validation Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    updateAccessPoint(accessPoint.id, {
      name,
      type,
      access,
      swcId,
      runnableId,
    });

    toast({
      title: "Access Point Updated",
      description: `Access point ${name} has been updated successfully`,
    });

    onOpenChange(false);
  };

  const resetForm = () => {
    setName("");
    setType("iRead");
    setAccess("implicit");
    setSwcId("");
    setRunnableId("");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Access Point</DialogTitle>
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
                disabled={!swcId || !runnableId}
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
            <Select value={swcId} onValueChange={(value) => {
              setSwcId(value);
              setRunnableId(""); // Reset runnable selection when SWC changes
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
            <Select value={runnableId} onValueChange={setRunnableId} disabled={!swcId}>
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
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button className="autosar-button" onClick={handleSave}>
            Update Access Point
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditAccessPointDialog;
