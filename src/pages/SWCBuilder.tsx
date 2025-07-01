import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Box, 
  Settings,
  Play,
  Clock,
  Zap,
  Trash2,
  Edit
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAutosarStore } from "@/store/autosarStore";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

const SWCBuilder = () => {
  const { toast } = useToast();
  const { 
    currentProject,
    createSWC,
    updateSWC,
    deleteSWC,
    createRunnable,
    updateRunnable,
    deleteRunnable
  } = useAutosarStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateSWCDialogOpen, setIsCreateSWCDialogOpen] = useState(false);
  const [isCreateRunnableDialogOpen, setIsCreateRunnableDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'swc' | 'runnable' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form states with proper typing
  const [swcName, setSwcName] = useState("");
  const [swcDescription, setSwcDescription] = useState("");
  const [swcCategory, setSwcCategory] = useState<'application' | 'service' | 'ecu-abstraction' | 'complex-driver' | 'sensor-actuator'>("application");
  const [swcType, setSwcType] = useState<'atomic' | 'composition'>("atomic");
  const [autosarVersion, setAutosarVersion] = useState("4.3.1");

  const [runnableName, setRunnableName] = useState("");
  const [runnableType, setRunnableType] = useState<'init' | 'periodic' | 'event'>("periodic");
  const [runnablePeriod, setRunnablePeriod] = useState(100);
  const [canBeInvokedConcurrently, setCanBeInvokedConcurrently] = useState(false);
  const [selectedSwcId, setSelectedSwcId] = useState<string | null>(null);

  const handleCreateSWC = () => {
    if (!swcName) {
      toast({
        title: "Validation Error",
        description: "SWC name is required",
        variant: "destructive",
      });
      return;
    }

    createSWC({
      name: swcName,
      description: swcDescription,
      category: swcCategory,
      type: swcType,
    });

    toast({
      title: "SWC Created",
      description: `${swcName} has been created successfully`,
    });

    // Reset form
    setSwcName("");
    setSwcDescription("");
    setSwcCategory("application");
    setSwcType("atomic");
    setAutosarVersion("4.3.1");
    setIsCreateSWCDialogOpen(false);
  };

  const handleCreateRunnable = () => {
    if (!runnableName || !selectedSwcId) {
      toast({
        title: "Validation Error",
        description: "Runnable name and SWC selection are required",
        variant: "destructive",
      });
      return;
    }

    createRunnable({
      name: runnableName,
      swcId: selectedSwcId,
      runnableType,
      period: runnableType === 'periodic' ? runnablePeriod : undefined,
      canBeInvokedConcurrently,
      events: [],
    });

    toast({
      title: "Runnable Created",
      description: `${runnableName} has been created successfully`,
    });

    // Reset form
    setRunnableName("");
    setRunnableType("periodic");
    setRunnablePeriod(100);
    setCanBeInvokedConcurrently(false);
    setIsCreateRunnableDialogOpen(false);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    try {
      if (itemToDelete.type === 'swc') {
        deleteSWC(itemToDelete.id);
        toast({
          title: "SWC Deleted",
          description: `SWC ${itemToDelete.name} has been deleted successfully`,
        });
      } else if (itemToDelete.type === 'runnable') {
        deleteRunnable(itemToDelete.id);
        toast({
          title: "Runnable Deleted",
          description: `Runnable ${itemToDelete.name} has been deleted successfully`,
        });
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete item",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const openDeleteDialog = (id: string, name: string, type: 'swc' | 'runnable') => {
    setItemToDelete({ id, name, type });
    setDeleteDialogOpen(true);
  };

  const filteredSWCs = currentProject?.swcs.filter(swc =>
    swc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    swc.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">SWC Builder</h1>
          <p className="text-muted-foreground mt-1">
            Define and manage Software Components (SWCs)
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateRunnableDialogOpen} onOpenChange={setIsCreateRunnableDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Runnable
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Runnable</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="runnable-name">Runnable Name *</Label>
                  <Input 
                    id="runnable-name" 
                    placeholder="Enter runnable name" 
                    value={runnableName}
                    onChange={(e) => setRunnableName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="swc-selection">Select SWC *</Label>
                  <Select onValueChange={setSelectedSwcId}>
                    <SelectTrigger id="swc-selection">
                      <SelectValue placeholder="Select a SWC" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentProject?.swcs.map((swc) => (
                        <SelectItem key={swc.id} value={swc.id}>{swc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="runnable-type">Runnable Type</Label>
                  <Select value={runnableType} onValueChange={(value) => setRunnableType(value as 'init' | 'periodic' | 'event')}>
                    <SelectTrigger id="runnable-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="init">Init</SelectItem>
                      <SelectItem value="periodic">Periodic</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {runnableType === 'periodic' && (
                  <div className="grid gap-2">
                    <Label htmlFor="runnable-period">Period (ms)</Label>
                    <Input 
                      id="runnable-period" 
                      type="number"
                      placeholder="Enter period in milliseconds" 
                      value={runnablePeriod}
                      onChange={(e) => setRunnablePeriod(Number(e.target.value))}
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="concurrent" 
                    className="h-4 w-4"
                    checked={canBeInvokedConcurrently}
                    onChange={(e) => setCanBeInvokedConcurrently(e.target.checked)}
                  />
                  <Label htmlFor="concurrent">Can be invoked concurrently</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateRunnableDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="autosar-button" onClick={handleCreateRunnable}>
                  Create Runnable
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isCreateSWCDialogOpen} onOpenChange={setIsCreateSWCDialogOpen}>
            <DialogTrigger asChild>
              <Button className="autosar-button flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New SWC
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New SWC</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">SWC Name *</Label>
                  <Input 
                    id="name" 
                    placeholder="Enter SWC name" 
                    value={swcName}
                    onChange={(e) => setSwcName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input 
                    id="description" 
                    placeholder="Brief description of the SWC" 
                    value={swcDescription}
                    onChange={(e) => setSwcDescription(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={swcCategory} onValueChange={(value) => setSwcCategory(value as typeof swcCategory)}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="application">Application</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="ecu-abstraction">ECU Abstraction</SelectItem>
                      <SelectItem value="complex-driver">Complex Driver</SelectItem>
                      <SelectItem value="sensor-actuator">Sensor/Actuator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={swcType} onValueChange={(value) => setSwcType(value as typeof swcType)}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="atomic">Atomic</SelectItem>
                      <SelectItem value="composition">Composition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="autosar-version">AUTOSAR Version</Label>
                  <Select value={autosarVersion} onValueChange={setAutosarVersion}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4.3.1">AUTOSAR 4.3.1</SelectItem>
                      <SelectItem value="4.2.2">AUTOSAR 4.2.2</SelectItem>
                      <SelectItem value="4.4.0">AUTOSAR 4.4.0</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateSWCDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="autosar-button" onClick={handleCreateSWC}>
                  Create SWC
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="autosar-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search SWCs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SWCs</SelectItem>
                <SelectItem value="application">Application</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="ecu-abstraction">ECU Abstraction</SelectItem>
                <SelectItem value="complex-driver">Complex Driver</SelectItem>
                <SelectItem value="sensor-actuator">Sensor / Actuator</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* SWCs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSWCs.map((swc) => (
          <Card key={swc.id} className="autosar-card hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 autosar-gradient rounded-lg flex items-center justify-center">
                    <Box className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{swc.name}</CardTitle>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {swc.category}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-500"
                      onClick={() => openDeleteDialog(swc.id, swc.name, 'swc')}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                {swc.description || "No description provided"}
              </CardDescription>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Ports:</span>
                  <span className="font-medium">{swc.ports?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Runnables:</span>
                  <span className="font-medium">{swc.runnables?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {swc.type}
                  </Badge>
                </div>
              </div>

              {swc.runnables && swc.runnables.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="text-sm font-medium mb-2">Runnables</h4>
                  <div className="space-y-2">
                    {swc.runnables.map((runnable) => (
                      <div key={runnable.id} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-2">
                          {runnable.runnableType === 'init' && <Zap className="h-3 w-3" />}
                          {runnable.runnableType === 'periodic' && <Clock className="h-3 w-3" />}
                          {runnable.runnableType === 'event' && <Play className="h-3 w-3" />}
                          <span>{runnable.name}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          onClick={() => openDeleteDialog(runnable.id, runnable.name, 'runnable')}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSWCs.length === 0 && (
        <Card className="autosar-card">
          <CardContent className="text-center py-12">
            <Box className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">
              No SWCs created yet
            </p>
            <Button 
              onClick={() => setIsCreateSWCDialogOpen(true)}
              className="autosar-button"
            >
              Create Your First SWC
            </Button>
          </CardContent>
        </Card>
      )}

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={`Delete ${itemToDelete?.type === 'swc' ? 'SWC' : 'Runnable'}`}
        description={`Are you sure you want to delete this ${itemToDelete?.type}? This action cannot be undone and may affect other components.`}
        itemName={itemToDelete?.name || "Unknown Item"}
        onConfirm={handleDeleteItem}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default SWCBuilder;
