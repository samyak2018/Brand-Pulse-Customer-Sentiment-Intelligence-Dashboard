import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./components/Home";   // YOUR HOME PAGE
import EConsultationDashboard from "./EConsultationDashboard";  // DASHBOARD PAGE

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<EConsultationDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
