
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

export interface RequirementDocument {
  id: string;
  shortName: string;
  description: string;
  category: 'FUNCTIONAL' | 'NON_FUNCTIONAL' | 'CONSTRAINT' | 'INTERFACE';
  traceTo?: string[];
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  source: string;
  derivedElements: {
    swcs: string[];
    interfaces: string[];
    ports: string[];
    runnables: string[];
  };
  timing?: {
    period?: number;
    unit?: 'ms' | 's';
    type?: 'periodic' | 'event' | 'init';
  };
  communication?: {
    direction?: 'sender' | 'receiver' | 'both';
    interfaceType?: 'SenderReceiver' | 'ClientServer';
    dataElements?: Array<{
      name: string;
      type: string;
      size?: number;
    }>;
  };
  ecuBehavior?: {
    ecuName?: string;
    swcInstances?: string[];
  };
}

export class RequirementParser {
  static async parseFile(file: File): Promise<RequirementDocument[]> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'txt':
        return this.parseTxtFile(file);
      case 'doc':
      case 'docx':
        return this.parseDocxFile(file);
      case 'xls':
      case 'xlsx':
        return this.parseExcelFile(file);
      default:
        throw new Error(`Unsupported file format: ${extension}`);
    }
  }

  private static async parseTxtFile(file: File): Promise<RequirementDocument[]> {
    const text = await file.text();
    return this.extractRequirementsFromText(text);
  }

  private static async parseDocxFile(file: File): Promise<RequirementDocument[]> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return this.extractRequirementsFromText(result.value);
  }

  private static async parseExcelFile(file: File): Promise<RequirementDocument[]> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
    
    return this.extractRequirementsFromTable(data);
  }

  private static extractRequirementsFromText(text: string): RequirementDocument[] {
    const requirements: RequirementDocument[] = [];
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
    
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();
      if (paragraph.length < 20) continue; // Skip very short paragraphs
      
      const req = this.parseNaturalLanguageRequirement(paragraph, i + 1);
      if (req) {
        requirements.push(req);
      }
    }
    
    return requirements;
  }

  private static parseNaturalLanguageRequirement(text: string, index: number): RequirementDocument | null {
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    // Extract SWCs - look for components, controllers, systems
    const swcs = this.extractSwcNames(cleanText);
    
    // Extract timing information
    const timing = this.extractTimingInfo(cleanText);
    
    // Extract communication info
    const communication = this.extractCommunicationInfo(cleanText);
    
    // Extract data elements
    const dataElements = this.extractDataElements(cleanText);
    
    // Generate requirement ID
    const id = `REQ-${index.toString().padStart(3, '0')}`;
    
    // Generate short name from first few words
    const shortName = this.generateShortName(cleanText);
    
    return {
      id,
      shortName,
      description: cleanText,
      category: this.inferCategory(cleanText),
      priority: this.inferPriority(cleanText),
      source: 'IMPORTED',
      derivedElements: {
        swcs,
        interfaces: this.generateInterfaceNames(swcs, communication),
        ports: this.generatePortNames(swcs, communication),
        runnables: this.generateRunnableNames(swcs, timing)
      },
      timing,
      communication: {
        ...communication,
        dataElements
      }
    };
  }

  private static extractSwcNames(text: string): string[] {
    const swcs: string[] = [];
    const patterns = [
      // Explicit mentions
      /(\w+)(?:\s+(?:controller|component|swc|system|manager|module))/gi,
      // The X shall/must/will patterns
      /(?:the\s+)?(\w+)(?:\s+shall|\s+must|\s+will|\s+should)/gi,
      // ECU patterns
      /(\w+)(?:\s+ecu)/gi
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const name = this.toPascalCase(match[1]);
        if (name.length > 2 && !this.isCommonWord(name) && !swcs.includes(name)) {
          swcs.push(name);
        }
      }
    }

    // If no SWCs found, try to infer from context
    if (swcs.length === 0) {
      const words = text.split(/\s+/).slice(0, 10);
      for (const word of words) {
        const cleaned = word.replace(/[^a-zA-Z]/g, '');
        if (cleaned.length > 3 && !this.isCommonWord(cleaned)) {
          swcs.push(this.toPascalCase(cleaned));
          break;
        }
      }
    }

    return swcs.length > 0 ? swcs : ['SystemController'];
  }

  private static extractTimingInfo(text: string): RequirementDocument['timing'] {
    // Look for periodic timing
    const periodicMatch = text.match(/(?:every|each|period(?:ic)?(?:ally)?)\s+(\d+)\s*(ms|millisecond|s|second)/i);
    if (periodicMatch) {
      return {
        period: parseInt(periodicMatch[1]),
        unit: periodicMatch[2].startsWith('ms') ? 'ms' : 's',
        type: 'periodic'
      };
    }

    // Look for event-based
    if (/(?:event|trigger|interrupt|on\s+change|when)/i.test(text)) {
      return { type: 'event' };
    }

    // Look for initialization
    if (/(?:init|startup|begin|start|initialize)/i.test(text)) {
      return { type: 'init' };
    }

    return undefined;
  }

  private static extractCommunicationInfo(text: string): Partial<RequirementDocument['communication']> {
    const comm: Partial<RequirementDocument['communication']> = {};

    // Determine direction
    const hasSend = /(?:send|transmit|provide|output|write|publish)/i.test(text);
    const hasReceive = /(?:receive|input|read|consume|get|subscribe)/i.test(text);

    if (hasSend && hasReceive) {
      comm.direction = 'both';
    } else if (hasSend) {
      comm.direction = 'sender';
    } else if (hasReceive) {
      comm.direction = 'receiver';
    }

    // Determine interface type
    if (/(?:call|invoke|request|response|client|server)/i.test(text)) {
      comm.interfaceType = 'ClientServer';
    } else {
      comm.interfaceType = 'SenderReceiver';
    }

    return comm;
  }

  private static extractDataElements(text: string): Array<{ name: string; type: string; size?: number }> {
    const dataElements: Array<{ name: string; type: string; size?: number }> = [];
    
    // Common automotive data patterns
    const patterns = [
      { pattern: /(\w*)?(?:speed|velocity)(?:\s+(\w+))?/gi, defaultType: 'uint16', baseName: 'Speed' },
      { pattern: /(\w*)?(?:temperature|temp)(?:\s+(\w+))?/gi, defaultType: 'sint16', baseName: 'Temperature' },
      { pattern: /(\w*)?(?:pressure)(?:\s+(\w+))?/gi, defaultType: 'uint16', baseName: 'Pressure' },
      { pattern: /(\w*)?(?:status|state)(?:\s+(\w+))?/gi, defaultType: 'uint8', baseName: 'Status' },
      { pattern: /(\w*)?(?:position|angle)(?:\s+(\w+))?/gi, defaultType: 'uint16', baseName: 'Position' },
      { pattern: /(\w*)?(?:flag|enable|disable)(?:\s+(\w+))?/gi, defaultType: 'boolean', baseName: 'Flag' },
      { pattern: /(\w*)?(?:voltage|volt)(?:\s+(\w+))?/gi, defaultType: 'float32', baseName: 'Voltage' },
      { pattern: /(\w*)?(?:current|amp)(?:\s+(\w+))?/gi, defaultType: 'float32', baseName: 'Current' },
      { pattern: /(\w*)?(?:signal|data)(?:\s+(\w+))?/gi, defaultType: 'uint32', baseName: 'Signal' }
    ];

    for (const { pattern, defaultType, baseName } of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const prefix = match[1] ? this.toPascalCase(match[1]) : '';
        const suffix = match[2] ? this.toPascalCase(match[2]) : '';
        const name = prefix + baseName + suffix || baseName;
        
        if (!dataElements.find(de => de.name === name)) {
          dataElements.push({
            name,
            type: defaultType
          });
        }
      }
    }

    // If no specific data found, create a generic one
    if (dataElements.length === 0) {
      dataElements.push({
        name: 'DataElement',
        type: 'uint32'
      });
    }

    return dataElements;
  }

  private static generateInterfaceNames(swcs: string[], communication?: Partial<RequirementDocument['communication']>): string[] {
    const interfaces: string[] = [];
    
    for (const swc of swcs) {
      const baseName = swc.replace(/Controller$/, '');
      const interfaceName = baseName + 'Interface';
      if (!interfaces.includes(interfaceName)) {
        interfaces.push(interfaceName);
      }
    }

    return interfaces.length > 0 ? interfaces : ['DataInterface'];
  }

  private static generatePortNames(swcs: string[], communication?: Partial<RequirementDocument['communication']>): string[] {
    const ports: string[] = [];
    
    for (const swc of swcs) {
      const baseName = swc.replace(/Controller$/, '');
      
      if (communication?.direction === 'sender' || communication?.direction === 'both') {
        ports.push(baseName + 'OutputPort');
      }
      if (communication?.direction === 'receiver' || communication?.direction === 'both') {
        ports.push(baseName + 'InputPort');
      }
      if (!communication?.direction) {
        ports.push(baseName + 'Port');
      }
    }

    return ports;
  }

  private static generateRunnableNames(swcs: string[], timing?: RequirementDocument['timing']): string[] {
    const runnables: string[] = [];
    
    for (const swc of swcs) {
      const baseName = swc.replace(/Controller$/, '');
      
      // Always add init runnable
      runnables.push(baseName + '_Init');
      
      // Add timing-based runnable
      if (timing?.type === 'periodic' && timing.period) {
        runnables.push(`${baseName}_${timing.period}${timing.unit || 'ms'}`);
      } else if (timing?.type === 'event') {
        runnables.push(baseName + '_Event');
      } else {
        runnables.push(baseName + '_Main');
      }
    }

    return runnables;
  }

  private static extractRequirementsFromTable(data: string[][]): RequirementDocument[] {
    const requirements: RequirementDocument[] = [];
    const headers = data[0] || [];
    
    const colMap = this.mapTableColumns(headers);
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      const description = row[colMap.description] || row[2] || '';
      if (description.length < 10) continue;
      
      const req = this.parseNaturalLanguageRequirement(description, i);
      if (req) {
        req.id = row[colMap.id] || req.id;
        req.shortName = row[colMap.shortName] || req.shortName;
        requirements.push(req);
      }
    }
    
    return requirements;
  }

  private static mapTableColumns(headers: string[]) {
    const map = { id: 0, shortName: 1, description: 2, category: 3, priority: 4 };
    
    headers.forEach((header, index) => {
      const lower = header.toLowerCase();
      if (lower.includes('id') || lower.includes('req')) map.id = index;
      else if (lower.includes('name') || lower.includes('title')) map.shortName = index;
      else if (lower.includes('desc') || lower.includes('text')) map.description = index;
      else if (lower.includes('cat') || lower.includes('type')) map.category = index;
      else if (lower.includes('prior') || lower.includes('crit')) map.priority = index;
    });
    
    return map;
  }

  private static generateShortName(text: string): string {
    const words = text.split(/\s+/).slice(0, 4);
    return words.map(word => word.replace(/[^a-zA-Z0-9]/g, '')).join('_').substring(0, 50) || 'Requirement';
  }

  private static inferCategory(text: string): RequirementDocument['category'] {
    const lower = text.toLowerCase();
    if (lower.includes('interface') || lower.includes('communication') || lower.includes('signal')) {
      return 'INTERFACE';
    }
    if (lower.includes('timing') || lower.includes('performance') || lower.includes('memory')) {
      return 'NON_FUNCTIONAL';
    }
    if (lower.includes('constraint') || lower.includes('limitation')) {
      return 'CONSTRAINT';
    }
    return 'FUNCTIONAL';
  }

  private static inferPriority(text: string): RequirementDocument['priority'] {
    const lower = text.toLowerCase();
    if (lower.includes('critical') || lower.includes('mandatory') || lower.includes('must')) {
      return 'HIGH';
    }
    if (lower.includes('optional') || lower.includes('should') || lower.includes('nice')) {
      return 'LOW';
    }
    return 'MEDIUM';
  }

  private static isCommonWord(word: string): boolean {
    const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'];
    return commonWords.includes(word.toLowerCase());
  }

  private static toPascalCase(str: string): string {
    return str.replace(/(?:^|[^a-zA-Z0-9])([a-zA-Z])/g, (_, char) => char.toUpperCase())
              .replace(/[^a-zA-Z0-9]/g, '');
  }
}
