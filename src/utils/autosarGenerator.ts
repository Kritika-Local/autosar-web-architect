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
    // Create SWCs first
    this.createSwcs(req, artifacts);
    
    // Create Interfaces
    this.createInterfaces(req, artifacts);
    
    // Create Runnables (mapped to SWCs)
    this.createRunnables(req, artifacts);
    
    // Create Ports
    this.createPorts(req, artifacts);
    
    // Create Access Points (mapped to Runnables)
    this.createAccessPoints(req, artifacts);
  }

  private static createSwcs(req: RequirementDocument, artifacts: AutosarArtifacts) {
    for (const swcName of req.derivedElements.swcs) {
      // Keep original naming for _swc components, add Controller for others
      const fullSwcName = swcName.endsWith('_swc') ? swcName : 
                         swcName.endsWith('Controller') ? swcName : swcName + 'Controller';
      
      if (!artifacts.swcs.find(s => s.name === fullSwcName)) {
        // Create SWC with empty runnables and ports arrays that will be populated later
        artifacts.swcs.push({
          name: fullSwcName,
          description: `Software component for ${swcName.replace('Controller', '').replace('_swc', '').toLowerCase()} functionality (Generated from ${req.id})`,
          category: this.inferSwcCategory(req.description),
          type: 'atomic',
          runnables: [], // Initialize empty - will be populated by createRunnables
          ports: [] // Initialize empty - will be populated by createPorts
        });
        console.log(`Created SWC: ${fullSwcName}`);
      }
    }
  }

  private static createRunnables(req: RequirementDocument, artifacts: AutosarArtifacts) {
    const swcs = req.derivedElements.swcs.map(name => 
      name.endsWith('_swc') ? name : name.endsWith('Controller') ? name : name + 'Controller'
    );
    
    for (const swcName of swcs) {
      const baseName = swcName.replace('_swc', '').replace('Controller', '');
      
      // Create Init runnable
      const initRunnableName = `${swcName}_init`;
      if (!artifacts.runnables.find(r => r.name === initRunnableName && r.swcName === swcName)) {
        const initRunnable = {
          name: initRunnableName,
          period: 0,
          runnableType: 'init' as const,
          canBeInvokedConcurrently: false,
          swcName: swcName,
          accessPoints: [] // Initialize empty - will be populated by createAccessPoints
        };
        artifacts.runnables.push(initRunnable);
        console.log(`Created Init Runnable: ${initRunnableName} for SWC: ${swcName}`);
      }

      // Create main runnable based on timing
      let mainRunnableName: string;
      let period = 100; // default 100ms
      let runnableType: 'periodic' | 'event' | 'init' = 'periodic';

      if (req.timing?.type === 'periodic' && req.timing.period) {
        period = req.timing.unit === 's' ? req.timing.period * 1000 : req.timing.period;
        mainRunnableName = `${swcName}_${req.timing.period}${req.timing.unit || 'ms'}`;
        runnableType = 'periodic';
      } else if (req.timing?.type === 'event') {
        mainRunnableName = `${swcName}_Event`;
        runnableType = 'event';
        period = 0;
      } else {
        mainRunnableName = `${swcName}_main`;
        runnableType = 'periodic';
      }

      if (!artifacts.runnables.find(r => r.name === mainRunnableName && r.swcName === swcName)) {
        const mainRunnable = {
          name: mainRunnableName,
          period: period,
          runnableType: runnableType,
          canBeInvokedConcurrently: false,
          swcName: swcName,
          accessPoints: [] // Initialize empty - will be populated by createAccessPoints
        };
        artifacts.runnables.push(mainRunnable);
        console.log(`Created Main Runnable: ${mainRunnableName} (${runnableType}, ${period}ms) for SWC: ${swcName}`);
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

    // Ensure at least one data element based on signals
    if (dataElements.length === 0 && req.derivedElements.signals.length > 0) {
      for (const signal of req.derivedElements.signals) {
        dataElements.push({
          id: uuidv4(),
          name: signal,
          applicationDataTypeRef: 'uint16', // Default automotive type
          category: 'VALUE',
          description: `Data element for ${signal} signal from ${req.id}`,
          swDataDefProps: {
            baseTypeRef: 'uint16',
            implementationDataTypeRef: 'uint16'
          }
        });
      }
    }

    // Fallback data element
    if (dataElements.length === 0) {
      dataElements.push({
        id: uuidv4(),
        name: 'DataElement',
        applicationDataTypeRef: 'uint16',
        category: 'VALUE',
        description: `Default data element for ${interfaceName}`,
        swDataDefProps: {
          baseTypeRef: 'uint16',
          implementationDataTypeRef: 'uint16'
        }
      });
    }

    return dataElements;
  }

  private static createPorts(req: RequirementDocument, artifacts: AutosarArtifacts) {
    const swcs = req.derivedElements.swcs.map(name => 
      name.endsWith('_swc') ? name : name.endsWith('Controller') ? name : name + 'Controller'
    );
    const interfaces = req.derivedElements.interfaces;
    
    if (swcs.length < 2 || interfaces.length === 0) {
      // Handle single SWC case
      if (swcs.length === 1 && interfaces.length > 0) {
        const swcName = swcs[0];
        const interfaceName = interfaces[0];
        const communication = req.communication;

        if (communication?.direction === 'sender' || communication?.direction === 'both') {
          const portName = `${swcName.replace('_swc', '').replace('Controller', '')}_ProvidedPort`;
          if (!artifacts.ports.find(p => p.name === portName && p.swcName === swcName)) {
            artifacts.ports.push({
              name: portName,
              direction: 'provided',
              interfaceRef: interfaceName,
              swcName: swcName
            });
            console.log(`Created Provided Port: ${portName} for SWC: ${swcName}`);
          }
        }

        if (communication?.direction === 'receiver' || communication?.direction === 'both') {
          const portName = `${swcName.replace('_swc', '').replace('Controller', '')}_RequiredPort`;
          if (!artifacts.ports.find(p => p.name === portName && p.swcName === swcName)) {
            artifacts.ports.push({
              name: portName,
              direction: 'required',
              interfaceRef: interfaceName,
              swcName: swcName
            });
            console.log(`Created Required Port: ${portName} for SWC: ${swcName}`);
          }
        }
      }
      return;
    }

    // Handle two SWC communication case
    const senderSwc = swcs[0];
    const receiverSwc = swcs[1];
    const primaryInterface = interfaces[0];

    // Create provided port for sender SWC
    const providedPortName = `${senderSwc.replace('_swc', '').replace('Controller', '')}_ProvidedPort`;
    if (!artifacts.ports.find(p => p.name === providedPortName && p.swcName === senderSwc)) {
      artifacts.ports.push({
        name: providedPortName,
        direction: 'provided',
        interfaceRef: primaryInterface,
        swcName: senderSwc
      });
      console.log(`Created Provided Port: ${providedPortName} for SWC: ${senderSwc}`);
    }

    // Create required port for receiver SWC
    const requiredPortName = `${receiverSwc.replace('_swc', '').replace('Controller', '')}_RequiredPort`;
    if (!artifacts.ports.find(p => p.name === requiredPortName && p.swcName === receiverSwc)) {
      artifacts.ports.push({
        name: requiredPortName,
        direction: 'required',
        interfaceRef: primaryInterface,
        swcName: receiverSwc
      });
      console.log(`Created Required Port: ${requiredPortName} for SWC: ${receiverSwc}`);
    }
  }

  private static createAccessPoints(req: RequirementDocument, artifacts: AutosarArtifacts) {
    const swcs = req.derivedElements.swcs.map(name => 
      name.endsWith('_swc') ? name : name.endsWith('Controller') ? name : name + 'Controller'
    );
    
    // Only create access points for main runnables (not init)
    const mainRunnables = artifacts.runnables.filter(r => r.runnableType !== 'init');
    
    for (const swcName of swcs) {
      const swcPorts = artifacts.ports.filter(p => p.swcName === swcName);
      const swcMainRunnables = mainRunnables.filter(r => r.swcName === swcName);
      
      for (const runnable of swcMainRunnables) {
        for (const port of swcPorts) {
          const interface_ = artifacts.interfaces.find(i => i.name === port.interfaceRef);
          if (!interface_) continue;
          
          const dataElement = interface_.dataElements[0]; // Use first data element
          if (!dataElement) continue;
          
          let accessType: 'iRead' | 'iWrite' | 'iCall';
          let accessName: string;
          
          if (port.direction === 'provided') {
            accessType = 'iWrite';
            accessName = `Rte_IWrite_${runnable.name}_${port.name}_${dataElement.name}`;
          } else {
            accessType = 'iRead';
            accessName = `Rte_IRead_${runnable.name}_${port.name}_${dataElement.name}`;
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
            console.log(`Created Access Point: ${accessName} for ${runnable.name} (${accessType}) in SWC: ${swcName}`);
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

  // New method to integrate artifacts into the store
  static integrateArtifactsIntoStore(artifacts: AutosarArtifacts, store: any) {
    console.log('Integrating artifacts into store...');
    
    // Create SWCs with their runnables and ports properly nested
    for (const swcData of artifacts.swcs) {
      // Get runnables for this SWC
      const swcRunnables = artifacts.runnables.filter(r => r.swcName === swcData.name);
      // Get ports for this SWC
      const swcPorts = artifacts.ports.filter(p => p.swcName === swcData.name);
      
      // Create the SWC
      const swcId = store.createSWC({
        name: swcData.name,
        description: swcData.description,
        category: swcData.category,
        type: swcData.type
      });
      
      console.log(`Created SWC: ${swcData.name} with ID: ${swcId}`);
      
      // Create runnables for this SWC
      for (const runnableData of swcRunnables) {
        const runnableId = store.createRunnable({
          name: runnableData.name,
          swcId: swcId,
          runnableType: runnableData.runnableType,
          period: runnableData.period,
          canBeInvokedConcurrently: runnableData.canBeInvokedConcurrently || false,
          events: []
        });
        
        console.log(`Created Runnable: ${runnableData.name} with ID: ${runnableId} for SWC: ${swcData.name}`);
        
        // Create access points for this runnable
        const runnableAccessPoints = artifacts.accessPoints.filter(ap => 
          ap.runnableName === runnableData.name && ap.swcName === swcData.name
        );
        
        for (const apData of runnableAccessPoints) {
          store.addAccessPoint(runnableId, {
            name: apData.name,
            type: apData.type,
            access: apData.access,
            swcId: swcId,
            runnableId: runnableId,
            portRef: apData.portRef,
            dataElementRef: apData.dataElementRef
          });
          
          console.log(`Created Access Point: ${apData.name} for Runnable: ${runnableData.name}`);
        }
      }
      
      // Create ports for this SWC
      for (const portData of swcPorts) {
        store.createPort({
          name: portData.name,
          direction: portData.direction,
          interfaceRef: portData.interfaceRef,
          swcId: swcId
        });
        
        console.log(`Created Port: ${portData.name} for SWC: ${swcData.name}`);
      }
    }
    
    // Create interfaces
    for (const interfaceData of artifacts.interfaces) {
      store.createInterface({
        name: interfaceData.name,
        type: interfaceData.type,
        dataElements: interfaceData.dataElements
      });
      
      console.log(`Created Interface: ${interfaceData.name}`);
    }
    
    console.log('Artifacts integration completed successfully');
  }
}
