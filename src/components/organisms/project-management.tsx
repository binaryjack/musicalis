import { useState, useCallback } from 'react';

export interface ProjectManagementProps {
  currentProject?: Project;
  projects: Project[];
  onProjectCreate: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onProjectOpen: (projectId: string) => void;
  onProjectSave: (projectId: string, data: Partial<Project>) => void;
  onProjectDelete: (projectId: string) => void;
  onProjectExport: (projectId: string, format: ExportFormat) => void;
  onProjectImport: (file: File) => void;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  duration: number;
  bpm: number;
  keySignature: string;
  timeSignature: string;
  staffCount: number;
  barCount: number;
  noteCount: number;
  tags: string[];
  isStarred: boolean;
  thumbnail?: string;
  size: number; // in bytes
  lastOpened?: Date;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  staffCount: number;
  bpm: number;
  keySignature: string;
  timeSignature: string;
  tags: string[];
}

export type ExportFormat = 'json' | 'midi' | 'musicxml' | 'pdf';

const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'piano-solo',
    name: 'Piano Solo',
    description: 'Single grand staff for piano compositions',
    thumbnail: '🎹',
    staffCount: 2,
    bpm: 120,
    keySignature: 'C major',
    timeSignature: '4/4',
    tags: ['piano', 'solo']
  },
  {
    id: 'violin-piano',
    name: 'Violin & Piano',
    description: 'Violin melody with piano accompaniment',
    thumbnail: '🎻',
    staffCount: 3,
    bpm: 100,
    keySignature: 'G major',
    timeSignature: '4/4',
    tags: ['violin', 'piano', 'duo']
  },
  {
    id: 'string-quartet',
    name: 'String Quartet',
    description: 'Two violins, viola, and cello',
    thumbnail: '🎼',
    staffCount: 4,
    bpm: 80,
    keySignature: 'D major',
    timeSignature: '3/4',
    tags: ['strings', 'quartet']
  },
  {
    id: 'jazz-ensemble',
    name: 'Jazz Ensemble',
    description: 'Piano, bass, drums, and melody',
    thumbnail: '🎷',
    staffCount: 4,
    bpm: 140,
    keySignature: 'Bb major',
    timeSignature: '4/4',
    tags: ['jazz', 'ensemble']
  }
];

