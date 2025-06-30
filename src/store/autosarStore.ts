
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DataType {
  id: string;
  name: string;
  category: 'primitive' | 'array' | 'record' | 'typedef';
  baseType?: string;
  arraySize?: number;
  elements?: { name: string; type: string; }[];
  description?: string;
}

export interface Interface {
  id: string;
  name: string;
  type: 'SenderReceiver' | 'ClientServer' | 'ModeSwitch' | 'Parameter' | 'Trigger';
  dataElements?: { name: string; dataTypeRef: string; }[];
  operations?: { name: string; arguments: { name: string; direction: 'IN' | 'OUT' | 'INOUT'; type: string; }[]; }[];
}

export interface Port {
  id: string;
  name: string;
  direction: 'provided' | 'required';
  interfaceRef: string;
  swcId: string;
}

export interface AccessPoint {
  id: string;
  name: string;
  type: 'read' | 'write';
  access: 'implicit' | 'explicit';
  portRef: string;
  dataElementRef: string;
}

export interface Runnable {
  id: string;
  name: string;
  swcId: string;
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
  createdAt: string;
  lastModified: string;
}

interface AutosarStore {
  currentProject: Project | null;
  projects: Project[];
  
  // Project management
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'lastModified'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  loadProject: (id: string) => void;
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
  
  // Runnable management
  createRunnable: (runnable: Omit<Runnable, 'id' | 'accessPoints'>) => void;
  updateRunnable: (id: string, updates: Partial<Runnable>) => void;
  deleteRunnable: (id: string) => void;
  
  // Access point management
  addAccessPoint: (runnableId: string, accessPoint: Omit<AccessPoint, 'id'>) => void;
  updateAccessPoint: (runnableId: string, accessPointId: string, updates: Partial<AccessPoint>) => void;
  removeAccessPoint: (runnableId: string, accessPointId: string) => void;
}

const generateUUID = () => crypto.randomUUID();

export const useAutosarStore = create<AutosarStore>()(
  persist(
    (set, get) => ({
      currentProject: null,
      projects: [],
      
      createProject: (projectData) => {
        const project: Project = {
          ...projectData,
          id: generateUUID(),
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        };
        set((state) => ({
          projects: [...state.projects, project],
          currentProject: project,
        }));
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
      
      loadProject: (id) => {
        const project = get().projects.find((p) => p.id === id);
        if (project) {
          set({ currentProject: project });
        }
      },
      
      importArxml: async (file: File) => {
        // Placeholder for ARXML import functionality
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
            })),
            lastModified: new Date().toISOString(),
          } : null,
        }));
      },
      
      createInterface: (interfaceData) => {
        const interface_: Interface = { ...interfaceData, id: generateUUID() };
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
            lastModified: new Date().toISOString(),
          } : null,
        }));
      },
      
      createDataType: (dataTypeData) => {
        const dataType: DataType = { ...dataTypeData, id: generateUUID() };
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
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            dataTypes: state.currentProject.dataTypes.filter((dt) => dt.id !== id),
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
      
      addAccessPoint: (runnableId, accessPointData) => {
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
      
      updateAccessPoint: (runnableId, accessPointId, updates) => {
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.map((swc) => ({
              ...swc,
              runnables: swc.runnables.map((runnable) =>
                runnable.id === runnableId
                  ? {
                      ...runnable,
                      accessPoints: runnable.accessPoints.map((ap) =>
                        ap.id === accessPointId ? { ...ap, ...updates } : ap
                      ),
                    }
                  : runnable
              ),
            })),
            lastModified: new Date().toISOString(),
          } : null,
        }));
      },
      
      removeAccessPoint: (runnableId, accessPointId) => {
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.map((swc) => ({
              ...swc,
              runnables: swc.runnables.map((runnable) =>
                runnable.id === runnableId
                  ? {
                      ...runnable,
                      accessPoints: runnable.accessPoints.filter((ap) => ap.id !== accessPointId),
                    }
                  : runnable
              ),
            })),
            lastModified: new Date().toISOString(),
          } : null,
        }));
      },
    }),
    {
      name: 'autosar-storage',
    }
  )
);
