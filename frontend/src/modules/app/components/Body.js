import { Navigate, Route, Routes } from "react-router-dom";
import { useUser } from "../../common/components/UserContext";
import { Login, Register } from "../../user";
import { DigitalBrainInbox, DigitalBrainProcessEntry, DigitalBrainKnowledge } from "../../digitalbrain";
import BrainLayout from "./BrainLayout";

const Body = () => {
  const { loggedIn } = useUser();

  return (
    <Routes>
      <Route path="/" element={loggedIn ? <Navigate to="/brain/inbox" replace /> : <Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/brain" element={<BrainLayout />}>
        <Route path="inbox" element={<DigitalBrainInbox />} />
        <Route path="knowledge" element={<DigitalBrainKnowledge />} />
        <Route path="process/:id" element={<DigitalBrainProcessEntry />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default Body;
