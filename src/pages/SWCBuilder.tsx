import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Box, 
  Plus, 
  Settings, 
  FileCode, 
  Layers,
  Info,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

const SWCBuilder = () => {
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

  const validationRules = [
    { id: 1, rule: "SWC name must be unique", status: "valid", message: "Component name is available" },
    { id: 2, rule: "Short name pattern compliance", status: "valid", message: "Follows AUTOSAR naming convention" },
    { id: 3, rule: "Category selection required", status: swcCategory ? "valid" : "warning", message: swcCategory ? "Category selected" : "Please select a category" },
    { id: 4, rule: "Implementation reference", status: "warning", message: "Implementation details not configured" },
  ];

  const existingComponents = [
    { name: "EngineController", category: "Application SWC", ports: 12, status: "Active" },
    { name: "BrakeManager", category: "Service SWC", ports: 8, status: "Active" },
    { name: "SensorInterface", category: "ECU Abstraction SWC", ports: 6, status: "Draft" },
  ];

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
          <Button variant="outline">
            <FileCode className="h-4 w-4 mr-2" />
            Import ARXML
          </Button>
          <Button className="autosar-button">
            <Plus className="h-4 w-4 mr-2" />
            Create SWC
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="autosar-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="h-5 w-5" />
                Component Configuration
              </CardTitle>
              <CardDescription>
                Define the basic properties of your software component
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  <TabsTrigger value="implementation">Implementation</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="swc-name">Short Name *</Label>
                      <Input
                        id="swc-name"
                        placeholder="e.g., EngineController"
                        value={swcName}
                        onChange={(e) => setSwcName(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="swc-description">Description</Label>
                      <Textarea
                        id="swc-description"
                        placeholder="Brief description of the component functionality"
                        value={swcDescription}
                        onChange={(e) => setSwcDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
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
                      
                      <div className="grid gap-2">
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
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="advanced" className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="uuid">UUID</Label>
                      <Input
                        id="uuid"
                        placeholder="Auto-generated UUID"
                        value="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="ar-package">AR-PACKAGE Path</Label>
                      <Input
                        id="ar-package"
                        placeholder="/ComponentTypes/ApplicationSWCs"
                        value="/ComponentTypes/ApplicationSWCs"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="autosar-version">AUTOSAR Version</Label>
                      <Select defaultValue="4.3.1">
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
                </TabsContent>
                
                <TabsContent value="implementation" className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="impl-name">Implementation Name</Label>
                      <Input
                        id="impl-name"
                        placeholder="e.g., EngineController_Implementation"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="code-file">Code File Reference</Label>
                      <Input
                        id="code-file"
                        placeholder="e.g., EngineController.c"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="build-type">Build Type</Label>
                      <Select defaultValue="library">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="library">Library</SelectItem>
                          <SelectItem value="executable">Executable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Validation */}
          <Card className="autosar-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Validation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {validationRules.map((rule) => (
                  <div key={rule.id} className="flex items-start gap-3">
                    {rule.status === "valid" ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{rule.rule}</p>
                      <p className="text-xs text-muted-foreground">{rule.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Existing Components */}
          <Card className="autosar-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Existing Components
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {existingComponents.map((component, index) => (
                  <div key={index} className="p-3 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{component.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {component.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{component.category}</p>
                    <p className="text-xs text-muted-foreground">{component.ports} ports</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="autosar-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Port
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Behavior
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <FileCode className="h-4 w-4 mr-2" />
                  Generate ARXML
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SWCBuilder;
