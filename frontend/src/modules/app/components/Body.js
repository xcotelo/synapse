import React from "react";

import { Route, Routes } from "react-router-dom";

import { Login, LoginAdmin, Register, UserListAdmin } from "../../user";
import { RoleType } from "../../common";
import { useUser } from "../../common/components/UserContext";

const Body = () => {

  const { loggedIn, userRole} = useUser();
  
  return (
    <Routes>
      <Route path="/">
        <Route index exact element={<Login />} />
        {<Route path="/register" element={<Register />} />}
        {<Route path="/loginAdmin" element={<LoginAdmin />} />}
        {loggedIn && userRole === RoleType.ADMIN && <Route path="/users/allUsers" element={<UserListAdmin/>}/>}
      </Route>
    </Routes>
  );
};

export default Body;
