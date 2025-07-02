
import { RequirementDocument } from './requirementParser';
import { Swc, Interface, Port, Runnable, DataElement, AccessPoint } from '@/store/autosarStore';
import { v4 as uuidv4 } from 'uuid';

interface AutosarArtifacts {
  swcs: Omit<Swc, 'id'>[];
  interfaces: Omit<Interface, 'id'>[];
  ports: Array<Omit<Port, 'id'> & { swcName: string }>;
  runnables: Array<Omit<Runnable, 'id'> & { swcName: string }>;
  dataElements: DataElement[];
  accessPoints: Array<Omit<AccessPoint, 'id'> & { runnableName: string; swcName: string }>;
  ecuComposition?: {
    name: string;
    swcInstances: Array<{ name: string; swcRef: string }>;
  };
}

export class AutosarGenerator {
  static generateArtifacts(requirements: RequirementDocument[]): AutosarArtifacts {
    console.log('Starting AUTOSAR artifact generation for', requirements.length, 'requirements');
    
    const artifacts: AutosarArtifacts = {
      swcs: [],
      interfaces: [],
      ports: [],
      runnables: [],
      dataElements: [],
      accessPoints: []
    };

    // Process each requirement
    for (const req of requirements) {
      console.log(`Processing requirement: ${req.id} - ${req.shortName}`);
      this.processRequirement(req, artifacts);
    }

    // Generate ECU composition
    this.generateEcuComposition(requirements, artifacts);

    console.log('Generated artifacts:', {
      swcs: artifacts.swcs.length,
      interfaces: artifacts.interfaces.length,
      ports: artifacts.ports.length,
      runnables: artifacts.runnables.length,
      accessPoints: artifacts.accessPoints.length
    });

    return artifacts;
  }

  private static processRequirement(req: RequirementDocument, artifacts: AutosarArtifacts) {
    // Create SWCs
    this.createSwcs(req, artifacts);
    
    // Create Interfaces
    this.createInterfaces(req, artifacts);
    
    // Create Ports
    this.createPorts(req, artifacts);
    
    // Create Runnables
    this.createRunnables(req, artifacts);
    
    // Create Access Points
    this.createAccessPoints(req, artifacts);
  }

  private static createSwcs(req: RequirementDocument, artifacts: AutosarArtifacts) {
    for (const swcName of req.derivedElements.swcs) {
      const fullSwcName = swcName.endsWith('Controller') ? swcName : swcName + 'Controller';
      
      if (!artifacts.swcs.find(s => s.name === fullSwcName)) {
        artifacts.swcs.push({
          name: fullSwcName,
          description: `Software component for ${swcName.replace('Controller', '').toLowerCase()} functionality (Generated from ${req.id})`,
          category: this.inferSwcCategory(req.description),
          type: 'atomic'
        });
        console.log(`Created SWC: ${fullSwcName}`);
      }
    }
  }

  private static createInterfaces(req: RequirementDocument, artifacts: AutosarArtifacts) {
    for (const interfaceName of req.derivedElements.interfaces) {
      if (!artifacts.interfaces.find(i => i.name === interfaceName)) {
        const dataElements = this.createDataElementsForInterface(req, interfaceName);
        
        artifacts.interfaces.push({
          name: interfaceName,
          type: req.communication?.interfaceType || 'SenderReceiver',
          dataElements
        });
        
        artifacts.dataElements.push(...dataElements);
        console.log(`Created Interface: ${interfaceName} with ${dataElements.length} data elements`);
      }
    }
  }

