import React from "react";

import { Route, Routes } from "react-router-dom";

import { Login, Register } from "../../user";
import { useUser } from "../../common/components/UserContext";
import { DigitalBrainInbox, DigitalBrainProcessEntry, DigitalBrainKnowledge } from "../../digitalbrain";

const Body = () => {

  // const { loggedIn } = useUser();

  return (
    <Routes>
      <Route path="/">
        <Route index exact element={<Login />} />
        {<Route path="/register" element={<Register />} />}
        {/* Rutas del cerebro digital accesibles sin autenticación */}
        <Route path="/brain/inbox" element={<DigitalBrainInbox />} />
        <Route path="/brain/process/:id" element={<DigitalBrainProcessEntry />} />
        <Route path="/brain/knowledge" element={<DigitalBrainKnowledge />} />
      </Route>
    </Routes>
  );
};

export default Body;
