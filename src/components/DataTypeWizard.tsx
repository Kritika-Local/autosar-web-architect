
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

interface DataTypeWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: any) => void;
  existingDataTypes: any[];
}

const DataTypeWizard = ({ open, onOpenChange, onComplete, existingDataTypes }: DataTypeWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Data Element Info
    elementName: "",
    elementDescription: "",
    elementCategory: "",
    
    // Step 2: Base Type Selection
    baseType: "",
    
    // Step 3: Data Type Creation/Reuse
    reuseExisting: false,
    existingDataTypeId: "",
    newDataTypeName: "",
    newDataTypeDescription: "",
    constraints: {
      min: "",
      max: "",
      granularity: ""
    }
  });

  const baseTypes = [
    { value: "uint8", label: "uint8 (8-bit unsigned integer)" },
    { value: "uint16", label: "uint16 (16-bit unsigned integer)" },
    { value: "uint32", label: "uint32 (32-bit unsigned integer)" },
    { value: "float32", label: "float32 (32-bit floating point)" },
    { value: "boolean", label: "boolean (true/false)" },
    { value: "array", label: "Array" },
    { value: "structure", label: "Structure" }
  ];

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Generate AUTOSAR-compliant access point name
    const accessPointName = `iRead_${formData.elementName}`;
    
    const result = {
      dataElement: {
        name: formData.elementName,
        description: formData.elementDescription,
        category: formData.elementCategory,
        applicationDataTypeRef: formData.reuseExisting ? 
          existingDataTypes.find(dt => dt.id === formData.existingDataTypeId)?.name :
          formData.newDataTypeName
      },
      dataType: formData.reuseExisting ? null : {
        name: formData.newDataTypeName,
        description: formData.newDataTypeDescription,
        category: formData.baseType === "array" ? "array" : 
                 formData.baseType === "structure" ? "record" : "primitive",
        baseType: formData.baseType,
        constraints: formData.constraints
      },
      accessPointName
    };

    onComplete(result);
    onOpenChange(false);
    setCurrentStep(1);
    setFormData({
      elementName: "",
      elementDescription: "",
      elementCategory: "",
      baseType: "",
      reuseExisting: false,
      existingDataTypeId: "",
      newDataTypeName: "",
      newDataTypeDescription: "",
      constraints: { min: "", max: "", granularity: "" }
    });
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.elementName.trim() !== "";
      case 2:
        return formData.baseType !== "";
      case 3:
        return formData.reuseExisting ? 
          formData.existingDataTypeId !== "" :
          formData.newDataTypeName.trim() !== "";
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Data Type Creation Wizard</DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {step < currentStep ? <Check className="h-4 w-4" /> : step}
                </div>
                {step < 3 && <div className="w-8 h-px bg-border" />}
              </div>
            ))}
          </div>
        </DialogHeader>
        
        <div className="py-4">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Step 1: Data Element Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="element-name">Element Name *</Label>
                    <Input
                      id="element-name"
                      placeholder="e.g., EngineSpeed"
                      value={formData.elementName}
                      onChange={(e) => setFormData({...formData, elementName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="element-description">Description</Label>
                    <Textarea
                      id="element-description"
                      placeholder="Description of the data element"
                      value={formData.elementDescription}
                      onChange={(e) => setFormData({...formData, elementDescription: e.target.value})}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="element-category">Category</Label>
                    <Input
                      id="element-category"
                      placeholder="e.g., VALUE"
                      value={formData.elementCategory}
                      onChange={(e) => setFormData({...formData, elementCategory: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Step 2: Choose Base Type</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Select Base Type *</Label>
                    <Select value={formData.baseType} onValueChange={(value) => setFormData({...formData, baseType: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a base type" />
                      </SelectTrigger>
                      <SelectContent>
                        {baseTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.baseType && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">
                        Selected: <Badge variant="outline">{formData.baseType}</Badge>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Step 3: Data Type Configuration</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="reuse-existing"
                      name="datatype-option"
                      checked={formData.reuseExisting}
                      onChange={() => setFormData({...formData, reuseExisting: true})}
                    />
                    <Label htmlFor="reuse-existing">Reuse existing data type</Label>
                  </div>
                  
                  {formData.reuseExisting && (
                    <div className="ml-6">
                      <Select value={formData.existingDataTypeId} onValueChange={(value) => setFormData({...formData, existingDataTypeId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select existing data type" />
                        </SelectTrigger>
                        <SelectContent>
                          {existingDataTypes.map((dt) => (
                            <SelectItem key={dt.id} value={dt.id}>{dt.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="create-new"
                      name="datatype-option"
                      checked={!formData.reuseExisting}
                      onChange={() => setFormData({...formData, reuseExisting: false})}
                    />
                    <Label htmlFor="create-new">Create new data type</Label>
                  </div>

                  {!formData.reuseExisting && (
                    <div className="ml-6 space-y-4">
                      <div>
                        <Label htmlFor="new-datatype-name">Data Type Name *</Label>
                        <Input
                          id="new-datatype-name"
                          placeholder="e.g., EngineSpeedType"
                          value={formData.newDataTypeName}
                          onChange={(e) => setFormData({...formData, newDataTypeName: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="new-datatype-description">Description</Label>
                        <Textarea
                          id="new-datatype-description"
                          placeholder="Description of the data type"
                          value={formData.newDataTypeDescription}
                          onChange={(e) => setFormData({...formData, newDataTypeDescription: e.target.value})}
                          rows={2}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <Label>Data Constraints (Optional)</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div>
                            <Label htmlFor="min-value" className="text-xs">Min Value</Label>
                            <Input
                              id="min-value"
                              placeholder="0"
                              value={formData.constraints.min}
                              onChange={(e) => setFormData({
                                ...formData, 
                                constraints: {...formData.constraints, min: e.target.value}
                              })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="max-value" className="text-xs">Max Value</Label>
                            <Input
                              id="max-value"
                              placeholder="100"
                              value={formData.constraints.max}
                              onChange={(e) => setFormData({
                                ...formData, 
                                constraints: {...formData.constraints, max: e.target.value}
                              })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="granularity" className="text-xs">Granularity</Label>
                            <Input
                              id="granularity"
                              placeholder="0.1"
                              value={formData.constraints.granularity}
                              onChange={(e) => setFormData({
                                ...formData, 
                                constraints: {...formData.constraints, granularity: e.target.value}
                              })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            
            {currentStep < 3 ? (
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="autosar-button"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!isStepValid()}
                className="autosar-button"
              >
                <Check className="h-4 w-4 mr-2" />
                Complete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DataTypeWizard;