  private static createDataElementsForInterface(req: RequirementDocument, interfaceName: string): DataElement[] {
    const dataElements: DataElement[] = [];
    
    if (req.communication?.dataElements) {
      for (const commDataElement of req.communication.dataElements) {
        dataElements.push({
          id: uuidv4(),
          name: commDataElement.name,
          applicationDataTypeRef: commDataElement.type,
          category: 'VALUE',
          description: `Data element ${commDataElement.name} from ${req.id}`,
          swDataDefProps: {
            baseTypeRef: commDataElement.type,
            implementationDataTypeRef: commDataElement.type
          }
        });
      }
    }

    // Ensure at least one data element
    if (dataElements.length === 0) {
      dataElements.push({
        id: uuidv4(),
        name: 'DataElement',
        applicationDataTypeRef: 'uint32',
        category: 'VALUE',
        description: `Default data element for ${interfaceName}`,
        swDataDefProps: {
          baseTypeRef: 'uint32',
          implementationDataTypeRef: 'uint32'
        }
      });
    }

    return dataElements;
  }

  private static createPorts(req: RequirementDocument, artifacts: AutosarArtifacts) {
    const swcs = req.derivedElements.swcs.map(name => 
      name.endsWith('Controller') ? name : name + 'Controller'
    );
    const interfaces = req.derivedElements.interfaces;
    
    if (swcs.length === 0 || interfaces.length === 0) return;

    const primarySwc = swcs[0];
    const primaryInterface = interfaces[0];
    const communication = req.communication;

    // Create ports based on communication direction
    if (communication?.direction === 'sender' || communication?.direction === 'both') {
      const portName = primarySwc.replace('Controller', '') + 'OutputPort';
      if (!artifacts.ports.find(p => p.name === portName && p.swcName === primarySwc)) {
        artifacts.ports.push({
          name: portName,
          direction: 'provided',
          interfaceRef: primaryInterface,
          swcName: primarySwc
        });
        console.log(`Created Provided Port: ${portName} for SWC: ${primarySwc}`);
      }
    }

    if (communication?.direction === 'receiver' || communication?.direction === 'both') {
      const portName = primarySwc.replace('Controller', '') + 'InputPort';
      if (!artifacts.ports.find(p => p.name === portName && p.swcName === primarySwc)) {
        artifacts.ports.push({
          name: portName,
          direction: 'required',
          interfaceRef: primaryInterface,
          swcName: primarySwc
        });
        console.log(`Created Required Port: ${portName} for SWC: ${primarySwc}`);
      }
    }

    // If no specific direction, create a provided port
    if (!communication?.direction) {
      const portName = primarySwc.replace('Controller', '') + 'Port';
      if (!artifacts.ports.find(p => p.name === portName && p.swcName === primarySwc)) {
        artifacts.ports.push({
          name: portName,
          direction: 'provided',
          interfaceRef: primaryInterface,
          swcName: primarySwc
        });
        console.log(`Created Default Port: ${portName} for SWC: ${primarySwc}`);
      }
    }
  }

  private static createRunnables(req: RequirementDocument, artifacts: AutosarArtifacts) {
    const swcs = req.derivedElements.swcs.map(name => 
      name.endsWith('Controller') ? name : name + 'Controller'
    );
    
    for (const swcName of swcs) {
      const baseName = swcName.replace('Controller', '');
      
      // Create Init runnable
      const initRunnableName = baseName + '_Init';
      if (!artifacts.runnables.find(r => r.name === initRunnableName && r.swcName === swcName)) {
        artifacts.runnables.push({
          name: initRunnableName,
          period: 0,
          runnableType: 'init',
          canBeInvokedConcurrently: false,
          swcName: swcName
        });
        console.log(`Created Init Runnable: ${initRunnableName}`);
      }

      // Create main runnable based on timing
      let mainRunnableName: string;
      let period = 100; // default 100ms
      let runnableType: 'periodic' | 'event' | 'init' = 'periodic';

      if (req.timing?.type === 'periodic' && req.timing.period) {
        period = req.timing.unit === 's' ? req.timing.period * 1000 : req.timing.period;
        mainRunnableName = `${baseName}_${req.timing.period}${req.timing.unit || 'ms'}`;
        runnableType = 'periodic';
      } else if (req.timing?.type === 'event') {
        mainRunnableName = baseName + '_Event';
        runnableType = 'event';
        period = 0;
      } else {
        mainRunnableName = baseName + '_Main';
        runnableType = 'periodic';
      }

      if (!artifacts.runnables.find(r => r.name === mainRunnableName && r.swcName === swcName)) {
        artifacts.runnables.push({
          name: mainRunnableName,
          period: period,
          runnableType: runnableType,
          canBeInvokedConcurrently: false,
          swcName: swcName
        });
        console.log(`Created Main Runnable: ${mainRunnableName} (${runnableType}, ${period}ms)`);
      }
    }
  }

