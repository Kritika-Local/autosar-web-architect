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
    
    // Extract SWC names
    const swcs = this.extractSwcs(line);
    
    // Extract interfaces
    const interfaces = this.extractInterfaces(line);
    
    // Extract signals/data elements
    const signals = this.extractSignals(line);
    
    // Extract communication info
    const communication = this.extractCommunication(line);
    
    // Extract timing info
    const timing = this.extractTiming(line);
    
    // Extract ECU behavior
    const ecuBehavior = this.extractEcuBehavior(line);
    
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
        signals
      },
      communication,
      timing,
      ecuBehavior
    };
  }

  private static extractSwcs(text: string): string[] {
    const swcs: string[] = [];
    const swcPatterns = [
      /(\w+)Controller/gi,
      /(\w+)\s+SWC/gi,
      /SWC\s+(\w+)/gi,
      /implement\s+(\w+)/gi,
      /(\w+)\s+shall/gi
    ];
    
    swcPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 2) {
          const swcName = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
          if (!swcs.includes(swcName)) {
            swcs.push(swcName);
          }
        }
      }
    });
    
    return swcs;
  }

  private static extractInterfaces(text: string): string[] {
    const interfaces: string[] = [];
    const interfacePatterns = [
      /(\w+)\s+interface/gi,
      /via\s+(\w+)/gi,
      /using\s+(\w+)\s+interface/gi,
      /(\w+)Interface/gi
    ];
    
    interfacePatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 2 && !match[1].toLowerCase().includes('sender') && !match[1].toLowerCase().includes('receiver')) {
          const interfaceName = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase() + 'Interface';
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
    const signalPatterns = [
      /(\w+)\s+signal/gi,
      /send\s+(\w+)/gi,
      /receive\s+(\w+)/gi,
      /(\w+)\s+data/gi
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

  private static extractCommunication(text: string): RequirementDocument['communication'] | undefined {
    const lowercaseText = text.toLowerCase();
    
    let interfaceType: 'SenderReceiver' | 'ClientServer' | 'ModeSwitch' | 'Parameter' | 'Trigger' = 'SenderReceiver';
    let direction: 'sender' | 'receiver' | 'both' | undefined;
    
    // Determine interface type
    if (lowercaseText.includes('client') || lowercaseText.includes('server') || lowercaseText.includes('call')) {
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
    
    if (direction || dataElements.length > 0) {
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
    
    // Pattern for type specifications like "uint16", "uint32", etc.
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
    
    // If no specific data elements found, infer from signals
    if (dataElements.length === 0) {
      const signals = this.extractSignals(text);
      signals.forEach(signal => {
        dataElements.push({
          name: signal,
          type: 'uint32', // Default type
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
      /every\s+(\d+)\s*(s|seconds?)/gi
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
