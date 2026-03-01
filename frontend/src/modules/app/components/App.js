import React from "react";
import { HashRouter as Router, useLocation } from "react-router-dom";

import "../../../styles/theme.css";
import "../../common/estilo.css";
import Body from "./Body";
import Footer from "./Footer";
import Header from "./Header";
import Menu from "./Menu";

const AppLayout = () => {
  const location = useLocation();
  const isArcadePage = location.pathname === "/brain/arcade";

  return (
    <>
      {!isArcadePage && <Header />}
      <Menu />
      <main className="synapse-main">
        <Body />
      </main>
      <Footer />
    </>
  );
};

const App = () => {
  return (
    <div className="synapse-app">
      <Router>
        <AppLayout />
      </Router>
    </div>
  );
};

export default App;