export const ProjectManagement = function(props: ProjectManagementProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    bpm: 120,
    keySignature: 'C major',
    timeSignature: '4/4',
    staffCount: 2,
    tags: [] as string[]
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'updatedAt' | 'createdAt' | 'size'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  
  const allTags = Array.from(new Set(props.projects.flatMap(p => p.tags)));
  
  const filteredProjects = props.projects.filter(project => {
    const matchesSearch = !searchQuery || 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTags = filterTags.length === 0 || 
      filterTags.every(tag => project.tags.includes(tag));
    
    return matchesSearch && matchesTags;
  }).sort((a, b) => {
    const modifier = sortOrder === 'asc' ? 1 : -1;
    
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title) * modifier;
      case 'createdAt':
        return (a.createdAt.getTime() - b.createdAt.getTime()) * modifier;
      case 'updatedAt':
        return (a.updatedAt.getTime() - b.updatedAt.getTime()) * modifier;
      case 'size':
        return (a.size - b.size) * modifier;
      default:
        return 0;
    }
  });
  
  const handleCreateProject = useCallback(() => {
    if (!newProject.title.trim()) return;
    
    const projectData = selectedTemplate ? {
      ...newProject,
      staffCount: selectedTemplate.staffCount,
      bpm: selectedTemplate.bpm,
      keySignature: selectedTemplate.keySignature,
      timeSignature: selectedTemplate.timeSignature,
      tags: [...newProject.tags, ...selectedTemplate.tags],
      duration: 0,
      barCount: 1,
      noteCount: 0,
      isStarred: false,
      size: 1024 // Initial size estimate
    } : {
      ...newProject,
      duration: 0,
      barCount: 1,
      noteCount: 0,
      isStarred: false,
      size: 1024 // Initial size estimate
    };
    
    props.onProjectCreate(projectData);
    
    setShowCreateDialog(false);
    setShowTemplateDialog(false);
    setSelectedTemplate(null);
    setNewProject({
      title: '',
      description: '',
      bpm: 120,
      keySignature: 'C major',
      timeSignature: '4/4',
      staffCount: 2,
      tags: []
    });
  }, [newProject, selectedTemplate, props]);
  
  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };
  
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  return (
    <div style={{
      width: '100%',
      maxWidth: 1200,
      margin: '0 auto',
      padding: 20,
      backgroundColor: '#f8f9fa'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 8,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: 24, fontWeight: 'bold' }}>
            📁 Project Management
          </h2>
          <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
            {props.projects.length} projects • {props.currentProject ? `Editing: ${props.currentProject.title}` : 'No project open'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setShowTemplateDialog(true)}
            style={{
              padding: '10px 16px',
              fontSize: 14,
              fontWeight: 'bold',
              border: '1px solid #007bff',
              borderRadius: 6,
              backgroundColor: '#007bff',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            📄 New from Template
          </button>
          
          <button
            onClick={() => setShowCreateDialog(true)}
            style={{
              padding: '10px 16px',
              fontSize: 14,
              fontWeight: 'bold',
              border: '1px solid #28a745',
              borderRadius: 6,
              backgroundColor: '#28a745',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            ➕ New Project
          </button>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div style={{
        display: 'flex',
        gap: 16,
        marginBottom: 20,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: 8,
              fontSize: 14,
              border: '1px solid #dee2e6',
              borderRadius: 4
            }}
          />
        </div>
        
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            style={{ padding: 8, fontSize: 12, border: '1px solid #dee2e6', borderRadius: 4 }}
          >
            <option value="updatedAt">Last Modified</option>
            <option value="createdAt">Created Date</option>
            <option value="title">Title</option>
            <option value="size">File Size</option>
          </select>
        </div>
        
        <div>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            style={{
              padding: 8,
              fontSize: 12,
              border: '1px solid #6c757d',
              borderRadius: 4,
              backgroundColor: '#f8f9fa',
              cursor: 'pointer'
            }}
          >
            {sortOrder === 'asc' ? '📈' : '📉'}
          </button>
        </div>
      </div>
      
      {/* Tag Filters */}
      {allTags.length > 0 && (
        <div style={{
          marginBottom: 20,
          padding: 16,
          backgroundColor: '#fff',
          borderRadius: 8,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 8, color: '#666' }}>
            Filter by tags:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => {
                  setFilterTags(prev => 
                    prev.includes(tag) 
                      ? prev.filter(t => t !== tag)
                      : [...prev, tag]
                  );
                }}
                style={{
                  padding: '4px 8px',
                  fontSize: 11,
                  border: '1px solid #dee2e6',
                  borderRadius: 12,
                  backgroundColor: filterTags.includes(tag) ? '#007bff' : '#f8f9fa',
                  color: filterTags.includes(tag) ? 'white' : '#495057',
                  cursor: 'pointer'
                }}
              >
                {tag}
              </button>
            ))}
            {filterTags.length > 0 && (
              <button
                onClick={() => setFilterTags([])}
                style={{
                  padding: '4px 8px',
                  fontSize: 11,
                  border: '1px solid #dc3545',
                  borderRadius: 12,
                  backgroundColor: '#dc3545',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Projects Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 20
      }}>
        {filteredProjects.map(project => (
          <div
            key={project.id}
            style={{
              backgroundColor: '#fff',
              borderRadius: 8,
              padding: 16,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: props.currentProject?.id === project.id ? '2px solid #007bff' : '1px solid #e9ecef',
              cursor: 'pointer'
            }}
            onClick={() => props.onProjectOpen(project.id)}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 12
            }}>
              <h3 style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 'bold',
                color: '#333'
              }}>
                {project.isStarred && '⭐'} {project.title}
              </h3>
              
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onProjectSave(project.id, { isStarred: !project.isStarred });
                  }}
                  style={{
                    padding: 4,
                    fontSize: 12,
                    border: 'none',
                    borderRadius: 4,
                    backgroundColor: 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  {project.isStarred ? '⭐' : '☆'}
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onProjectDelete(project.id);
                  }}
                  style={{
                    padding: 4,
                    fontSize: 12,
                    border: 'none',
                    borderRadius: 4,
                    backgroundColor: 'transparent',
                    color: '#dc3545',
                    cursor: 'pointer'
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
            
            {project.description && (
              <p style={{
                margin: '0 0 12px 0',
                fontSize: 13,
                color: '#666',
                lineHeight: 1.4
              }}>
                {project.description}
              </p>
            )}
            
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              marginBottom: 12,
              fontSize: 11,
              color: '#666'
            }}>
              <div>📊 {project.staffCount} staff{project.staffCount !== 1 ? 's' : ''}</div>
              <div>📏 {project.barCount} bars</div>
              <div>🎵 {project.noteCount} notes</div>
              <div>⏱️ {formatDuration(project.duration)}</div>
              <div>🎹 {project.bpm} BPM</div>
              <div>🎼 {project.keySignature}</div>
            </div>
            
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 4,
              marginBottom: 12
            }}>
              {project.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  style={{
                    padding: '2px 6px',
                    fontSize: 10,
                    backgroundColor: '#e9ecef',
                    color: '#495057',
                    borderRadius: 8
                  }}
                >
                  {tag}
                </span>
              ))}
              {project.tags.length > 3 && (
                <span style={{
                  padding: '2px 6px',
                  fontSize: 10,
                  backgroundColor: '#e9ecef',
                  color: '#495057',
                  borderRadius: 8
                }}>
                  +{project.tags.length - 3} more
                </span>
              )}
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 10,
              color: '#999'
            }}>
              <div>{formatFileSize(project.size)}</div>
              <div>Modified {formatDate(project.updatedAt)}</div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredProjects.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 40,
          color: '#666'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
          <div style={{ fontSize: 18, marginBottom: 8 }}>No projects found</div>
          <div style={{ fontSize: 14 }}>
            {searchQuery || filterTags.length > 0 ? 'Try adjusting your search or filters' : 'Create your first project to get started'}
          </div>
        </div>
      )}
      
      {/* Template Selection Dialog */}
      {showTemplateDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 8,
            padding: 24,
            width: 600,
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18 }}>
              Choose a Template
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 16,
              marginBottom: 24
            }}>
              {PROJECT_TEMPLATES.map(template => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  style={{
                    padding: 16,
                    border: selectedTemplate?.id === template.id ? '2px solid #007bff' : '1px solid #dee2e6',
                    borderRadius: 8,
                    backgroundColor: selectedTemplate?.id === template.id ? '#e3f2fd' : '#f8f9fa',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    fontSize: 32,
                    textAlign: 'center',
                    marginBottom: 8
                  }}>
                    {template.thumbnail}
                  </div>
                  
                  <h4 style={{ margin: '0 0 4px 0', fontSize: 14, fontWeight: 'bold' }}>
                    {template.name}
                  </h4>
                  
                  <p style={{ margin: '0 0 8px 0', fontSize: 12, color: '#666' }}>
                    {template.description}
                  </p>
                  
                  <div style={{ fontSize: 10, color: '#666' }}>
                    {template.staffCount} staves • {template.bpm} BPM • {template.keySignature}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12
            }}>
              <button
                onClick={() => {
                  setShowTemplateDialog(false);
                  setSelectedTemplate(null);
                }}
                style={{
                  padding: '8px 16px',
                  fontSize: 14,
                  border: '1px solid #6c757d',
                  borderRadius: 4,
                  backgroundColor: '#6c757d',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={() => {
                  if (selectedTemplate) {
                    setNewProject(prev => ({
                      ...prev,
                      title: `New ${selectedTemplate.name}`,
                      staffCount: selectedTemplate.staffCount,
                      bpm: selectedTemplate.bpm,
                      keySignature: selectedTemplate.keySignature,
                      timeSignature: selectedTemplate.timeSignature,
                      tags: selectedTemplate.tags
                    }));
                    setShowTemplateDialog(false);
                    setShowCreateDialog(true);
                  }
                }}
                disabled={!selectedTemplate}
                style={{
                  padding: '8px 16px',
                  fontSize: 14,
                  border: '1px solid #007bff',
                  borderRadius: 4,
                  backgroundColor: selectedTemplate ? '#007bff' : '#6c757d',
                  color: 'white',
                  cursor: selectedTemplate ? 'pointer' : 'not-allowed'
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Create Project Dialog */}
      {showCreateDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 8,
            padding: 24,
            width: 500
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18 }}>
              {selectedTemplate ? `Create ${selectedTemplate.name}` : 'Create New Project'}
            </h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 'bold' }}>
                Project Title:
              </label>
              <input
                type="text"
                value={newProject.title}
                onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                style={{
                  width: '100%',
                  padding: 8,
                  fontSize: 14,
                  border: '1px solid #dee2e6',
                  borderRadius: 4
                }}
                placeholder="My New Composition"
                autoFocus
              />
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 'bold' }}>
                Description (optional):
              </label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                style={{
                  width: '100%',
                  height: 80,
                  padding: 8,
                  fontSize: 14,
                  border: '1px solid #dee2e6',
                  borderRadius: 4,
                  resize: 'vertical'
                }}
                placeholder="A brief description of your composition..."
              />
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              marginBottom: 16
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 'bold' }}>
                  BPM:
                </label>
                <input
                  type="number"
                  min="40"
                  max="200"
                  value={newProject.bpm}
                  onChange={(e) => setNewProject(prev => ({ ...prev, bpm: parseInt(e.target.value) || 120 }))}
                  style={{
                    width: '100%',
                    padding: 8,
                    fontSize: 14,
                    border: '1px solid #dee2e6',
                    borderRadius: 4
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 'bold' }}>
                  Staff Count:
                </label>
                <input
                  type="number"
                  min="1"
                  max="16"
                  value={newProject.staffCount}
                  onChange={(e) => setNewProject(prev => ({ ...prev, staffCount: parseInt(e.target.value) || 2 }))}
                  style={{
                    width: '100%',
                    padding: 8,
                    fontSize: 14,
                    border: '1px solid #dee2e6',
                    borderRadius: 4
                  }}
                />
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12
            }}>
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setSelectedTemplate(null);
                  setNewProject({
                    title: '',
                    description: '',
                    bpm: 120,
                    keySignature: 'C major',
                    timeSignature: '4/4',
                    staffCount: 2,
                    tags: []
                  });
                }}
                style={{
                  padding: '8px 16px',
                  fontSize: 14,
                  border: '1px solid #6c757d',
                  borderRadius: 4,
                  backgroundColor: '#6c757d',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={handleCreateProject}
                disabled={!newProject.title.trim()}
                style={{
                  padding: '8px 16px',
                  fontSize: 14,
                  border: '1px solid #28a745',
                  borderRadius: 4,
                  backgroundColor: newProject.title.trim() ? '#28a745' : '#6c757d',
                  color: 'white',
                  cursor: newProject.title.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};