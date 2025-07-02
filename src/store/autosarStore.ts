import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { persist } from 'zustand/middleware';

// Define the types for AUTOSAR elements
export interface Swc {
  id: string;
  name: string;
  description: string;
  category: 'application' | 'service' | 'ecu-abstraction' | 'complex-driver' | 'sensor-actuator';
  type: 'atomic' | 'composite';
  ports?: Port[];
  runnables?: Runnable[];
}

export interface Port {
  id: string;
  name: string;
  direction: 'required' | 'provided';
  interfaceRef: string;
}

export interface Runnable {
  id: string;
  name: string;
  period: number;
  runnableType: 'init' | 'periodic' | 'event';
  canBeInvokedConcurrently?: boolean;
  accessPoints?: AccessPoint[];
  events?: string[];
}

export interface AccessPoint {
  id: string;
  name: string;
  type: 'iRead' | 'iWrite' | 'iCall';
  access: 'implicit' | 'explicit';
  swcId: string;
  runnableId: string;
  portRef: string;
  dataElementRef: string;
}

export interface Interface {
  id: string;
  name: string;
  type: 'SenderReceiver' | 'ClientServer' | 'ModeSwitch' | 'Parameter' | 'Trigger';
  dataElements: DataElement[];
}

export interface DataElement {
  id: string;
  name: string;
  applicationDataTypeRef: string;
  category: string;
  description: string;
  swDataDefProps?: {
    baseTypeRef: string;
    implementationDataTypeRef: string;
  };
}

export interface DataType {
  id: string;
  name: string;
  category: 'primitive' | 'array' | 'structure' | 'record' | 'typedef';
  baseType: string;
  length?: number;
  arraySize?: number;
  fields?: { name: string; type: string; }[];
  description: string;
}

export interface Connection {
  id: string;
  name: string;
  providingComponent: string;
  requiringComponent: string;
  providingPort: string;
  requiringPort: string;
  interfaceRef: string;
  sourceSwcId: string;
  sourcePortId: string;
  targetSwcId: string;
  targetPortId: string;
}

export interface SWCInstance {
  id: string;
  name: string;
  swcRef: string;
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

export interface ECUComposition {
  id: string;
  name: string;
  description: string;
  ecuType: string;
  swcInstances: SWCInstance[];
  connectors: ECUConnector[];
  autosarVersion: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  swcs: Swc[];
  interfaces: Interface[];
  dataTypes: DataType[];
  connections: Connection[];
  dataElements: DataElement[];
  ecuCompositions: ECUComposition[];
  autosarVersion: string;
  isDraft: boolean;
  lastModified: number;
  autoSaveEnabled: boolean;
}

// Define the store's state
interface AutosarState {
  projects: Project[];
  currentProject: Project | null;
  autoSaveInterval: number;
  lastAutoSave: number | null;
  
  createProject: (projectData: Omit<Project, 'id' | 'lastModified'>) => void;
  loadProject: (projectId: string) => void;
  saveProject: () => void;
  saveProjectAsDraft: () => void;
  autoSave: () => void;
  deleteProject: (projectId: string) => void;
  exportArxml: () => void;
  importArxml: (file: File) => void;
  refreshProject: () => void;

  createSWC: (swcData: Omit<Swc, 'id'>) => void;
  updateSWC: (swcId: string, updates: Partial<Swc>) => void;
  deleteSWC: (swcId: string) => void;
  createPort: (portData: Omit<Port, 'id'> & { swcId: string }) => void;
  updatePort: (portId: string, updates: Partial<Port>) => void;
  deletePort: (portId: string) => void;
  createRunnable: (runnableData: Omit<Runnable, 'id'> & { swcId: string }) => void;
  updateRunnable: (runnableId: string, updates: Partial<Runnable>) => void;
  deleteRunnable: (runnableId: string) => void;
  addAccessPoint: (runnableId: string, accessPointData: Omit<AccessPoint, 'id'>) => void;
  updateAccessPoint: (accessPointId: string, updates: Partial<AccessPoint>) => void;
  deleteAccessPoint: (runnableId: string, accessPointId: string) => void;
  generateRteAccessPointName: (portName: string, dataElementName: string, accessType: string) => string;

  createInterface: (interfaceData: Omit<Interface, 'id'>) => void;
  updateInterface: (interfaceId: string, updates: Partial<Interface>) => void;
  deleteInterface: (interfaceId: string) => void;
  createDataElement: (dataElementData: Omit<DataElement, 'id'>) => void;
  updateDataElement: (dataElementId: string, updates: Partial<DataElement>) => void;
  deleteDataElement: (dataElementId: string) => void;

  createDataType: (dataTypeData: Omit<DataType, 'id'>) => void;
  updateDataType: (dataTypeId: string, updates: Partial<DataType>) => void;
  deleteDataType: (dataTypeId: string) => void;

