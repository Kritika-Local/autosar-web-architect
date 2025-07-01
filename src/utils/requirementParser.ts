
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
      
      // Detect requirement headers (REQ-XXX, numbered items, bullets)
      const reqMatch = trimmed.match(/^(?:REQ-\d+|(\d+\.|\d+\)|\*|\-)\s*)/);
      if (reqMatch || this.isRequirementStart(trimmed)) {
        if (currentReq && currentReq.description) {
          requirements.push(this.finalizeRequirement(currentReq));
        }
        
        currentReq = {
          id: this.generateRequirementId(trimmed),
          shortName: this.extractShortName(trimmed),
          description: this.cleanDescription(trimmed),
          category: this.inferCategory(trimmed),
          priority: 'MEDIUM',
          source: 'IMPORTED',
          derivedElements: { swcs: [], interfaces: [], ports: [], runnables: [] }
        };
      } else if (currentReq && trimmed) {
        currentReq.description += ' ' + trimmed;
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
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      const req: RequirementDocument = {
        id: row[0] || `REQ-${i.toString().padStart(3, '0')}`,
        shortName: row[1] || `Requirement_${i}`,
        description: row[2] || 'No description provided',
        category: this.mapCategory(row[3]),
        priority: this.mapPriority(row[4]),
        source: 'IMPORTED',
        derivedElements: { swcs: [], interfaces: [], ports: [], runnables: [] }
      };
      
      requirements.push(req);
    }
    
    return requirements;
  }

  private static isRequirementStart(text: string): boolean {
    const patterns = [
      /^(the system shall|system must|requirement:|req\s*\d+)/i,
      /^(functional|non-functional|interface|constraint)/i
    ];
    return patterns.some(pattern => pattern.test(text));
  }

  private static generateRequirementId(text: string): string {
    const match = text.match(/REQ-\d+/i);
    if (match) return match[0].toUpperCase();
    
    return `REQ-${Date.now().toString().slice(-6)}`;
  }

  private static extractShortName(text: string): string {
    const cleaned = text.replace(/^(?:REQ-\d+|(\d+\.|\d+\)|\*|\-)\s*)/, '');
    return cleaned.split(' ').slice(0, 4).join('_').replace(/[^a-zA-Z0-9_]/g, '');
  }

  private static cleanDescription(text: string): string {
    return text.replace(/^(?:REQ-\d+|(\d+\.|\d+\)|\*|\-)\s*)/, '').trim();
  }

  private static inferCategory(text: string): RequirementDocument['category'] {
    const lower = text.toLowerCase();
    if (lower.includes('interface') || lower.includes('port') || lower.includes('signal')) {
      return 'INTERFACE';
    }
    if (lower.includes('performance') || lower.includes('timing') || lower.includes('memory')) {
      return 'NON_FUNCTIONAL';
    }
    if (lower.includes('constraint') || lower.includes('limitation')) {
      return 'CONSTRAINT';
    }
    return 'FUNCTIONAL';
  }

  private static mapCategory(value: string): RequirementDocument['category'] {
    if (!value) return 'FUNCTIONAL';
    const lower = value.toLowerCase();
    if (lower.includes('non') || lower.includes('performance')) return 'NON_FUNCTIONAL';
    if (lower.includes('interface')) return 'INTERFACE';
    if (lower.includes('constraint')) return 'CONSTRAINT';
    return 'FUNCTIONAL';
  }

  private static mapPriority(value: string): RequirementDocument['priority'] {
    if (!value) return 'MEDIUM';
    const lower = value.toLowerCase();
    if (lower.includes('high') || lower.includes('critical')) return 'HIGH';
    if (lower.includes('low')) return 'LOW';
    return 'MEDIUM';
  }

  private static finalizeRequirement(req: Partial<RequirementDocument>): RequirementDocument {
    return {
      id: req.id || `REQ-${Date.now()}`,
      shortName: req.shortName || 'UnnamedRequirement',
      description: req.description || 'No description',
      category: req.category || 'FUNCTIONAL',
      priority: req.priority || 'MEDIUM',
      source: req.source || 'IMPORTED',
      derivedElements: req.derivedElements || { swcs: [], interfaces: [], ports: [], runnables: [] }
    };
  }
}
