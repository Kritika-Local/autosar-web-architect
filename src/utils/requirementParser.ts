
import * as XLSX from 'xlsx';

export interface RequirementDocument {
  id: string;
  shortName: string;
  description: string;
  source: string;
  category: 'FUNCTIONAL' | 'NON_FUNCTIONAL' | 'INTERFACE' | 'CONSTRAINT';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  derivedElements: {
    swcs: string[];
    interfaces: string[];
    signals: string[];
    ports?: string[];
    runnables?: string[];
  };
  communication?: {
    interfaceType: 'SenderReceiver' | 'ClientServer' | 'ModeSwitch' | 'Parameter' | 'Trigger';
    direction?: 'sender' | 'receiver' | 'both';
    dataElements: Array<{
      name: string;
      type: string;
      category?: string;
    }>;
  };
  timing?: {
    type: 'periodic' | 'event' | 'init';
    period?: number;
    unit?: 'ms' | 's';
  };
  ecuBehavior?: {
    ecuName: string;
    swcInstances: string[];
  };
}

export class RequirementParser {
  static async parseFile(file: File): Promise<RequirementDocument[]> {
    const extension = file.name.toLowerCase().split('.').pop();
    
    try {
      switch (extension) {
        case 'txt':
          return this.parseTextFile(file);
        case 'doc':
        case 'docx':
          return this.parseWordFile(file);
        case 'xls':
        case 'xlsx':
          return this.parseExcelFile(file);
        default:
          throw new Error(`Unsupported file type: ${extension}`);
      }
    } catch (error) {
      console.error(`Error parsing file ${file.name}:`, error);
      throw new Error(`Failed to parse ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async parseTextFile(file: File): Promise<RequirementDocument[]> {
    const text = await file.text();
    return this.parseText(text);
  }

  private static async parseWordFile(file: File): Promise<RequirementDocument[]> {
    // For now, we'll treat it as text. In a real implementation, you'd use a library like mammoth
    try {
      const text = await file.text();
      return this.parseText(text);
    } catch (error) {
      console.warn('Word file parsing not fully implemented, treating as plain text');
      const text = await file.text();
      return this.parseText(text);
    }
  }

  private static async parseExcelFile(file: File): Promise<RequirementDocument[]> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Convert Excel data to text format
    const textLines = jsonData
      .map((row: any) => Array.isArray(row) ? row.join(' ') : String(row))
      .filter((line: string) => line.trim().length > 0);
    
    const text = textLines.join('\n');
    return this.parseText(text);
  }

  static parseText(text: string): RequirementDocument[] {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const requirements: RequirementDocument[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.length < 10) return; // Skip very short lines
      
      const requirement = this.parseLine(trimmedLine, `REQ_${index + 1}`);
      if (requirement) {
        requirements.push(requirement);
      }
    });
    
    return requirements;
  }

  private static parseLine(line: string, id: string): RequirementDocument | null {
    const lowercaseLine = line.toLowerCase();
    
    // Extract SWC names with enhanced patterns
    const swcs = this.extractSwcs(line);
    
    // Extract interfaces with enhanced naming
    const interfaces = this.extractInterfaces(line, swcs);
    
    // Extract signals/data elements
    const signals = this.extractSignals(line);
    
    // Extract communication info
    const communication = this.extractCommunication(line);
    
    // Extract timing info
    const timing = this.extractTiming(line);
    
    // Extract ECU behavior
    const ecuBehavior = this.extractEcuBehavior(line);
    
    // Generate ports and runnables based on extracted data
    const ports = this.generatePorts(swcs, interfaces);
    const runnables = this.generateRunnables(swcs, timing);
    
    // Only create requirement if we found meaningful data
    if (swcs.length === 0 && interfaces.length === 0 && signals.length === 0) {
      return null;
    }

    // Determine category based on content
    let category: 'FUNCTIONAL' | 'NON_FUNCTIONAL' | 'INTERFACE' | 'CONSTRAINT' = 'FUNCTIONAL';
    if (lowercaseLine.includes('interface') || lowercaseLine.includes('communication')) {
      category = 'INTERFACE';
    } else if (lowercaseLine.includes('timing') || lowercaseLine.includes('performance')) {
      category = 'NON_FUNCTIONAL';
    } else if (lowercaseLine.includes('shall not') || lowercaseLine.includes('must not')) {
      category = 'CONSTRAINT';
    }

    // Determine priority based on content
    let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    if (lowercaseLine.includes('critical') || lowercaseLine.includes('safety') || lowercaseLine.includes('emergency')) {
      priority = 'HIGH';
    } else if (lowercaseLine.includes('optional') || lowercaseLine.includes('nice to have')) {
      priority = 'LOW';
    }
    
    return {
      id,
      shortName: `Requirement ${id}`,
      description: line,
      source: 'parsed',
      category,
      priority,
      derivedElements: {
        swcs,
        interfaces,
        signals,
        ports,
        runnables
      },
      communication,
      timing,
      ecuBehavior
    };
  }

  private static extractSwcs(text: string): string[] {
    const swcs: string[] = [];
    
    // Enhanced patterns for SWC extraction
    const swcPatterns = [
      // Direct SWC mentions: "sensor_swc", "EMS_swc"
      /(?:software component|component)\s+(\w+_swc)/gi,
      /(\w+_swc)(?:\s+shall|\s+must|\s+will)/gi,
      // Controller patterns
      /(\w+)Controller/gi,
      /(\w+)\s+SWC/gi,
      /SWC\s+(\w+)/gi,
      // General component patterns
      /implement\s+(\w+)/gi,
      /(\w+)\s+shall/gi,
      // Direct _swc patterns
      /(\w+_swc)/gi
    ];
    
    swcPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 2) {
          let swcName = match[1];
          
          // Ensure proper formatting
          if (!swcName.endsWith('_swc') && !swcName.endsWith('Controller')) {
            if (swcName.toLowerCase().includes('controller')) {
              swcName = swcName.charAt(0).toUpperCase() + swcName.slice(1).toLowerCase();
            } else {
              swcName = swcName + '_swc';
            }
          }
          
          if (!swcs.includes(swcName)) {
            swcs.push(swcName);
          }
        }
      }
    });
    
    return swcs;
  }

  private static extractInterfaces(text: string, swcs: string[]): string[] {
    const interfaces: string[] = [];
    
    // Enhanced interface naming based on SWCs
    if (swcs.length >= 2) {
      // Create interface name from sender and receiver SWCs
      const senderSwc = swcs[0].replace('_swc', '').replace('Controller', '');
      const receiverSwc = swcs[1].replace('_swc', '').replace('Controller', '');
      const interfaceName = `${senderSwc}_${receiverSwc}_portinterface`;
      interfaces.push(interfaceName);
    }
    
    // Standard interface patterns
    const interfacePatterns = [
      /(\w+)\s+interface/gi,
      /via\s+(\w+)/gi,
      /using\s+(\w+)\s+interface/gi,
      /(\w+)Interface/gi,
      /(\w+)_portinterface/gi
    ];
    
    interfacePatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 2 && !match[1].toLowerCase().includes('sender') && !match[1].toLowerCase().includes('receiver')) {
          const interfaceName = match[1].includes('_portinterface') ? match[1] : match[1] + 'Interface';
          if (!interfaces.includes(interfaceName)) {
            interfaces.push(interfaceName);
          }
        }
      }
    });
    
    // Default interface if none found but communication is detected
    if (interfaces.length === 0 && (text.toLowerCase().includes('send') || text.toLowerCase().includes('receive'))) {
      interfaces.push('DefaultInterface');
    }
    
    return interfaces;
  }

  private static extractSignals(text: string): string[] {
    const signals: string[] = [];
    
    // Enhanced signal patterns
    const signalPatterns = [
      /(\w+)\s+signal/gi,
      /send\s+(?:a\s+)?(\w+)(?:\s+value)?/gi,
      /receive\s+(?:a\s+)?(\w+)(?:\s+value)?/gi,
      /(\w+)\s+data/gi,
      /(\w+)\s+value/gi,
      // Specific value types
      /(?:temperature|pressure|speed|voltage|current)\s+value/gi,
      /(temperature|pressure|speed|voltage|current)/gi
    ];
    
    signalPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 2) {
          const signalName = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
          if (!signals.includes(signalName)) {
            signals.push(signalName);
          }
        }
      }
    });
    
    return signals;
  }

  private static generatePorts(swcs: string[], interfaces: string[]): string[] {
    const ports: string[] = [];
    
    if (swcs.length >= 2 && interfaces.length > 0) {
      // Generate provided port for sender
      const senderName = swcs[0].replace('_swc', '').replace('Controller', '');
      ports.push(`${senderName}_ProvidedPort`);
      
      // Generate required port for receiver
      const receiverName = swcs[1].replace('_swc', '').replace('Controller', '');
      ports.push(`${receiverName}_RequiredPort`);
    }
    
    return ports;
  }

  private static generateRunnables(swcs: string[], timing?: RequirementDocument['timing']): string[] {
    const runnables: string[] = [];
    
    swcs.forEach(swc => {
      const baseName = swc.replace('_swc', '').replace('Controller', '');
      
      // Always generate init runnable
      runnables.push(`${swc}_init`);
      
      // Generate timing-specific runnable
      if (timing?.type === 'periodic' && timing.period) {
        const unit = timing.unit || 'ms';
        runnables.push(`${swc}_${timing.period}${unit}`);
      } else {
        runnables.push(`${swc}_main`);
      }
    });
    
    return runnables;
  }

  private static extractCommunication(text: string): RequirementDocument['communication'] | undefined {
    const lowercaseText = text.toLowerCase();
    
    let interfaceType: 'SenderReceiver' | 'ClientServer' | 'ModeSwitch' | 'Parameter' | 'Trigger' = 'SenderReceiver';
    let direction: 'sender' | 'receiver' | 'both' | undefined;
    
    // Determine interface type
    if (lowercaseText.includes('sender-receiver') || lowercaseText.includes('senderreceiver')) {
      interfaceType = 'SenderReceiver';
    } else if (lowercaseText.includes('client') || lowercaseText.includes('server') || lowercaseText.includes('call')) {
      interfaceType = 'ClientServer';
    } else if (lowercaseText.includes('mode')) {
      interfaceType = 'ModeSwitch';
    } else if (lowercaseText.includes('parameter')) {
      interfaceType = 'Parameter';
    } else if (lowercaseText.includes('trigger')) {
      interfaceType = 'Trigger';
    }
    
    // Determine direction
    if (lowercaseText.includes('send') && !lowercaseText.includes('receive')) {
      direction = 'sender';
    } else if (lowercaseText.includes('receive') && !lowercaseText.includes('send')) {
      direction = 'receiver';
    } else if (lowercaseText.includes('send') && lowercaseText.includes('receive')) {
      direction = 'both';
    }
    
    // Extract data elements
    const dataElements = this.extractDataElements(text);
    
    if (direction || dataElements.length > 0 || interfaceType !== 'SenderReceiver') {
      return {
        interfaceType,
        direction,
        dataElements
      };
    }
    
    return undefined;
  }

  private static extractDataElements(text: string): Array<{ name: string; type: string; category?: string }> {
    const dataElements: Array<{ name: string; type: string; category?: string }> = [];
    
    // Enhanced data element patterns
    const typePatterns = [
      /(\w+)\s+(?:shall be of type|type)\s+(uint\d+|int\d+|boolean|float|double)/gi,
      /(\w+)\s*\(\s*(uint\d+|int\d+|boolean|float|double)\s*\)/gi,
      /(uint\d+|int\d+|boolean|float|double)\s+(\w+)/gi
    ];
    
    typePatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        let name: string, type: string;
        if (match[1] && match[2]) {
          name = match[1];
          type = match[2];
        } else if (match[2] && match[1]) {
          name = match[2];
          type = match[1];
        } else {
          continue;
        }
        
        if (name.length > 1 && type.length > 1) {
          const elementName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
          if (!dataElements.find(de => de.name === elementName)) {
            dataElements.push({
              name: elementName,
              type: type.toLowerCase(),
              category: 'VALUE'
            });
          }
        }
      }
    });
    
    // If no specific data elements found, infer from signals and context
    if (dataElements.length === 0) {
      const signals = this.extractSignals(text);
      signals.forEach(signal => {
        let dataType = 'uint16'; // Default for most automotive signals
        
        // Infer data type from signal name
        const signalLower = signal.toLowerCase();
        if (signalLower.includes('temperature') || signalLower.includes('pressure')) {
          dataType = 'uint16';
        } else if (signalLower.includes('speed') || signalLower.includes('rpm')) {
          dataType = 'uint16';
        } else if (signalLower.includes('status') || signalLower.includes('flag')) {
          dataType = 'boolean';
        }
        
        dataElements.push({
          name: signal,
          type: dataType,
          category: 'VALUE'
        });
      });
    }
    
    return dataElements;
  }

  private static extractTiming(text: string): RequirementDocument['timing'] | undefined {
    const timingPatterns = [
      /every\s+(\d+)\s*(ms|milliseconds?)/gi,
      /(\d+)\s*(ms|milliseconds?)\s+period/gi,
      /period\s+of\s+(\d+)\s*(ms|milliseconds?)/gi,
      /(\d+)\s*(s|seconds?)\s+period/gi,
      /every\s+(\d+)\s*(s|seconds?)/gi,
      /transmission\s+period\s+of\s+(\d+)\s*(ms|milliseconds?)/gi,
      /with\s+a\s+transmission\s+period\s+of\s+(\d+)\s*(ms|milliseconds?)/gi
    ];
    
    for (const pattern of timingPatterns) {
      const match = pattern.exec(text);
      if (match) {
        const period = parseInt(match[1]);
        const unit = match[2].startsWith('s') ? 's' : 'ms';
        
        return {
          type: 'periodic',
          period,
          unit: unit as 'ms' | 's'
        };
      }
    }
    
    // Check for event-driven
    if (text.toLowerCase().includes('event') || text.toLowerCase().includes('trigger')) {
      return {
        type: 'event'
      };
    }

    // Check for initialization
    if (text.toLowerCase().includes('init') || text.toLowerCase().includes('startup')) {
      return {
        type: 'init'
      };
    }
    
    return undefined;
  }

  private static extractEcuBehavior(text: string): RequirementDocument['ecuBehavior'] | undefined {
    const ecuPatterns = [
      /ECU\s+(\w+)/gi,
      /(\w+)\s+ECU/gi,
      /(\w+)(?:ControlUnit|Controller)/gi
    ];
    
    for (const pattern of ecuPatterns) {
      const match = pattern.exec(text);
      if (match && match[1]) {
        const ecuName = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
        const swcInstances = this.extractSwcs(text);
        
        return {
          ecuName,
          swcInstances
        };
      }
    }
    
    return undefined;
  }
}
