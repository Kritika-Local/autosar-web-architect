import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Box, 
  Calendar, 
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
  const { currentProject, updateSWC, deleteRunnable, updateRunnable, deleteAccessPoint } = useAutosarStore();
  
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

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No project loaded. Please create or load a project first.</p>
      </div>
    );
  }

import CreateAccessPointDialog from "@/components/CreateAccessPointDialog";

const BehaviorDesigner = () => {
  const { toast } = useToast();
  const { currentProject, updateSWC, deleteRunnable, updateRunnable, deleteAccessPoint } = useAutosarStore();
  
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentProject.swcs.map((swc) => (
              <Card 
                key={swc.id} 
                className={`autosar-card hover:shadow-xl transition-all duration-300 ${selectedSWC?.id === swc.id ? 'border-2 border-primary' : ''}`}
                onClick={() => setSelectedSWC(swc)}
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
                      <DropdownMenuTrigger asChild>
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
        </CardContent>
      </Card>

      {/* Runnable Details */}
      {selectedSWC && (
        <Card className="autosar-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Runnables - {selectedSWC.name}</CardTitle>
                <CardDescription>
                  Define the execution behavior of the selected SWC
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
            <div className="space-y-4">
              {selectedSWC.runnables.length > 0 ? (
                selectedSWC.runnables.map((runnable) => (
                  <div 
                    key={runnable.id} 
                    className={`flex items-center justify-between p-4 border rounded-lg ${selectedRunnable?.id === runnable.id ? 'bg-muted/50' : ''}`}
                    onClick={() => setSelectedRunnable(runnable)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{runnable.name}</h3>
                        <Badge variant="secondary">{runnable.runnableType}</Badge>
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
                          e.stopPropagation(); // Prevent selection
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
                          e.stopPropagation(); // Prevent selection
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
                  <p>No runnables defined</p>
                  <p className="text-sm">Create runnables to define component behavior</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {selectedRunnable && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Access Points</h4>
            <CreateAccessPointDialog 
              runnableId={selectedRunnable.id} 
              swcId={selectedSWC.id} 
            />
          </div>
          
          <div className="border rounded-lg">
            <div className="grid grid-cols-4 gap-4 p-3 bg-muted font-medium text-sm">
              <span>Name</span>
              <span>Type</span>
              <span>Access Mode</span>
              <span>Actions</span>
            </div>
            {selectedRunnable.accessPoints.length > 0 ? (
              selectedRunnable.accessPoints.map((accessPoint) => (
                <div key={accessPoint.id} className="grid grid-cols-4 gap-4 p-3 border-t">
                  <span className="font-medium">{accessPoint.name}</span>
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
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground border-t">
                <p>No access points defined</p>
                <p className="text-sm">Add access points to model runnable behavior</p>
              </div>
            )}
          </div>
        </div>
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
