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
  ArrowRight,
  ArrowLeft,
  Network,
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

const PortEditor = () => {
  const { toast } = useToast();
  const { 
    currentProject,
    createPort,
    updatePort,
    deletePort,
    createInterface,
    updateInterface,
    deleteInterface
  } = useAutosarStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreatePortDialogOpen, setIsCreatePortDialogOpen] = useState(false);
  const [isCreateInterfaceDialogOpen, setIsCreateInterfaceDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'port' | 'interface' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states for Port creation
  const [portName, setPortName] = useState("");
  const [portDirection, setPortDirection] = useState<"provided" | "required">("provided");
  const [portInterfaceRef, setPortInterfaceRef] = useState("");
  const [portSwcId, setPortSwcId] = useState("");

  // Form states for Interface creation
  const [interfaceName, setInterfaceName] = useState("");
  const [interfaceType, setInterfaceType] = useState<"SenderReceiver" | "ClientServer" | "ModeSwitch" | "Parameter" | "Trigger">("SenderReceiver");

  const handleCreatePort = () => {
    if (!portName || !portDirection || !portInterfaceRef || !portSwcId) {
      toast({
        title: "Validation Error",
        description: "All port fields are required",
        variant: "destructive",
      });
      return;
    }

    createPort({
      name: portName,
      direction: portDirection,
      interfaceRef: portInterfaceRef,
      swcId: portSwcId,
    });

    toast({
      title: "Port Created",
      description: `${portName} has been created successfully`,
    });

    // Reset form
    setPortName("");
    setPortDirection("provided");
    setPortInterfaceRef("");
    setPortSwcId("");
    setIsCreatePortDialogOpen(false);
  };

  const handleCreateInterface = () => {
    if (!interfaceName || !interfaceType) {
      toast({
        title: "Validation Error",
        description: "All interface fields are required",
        variant: "destructive",
      });
      return;
    }

    createInterface({
      name: interfaceName,
      type: interfaceType,
    });

    toast({
      title: "Interface Created",
      description: `${interfaceName} has been created successfully`,
    });

    // Reset form
    setInterfaceName("");
    setInterfaceType("SenderReceiver");
    setIsCreateInterfaceDialogOpen(false);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    try {
      if (itemToDelete.type === 'port') {
        deletePort(itemToDelete.id);
        toast({
          title: "Port Deleted",
          description: `Port ${itemToDelete.name} has been deleted successfully`,
        });
      } else if (itemToDelete.type === 'interface') {
        deleteInterface(itemToDelete.id);
        toast({
          title: "Interface Deleted",
          description: `Interface ${itemToDelete.name} has been deleted successfully`,
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

  const openDeleteDialog = (id: string, name: string, type: 'port' | 'interface') => {
    setItemToDelete({ id, name, type });
    setDeleteDialogOpen(true);
  };

  const filteredPorts = currentProject?.swcs.flatMap(swc => swc.ports)
    .filter(port => port.name.toLowerCase().includes(searchTerm.toLowerCase())) || [];
  
  const filteredInterfaces = currentProject?.interfaces
    .filter(interface_ => interface_.name.toLowerCase().includes(searchTerm.toLowerCase())) || [];

  const allPorts = currentProject?.swcs.flatMap(swc => swc.ports) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Port & Interface Editor</h1>
          <p className="text-muted-foreground mt-1">
            Manage ports and interfaces for your AUTOSAR SWCs
          </p>
        </div>
      </div>

      {/* Ports Section */}
      <Card className="autosar-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Ports
              </CardTitle>
              <CardDescription>
                Define provided and required ports for your SWCs
              </CardDescription>
            </div>
            <Dialog open={isCreatePortDialogOpen} onOpenChange={setIsCreatePortDialogOpen}>
              <DialogTrigger asChild>
                <Button className="autosar-button flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Port
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
                    <Label htmlFor="port-direction">Port Direction</Label>
                    <Select value={portDirection} onValueChange={(value) => setPortDirection(value as "provided" | "required")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select direction" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="provided">Provided</SelectItem>
                        <SelectItem value="required">Required</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="port-interface">Interface Ref *</Label>
                    <Input
                      id="port-interface"
                      placeholder="Enter interface reference"
                      value={portInterfaceRef}
                      onChange={(e) => setPortInterfaceRef(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="port-swc">SWC ID *</Label>
                    <Input
                      id="port-swc"
                      placeholder="Enter SWC ID"
                      value={portSwcId}
                      onChange={(e) => setPortSwcId(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreatePortDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="autosar-button" onClick={handleCreatePort}>
                    Create Port
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allPorts.map((port) => {
              const swc = currentProject?.swcs.find(s => s.id === port.swcId);
              const interface_ = currentProject?.interfaces.find(i => i.id === port.interfaceRef);
              
              return (
                <Card key={port.id} className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {port.direction === 'provided' ? (
                          <ArrowLeft className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowRight className="h-4 w-4 text-blue-500" />
                        )}
                        <div>
                          <CardTitle className="text-sm">{port.name}</CardTitle>
                          <Badge variant={port.direction === 'provided' ? 'default' : 'secondary'}>
                            {port.direction === 'provided' ? 'P-Port' : 'R-Port'}
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
                          <DropdownMenuItem 
                            className="text-red-500"
                            onClick={() => openDeleteDialog(port.id, port.name, 'port')}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">SWC:</span>
                        <span className="font-medium">{swc?.name || "N/A"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Interface:</span>
                        <span className="font-medium">{interface_?.name || "N/A"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Direction:</span>
                        <span className="font-medium">{port.direction}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Interfaces Section */}
      <Card className="autosar-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Box className="h-5 w-5" />
                Port Interfaces
              </CardTitle>
              <CardDescription>
                Define the contracts between ports
              </CardDescription>
            </div>
            <Dialog open={isCreateInterfaceDialogOpen} onOpenChange={setIsCreateInterfaceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="autosar-button flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Interface
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Interface</DialogTitle>
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
                    <Label htmlFor="interface-type">Interface Type</Label>
                    <Select value={interfaceType} onValueChange={(value) => setInterfaceType(value as "SenderReceiver" | "ClientServer" | "ModeSwitch" | "Parameter" | "Trigger")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select interface type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SenderReceiver">SenderReceiver</SelectItem>
                        <SelectItem value="ClientServer">ClientServer</SelectItem>
                        <SelectItem value="ModeSwitch">ModeSwitch</SelectItem>
                        <SelectItem value="Parameter">Parameter</SelectItem>
                        <SelectItem value="Trigger">Trigger</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateInterfaceDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="autosar-button" onClick={handleCreateInterface}>
                    Create Interface
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInterfaces.map((interface_) => (
              <Card key={interface_.id} className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-sm">{interface_.name}</CardTitle>
                      <Badge variant="outline">{interface_.type}</Badge>
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
                        <DropdownMenuItem 
                          className="text-red-500"
                          onClick={() => openDeleteDialog(interface_.id, interface_.name, 'interface')}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium">{interface_.type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Data Elements:</span>
                      <span className="font-medium">{interface_.dataElements?.length || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Port Dialog */}
      <Dialog open={isCreatePortDialogOpen} onOpenChange={setIsCreatePortDialogOpen}>
        <DialogTrigger asChild>
          <Button className="autosar-button flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Port
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
              <Label htmlFor="port-direction">Port Direction</Label>
              <Select value={portDirection} onValueChange={(value) => setPortDirection(value as "provided" | "required")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="provided">Provided</SelectItem>
                  <SelectItem value="required">Required</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="port-interface">Interface Ref *</Label>
              <Input
                id="port-interface"
                placeholder="Enter interface reference"
                value={portInterfaceRef}
                onChange={(e) => setPortInterfaceRef(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="port-swc">SWC ID *</Label>
              <Input
                id="port-swc"
                placeholder="Enter SWC ID"
                value={portSwcId}
                onChange={(e) => setPortSwcId(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreatePortDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="autosar-button" onClick={handleCreatePort}>
              Create Port
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Interface Dialog */}
      <Dialog open={isCreateInterfaceDialogOpen} onOpenChange={setIsCreateInterfaceDialogOpen}>
        <DialogTrigger asChild>
          <Button className="autosar-button flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Interface
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Interface</DialogTitle>
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
              <Label htmlFor="interface-type">Interface Type</Label>
              <Select value={interfaceType} onValueChange={(value) => setInterfaceType(value as "SenderReceiver" | "ClientServer" | "ModeSwitch" | "Parameter" | "Trigger")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select interface type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SenderReceiver">SenderReceiver</SelectItem>
                  <SelectItem value="ClientServer">ClientServer</SelectItem>
                  <SelectItem value="ModeSwitch">ModeSwitch</SelectItem>
                  <SelectItem value="Parameter">Parameter</SelectItem>
                  <SelectItem value="Trigger">Trigger</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateInterfaceDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="autosar-button" onClick={handleCreateInterface}>
              Create Interface
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={`Delete ${itemToDelete?.type === 'port' ? 'Port' : 'Interface'}`}
        description={`Are you sure you want to delete this ${itemToDelete?.type}? This action cannot be undone and may affect other components.`}
        itemName={itemToDelete?.name || "Unknown Item"}
        onConfirm={handleDeleteItem}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default PortEditor;
