
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
    const artifacts: AutosarArtifacts = {
      swcs: [],
      interfaces: [],
      ports: [],
      runnables: [],
      dataElements: [],
      accessPoints: []
    };

    // Process requirements in order of dependency
    this.processRequirements(requirements, artifacts);
    this.generateEcuComposition(requirements, artifacts);
    this.validateArtifacts(artifacts);

    return artifacts;
  }

  private static processRequirements(requirements: RequirementDocument[], artifacts: AutosarArtifacts) {
    for (const req of requirements) {
      console.log(`Processing requirement: ${req.id}`);
      this.processRequirement(req, artifacts);
    }
  }

  private static processRequirement(req: RequirementDocument, artifacts: AutosarArtifacts) {
    const analysis = this.analyzeRequirement(req);
    
    // Generate SWCs with proper naming and categorization
    for (const swcData of analysis.swcs) {
      if (!artifacts.swcs.find(s => s.name === swcData.name)) {
        artifacts.swcs.push({
          name: swcData.name,
          description: `${swcData.description} (Generated from ${req.id})`,
          category: swcData.category,
          type: 'atomic'
        });
        console.log(`Created SWC: ${swcData.name}`);
      }
    }

    // Generate Interfaces with proper data elements
    for (const ifaceData of analysis.interfaces) {
      if (!artifacts.interfaces.find(i => i.name === ifaceData.name)) {
        const dataElements = this.generateDataElements(req, ifaceData);
        artifacts.interfaces.push({
          name: ifaceData.name,
          type: ifaceData.type,
          dataElements
        });
        artifacts.dataElements.push(...dataElements);
        console.log(`Created Interface: ${ifaceData.name} with ${dataElements.length} data elements`);
      }
    }

    // Generate Ports with proper interface references
    for (const portDef of analysis.ports) {
      const existingPort = artifacts.ports.find(p => 
        p.name === portDef.name && p.swcName === portDef.swcName
      );
      if (!existingPort) {
        artifacts.ports.push({
          name: portDef.name,
          direction: portDef.direction,
          interfaceRef: portDef.interfaceRef,
          swcName: portDef.swcName
        });
        console.log(`Created Port: ${portDef.name} (${portDef.direction}) for SWC: ${portDef.swcName}`);
      }
    }

    // Generate Runnables with proper timing and access points
    for (const runnableDef of analysis.runnables) {
      const existingRunnable = artifacts.runnables.find(r => 
        r.name === runnableDef.name && r.swcName === runnableDef.swcName
      );
      if (!existingRunnable) {
        artifacts.runnables.push({
          name: runnableDef.name,
          period: runnableDef.period,
          runnableType: runnableDef.type,
          canBeInvokedConcurrently: false,
          swcName: runnableDef.swcName
        });
        console.log(`Created Runnable: ${runnableDef.name} (${runnableDef.type}, ${runnableDef.period}ms)`);

        // Generate Access Points for this runnable
        for (const ap of runnableDef.accessPoints) {
          artifacts.accessPoints.push({
            name: ap.name,
            type: ap.type,
            access: 'implicit',
            swcId: '', // Will be set when creating
            runnableId: '', // Will be set when creating
            portRef: ap.portRef,
            dataElementRef: ap.dataElementRef,
            runnableName: runnableDef.name,
            swcName: runnableDef.swcName
          });
        }
      }
    }
  }

  private static analyzeRequirement(req: RequirementDocument) {
    const desc = req.description.toLowerCase();
    
    return {
      swcs: this.extractSwcDefinitions(req),
      interfaces: this.extractInterfaceDefinitions(req),
      ports: this.extractPortDefinitions(req),
      runnables: this.extractRunnableDefinitions(req)
    };
  }

  private static extractSwcDefinitions(req: RequirementDocument) {
    const swcs: Array<{
      name: string;
      description: string;
      category: Swc['category'];
    }> = [];

    // Use derived elements from requirement parsing
    if (req.derivedElements?.swcs?.length > 0) {
      for (const swcName of req.derivedElements.swcs) {
        swcs.push({
          name: swcName.endsWith('Controller') ? swcName : swcName + 'Controller',
          description: `Software component for ${swcName.toLowerCase()} functionality`,
          category: this.inferSwcCategory(req.description)
        });
      }
    } else {
      // Fallback: extract from description
      const desc = req.description.toLowerCase();
      const patterns = [
        /(\w+)(?:\s+controller|\s+manager|\s+component)/gi,
        /(?:the\s+)?(\w+)(?:\s+shall|\s+must|\s+will)/gi
      ];

      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(desc)) !== null) {
          const name = this.toPascalCase(match[1]);
          if (name.length > 2 && !swcs.find(s => s.name.includes(name))) {
            swcs.push({
              name: name + 'Controller',
              description: `Software component for ${name.toLowerCase()} functionality`,
              category: this.inferSwcCategory(req.description)
            });
          }
        }
      }
    }

    // Ensure at least one SWC
    if (swcs.length === 0) {
      const baseName = req.shortName.replace(/[^a-zA-Z0-9]/g, '') || 'System';
      swcs.push({
        name: baseName + 'Controller',
        description: `Software component generated from requirement ${req.id}`,
        category: 'application'
      });
    }

    return swcs;
  }

  private static extractInterfaceDefinitions(req: RequirementDocument) {
    const interfaces: Array<{
      name: string;
      type: Interface['type'];
    }> = [];

    // Use communication data from requirement parsing
    if (req.communication?.dataElements?.length > 0) {
      const baseName = req.shortName.replace(/[^a-zA-Z0-9]/g, '') || 'Data';
      interfaces.push({
        name: baseName + 'Interface',
        type: 'SenderReceiver'
      });
    }

    // Use derived elements
    if (req.derivedElements?.interfaces?.length > 0) {
      for (const ifaceName of req.derivedElements.interfaces) {
        if (!interfaces.find(i => i.name === ifaceName)) {
          interfaces.push({
            name: ifaceName,
            type: 'SenderReceiver'
          });
        }
      }
    }

    // Fallback: create default interface
    if (interfaces.length === 0) {
      const baseName = req.shortName.replace(/[^a-zA-Z0-9]/g, '') || 'Data';
      interfaces.push({
        name: baseName + 'Interface',
        type: 'SenderReceiver'
      });
    }

    return interfaces;
  }

  private static extractPortDefinitions(req: RequirementDocument) {
    const ports: Array<{
      name: string;
      direction: 'required' | 'provided';
      interfaceRef: string;
      swcName: string;
    }> = [];

    const swcs = this.extractSwcDefinitions(req);
    const interfaces = this.extractInterfaceDefinitions(req);
    const primarySwc = swcs[0]?.name || 'SystemController';
    const primaryInterface = interfaces[0]?.name || 'DataInterface';

    // Determine communication pattern from requirement
    const communication = req.communication;
    const isProvider = communication?.direction === 'sender' || communication?.direction === 'both';
    const isConsumer = communication?.direction === 'receiver' || communication?.direction === 'both';

    // Fallback: analyze description
    if (!communication) {
      const desc = req.description.toLowerCase();
      const hasProvide = /(?:provide|transmit|send|output|write)/i.test(desc);
      const hasConsume = /(?:receive|input|require|consume|read)/i.test(desc);
      
      if (hasProvide || hasConsume) {
        if (hasProvide) {
          ports.push({
            name: 'ProvidedDataPort',
            direction: 'provided',
            interfaceRef: primaryInterface,
            swcName: primarySwc
          });
        }
        if (hasConsume) {
          ports.push({
            name: 'RequiredDataPort',
            direction: 'required',
            interfaceRef: primaryInterface,
            swcName: primarySwc
          });
        }
      }
    } else {
      if (isProvider) {
        ports.push({
          name: 'ProvidedDataPort',
          direction: 'provided',
          interfaceRef: primaryInterface,
          swcName: primarySwc
        });
      }
      if (isConsumer) {
        ports.push({
          name: 'RequiredDataPort',
          direction: 'required',
          interfaceRef: primaryInterface,
          swcName: primarySwc
        });
      }
    }

    // Ensure at least one port
    if (ports.length === 0) {
      ports.push({
        name: 'DataPort',
        direction: 'provided',
        interfaceRef: primaryInterface,
        swcName: primarySwc
      });
    }

    return ports;
  }

  private static extractRunnableDefinitions(req: RequirementDocument) {
    const runnables: Array<{
      name: string;
      period: number;
      type: 'init' | 'periodic' | 'event';
      swcName: string;
      accessPoints: Array<{
        name: string;
        type: 'iRead' | 'iWrite' | 'iCall';
        portRef: string;
        dataElementRef: string;
      }>;
    }> = [];

    const swcs = this.extractSwcDefinitions(req);
    const ports = this.extractPortDefinitions(req);
    const primarySwc = swcs[0]?.name || 'SystemController';

    // Extract timing information
    const timing = req.timing;
    let period = timing?.period || 100;
    let type: 'init' | 'periodic' | 'event' = timing?.type || 'periodic';

    // Convert seconds to milliseconds
    if (timing?.unit === 's') {
      period *= 1000;
    }

    // Generate init runnable if needed
    if (type === 'init' || /(?:initialize|startup|begin)/i.test(req.description)) {
      runnables.push({
        name: primarySwc.replace('Controller', '') + '_Init',
        period: 0,
        type: 'init',
        swcName: primarySwc,
        accessPoints: []
      });
    }

    // Generate main runnable
    const baseName = primarySwc.replace('Controller', '');
    const runnableName = type === 'periodic' 
      ? `${baseName}_${period}ms`
      : type === 'event' 
        ? `${baseName}_Event`
        : `${baseName}_${req.id.replace(/[^a-zA-Z0-9]/g, '')}`;

    runnables.push({
      name: runnableName,
      period: type === 'periodic' ? period : 0,
      type,
      swcName: primarySwc,
      accessPoints: this.generateAccessPoints(req, ports)
    });

    return runnables;
  }

  private static generateAccessPoints(req: RequirementDocument, ports: Array<{ name: string; direction: string; swcName: string }>) {
    const accessPoints: Array<{
      name: string;
      type: 'iRead' | 'iWrite' | 'iCall';
      portRef: string;
      dataElementRef: string;
    }> = [];

    const desc = req.description.toLowerCase();
    const hasRead = /(?:read|get|receive|input)/i.test(desc);
    const hasWrite = /(?:write|set|send|output|transmit)/i.test(desc);

    for (const port of ports) {
      const dataElementName = 'DataElement'; // Default data element name
      
      if (port.direction === 'required' && hasRead) {
        accessPoints.push({
          name: `Rte_IRead_${port.name}_${dataElementName}`,
          type: 'iRead',
          portRef: port.name,
          dataElementRef: dataElementName
        });
      }
      
      if (port.direction === 'provided' && hasWrite) {
        accessPoints.push({
          name: `Rte_IWrite_${port.name}_${dataElementName}`,
          type: 'iWrite',
          portRef: port.name,
          dataElementRef: dataElementName
        });
      }
    }

    // Ensure at least one access point
    if (accessPoints.length === 0 && ports.length > 0) {
      const firstPort = ports[0];
      const dataElementName = 'DataElement';
      accessPoints.push({
        name: `Rte_IWrite_${firstPort.name}_${dataElementName}`,
        type: 'iWrite',
        portRef: firstPort.name,
        dataElementRef: dataElementName
      });
    }

    return accessPoints;
  }

  private static generateDataElements(req: RequirementDocument, interfaceData: { name: string }): DataElement[] {
    const dataElements: DataElement[] = [];

    // Use communication data elements from requirement parsing
    if (req.communication?.dataElements?.length > 0) {
      for (const commDataElement of req.communication.dataElements) {
        dataElements.push({
          id: uuidv4(),
          name: commDataElement.name,
          applicationDataTypeRef: commDataElement.type,
          category: 'VALUE',
          description: `Data element for ${commDataElement.name} (from ${req.id})`,
          swDataDefProps: {
            baseTypeRef: commDataElement.type,
            implementationDataTypeRef: commDataElement.type
          }
        });
      }
    } else {
      // Generate default data elements based on description analysis
      const dataTypes = this.extractDataTypes(req.description);
      
      for (const dataType of dataTypes) {
        dataElements.push({
          id: uuidv4(),
          name: dataType.name,
          applicationDataTypeRef: dataType.type,
          category: 'VALUE',
          description: `Data element ${dataType.name} from ${req.id}`,
          swDataDefProps: {
            baseTypeRef: dataType.baseType,
            implementationDataTypeRef: dataType.type
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
        description: `Default data element from ${req.id}`,
        swDataDefProps: {
          baseTypeRef: 'uint32',
          implementationDataTypeRef: 'uint32'
        }
      });
    }

    return dataElements;
  }

  private static extractDataTypes(description: string) {
    const types: Array<{ name: string; type: string; baseType: string }> = [];
    
    // Enhanced pattern matching for data types
    const patterns = [
      { regex: /(\w+)?\s*(?:speed|velocity)(?:\s+(\w+))?/gi, defaultType: 'uint16', name: 'Speed' },
      { regex: /(\w+)?\s*(?:temperature|temp)(?:\s+(\w+))?/gi, defaultType: 'sint16', name: 'Temperature' },
      { regex: /(\w+)?\s*(?:pressure)(?:\s+(\w+))?/gi, defaultType: 'uint16', name: 'Pressure' },
      { regex: /(\w+)?\s*(?:status|state)(?:\s+(\w+))?/gi, defaultType: 'uint8', name: 'Status' },
      { regex: /(\w+)?\s*(?:position|angle)(?:\s+(\w+))?/gi, defaultType: 'uint16', name: 'Position' },
      { regex: /(\w+)?\s*(?:flag|enable|disable)(?:\s+(\w+))?/gi, defaultType: 'boolean', name: 'Flag' },
      { regex: /(\w+)?\s*(?:voltage|volt)(?:\s+(\w+))?/gi, defaultType: 'float32', name: 'Voltage' },
      { regex: /(\w+)?\s*(?:current|amp)(?:\s+(\w+))?/gi, defaultType: 'float32', name: 'Current' }
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.regex.exec(description)) !== null) {
        const prefix = match[1] ? this.toPascalCase(match[1]) : '';
        const suffix = match[2] ? this.toPascalCase(match[2]) : '';
        const name = prefix + pattern.name + suffix || pattern.name;
        
        // Determine type from suffix or use default
        let type = pattern.defaultType;
        if (suffix) {
          const suffixLower = suffix.toLowerCase();
          if (suffixLower.includes('uint8') || suffixLower.includes('byte')) type = 'uint8';
          else if (suffixLower.includes('uint16') || suffixLower.includes('word')) type = 'uint16';
          else if (suffixLower.includes('uint32') || suffixLower.includes('dword')) type = 'uint32';
          else if (suffixLower.includes('sint8')) type = 'sint8';
          else if (suffixLower.includes('sint16')) type = 'sint16';
          else if (suffixLower.includes('sint32')) type = 'sint32';
          else if (suffixLower.includes('float') || suffixLower.includes('real')) type = 'float32';
          else if (suffixLower.includes('bool')) type = 'boolean';
        }
        
        if (!types.find(t => t.name === name)) {
          types.push({
            name,
            type,
            baseType: type
          });
        }
      }
    }

    return types.length > 0 ? types : [{ name: 'DataElement', type: 'uint32', baseType: 'uint32' }];
  }

  private static generateEcuComposition(requirements: RequirementDocument[], artifacts: AutosarArtifacts) {
    // Collect ECU names from requirements
    const ecuNames = new Set<string>();
    const swcInstances: Array<{ name: string; swcRef: string }> = [];

    for (const req of requirements) {
      if (req.ecuBehavior?.ecuName) {
        ecuNames.add(req.ecuBehavior.ecuName);
      }
      if (req.ecuBehavior?.swcInstances) {
        for (const swcInstance of req.ecuBehavior.swcInstances) {
          const swc = artifacts.swcs.find(s => s.name.includes(swcInstance));
          if (swc && !swcInstances.find(si => si.swcRef === swc.name)) {
            swcInstances.push({
              name: swc.name + 'Instance',
              swcRef: swc.name
            });
          }
        }
      }
    }

    // Add all created SWCs as instances if no specific instances were defined
    if (swcInstances.length === 0) {
      for (const swc of artifacts.swcs) {
        swcInstances.push({
          name: swc.name + 'Instance',
          swcRef: swc.name
        });
      }
    }

    const ecuName = ecuNames.size > 0 ? Array.from(ecuNames)[0] : 'SystemECU';
    
    artifacts.ecuComposition = {
      name: ecuName + 'Composition',
      swcInstances
    };
  }

  private static validateArtifacts(artifacts: AutosarArtifacts) {
    // Validate that all interface references exist
    for (const port of artifacts.ports) {
      if (!artifacts.interfaces.find(i => i.name === port.interfaceRef)) {
        console.warn(`Port ${port.name} references non-existent interface: ${port.interfaceRef}`);
      }
    }

    // Validate that all access points reference existing ports
    for (const ap of artifacts.accessPoints) {
      const swc = artifacts.swcs.find(s => s.name === ap.swcName);
      if (swc) {
        const port = artifacts.ports.find(p => p.name === ap.portRef && p.swcName === ap.swcName);
        if (!port) {
          console.warn(`Access point ${ap.name} references non-existent port: ${ap.portRef}`);
        }
      }
    }

    console.log('Artifact validation completed');
  }

  private static inferSwcCategory(description: string): Swc['category'] {
    const desc = description.toLowerCase();
    if (desc.includes('sensor') || desc.includes('actuator') || desc.includes('io')) return 'sensor-actuator';
    if (desc.includes('driver') || desc.includes('hardware') || desc.includes('hal')) return 'complex-driver';
    if (desc.includes('service') || desc.includes('diagnostic') || desc.includes('manager')) return 'service';
    if (desc.includes('abstraction') || desc.includes('layer') || desc.includes('bsw')) return 'ecu-abstraction';
    return 'application';
  }

  private static toPascalCase(str: string): string {
    return str.replace(/(?:^|[^a-zA-Z0-9])([a-zA-Z])/g, (_, char) => char.toUpperCase())
              .replace(/[^a-zA-Z0-9]/g, '');
  }
}
