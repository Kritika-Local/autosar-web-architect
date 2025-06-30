
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { 
  Box, 
  Plus, 
  Settings, 
  FileCode, 
  Layers,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Edit
} from "lucide-react";
import { useAutosarStore } from "@/store/autosarStore";

const SWCBuilder = () => {
  const { toast } = useToast();
  const { 
    currentProject, 
    createSWC, 
    updateSWC, 
    deleteSWC,
    importArxml 
  } = useAutosarStore();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedSWC, setSelectedSWC] = useState<string | null>(null);
  
  // Form states
  const [swcName, setSwcName] = useState("");
  const [swcDescription, setSwcDescription] = useState("");
  const [swcCategory, setSwcCategory] = useState("");
  const [swcType, setSwcType] = useState("atomic");
  
  const categories = [
    { value: "application", label: "Application SWC" },
    { value: "service", label: "Service SWC" },
    { value: "ecu-abstraction", label: "ECU Abstraction SWC" },
    { value: "complex-driver", label: "Complex Driver SWC" },
    { value: "sensor-actuator", label: "Sensor/Actuator SWC" },
  ];

  const handleCreateSWC = () => {
    if (!swcName || !swcCategory) {
      toast({
        title: "Validation Error",
        description: "SWC name and category are required",
        variant: "destructive",
      });
      return;
    }

    if (!currentProject) {
      toast({
        title: "No Project",
        description: "Please create or load a project first",
        variant: "destructive",
      });
      return;
    }

    createSWC({
      name: swcName,
      description: swcDescription,
      category: swcCategory as any,
      type: swcType as any,
      autosarVersion: currentProject.autosarVersion,
    });

    toast({
      title: "SWC Created",
      description: `${swcName} has been created successfully`,
    });

    // Reset form
    setSwcName("");
    setSwcDescription("");
    setSwcCategory("");
    setSwcType("atomic");
    setIsCreateDialogOpen(false);
  };

  const handleImportArxml = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await importArxml(file);
        toast({
          title: "Import Successful",
          description: `${file.name} has been imported`,
        });
        setIsImportDialogOpen(false);
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Failed to import ARXML file",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteSWC = (swcId: string) => {
    deleteSWC(swcId);
    toast({
      title: "SWC Deleted",
      description: "Software component has been deleted",
    });
  };

  const getValidationStatus = (swc: any) => {
    const rules = [
      { valid: !!swc.name, message: "SWC name is required" },
      { valid: !!swc.category, message: "Category selection required" },
      { valid: swc.ports?.length > 0, message: "At least one port recommended" },
    ];
    
    const validCount = rules.filter(r => r.valid).length;
    return {
      status: validCount === rules.length ? "valid" : validCount > 1 ? "warning" : "error",
      validCount,
      totalCount: rules.length,
      rules
    };
  };

  if (!currentProject) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-12">
          <Box className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">No Project Loaded</h2>
          <p className="text-muted-foreground mb-4">
            Please create or load a project to start building SWCs
          </p>
          <Button onClick={() => window.location.href = '/projects'}>
            Go to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">SWC Builder</h1>
          <p className="text-muted-foreground mt-1">
            Create and configure AUTOSAR Software Components
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileCode className="h-4 w-4 mr-2" />
                Import ARXML
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import ARXML File</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="arxml-file">Select ARXML File</Label>
                  <Input
                    id="arxml-file"
                    type="file"
                    accept=".arxml,.xml"
                    onChange={handleImportArxml}
                    className="mt-2"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Supported formats: .arxml, .xml (AUTOSAR compliant)
                </p>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="autosar-button">
                <Plus className="h-4 w-4 mr-2" />
                Create SWC
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New SWC</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="swc-name">Short Name *</Label>
                  <Input
                    id="swc-name"
                    placeholder="e.g., EngineController"
                    value={swcName}
                    onChange={(e) => setSwcName(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="swc-description">Description</Label>
                  <Textarea
                    id="swc-description"
                    placeholder="Brief description of the component"
                    value={swcDescription}
                    onChange={(e) => setSwcDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="swc-category">Category *</Label>
                  <Select value={swcCategory} onValueChange={setSwcCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="swc-type">Type</Label>
                  <Select value={swcType} onValueChange={setSwcType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="atomic">Atomic SWC</SelectItem>
                      <SelectItem value="composition">Composition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSWC} className="autosar-button">
                    Create SWC
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* SWC List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {currentProject.swcs.map((swc) => {
          const validation = getValidationStatus(swc);
          return (
            <Card key={swc.id} className="autosar-card hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Box className="h-5 w-5" />
                      {swc.name}
                    </CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {categories.find(c => c.value === swc.category)?.label}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedSWC(swc.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteSWC(swc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4 min-h-[40px]">
                  {swc.description || "No description provided"}
                </CardDescription>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium capitalize">{swc.type}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ports:</span>
                    <span className="font-medium">{swc.ports?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Runnables:</span>
                    <span className="font-medium">{swc.runnables?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Validation:</span>
                    <div className="flex items-center gap-1">
                      {validation.status === "valid" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="text-xs">
                        {validation.validCount}/{validation.totalCount}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <Badge className={`${
                    validation.status === "valid" 
                      ? "bg-green-500/10 text-green-500" 
                      : "bg-yellow-500/10 text-yellow-500"
                  }`}>
                    {validation.status === "valid" ? "Valid" : "Incomplete"}
                  </Badge>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => window.location.href = `/port-editor?swc=${swc.id}`}>
                      Configure
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {currentProject.swcs.length === 0 && (
        <Card className="autosar-card">
          <CardContent className="text-center py-12">
            <Box className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">No SWCs created yet</p>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="autosar-button"
            >
              Create Your First SWC
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SWCBuilder;
