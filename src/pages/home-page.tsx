import { useAppDispatch } from '../store/hooks';
import { projectsActions } from '../features/projects/store/projectsSlice';
import { useProjects } from '../features/projects/hooks/useProjects';
import { Button } from '../components/atoms/button';
import { MainLayout } from '../components/templates/main-layout';
import type { Project } from '../types';
import { TimeSignature, AudioQuality } from '../types/enums';
import styles from './HomePage.module.css';

export const HomePage = () => {
  const dispatch = useAppDispatch();
  const { projects } = useProjects();

  const handleCreateProject = () => {
    dispatch(projectsActions.createProjectRequest({
      name: `Untitled Project ${Date.now()}`,
      tempo: 120,
      timeSignature: TimeSignature.FOUR_FOUR,
      audioQuality: AudioQuality.MID,
    }));
  };

  return (
    <MainLayout
      title="🎵 Musicalist"
      onSettings={() => {
        // Navigate to settings
      }}
    >
      <div className={styles.container}>
        <section className={styles.hero}>
          <h1>Welcome to Musicalist</h1>
          <p>Create interactive musical scores for your students</p>
          <Button variant="primary" size="large" onClick={handleCreateProject}>
            ✨ Create New Project
          </Button>
        </section>

        {projects.length > 0 && (
          <section className={styles.projects}>
            <h2>Recent Projects</h2>
            <div className={styles.projectGrid}>
              {projects.map((project: Project) => (
                <div key={project.id} className={styles.projectCard}>
                  <h3>{project.name}</h3>
                  <div className={styles.metadata}>
                    <span>{project.pianoStaves.length} staves</span>
                    <span>•</span>
                    <span>{project.tempo} BPM</span>
                    <span>•</span>
                    <span>{project.timeSignature}</span>
                  </div>
                  <div className={styles.actions}>
                    <Button variant="primary" size="small">
                      Edit
                    </Button>
                    <Button variant="secondary" size="small">
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className={styles.info}>
          <h2>Getting Started</h2>
          <ul>
            <li>Create a new project or open an existing one</li>
            <li>Add notes to the staff using the editor</li>
            <li>Customize colors for different note categories</li>
            <li>Playback with synchronized audio</li>
            <li>Export to video (MP4 at multiple quality levels)</li>
          </ul>
        </section>
      </div>
    </MainLayout>
  );
};
