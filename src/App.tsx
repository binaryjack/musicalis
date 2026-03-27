import { useState } from "react";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { EditorPage } from "./pages";
import { HomePage } from "./pages";
import { SettingsPage } from "./pages";
import "./App.css";

function App() {
  const [route, setRoute] = useState("editor");

  return (
    <Provider store={store}>
      <div data-testid="app-container">
        {route === "home" && <HomePage />}
        {route === "editor" && <EditorPage projectId="123" />}
        {route === "settings" && <SettingsPage />}
        
        {/* Temporary Navigation for Dev */}
        <div style={{ position: "fixed", bottom: 10, right: 10, background: "#333", padding: 10, borderRadius: 8, display: "flex", gap: 10, zIndex: 9999 }}>
          <button 
            data-testid="nav-home-button"
            onClick={() => setRoute("home")} 
            style={{background: route === "home" ? "#555" : "#222", color: "white", padding: "5px 10px", border: "none", borderRadius: 4, cursor: "pointer"}}
          >
            Home
          </button>
          <button 
            data-testid="nav-editor-button"
            onClick={() => setRoute("editor")} 
            style={{background: route === "editor" ? "#555" : "#222", color: "white", padding: "5px 10px", border: "none", borderRadius: 4, cursor: "pointer"}}
          >
            Editor
          </button>
          <button 
            data-testid="nav-settings-button"
            onClick={() => setRoute("settings")} 
            style={{background: route === "settings" ? "#555" : "#222", color: "white", padding: "5px 10px", border: "none", borderRadius: 4, cursor: "pointer"}}
          >
            Settings
          </button>
        </div>
      </div>
    </Provider>
  );
}

export default App;
