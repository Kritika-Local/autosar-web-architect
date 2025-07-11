
import { v4 as uuidv4 } from 'uuid';
import { RequirementDocument } from './requirementParser';

// Import types from the store to ensure proper typing
interface DataElement {
  id: string;
  name: string;
  type: string;
  category: string;
}

interface Interface {
  id: string;
  name: string;
  type: 'SenderReceiver' | 'ClientServer' | 'ModeSwitch' | 'Parameter' | 'Trigger';
  dataElements: DataElement[];
  description?: string;
}

interface Swc {
  id: string;
  name: string;
  category: 'Application' | 'Sensor' | 'Actuator' | 'Composition' | 'Service';
  description?: string;
  ports: string[];
  runnables: string[];
  accessPoints: string[];
}

interface Port {
  id: string;
  name: string;
  direction: 'provided' | 'required';
  interfaceRef: string;
  swcRef: string;
  description?: string;
}

interface Runnable {
  id: string;
  name: string;
  swcRef: string;
  runnableType: 'init' | 'periodic' | 'event';
  period?: number;
  description?: string;
}

interface AccessPoint {
  id: string;
  name: string;
  type: 'read' | 'write' | 'call' | 'result';
  portRef: string;
  runnableRef: string;
  dataElementRef: string;
  description?: string;
}

export interface GeneratedArtifacts {
  swcs: Swc[];
  interfaces: Interface[];
  ports: Port[];
  runnables: Runnable[];
  accessPoints: AccessPoint[];
}

export class AutosarGenerator {
  static generateArtifacts(requirements: RequirementDocument[]): GeneratedArtifacts {
    console.info('Starting AUTOSAR artifact generation for', requirements.length, 'requirements');
    
    const artifacts: GeneratedArtifacts = {
      swcs: [],
      interfaces: [],
      ports: [],
      runnables: [],
      accessPoints: []
    };

    requirements.forEach(req => {
      console.info('Processing requirement:', req.id, '-', req.shortName);
      
      // Generate SWCs
      req.derivedElements.swcs.forEach(swcName => {
        if (!artifacts.swcs.find(s => s.name === swcName)) {
          const swc: Swc = {
            id: uuidv4(),
            name: swcName,
            category: this.determineSWCCategory(swcName),
            description: `Generated from requirement ${req.id}`,
            ports: [],
            runnables: [],
            accessPoints: []
          };
          artifacts.swcs.push(swc);
          console.info('Created SWC:', swcName);
        }
      });

      // Generate Interfaces
      req.derivedElements.interfaces.forEach(ifaceName => {
        if (!artifacts.interfaces.find(i => i.name === ifaceName)) {
          const dataElements: DataElement[] = req.communication?.dataElements.map(de => ({
            id: uuidv4(),
            name: de.name,
            type: de.type,
            category: de.category || 'VALUE'
          })) || req.derivedElements.signals.map(signal => ({
            id: uuidv4(),
            name: signal,
            type: 'uint16',
            category: 'VALUE'
          }));

          const iface: Interface = {
            id: uuidv4(),
            name: ifaceName,
            type: req.communication?.interfaceType || 'SenderReceiver',
            dataElements,
            description: `Generated from requirement ${req.id}`
          };
          artifacts.interfaces.push(iface);
          console.info('Created Interface:', ifaceName, 'with', dataElements.length, 'data elements');
        }
      });

      // Generate Runnables
      req.derivedElements.runnables?.forEach(runnableName => {
        const swcName = req.derivedElements.swcs.find(swc => runnableName.startsWith(swc));
        if (swcName) {
          const runnable: Runnable = {
            id: uuidv4(),
            name: runnableName,
            swcRef: swcName,
            runnableType: runnableName.includes('init') ? 'init' : 'periodic',
            period: req.timing?.period || (runnableName.includes('init') ? undefined : 10),
            description: `Generated from requirement ${req.id}`
          };
          artifacts.runnables.push(runnable);
          console.info('Created', runnable.runnableType === 'init' ? 'Init' : 'Timing', 'Runnable:', runnableName, 
                      runnable.runnableType === 'periodic' ? `(periodic, ${runnable.period}ms)` : '', 'for SWC:', swcName);
        }
      });

      // Generate Ports
      req.derivedElements.ports?.forEach((portName, index) => {
        const swcName = req.derivedElements.swcs[index < req.derivedElements.swcs.length ? index : 0];
        const interfaceName = req.derivedElements.interfaces[0];
        
        if (swcName && interfaceName) {
          const port: Port = {
            id: uuidv4(),
            name: portName,
            direction: portName.startsWith('P_') ? 'provided' : 'required',
            interfaceRef: interfaceName,
            swcRef: swcName,
            description: `Generated from requirement ${req.id}`
          };
          artifacts.ports.push(port);
          console.info('Created', port.direction === 'provided' ? 'P-Port' : 'R-Port', ':', portName, 
                      port.direction === 'provided' ? 'for Sender' : 'for Receiver', 'SWC:', swcName);
        }
      });

      // Generate Access Points
      req.derivedElements.signals.forEach(signal => {
        const interfaceName = req.derivedElements.interfaces[0];
        const interface_obj = artifacts.interfaces.find(i => i.name === interfaceName);
        const dataElement = interface_obj?.dataElements.find(de => de.name.toLowerCase().includes(signal.toLowerCase()));
        
        if (dataElement) {
          req.derivedElements.swcs.forEach((swcName, swcIndex) => {
            const runnables = artifacts.runnables.filter(r => r.swcRef === swcName && r.runnableType === 'periodic');
            const ports = artifacts.ports.filter(p => p.swcRef === swcName);
            
            runnables.forEach(runnable => {
              ports.forEach(port => {
                const accessType = port.direction === 'provided' ? 'write' : 'read';
                const accessPoint: AccessPoint = {
                  id: uuidv4(),
                  name: `Rte_${accessType === 'write' ? 'Write' : 'Read'}_${port.name}_${dataElement.name}`,
                  type: accessType,
                  portRef: port.id,
                  runnableRef: runnable.id,
                  dataElementRef: dataElement.id,
                  description: `Generated from requirement ${req.id}`
                };
                artifacts.accessPoints.push(accessPoint);
                console.info('Created', accessType === 'write' ? 'Write' : 'Read', 'Access Point:', accessPoint.name, 'for', runnable.name, 'in SWC:', swcName);
              });
            });
          });
        }
      });
    });

    console.info('Generated artifacts:', {
      swcs: artifacts.swcs.length,
      interfaces: artifacts.interfaces.length,
      ports: artifacts.ports.length,
      runnables: artifacts.runnables.length,
      accessPoints: artifacts.accessPoints.length
    });

    return artifacts;
  }

