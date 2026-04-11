import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./lib/firebase"; // <-- Instancia Firebase Client globalmente
import Layout from "./components/Layout";
import Viewer from "./pages/Viewer";
import SubmitFasta from "./pages/SubmitFasta";
import JobsList from "./pages/JobsList";
import Landing from "./pages/Landing";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pórtico comercial bloqueador */}
        <Route path="/" element={<Landing />} />
        
        {/* Zona de trabajo científica */}
        <Route path="/app" element={<Layout />}>
          <Route index element={<Viewer />} />
          <Route path="submit" element={<SubmitFasta />} />
          <Route path="jobs" element={<JobsList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
