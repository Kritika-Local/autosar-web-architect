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
          ecuCompositions: [],
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
      
      // ECU Composition management
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
      },
      
      deleteECUComposition: (id) => {
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            ecuCompositions: state.currentProject.ecuCompositions.filter((comp) => comp.id !== id),
            lastModified: new Date().toISOString(),
          } : null,
        }));
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
        
        project.swcs.forEach((swc) => {
          const content = get().generateSWCArxml(swc, project);
          files.push({ name: `SWC_${swc.name}.arxml`, content });
        });
        
        project.ecuCompositions.forEach((composition) => {
          const content = get().generateECUCompositionArxml(composition, project);
          files.push({ name: `ECUComposition_${composition.name}.arxml`, content });
        });
        
        files.push({ name: 'PortInterfaces.arxml', content: get().generatePortInterfacesArxml(project) });
        files.push({ name: 'DataTypes.arxml', content: get().generateDataTypesArxml(project) });
        files.push({ name: 'Constants.arxml', content: get().generateConstantsArxml(project) });
        files.push({ name: 'Packages.arxml', content: get().generatePackagesArxml(project) });
        files.push({ name: 'Connections.arxml', content: get().generateConnectionsArxml(project) });
        files.push({ name: 'SystemExtract.arxml', content: get().generateSystemExtractArxml(project) });
        
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
        return `<?xml version="1.0" encoding="utf-8"?>
<!--This file was saved with a tool from Vector Informatik GmbH-->
<AUTOSAR xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_00048.xsd"
         xmlns="http://autosar.org/schema/r4.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
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
      
      generateECUCompositionArxml: (composition: ECUComposition, project: Project) => {
        return `<?xml version="1.0" encoding="utf-8"?>
<!--This file was saved with a tool from Vector Informatik GmbH-->
<AUTOSAR xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_00048.xsd"
         xmlns="http://autosar.org/schema/r4.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <AR-PACKAGES>
    <AR-PACKAGE UUID="${generateUUID()}">
      <SHORT-NAME>ECUCompositions</SHORT-NAME>
      <ELEMENTS>
        <COMPOSITION-SW-COMPONENT-TYPE UUID="${composition.uuid}">
          <SHORT-NAME>${composition.name}</SHORT-NAME>
          <DESC>
            <L-2 L="EN">${composition.description}</L-2>
          </DESC>
          <COMPONENTS>
            ${composition.swcInstances.map(instance => {
              const swc = project.swcs.find(s => s.id === instance.swcRef);
              return `
            <SW-COMPONENT-PROTOTYPE UUID="${generateUUID()}">
              <SHORT-NAME>${instance.instanceName}</SHORT-NAME>
              <TYPE-TREF DEST="APPLICATION-SW-COMPONENT-TYPE">/ComponentTypes/${swc?.name}</TYPE-TREF>
            </SW-COMPONENT-PROTOTYPE>`;
            }).join('')}
          </COMPONENTS>
          <CONNECTORS>
            ${composition.connectors.map(connector => {
              const sourceInstance = composition.swcInstances.find(i => i.id === connector.sourceInstanceId);
              const targetInstance = composition.swcInstances.find(i => i.id === connector.targetInstanceId);
              const sourceSwc = project.swcs.find(s => s.id === sourceInstance?.swcRef);
              const targetSwc = project.swcs.find(s => s.id === targetInstance?.swcRef);
              const sourcePort = sourceSwc?.ports.find(p => p.id === connector.sourcePortId);
              const targetPort = targetSwc?.ports.find(p => p.id === connector.targetPortId);
              
              return `
            <ASSEMBLY-SW-CONNECTOR UUID="${generateUUID()}">
              <SHORT-NAME>${connector.name}</SHORT-NAME>
              <PROVIDER-IREF>
                <CONTEXT-COMPONENT-REF DEST="SW-COMPONENT-PROTOTYPE">/${composition.name}/${sourceInstance?.instanceName}</CONTEXT-COMPONENT-REF>
                <TARGET-P-PORT-REF DEST="P-PORT-PROTOTYPE">/ComponentTypes/${sourceSwc?.name}/${sourcePort?.name}</TARGET-P-PORT-REF>
              </PROVIDER-IREF>
              <REQUESTER-IREF>
                <CONTEXT-COMPONENT-REF DEST="SW-COMPONENT-PROTOTYPE">/${composition.name}/${targetInstance?.instanceName}</CONTEXT-COMPONENT-REF>
                <TARGET-R-PORT-REF DEST="R-PORT-PROTOTYPE">/ComponentTypes/${targetSwc?.name}/${targetPort?.name}</TARGET-R-PORT-REF>
              </REQUESTER-IREF>
            </ASSEMBLY-SW-CONNECTOR>`;
            }).join('')}
          </CONNECTORS>
        </COMPOSITION-SW-COMPONENT-TYPE>
      </ELEMENTS>
    </AR-PACKAGE>
  </AR-PACKAGES>