  static integrateArtifactsIntoStore(artifacts: GeneratedArtifacts, store: any) {
    console.info('🚀 Starting enhanced artifacts integration with GUI synchronization...');
    
    try {
      // Add interfaces first (they're referenced by ports)
      artifacts.interfaces.forEach(iface => {
        store.getState().interfaces.push({
          ...iface,
          projectId: store.getState().currentProject?.id || ''
        });
        console.info('✅ Created and linked Interface:', iface.name, 'with', iface.dataElements.length, 'data elements');
      });

      // Add SWCs
      artifacts.swcs.forEach(swc => {
        store.getState().swcs.push({
          ...swc,
          projectId: store.getState().currentProject?.id || ''
        });
        console.info('✅ Created SWC container:', swc.name);
      });

      // Add ports
      artifacts.ports.forEach(port => {
        store.getState().ports.push({
          ...port,
          projectId: store.getState().currentProject?.id || ''
        });
      });

      // Add runnables
      artifacts.runnables.forEach(runnable => {
        store.getState().runnables.push({
          ...runnable,
          projectId: store.getState().currentProject?.id || ''
        });
      });

      // Add access points
      artifacts.accessPoints.forEach(ap => {
        store.getState().accessPoints.push({
          ...ap,
          projectId: store.getState().currentProject?.id || ''
        });
      });

      // Create ECU Composition if we have SWCs
      if (artifacts.swcs.length > 0) {
        const ecuComposition = {
          id: uuidv4(),
          name: 'SystemECUComposition',
          swcInstances: artifacts.swcs.map(swc => ({
            id: uuidv4(),
            name: swc.name + '_Instance',
            swcRef: swc.id,
            ecuRef: 'MainECU'
          })),
          projectId: store.getState().currentProject?.id || ''
        };
        
        store.getState().ecuCompositions.push(ecuComposition);
        console.info('✅ Created ECU Composition:', ecuComposition.name, 'with', ecuComposition.swcInstances.length, 'linked instances');
      }

      // Force store update by calling the store's update method
      console.info('🔄 Forcing GUI synchronization across all menus...');
      
      // Trigger store update
      store.setState(store.getState());
      
      // Also dispatch custom event for additional GUI updates
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('autosar-refresh'));
        console.info('✅ Project refresh triggered');
      }, 100);

    } catch (error) {
      console.error('❌ Error during artifacts integration:', error);
      throw error;
    }
  }

  private static determineSWCCategory(swcName: string): 'Application' | 'Sensor' | 'Actuator' | 'Composition' | 'Service' {
    const name = swcName.toLowerCase();
    if (name.includes('sensor')) return 'Sensor';
    if (name.includes('actuator') || name.includes('injector')) return 'Actuator';
    if (name.includes('composition')) return 'Composition';
    if (name.includes('service')) return 'Service';
    return 'Application';
  }
}
