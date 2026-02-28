import React from "react";

import { Route, Routes } from "react-router-dom";

import { Login, LoginAdmin, Register, UserListAdmin } from "../../user";
import { RoleType } from "../../common";
import { useUser } from "../../common/components/UserContext";
import { DigitalBrainInbox, DigitalBrainProcessEntry, DigitalBrainKnowledge } from "../../digitalbrain";

const Body = () => {

  const { loggedIn, userRole} = useUser();
  
  return (
    <Routes>
      <Route path="/">
        <Route index exact element={<Login />} />
        {<Route path="/register" element={<Register />} />}
        {<Route path="/loginAdmin" element={<LoginAdmin />} />}
        {loggedIn && userRole === RoleType.ADMIN && <Route path="/users/allUsers" element={<UserListAdmin/>}/>}
        {/* Rutas del cerebro digital accesibles sin autenticación */}
        <Route path="/brain/inbox" element={<DigitalBrainInbox />} />
        <Route path="/brain/process/:id" element={<DigitalBrainProcessEntry />} />
        <Route path="/brain/knowledge" element={<DigitalBrainKnowledge />} />
      </Route>
    </Routes>
  );
};

export default Body;