</AUTOSAR>`;
      },
      
      generateSWCArxml: (swc: SWC, project: Project) => {
        return `<?xml version="1.0" encoding="utf-8"?>
<!--This file was saved with a tool from Vector Informatik GmbH-->
<AUTOSAR xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_00048.xsd"
         xmlns="http://autosar.org/schema/r4.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
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
        return `<?xml version="1.0" encoding="utf-8"?>
<!--This file was saved with a tool from Vector Informatik GmbH-->
<AUTOSAR xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_00048.xsd"
         xmlns="http://autosar.org/schema/r4.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
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
        return `<?xml version="1.0" encoding="utf-8"?>
<!--This file was saved with a tool from Vector Informatik GmbH-->
<AUTOSAR xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_00048.xsd"
         xmlns="http://autosar.org/schema/r4.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
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
        return `<?xml version="1.0" encoding="utf-8"?>
<!--This file was saved with a tool from Vector Informatik GmbH-->
<AUTOSAR xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_00048.xsd"
         xmlns="http://autosar.org/schema/r4.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <AR-PACKAGES>
    <AR-PACKAGE UUID="${generateUUID()}">
      <SHORT-NAME>Topology</SHORT-NAME>
      <ELEMENTS>
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
        return `<?xml version="1.0" encoding="utf-8"?>
<!--This file was saved with a tool from Vector Informatik GmbH-->
<AUTOSAR xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_00048.xsd"
         xmlns="http://autosar.org/schema/r4.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
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
        return `<?xml version="1.0" encoding="utf-8"?>
<!--This file was saved with a tool from Vector Informatik GmbH-->
<AUTOSAR xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_00048.xsd"
         xmlns="http://autosar.org/schema/r4.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
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
        return `<?xml version="1.0" encoding="utf-8"?>
