import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "../../common/components/UserContext";

const BrainLayout = () => {
  const { loggedIn } = useUser();

  if (!loggedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="synapse-dashboard">
      <div className="synapse-dashboard__content">
        <Outlet />
      </div>
    </div>
  );
};

export default BrainLayout;
