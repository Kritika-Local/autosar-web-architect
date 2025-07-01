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

export interface ECUComposition {
  id: string;
  name: string;
  description: string;
  swcInstances: SWCInstance[];
  connectors: ECUConnector[];
  ecuType: string;
  autosarVersion: string;
  uuid: string;
}

export interface SWCInstance {
  id: string;
  name: string;
  swcRef: string; // Reference to SWC ID
  instanceName: string;
  ecuCompositionId: string;
}

export interface ECUConnector {
  id: string;
  name: string;
  sourceInstanceId: string;
  sourcePortId: string;
  targetInstanceId: string;
  targetPortId: string;
  ecuCompositionId: string;
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
  ecuCompositions: ECUComposition[];
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
  saveProject: () => void;
  saveProjectAsDraft: () => void;
  autoSave: () => void;
  importArxml: (file: File) => Promise<void>;
  
  // SWC management
  createSWC: (swc: Omit<SWC, 'id' | 'uuid' | 'ports' | 'runnables' | 'autosarVersion'>) => void;
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
  deleteAccessPoint: (runnableId: string, accessPointId: string) => void;
  
  // SWC Connection management
  createConnection: (connection: Omit<SWCConnection, 'id'>) => void;
  updateConnection: (id: string, updates: Partial<SWCConnection>) => void;
  deleteConnection: (id: string) => void;
  
  // ECU Composition management
  createECUComposition: (composition: Omit<ECUComposition, 'id' | 'uuid' | 'swcInstances' | 'connectors'>) => void;
  updateECUComposition: (id: string, updates: Partial<ECUComposition>) => void;
  deleteECUComposition: (id: string) => void;
  
  // SWC Instance management
  addSWCInstance: (compositionId: string, instance: Omit<SWCInstance, 'id'>) => void;
  updateSWCInstance: (instanceId: string, updates: Partial<SWCInstance>) => void;
  removeSWCInstance: (compositionId: string, instanceId: string) => void;
  
  // ECU Connector management
  addECUConnector: (compositionId: string, connector: Omit<ECUConnector, 'id'>) => void;
  updateECUConnector: (connectorId: string, updates: Partial<ECUConnector>) => void;
  removeECUConnector: (compositionId: string, connectorId: string) => void;
  
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
  generateConstantsArxml: (project: Project) => string;
  generatePackagesArxml: (project: Project) => string;
  generateConnectionsArxml: (project: Project) => string;
  generateSystemExtractArxml: (project: Project) => string;
  generateECUCompositionArxml: (composition: ECUComposition, project: Project) => string;
  
  // Auto-generate names
  generateAccessPointName: (swcName: string, runnableName: string, accessType: 'iRead' | 'iWrite' | 'iCall') => string;
}

const generateUUID = () => crypto.randomUUID();

// Auto-save functionality
let autoSaveInterval: NodeJS.Timeout | null = null;

// Enhanced persistence helpers
const saveToLocalStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

const loadFromLocalStorage = (key: string) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
};

