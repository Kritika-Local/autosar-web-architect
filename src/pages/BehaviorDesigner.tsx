import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  Plus, 
  MoreVertical, 
  Box, 
  Settings,
  Trash2,
  Copy,
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
import EditAccessPointDialog from "@/components/EditAccessPointDialog";
import CreateAccessPointDialog from "@/components/CreateAccessPointDialog";

const BehaviorDesigner = () => {
  const { toast } = useToast();
  const { currentProject, updateSWC, deleteRunnable, updateRunnable, deleteAccessPoint, refreshProject } = useAutosarStore();
  
  const [selectedSWC, setSelectedSWC] = useState<any>(null);
  const [selectedRunnable, setSelectedRunnable] = useState<any>(null);
  const [editAccessPointDialogOpen, setEditAccessPointDialogOpen] = useState(false);
  const [accessPointToEdit, setAccessPointToEdit] = useState<any>(null);
  const [deleteAccessPointDialogOpen, setDeleteAccessPointDialogOpen] = useState(false);
  const [accessPointToDelete, setAccessPointToDelete] = useState<string | null>(null);
  const [accessPointToDeleteName, setAccessPointToDeleteName] = useState<string | null>(null);
  const [deleteRunnableDialogOpen, setDeleteRunnableDialogOpen] = useState(false);
  const [runnableToDelete, setRunnableToDelete] = useState<string | null>(null);
  const [runnableToDeleteName, setRunnableToDeleteName] = useState<string | null>(null);

  // Auto-select first SWC if available and none is selected
  useEffect(() => {
    if (currentProject?.swcs && currentProject.swcs.length > 0 && !selectedSWC) {
      setSelectedSWC(currentProject.swcs[0]);
      
      // Debug: Log the selected SWC structure
      console.log('=== Auto-selecting SWC ===');
      console.log('Selected SWC:', currentProject.swcs[0]);
      console.log('SWC Runnables:', currentProject.swcs[0].runnables);
    }
  }, [currentProject?.swcs, selectedSWC]);

  // Auto-select first runnable when SWC changes
  useEffect(() => {
    if (selectedSWC?.runnables && selectedSWC.runnables.length > 0) {
      setSelectedRunnable(selectedSWC.runnables[0]);
      console.log('Auto-selected runnable:', selectedSWC.runnables[0]);
    } else {
      setSelectedRunnable(null);
      console.log('No runnables found for SWC:', selectedSWC?.name);
    }
  }, [selectedSWC]);

  const openEditAccessPointDialog = (accessPoint: any) => {
    setAccessPointToEdit(accessPoint);
    setEditAccessPointDialogOpen(true);
  };

  const openDeleteAccessPointDialog = (accessPointId: string, accessPointName: string) => {
    setAccessPointToDelete(accessPointId);
    setAccessPointToDeleteName(accessPointName);
    setDeleteAccessPointDialogOpen(true);
  };

  const handleDeleteAccessPoint = (accessPointId: string) => {
    if (selectedRunnable) {
      deleteAccessPoint(selectedRunnable.id, accessPointId);
      toast({
        title: "Access Point Deleted",
        description: "Access point has been deleted successfully",
      });
      setDeleteAccessPointDialogOpen(false);
      setAccessPointToDelete(null);
      setAccessPointToDeleteName(null);
    }
  };

  const openDeleteRunnableDialog = (runnableId: string, runnableName: string) => {
    setRunnableToDelete(runnableId);
    setRunnableToDeleteName(runnableName);
    setDeleteRunnableDialogOpen(true);
  };

  const handleDeleteRunnable = (runnableId: string) => {
    if (selectedSWC) {
      deleteRunnable(runnableId);
      toast({
        title: "Runnable Deleted",
        description: "Runnable has been deleted successfully",
      });
      setDeleteRunnableDialogOpen(false);
      setRunnableToDelete(null);
      setRunnableToDeleteName(null);
      setSelectedRunnable(null);
    }
  };

  const handleRunnableUpdate = (runnableId: string, updates: any) => {
    updateRunnable(runnableId, updates);
    toast({
      title: "Runnable Updated",
      description: "Runnable has been updated successfully",
    });
  };

  const handleSWCClick = (swc: any) => {
    setSelectedSWC(swc);
    console.log('=== SWC Clicked ===');
    console.log('SWC:', swc.name);
    console.log('Runnables:', swc.runnables);
    
    // Auto-select first runnable when SWC is clicked
    if (swc.runnables && swc.runnables.length > 0) {
      setSelectedRunnable(swc.runnables[0]);
      console.log('Auto-selected first runnable:', swc.runnables[0].name);
    } else {
      setSelectedRunnable(null);
      console.log('No runnables to select for SWC:', swc.name);
    }
  };

  const handleRunnableClick = (runnable: any) => {
    setSelectedRunnable(runnable);
  };

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No project loaded. Please create or load a project first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Behavior Designer</h1>
          <p className="text-muted-foreground mt-1">
            Define internal behavior of Software Components
          </p>
        </div>
        <Button variant="outline" onClick={() => refreshProject && refreshProject()}>
          <Settings className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* SWC Selection */}
      <Card className="autosar-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Software Components</CardTitle>
            <CardDescription>
              Select a component to view and edit its internal behavior
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {currentProject.swcs && currentProject.swcs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentProject.swcs.map((swc) => (
                <Card 
                  key={swc.id} 
                  className={`autosar-card hover:shadow-xl transition-all duration-300 cursor-pointer ${selectedSWC?.id === swc.id ? 'border-2 border-primary' : ''}`}
                  onClick={() => handleSWCClick(swc)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 autosar-gradient rounded-lg flex items-center justify-center">
                          <Box className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{swc.name}</CardTitle>
                          <Badge variant="outline" className="mt-1">
                            {swc.category}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
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
                        <span className="text-muted-foreground">Runnables:</span>
                        <span className="font-medium">{swc.runnables?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Ports:</span>
                        <span className="font-medium">{swc.ports?.length || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Box className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No Software Components found</p>
              <p className="text-sm">Import requirements or create SWCs manually to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Runnable Details - Enhanced Debug Info */}
      {selectedSWC && (
        <Card className="autosar-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Runnables - {selectedSWC.name}</CardTitle>
                <CardDescription>
                  Define the execution behavior of the selected SWC ({selectedSWC.runnables?.length || 0} runnables found)
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="autosar-button flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Runnable
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Init Runnable</DropdownMenuItem>
                  <DropdownMenuItem>Periodic Runnable</DropdownMenuItem>
                  <DropdownMenuItem>Event Runnable</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            {/* Debug info */}
            <div className="mb-4 p-3 bg-muted rounded text-sm">
              <p><strong>Debug:</strong> SWC "{selectedSWC.name}" has {selectedSWC.runnables?.length || 0} runnables</p>
              {selectedSWC.runnables?.map((r, idx) => (
                <p key={idx}>- {r.name} ({r.runnableType}, {r.period}ms)</p>
              ))}
            </div>
            
            <div className="space-y-4">
              {selectedSWC.runnables && selectedSWC.runnables.length > 0 ? (
                selectedSWC.runnables.map((runnable) => (
                  <div 
                    key={runnable.id} 
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${selectedRunnable?.id === runnable.id ? 'bg-muted/50 border-primary' : 'hover:bg-muted/30'}`}
                    onClick={() => handleRunnableClick(runnable)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{runnable.name}</h3>
                        <Badge variant="secondary">{runnable.runnableType}</Badge>
                        {runnable.period > 0 && (
                          <Badge variant="outline">{runnable.period}ms</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Access Points: {runnable.accessPoints?.length || 0}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newCanBeInvokedConcurrently = !runnable.canBeInvokedConcurrently;
                          handleRunnableUpdate(runnable.id, { canBeInvokedConcurrently: newCanBeInvokedConcurrently });
                        }}
                      >
                        {runnable.canBeInvokedConcurrently ? 'Non-Concurrent' : 'Concurrent'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteRunnableDialog(runnable.id, runnable.name);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Box className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No runnables mapped to {selectedSWC.name}</p>
                  <p className="text-sm">Runnables may need to be regenerated or remapped</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      toast({
                        title: "Debug Info",
                        description: `SWC ${selectedSWC.name} has ${selectedSWC.runnables?.length || 0} runnables in memory`
                      });
                    }}
                  >
                    Debug Runnable Count
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Access Points Section */}
      {selectedRunnable && (
        <Card className="autosar-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Access Points - {selectedRunnable.name}</CardTitle>
                <CardDescription>
                  Data access points for runnable execution
                </CardDescription>
              </div>
              <CreateAccessPointDialog 
                runnableId={selectedRunnable.id} 
                swcId={selectedSWC.id} 
              />
            </div>
          </CardHeader>
          <CardContent>
            {selectedRunnable.accessPoints && selectedRunnable.accessPoints.length > 0 ? (
              <div className="border rounded-lg">
                <div className="grid grid-cols-4 gap-4 p-3 bg-muted font-medium text-sm">
                  <span>Name</span>
                  <span>Type</span>
                  <span>Access Mode</span>
                  <span>Actions</span>
                </div>
                {selectedRunnable.accessPoints.map((accessPoint) => (
                  <div key={accessPoint.id} className="grid grid-cols-4 gap-4 p-3 border-t">
                    <span className="font-medium text-sm">{accessPoint.name}</span>
                    <Badge variant="outline">{accessPoint.type}</Badge>
                    <Badge variant="secondary">{accessPoint.access}</Badge>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditAccessPointDialog(accessPoint)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openDeleteAccessPointDialog(accessPoint.id, accessPoint.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Box className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No access points defined for {selectedRunnable.name}</p>
                <p className="text-sm">Add access points to model runnable behavior</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <DeleteConfirmDialog
        open={deleteAccessPointDialogOpen}
        onOpenChange={setDeleteAccessPointDialogOpen}
        title="Delete Access Point"
        description="Are you sure you want to delete this access point? This action cannot be undone."
        itemName={accessPointToDeleteName || "Unknown Access Point"}
        onConfirm={() => accessPointToDelete && handleDeleteAccessPoint(accessPointToDelete)}
      />

      <DeleteConfirmDialog
        open={deleteRunnableDialogOpen}
        onOpenChange={setDeleteRunnableDialogOpen}
        title="Delete Runnable"
        description="Are you sure you want to delete this runnable? This action cannot be undone."
        itemName={runnableToDeleteName || "Unknown Runnable"}
        onConfirm={() => runnableToDelete && handleDeleteRunnable(runnableToDelete)}
      />

      <EditAccessPointDialog
        open={editAccessPointDialogOpen}
        onOpenChange={setEditAccessPointDialogOpen}
        accessPoint={accessPointToEdit}
      />
    </div>
  );
};

export default BehaviorDesigner;
