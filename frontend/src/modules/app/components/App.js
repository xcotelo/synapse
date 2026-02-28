import React from "react";
import { HashRouter as Router } from "react-router-dom";

import "../../../styles/theme.css";
import "../../common/estilo.css";
import Body from "./Body";
import Footer from "./Footer";
import Header from "./Header";
import Menu from "./Menu";

const App = () => {
  return (
    <div className="synapse-app">
      <Router>
        <Header />
        <Menu />
        <main className="synapse-main">
          <Body />
        </main>
        <Footer />
      </Router>
    </div>
  );
};

export default App;
