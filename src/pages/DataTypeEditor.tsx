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
  Database,
  Hash,
  List,
  FileType,
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

const DataTypeEditor = () => {
  const { toast } = useToast();
  const { 
    currentProject,
    createDataType,
    updateDataType,
    deleteDataType
  } = useAutosarStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dataTypeToDelete, setDataTypeToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState<'primitive' | 'array' | 'record' | 'typedef'>('primitive');
  const [baseType, setBaseType] = useState<string | undefined>(undefined);
  const [arraySize, setArraySize] = useState<number | undefined>(undefined);
  const [description, setDescription] = useState("");

  const handleCreateDataType = () => {
    if (!name || !category) {
      toast({
        title: "Validation Error",
        description: "Data Type name and category are required",
        variant: "destructive",
      });
      return;
    }

    createDataType({
      name,
      category,
      baseType,
      arraySize,
      description,
    });

    toast({
      title: "Data Type Created",
      description: `${name} has been created successfully`,
    });

    // Reset form
    setName("");
    setCategory('primitive');
    setBaseType(undefined);
    setArraySize(undefined);
    setDescription("");
    setIsCreateDialogOpen(false);
  };

  const handleDeleteDataType = async () => {
    if (!dataTypeToDelete) return;
    
    setIsDeleting(true);
    try {
      deleteDataType(dataTypeToDelete.id);
      toast({
        title: "Data Type Deleted",
        description: `Data type ${dataTypeToDelete.name} has been deleted successfully`,
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete data type",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setDataTypeToDelete(null);
    }
  };

  const openDeleteDialog = (id: string, name: string) => {
    setDataTypeToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const filteredDataTypes = currentProject?.dataTypes.filter(dataType =>
    dataType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dataType.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Data Type Editor</h1>
          <p className="text-muted-foreground mt-1">
            Manage your AUTOSAR data types
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="autosar-button flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Data Type
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Data Type</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Data Type Name *</Label>
                  <Input 
                    id="name" 
                    placeholder="Enter data type name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={(value) => setCategory(value as 'primitive' | 'array' | 'record' | 'typedef')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primitive">Primitive</SelectItem>
                      <SelectItem value="array">Array</SelectItem>
                      <SelectItem value="record">Record</SelectItem>
                      <SelectItem value="typedef">Typedef</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {category === 'primitive' && (
                  <div className="grid gap-2">
                    <Label htmlFor="base-type">Base Type</Label>
                    <Select value={baseType} onValueChange={setBaseType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a base type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uint8">uint8</SelectItem>
                        <SelectItem value="uint16">uint16</SelectItem>
                        <SelectItem value="uint32">uint32</SelectItem>
                        <SelectItem value="uint64">uint64</SelectItem>
                        <SelectItem value="float32">float32</SelectItem>
                        <SelectItem value="float64">float64</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {category === 'array' && (
                  <div className="grid gap-2">
                    <Label htmlFor="array-size">Array Size</Label>
                    <Input 
                      id="array-size" 
                      type="number"
                      placeholder="Enter array size" 
                      value={arraySize}
                      onChange={(e) => setArraySize(Number(e.target.value))}
                    />
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input 
                    id="description" 
                    placeholder="Brief description of the data type" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="autosar-button" onClick={handleCreateDataType}>
                  Create Data Type
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
                placeholder="Search data types..."
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
                <SelectItem value="all">All Data Types</SelectItem>
                <SelectItem value="primitive">Primitive</SelectItem>
                <SelectItem value="array">Array</SelectItem>
                <SelectItem value="record">Record</SelectItem>
                <SelectItem value="typedef">Typedef</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDataTypes.map((dataType) => (
          <Card key={dataType.id} className="autosar-card hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    {dataType.category === 'primitive' && <Hash className="h-5 w-5 text-white" />}
                    {dataType.category === 'array' && <List className="h-5 w-5 text-white" />}
                    {dataType.category === 'record' && <Database className="h-5 w-5 text-white" />}
                    {dataType.category === 'typedef' && <FileType className="h-5 w-5 text-white" />}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{dataType.name}</CardTitle>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {dataType.category}
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
                      onClick={() => openDeleteDialog(dataType.id, dataType.name)}
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
                {dataType.description || "No description provided"}
              </CardDescription>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium capitalize">{dataType.category}</span>
                </div>
                {dataType.baseType && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Base Type:</span>
                    <span className="font-medium">{dataType.baseType}</span>
                  </div>
                )}
                {dataType.arraySize && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Array Size:</span>
                    <span className="font-medium">{dataType.arraySize}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {currentProject?.dataTypes.length === 0 && (
        <Card className="autosar-car">
          <CardContent className="text-center py-12">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">
              No data types created yet
            </p>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="autosar-button"
            >
              Create Your First Data Type
            </Button>
          </CardContent>
        </Card>
      )}

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Data Type"
        description="Are you sure you want to delete this data type? This action cannot be undone and may affect data elements that use this type."
        itemName={dataTypeToDelete?.name || "Unknown Data Type"}
        onConfirm={handleDeleteDataType}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default DataTypeEditor;
