
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Database, Plus, Edit, Trash2, Hash } from "lucide-react";
import { useAutosarStore, DataElement } from "@/store/autosarStore";

const DataElementEditor = () => {
  const { toast } = useToast();
  const { 
    currentProject, 
    createDataElement, 
    updateDataElement, 
    deleteDataElement 
  } = useAutosarStore();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingDataElement, setEditingDataElement] = useState<DataElement | null>(null);
  
  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [applicationDataTypeRef, setApplicationDataTypeRef] = useState("");

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("");
    setApplicationDataTypeRef("");
    setEditingDataElement(null);
  };

  const handleCreateDataElement = () => {
    if (!name || !applicationDataTypeRef) {
      toast({
        title: "Validation Error",
        description: "Data element name and application data type are required",
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

    const dataElementData: Omit<DataElement, 'id'> = {
      name,
      description,
      category,
      applicationDataTypeRef,
      swDataDefProps: {
        baseTypeRef: applicationDataTypeRef,
        implementationDataTypeRef: `${applicationDataTypeRef}_Impl`
      }
    };

    if (editingDataElement) {
      updateDataElement(editingDataElement.id, dataElementData);
      toast({
        title: "Data Element Updated",
        description: `${name} has been updated successfully`,
      });
    } else {
      createDataElement(dataElementData);
      toast({
        title: "Data Element Created",
        description: `${name} has been created successfully`,
      });
    }

    resetForm();
    setIsCreateDialogOpen(false);
  };

  const handleEditDataElement = (dataElement: DataElement) => {
    setName(dataElement.name);
    setDescription(dataElement.description || "");
    setCategory(dataElement.category || "");
    setApplicationDataTypeRef(dataElement.applicationDataTypeRef);
    setEditingDataElement(dataElement);
    setIsCreateDialogOpen(true);
  };

  const handleDeleteDataElement = (id: string) => {
    deleteDataElement(id);
    toast({
      title: "Data Element Deleted",
      description: "Data element has been deleted",
    });
  };

  if (!currentProject) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-12">
          <Database className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">No Project Loaded</h2>
          <p className="text-muted-foreground mb-4">
            Please create or load a project to manage data elements
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Data Element Editor</h1>
          <p className="text-muted-foreground mt-1">
            Define data elements for use in port interfaces
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="autosar-button flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Data Element
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingDataElement ? "Edit Data Element" : "Create Data Element"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="de-name">Name *</Label>
                  <Input
                    id="de-name"
                    placeholder="e.g., EngineSpeed"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="de-category">Category</Label>
                  <Input
                    id="de-category"
                    placeholder="e.g., VALUE"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="de-description">Description</Label>
                <Textarea
                  id="de-description"
                  placeholder="Description of the data element"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="de-app-data-type">Application Data Type *</Label>
                <Select value={applicationDataTypeRef} onValueChange={setApplicationDataTypeRef}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select application data type" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentProject.dataTypes.map((dt) => (
                      <SelectItem key={dt.id} value={dt.name}>{dt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleCreateDataElement} className="autosar-button">
                  {editingDataElement ? "Update" : "Create"} Data Element
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Data Elements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentProject.dataElements.map((dataElement) => (
          <Card key={dataElement.id} className="autosar-card hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    {dataElement.name}
                  </CardTitle>
                  {dataElement.category && (
                    <Badge variant="outline" className="mt-1">
                      {dataElement.category}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditDataElement(dataElement)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteDataElement(dataElement.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4 min-h-[40px]">
                {dataElement.description || "No description provided"}
              </CardDescription>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">App Data Type:</span>
                  <span className="font-medium">{dataElement.applicationDataTypeRef}</span>
                </div>
                {dataElement.swDataDefProps?.implementationDataTypeRef && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Impl Data Type:</span>
                    <span className="font-medium">{dataElement.swDataDefProps.implementationDataTypeRef}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {currentProject.dataElements.length === 0 && (
        <Card className="autosar-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Data Elements
            </CardTitle>
            <CardDescription>
              Data elements used in port interfaces
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No data elements defined yet</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                Create Data Element
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DataElementEditor;
