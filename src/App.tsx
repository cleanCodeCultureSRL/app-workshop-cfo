import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Login } from "./pages/Login";
import { Participant } from "./pages/Participant";
import { Teacher } from "./pages/Teacher";
import { Toasts } from "./components/Toasts";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/participant" element={<Participant />} />
        <Route path="/teacher" element={<Teacher />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toasts />
    </BrowserRouter>
  );
}
