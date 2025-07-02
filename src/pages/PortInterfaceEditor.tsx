
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Network, 
  Download,
  Settings,
  Trash2,
  Edit,
  FileText
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAutosarStore } from "@/store/autosarStore";
import CreateInterfaceDialog from "@/components/CreateInterfaceDialog";
import CreatePortDialog from "@/components/CreatePortDialog";
import EditPortDialog from "@/components/EditPortDialog";

const PortInterfaceEditor = () => {
  const { toast } = useToast();
  const { currentProject, deleteInterface, deletePort } = useAutosarStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInterface, setSelectedInterface] = useState<any>(null);
  const [editPortDialogOpen, setEditPortDialogOpen] = useState(false);
  const [portToEdit, setPortToEdit] = useState<any>(null);

  const filteredInterfaces = currentProject?.interfaces?.filter(iface =>
    iface.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredPorts = currentProject?.swcs?.flatMap(swc => 
    swc.ports?.map(port => ({ ...port, swcName: swc.name })) || []
  ).filter(port => 
    port.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleExportInterface = (interfaceData: any) => {
    // Generate ARXML for interface
    const arxml = `<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-2-2.xsd">
  <AR-PACKAGES>
    <AR-PACKAGE>
      <SHORT-NAME>Interfaces</SHORT-NAME>
      <ELEMENTS>
        <${interfaceData.type === 'SenderReceiver' ? 'SENDER-RECEIVER-INTERFACE' : 'CLIENT-SERVER-INTERFACE'}>
          <SHORT-NAME>${interfaceData.name}</SHORT-NAME>
          <DATA-ELEMENTS>
            ${interfaceData.dataElements.map((de: any) => `
            <VARIABLE-DATA-PROTOTYPE>
              <SHORT-NAME>${de.name}</SHORT-NAME>
              <TYPE-TREF DEST="APPLICATION-PRIMITIVE-DATA-TYPE">/DataTypes/${de.applicationDataTypeRef}</TYPE-TREF>
            </VARIABLE-DATA-PROTOTYPE>`).join('')}
          </DATA-ELEMENTS>
        </${interfaceData.type === 'SenderReceiver' ? 'SENDER-RECEIVER-INTERFACE' : 'CLIENT-SERVER-INTERFACE'}>
      </ELEMENTS>
    </AR-PACKAGE>
  </AR-PACKAGES>
</AUTOSAR>`;

    const blob = new Blob([arxml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${interfaceData.name}_Interface.arxml`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Interface Exported",
      description: `${interfaceData.name} exported as ARXML`,
    });
  };

  const handleExportPort = (portData: any) => {
    // Generate ARXML for port
    const arxml = `<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-2-2.xsd">
  <AR-PACKAGES>
    <AR-PACKAGE>
      <SHORT-NAME>Ports</SHORT-NAME>
      <ELEMENTS>
        <${portData.direction === 'provided' ? 'P-PORT-PROTOTYPE' : 'R-PORT-PROTOTYPE'}>
          <SHORT-NAME>${portData.name}</SHORT-NAME>
          <PROVIDED-INTERFACE-TREF DEST="PORT-INTERFACE">/Interfaces/${portData.interfaceRef}</PROVIDED-INTERFACE-TREF>
        </${portData.direction === 'provided' ? 'P-PORT-PROTOTYPE' : 'R-PORT-PROTOTYPE'}>
      </ELEMENTS>
    </AR-PACKAGE>
  </AR-PACKAGES>
</AUTOSAR>`;

    const blob = new Blob([arxml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${portData.name}_Port.arxml`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Port Exported",
      description: `${portData.name} exported as ARXML`,
    });
  };

  const openEditPortDialog = (port: any) => {
    setPortToEdit(port);
    setEditPortDialogOpen(true);
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
          <h1 className="text-3xl font-bold text-foreground">Port & Interface Editor</h1>
          <p className="text-muted-foreground mt-1">
            Manage port interfaces and port configurations for AUTOSAR communication
          </p>
        </div>
        <div className="flex gap-2">
          <CreateInterfaceDialog />
          <CreatePortDialog />
        </div>
      </div>

      {/* Search */}
      <Card className="autosar-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search interfaces and ports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Port Interfaces */}
        <Card className="autosar-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Port Interfaces
                </CardTitle>
                <CardDescription>
                  AUTOSAR 4.2.2 compatible interface definitions
                </CardDescription>
              </div>
              <Badge variant="outline">{filteredInterfaces.length} interfaces</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredInterfaces.length > 0 ? (
                filteredInterfaces.map((iface) => (
                  <div key={iface.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{iface.name}</h3>
                        <Badge variant="secondary">{iface.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {iface.dataElements?.length || 0} data elements
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExportInterface(iface)}>
                          <Download className="h-4 w-4 mr-2" />
                          Export ARXML
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSelectedInterface(iface)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteInterface(iface.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No port interfaces found</p>
                  <p className="text-sm">Create interfaces to enable SWC communication</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ports */}
        <Card className="autosar-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Ports
                </CardTitle>
                <CardDescription>
                  SWC communication ports (Provided/Required)
                </CardDescription>
              </div>
              <Badge variant="outline">{filteredPorts.length} ports</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredPorts.length > 0 ? (
                filteredPorts.map((port) => (
                  <div key={port.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{port.name}</h3>
                        <Badge variant={port.direction === 'provided' ? 'default' : 'secondary'}>
                          {port.direction === 'provided' ? 'P-Port' : 'R-Port'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {port.swcName} → {port.interfaceRef}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExportPort(port)}>
                          <Download className="h-4 w-4 mr-2" />
                          Export ARXML
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditPortDialog(port)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deletePort(port.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No ports found</p>
                  <p className="text-sm">Create ports to enable SWC communication</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interface Details */}
      {selectedInterface && (
        <Card className="autosar-card">
          <CardHeader>
            <CardTitle>Interface Details - {selectedInterface.name}</CardTitle>
            <CardDescription>
              Data elements and interface configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Interface Name</Label>
                  <Input value={selectedInterface.name} readOnly />
                </div>
                <div>
                  <Label>Interface Type</Label>
                  <Input value={selectedInterface.type} readOnly />
                </div>
              </div>
              
              <div>
                <Label>Data Elements</Label>
                <div className="border rounded-lg mt-2">
                  <div className="grid grid-cols-3 gap-4 p-3 bg-muted font-medium text-sm">
                    <span>Name</span>
                    <span>Type</span>
                    <span>Category</span>
                  </div>
                  {selectedInterface.dataElements?.map((de: any, index: number) => (
                    <div key={index} className="grid grid-cols-3 gap-4 p-3 border-t">
                      <span>{de.name}</span>
                      <span>{de.applicationDataTypeRef}</span>
                      <Badge variant="outline">{de.category}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={() => handleExportInterface(selectedInterface)}>
                  <Download className="h-4 w-4 mr-2" />
                  Export ARXML
                </Button>
                <Button variant="outline" onClick={() => setSelectedInterface(null)}>
                  Close
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Port Dialog */}
      <EditPortDialog
        open={editPortDialogOpen}
        onOpenChange={setEditPortDialogOpen}
        port={portToEdit}
      />
    </div>
  );
};

export default PortInterfaceEditor;
