const fs = require('fs');
const content = \import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { MainLayout } from './components/templates/main-layout';
import './App.css';

function App() {
  return (
    <Provider store={store}>
      <MainLayout
        title="?? Music Scoring Tool"
        headerRight={<p style={{ margin: 0, fontSize: '12px' }}>v1.0.0 — Development</p>}
      >
        <section style={{ padding: '24px' }}>
          <h2>Welcome to Musicalist</h2>
          <p>Create interactive musical scores for your students with synchronized playback.</p>
        </section>
      </MainLayout>
    </Provider>
  );
}

export default App;\;
fs.writeFileSync('src/App.tsx', content, { encoding: 'utf8' });
