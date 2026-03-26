type ProjectsState = {
  readonly items: readonly unknown[];
  readonly loading: boolean;
  readonly error: string;
};

type ProjectsActions = {
  readonly loadProjects: () => Promise<void>;
  readonly createProject: (name: string, tempo: number) => Promise<void>;
};

type StorageAdapter = {
  readonly load: (key: string) => Promise<unknown>;
  readonly save: (key: string, data: unknown) => Promise<void>;
};

export const createProjects = function(this: any, 
  storage: StorageAdapter,
  initialState: ProjectsState
) {
  let currentState = initialState;
  const listeners = new Set<(state: ProjectsState) => void>();
  const storageKey = 'musicalist-projects';
  
  const notify = function() {
    listeners.forEach(listener => listener(currentState));
  };
  
  const actions: ProjectsActions = Object.freeze({
    loadProjects: async function() {
      currentState = {
        ...currentState,
        loading: true,
        error: '',
      };
      notify();
      
      try {
        const data = await storage.load(storageKey);
        const projects = Array.isArray(data) ? data : [];
        
        currentState = {
          ...currentState,
          items: projects,
          loading: false,
        };
      } catch (error) {
        currentState = {
          ...currentState,
          loading: false,
          error: error instanceof Error ? error.message : 'Load failed',
        };
      }
      
      notify();
    },
    
    createProject: async function(name: string, tempo: number) {
      const newProject = {
        id: `project-${Date.now()}`,
        name,
        tempo,
        createdAt: Date.now(),
      };
      
      const updatedItems = [...currentState.items, newProject];
      
      try {
        await storage.save(storageKey, updatedItems);
        currentState = {
          ...currentState,
          items: updatedItems,
        };
        notify();
      } catch (error) {
        currentState = {
          ...currentState,
          error: error instanceof Error ? error.message : 'Create failed',
        };
        notify();
      }
    },
  });
  
  Object.defineProperty(this, 'state', {
    get: () => currentState,
    enumerable: false,
  });
  
  Object.defineProperty(this, 'actions', {
    value: actions,
    enumerable: false,
    writable: false,
  });
  
  Object.defineProperty(this, 'subscribe', {
    value: function(listener: (state: ProjectsState) => void) {
      listeners.add(listener);
      return function() {
        listeners.delete(listener);
      };
    },
    enumerable: false,
    writable: false,
  });
  
  return Object.freeze(this);
};