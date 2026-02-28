import { Route, Routes } from "react-router-dom";
import { useUser } from "../../common/components/UserContext";
import { Login, Register } from "../../user";
import { DigitalBrainInbox, DigitalBrainProcessEntry, DigitalBrainKnowledge } from "../../digitalbrain";

const Body = () => {

  const { loggedIn, userRole} = useUser();

  return (
    <Routes>
      <Route path="/">
        <Route index exact element={<Login />} />
        {<Route path="/register" element={<Register />} />}
        {/* Rutas del cerebro digital accesibles sin autenticación */}
        {loggedIn && <Route path="/brain/inbox" element={<DigitalBrainInbox />} />}
        {loggedIn && <Route path="/brain/process/:id" element={<DigitalBrainProcessEntry />} />}
        {loggedIn && <Route path="/brain/knowledge" element={<DigitalBrainKnowledge />} />}
        
      </Route>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* Rutas del cerebro digital accesibles sin autenticación */}
      <Route path="/brain/inbox" element={<DigitalBrainInbox />} />
      <Route path="/brain/process/:id" element={<DigitalBrainProcessEntry />} />
      <Route path="/brain/knowledge" element={<DigitalBrainKnowledge />} />
    </Routes>
  );
};

export default Body;
