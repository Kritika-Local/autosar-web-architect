
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

    for (const req of requirements) {
      this.processRequirement(req, artifacts);
    }

    return artifacts;
  }

  private static processRequirement(req: RequirementDocument, artifacts: AutosarArtifacts) {
    const analysis = this.analyzeRequirement(req);
    
    // Generate SWCs
    for (const swcName of analysis.swcs) {
      if (!artifacts.swcs.find(s => s.name === swcName)) {
        artifacts.swcs.push({
          name: swcName,
          description: `Component generated from ${req.id}`,
          category: this.inferSwcCategory(req.description),
          type: 'atomic'
        });
      }
    }

    // Generate Interfaces
    for (const ifaceName of analysis.interfaces) {
      if (!artifacts.interfaces.find(i => i.name === ifaceName)) {
        const dataElements = this.generateDataElements(req, ifaceName);
        artifacts.interfaces.push({
          name: ifaceName,
          type: 'SenderReceiver',
          dataElements
        });
        artifacts.dataElements.push(...dataElements);
      }
    }

    // Generate Ports
    for (const portDef of analysis.ports) {
      artifacts.ports.push({
        name: portDef.name,
        direction: portDef.direction,
        interfaceRef: portDef.interfaceRef,
        swcName: portDef.swcName
      });
    }

    // Generate Runnables
    for (const runnableDef of analysis.runnables) {
      artifacts.runnables.push({
        name: runnableDef.name,
        period: runnableDef.period,
        runnableType: runnableDef.type,
        canBeInvokedConcurrently: false,
        swcName: runnableDef.swcName
      });

      // Generate Access Points
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

  private static analyzeRequirement(req: RequirementDocument) {
    const desc = req.description.toLowerCase();
    
    return {
      swcs: this.extractSwcNames(desc),
      interfaces: this.extractInterfaceNames(desc),
      ports: this.extractPortDefinitions(desc),
      runnables: this.extractRunnableDefinitions(desc, req.id)
    };
  }

  private static extractSwcNames(description: string): string[] {
    const swcs: string[] = [];
    const patterns = [
      /(\w+)(?:\s+controller|\s+manager|\s+component)/gi,
      /(?:the\s+)?(\w+)(?:\s+shall|\s+must|\s+will)/gi
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(description)) !== null) {
        const name = this.toPascalCase(match[1]);
        if (name.length > 2 && !swcs.includes(name)) {
          swcs.push(name + 'Controller');
        }
      }
    }

    return swcs.length > 0 ? swcs : ['SystemController'];
  }

  private static extractInterfaceNames(description: string): string[] {
    const interfaces: string[] = [];
    const dataPatterns = [
      /(\w+)(?:\s+data|\s+signal|\s+value|\s+status)/gi,
      /(?:transmit|receive|send|get)\s+(\w+)/gi
    ];

    for (const pattern of dataPatterns) {
      let match;
      while ((match = pattern.exec(description)) !== null) {
        const name = this.toPascalCase(match[1]) + 'Interface';
        if (!interfaces.includes(name)) {
          interfaces.push(name);
        }
      }
    }

    return interfaces.length > 0 ? interfaces : ['DataInterface'];
  }

  private static extractPortDefinitions(description: string) {
    const ports: Array<{
      name: string;
      direction: 'required' | 'provided';
      interfaceRef: string;
      swcName: string;
    }> = [];

    const isProvider = /(?:provide|transmit|send|output)/i.test(description);
    const isConsumer = /(?:receive|input|require|consume)/i.test(description);

    if (isProvider) {
      ports.push({
        name: 'ProvidedDataPort',
        direction: 'provided',
        interfaceRef: 'DataInterface',
        swcName: 'SystemController'
      });
    }

    if (isConsumer) {
      ports.push({
        name: 'RequiredDataPort',
        direction: 'required',
        interfaceRef: 'DataInterface',
        swcName: 'SystemController'
      });
    }

    return ports;
  }

  private static extractRunnableDefinitions(description: string, reqId: string) {
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

    const periodicMatch = description.match(/(?:every|each)\s+(\d+)\s*(?:ms|millisecond)/i);
    const period = periodicMatch ? parseInt(periodicMatch[1]) : 100;

    const hasInit = /(?:initialize|startup|begin)/i.test(description);
    const hasEvent = /(?:event|trigger|interrupt)/i.test(description);

    if (hasInit) {
      runnables.push({
        name: 'InitRunnable',
        period: 0,
        type: 'init',
        swcName: 'SystemController',
        accessPoints: []
      });
    }

    const mainRunnable = {
      name: this.toPascalCase(`${reqId.replace(/[^a-zA-Z0-9]/g, '')}_Runnable`),
      period,
      type: (hasEvent ? 'event' : 'periodic') as 'event' | 'periodic',
      swcName: 'SystemController',
      accessPoints: this.generateAccessPoints(description)
    };

    runnables.push(mainRunnable);
    return runnables;
  }

  private static generateAccessPoints(description: string) {
    const accessPoints: Array<{
      name: string;
      type: 'iRead' | 'iWrite' | 'iCall';
      portRef: string;
      dataElementRef: string;
    }> = [];

    if (/(?:read|get|receive|input)/i.test(description)) {
      accessPoints.push({
        name: 'Rte_IRead_RequiredDataPort_DataElement',
        type: 'iRead',
        portRef: 'RequiredDataPort',
        dataElementRef: 'DataElement'
      });
    }

    if (/(?:write|set|send|output|transmit)/i.test(description)) {
      accessPoints.push({
        name: 'Rte_IWrite_ProvidedDataPort_DataElement',
        type: 'iWrite',
        portRef: 'ProvidedDataPort',
        dataElementRef: 'DataElement'
      });
    }

    return accessPoints;
  }

  private static generateDataElements(req: RequirementDocument, interfaceName: string): DataElement[] {
    const dataElements: DataElement[] = [];
    const desc = req.description.toLowerCase();

    // Extract data types from description
    const dataTypes = this.extractDataTypes(desc);
    
    for (const dataType of dataTypes) {
      dataElements.push({
        id: uuidv4(),
        name: dataType.name,
        applicationDataTypeRef: dataType.type,
        category: 'VALUE',
        description: `Data element from ${req.id}`,
        swDataDefProps: {
          baseTypeRef: dataType.baseType,
          implementationDataTypeRef: dataType.type
        }
      });
    }

    // Default data element if none found
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
    
    const patterns = [
      { regex: /(\w+)\s+(?:speed|velocity)/gi, type: 'uint16', name: 'Speed' },
      { regex: /(\w+)\s+(?:temperature|temp)/gi, type: 'sint16', name: 'Temperature' },
      { regex: /(\w+)\s+(?:pressure)/gi, type: 'uint16', name: 'Pressure' },
      { regex: /(\w+)\s+(?:status|state)/gi, type: 'uint8', name: 'Status' },
      { regex: /(\w+)\s+(?:position|angle)/gi, type: 'uint16', name: 'Position' },
      { regex: /(\w+)\s+(?:flag|enable|disable)/gi, type: 'boolean', name: 'Flag' }
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.regex.exec(description)) !== null) {
        const name = this.toPascalCase(match[1]) + pattern.name;
        types.push({
          name,
          type: pattern.type,
          baseType: pattern.type
        });
      }
    }

    return types.length > 0 ? types : [{ name: 'DataElement', type: 'uint32', baseType: 'uint32' }];
  }

  private static inferSwcCategory(description: string): Swc['category'] {
    const desc = description.toLowerCase();
    if (desc.includes('sensor') || desc.includes('actuator')) return 'sensor-actuator';
    if (desc.includes('driver') || desc.includes('hardware')) return 'complex-driver';
    if (desc.includes('service') || desc.includes('diagnostic')) return 'service';
    if (desc.includes('abstraction') || desc.includes('layer')) return 'ecu-abstraction';
    return 'application';
  }

  private static toPascalCase(str: string): string {
    return str.replace(/(?:^|[^a-zA-Z0-9])([a-zA-Z])/g, (_, char) => char.toUpperCase())
              .replace(/[^a-zA-Z0-9]/g, '');
  }
}
