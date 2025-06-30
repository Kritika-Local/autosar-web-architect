import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DataElement {
  id: string;
  name: string;
  applicationDataTypeRef: string;
  category?: string;
  description?: string;
  swDataDefProps?: {
    baseTypeRef?: string;
    implementationDataTypeRef?: string;
  };
}

export interface DataType {
  id: string;
  name: string;
  category: 'primitive' | 'array' | 'record' | 'typedef';
  baseType?: string;
  arraySize?: number;
  elements?: { name: string; type: string; }[];
  description?: string;
  // AUTOSAR-compliant fields
  applicationDataType?: {
    category: 'PRIMITIVE' | 'ARRAY' | 'RECORD';
    swDataDefProps?: string;
  };
  implementationDataType?: {
    category: 'PRIMITIVE' | 'ARRAY' | 'RECORD';
    baseTypeEncoding?: string;
    size?: number;
  };
}

export interface Interface {
  id: string;
  name: string;
  type: 'SenderReceiver' | 'ClientServer' | 'ModeSwitch' | 'Parameter' | 'Trigger';
  dataElements?: DataElement[];
  operations?: { 
    name: string; 
    arguments: { name: string; direction: 'IN' | 'OUT' | 'INOUT'; type: string; }[]; 
  }[];
}

export interface Port {
  id: string;
  name: string;
  direction: 'provided' | 'required';
  interfaceRef: string;
  swcId: string;
}

export interface SWCConnection {
  id: string;
  sourceSwcId: string;
  sourcePortId: string;
  targetSwcId: string;
  targetPortId: string;
  name: string;
}

export interface AccessPoint {
  id: string;
  name: string;
  type: 'iRead' | 'iWrite' | 'iCall';
  access: 'implicit' | 'explicit';
  swcId: string;
  runnableId: string;
  portRef?: string;
  dataElementRef?: string;
}

export interface Runnable {
  id: string;
  name: string;
  swcId: string;
  runnableType: 'init' | 'periodic' | 'event';
  period?: number; // for periodic runnables in ms
  canBeInvokedConcurrently: boolean;
  accessPoints: AccessPoint[];
  events: string[];
}

export interface SWC {
  id: string;
  name: string;
  description: string;
  category: 'application' | 'service' | 'ecu-abstraction' | 'complex-driver' | 'sensor-actuator';
  type: 'atomic' | 'composition';
  ports: Port[];
  runnables: Runnable[];
  autosarVersion: string;
  uuid: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  autosarVersion: string;
  swcs: SWC[];
  interfaces: Interface[];
  dataTypes: DataType[];
  dataElements: DataElement[];
  connections: SWCConnection[];
  createdAt: string;
  lastModified: string;
  isDraft: boolean;
  autoSaveEnabled: boolean;
}

interface AutosarStore {
  currentProject: Project | null;
  projects: Project[];
  
