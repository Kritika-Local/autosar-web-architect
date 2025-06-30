
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cable, Plus, ArrowDown, ArrowUp } from "lucide-react";

const PortEditor = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Port & Interface Editor</h1>
          <p className="text-muted-foreground mt-1">
            Design and manage component ports and their interfaces
          </p>
        </div>
        <Button className="autosar-button flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Port
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="autosar-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUp className="h-5 w-5 text-green-500" />
              Provided Ports (P-Port)
            </CardTitle>
            <CardDescription>
              Ports that provide services to other components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Cable className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No provided ports configured</p>
              <Button variant="outline" className="mt-4">
                Add Provided Port
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="autosar-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDown className="h-5 w-5 text-blue-500" />
              Required Ports (R-Port)
            </CardTitle>
            <CardDescription>
              Ports that require services from other components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Cable className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No required ports configured</p>
              <Button variant="outline" className="mt-4">
                Add Required Port
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PortEditor;
