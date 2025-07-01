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
  accessPoints?: AccessPoint[];
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
}

export interface DataType {
  id: string;
  name: string;
  category: 'primitive' | 'array' | 'structure' | 'record' | 'typedef';
  baseType: string;
  length?: number;
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

export interface Project {
  id: string;
  name: string;
  description: string;
  swcs: Swc[];
  interfaces: Interface[];
  dataTypes: DataType[];
  connections: Connection[];
  dataElements: DataElement[];
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
  
  createProject: (name: string, description: string) => void;
  loadProject: (projectId: string) => void;
  saveProject: () => void;
  saveProjectAsDraft: () => void;
  autoSave: () => void;
  deleteProject: (projectId: string) => void;
  exportArxml: () => void;

  createSWC: (swcData: Omit<Swc, 'id'>) => void;
  updateSWC: (swcId: string, updates: Partial<Swc>) => void;
  deleteSWC: (swcId: string) => void;
  createPort: (portData: Omit<Port, 'id'> & { swcId: string }) => void;
  updatePort: (portId: string, updates: Partial<Port>) => void;
  deletePort: (swcId: string, portId: string) => void;
  createRunnable: (swcId: string, runnableData: Omit<Runnable, 'id'>) => void;
  updateRunnable: (swcId: string, runnableId: string, updates: Partial<Runnable>) => void;
  deleteRunnable: (swcId: string, runnableId: string) => void;
  addAccessPoint: (runnableId: string, accessPointData: Omit<AccessPoint, 'id'>) => void;
  updateAccessPoint: (accessPointId: string, updates: Partial<AccessPoint>) => void;
  deleteAccessPoint: (swcId: string, runnableId: string, accessPointId: string) => void;
  generateRteAccessPointName: (portName: string, dataElementName: string, accessType: string) => string;

  createInterface: (interfaceData: Omit<Interface, 'id'>) => void;
  updateInterface: (interfaceId: string, updates: Partial<Interface>) => void;
  deleteInterface: (interfaceId: string) => void;
  createDataElement: (interfaceId: string, dataElementData: Omit<DataElement, 'id'>) => void;
  updateDataElement: (interfaceId: string, dataElementId: string, updates: Partial<DataElement>) => void;
  deleteDataElement: (interfaceId: string, dataElementId: string) => void;

  createDataType: (dataTypeData: Omit<DataType, 'id'>) => void;
  updateDataType: (dataTypeId: string, updates: Partial<DataType>) => void;
  deleteDataType: (dataTypeId: string) => void;

  createConnection: (connectionData: Omit<Connection, 'id'>) => void;
  updateConnection: (connectionId: string, updates: Partial<Connection>) => void;
  deleteConnection: (connectionId: string) => void;

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

