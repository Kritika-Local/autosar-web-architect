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
    
    // Create Ports with proper P-Port/R-Port logic
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
        artifacts.swcs.push({
          name: fullSwcName,
          description: `Software component for ${swcName.replace('Controller', '').replace('_swc', '').toLowerCase()} functionality (Generated from ${req.id})`,
          category: this.inferSwcCategory(req.description),
          type: 'atomic',
          runnables: [], // Will be populated during integration
          ports: [] // Will be populated during integration
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
      // Create Init runnable
      const initRunnableName = `${swcName}_init`;
      if (!artifacts.runnables.find(r => r.name === initRunnableName && r.swcName === swcName)) {
        const initRunnable = {
          name: initRunnableName,
          period: 0,
          runnableType: 'init' as const,
          canBeInvokedConcurrently: false,
          swcName: swcName,
          accessPoints: [], // Will be populated during integration
          events: []
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
          accessPoints: [], // Will be populated during integration
          events: []
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
    
    if (swcs.length >= 1 && interfaces.length > 0) {
      const primaryInterface = interfaces[0];
      
      for (const swcName of swcs) {
        // FIXED: Proper P-Port/R-Port logic based on SWC type
        let shouldCreatePPort = false;
        let shouldCreateRPort = false;
        
        // Sensor SWCs create P-Ports (they provide data)
        if (swcName.toLowerCase().includes('sensor')) {
          shouldCreatePPort = true;
          console.log(`${swcName} is a sensor - creating P-Port (provider)`);
        }
        
        // EMS/Engine/Controller SWCs create R-Ports (they require data)
        if (swcName.toLowerCase().includes('ems') || 
            swcName.toLowerCase().includes('engine') || 
            swcName.toLowerCase().includes('controller')) {
          shouldCreateRPort = true;
          console.log(`${swcName} is an EMS/Controller - creating R-Port (requirer)`);
        }
        
        // Default behavior for other SWCs
        if (!shouldCreatePPort && !shouldCreateRPort) {
          // Create both ports for general SWCs
          shouldCreatePPort = true;
          shouldCreateRPort = true;
        }
        
        // Create P-Port if needed
        if (shouldCreatePPort) {
          const providedPortName = `${swcName.replace('_swc', '').replace('Controller', '')}_PPort`;
          if (!artifacts.ports.find(p => p.name === providedPortName && p.swcName === swcName)) {
            artifacts.ports.push({
              name: providedPortName,
              direction: 'provided',
              interfaceRef: primaryInterface,
              swcName: swcName
            });
            console.log(`Created P-Port: ${providedPortName} for SWC: ${swcName}`);
          }
        }
        
        // Create R-Port if needed
        if (shouldCreateRPort) {
          const requiredPortName = `${swcName.replace('_swc', '').replace('Controller', '')}_RPort`;
          if (!artifacts.ports.find(p => p.name === requiredPortName && p.swcName === swcName)) {
            artifacts.ports.push({
              name: requiredPortName,
              direction: 'required',
              interfaceRef: primaryInterface,
              swcName: swcName
            });
            console.log(`Created R-Port: ${requiredPortName} for SWC: ${swcName}`);
          }
        }
      }
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

  // CRITICAL FIX: Properly integrate artifacts into the store with correct hierarchical structure
  static integrateArtifactsIntoStore(artifacts: AutosarArtifacts, store: any) {
    console.log('Integrating artifacts into store...');
    
    // Step 1: Create interfaces first (needed for port creation)
    const interfaceMap = new Map<string, string>();
    for (const interfaceData of artifacts.interfaces) {
      const interfaceId = store.createInterface({
        name: interfaceData.name,
        type: interfaceData.type,
        dataElements: interfaceData.dataElements
      });
      interfaceMap.set(interfaceData.name, interfaceId);
      console.log(`Created Interface: ${interfaceData.name} with ID: ${interfaceId}`);
    }
    
    // Step 2: Create SWCs and populate them with runnables and ports
    const swcMap = new Map<string, string>();
    const runnableMap = new Map<string, string>();
    
    for (const swcData of artifacts.swcs) {
      // Create the SWC first
      const swcId = store.createSWC({
        name: swcData.name,
        description: swcData.description,
        category: swcData.category,
        type: swcData.type
      });
      swcMap.set(swcData.name, swcId);
      console.log(`Created SWC: ${swcData.name} with ID: ${swcId}`);
      
      // Step 3: Create ports for this SWC
      const swcPorts = artifacts.ports.filter(p => p.swcName === swcData.name);
      for (const portData of swcPorts) {
        const interfaceId = interfaceMap.get(portData.interfaceRef);
        if (interfaceId) {
          const portId = store.createPort({
            name: portData.name,
            direction: portData.direction,
            interfaceRef: interfaceId,
            swcId: swcId
          });
          console.log(`Created Port: ${portData.name} for SWC: ${swcData.name}`);
        }
      }
      
      // Step 4: Create runnables for this SWC
      const swcRunnables = artifacts.runnables.filter(r => r.swcName === swcData.name);
      for (const runnableData of swcRunnables) {
        const runnableId = store.createRunnable({
          name: runnableData.name,
          swcId: swcId,
          runnableType: runnableData.runnableType,
          period: runnableData.period,
          canBeInvokedConcurrently: runnableData.canBeInvokedConcurrently || false,
          events: runnableData.events || []
        });
        
        runnableMap.set(`${swcData.name}::${runnableData.name}`, runnableId);
        console.log(`Created Runnable: ${runnableData.name} with ID: ${runnableId} for SWC: ${swcData.name}`);
      }
    }
    
    // Step 5: Create access points for runnables
    for (const apData of artifacts.accessPoints) {
      const swcId = swcMap.get(apData.swcName);
      const runnableId = runnableMap.get(`${apData.swcName}::${apData.runnableName}`);
      
      if (swcId && runnableId) {
        const accessPointId = store.addAccessPoint(runnableId, {
          name: apData.name,
          type: apData.type,
          access: apData.access,
          swcId: swcId,
          runnableId: runnableId,
          portRef: apData.portRef,
          dataElementRef: apData.dataElementRef
        });
        
        console.log(`Created Access Point: ${apData.name} for Runnable: ${apData.runnableName}`);
      }
    }
    
    // Step 6: Create ECU Composition if available
    if (artifacts.ecuComposition) {
      const compositionId = store.createECUComposition({
        name: artifacts.ecuComposition.name,
        description: `Auto-generated ECU Composition`,
        ecuType: 'ApplicationECU',
        autosarVersion: '4.2.2'
      });
      
      // Add SWC instances to the composition
      for (const instance of artifacts.ecuComposition.swcInstances) {
        const swcId = swcMap.get(instance.swcRef);
        if (swcId) {
          store.addSWCInstance(compositionId, {
            name: instance.name,
            swcRef: swcId,
            instanceName: instance.name,
            ecuCompositionId: compositionId
          });
          console.log(`Added SWC Instance: ${instance.name} to ECU Composition`);
        }
      }
      
      console.log(`Created ECU Composition: ${artifacts.ecuComposition.name} with ID: ${compositionId}`);
    }
    
    console.log('Artifacts integration completed successfully');
  }
}