<!--This file was saved with a tool from Vector Informatik GmbH-->
<AUTOSAR xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_00048.xsd"
         xmlns="http://autosar.org/schema/r4.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
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
      
      generateSystemExtractArxml: (project: Project) => {
        const currentDate = new Date().toISOString();
        const exportUser = 'autosar.designer@example.com';
        
        return `<?xml version="1.0" encoding="utf-8"?>
<!--This file was saved with a tool from Vector Informatik GmbH-->
<AUTOSAR xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_00048.xsd"
         xmlns="http://autosar.org/schema/r4.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <ADMIN-DATA>
    <SDGS>
      <SDG GID="ExportInfo">
        <SD GID="ExportedWithXDISVersion">21.3.4</SD>
        <SD GID="ExportedBy">${exportUser}</SD>
        <SD GID="ExportedOn">${currentDate}</SD>
        <SD GID="ProjectHash">${generateUUID()}</SD>
        <SD GID="SystemModelVersion">1.0.0</SD>
      </SDG>
      <SDG GID="DocumentRevision">
        <SD GID="RevisionLabel">1.0</SD>
        <SD GID="State">Released</SD>
      </SDG>
    </SDGS>
  </ADMIN-DATA>
  <AR-PACKAGES>
    <AR-PACKAGE UUID="${generateUUID()}">
      <SHORT-NAME>SystemExtract</SHORT-NAME>
      <ELEMENTS>
        <SYSTEM UUID="${generateUUID()}">
          <SHORT-NAME>${project.name}_System</SHORT-NAME>
          <DESC>
            <L-2 L="EN">Complete system model for ${project.name} - Generated by AUTOSAR Designer</L-2>
          </DESC>
          <CATEGORY>SYSTEM_EXTRACT</CATEGORY>
          <SW-COMPOSITIONS>
            <COMPOSITION-SW-COMPONENT-TYPE UUID="${generateUUID()}">
              <SHORT-NAME>${project.name}_Composition</SHORT-NAME>
              <DESC>
                <L-2 L="EN">System composition containing all application components</L-2>
              </DESC>
              <COMPONENTS>
                ${project.swcs.map(swc => `
                <SW-COMPONENT-PROTOTYPE UUID="${generateUUID()}">
                  <SHORT-NAME>${swc.name}_Instance</SHORT-NAME>
                  <DESC>
                    <L-2 L="EN">Instance of ${swc.name} application component</L-2>
                  </DESC>
                  <TYPE-TREF DEST="APPLICATION-SW-COMPONENT-TYPE">/ComponentTypes/${swc.name}</TYPE-TREF>
                </SW-COMPONENT-PROTOTYPE>`).join('')}
                ${project.ecuCompositions.flatMap(comp => 
                  comp.swcInstances.map(instance => {
                    const swc = project.swcs.find(s => s.id === instance.swcRef);
                    return `
                <SW-COMPONENT-PROTOTYPE UUID="${generateUUID()}">
                  <SHORT-NAME>${instance.instanceName}</SHORT-NAME>
                  <DESC>
                    <L-2 L="EN">ECU composition instance of ${swc?.name}</L-2>
                  </DESC>
                  <TYPE-TREF DEST="APPLICATION-SW-COMPONENT-TYPE">/ComponentTypes/${swc?.name}</TYPE-TREF>
                </SW-COMPONENT-PROTOTYPE>`;
                  })
                ).join('')}
              </COMPONENTS>
              <CONNECTORS>
                ${project.connections.map(conn => {
                  const sourceSwc = project.swcs.find(s => s.id === conn.sourceSwcId);
                  const targetSwc = project.swcs.find(s => s.id === conn.targetSwcId);
                  const sourcePort = sourceSwc?.ports.find(p => p.id === conn.sourcePortId);
                  const targetPort = targetSwc?.ports.find(p => p.id === conn.targetPortId);
                  
                  return `
                <ASSEMBLY-SW-CONNECTOR UUID="${generateUUID()}">
                  <SHORT-NAME>${conn.name}</SHORT-NAME>
                  <DESC>
                    <L-2 L="EN">Connection between ${sourceSwc?.name} and ${targetSwc?.name}</L-2>
                  </DESC>
                  <PROVIDER-IREF>
                    <CONTEXT-COMPONENT-REF DEST="SW-COMPONENT-PROTOTYPE">/${project.name}_Composition/${sourceSwc?.name}_Instance</CONTEXT-COMPONENT-REF>
                    <TARGET-P-PORT-REF DEST="P-PORT-PROTOTYPE">/ComponentTypes/${sourceSwc?.name}/${sourcePort?.name}</TARGET-P-PORT-REF>
                  </PROVIDER-IREF>
                  <REQUESTER-IREF>
                    <CONTEXT-COMPONENT-REF DEST="SW-COMPONENT-PROTOTYPE">/${project.name}_Composition/${targetSwc?.name}_Instance</CONTEXT-COMPONENT-REF>
                    <TARGET-R-PORT-REF DEST="R-PORT-PROTOTYPE">/ComponentTypes/${targetSwc?.name}/${targetPort?.name}</TARGET-R-PORT-REF>
                  </REQUESTER-IREF>
                </ASSEMBLY-SW-CONNECTOR>`;
                }).join('')}
                ${project.ecuCompositions.flatMap(comp =>
                  comp.connectors.map(connector => {
                    const sourceInstance = comp.swcInstances.find(i => i.id === connector.sourceInstanceId);
                    const targetInstance = comp.swcInstances.find(i => i.id === connector.targetInstanceId);
                    const sourceSwc = project.swcs.find(s => s.id === sourceInstance?.swcRef);
                    const targetSwc = project.swcs.find(s => s.id === targetInstance?.swcRef);
                    const sourcePort = sourceSwc?.ports.find(p => p.id === connector.sourcePortId);
                    const targetPort = targetSwc?.ports.find(p => p.id === connector.targetPortId);
                    
                    return `
                <ASSEMBLY-SW-CONNECTOR UUID="${generateUUID()}">
                  <SHORT-NAME>${connector.name}</SHORT-NAME>
                  <DESC>
                    <L-2 L="EN">ECU composition connection between ${sourceInstance?.instanceName} and ${targetInstance?.instanceName}</L-2>
                  </DESC>
                  <PROVIDER-IREF>
                    <CONTEXT-COMPONENT-REF DEST="SW-COMPONENT-PROTOTYPE">/${project.name}_Composition/${sourceInstance?.instanceName}</CONTEXT-COMPONENT-REF>
                    <TARGET-P-PORT-REF DEST="P-PORT-PROTOTYPE">/ComponentTypes/${sourceSwc?.name}/${sourcePort?.name}</TARGET-P-PORT-REF>
                  </PROVIDER-IREF>
                  <REQUESTER-IREF>
                    <CONTEXT-COMPONENT-REF DEST="SW-COMPONENT-PROTOTYPE">/${project.name}_Composition/${targetInstance?.instanceName}</CONTEXT-COMPONENT-REF>
                    <TARGET-R-PORT-REF DEST="R-PORT-PROTOTYPE">/ComponentTypes/${targetSwc?.name}/${targetPort?.name}</TARGET-R-PORT-REF>
                  </REQUESTER-IREF>
                </ASSEMBLY-SW-CONNECTOR>`;
                  })
                ).join('')}
              </CONNECTORS>
            </COMPOSITION-SW-COMPONENT-TYPE>
          </SW-COMPOSITIONS>
          <MAPPING>
            <SYSTEM-MAPPING UUID="${generateUUID()}">
              <SHORT-NAME>${project.name}_SystemMapping</SHORT-NAME>
              <DATA-MAPPINGS />
              <SW-MAPPINGS />
            </SYSTEM-MAPPING>
          </MAPPING>
        </SYSTEM>
      </ELEMENTS>
    </AR-PACKAGE>
  </AR-PACKAGES>
</AUTOSAR>`;
      },
    }),
    {
      name: 'autosar-storage',
      // Fixed persistence configuration with proper Zustand types
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