export const useAutosarStore = create<AutosarStore>()(
  persist(
    (set, get) => ({
      currentProject: null,
      projects: [],
      
      // Project management
      createProject: (projectData: Omit<Project, 'id' | 'createdAt' | 'lastModified' | 'isDraft' | 'autoSaveEnabled'>) => {
        const newProject: Project = {
          ...projectData,
          id: generateUUID(),
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          isDraft: false,
          autoSaveEnabled: true,
        };
        set((state) => {
          const newState = {
            projects: [...state.projects, newProject],
            currentProject: newProject,
          };
          // Enhanced persistence
          saveToLocalStorage('autosar-projects', newState.projects);
          saveToLocalStorage('autosar-current-project', newProject);
          return newState;
        });
        
        // Start auto-save
        if (autoSaveInterval) clearInterval(autoSaveInterval);
        autoSaveInterval = setInterval(() => {
          get().autoSave();
        }, 60000); // Auto-save every 60 seconds
      },
      
      updateProject: (id, updates) => {
        set((state) => {
          const updatedProjects = state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, lastModified: new Date().toISOString() } : p
          );
          const updatedCurrentProject = state.currentProject?.id === id 
            ? { ...state.currentProject, ...updates, lastModified: new Date().toISOString() }
            : state.currentProject;
          
          // Enhanced persistence
          saveToLocalStorage('autosar-projects', updatedProjects);
          if (updatedCurrentProject) {
            saveToLocalStorage('autosar-current-project', updatedCurrentProject);
          }
          
          return {
            projects: updatedProjects,
            currentProject: updatedCurrentProject,
          };
        });
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
      
      saveProject: () => {
        const currentProject = get().currentProject;
        if (currentProject) {
          const state = get();
          const updatedProjects = state.projects.map(p => 
            p.id === currentProject.id 
              ? { ...currentProject, lastModified: new Date().toISOString() }
              : p
          );
          
          set({ 
            projects: updatedProjects,
            currentProject: { ...currentProject, lastModified: new Date().toISOString() }
          });
          
          // Force save to localStorage
          saveToLocalStorage('autosar-projects', updatedProjects);
          saveToLocalStorage('autosar-current-project', { ...currentProject, lastModified: new Date().toISOString() });
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
        const currentProject = get().currentProject;
        if (!currentProject) return;
        
        const swc: SWC = {
          ...swcData,
          id: generateUUID(),
          uuid: generateUUID(),
          ports: [],
          runnables: [],
          autosarVersion: currentProject.autosarVersion, // Use project's AUTOSAR version
        };
        
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: [...state.currentProject.swcs, swc],
            lastModified: new Date().toISOString(),
          } : null,
        }));
        
        // Auto-save after creating SWC
        setTimeout(() => get().autoSave(), 100);
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
        
        // Auto-save after updating SWC
        setTimeout(() => get().autoSave(), 100);
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
      
      deleteAccessPoint: (runnableId: string, accessPointId: string) => {
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
      
      createECUComposition: (compositionData) => {
        const composition: ECUComposition = {
          ...compositionData,
          id: generateUUID(),
          uuid: generateUUID(),
          swcInstances: [],
          connectors: [],
        };
        
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            ecuCompositions: [...state.currentProject.ecuCompositions, composition],
            lastModified: new Date().toISOString(),
          } : null,
        }));
        
        // Auto-save after creating ECU composition
        setTimeout(() => get().autoSave(), 100);
      },
      
      updateECUComposition: (id, updates) => {
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            ecuCompositions: state.currentProject.ecuCompositions.map((comp) =>
              comp.id === id ? { ...comp, ...updates } : comp
            ),
            lastModified: new Date().toISOString(),
          } : null,
        }));
        
        // Auto-save after updating ECU composition
        setTimeout(() => get().autoSave(), 100);
      },
      
      deleteECUComposition: (id) => {
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            ecuCompositions: state.currentProject.ecuCompositions.filter((comp) => comp.id !== id),
            lastModified: new Date().toISOString(),
          } : null,
        }));
        
        // Auto-save after deleting ECU composition
        setTimeout(() => get().autoSave(), 100);
      },
      
      addSWCInstance: (compositionId, instanceData) => {
        const instance: SWCInstance = { ...instanceData, id: generateUUID() };
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            ecuCompositions: state.currentProject.ecuCompositions.map((comp) =>
              comp.id === compositionId 
                ? { ...comp, swcInstances: [...comp.swcInstances, instance] }
                : comp
            ),
            lastModified: new Date().toISOString(),
          } : null,
        }));
        
        // Auto-save after adding SWC instance
        setTimeout(() => get().autoSave(), 100);
      },
      
      updateSWCInstance: (instanceId, updates) => {
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            ecuCompositions: state.currentProject.ecuCompositions.map((comp) => ({
              ...comp,
              swcInstances: comp.swcInstances.map((instance) =>
                instance.id === instanceId ? { ...instance, ...updates } : instance
              ),
            })),
            lastModified: new Date().toISOString(),
          } : null,
        }));
        
        // Auto-save after updating SWC instance
        setTimeout(() => get().autoSave(), 100);
      },
      
      removeSWCInstance: (compositionId, instanceId) => {
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            ecuCompositions: state.currentProject.ecuCompositions.map((comp) =>
              comp.id === compositionId 
                ? { 
                    ...comp, 
                    swcInstances: comp.swcInstances.filter((instance) => instance.id !== instanceId),
                    connectors: comp.connectors.filter((conn) => 
                      conn.sourceInstanceId !== instanceId && conn.targetInstanceId !== instanceId
                    )
                  }
                : comp
            ),
            lastModified: new Date().toISOString(),
          } : null,
        }));
        
        // Auto-save after removing SWC instance
        setTimeout(() => get().autoSave(), 100);
      },
      
      addECUConnector: (compositionId, connectorData) => {
        const connector: ECUConnector = { ...connectorData, id: generateUUID() };
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            ecuCompositions: state.currentProject.ecuCompositions.map((comp) =>
              comp.id === compositionId 
                ? { ...comp, connectors: [...comp.connectors, connector] }
                : comp
            ),
            lastModified: new Date().toISOString(),
          } : null,
        }));
        
        // Auto-save after adding ECU connector
        setTimeout(() => get().autoSave(), 100);
      },
      
      updateECUConnector: (connectorId, updates) => {
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            ecuCompositions: state.currentProject.ecuCompositions.map((comp) => ({
              ...comp,
              connectors: comp.connectors.map((connector) =>
                connector.id === connectorId ? { ...connector, ...updates } : connector
              ),
            })),
            lastModified: new Date().toISOString(),
          } : null,
        }));
        
        // Auto-save after updating ECU connector
        setTimeout(() => get().autoSave(), 100);
      },
      
      removeECUConnector: (compositionId, connectorId) => {
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            ecuCompositions: state.currentProject.ecuCompositions.map((comp) =>
              comp.id === compositionId 
                ? { ...comp, connectors: comp.connectors.filter((connector) => connector.id !== connectorId) }
                : comp
            ),
            lastModified: new Date().toISOString(),
          } : null,
        }));
        
        // Auto-save after removing ECU connector
        setTimeout(() => get().autoSave(), 100);
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
            const interface_ = project.interfaces.find(i => i.id === port.interfaceRef);
            if (!interface_) {
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
      
      generateAccessPointName: (swcName: string, runnableName: string, accessType: 'iRead' | 'iWrite' | 'iCall') => {
        return `${accessType}_${swcName}_${runnableName}`;
      },
    }),
    {
      name: 'autosar-storage',
      storage: {
        getItem: (name: string) => {
          try {
            const value = localStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          } catch (error) {
            console.error('Failed to parse stored data:', error);
            return null;
          }
        },
        setItem: (name: string, value: any) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.error('Failed to store data:', error);
          }
        },
        removeItem: (name: string) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);