  // Project management
  createProject: (projectData: Omit<Project, 'id' | 'createdAt' | 'lastModified' | 'isDraft' | 'autoSaveEnabled'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  loadProject: (id: string) => void;
  saveProjectAsDraft: () => void;
  autoSave: () => void;
  importArxml: (file: File) => Promise<void>;
  
  // SWC management
  createSWC: (swc: Omit<SWC, 'id' | 'uuid' | 'ports' | 'runnables'>) => void;
  updateSWC: (id: string, updates: Partial<SWC>) => void;
  deleteSWC: (id: string) => void;
  
  // Port management
  createPort: (port: Omit<Port, 'id'>) => void;
  updatePort: (id: string, updates: Partial<Port>) => void;
  deletePort: (id: string) => void;
  
  // Interface management
  createInterface: (interface_: Omit<Interface, 'id'>) => void;
  updateInterface: (id: string, updates: Partial<Interface>) => void;
  deleteInterface: (id: string) => void;
  
  // Data type management
  createDataType: (dataType: Omit<DataType, 'id'>) => void;
  updateDataType: (id: string, updates: Partial<DataType>) => void;
  deleteDataType: (id: string) => void;
  
  // Data element management
  createDataElement: (dataElement: Omit<DataElement, 'id'>) => void;
  updateDataElement: (id: string, updates: Partial<DataElement>) => void;
  deleteDataElement: (id: string) => void;
  
  // Runnable management
  createRunnable: (runnable: Omit<Runnable, 'id' | 'accessPoints'>) => void;
  updateRunnable: (id: string, updates: Partial<Runnable>) => void;
  deleteRunnable: (id: string) => void;
  
  // Access point management
  addAccessPoint: (runnableId: string, accessPoint: Omit<AccessPoint, 'id'>) => void;
  updateAccessPoint: (accessPointId: string, updates: Partial<AccessPoint>) => void;
  removeAccessPoint: (runnableId: string, accessPointId: string) => void;
  
  // SWC Connection management
  createConnection: (connection: Omit<SWCConnection, 'id'>) => void;
  updateConnection: (id: string, updates: Partial<SWCConnection>) => void;
  deleteConnection: (id: string) => void;
  
  // Validation and cleanup
  validateProject: () => { isValid: boolean; errors: string[] };
  cleanupDependencies: (deletedType: 'port' | 'interface' | 'dataType' | 'dataElement', deletedId: string) => void;
  
  // ARXML export
  exportArxml: () => void;
  exportMultipleArxml: () => void;
  downloadArxmlFiles: (files: { name: string; content: string }[]) => void;
  generateConsolidatedArxml: (project: Project) => string;
  generateSWCArxml: (swc: SWC, project: Project) => string;
  generateDataTypesArxml: (project: Project) => string;
  generatePortInterfacesArxml: (project: Project) => string;
  generateTopologyArxml: (project: Project) => string;
  
  // Auto-generate names
  generateAccessPointName: (swcName: string, runnableName: string, accessType: 'iRead' | 'iWrite' | 'iCall') => string;
}

const generateUUID = () => crypto.randomUUID();

// Auto-save functionality
let autoSaveInterval: NodeJS.Timeout | null = null;

export const useAutosarStore = create<AutosarStore>()(
  persist(
    (set, get) => ({
      currentProject: null,
      projects: [],
      
      createProject: (projectData: Omit<Project, 'id' | 'createdAt' | 'lastModified' | 'isDraft' | 'autoSaveEnabled'>) => {
        const newProject: Project = {
          ...projectData,
          id: generateUUID(),
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          isDraft: false,
          autoSaveEnabled: true,
        };
        set((state) => ({
          projects: [...state.projects, newProject],
          currentProject: newProject,
        }));
        
        // Start auto-save
        if (autoSaveInterval) clearInterval(autoSaveInterval);
        autoSaveInterval = setInterval(() => {
          get().autoSave();
        }, 60000); // Auto-save every 60 seconds
      },
      
      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, lastModified: new Date().toISOString() } : p
          ),
          currentProject: state.currentProject?.id === id 
            ? { ...state.currentProject, ...updates, lastModified: new Date().toISOString() }
            : state.currentProject,
        }));
      },
      
      deleteProject: (id) => {
        set((state) => {
          const newProjects = state.projects.filter((p) => p.id !== id);
          const newCurrentProject = state.currentProject?.id === id ? null : state.currentProject;
          
          // Clear auto-save if deleting current project
          if (state.currentProject?.id === id && autoSaveInterval) {
            clearInterval(autoSaveInterval);
            autoSaveInterval = null;
          }
          
          return {
            projects: newProjects,
            currentProject: newCurrentProject,
          };
        });
      },
      
      loadProject: (id) => {
        const project = get().projects.find((p) => p.id === id);
        if (project) {
          set({ currentProject: project });
          
          // Start auto-save for loaded project
          if (autoSaveInterval) clearInterval(autoSaveInterval);
          if (project.autoSaveEnabled) {
            autoSaveInterval = setInterval(() => {
              get().autoSave();
            }, 60000);
          }
        }
      },
      
      saveProjectAsDraft: () => {
        const currentProject = get().currentProject;
        if (currentProject) {
          get().updateProject(currentProject.id, { 
            isDraft: true, 
            lastModified: new Date().toISOString() 
          });
        }
      },
      
      autoSave: () => {
        const currentProject = get().currentProject;
        if (currentProject && currentProject.autoSaveEnabled) {
          get().updateProject(currentProject.id, { 
            lastModified: new Date().toISOString() 
          });
        }
      },
      
      importArxml: async (file: File) => {
        console.log('Importing ARXML file:', file.name);
        // TODO: Implement ARXML parsing
      },
      
      createSWC: (swcData) => {
        const swc: SWC = {
          ...swcData,
          id: generateUUID(),
          uuid: generateUUID(),
          ports: [],
          runnables: [],
        };
        
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: [...state.currentProject.swcs, swc],
            lastModified: new Date().toISOString(),
          } : null,
        }));
      },
      
      updateSWC: (id, updates) => {
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.map((swc) =>
              swc.id === id ? { ...swc, ...updates } : swc
            ),
            lastModified: new Date().toISOString(),
          } : null,
        }));
      },
      
      deleteSWC: (id) => {
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.filter((swc) => swc.id !== id),
            lastModified: new Date().toISOString(),
          } : null,
        }));
      },
      
      createPort: (portData) => {
        const port: Port = { ...portData, id: generateUUID() };
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.map((swc) =>
              swc.id === port.swcId ? { ...swc, ports: [...swc.ports, port] } : swc
            ),
            lastModified: new Date().toISOString(),
          } : null,
        }));
      },
      
      updatePort: (id, updates) => {
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.map((swc) => ({
              ...swc,
              ports: swc.ports.map((port) =>
                port.id === id ? { ...port, ...updates } : port
              ),
            })),
            lastModified: new Date().toISOString(),
          } : null,
        }));
      },
      
      deletePort: (id) => {
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.map((swc) => ({
              ...swc,
              ports: swc.ports.filter((port) => port.id !== id),
              runnables: swc.runnables.map((runnable) => ({
                ...runnable,
                accessPoints: runnable.accessPoints.filter((ap) => {
                  // Remove access points referencing the deleted port
                  return ap.portRef !== id;
                }),
              })),
            })),
            connections: state.currentProject.connections.filter((conn) => 
              conn.sourcePortId !== id && conn.targetPortId !== id
            ),
            lastModified: new Date().toISOString(),
          } : null,
        }));
      },
      
      createInterface: (interfaceData) => {
        const interface_: Interface = { 
          ...interfaceData, 
          id: generateUUID(),
          dataElements: interfaceData.dataElements || []
        };
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            interfaces: [...state.currentProject.interfaces, interface_],
            lastModified: new Date().toISOString(),
          } : null,
        }));
      },
      
      updateInterface: (id, updates) => {
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            interfaces: state.currentProject.interfaces.map((int) =>
              int.id === id ? { ...int, ...updates } : int
            ),
            lastModified: new Date().toISOString(),
          } : null,
        }));
      },
      
      deleteInterface: (id) => {
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            interfaces: state.currentProject.interfaces.filter((int) => int.id !== id),
            swcs: state.currentProject.swcs.map((swc) => ({
              ...swc,
              ports: swc.ports.filter((port) => port.interfaceRef !== id),
            })),
            lastModified: new Date().toISOString(),
          } : null,
        }));
        
        get().cleanupDependencies('interface', id);
      },
      
      createDataType: (dataTypeData) => {
        const dataType: DataType = { 
          ...dataTypeData, 
          id: generateUUID(),
          applicationDataType: {
            category: dataTypeData.category === 'primitive' ? 'PRIMITIVE' : 
                     dataTypeData.category === 'array' ? 'ARRAY' : 'RECORD',
            swDataDefProps: generateUUID(),
          },
          implementationDataType: {
            category: dataTypeData.category === 'primitive' ? 'PRIMITIVE' : 
                     dataTypeData.category === 'array' ? 'ARRAY' : 'RECORD',
            baseTypeEncoding: dataTypeData.baseType === 'uint8' ? 'NONE' : 'IEEE754',
            size: dataTypeData.baseType === 'uint8' ? 8 : 
                  dataTypeData.baseType === 'uint16' ? 16 :
                  dataTypeData.baseType === 'uint32' ? 32 : 64,
          }
        };
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            dataTypes: [...state.currentProject.dataTypes, dataType],
            lastModified: new Date().toISOString(),
          } : null,
        }));
      },
      
      updateDataType: (id, updates) => {
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            dataTypes: state.currentProject.dataTypes.map((dt) =>
              dt.id === id ? { ...dt, ...updates } : dt
            ),
            lastModified: new Date().toISOString(),
          } : null,
        }));
      },
      
      deleteDataType: (id) => {
        const state = get();
        const dataType = state.currentProject?.dataTypes.find(dt => dt.id === id);
        
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            dataTypes: state.currentProject.dataTypes.filter((dt) => dt.id !== id),
            dataElements: state.currentProject.dataElements.filter((de) => 
              de.applicationDataTypeRef !== dataType?.name
            ),
            lastModified: new Date().toISOString(),
          } : null,
        }));
        
        get().cleanupDependencies('dataType', id);
      },
      
      createDataElement: (dataElementData) => {
        const dataElement: DataElement = { ...dataElementData, id: generateUUID() };
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            dataElements: [...state.currentProject.dataElements, dataElement],
            lastModified: new Date().toISOString(),
          } : null,
        }));
      },
      
      updateDataElement: (id, updates) => {
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            dataElements: state.currentProject.dataElements.map((de) =>
              de.id === id ? { ...de, ...updates } : de
            ),
            lastModified: new Date().toISOString(),
          } : null,
        }));
      },
      
      deleteDataElement: (id) => {
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            dataElements: state.currentProject.dataElements.filter((de) => de.id !== id),
            lastModified: new Date().toISOString(),
          } : null,
        }));
      },
      
      createRunnable: (runnableData) => {
        const runnable: Runnable = { 
          ...runnableData, 
          id: generateUUID(),
          accessPoints: [],
        };
        
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.map((swc) =>
              swc.id === runnable.swcId 
                ? { ...swc, runnables: [...swc.runnables, runnable] }
                : swc
            ),
            lastModified: new Date().toISOString(),
          } : null,
        }));
      },
      
      updateRunnable: (id, updates) => {
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.map((swc) => ({
              ...swc,
              runnables: swc.runnables.map((runnable) =>
                runnable.id === id ? { ...runnable, ...updates } : runnable
              ),
            })),
            lastModified: new Date().toISOString(),
          } : null,
        }));
      },
      
      deleteRunnable: (id) => {
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.map((swc) => ({
              ...swc,
              runnables: swc.runnables.filter((runnable) => runnable.id !== id),
            })),
            lastModified: new Date().toISOString(),
          } : null,
        }));
      },
      
      addAccessPoint: (runnableId: string, accessPointData: Omit<AccessPoint, 'id'>) => {
        const accessPoint: AccessPoint = { ...accessPointData, id: generateUUID() };
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.map((swc) => ({
              ...swc,
              runnables: swc.runnables.map((runnable) =>
                runnable.id === runnableId
                  ? { ...runnable, accessPoints: [...runnable.accessPoints, accessPoint] }
                  : runnable
              ),
            })),
            lastModified: new Date().toISOString(),
          } : null,
        }));
      },
      
      updateAccessPoint: (accessPointId, updates) => {
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.map((swc) => ({
              ...swc,
              runnables: swc.runnables.map((runnable) => ({
                ...runnable,
                accessPoints: runnable.accessPoints.map((ap) =>
                  ap.id === accessPointId ? { ...ap, ...updates } : ap
                ),
              })),
            })),
            lastModified: new Date().toISOString(),
          } : null,
        }));
      },
      
      removeAccessPoint: (runnableId: string, accessPointId: string) => {
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.map((swc) => ({
              ...swc,
              runnables: swc.runnables.map((runnable) => ({
                ...runnable,
                accessPoints: runnable.accessPoints.filter((ap) => ap.id !== accessPointId),
              })),
            })),
            lastModified: new Date().toISOString(),
          } : null,
        }));
      },
      
      createConnection: (connectionData) => {
        const connection: SWCConnection = { ...connectionData, id: generateUUID() };
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            connections: [...state.currentProject.connections, connection],
            lastModified: new Date().toISOString(),
          } : null,
        }));
      },
      
      updateConnection: (id, updates) => {
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            connections: state.currentProject.connections.map((conn) =>
              conn.id === id ? { ...conn, ...updates } : conn
            ),
            lastModified: new Date().toISOString(),
          } : null,
        }));
      },
      
      deleteConnection: (id) => {
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            connections: state.currentProject.connections.filter((conn) => conn.id !== id),
            lastModified: new Date().toISOString(),
          } : null,
        }));
      },
      
      validateProject: () => {
        const project = get().currentProject;
        if (!project) {
          return { isValid: false, errors: ['No project loaded'] };
        }
        
        const errors: string[] = [];
        
        project.swcs.forEach((swc) => {
          if (!swc.name) errors.push(`SWC missing name: ${swc.id}`);
          if (!swc.category) errors.push(`SWC missing category: ${swc.name}`);
          
          swc.ports.forEach((port) => {
            const interfaceExists = project.interfaces.some(int => int.id === port.interfaceRef);
            if (!interfaceExists) {
              errors.push(`Port ${port.name} references non-existent interface: ${port.interfaceRef}`);
            }
          });
          
          swc.runnables.forEach((runnable) => {
            runnable.accessPoints.forEach((ap) => {
              const swcExists = project.swcs.some(s => s.id === ap.swcId);
              if (!swcExists) {
                errors.push(`Access point ${ap.name} references non-existent SWC: ${ap.swcId}`);
              }
              
              const runnableExists = project.swcs
                .flatMap(s => s.runnables)
                .some(r => r.id === ap.runnableId);
              if (!runnableExists) {
                errors.push(`Access point ${ap.name} references non-existent runnable: ${ap.runnableId}`);
              }
            });
          });
        });
        
        project.dataElements.forEach((de) => {
          const dataTypeExists = project.dataTypes.some(dt => dt.name === de.applicationDataTypeRef);
          if (!dataTypeExists) {
            errors.push(`Data element ${de.name} references non-existent data type: ${de.applicationDataTypeRef}`);
          }
        });
        
        project.connections.forEach((conn) => {
          const sourceSwcExists = project.swcs.some(swc => swc.id === conn.sourceSwcId);
          const targetSwcExists = project.swcs.some(swc => swc.id === conn.targetSwcId);
          
          if (!sourceSwcExists) {
            errors.push(`Connection ${conn.name} references non-existent source SWC: ${conn.sourceSwcId}`);
          }
          if (!targetSwcExists) {
            errors.push(`Connection ${conn.name} references non-existent target SWC: ${conn.targetSwcId}`);
          }
          
          const sourcePortExists = project.swcs
            .flatMap(swc => swc.ports)
            .some(port => port.id === conn.sourcePortId);
          const targetPortExists = project.swcs
            .flatMap(swc => swc.ports)
            .some(port => port.id === conn.targetPortId);
            
          if (!sourcePortExists) {
            errors.push(`Connection ${conn.name} references non-existent source port: ${conn.sourcePortId}`);
          }
          if (!targetPortExists) {
            errors.push(`Connection ${conn.name} references non-existent target port: ${conn.targetPortId}`);
          }
        });
        
        return {
          isValid: errors.length === 0,
          errors
        };
      },
      
      cleanupDependencies: (deletedType, deletedId) => {
        const validation = get().validateProject();
        if (!validation.isValid) {
          console.warn('Project validation failed after deletion:', validation.errors);
        }
      },
      
      generateAccessPointName: (swcName, runnableName, accessType) => {
        return `${accessType}_${swcName}_${runnableName}`;
      },
      
      exportArxml: () => {
        const project = get().currentProject;
        if (!project) return;
        
        const validation = get().validateProject();
        if (!validation.isValid) {
          console.error('Cannot export invalid project:', validation.errors);
          return;
        }
        
        console.log('Exporting single ARXML for project:', project.name);
        console.log('Project validation passed');
        
        const arxmlContent = get().generateConsolidatedArxml(project);
        get().downloadArxmlFiles([
          { name: `${project.name}_consolidated.arxml`, content: arxmlContent }
        ]);
      },
      
      exportMultipleArxml: () => {
        const project = get().currentProject;
        if (!project) return;
        
        const validation = get().validateProject();
        if (!validation.isValid) {
          console.error('Cannot export invalid project:', validation.errors);
          return;
        }
        
        console.log('Exporting multiple ARXML files for project:', project.name);
        
        const files: { name: string; content: string }[] = [];
        
        // Generate individual SWC files
        project.swcs.forEach((swc) => {
          const content = get().generateSWCArxml(swc, project);
          files.push({ name: `SWC_${swc.name}.arxml`, content });
        });
        
        // Generate shared files
        files.push({ name: 'PortInterfaces.arxml', content: get().generatePortInterfacesArxml(project) });
        files.push({ name: 'DataTypes.arxml', content: get().generateDataTypesArxml(project) });
        files.push({ name: 'Constants.arxml', content: get().generateConstantsArxml(project) });
        files.push({ name: 'Packages.arxml', content: get().generatePackagesArxml(project) });
        files.push({ name: 'Connections.arxml', content: get().generateConnectionsArxml(project) });
        
        get().downloadArxmlFiles(files);
      },
      
      downloadArxmlFiles: (files) => {
        files.forEach(({ name, content }) => {
          const blob = new Blob([content], { type: 'application/xml' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        });
      },
      
      generateConsolidatedArxml: (project: Project) => {
        return `<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_${project.autosarVersion.replace('.', '')}.xsd">
  <AR-PACKAGES>
    <AR-PACKAGE UUID="${generateUUID()}">
      <SHORT-NAME>${project.name}</SHORT-NAME>
      <AR-PACKAGES>
        <!-- SWC Components Package -->
        <AR-PACKAGE UUID="${generateUUID()}">
          <SHORT-NAME>ComponentTypes</SHORT-NAME>
          <ELEMENTS>
            ${project.swcs.map(swc => `
            <APPLICATION-SW-COMPONENT-TYPE UUID="${swc.uuid}">
              <SHORT-NAME>${swc.name}</SHORT-NAME>
              <DESC>
                <L-2 L="EN">${swc.description}</L-2>
              </DESC>
              <CATEGORY>APPLICATION</CATEGORY>
              <PORTS>
                ${swc.ports.map(port => {
                  const interface_ = project.interfaces.find(i => i.id === port.interfaceRef);
                  return `
                <${port.direction === 'provided' ? 'P' : 'R'}-PORT-PROTOTYPE UUID="${generateUUID()}">
                  <SHORT-NAME>${port.name}</SHORT-NAME>
                  <PROVIDED-COM-SPECS>
                    <NONQUEUED-SENDER-COM-SPEC>
                      <DATA-ELEMENT-REF DEST="VARIABLE-DATA-PROTOTYPE">/PortInterfaces/${interface_?.name}/${interface_?.dataElements?.[0]?.name || 'DataElement'}</DATA-ELEMENT-REF>
                    </NONQUEUED-SENDER-COM-SPEC>
                  </PROVIDED-COM-SPECS>
                  <PROVIDED-INTERFACE-TREF DEST="SENDER-RECEIVER-INTERFACE">/PortInterfaces/${interface_?.name}</PROVIDED-INTERFACE-TREF>
                </${port.direction === 'provided' ? 'P' : 'R'}-PORT-PROTOTYPE>`;
                }).join('')}
              </PORTS>
              <INTERNAL-BEHAVIORS>
                <SWC-INTERNAL-BEHAVIOR UUID="${generateUUID()}">
                  <SHORT-NAME>${swc.name}_InternalBehavior</SHORT-NAME>
                  <RUNNABLES>
                    ${swc.runnables.map(runnable => `
                    <RUNNABLE-ENTITY UUID="${generateUUID()}">
                      <SHORT-NAME>${runnable.name}</SHORT-NAME>
                      <CAN-BE-INVOKED-CONCURRENTLY>${runnable.canBeInvokedConcurrently}</CAN-BE-INVOKED-CONCURRENTLY>
                      <DATA-READ-ACCESSS>
                        ${runnable.accessPoints.filter(ap => ap.type === 'iRead').map(ap => `
                        <VARIABLE-ACCESS UUID="${generateUUID()}">
                          <SHORT-NAME>${ap.name}</SHORT-NAME>
                          <ACCESSED-VARIABLE>
                            <AUTOSAR-VARIABLE-IREF>
                              <PORT-PROTOTYPE-REF DEST="R-PORT-PROTOTYPE">/ComponentTypes/${swc.name}/${ap.name}_Port</PORT-PROTOTYPE-REF>
                              <TARGET-DATA-PROTOTYPE-REF DEST="VARIABLE-DATA-PROTOTYPE">/PortInterfaces/Interface/DataElement</TARGET-DATA-PROTOTYPE-REF>
                            </AUTOSAR-VARIABLE-IREF>
                          </ACCESSED-VARIABLE>
                        </VARIABLE-ACCESS>`).join('')}
                      </DATA-READ-ACCESSS>
                      <DATA-WRITE-ACCESSS>
                        ${runnable.accessPoints.filter(ap => ap.type === 'iWrite').map(ap => `
                        <VARIABLE-ACCESS UUID="${generateUUID()}">
                          <SHORT-NAME>${ap.name}</SHORT-NAME>
                          <ACCESSED-VARIABLE>
                            <AUTOSAR-VARIABLE-IREF>
                              <PORT-PROTOTYPE-REF DEST="P-PORT-PROTOTYPE">/ComponentTypes/${swc.name}/${ap.name}_Port</PORT-PROTOTYPE-REF>
                              <TARGET-DATA-PROTOTYPE-REF DEST="VARIABLE-DATA-PROTOTYPE">/PortInterfaces/Interface/DataElement</TARGET-DATA-PROTOTYPE-REF>
                            </AUTOSAR-VARIABLE-IREF>
                          </ACCESSED-VARIABLE>
                        </VARIABLE-ACCESS>`).join('')}
                      </DATA-WRITE-ACCESSS>
                    </RUNNABLE-ENTITY>`).join('')}
                  </RUNNABLES>
                </SWC-INTERNAL-BEHAVIOR>
              </INTERNAL-BEHAVIORS>
            </APPLICATION-SW-COMPONENT-TYPE>`).join('')}
          </ELEMENTS>
        </AR-PACKAGE>
        <!-- Port Interfaces Package -->
        <AR-PACKAGE UUID="${generateUUID()}">
          <SHORT-NAME>PortInterfaces</SHORT-NAME>
          <ELEMENTS>
            ${project.interfaces.map(interface_ => `
            <SENDER-RECEIVER-INTERFACE UUID="${generateUUID()}">
              <SHORT-NAME>${interface_.name}</SHORT-NAME>
              <IS-SERVICE>false</IS-SERVICE>
              <DATA-ELEMENTS>
                ${interface_.dataElements?.map(de => `
                <VARIABLE-DATA-PROTOTYPE UUID="${generateUUID()}">
                  <SHORT-NAME>${de.name}</SHORT-NAME>
                  <TYPE-TREF DEST="APPLICATION-PRIMITIVE-DATA-TYPE">/DataTypes/${de.applicationDataTypeRef}</TYPE-TREF>
                </VARIABLE-DATA-PROTOTYPE>`).join('') || ''}
              </DATA-ELEMENTS>
            </SENDER-RECEIVER-INTERFACE>`).join('')}
          </ELEMENTS>
        </AR-PACKAGE>
        <!-- Data Types Package -->
        <AR-PACKAGE UUID="${generateUUID()}">
          <SHORT-NAME>DataTypes</SHORT-NAME>
          <AR-PACKAGES>
            <AR-PACKAGE UUID="${generateUUID()}">
              <SHORT-NAME>ApplicationDataTypes</SHORT-NAME>
              <ELEMENTS>
                ${project.dataTypes.map(dt => `
                <APPLICATION-PRIMITIVE-DATA-TYPE UUID="${generateUUID()}">
                  <SHORT-NAME>${dt.name}</SHORT-NAME>
                  <CATEGORY>PRIMITIVE</CATEGORY>
                  <SW-DATA-DEF-PROPS>
                    <SW-DATA-DEF-PROPS-VARIANTS>
                      <SW-DATA-DEF-PROPS-CONDITIONAL>
                        <BASE-TYPE-REF DEST="SW-BASE-TYPE">/DataTypes/BaseTypes/${dt.baseType || 'uint32'}</BASE-TYPE-REF>
                      </SW-DATA-DEF-PROPS-CONDITIONAL>
                    </SW-DATA-DEF-PROPS-VARIANTS>
                  </SW-DATA-DEF-PROPS>
                </APPLICATION-PRIMITIVE-DATA-TYPE>`).join('')}
              </ELEMENTS>
            </AR-PACKAGE>
          </AR-PACKAGES>
        </AR-PACKAGE>
      </AR-PACKAGES>
    </AR-PACKAGE>
  </AR-PACKAGES>
</AUTOSAR>`;
      },
      
      generateSWCArxml: (swc: SWC, project: Project) => {
        return `<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_${project.autosarVersion.replace('.', '')}.xsd">
  <AR-PACKAGES>
    <AR-PACKAGE UUID="${generateUUID()}">
      <SHORT-NAME>ComponentTypes</SHORT-NAME>
      <ELEMENTS>
        <APPLICATION-SW-COMPONENT-TYPE UUID="${swc.uuid}">
          <SHORT-NAME>${swc.name}</SHORT-NAME>
          <DESC>
            <L-2 L="EN">${swc.description}</L-2>
          </DESC>
          <CATEGORY>APPLICATION</CATEGORY>
          <PORTS>
            ${swc.ports.map(port => {
              const interface_ = project.interfaces.find(i => i.id === port.interfaceRef);
              return `
            <${port.direction === 'provided' ? 'P' : 'R'}-PORT-PROTOTYPE UUID="${generateUUID()}">
              <SHORT-NAME>${port.name}</SHORT-NAME>
              <PROVIDED-INTERFACE-TREF DEST="SENDER-RECEIVER-INTERFACE">/PortInterfaces/${interface_?.name}</PROVIDED-INTERFACE-TREF>
            </${port.direction === 'provided' ? 'P' : 'R'}-PORT-PROTOTYPE>`;
            }).join('')}
          </PORTS>
          <INTERNAL-BEHAVIORS>
            <SWC-INTERNAL-BEHAVIOR UUID="${generateUUID()}">
              <SHORT-NAME>${swc.name}_InternalBehavior</SHORT-NAME>
              <RUNNABLES>
                ${swc.runnables.map(runnable => `
                <RUNNABLE-ENTITY UUID="${generateUUID()}">
                  <SHORT-NAME>${runnable.name}</SHORT-NAME>
                  <CAN-BE-INVOKED-CONCURRENTLY>${runnable.canBeInvokedConcurrently}</CAN-BE-INVOKED-CONCURRENTLY>
                </RUNNABLE-ENTITY>`).join('')}
              </RUNNABLES>
            </SWC-INTERNAL-BEHAVIOR>
          </INTERNAL-BEHAVIORS>
        </APPLICATION-SW-COMPONENT-TYPE>
      </ELEMENTS>
    </AR-PACKAGE>
  </AR-PACKAGES>
</AUTOSAR>`;
      },
      
      generateDataTypesArxml: (project: Project) => {
        return `<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_${project.autosarVersion.replace('.', '')}.xsd">
  <AR-PACKAGES>
    <AR-PACKAGE UUID="${generateUUID()}">
      <SHORT-NAME>DataTypes</SHORT-NAME>
      <AR-PACKAGES>
        <AR-PACKAGE UUID="${generateUUID()}">
          <SHORT-NAME>ApplicationDataTypes</SHORT-NAME>
          <ELEMENTS>
            ${project.dataTypes.map(dt => `
            <APPLICATION-PRIMITIVE-DATA-TYPE UUID="${generateUUID()}">
              <SHORT-NAME>${dt.name}</SHORT-NAME>
              <CATEGORY>PRIMITIVE</CATEGORY>
              <SW-DATA-DEF-PROPS>
                <SW-DATA-DEF-PROPS-VARIANTS>
                  <SW-DATA-DEF-PROPS-CONDITIONAL>
                    <BASE-TYPE-REF DEST="SW-BASE-TYPE">/DataTypes/BaseTypes/${dt.baseType || 'uint32'}</BASE-TYPE-REF>
                  </SW-DATA-DEF-PROPS-CONDITIONAL>
                </SW-DATA-DEF-PROPS-VARIANTS>
              </SW-DATA-DEF-PROPS>
            </APPLICATION-PRIMITIVE-DATA-TYPE>`).join('')}
          </ELEMENTS>
        </AR-PACKAGE>
      </AR-PACKAGES>
    </AR-PACKAGE>
  </AR-PACKAGES>
</AUTOSAR>`;
      },
      
      generatePortInterfacesArxml: (project: Project) => {
        return `<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_${project.autosarVersion.replace('.', '')}.xsd">
  <AR-PACKAGES>
    <AR-PACKAGE UUID="${generateUUID()}">
      <SHORT-NAME>PortInterfaces</SHORT-NAME>
      <ELEMENTS>
        ${project.interfaces.map(interface_ => `
        <SENDER-RECEIVER-INTERFACE UUID="${generateUUID()}">
          <SHORT-NAME>${interface_.name}</SHORT-NAME>
          <IS-SERVICE>false</IS-SERVICE>
          <DATA-ELEMENTS>
            ${interface_.dataElements?.map(de => `
            <VARIABLE-DATA-PROTOTYPE UUID="${generateUUID()}">
              <SHORT-NAME>${de.name}</SHORT-NAME>
              <TYPE-TREF DEST="APPLICATION-PRIMITIVE-DATA-TYPE">/DataTypes/ApplicationDataTypes/${de.applicationDataTypeRef}</TYPE-TREF>
            </VARIABLE-DATA-PROTOTYPE>`).join('') || ''}
          </DATA-ELEMENTS>
        </SENDER-RECEIVER-INTERFACE>`).join('')}
      </ELEMENTS>
    </AR-PACKAGE>
  </AR-PACKAGES>
</AUTOSAR>`;
      },
      
      generateTopologyArxml: (project: Project) => {
        return `<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_${project.autosarVersion.replace('.', '')}.xsd">
  <AR-PACKAGES>
    <AR-PACKAGE UUID="${generateUUID()}">
      <SHORT-NAME>Topology</SHORT-NAME>
      <ELEMENTS>
        <!-- SWC connections and topology would be generated here -->
        ${project.connections.map(conn => `
        <ASSEMBLY-SW-CONNECTOR UUID="${generateUUID()}">
          <SHORT-NAME>${conn.name}</SHORT-NAME>
          <PROVIDER-IREF>
            <CONTEXT-COMPONENT-REF DEST="SW-COMPONENT-PROTOTYPE">/Compositions/System/${conn.sourceSwcId}</CONTEXT-COMPONENT-REF>
            <TARGET-P-PORT-REF DEST="P-PORT-PROTOTYPE">/ComponentTypes/SourceSWC/${conn.sourcePortId}</TARGET-P-PORT-REF>
          </PROVIDER-IREF>
          <REQUESTER-IREF>
            <CONTEXT-COMPONENT-REF DEST="SW-COMPONENT-PROTOTYPE">/Compositions/System/${conn.targetSwcId}</CONTEXT-COMPONENT-REF>
            <TARGET-R-PORT-REF DEST="R-PORT-PROTOTYPE">/ComponentTypes/TargetSWC/${conn.targetPortId}</TARGET-R-PORT-REF>
          </REQUESTER-IREF>
        </ASSEMBLY-SW-CONNECTOR>`).join('')}
      </ELEMENTS>
    </AR-PACKAGE>
  </AR-PACKAGES>
</AUTOSAR>`;
      },
      
      generateConstantsArxml: (project: Project) => {
        return `<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_${project.autosarVersion.replace('.', '')}.xsd">
  <AR-PACKAGES>
    <AR-PACKAGE UUID="${generateUUID()}">
      <SHORT-NAME>Constants</SHORT-NAME>
      <ELEMENTS>
        <!-- Project constants would be defined here -->
      </ELEMENTS>
    </AR-PACKAGE>
  </AR-PACKAGES>
</AUTOSAR>`;
      },
      
      generatePackagesArxml: (project: Project) => {
        return `<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_${project.autosarVersion.replace('.', '')}.xsd">
  <AR-PACKAGES>
    <AR-PACKAGE UUID="${generateUUID()}">
      <SHORT-NAME>${project.name}_Packages</SHORT-NAME>
      <DESC>
        <L-2 L="EN">Main package container for ${project.name}</L-2>
      </DESC>
    </AR-PACKAGE>
  </AR-PACKAGES>
</AUTOSAR>`;
      },
      
      generateConnectionsArxml: (project: Project) => {
        return `<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_${project.autosarVersion.replace('.', '')}.xsd">
  <AR-PACKAGES>
    <AR-PACKAGE UUID="${generateUUID()}">
      <SHORT-NAME>Connections</SHORT-NAME>
      <ELEMENTS>
        ${project.connections.map(conn => `
        <ASSEMBLY-SW-CONNECTOR UUID="${generateUUID()}">
          <SHORT-NAME>${conn.name}</SHORT-NAME>
          <PROVIDER-IREF>
            <CONTEXT-COMPONENT-REF DEST="SW-COMPONENT-PROTOTYPE">/System/${conn.sourceSwcId}</CONTEXT-COMPONENT-REF>
            <TARGET-P-PORT-REF DEST="P-PORT-PROTOTYPE">/ComponentTypes/${conn.sourceSwcId}/${conn.sourcePortId}</TARGET-P-PORT-REF>
          </PROVIDER-IREF>
          <REQUESTER-IREF>
            <CONTEXT-COMPONENT-REF DEST="SW-COMPONENT-PROTOTYPE">/System/${conn.targetSwcId}</CONTEXT-COMPONENT-REF>
            <TARGET-R-PORT-REF DEST="R-PORT-PROTOTYPE">/ComponentTypes/${conn.targetSwcId}/${conn.targetPortId}</TARGET-R-PORT-REF>
          </REQUESTER-IREF>
        </ASSEMBLY-SW-CONNECTOR>`).join('')}
      </ELEMENTS>
    </AR-PACKAGE>
  </AR-PACKAGES>
</AUTOSAR>`;
      },
    }),
    {
      name: 'autosar-storage',
    }
  )
);