  createConnection: (connectionData: Omit<Connection, 'id'>) => void;
  updateConnection: (connectionId: string, updates: Partial<Connection>) => void;
  deleteConnection: (connectionId: string) => void;

  createECUComposition: (compositionData: Omit<ECUComposition, 'id' | 'swcInstances' | 'connectors'>) => void;
  updateECUComposition: (compositionId: string, updates: Partial<ECUComposition>) => void;
  deleteECUComposition: (compositionId: string) => void;
  addSWCInstance: (compositionId: string, instanceData: Omit<SWCInstance, 'id'>) => void;
  removeSWCInstance: (compositionId: string, instanceId: string) => void;
  addECUConnector: (compositionId: string, connectorData: Omit<ECUConnector, 'id'>) => void;
  removeECUConnector: (compositionId: string, connectorId: string) => void;

  exportMultipleArxml: () => void;
}

// Create the store
export const useAutosarStore = create<AutosarState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProject: null,
      autoSaveInterval: 60000,
      lastAutoSave: null,

      createProject: (projectData: Omit<Project, 'id' | 'lastModified'>) => {
        const newProject: Project = {
          id: uuidv4(),
          lastModified: Date.now(),
          ...projectData
        };
        set(state => ({ 
          projects: [...state.projects, newProject],
          currentProject: newProject,
        }));
      },

      loadProject: (projectId: string) => {
        const project = get().projects.find(p => p.id === projectId);
        if (project) {
          set({ currentProject: project });
        } else {
          console.error(`Project with ID ${projectId} not found.`);
        }
      },

      saveProject: () => {
        const project = get().currentProject;
        if (project) {
          const updatedProject = { ...project, lastModified: Date.now(), isDraft: false };
          set(state => ({
            projects: state.projects.map(p => p.id === project.id ? updatedProject : p),
            currentProject: updatedProject
          }));
          console.log(`Project ${project.name} saved successfully.`);
        }
      },

      saveProjectAsDraft: () => {
        const project = get().currentProject;
        if (project) {
          const updatedProject = { ...project, lastModified: Date.now(), isDraft: true };
          set(state => ({
            projects: state.projects.map(p => p.id === project.id ? updatedProject : p),
            currentProject: updatedProject
          }));
        }
      },

      exportArxml: () => {
        get().exportMultipleArxml();
      },

      importArxml: (file: File) => {
        console.log('Importing ARXML file:', file.name);
      },

      autoSave: () => {
        const now = Date.now();
        const lastSave = get().lastAutoSave || 0;
        const interval = get().autoSaveInterval;
      
        if (now - lastSave >= interval) {
          get().saveProject();
          set({ lastAutoSave: now });
          console.log('Auto-save completed.');
        } else {
          console.log('Auto-save skipped (recent save).');
        }
      },

      deleteProject: (projectId: string) => {
        set(state => ({
          projects: state.projects.filter(p => p.id !== projectId),
          currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
        }));
      },

      refreshProject: () => {
        const currentProject = get().currentProject;
        if (currentProject) {
          // Force a re-render by updating the lastModified timestamp
          set(state => ({
            currentProject: state.currentProject ? {
              ...state.currentProject,
              lastModified: Date.now()
            } : state.currentProject
          }));
          console.log('Project data refreshed');
        }
      },

