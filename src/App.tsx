import { useState } from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { EditorPage } from './pages/editor-page-clean';
import { SettingsPage } from './pages/settings-page';

type Page = 'editor' | 'settings';

function App() {
  const [page, setPage] = useState<Page>('editor');

  return (
    <Provider store={store}>
      {page === 'editor' && <EditorPage onSettings={() => setPage('settings')} />}
      {page === 'settings' && <SettingsPage onBack={() => setPage('editor')} />}
    </Provider>
  );
}

export default App;