      createProject: (name: string, description: string) => {
        const newProject: Project = {
          id: uuidv4(),
          name,
          description,
          swcs: [],
          interfaces: [],
          dataTypes: [],
          connections: [],
          dataElements: [],
          autosarVersion: '4.2.2',
          isDraft: true,
          lastModified: Date.now(),
          autoSaveEnabled: true,
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
        const { swcId, ...portInfo } = portData;
        const newPort: Port = { id: uuidv4(), ...portInfo };
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

      deletePort: (swcId: string, portId: string) => {
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.map(swc =>
              swc.id === swcId ? {
                ...swc,
                ports: (swc.ports || []).filter(port => port.id !== portId)
              } : swc
            )
          } : state.currentProject
        }));
      },

      createRunnable: (swcId: string, runnableData: Omit<Runnable, 'id'>) => {
        const newRunnable: Runnable = { id: uuidv4(), ...runnableData };
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.map(swc =>
              swc.id === swcId ? { ...swc, runnables: [...(swc.runnables || []), newRunnable] } : swc
            )
          } : state.currentProject
        }));
      },

      updateRunnable: (swcId: string, runnableId: string, updates: Partial<Runnable>) => {
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.map(swc =>
              swc.id === swcId ? {
                ...swc,
                runnables: (swc.runnables || []).map(runnable =>
                  runnable.id === runnableId ? { ...runnable, ...updates } : runnable
                )
              } : swc
            )
          } : state.currentProject
        }));
      },

      deleteRunnable: (swcId: string, runnableId: string) => {
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.map(swc =>
              swc.id === swcId ? {
                ...swc,
                runnables: (swc.runnables || []).filter(runnable => runnable.id !== runnableId)
              } : swc
            )
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

      deleteAccessPoint: (swcId: string, runnableId: string, accessPointId: string) => {
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            swcs: state.currentProject.swcs.map(swc =>
              swc.id === swcId ? {
                ...swc,
                runnables: (swc.runnables || []).map(runnable =>
                  runnable.id === runnableId ? {
                    ...runnable,
                    accessPoints: (runnable.accessPoints || []).filter(ap => ap.id !== accessPointId)
                  } : runnable
                )
              } : swc
            )
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

      createDataElement: (interfaceId: string, dataElementData: Omit<DataElement, 'id'>) => {
        const newDataElement: DataElement = { id: uuidv4(), ...dataElementData };
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            interfaces: state.currentProject.interfaces.map(iface =>
              iface.id === interfaceId ? { ...iface, dataElements: [...iface.dataElements, newDataElement] } : iface
            ),
            dataElements: [...(state.currentProject.dataElements || []), newDataElement]
          } : state.currentProject
        }));
      },

      updateDataElement: (interfaceId: string, dataElementId: string, updates: Partial<DataElement>) => {
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            interfaces: state.currentProject.interfaces.map(iface =>
              iface.id === interfaceId ? {
                ...iface,
                dataElements: iface.dataElements.map(de =>
                  de.id === dataElementId ? { ...de, ...updates } : de
                )
              } : iface
            ),
            dataElements: (state.currentProject.dataElements || []).map(de =>
              de.id === dataElementId ? { ...de, ...updates } : de
            )
          } : state.currentProject
        }));
      },

      deleteDataElement: (interfaceId: string, dataElementId: string) => {
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            interfaces: state.currentProject.interfaces.map(iface =>
              iface.id === interfaceId ? {
                ...iface,
                dataElements: iface.dataElements.filter(de => de.id !== dataElementId)
              } : iface
            ),
            dataElements: (state.currentProject.dataElements || []).filter(de => de.id !== dataElementId)
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
    
        // Generate packages.arxml
        const packagesContent = `    <AR-PACKAGE>
          <SHORT-NAME>ComponentTypes</SHORT-NAME>
          <AR-PACKAGES>
            <AR-PACKAGE>
              <SHORT-NAME>ApplicationSoftwareComponents</SHORT-NAME>
            </AR-PACKAGE>
            <AR-PACKAGE>
              <SHORT-NAME>PortInterfaces</SHORT-NAME>
            </AR-PACKAGE>
          </AR-PACKAGES>
        </AR-PACKAGE>
        <AR-PACKAGE>
          <SHORT-NAME>System</SHORT-NAME>
          <AR-PACKAGES>
            <AR-PACKAGE>
              <SHORT-NAME>EcuComposition</SHORT-NAME>
            </AR-PACKAGE>
          </AR-PACKAGES>
        </AR-PACKAGE>`;
        
        createArxmlFile(packagesContent, 'packages.arxml');
    
        // Generate portinterfaces.arxml
        const portInterfacesContent = project.interfaces.map(iface => `    <AR-PACKAGE>
          <SHORT-NAME>PortInterfaces</SHORT-NAME>
          <ELEMENTS>
            <SENDER-RECEIVER-INTERFACE>
              <SHORT-NAME>${iface.name}</SHORT-NAME>
              <IS-SERVICE>false</IS-SERVICE>
              <DATA-ELEMENTS>
    ${iface.dataElements.map(de => `            <VARIABLE-DATA-PROTOTYPE>
                  <SHORT-NAME>${de.name}</SHORT-NAME>
                  <TYPE-TREF DEST="APPLICATION-PRIMITIVE-DATA-TYPE">/DataTypes/${de.applicationDataTypeRef}</TYPE-TREF>
                </VARIABLE-DATA-PROTOTYPE>`).join('\n')}
              </DATA-ELEMENTS>
            </SENDER-RECEIVER-INTERFACE>
          </ELEMENTS>
        </AR-PACKAGE>`).join('\n');
        
        createArxmlFile(portInterfacesContent, 'portinterfaces.arxml');
    
        // Generate individual SWC ARXML files (AUTOSAR 4.2.2 compliant)
        project.swcs.forEach(swc => {
          const runnables = swc.runnables || [];
          const ports = swc.ports || [];
          
          const swcContent = `    <AR-PACKAGE>
          <SHORT-NAME>ApplicationSoftwareComponents</SHORT-NAME>
          <ELEMENTS>
            <APPLICATION-SW-COMPONENT-TYPE>
              <SHORT-NAME>${swc.name}</SHORT-NAME>
              <CATEGORY>${swc.category}</CATEGORY>
              <PORTS>
    ${ports.map(port => `            <${port.direction === 'provided' ? 'P' : 'R'}-PORT-PROTOTYPE>
                  <SHORT-NAME>${port.name}</SHORT-NAME>
                  <PROVIDED-COM-SPECS>
                    <NONQUEUED-SENDER-COM-SPEC>
                      <DATA-ELEMENT-REF DEST="VARIABLE-DATA-PROTOTYPE">/ComponentTypes/PortInterfaces/${port.interfaceRef}/dataElement</DATA-ELEMENT-REF>
                      <USES-END-TO-END-PROTECTION>false</USES-END-TO-END-PROTECTION>
                    </NONQUEUED-SENDER-COM-SPEC>
                  </PROVIDED-COM-SPECS>
                  <PROVIDED-INTERFACE-TREF DEST="SENDER-RECEIVER-INTERFACE">/ComponentTypes/PortInterfaces/${port.interfaceRef}</PROVIDED-INTERFACE-TREF>
                </${port.direction === 'provided' ? 'P' : 'R'}-PORT-PROTOTYPE>`).join('\n')}
              </PORTS>
              <INTERNAL-BEHAVIORS>
                <SWC-INTERNAL-BEHAVIOR>
                  <SHORT-NAME>${swc.name}_InternalBehavior</SHORT-NAME>
                  <DATA-TYPE-MAPPING-REFS/>
                  <EVENTS>
    ${runnables.filter(r => r.period > 0).map(runnable => `                <TIMING-EVENT>
                      <SHORT-NAME>${runnable.name}_TimingEvent</SHORT-NAME>
                      <START-ON-EVENT-REF DEST="RUNNABLE-ENTITY">/ComponentTypes/ApplicationSoftwareComponents/${swc.name}/${swc.name}_InternalBehavior/${runnable.name}</START-ON-EVENT-REF>
                      <PERIOD>${runnable.period / 1000}</PERIOD>
                    </TIMING-EVENT>`).join('\n')}
                  </EVENTS>
                  <RUNNABLES>
    ${runnables.map(runnable => `                <RUNNABLE-ENTITY>
                      <SHORT-NAME>${runnable.name}</SHORT-NAME>
                      <DATA-READ-ACCESSS>
    ${runnable.accessPoints?.filter(ap => ap.type === 'iRead').map(ap => `                    <VARIABLE-ACCESS>
                          <SHORT-NAME>${ap.name}_Read</SHORT-NAME>
                          <ACCESSED-VARIABLE>
                            <AUTOSAR-VARIABLE-IREF>
                              <PORT-PROTOTYPE-REF DEST="R-PORT-PROTOTYPE">/ComponentTypes/ApplicationSoftwareComponents/${swc.name}/${ap.portRef}</PORT-PROTOTYPE-REF>
                              <TARGET-DATA-PROTOTYPE-REF DEST="VARIABLE-DATA-PROTOTYPE">/ComponentTypes/PortInterfaces/${ports.find(p => p.id === ap.portRef)?.interfaceRef}/${ap.dataElementRef}</TARGET-DATA-PROTOTYPE-REF>
                            </AUTOSAR-VARIABLE-IREF>
                          </ACCESSED-VARIABLE>
                        </VARIABLE-ACCESS>`).join('\n') || ''}
                      </DATA-READ-ACCESSS>
                      <DATA-WRITE-ACCESSS>
    ${runnable.accessPoints?.filter(ap => ap.type === 'iWrite').map(ap => `                    <VARIABLE-ACCESS>
                          <SHORT-NAME>${ap.name}_Write</SHORT-NAME>
                          <ACCESSED-VARIABLE>
                            <AUTOSAR-VARIABLE-IREF>
                              <PORT-PROTOTYPE-REF DEST="P-PORT-PROTOTYPE">/ComponentTypes/ApplicationSoftwareComponents/${swc.name}/${ap.portRef}</PORT-PROTOTYPE-REF>
                              <TARGET-DATA-PROTOTYPE-REF DEST="VARIABLE-DATA-PROTOTYPE">/ComponentTypes/PortInterfaces/${ports.find(p => p.id === ap.portRef)?.interfaceRef}/${ap.dataElementRef}</TARGET-DATA-PROTOTYPE-REF>
                            </AUTOSAR-VARIABLE-IREF>
                          </ACCESSED-VARIABLE>
                        </VARIABLE-ACCESS>`).join('\n') || ''}
                      </DATA-WRITE-ACCESSS>
                    </RUNNABLE-ENTITY>`).join('\n')}
                  </RUNNABLES>
                </SWC-INTERNAL-BEHAVIOR>
              </INTERNAL-BEHAVIORS>
            </APPLICATION-SW-COMPONENT-TYPE>
          </ELEMENTS>
        </AR-PACKAGE>`;
          
          createArxmlFile(swcContent, `${swc.name.toLowerCase()}.arxml`);
        });
    
        // Generate connections.arxml
        const connectionsContent = `    <AR-PACKAGE>
          <SHORT-NAME>System</SHORT-NAME>
          <AR-PACKAGES>
            <AR-PACKAGE>
              <SHORT-NAME>EcuComposition</SHORT-NAME>
              <ELEMENTS>
                <ECU-COMPOSITION>
                  <SHORT-NAME>EcuComposition</SHORT-NAME>
                  <CONNECTORS>
    ${project.connections?.map(conn => `                <ASSEMBLY-SW-CONNECTOR>
                      <SHORT-NAME>${conn.name}</SHORT-NAME>
                      <PROVIDER-IREF>
                        <CONTEXT-COMPONENT-REF DEST="SW-COMPONENT-PROTOTYPE">/System/EcuComposition/EcuComposition/${conn.providingComponent}</CONTEXT-COMPONENT-REF>
                        <TARGET-P-PORT-REF DEST="P-PORT-PROTOTYPE">/ComponentTypes/ApplicationSoftwareComponents/${conn.providingComponent}/${conn.providingPort}</TARGET-P-PORT-REF>
                      </PROVIDER-IREF>
                      <REQUESTER-IREF>
                        <CONTEXT-COMPONENT-REF DEST="SW-COMPONENT-PROTOTYPE">/System/EcuComposition/EcuComposition/${conn.requiringComponent}</CONTEXT-COMPONENT-REF>
                        <TARGET-R-PORT-REF DEST="R-PORT-PROTOTYPE">/ComponentTypes/ApplicationSoftwareComponents/${conn.requiringComponent}/${conn.requiringPort}</TARGET-R-PORT-REF>
                      </REQUESTER-IREF>
                    </ASSEMBLY-SW-CONNECTOR>`).join('\n') || ''}
                  </CONNECTORS>
                </ECU-COMPOSITION>
              </ELEMENTS>
            </AR-PACKAGE>
          </AR-PACKAGES>
        </AR-PACKAGE>`;
        
        createArxmlFile(connectionsContent, 'connections.arxml');
    
        // Generate constants.arxml
        const constantsContent = `    <AR-PACKAGE>
          <SHORT-NAME>DataTypes</SHORT-NAME>
          <AR-PACKAGES>
            <AR-PACKAGE>
              <SHORT-NAME>ApplicationDataTypes</SHORT-NAME>
              <ELEMENTS>
    ${project.dataTypes.map(dt => `            <APPLICATION-PRIMITIVE-DATA-TYPE>
                  <SHORT-NAME>${dt.name}</SHORT-NAME>
                  <CATEGORY>PRIMITIVE</CATEGORY>
                  <SW-DATA-DEF-PROPS>
                    <SW-DATA-DEF-PROPS-VARIANTS>
                      <SW-DATA-DEF-PROPS-CONDITIONAL>
                        <BASE-TYPE-REF DEST="SW-BASE-TYPE">/DataTypes/BaseTypes/${dt.baseType}</BASE-TYPE-REF>
                      </SW-DATA-DEF-PROPS-CONDITIONAL>
                    </SW-DATA-DEF-PROPS-VARIANTS>
                  </SW-DATA-DEF-PROPS>
                </APPLICATION-PRIMITIVE-DATA-TYPE>`).join('\n')}
              </ELEMENTS>
            </AR-PACKAGE>
          </AR-PACKAGES>
        </AR-PACKAGE>`;
        
        createArxmlFile(constantsContent, 'constants.arxml');
    
        // Generate systemextract.arxml
        const systemExtractContent = `    <AR-PACKAGE>
          <SHORT-NAME>System</SHORT-NAME>
          <AR-PACKAGES>
            <AR-PACKAGE>
              <SHORT-NAME>EcuComposition</SHORT-NAME>
              <ELEMENTS>
                <ECU-COMPOSITION>
                  <SHORT-NAME>EcuComposition</SHORT-NAME>
                  <COMPONENTS>
    ${project.swcs.map(swc => `                <SW-COMPONENT-PROTOTYPE>
                      <SHORT-NAME>${swc.name}</SHORT-NAME>
                      <TYPE-TREF DEST="APPLICATION-SW-COMPONENT-TYPE">/ComponentTypes/ApplicationSoftwareComponents/${swc.name}</TYPE-TREF>
                    </SW-COMPONENT-PROTOTYPE>`).join('\n')}
                  </COMPONENTS>
                </ECU-COMPOSITION>
              </ELEMENTS>
            </AR-PACKAGE>
          </AR-PACKAGES>
        </AR-PACKAGE>`;
        
        createArxmlFile(systemExtractContent, 'systemextract.arxml');
    
        console.log('Multiple ARXML files exported successfully');
      },
    }),
    {
      name: 'autosar-storage',
      onRehydrateStorage: () => {
        console.log('Hydrating the store...');
        return (state, error) => {
          if (!state) {
            console.log('No state to rehydrate.');
            return;
          }

          if (error) {
            console.log('An error happened during rehydration:', error);
          } else {
            console.log('Rehydration Success!');
          }

          // After rehydration, start auto-saving
          state.autoSave();
        };
      }
    }
  )
);
