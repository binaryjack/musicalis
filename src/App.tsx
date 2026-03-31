import { Provider } from 'react-redux';
import { store } from './store/store';
import { EditorPage } from './pages/editor-page-clean';

function App() {
  return (
    <Provider store={store}>
      <EditorPage />
    </Provider>
  );
}

export default App;
