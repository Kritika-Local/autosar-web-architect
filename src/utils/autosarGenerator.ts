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
    
    // Create Interfaces with <Signal>_IF naming
    this.createInterfacesWithSignalNaming(req, artifacts);
    
    // Create Runnables with proper timing
    this.createRunnablesWithTiming(req, artifacts);
    
    // Create Ports with P_<Signal> and R_<Signal> naming
    this.createPortsWithSignalNaming(req, artifacts);
    
    // Create Access Points with Rte_ naming convention
    this.createAccessPointsWithRteNaming(req, artifacts);
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

  private static createInterfacesWithSignalNaming(req: RequirementDocument, artifacts: AutosarArtifacts) {
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

  private static createRunnablesWithTiming(req: RequirementDocument, artifacts: AutosarArtifacts) {
    const swcs = req.derivedElements.swcs.map(name => 
      name.endsWith('_swc') ? name : name.endsWith('Controller') ? name : name + 'Controller'
    );
    
    for (const swcName of swcs) {
      // Create Init runnable: <swc>_init
      const initRunnableName = `${swcName}_init`;
      if (!artifacts.runnables.find(r => r.name === initRunnableName && r.swcName === swcName)) {
        artifacts.runnables.push({
          name: initRunnableName,
          period: 0,
          runnableType: 'init',
          canBeInvokedConcurrently: false,
          swcName: swcName,
          accessPoints: [],
          events: []
        });
        console.log(`Created Init Runnable: ${initRunnableName} for SWC: ${swcName}`);
      }

      // Create timing-specific runnable
      let timingRunnableName: string;
      let period = 10; // default 10ms as per specification
      let runnableType: 'periodic' | 'event' | 'init' = 'periodic';

      if (req.timing?.type === 'periodic' && req.timing.period) {
        period = req.timing.unit === 's' ? req.timing.period * 1000 : req.timing.period;
        timingRunnableName = `${swcName}_${req.timing.period}${req.timing.unit || 'ms'}`;
        runnableType = 'periodic';
      } else if (req.timing?.type === 'event') {
        timingRunnableName = `${swcName}_Event`;
        runnableType = 'event';
        period = 0;
      } else {
        // Default to 10ms as specified
        timingRunnableName = `${swcName}_10ms`;
        runnableType = 'periodic';
        period = 10;
      }

      if (!artifacts.runnables.find(r => r.name === timingRunnableName && r.swcName === swcName)) {
        artifacts.runnables.push({
          name: timingRunnableName,
          period: period,
          runnableType: runnableType,
          canBeInvokedConcurrently: false,
          swcName: swcName,
          accessPoints: [],
          events: []
        });
        console.log(`Created Timing Runnable: ${timingRunnableName} (${runnableType}, ${period}ms) for SWC: ${swcName}`);
      }
    }
  }

  private static createPortsWithSignalNaming(req: RequirementDocument, artifacts: AutosarArtifacts) {
    const swcs = req.derivedElements.swcs.map(name => 
      name.endsWith('_swc') ? name : name.endsWith('Controller') ? name : name + 'Controller'
    );
    const interfaces = req.derivedElements.interfaces;
    const signals = req.derivedElements.signals;
    
    if (swcs.length >= 2 && interfaces.length > 0 && signals.length > 0) {
      const primaryInterface = interfaces[0];
      const primarySignal = signals[0];
      
      // Create P_<Signal> for sender SWC (first SWC)
      const senderSwc = swcs[0];
      const pPortName = `P_${primarySignal}`;
      if (!artifacts.ports.find(p => p.name === pPortName && p.swcName === senderSwc)) {
        artifacts.ports.push({
          name: pPortName,
          direction: 'provided',
          interfaceRef: primaryInterface,
          swcName: senderSwc
        });
        console.log(`Created P-Port: ${pPortName} for Sender SWC: ${senderSwc}`);
      }
      
      // Create R_<Signal> for receiver SWC (second SWC)
      const receiverSwc = swcs[1];
      const rPortName = `R_${primarySignal}`;
      if (!artifacts.ports.find(p => p.name === rPortName && p.swcName === receiverSwc)) {
        artifacts.ports.push({
          name: rPortName,
          direction: 'required',
          interfaceRef: primaryInterface,
          swcName: receiverSwc
        });
        console.log(`Created R-Port: ${rPortName} for Receiver SWC: ${receiverSwc}`);
      }
    }
  }

  private static createAccessPointsWithRteNaming(req: RequirementDocument, artifacts: AutosarArtifacts) {
    const swcs = req.derivedElements.swcs.map(name => 
      name.endsWith('_swc') ? name : name.endsWith('Controller') ? name : name + 'Controller'
    );
    const signals = req.derivedElements.signals;
    
    if (swcs.length >= 2 && signals.length > 0) {
      const primarySignal = signals[0];
      const senderSwc = swcs[0];
      const receiverSwc = swcs[1];
      
      // Find timing runnables (not init runnables)
      const senderTimingRunnable = artifacts.runnables.find(r => 
        r.swcName === senderSwc && r.runnableType !== 'init'
      );
      const receiverTimingRunnable = artifacts.runnables.find(r => 
        r.swcName === receiverSwc && r.runnableType !== 'init'
      );
      
      if (senderTimingRunnable && receiverTimingRunnable) {
        // Create DATA-WRITE-ACCESS for sender: Rte_Write_P_<Signal>_<DataElement>
        const writeAccessName = `Rte_Write_P_${primarySignal}_${primarySignal.toLowerCase()}`;
        artifacts.accessPoints.push({
          name: writeAccessName,
          type: 'iWrite',
          access: 'implicit',
          swcId: '',
          runnableId: '',
          portRef: `P_${primarySignal}`,
          dataElementRef: primarySignal.toLowerCase(),
          runnableName: senderTimingRunnable.name,
          swcName: senderSwc
        });
        console.log(`Created Write Access Point: ${writeAccessName} for ${senderTimingRunnable.name} in SWC: ${senderSwc}`);
        
        // Create DATA-READ-ACCESS for receiver: Rte_Read_R_<Signal>_<DataElement>
        const readAccessName = `Rte_Read_R_${primarySignal}_${primarySignal.toLowerCase()}`;
        artifacts.accessPoints.push({
          name: readAccessName,
          type: 'iRead',
          access: 'implicit',
          swcId: '',
          runnableId: '',
          portRef: `R_${primarySignal}`,
          dataElementRef: primarySignal.toLowerCase(),
          runnableName: receiverTimingRunnable.name,
          swcName: receiverSwc
        });
        console.log(`Created Read Access Point: ${readAccessName} for ${receiverTimingRunnable.name} in SWC: ${receiverSwc}`);
      }
    }
  }

  private static createDataElementsForInterface(req: RequirementDocument, interfaceName: string): DataElement[] {
    const dataElements: DataElement[] = [];
    const signals = req.derivedElements.signals;
    
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

    // Create data elements based on signals
    if (dataElements.length === 0 && signals.length > 0) {
      for (const signal of signals) {
        // Use signal name in lowercase for data element
        const dataElementName = signal.toLowerCase();
        dataElements.push({
          id: uuidv4(),
          name: dataElementName,
          applicationDataTypeRef: this.inferDataType(signal),
          category: 'VALUE',
          description: `Data element for ${signal} signal from ${req.id}`,
          swDataDefProps: {
            baseTypeRef: this.inferDataType(signal),
            implementationDataTypeRef: this.inferDataType(signal)
          }
        });
      }
    }

    // Fallback data element
    if (dataElements.length === 0) {
      dataElements.push({
        id: uuidv4(),
        name: 'dataElement',
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

  private static inferDataType(signal: string): string {
    const signalLower = signal.toLowerCase();
    if (signalLower.includes('temperature') || signalLower.includes('pressure')) {
      return 'float32';
    } else if (signalLower.includes('speed') || signalLower.includes('rpm')) {
      return 'uint16';
    } else if (signalLower.includes('status') || signalLower.includes('flag')) {
      return 'boolean';
    }
    return 'uint16'; // Default automotive type
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

  // CRITICAL ENHANCEMENT: Properly integrate artifacts into the store with correct hierarchical linking
  static integrateArtifactsIntoStore(artifacts: AutosarArtifacts, store: any) {
    console.log('Starting enhanced artifacts integration with proper linking...');
    
    // Step 1: Create interfaces first with their data elements
    const interfaceMap = new Map<string, string>();
    for (const interfaceData of artifacts.interfaces) {
      const interfaceId = store.createInterface({
        name: interfaceData.name,
        type: interfaceData.type,
        dataElements: interfaceData.dataElements
      });
      interfaceMap.set(interfaceData.name, interfaceId);
      console.log(`✅ Created and linked Interface: ${interfaceData.name} with ${interfaceData.dataElements.length} data elements`);
    }
    
    // Step 2: Create SWCs (empty containers)
    const swcMap = new Map<string, string>();
    for (const swcData of artifacts.swcs) {
      const swcId = store.createSWC({
        name: swcData.name,
        description: swcData.description,
        category: swcData.category,
        type: swcData.type
      });
      swcMap.set(swcData.name, swcId);
      console.log(`✅ Created SWC container: ${swcData.name}`);
    }
    
    // Step 3: Create runnables and properly link them to SWCs
    const runnableMap = new Map<string, string>();
    for (const runnableData of artifacts.runnables) {
      const swcId = swcMap.get(runnableData.swcName);
      if (swcId) {
        const runnableId = store.createRunnable({
          name: runnableData.name,
          swcId: swcId,
          runnableType: runnableData.runnableType,
          period: runnableData.period,
          canBeInvokedConcurrently: runnableData.canBeInvokedConcurrently || false,
          events: runnableData.events || []
        });
        
        // Create unique key for runnable mapping
        const runnableKey = `${runnableData.swcName}::${runnableData.name}`;
        runnableMap.set(runnableKey, runnableId);
        
        console.log(`✅ Created and linked Runnable: ${runnableData.name} to SWC: ${runnableData.swcName} with ${runnableData.runnableType} timing${runnableData.period > 0 ? ` (${runnableData.period}ms)` : ''}`);
      }
    }
    
    // Step 4: Create ports and properly link them to SWCs and interfaces
    const portMap = new Map<string, string>();
    for (const portData of artifacts.ports) {
      const swcId = swcMap.get(portData.swcName);
      const interfaceId = interfaceMap.get(portData.interfaceRef);
      
      if (swcId && interfaceId) {
        const portId = store.createPort({
          name: portData.name,
          direction: portData.direction,
          interfaceRef: interfaceId,
          swcId: swcId
        });
        
        // Create unique key for port mapping
        const portKey = `${portData.swcName}::${portData.name}`;
        portMap.set(portKey, portId);
        
        console.log(`✅ Created and linked Port: ${portData.name} (${portData.direction}) to SWC: ${portData.swcName} via Interface: ${portData.interfaceRef}`);
      }
    }
    
    // Step 5: Create access points and link them to runnables, ports, and data elements
    for (const apData of artifacts.accessPoints) {
      const swcId = swcMap.get(apData.swcName);
      const runnableKey = `${apData.swcName}::${apData.runnableName}`;
      const runnableId = runnableMap.get(runnableKey);
      const portKey = `${apData.swcName}::${apData.portRef}`;
      const portId = portMap.get(portKey);
      
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
        
        console.log(`✅ Created and linked Access Point: ${apData.name} to Runnable: ${apData.runnableName} in SWC: ${apData.swcName}`);
        console.log(`   └─ Port: ${apData.portRef}, Data Element: ${apData.dataElementRef}`);
      }
    }
    
    // Step 6: Create ECU Composition and add SWC instances with proper linking
    if (artifacts.ecuComposition) {
      const compositionId = store.createECUComposition({
        name: artifacts.ecuComposition.name,
        description: `Auto-generated ECU Composition with ${artifacts.swcs.length} linked SWCs`,
        ecuType: 'ApplicationECU',
        autosarVersion: '4.2.2'
      });
      
      // Add SWC instances to the composition with proper references
      for (const instance of artifacts.ecuComposition.swcInstances) {
        const swcId = swcMap.get(instance.swcRef);
        if (swcId) {
          store.addSWCInstance(compositionId, {
            name: instance.name,
            swcRef: swcId,
            instanceName: instance.name,
            ecuCompositionId: compositionId
          });
          console.log(`✅ Added SWC Instance: ${instance.name} to ECU Composition with proper linking`);
        }
      }
      
      console.log(`✅ Created ECU Composition: ${artifacts.ecuComposition.name} with ${artifacts.ecuComposition.swcInstances.length} linked instances`);
    }
    
    // Step 7: Final verification and linking summary
    console.log('\n🔗 LINKING VERIFICATION SUMMARY:');
    console.log('=====================================');
    
    artifacts.swcs.forEach(swc => {
      const swcPorts = artifacts.ports.filter(p => p.swcName === swc.name);
      const swcRunnables = artifacts.runnables.filter(r => r.swcName === swc.name);
      const swcAccessPoints = artifacts.accessPoints.filter(ap => ap.swcName === swc.name);
      
      console.log(`📦 SWC: ${swc.name}`);
      console.log(`   ├─ Ports: ${swcPorts.length} (${swcPorts.map(p => `${p.name}[${p.direction}]`).join(', ')})`);
      console.log(`   ├─ Runnables: ${swcRunnables.length} (${swcRunnables.map(r => `${r.name}[${r.runnableType}${r.period > 0 ? `:${r.period}ms` : ''}]`).join(', ')})`);
      console.log(`   └─ Access Points: ${swcAccessPoints.length} (${swcAccessPoints.map(ap => `${ap.name}[${ap.type}]`).join(', ')})`);
    });
    
    artifacts.interfaces.forEach(iface => {
      const linkedPorts = artifacts.ports.filter(p => p.interfaceRef === iface.name);
      console.log(`🔌 Interface: ${iface.name} → Linked to ${linkedPorts.length} ports (${linkedPorts.map(p => p.name).join(', ')})`);
    });
    
    console.log('\n✅ Enhanced artifacts integration completed with full hierarchical linking!');
    console.log(`📊 Final counts: ${artifacts.swcs.length} SWCs, ${artifacts.interfaces.length} Interfaces, ${artifacts.ports.length} Ports, ${artifacts.runnables.length} Runnables, ${artifacts.accessPoints.length} Access Points`);
  }
}