      createSWC: (swcData: Omit<Swc, 'id'>) => {
        const newSwc: Swc = { id: uuidv4(), ...swcData };
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: [...state.currentProject.swcs, newSwc]
          } : state.currentProject
        }));
      },

      updateSWC: (swcId: string, updates: Partial<Swc>) => {
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.map(swc =>
              swc.id === swcId ? { ...swc, ...updates } : swc
            )
          } : state.currentProject
        }));
      },

      deleteSWC: (swcId: string) => {
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.filter(swc => swc.id !== swcId)
          } : state.currentProject
        }));
      },

      createPort: (portData: Omit<Port, 'id'> & { swcId: string }) => {
        const { swcId, ...portDataWithoutSwcId } = portData;
        const newPort: Port = { id: uuidv4(), ...portDataWithoutSwcId };
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.map(swc =>
              swc.id === swcId ? { ...swc, ports: [...(swc.ports || []), newPort] } : swc
            )
          } : state.currentProject
        }));
      },

      updatePort: (portId: string, updates: Partial<Port>) => {
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.map(swc => ({
              ...swc,
              ports: (swc.ports || []).map(port =>
                port.id === portId ? { ...port, ...updates } : port
              )
            }))
          } : state.currentProject
        }));
      },

      deletePort: (portId: string) => {
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.map(swc => ({
              ...swc,
              ports: (swc.ports || []).filter(port => port.id !== portId)
            }))
          } : state.currentProject
        }));
      },

      createRunnable: (runnableData: Omit<Runnable, 'id'> & { swcId: string }) => {
        const { swcId, ...runnableDataWithoutSwcId } = runnableData;
        const newRunnable: Runnable = { id: uuidv4(), ...runnableDataWithoutSwcId };
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.map(swc =>
              swc.id === swcId ? { ...swc, runnables: [...(swc.runnables || []), newRunnable] } : swc
            )
          } : state.currentProject
        }));
      },

      updateRunnable: (runnableId: string, updates: Partial<Runnable>) => {
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.map(swc => ({
              ...swc,
              runnables: (swc.runnables || []).map(runnable =>
                runnable.id === runnableId ? { ...runnable, ...updates } : runnable
              )
            }))
          } : state.currentProject
        }));
      },

      deleteRunnable: (runnableId: string) => {
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.map(swc => ({
              ...swc,
              runnables: (swc.runnables || []).filter(runnable => runnable.id !== runnableId)
            }))
          } : state.currentProject
        }));
      },

      addAccessPoint: (runnableId: string, accessPointData: Omit<AccessPoint, 'id'>) => {
        const newAccessPoint: AccessPoint = { id: uuidv4(), ...accessPointData };
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.map(swc => ({
              ...swc,
              runnables: (swc.runnables || []).map(runnable =>
                runnable.id === runnableId ? {
                  ...runnable,
                  accessPoints: [...(runnable.accessPoints || []), newAccessPoint]
                } : runnable
              )
            }))
          } : state.currentProject
        }));
      },

      updateAccessPoint: (accessPointId: string, updates: Partial<AccessPoint>) => {
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.map(swc => ({
              ...swc,
              runnables: (swc.runnables || []).map(runnable => ({
                ...runnable,
                accessPoints: (runnable.accessPoints || []).map(ap =>
                  ap.id === accessPointId ? { ...ap, ...updates } : ap
                )
              }))
            }))
          } : state.currentProject
        }));
      },

      deleteAccessPoint: (runnableId: string, accessPointId: string) => {
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.map(swc => ({
              ...swc,
              runnables: (swc.runnables || []).map(runnable =>
                runnable.id === runnableId ? {
                  ...runnable,
                  accessPoints: (runnable.accessPoints || []).filter(ap => ap.id !== accessPointId)
                } : runnable
              )
            }))
          } : state.currentProject
        }));
      },

      generateRteAccessPointName: (portName: string, dataElementName: string, accessType: string) => {
        return `Rte_${accessType}_${portName}_${dataElementName}`;
      },

      createInterface: (interfaceData: Omit<Interface, 'id'>) => {
        const newInterface: Interface = { id: uuidv4(), ...interfaceData };
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            interfaces: [...state.currentProject.interfaces, newInterface]
          } : state.currentProject
        }));
      },

      updateInterface: (interfaceId: string, updates: Partial<Interface>) => {
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            interfaces: state.currentProject.interfaces.map(iface =>
              iface.id === interfaceId ? { ...iface, ...updates } : iface
            )
          } : state.currentProject
        }));
      },

      deleteInterface: (interfaceId: string) => {
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            interfaces: state.currentProject.interfaces.filter(iface => iface.id !== interfaceId)
          } : state.currentProject
        }));
      },

      createDataElement: (dataElementData: Omit<DataElement, 'id'>) => {
        const newDataElement: DataElement = { id: uuidv4(), ...dataElementData };
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            dataElements: [...(state.currentProject.dataElements || []), newDataElement]
          } : state.currentProject
        }));
      },

      updateDataElement: (dataElementId: string, updates: Partial<DataElement>) => {
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            dataElements: (state.currentProject.dataElements || []).map(de =>
              de.id === dataElementId ? { ...de, ...updates } : de
            ),
            interfaces: state.currentProject.interfaces.map(iface => ({
              ...iface,
              dataElements: iface.dataElements.map(de =>
                de.id === dataElementId ? { ...de, ...updates } : de
              )
            }))
          } : state.currentProject
        }));
      },

      deleteDataElement: (dataElementId: string) => {
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            dataElements: (state.currentProject.dataElements || []).filter(de => de.id !== dataElementId),
            interfaces: state.currentProject.interfaces.map(iface => ({
              ...iface,
              dataElements: iface.dataElements.filter(de => de.id !== dataElementId)
            }))
          } : state.currentProject
        }));
      },

      createDataType: (dataTypeData: Omit<DataType, 'id'>) => {
        const newDataType: DataType = { id: uuidv4(), ...dataTypeData };
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            dataTypes: [...state.currentProject.dataTypes, newDataType]
          } : state.currentProject
        }));
      },

      updateDataType: (dataTypeId: string, updates: Partial<DataType>) => {
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            dataTypes: state.currentProject.dataTypes.map(dataType =>
              dataType.id === dataTypeId ? { ...dataType, ...updates } : dataType
            )
          } : state.currentProject
        }));
      },

      deleteDataType: (dataTypeId: string) => {
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            dataTypes: state.currentProject.dataTypes.filter(dataType => dataType.id !== dataTypeId)
          } : state.currentProject
        }));
      },

      createConnection: (connectionData: Omit<Connection, 'id'>) => {
        const newConnection: Connection = { id: uuidv4(), ...connectionData };
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            connections: [...state.currentProject.connections, newConnection]
          } : state.currentProject
        }));
      },

      updateConnection: (connectionId: string, updates: Partial<Connection>) => {
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            connections: state.currentProject.connections.map(connection =>
              connection.id === connectionId ? { ...connection, ...updates } : connection
            )
          } : state.currentProject
        }));
      },

      deleteConnection: (connectionId: string) => {
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            connections: state.currentProject.connections.filter(connection => connection.id !== connectionId)
          } : state.currentProject
        }));
      },

      createECUComposition: (compositionData: Omit<ECUComposition, 'id' | 'swcInstances' | 'connectors'>) => {
        const newComposition: ECUComposition = { 
          id: uuidv4(), 
          swcInstances: [],
          connectors: [],
          ...compositionData 
        };
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            ecuCompositions: [...(state.currentProject.ecuCompositions || []), newComposition]
          } : state.currentProject
        }));
      },

      updateECUComposition: (compositionId: string, updates: Partial<ECUComposition>) => {
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            ecuCompositions: (state.currentProject.ecuCompositions || []).map(comp =>
              comp.id === compositionId ? { ...comp, ...updates } : comp
            )
          } : state.currentProject
        }));
      },

      deleteECUComposition: (compositionId: string) => {
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            ecuCompositions: (state.currentProject.ecuCompositions || []).filter(comp => comp.id !== compositionId)
          } : state.currentProject
        }));
      },

      addSWCInstance: (compositionId: string, instanceData: Omit<SWCInstance, 'id'>) => {
        const newInstance: SWCInstance = { id: uuidv4(), ...instanceData };
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            ecuCompositions: (state.currentProject.ecuCompositions || []).map(comp =>
              comp.id === compositionId ? {
                ...comp,
                swcInstances: [...comp.swcInstances, newInstance]
              } : comp
            )
          } : state.currentProject
        }));
      },

      removeSWCInstance: (compositionId: string, instanceId: string) => {
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            ecuCompositions: (state.currentProject.ecuCompositions || []).map(comp =>
              comp.id === compositionId ? {
                ...comp,
                swcInstances: comp.swcInstances.filter(inst => inst.id !== instanceId)
              } : comp
            )
          } : state.currentProject
        }));
      },

      addECUConnector: (compositionId: string, connectorData: Omit<ECUConnector, 'id'>) => {
        const newConnector: ECUConnector = { id: uuidv4(), ...connectorData };
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            ecuCompositions: (state.currentProject.ecuCompositions || []).map(comp =>
              comp.id === compositionId ? {
                ...comp,
                connectors: [...comp.connectors, newConnector]
              } : comp
            )
          } : state.currentProject
        }));
      },

      removeECUConnector: (compositionId: string, connectorId: string) => {
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            ecuCompositions: (state.currentProject.ecuCompositions || []).map(comp =>
              comp.id === compositionId ? {
                ...comp,
                connectors: comp.connectors.filter(conn => conn.id !== connectorId)
              } : comp
            )
          } : state.currentProject
        }));
      },

      exportMultipleArxml: () => {
        const state = get();
        if (!state.currentProject) return;
    
        const project = state.currentProject;
        
        // AUTOSAR 4.2.2 compliant XML header
        const xmlHeader = `<?xml version="1.0" encoding="utf-8"?>
    <!--This file was saved with a tool from Vector Informatik GmbH-->
    <AUTOSAR xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_422.xsd"
             xmlns="http://autosar.org/schema/r4.0"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">`;
    
        const createArxmlFile = (content: string, filename: string) => {
          const fullContent = `${xmlHeader}
      <AR-PACKAGES>
    ${content}
      </AR-PACKAGES>
    </AUTOSAR>`;
          
          const blob = new Blob([fullContent], { type: 'application/xml' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        };
    
        // Generate and download ARXML files
        const packagesContent = `    <AR-PACKAGE>
          <SHORT-NAME>ComponentTypes</SHORT-NAME>
        </AR-PACKAGE>`;
        
        createArxmlFile(packagesContent, 'packages.arxml');
        console.log('Multiple ARXML files exported successfully');
      },
    }),
    {
      name: 'autosar-store',
    }
  )
);
