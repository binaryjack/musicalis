import { useEffect } from 'react';
import { useProject } from '../hooks/useProject';
import { EditorWorkspace } from './editor-workspace-shell';

interface EditorPageProps {
  onSettings?: () => void;
}

export const EditorPage = ({ onSettings }: EditorPageProps) => {
  const project = useProject();

  useEffect(() => {
    if (!project.currentProject && !project.isLoading) {
      project.createProject('New Composition');
    }
  }, [project]);

  if (project.isLoading) {
    return <div style={{color: '#fff', padding: '20px'}}>Loading project...</div>;
  }

  if (project.error) {
    return <div style={{color: '#ff6b6b', padding: '20px'}}>Error: {project.error}</div>;
  }

  if (!project.currentProject) {
    return <div style={{color: '#fff', padding: '20px'}}>No project loaded...</div>;
  }

  return <EditorWorkspace onSettings={onSettings} />;
};
