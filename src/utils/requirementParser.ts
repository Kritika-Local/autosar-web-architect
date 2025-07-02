
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
  // Enhanced fields for AUTOSAR generation
  timing?: {
    period?: number;
    unit?: 'ms' | 's';
    type?: 'periodic' | 'event' | 'init';
  };
  communication?: {
    direction?: 'sender' | 'receiver' | 'both';
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
    const lines = text.split('\n');
    let currentReq: Partial<RequirementDocument> | null = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Enhanced requirement detection patterns
      const reqMatch = trimmed.match(/^(?:REQ-\d+|(\d+\.|\d+\)|\*|\-|\•)\s*)/);
      const isReqStart = reqMatch || this.isRequirementStart(trimmed);
      
      if (isReqStart) {
        if (currentReq && currentReq.description) {
          requirements.push(this.finalizeRequirement(currentReq));
        }
        
        currentReq = {
          id: this.generateRequirementId(trimmed, requirements.length),
          shortName: this.extractShortName(trimmed),
          description: this.cleanDescription(trimmed),
          category: this.inferCategory(trimmed),
          priority: this.inferPriority(trimmed),
          source: 'IMPORTED',
          derivedElements: { swcs: [], interfaces: [], ports: [], runnables: [] },
          timing: this.extractTiming(trimmed),
          communication: this.extractCommunication(trimmed),
          ecuBehavior: this.extractEcuBehavior(trimmed)
        };
      } else if (currentReq && trimmed) {
        currentReq.description += ' ' + trimmed;
        // Update derived elements as we build the description
        this.updateDerivedElements(currentReq, trimmed);
      }
    }
    
    if (currentReq && currentReq.description) {
      requirements.push(this.finalizeRequirement(currentReq));
    }
    
    return requirements;
  }

  private static extractRequirementsFromTable(data: string[][]): RequirementDocument[] {
    const requirements: RequirementDocument[] = [];
    const headers = data[0] || [];
    
    // Map column indices
    const colMap = this.mapTableColumns(headers);
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      const description = row[colMap.description] || row[2] || 'No description provided';
      
      const req: RequirementDocument = {
        id: row[colMap.id] || `REQ-${i.toString().padStart(3, '0')}`,
        shortName: row[colMap.shortName] || `Requirement_${i}`,
        description,
        category: this.mapCategory(row[colMap.category]),
        priority: this.mapPriority(row[colMap.priority]),
        source: 'IMPORTED',
        derivedElements: { swcs: [], interfaces: [], ports: [], runnables: [] },
        timing: this.extractTiming(description),
        communication: this.extractCommunication(description),
        ecuBehavior: this.extractEcuBehavior(description)
      };
      
      this.updateDerivedElements(req, description);
      requirements.push(req);
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

  private static isRequirementStart(text: string): boolean {
    const patterns = [
      /^(the\s+(?:system|ecu|swc)\s+shall|(?:system|ecu|swc)\s+must|requirement:|req\s*\d+)/i,
      /^(functional|non-functional|interface|constraint|timing)/i,
      /^\d+\.\s+/,
      /^[a-z]\)\s+/i
    ];
    return patterns.some(pattern => pattern.test(text));
  }

  private static generateRequirementId(text: string, index: number): string {
    const match = text.match(/REQ-\d+/i);
    if (match) return match[0].toUpperCase();
    
    const numMatch = text.match(/^\d+/);
    if (numMatch) return `REQ-${numMatch[0].padStart(3, '0')}`;
    
    return `REQ-${(index + 1).toString().padStart(3, '0')}`;
  }

  private static extractShortName(text: string): string {
    const cleaned = text.replace(/^(?:REQ-\d+|(\d+\.|\d+\)|\*|\-|\•)\s*)/, '');
    const words = cleaned.split(' ').slice(0, 4);
    return words.join('_').replace(/[^a-zA-Z0-9_]/g, '').substring(0, 50) || 'Unnamed_Requirement';
  }

  private static cleanDescription(text: string): string {
    return text.replace(/^(?:REQ-\d+|(\d+\.|\d+\)|\*|\-|\•)\s*)/, '').trim();
  }

  private static extractTiming(text: string): RequirementDocument['timing'] {
    const timing: RequirementDocument['timing'] = {};
    
    // Extract periodic timing (e.g., "every 10ms", "each 100ms", "10ms period")
    const periodicMatch = text.match(/(?:every|each|period(?:ic)?(?:ally)?)\s+(\d+)\s*(ms|millisecond|s|second)/i);
    if (periodicMatch) {
      timing.period = parseInt(periodicMatch[1]);
      timing.unit = periodicMatch[2].startsWith('ms') || periodicMatch[2].startsWith('millisecond') ? 'ms' : 's';
      timing.type = 'periodic';
    }
    
    // Extract event-based timing
    if (/(?:event|trigger|interrupt|on\s+change)/i.test(text)) {
      timing.type = 'event';
    }
    
    // Extract initialization
    if (/(?:init|startup|begin|start)/i.test(text)) {
      timing.type = 'init';
    }
    
    return Object.keys(timing).length > 0 ? timing : undefined;
  }

  private static extractCommunication(text: string): RequirementDocument['communication'] {
    const communication: RequirementDocument['communication'] = {};
    
    // Determine communication direction
    const hasSend = /(?:send|transmit|provide|output|write)/i.test(text);
    const hasReceive = /(?:receive|input|read|consume|get)/i.test(text);
    
    if (hasSend && hasReceive) {
      communication.direction = 'both';
    } else if (hasSend) {
      communication.direction = 'sender';
    } else if (hasReceive) {
      communication.direction = 'receiver';
    }
    
    // Extract data elements with types
    const dataElements: Array<{ name: string; type: string; size?: number }> = [];
    
    // Pattern for data with types (e.g., "speed uint16", "temperature value uint8")
    const dataTypeMatches = text.matchAll(/(\w+)\s+(?:data|signal|value|status)\s*(?:of\s+type\s+)?(\w+)/gi);
    for (const match of dataTypeMatches) {
      dataElements.push({
        name: this.toPascalCase(match[1]),
        type: this.mapDataType(match[2])
      });
    }
    
    // Pattern for generic data mentions
    const dataMatches = text.matchAll(/(\w+)\s+(?:speed|temperature|pressure|position|angle|voltage|current)/gi);
    for (const match of dataMatches) {
      const name = this.toPascalCase(match[0]);
      if (!dataElements.find(de => de.name === name)) {
        dataElements.push({
          name,
          type: this.inferDataType(match[0])
        });
      }
    }
    
    if (dataElements.length > 0) {
      communication.dataElements = dataElements;
    }
    
    return Object.keys(communication).length > 0 ? communication : undefined;
  }

  private static extractEcuBehavior(text: string): RequirementDocument['ecuBehavior'] {
    const ecuBehavior: RequirementDocument['ecuBehavior'] = {};
    
    // Extract ECU name
    const ecuMatch = text.match(/(?:ecu|electronic\s+control\s+unit)\s+(\w+)/i);
    if (ecuMatch) {
      ecuBehavior.ecuName = this.toPascalCase(ecuMatch[1]) + 'ECU';
    }
    
    // Extract SWC instances
    const swcMatches = text.matchAll(/(\w+)\s+(?:component|swc|software\s+component)/gi);
    const swcInstances: string[] = [];
    for (const match of swcMatches) {
      const swcName = this.toPascalCase(match[1]);
      if (!swcInstances.includes(swcName)) {
        swcInstances.push(swcName);
      }
    }
    
    if (swcInstances.length > 0) {
      ecuBehavior.swcInstances = swcInstances;
    }
    
    return Object.keys(ecuBehavior).length > 0 ? ecuBehavior : undefined;
  }

  private static updateDerivedElements(req: Partial<RequirementDocument>, text: string) {
    if (!req.derivedElements) return;
    
    // Extract SWC names
    const swcPatterns = [
      /(\w+)(?:\s+controller|\s+manager|\s+component|\s+swc)/gi,
      /(?:the\s+)?(\w+)(?:\s+shall|\s+must|\s+will)/gi
    ];
    
    for (const pattern of swcPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const swcName = this.toPascalCase(match[1]);
        if (swcName.length > 2 && !req.derivedElements.swcs.includes(swcName)) {
          req.derivedElements.swcs.push(swcName);
        }
      }
    }
    
    // Extract interface names
    const interfacePatterns = [
      /(\w+)(?:\s+interface|\s+data|\s+signal)/gi,
      /(?:interface|data|signal)\s+(\w+)/gi
    ];
    
    for (const pattern of interfacePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const ifaceName = this.toPascalCase(match[1]) + 'Interface';
        if (!req.derivedElements.interfaces.includes(ifaceName)) {
          req.derivedElements.interfaces.push(ifaceName);
        }
      }
    }
  }

  private static inferCategory(text: string): RequirementDocument['category'] {
    const lower = text.toLowerCase();
    if (lower.includes('interface') || lower.includes('port') || lower.includes('signal') || lower.includes('communication')) {
      return 'INTERFACE';
    }
    if (lower.includes('performance') || lower.includes('timing') || lower.includes('memory') || lower.includes('cpu')) {
      return 'NON_FUNCTIONAL';
    }
    if (lower.includes('constraint') || lower.includes('limitation') || lower.includes('restriction')) {
      return 'CONSTRAINT';
    }
    return 'FUNCTIONAL';
  }

  private static inferPriority(text: string): RequirementDocument['priority'] {
    const lower = text.toLowerCase();
    if (lower.includes('critical') || lower.includes('mandatory') || lower.includes('must')) {
      return 'HIGH';
    }
    if (lower.includes('optional') || lower.includes('nice') || lower.includes('should')) {
      return 'LOW';
    }
    return 'MEDIUM';
  }

  private static mapCategory(value: string): RequirementDocument['category'] {
    if (!value) return 'FUNCTIONAL';
    const lower = value.toLowerCase();
    if (lower.includes('non') || lower.includes('performance') || lower.includes('timing')) return 'NON_FUNCTIONAL';
    if (lower.includes('interface') || lower.includes('communication')) return 'INTERFACE';
    if (lower.includes('constraint') || lower.includes('limit')) return 'CONSTRAINT';
    return 'FUNCTIONAL';
  }

  private static mapPriority(value: string): RequirementDocument['priority'] {
    if (!value) return 'MEDIUM';
    const lower = value.toLowerCase();
    if (lower.includes('high') || lower.includes('critical') || lower.includes('mandatory')) return 'HIGH';
    if (lower.includes('low') || lower.includes('optional')) return 'LOW';
    return 'MEDIUM';
  }

  private static mapDataType(typeStr: string): string {
    const lower = typeStr.toLowerCase();
    if (lower.includes('bool')) return 'boolean';
    if (lower.includes('uint8') || lower.includes('byte')) return 'uint8';
    if (lower.includes('uint16') || lower.includes('word')) return 'uint16';
    if (lower.includes('uint32') || lower.includes('dword')) return 'uint32';
    if (lower.includes('sint8')) return 'sint8';
    if (lower.includes('sint16')) return 'sint16';
    if (lower.includes('sint32')) return 'sint32';
    if (lower.includes('float') || lower.includes('real')) return 'float32';
    return 'uint16'; // default
  }

  private static inferDataType(dataName: string): string {
    const lower = dataName.toLowerCase();
    if (lower.includes('flag') || lower.includes('enable') || lower.includes('active')) return 'boolean';
    if (lower.includes('status') || lower.includes('state') || lower.includes('mode')) return 'uint8';
    if (lower.includes('count') || lower.includes('index')) return 'uint16';
    if (lower.includes('temperature') || lower.includes('pressure')) return 'sint16';
    if (lower.includes('speed') || lower.includes('rpm') || lower.includes('frequency')) return 'uint16';
    if (lower.includes('voltage') || lower.includes('current')) return 'float32';
    return 'uint16'; // default
  }

  private static toPascalCase(str: string): string {
    return str.replace(/(?:^|[^a-zA-Z0-9])([a-zA-Z])/g, (_, char) => char.toUpperCase())
              .replace(/[^a-zA-Z0-9]/g, '');
  }

  private static finalizeRequirement(req: Partial<RequirementDocument>): RequirementDocument {
    return {
      id: req.id || `REQ-${Date.now()}`,
      shortName: req.shortName || 'UnnamedRequirement',
      description: req.description || 'No description',
      category: req.category || 'FUNCTIONAL',
      priority: req.priority || 'MEDIUM',
      source: req.source || 'IMPORTED',
      derivedElements: req.derivedElements || { swcs: [], interfaces: [], ports: [], runnables: [] },
      timing: req.timing,
      communication: req.communication,
      ecuBehavior: req.ecuBehavior
    };
  }
}
