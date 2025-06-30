
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
import { Database, Plus, Edit, Trash2, Hash, ListOrdered, Layers } from "lucide-react";
import { useAutosarStore, DataType } from "@/store/autosarStore";

const DataTypeEditor = () => {
  const { toast } = useToast();
  const { 
    currentProject, 
    createDataType, 
    updateDataType, 
    deleteDataType 
  } = useAutosarStore();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingDataType, setEditingDataType] = useState<DataType | null>(null);
  
  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<DataType['category']>("primitive");
  const [baseType, setBaseType] = useState("");
  const [arraySize, setArraySize] = useState<number | undefined>();
  const [recordElements, setRecordElements] = useState<{name: string; type: string}[]>([]);

  const primitiveTypes = [
    "uint8", "uint16", "uint32", "uint64",
    "sint8", "sint16", "sint32", "sint64", 
    "float32", "float64", "boolean"
  ];

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("primitive");
    setBaseType("");
    setArraySize(undefined);
    setRecordElements([]);
    setEditingDataType(null);
  };

  const handleCreateDataType = () => {
    if (!name) {
      toast({
        title: "Validation Error",
        description: "Data type name is required",
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

    const dataTypeData: Omit<DataType, 'id'> = {
      name,
      description,
      category,
      ...(category === "primitive" && { baseType }),
      ...(category === "array" && { baseType, arraySize }),
      ...(category === "record" && { elements: recordElements }),
    };

    if (editingDataType) {
      updateDataType(editingDataType.id, dataTypeData);
      toast({
        title: "Data Type Updated",
        description: `${name} has been updated successfully`,
      });
    } else {
      createDataType(dataTypeData);
      toast({
        title: "Data Type Created",
        description: `${name} has been created successfully`,
      });
    }

    resetForm();
    setIsCreateDialogOpen(false);
  };

  const handleEditDataType = (dataType: DataType) => {
    setName(dataType.name);
    setDescription(dataType.description || "");
    setCategory(dataType.category);
    setBaseType(dataType.baseType || "");
    setArraySize(dataType.arraySize);
    setRecordElements(dataType.elements || []);
    setEditingDataType(dataType);
    setIsCreateDialogOpen(true);
  };

  const handleDeleteDataType = (id: string) => {
    deleteDataType(id);
    toast({
      title: "Data Type Deleted",
      description: "Data type has been deleted",
    });
  };

  const addRecordElement = () => {
    setRecordElements([...recordElements, { name: "", type: "" }]);
  };

  const updateRecordElement = (index: number, field: 'name' | 'type', value: string) => {
    const updated = [...recordElements];
    updated[index][field] = value;
    setRecordElements(updated);
  };

  const removeRecordElement = (index: number) => {
    setRecordElements(recordElements.filter((_, i) => i !== index));
  };

  const getDataTypeIcon = (category: DataType['category']) => {
    switch (category) {
      case 'primitive': return Hash;
      case 'array': return ListOrdered;
      case 'record': return Layers;
      default: return Database;
    }
  };

  if (!currentProject) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-12">
          <Database className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">No Project Loaded</h2>
          <p className="text-muted-foreground mb-4">
            Please create or load a project to manage data types
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
          <h1 className="text-3xl font-bold text-foreground">Data Type Editor</h1>
          <p className="text-muted-foreground mt-1">
            Define and manage application data types and elements
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="autosar-button flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Data Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingDataType ? "Edit Data Type" : "Create Data Type"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dt-name">Name *</Label>
                  <Input
                    id="dt-name"
                    placeholder="e.g., EngineSpeed_T"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dt-category">Category *</Label>
                  <Select value={category} onValueChange={(value: DataType['category']) => setCategory(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primitive">Primitive Type</SelectItem>
                      <SelectItem value="array">Array Type</SelectItem>
                      <SelectItem value="record">Record/Structure</SelectItem>
                      <SelectItem value="typedef">Type Definition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="dt-description">Description</Label>
                <Textarea
                  id="dt-description"
                  placeholder="Description of the data type"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              {(category === "primitive" || category === "array" || category === "typedef") && (
                <div>
                  <Label htmlFor="dt-base-type">Base Type *</Label>
                  <Select value={baseType} onValueChange={setBaseType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select base type" />
                    </SelectTrigger>
                    <SelectContent>
                      {primitiveTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                      {currentProject.dataTypes.map((dt) => (
                        <SelectItem key={dt.id} value={dt.name}>{dt.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {category === "array" && (
                <div>
                  <Label htmlFor="dt-array-size">Array Size</Label>
                  <Input
                    id="dt-array-size"
                    type="number"
                    placeholder="e.g., 10"
                    value={arraySize || ""}
                    onChange={(e) => setArraySize(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
              )}

              {category === "record" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Record Elements</Label>
                    <Button type="button" size="sm" onClick={addRecordElement}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Element
                    </Button>
                  </div>
                  {recordElements.map((element, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder="Element name"
                        value={element.name}
                        onChange={(e) => updateRecordElement(index, 'name', e.target.value)}
                      />
                      <Select value={element.type} onValueChange={(value) => updateRecordElement(index, 'type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {primitiveTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                          {currentProject.dataTypes.map((dt) => (
                            <SelectItem key={dt.id} value={dt.name}>{dt.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeRecordElement(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleCreateDataType} className="autosar-button">
                  {editingDataType ? "Update" : "Create"} Data Type
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Data Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentProject.dataTypes.map((dataType) => {
          const IconComponent = getDataTypeIcon(dataType.category);
          return (
            <Card key={dataType.id} className="autosar-card hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <IconComponent className="h-5 w-5" />
                      {dataType.name}
                    </CardTitle>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {dataType.category}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditDataType(dataType)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteDataType(dataType.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4 min-h-[40px]">
                  {dataType.description || "No description provided"}
                </CardDescription>
                
                <div className="space-y-2 text-sm">
                  {dataType.baseType && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base Type:</span>
                      <span className="font-medium">{dataType.baseType}</span>
                    </div>
                  )}
                  {dataType.arraySize && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Array Size:</span>
                      <span className="font-medium">{dataType.arraySize}</span>
                    </div>
                  )}
                  {dataType.elements && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Elements:</span>
                      <span className="font-medium">{dataType.elements.length}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {currentProject.dataTypes.length === 0 && (
        <Card className="autosar-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Application Data Types
            </CardTitle>
            <CardDescription>
              Custom data types for your AUTOSAR application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No data types defined yet</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                Create Data Type
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DataTypeEditor;
