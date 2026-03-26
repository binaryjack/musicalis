import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  selectAllProjects,
  selectCurrentProject,
  selectProjectsLoading,
  selectProjectListForUI,
  selectProjectsError,
} from '../store/projectsSelectors';
import { projectsActions } from '../store/projectsSlice';
import type { Project } from '../../../types';

/**
 * Custom hook for projects feature
 * Provides access to projects state and actions
 */
export const useProjects = () => {
  const dispatch = useAppDispatch();
  const projects = useAppSelector(selectAllProjects);
  const currentProject = useAppSelector(selectCurrentProject);
  const loading = useAppSelector(selectProjectsLoading);
  const projectListUI = useAppSelector(selectProjectListForUI);
  const error = useAppSelector(selectProjectsError);

  return {
    // State
    projects,
    currentProject,
    loading,
    projectListUI,
    error,

    // Actions
    createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) =>
      dispatch(projectsActions.createProjectRequest(project as any)), // Type assertion needed for payload
    updateProject: (id: string, updates: Partial<Project>) =>
      dispatch(projectsActions.updateProjectRequest({ id, updates })),
    deleteProject: (id: string) =>
      dispatch(projectsActions.deleteProjectRequest(id)),
    setCurrentProject: (id: string) =>
      dispatch(projectsActions.setCurrentProject(id)),
    editSnapPoint: (actionType: string) =>
      dispatch(projectsActions.editSnapPoint(actionType)),
  };
};
