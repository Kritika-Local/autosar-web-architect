
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Plus } from "lucide-react";

const BehaviorDesigner = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Internal Behavior Designer</h1>
          <p className="text-muted-foreground mt-1">
            Configure runnables, events, and internal behavior
          </p>
        </div>
        <Button className="autosar-button flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Runnable
        </Button>
      </div>

      <Card className="autosar-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Runnables & Events
          </CardTitle>
          <CardDescription>
            Define the internal behavior of your software component
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No runnables configured</p>
            <Button variant="outline" className="mt-4">
              Create Runnable
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BehaviorDesigner;
