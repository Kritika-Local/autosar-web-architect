
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Plus } from "lucide-react";

const DataTypeEditor = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Data Type Editor</h1>
          <p className="text-muted-foreground mt-1">
            Define and manage application data types and elements
          </p>
        </div>
        <Button className="autosar-button flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Data Type
        </Button>
      </div>

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
            <Button variant="outline" className="mt-4">
              Create Data Type
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataTypeEditor;
