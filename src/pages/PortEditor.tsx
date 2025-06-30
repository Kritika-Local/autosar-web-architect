
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  Trash2, 
  Edit, 
  Cable,
  Download,
  FileText,
  Package
} from "lucide-react";
import { useAutosarStore } from "@/store/autosarStore";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import EditPortDialog from "@/components/EditPortDialog";
import CreatePortDialog from "@/components/CreatePortDialog";
import CreateInterfaceDialog from "@/components/CreateInterfaceDialog";
import SWCConnectionDialog from "@/components/SWCConnectionDialog";

const PortEditor = () => {
  const { toast } = useToast();
  const { 
    currentProject, 
    deletePort, 
    deleteInterface,
    exportArxml,
    exportMultipleArxml
  } = useAutosarStore();
  
  const [deletePortDialogOpen, setDeletePortDialogOpen] = useState(false);
  const [deleteInterfaceDialogOpen, setDeleteInterfaceDialogOpen] = useState(false);
  const [portToDelete, setPortToDelete] = useState<string | null>(null);
  const [interfaceToDelete, setInterfaceToDelete] = useState<string | null>(null);
  const [editPortDialogOpen, setEditPortDialogOpen] = useState(false);
  const [portToEdit, setPortToEdit] = useState<any>(null);

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No project loaded. Please create or load a project first.</p>
      </div>
    );
  }

  const handleDeletePort = (portId: string) => {
    deletePort(portId);
    toast({
      title: "Port Deleted",
      description: "Port has been deleted successfully",
    });
    setDeletePortDialogOpen(false);
    setPortToDelete(null);
  };

  const handleDeleteInterface = (interfaceId: string) => {
    deleteInterface(interfaceId);
    toast({
      title: "Interface Deleted", 
      description: "Interface has been deleted successfully",
    });
    setDeleteInterfaceDialogOpen(false);
    setInterfaceToDelete(null);
  };

  const openEditPortDialog = (port: any) => {
    setPortToEdit(port);
    setEditPortDialogOpen(true);
  };

  const allPorts = currentProject.swcs.flatMap(swc => 
    swc.ports.map(port => ({
      ...port,
      swcName: swc.name,
      swcId: swc.id
    }))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Port & Interface Editor</h1>
          <p className="text-muted-foreground mt-1">
            Manage SWC ports, interfaces, and connections
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportArxml}>
            <Download className="h-4 w-4 mr-2" />
            Single ARXML
          </Button>
          <Button variant="outline" onClick={exportMultipleArxml}>
            <Package className="h-4 w-4 mr-2" />
            Multiple ARXML
          </Button>
          <SWCConnectionDialog />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ports Section */}
        <Card className="autosar-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>SWC Ports</CardTitle>
                <CardDescription>
                  Manage communication ports for software components
                </CardDescription>
              </div>
              <CreatePortDialog />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allPorts.length > 0 ? (
                allPorts.map((port) => {
                  const interface_ = currentProject.interfaces.find(i => i.id === port.interfaceRef);
                  return (
                    <div key={port.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{port.name}</h3>
                          <Badge variant={port.direction === 'provided' ? 'default' : 'secondary'}>
                            {port.direction === 'provided' ? 'P-Port' : 'R-Port'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          SWC: {port.swcName} | Interface: {interface_?.name || 'Unknown'}
                        </p>
                        {interface_ && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Type: {interface_.type} | Elements: {interface_.dataElements?.length || 0}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditPortDialog(port)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setPortToDelete(port.id);
                            setDeletePortDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Cable className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No ports created yet</p>
                  <p className="text-sm">Create your first port to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Interfaces Section */}
        <Card className="autosar-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Port Interfaces</CardTitle>
                <CardDescription>
                  Define communication interfaces and data elements
                </CardDescription>
              </div>
              <CreateInterfaceDialog />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentProject.interfaces.length > 0 ? (
                currentProject.interfaces.map((interface_) => (
                  <div key={interface_.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{interface_.name}</h3>
                        <Badge variant="outline">{interface_.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Data Elements: {interface_.dataElements?.length || 0}
                      </p>
                      {interface_.dataElements && interface_.dataElements.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">Elements:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {interface_.dataElements.slice(0, 3).map((de, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {de.name}
                              </Badge>
                            ))}
                            {interface_.dataElements.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{interface_.dataElements.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setInterfaceToDelete(interface_.id);
                          setDeleteInterfaceDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No interfaces created yet</p>
                  <p className="text-sm">Create your first interface to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SWC Connections */}
      <Card className="autosar-card">
        <CardHeader>
          <CardTitle>SWC Connections</CardTitle>
          <CardDescription>
            Port-to-port connections between software components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentProject.connections.length > 0 ? (
              currentProject.connections.map((connection) => {
                const sourceSwc = currentProject.swcs.find(swc => swc.id === connection.sourceSwcId);
                const targetSwc = currentProject.swcs.find(swc => swc.id === connection.targetSwcId);
                const sourcePort = sourceSwc?.ports.find(p => p.id === connection.sourcePortId);
                const targetPort = targetSwc?.ports.find(p => p.id === connection.targetPortId);
                
                return (
                  <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium mb-2">{connection.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Badge variant="default">P-Port</Badge>
                          <span>{sourceSwc?.name}.{sourcePort?.name}</span>
                        </div>
                        <Cable className="h-4 w-4" />
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">R-Port</Badge>
                          <span>{targetSwc?.name}.{targetPort?.name}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Cable className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No connections created yet</p>
                <p className="text-sm">Connect SWC ports to establish communication</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <DeleteConfirmDialog
        open={deletePortDialogOpen}
        onOpenChange={setDeletePortDialogOpen}
        title="Delete Port"
        description="Are you sure you want to delete this port? This action cannot be undone and may affect related connections."
        itemName={allPorts.find(p => p.id === portToDelete)?.name || "Unknown Port"}
        onConfirm={() => portToDelete && handleDeletePort(portToDelete)}
      />

      <DeleteConfirmDialog
        open={deleteInterfaceDialogOpen}
        onOpenChange={setDeleteInterfaceDialogOpen}
        title="Delete Interface"
        description="Are you sure you want to delete this interface? This action cannot be undone and may affect related ports."
        itemName={currentProject.interfaces.find(i => i.id === interfaceToDelete)?.name || "Unknown Interface"}
        onConfirm={() => interfaceToDelete && handleDeleteInterface(interfaceToDelete)}
      />

      <EditPortDialog
        open={editPortDialogOpen}
        onOpenChange={setEditPortDialogOpen}
        port={portToEdit}
      />
    </div>
  );
};

export default PortEditor;
