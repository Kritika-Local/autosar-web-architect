
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Edit, Settings } from 'lucide-react';

interface ParsedRequirement {
  id: string;
  originalText: string;
  interpretation: {
    swcs: Array<{
      name: string;
      category: 'application' | 'service' | 'ecu-abstraction' | 'complex-driver' | 'sensor-actuator';
    }>;
    interfaces: Array<{
      name: string;
      dataElements: Array<{
        name: string;
        dataType: string;
        size?: string;
      }>;
    }>;
    connections: Array<{
      sourceSWC: string;
      targetSWC: string;
      portInterface: string;
    }>;
    runnables: Array<{
      swcName: string;
      name: string;
      period: number;
      accessPoints: Array<{
        type: 'read' | 'write';
        portName: string;
        dataElement: string;
      }>;
    }>;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'needs_correction';
}

interface RequirementValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirements: ParsedRequirement[];
  onValidationComplete: (requirements: ParsedRequirement[]) => void;
}

const RequirementValidationDialog = ({ 
  open, 
  onOpenChange, 
  requirements, 
  onValidationComplete 
}: RequirementValidationDialogProps) => {
  const [localRequirements, setLocalRequirements] = useState<ParsedRequirement[]>(requirements);

  const updateRequirementStatus = (id: string, status: ParsedRequirement['status']) => {
    setLocalRequirements(prev => 
      prev.map(req => req.id === id ? { ...req, status } : req)
    );
  };

  const handleComplete = () => {
    onValidationComplete(localRequirements);
  };

  const getStatusIcon = (status: ParsedRequirement['status']) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'needs_correction':
        return <Edit className="h-4 w-4 text-yellow-500" />;
      default:
        return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ParsedRequirement['status']) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'needs_correction':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Validate Generated AUTOSAR Artifacts</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {localRequirements.map((req) => (
            <div key={req.id} className="border rounded-lg p-6 mb-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Requirement Analysis</h3>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    {req.originalText}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${getStatusColor(req.status)} flex items-center gap-1`}>
                    {getStatusIcon(req.status)}
                    {req.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>

              <Tabs defaultValue="swcs" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="swcs">SWCs ({req.interpretation.swcs.length})</TabsTrigger>
                  <TabsTrigger value="interfaces">Interfaces ({req.interpretation.interfaces.length})</TabsTrigger>
                  <TabsTrigger value="connections">Connections ({req.interpretation.connections.length})</TabsTrigger>
                  <TabsTrigger value="runnables">Runnables ({req.interpretation.runnables.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="swcs" className="space-y-3">
                  {req.interpretation.swcs.map((swc, idx) => (
                    <div key={idx} className="border rounded p-3">
                      <div className="font-medium">{swc.name}</div>
                      <div className="text-sm text-muted-foreground">Category: {swc.category}</div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="interfaces" className="space-y-3">
                  {req.interpretation.interfaces.map((iface, idx) => (
                    <div key={idx} className="border rounded p-3">
                      <div className="font-medium">{iface.name}</div>
                      <div className="text-sm text-muted-foreground mt-2">
                        <strong>Data Elements:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {iface.dataElements.map((de, deIdx) => (
                            <li key={deIdx}>{de.name} ({de.dataType})</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="connections" className="space-y-3">
                  {req.interpretation.connections.map((conn, idx) => (
                    <div key={idx} className="border rounded p-3">
                      <div className="font-medium">
                        {conn.sourceSWC} → {conn.targetSWC}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Interface: {conn.portInterface}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="runnables" className="space-y-3">
                  {req.interpretation.runnables.map((runnable, idx) => (
                    <div key={idx} className="border rounded p-3">
                      <div className="font-medium">{runnable.name}</div>
                      <div className="text-sm text-muted-foreground">
                        SWC: {runnable.swcName} | Period: {runnable.period}ms
                      </div>
                      {runnable.accessPoints.length > 0 && (
                        <div className="mt-2">
                          <strong className="text-sm">Access Points:</strong>
                          <ul className="list-disc list-inside mt-1 text-sm text-muted-foreground">
                            {runnable.accessPoints.map((ap, apIdx) => (
                              <li key={apIdx}>
                                Rte_{ap.type === 'read' ? 'Read' : 'Write'}_{ap.portName}_{ap.dataElement}()
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  size="sm"
                  variant={req.status === 'accepted' ? 'default' : 'outline'}
                  onClick={() => updateRequirementStatus(req.id, 'accepted')}
                  className="flex items-center gap-1"
                >
                  <CheckCircle className="h-4 w-4" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant={req.status === 'needs_correction' ? 'default' : 'outline'}
                  onClick={() => updateRequirementStatus(req.id, 'needs_correction')}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Needs Correction
                </Button>
                <Button
                  size="sm"
                  variant={req.status === 'rejected' ? 'default' : 'outline'}
                  onClick={() => updateRequirementStatus(req.id, 'rejected')}
                  className="flex items-center gap-1"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {localRequirements.filter(r => r.status === 'accepted').length} accepted, 
            {localRequirements.filter(r => r.status === 'rejected').length} rejected, 
            {localRequirements.filter(r => r.status === 'needs_correction').length} need correction
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleComplete}
              disabled={localRequirements.every(r => r.status === 'pending')}
            >
              Generate Artifacts
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequirementValidationDialog;
