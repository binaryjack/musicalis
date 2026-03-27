interface EditorPageProps {
  projectId?: string;
}

export const EditorPage = ({ projectId }: EditorPageProps) => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Music Editor</h1>
      <p>Project ID: {projectId}</p>
      <p>This is a simple test page to verify the app is loading.</p>
      
      <div style={{ 
        border: '1px solid #ccc', 
        padding: '20px', 
        margin: '20px 0',
        backgroundColor: '#f9f9f9'
      }}>
        <h2>Status Check</h2>
        <p>✅ React is working</p>
        <p>✅ Component is rendering</p>
        <p>✅ Props are being passed</p>
      </div>
      
      <button 
        onClick={() => alert('Button works!')}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007acc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Test Button
      </button>
    </div>
  );
};