  private static createAccessPoints(req: RequirementDocument, artifacts: AutosarArtifacts) {
    const swcs = req.derivedElements.swcs.map(name => 
      name.endsWith('Controller') ? name : name + 'Controller'
    );
    
    for (const swcName of swcs) {
      const swcPorts = artifacts.ports.filter(p => p.swcName === swcName);
      const swcRunnables = artifacts.runnables.filter(r => r.swcName === swcName);
      
      // Create access points for main runnables (not init)
      const mainRunnables = swcRunnables.filter(r => r.runnableType !== 'init');
      
      for (const runnable of mainRunnables) {
        for (const port of swcPorts) {
          const interface_ = artifacts.interfaces.find(i => i.name === port.interfaceRef);
          if (!interface_) continue;
          
          const dataElement = interface_.dataElements[0]; // Use first data element
          if (!dataElement) continue;
          
          let accessType: 'iRead' | 'iWrite' | 'iCall';
          let accessName: string;
          
          if (port.direction === 'provided') {
            accessType = 'iWrite';
            accessName = `Rte_IWrite_${port.name}_${dataElement.name}`;
          } else {
            accessType = 'iRead';
            accessName = `Rte_IRead_${port.name}_${dataElement.name}`;
          }
          
          // Check if access point already exists
          const existingAp = artifacts.accessPoints.find(ap => 
            ap.name === accessName && ap.runnableName === runnable.name && ap.swcName === swcName
          );
          
          if (!existingAp) {
            artifacts.accessPoints.push({
              name: accessName,
              type: accessType,
              access: 'implicit',
              swcId: '', // Will be set when creating
              runnableId: '', // Will be set when creating
              portRef: port.name,
              dataElementRef: dataElement.name,
              runnableName: runnable.name,
              swcName: swcName
            });
            console.log(`Created Access Point: ${accessName} for ${runnable.name}`);
          }
        }
      }
    }
  }

  private static generateEcuComposition(requirements: RequirementDocument[], artifacts: AutosarArtifacts) {
    const ecuNames = new Set<string>();
    const swcInstances: Array<{ name: string; swcRef: string }> = [];

    // Collect ECU names from requirements
    for (const req of requirements) {
      if (req.ecuBehavior?.ecuName) {
        ecuNames.add(req.ecuBehavior.ecuName);
      }
    }

    // Add all created SWCs as instances
    for (const swc of artifacts.swcs) {
      swcInstances.push({
        name: swc.name + 'Instance',
        swcRef: swc.name
      });
    }

    const ecuName = ecuNames.size > 0 ? Array.from(ecuNames)[0] : 'SystemECU';
    
    artifacts.ecuComposition = {
      name: ecuName + 'Composition',
      swcInstances
    };

    console.log(`Created ECU Composition: ${ecuName}Composition with ${swcInstances.length} SWC instances`);
  }

  private static inferSwcCategory(description: string): Swc['category'] {
    const desc = description.toLowerCase();
    if (desc.includes('sensor') || desc.includes('actuator')) return 'sensor-actuator';
    if (desc.includes('driver') || desc.includes('hardware')) return 'complex-driver';
    if (desc.includes('service') || desc.includes('diagnostic')) return 'service';
    if (desc.includes('abstraction') || desc.includes('layer')) return 'ecu-abstraction';
    return 'application';
  }
}
