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
        
        // Generate UUID helper function
        const generateUUID = () => {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16).toUpperCase();
          });
        };
        
        // AUTOSAR XML header for individual SWC files - using exact blueprint schema
        const xmlHeaderSWC = `<?xml version="1.0" encoding="utf-8"?>
<AUTOSAR xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_00048.xsd"
         xmlns="http://autosar.org/schema/r4.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">`;

        // AUTOSAR XML header for portinterfaces.arxml - using specified schema
        const xmlHeaderPortInterfaces = `<?xml version="1.0" encoding="utf-8"?>
<AUTOSAR xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-2-2.xsd"
         xmlns="http://autosar.org/schema/r4.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">`;
    
        const createArxmlFile = (content: string, filename: string, header: string = xmlHeaderSWC) => {
          const fullContent = `${header}
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

        // 1. Individual SWC files following the exact blueprint structure with proper references
        project.swcs.forEach(swc => {
          const swcUUID = generateUUID();
          const behaviorUUID = generateUUID();
          const packageUUID = generateUUID();
          
          const swcContent = `    <AR-PACKAGE UUID="${packageUUID}">
      <SHORT-NAME>ComponentTypes</SHORT-NAME>
      <ELEMENTS>
        <APPLICATION-SW-COMPONENT-TYPE UUID="${swcUUID}">
          <SHORT-NAME>${swc.name}</SHORT-NAME>
          <CATEGORY>APPLICATION</CATEGORY>
          <PORTS>
${(swc.ports || []).map(port => {
  const portUUID = generateUUID();
  const portElement = port.direction === 'provided' ? 'P-PORT-PROTOTYPE' : 'R-PORT-PROTOTYPE';
  const interfaceRef = port.direction === 'provided' ? 'PROVIDED-INTERFACE-TREF' : 'REQUIRED-INTERFACE-TREF';
  
  // Find the actual interface name from the project interfaces
  const actualInterface = project.interfaces.find(iface => iface.id === port.interfaceRef);
  const interfaceName = actualInterface ? actualInterface.name : port.interfaceRef;
  
  return `            <${portElement} UUID="${portUUID}">
              <SHORT-NAME>${port.name}</SHORT-NAME>
              <${interfaceRef} DEST="SENDER-RECEIVER-INTERFACE">/Interfaces/${interfaceName}</${interfaceRef}>
            </${portElement}>`;
}).join('\n')}
          </PORTS>
          <INTERNAL-BEHAVIORS>
            <SWC-INTERNAL-BEHAVIOR UUID="${behaviorUUID}">
              <SHORT-NAME>${swc.name}_InternalBehavior</SHORT-NAME>
              <EVENTS>
${(swc.runnables || []).map(runnable => {
  const events = [];
  
  if (runnable.runnableType === 'init') {
    const eventUUID = generateUUID();
    events.push(`                <INIT-EVENT UUID="${eventUUID}">
                  <SHORT-NAME>${swc.name}_init_InitEvent</SHORT-NAME>
                  <START-ON-EVENT-REF DEST="RUNNABLE-ENTITY">/ComponentTypes/${swc.name}/${swc.name}_InternalBehavior/${runnable.name}</START-ON-EVENT-REF>
                </INIT-EVENT>`);
  }
  
  if (runnable.runnableType === 'periodic' && runnable.period > 0) {
    const eventUUID = generateUUID();
    const periodMs = Math.round(runnable.period);
    events.push(`                <TIMING-EVENT UUID="${eventUUID}">
                  <SHORT-NAME>${swc.name}_${periodMs}ms_TimingEvent</SHORT-NAME>
                  <START-ON-EVENT-REF DEST="RUNNABLE-ENTITY">/ComponentTypes/${swc.name}/${swc.name}_InternalBehavior/${runnable.name}</START-ON-EVENT-REF>
                  <PERIOD>${(runnable.period / 1000).toFixed(3)}</PERIOD>
                </TIMING-EVENT>`);
  }
  
  if (runnable.runnableType === 'event') {
    // Find a required port for data received event
    const requiredPort = (swc.ports || []).find(p => p.direction === 'required');
    if (requiredPort) {
      const eventUUID = generateUUID();
      const actualInterface = project.interfaces.find(iface => iface.id === requiredPort.interfaceRef);
      const interfaceName = actualInterface ? actualInterface.name : requiredPort.interfaceRef;
      const firstDataElement = actualInterface?.dataElements[0];
      const dataElementName = firstDataElement ? firstDataElement.name : 'DataElement';
      
      events.push(`                <DATA-RECEIVED-EVENT UUID="${eventUUID}">
                  <SHORT-NAME>${runnable.name}_DataReceivedEvent</SHORT-NAME>
                  <START-ON-EVENT-REF DEST="RUNNABLE-ENTITY">/ComponentTypes/${swc.name}/${swc.name}_InternalBehavior/${runnable.name}</START-ON-EVENT-REF>
                  <DATA-IREF>
                    <CONTEXT-R-PORT-REF DEST="R-PORT-PROTOTYPE">/ComponentTypes/${swc.name}/${requiredPort.name}</CONTEXT-R-PORT-REF>
                    <TARGET-DATA-PROTOTYPE-REF DEST="VARIABLE-DATA-PROTOTYPE">/Interfaces/${interfaceName}/${dataElementName}</TARGET-DATA-PROTOTYPE-REF>
                  </DATA-IREF>
                </DATA-RECEIVED-EVENT>`);
    }
  }
  
  return events.join('\n');
}).filter(eventGroup => eventGroup).join('\n')}
              </EVENTS>
              <RUNNABLES>
${(swc.runnables || []).map(runnable => {
  const runnableUUID = generateUUID();
  const runnableCategory = runnable.runnableType.toUpperCase();
  
  return `                <RUNNABLE-ENTITY UUID="${runnableUUID}">
                  <SHORT-NAME>${runnable.name}</SHORT-NAME>
                  <CATEGORY>${runnableCategory}</CATEGORY>
                  <CAN-BE-INVOKED-CONCURRENTLY>${runnable.canBeInvokedConcurrently || true}</CAN-BE-INVOKED-CONCURRENTLY>
${(runnable.accessPoints || []).filter(ap => ap.type === 'iWrite').length > 0 ? `                  <DATA-SEND-POINTS>
${(runnable.accessPoints || []).filter(ap => ap.type === 'iWrite').map(ap => {
  const accessUUID = generateUUID();
  // Find the actual port and interface for proper referencing
  const actualPort = (swc.ports || []).find(p => p.name === ap.portRef);
  const actualInterface = actualPort ? project.interfaces.find(iface => iface.id === actualPort.interfaceRef) : null;
  const interfaceName = actualInterface ? actualInterface.name : ap.portRef;
  
  return `                    <VARIABLE-ACCESS UUID="${accessUUID}">
                      <SHORT-NAME>Rte_Write_${ap.portRef}_${ap.dataElementRef}</SHORT-NAME>
                      <ACCESSED-VARIABLE>
                        <AUTOSAR-VARIABLE-IREF>
                          <PORT-PROTOTYPE-REF DEST="P-PORT-PROTOTYPE">/ComponentTypes/${swc.name}/${ap.portRef}</PORT-PROTOTYPE-REF>
                          <TARGET-DATA-PROTOTYPE-REF DEST="VARIABLE-DATA-PROTOTYPE">/Interfaces/${interfaceName}/${ap.dataElementRef}</TARGET-DATA-PROTOTYPE-REF>
                        </AUTOSAR-VARIABLE-IREF>
                      </ACCESSED-VARIABLE>
                    </VARIABLE-ACCESS>`;
}).join('\n')}
                  </DATA-SEND-POINTS>` : ''}
${(runnable.accessPoints || []).filter(ap => ap.type === 'iRead').length > 0 ? `                  <DATA-RECEIVE-POINT-BY-ARGUMENTS>
${(runnable.accessPoints || []).filter(ap => ap.type === 'iRead').map(ap => {
  const accessUUID = generateUUID();
  // Find the actual port and interface for proper referencing
  const actualPort = (swc.ports || []).find(p => p.name === ap.portRef);
  const actualInterface = actualPort ? project.interfaces.find(iface => iface.id === actualPort.interfaceRef) : null;
  const interfaceName = actualInterface ? actualInterface.name : ap.portRef;
  
  return `                    <VARIABLE-ACCESS UUID="${accessUUID}">
                      <SHORT-NAME>Rte_Read_${ap.portRef}_${ap.dataElementRef}</SHORT-NAME>
                      <ACCESSED-VARIABLE>
                        <AUTOSAR-VARIABLE-IREF>
                          <PORT-PROTOTYPE-REF DEST="R-PORT-PROTOTYPE">/ComponentTypes/${swc.name}/${ap.portRef}</PORT-PROTOTYPE-REF>
                          <TARGET-DATA-PROTOTYPE-REF DEST="VARIABLE-DATA-PROTOTYPE">/Interfaces/${interfaceName}/${ap.dataElementRef}</TARGET-DATA-PROTOTYPE-REF>
                        </AUTOSAR-VARIABLE-IREF>
                      </ACCESSED-VARIABLE>
                    </VARIABLE-ACCESS>`;
}).join('\n')}
                  </DATA-RECEIVE-POINT-BY-ARGUMENTS>` : ''}
${(runnable.accessPoints || []).filter(ap => ap.type === 'iCall').length > 0 ? `                  <SERVER-CALL-POINTS>
${(runnable.accessPoints || []).filter(ap => ap.type === 'iCall').map(ap => {
  const callUUID = generateUUID();
  // Find the actual port and interface for proper referencing
  const actualPort = (swc.ports || []).find(p => p.name === ap.portRef);
  const actualInterface = actualPort ? project.interfaces.find(iface => iface.id === actualPort.interfaceRef) : null;
  const interfaceName = actualInterface ? actualInterface.name : ap.portRef;
  
  return `                    <SYNCHRONOUS-SERVER-CALL-POINT UUID="${callUUID}">
                      <SHORT-NAME>Rte_Call_${ap.portRef}_${ap.dataElementRef}</SHORT-NAME>
                      <OPERATION-IREF>
                        <CONTEXT-R-PORT-REF DEST="R-PORT-PROTOTYPE">/ComponentTypes/${swc.name}/${ap.portRef}</CONTEXT-R-PORT-REF>
                        <TARGET-REQUIRED-OPERATION-REF DEST="CLIENT-SERVER-OPERATION">/Interfaces/${interfaceName}/${ap.dataElementRef}</TARGET-REQUIRED-OPERATION-REF>
                      </OPERATION-IREF>
                    </SYNCHRONOUS-SERVER-CALL-POINT>`;
}).join('\n')}
                  </SERVER-CALL-POINTS>` : ''}
                </RUNNABLE-ENTITY>`;
}).join('\n')}
              </RUNNABLES>
            </SWC-INTERNAL-BEHAVIOR>
          </INTERNAL-BEHAVIORS>
        </APPLICATION-SW-COMPONENT-TYPE>
      </ELEMENTS>
    </AR-PACKAGE>`;
          
          createArxmlFile(swcContent, `${swc.name}.arxml`);
        });

        // 2. Port Interfaces with corrected paths (removing /AUTOSAR/ prefix) and proper schema
        const interfacesPackageUUID = generateUUID();
        const interfacesContent = `    <AR-PACKAGE UUID="${interfacesPackageUUID}">
      <SHORT-NAME>Interfaces</SHORT-NAME>
      <ELEMENTS>
${project.interfaces.map(iface => {
  const interfaceUUID = generateUUID();
  return `        <SENDER-RECEIVER-INTERFACE UUID="${interfaceUUID}">
          <SHORT-NAME>${iface.name}</SHORT-NAME>
          <IS-SERVICE>false</IS-SERVICE>
          <DATA-ELEMENTS>
${iface.dataElements.map(de => {
  const dataElementUUID = generateUUID();
  return `            <VARIABLE-DATA-PROTOTYPE UUID="${dataElementUUID}">
              <SHORT-NAME>${de.name}</SHORT-NAME>
              <TYPE-TREF DEST="IMPLEMENTATION-DATA-TYPE">/DataTypes/${de.applicationDataTypeRef}</TYPE-TREF>
            </VARIABLE-DATA-PROTOTYPE>`;
}).join('\n')}
          </DATA-ELEMENTS>
        </SENDER-RECEIVER-INTERFACE>`;
}).join('\n')}
      </ELEMENTS>
    </AR-PACKAGE>`;
        
        createArxmlFile(interfacesContent, 'portinterfaces.arxml', xmlHeaderPortInterfaces);

        // 3. Master SWCs file with all components
        const swcsPackageUUID = generateUUID();
        const swcsContent = `    <AR-PACKAGE UUID="${swcsPackageUUID}">
      <SHORT-NAME>SWComponents</SHORT-NAME>
      <ELEMENTS>
${project.swcs.map(swc => {
  const swcUUID = generateUUID();
  const behaviorUUID = generateUUID();
  return `        <APPLICATION-SW-COMPONENT-TYPE UUID="${swcUUID}">
          <SHORT-NAME>${swc.name}</SHORT-NAME>
          <PORTS>
${(swc.ports || []).map(port => {
  const portUUID = generateUUID();
  const portElement = port.direction === 'provided' ? 'P-PORT-PROTOTYPE' : 'R-PORT-PROTOTYPE';
  const interfaceRef = port.direction === 'provided' ? 'PROVIDED-INTERFACE-TREF' : 'REQUIRED-INTERFACE-TREF';
  
  return `            <${portElement} UUID="${portUUID}">
              <SHORT-NAME>${port.name}</SHORT-NAME>
              <${interfaceRef} DEST="SENDER-RECEIVER-INTERFACE">/AUTOSAR/${project.name}/PortInterfaces/${port.interfaceRef}</${interfaceRef}>
            </${portElement}>`;
}).join('\n')}
          </PORTS>
          <INTERNAL-BEHAVIORS>
            <SWC-INTERNAL-BEHAVIOR UUID="${behaviorUUID}">
              <SHORT-NAME>${swc.name}_InternalBehavior</SHORT-NAME>
              <RUNNABLES>
${(swc.runnables || []).map(runnable => {
  const runnableUUID = generateUUID();
  return `                <RUNNABLE-ENTITY UUID="${runnableUUID}">
                  <SHORT-NAME>${runnable.name}</SHORT-NAME>
                  <SYMBOL>${runnable.name}</SYMBOL>
                  <CAN-BE-INVOKED-CONCURRENTLY>${runnable.canBeInvokedConcurrently || false}</CAN-BE-INVOKED-CONCURRENTLY>
                  <MIN-START-INTERVAL>${runnable.period > 0 ? (runnable.period / 1000).toFixed(3) : '0.0'}</MIN-START-INTERVAL>
                </RUNNABLE-ENTITY>`;
}).join('\n')}
              </RUNNABLES>
              <EVENTS>
${(swc.runnables || []).map(runnable => {
  if (runnable.runnableType === 'periodic' && runnable.period > 0) {
    const eventUUID = generateUUID();
    return `                <TIMING-EVENT UUID="${eventUUID}">
                  <SHORT-NAME>${runnable.name}_TimingEvent</SHORT-NAME>
                  <START-ON-EVENT-REF DEST="RUNNABLE-ENTITY">/AUTOSAR/${project.name}/SWComponents/${swc.name}/${swc.name}_InternalBehavior/${runnable.name}</START-ON-EVENT-REF>
                  <PERIOD>${(runnable.period / 1000).toFixed(3)}</PERIOD>
                </TIMING-EVENT>`;
  } else if (runnable.runnableType === 'init') {
    const eventUUID = generateUUID();
    return `                <INIT-EVENT UUID="${eventUUID}">
                  <SHORT-NAME>${runnable.name}_InitEvent</SHORT-NAME>
                  <START-ON-EVENT-REF DEST="RUNNABLE-ENTITY">/AUTOSAR/${project.name}/SWComponents/${swc.name}/${swc.name}_InternalBehavior/${runnable.name}</START-ON-EVENT-REF>
                </INIT-EVENT>`;
  }
  return '';
}).filter(event => event).join('\n')}
              </EVENTS>
            </SWC-INTERNAL-BEHAVIOR>
          </INTERNAL-BEHAVIORS>
        </APPLICATION-SW-COMPONENT-TYPE>`;
}).join('\n')}
      </ELEMENTS>
    </AR-PACKAGE>`;
        
        createArxmlFile(swcsContent, 'swcs.arxml');

        // 4. Data Types with UUIDs
        const dataTypesContent = `    <AR-PACKAGE UUID="${generateUUID()}">
      <SHORT-NAME>DataTypes</SHORT-NAME>
      <ELEMENTS>
${project.dataTypes.map(dt => {
  const dataTypeUUID = generateUUID();
  return `        <IMPLEMENTATION-DATA-TYPE UUID="${dataTypeUUID}">
          <SHORT-NAME>${dt.name}</SHORT-NAME>
          <CATEGORY>${dt.category.toUpperCase()}</CATEGORY>
          <DESC>
            <L-2 L="EN">${dt.description}</L-2>
          </DESC>
          <SW-DATA-DEF-PROPS>
            <SW-DATA-DEF-PROPS-VARIANTS>
              <SW-DATA-DEF-PROPS-CONDITIONAL>
                <BASE-TYPE-REF DEST="SW-BASE-TYPE">/DataTypes/${dt.baseType}</BASE-TYPE-REF>
              </SW-DATA-DEF-PROPS-CONDITIONAL>
            </SW-DATA-DEF-PROPS-VARIANTS>
          </SW-DATA-DEF-PROPS>
        </IMPLEMENTATION-DATA-TYPE>`;
}).join('\n')}
        <!-- Standard Base Types -->
        <SW-BASE-TYPE UUID="${generateUUID()}">
          <SHORT-NAME>uint8</SHORT-NAME>
          <CATEGORY>FIXED_LENGTH</CATEGORY>
          <BASE-TYPE-SIZE>8</BASE-TYPE-SIZE>
        </SW-BASE-TYPE>
        <SW-BASE-TYPE UUID="${generateUUID()}">
          <SHORT-NAME>uint16</SHORT-NAME>
          <CATEGORY>FIXED_LENGTH</CATEGORY>
          <BASE-TYPE-SIZE>16</BASE-TYPE-SIZE>
        </SW-BASE-TYPE>
        <SW-BASE-TYPE UUID="${generateUUID()}">
          <SHORT-NAME>uint32</SHORT-NAME>
          <CATEGORY>FIXED_LENGTH</CATEGORY>
          <BASE-TYPE-SIZE>32</BASE-TYPE-SIZE>
        </SW-BASE-TYPE>
      </ELEMENTS>
    </AR-PACKAGE>`;
        
        createArxmlFile(dataTypesContent, 'DataTypes.arxml');

        // 5. Constants with UUIDs
        const constantsContent = `    <AR-PACKAGE UUID="${generateUUID()}">
      <SHORT-NAME>Constants</SHORT-NAME>
      <ELEMENTS>
        <CONSTANT-SPECIFICATION UUID="${generateUUID()}">
          <SHORT-NAME>DEFAULT_PERIOD</SHORT-NAME>
          <VALUE>100</VALUE>
        </CONSTANT-SPECIFICATION>
        <CONSTANT-SPECIFICATION UUID="${generateUUID()}">
          <SHORT-NAME>MAX_TIMEOUT</SHORT-NAME>
          <VALUE>1000</VALUE>
        </CONSTANT-SPECIFICATION>
      </ELEMENTS>
    </AR-PACKAGE>`;
        
        createArxmlFile(constantsContent, 'Constants.arxml');

        // 6. ECU Composition with UUIDs
        const ecuCompositionContent = `    <AR-PACKAGE UUID="${generateUUID()}">
      <SHORT-NAME>ECUCompositions</SHORT-NAME>
      <ELEMENTS>
${(project.ecuCompositions || []).map(comp => {
  const ecuUUID = generateUUID();
  return `        <ECU-INSTANCE UUID="${ecuUUID}">
          <SHORT-NAME>${comp.name}</SHORT-NAME>
          <DESC>
            <L-2 L="EN">${comp.description}</L-2>
          </DESC>
          <ECU-TYPE>${comp.ecuType}</ECU-TYPE>
          <ASSOCIATED-COM-I-PDU-GROUP-REFS>
${comp.swcInstances.map(inst => {
  const instanceUUID = generateUUID();
  return `            <SW-COMPONENT-INSTANCE UUID="${instanceUUID}">
              <SHORT-NAME>${inst.name}</SHORT-NAME>
              <TYPE-TREF DEST="APPLICATION-SW-COMPONENT-TYPE">/ComponentTypes/${inst.swcRef}</TYPE-TREF>
            </SW-COMPONENT-INSTANCE>`;
}).join('\n')}
          </ASSOCIATED-COM-I-PDU-GROUP-REFS>
          <CONNECTORS>
${comp.connectors.map(conn => {
  const connectorUUID = generateUUID();
  return `            <ASSEMBLY-SW-CONNECTOR UUID="${connectorUUID}">
              <SHORT-NAME>${conn.name}</SHORT-NAME>
              <PROVIDER-IREF>
                <CONTEXT-COMPONENT-REF DEST="SW-COMPONENT-PROTOTYPE">/ECUCompositions/${comp.name}/${conn.sourceInstanceId}</CONTEXT-COMPONENT-REF>
                <TARGET-P-PORT-REF DEST="P-PORT-PROTOTYPE">/ComponentTypes/${conn.sourceInstanceId}/${conn.sourcePortId}</TARGET-P-PORT-REF>
              </PROVIDER-IREF>
              <REQUESTER-IREF>
                <CONTEXT-COMPONENT-REF DEST="SW-COMPONENT-PROTOTYPE">/ECUCompositions/${comp.name}/${conn.targetInstanceId}</CONTEXT-COMPONENT-REF>
                <TARGET-R-PORT-REF DEST="R-PORT-PROTOTYPE">/ComponentTypes/${conn.targetInstanceId}/${conn.targetPortId}</TARGET-R-PORT-REF>
              </REQUESTER-IREF>
            </ASSEMBLY-SW-CONNECTOR>`;
}).join('\n')}
          </CONNECTORS>
        </ECU-INSTANCE>`;
}).join('\n')}
      </ELEMENTS>
    </AR-PACKAGE>`;
        
        createArxmlFile(ecuCompositionContent, 'ECUComposition.arxml');

        // 7. System Extract with UUIDs
        const systemExtractContent = `    <AR-PACKAGE UUID="${generateUUID()}">
      <SHORT-NAME>System</SHORT-NAME>
      <ELEMENTS>
        <SYSTEM UUID="${generateUUID()}">
          <SHORT-NAME>${project.name}_System</SHORT-NAME>
          <DESC>
            <L-2 L="EN">System extract for ${project.name}</L-2>
          </DESC>
          <MAPPINGS>
${project.swcs.map(swc => {
  const mappingUUID = generateUUID();
  return `            <SWC-TO-ECU-MAPPING UUID="${mappingUUID}">
              <SHORT-NAME>${swc.name}_Mapping</SHORT-NAME>
              <ECU-INSTANCE-REF DEST="ECU-INSTANCE">/ECUCompositions/SystemECU</ECU-INSTANCE-REF>
              <SW-COMPONENT-INSTANCE-REF DEST="SW-COMPONENT-INSTANCE">/ECUCompositions/SystemECU/${swc.name}Instance</SW-COMPONENT-INSTANCE-REF>
            </SWC-TO-ECU-MAPPING>`;
}).join('\n')}
          </MAPPINGS>
          <ROOT-SOFTWARE-COMPOSITIONS>
            <ROOT-SW-COMPOSITION-PROTOTYPE UUID="${generateUUID()}">
              <SHORT-NAME>RootComposition</SHORT-NAME>
              <SOFTWARE-COMPOSITION-TREF DEST="COMPOSITION-SW-COMPONENT-TYPE">/ECUCompositions/SystemECU</SOFTWARE-COMPOSITION-TREF>
            </ROOT-SW-COMPOSITION-PROTOTYPE>
          </ROOT-SOFTWARE-COMPOSITIONS>
        </SYSTEM>
      </ELEMENTS>
    </AR-PACKAGE>`;
        
        createArxmlFile(systemExtractContent, 'SystemExtract.arxml');

        console.log('AUTOSAR ARXML files exported with proper reference structure:', {
          individualSWCs: project.swcs.length,
          portInterfaces: 1,
          masterSWCs: 1,
          totalFiles: project.swcs.length + 6
        });
      },
    }),
    {
      name: 'autosar-store',
    }
  )
);
