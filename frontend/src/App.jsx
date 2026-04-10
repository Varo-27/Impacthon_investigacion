import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Viewer from "./pages/Viewer";
import SubmitFasta from "./pages/SubmitFasta";
import JobsList from "./pages/JobsList";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Viewer />} />
          <Route path="submit" element={<SubmitFasta />} />
          <Route path="jobs" element={<JobsList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
