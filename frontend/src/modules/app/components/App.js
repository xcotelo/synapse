import React from "react";

import { HashRouter as Router } from "react-router-dom";

import Body from "./Body";
import Header from "./Header";
import Menu from "./Menu";

const App = () => {
  return (
    <div className="global bblanco"
    style={{ height: "100vh", width: "100vw", margin: 0, padding: 0, overflowX: "hidden"}}
    >
      <Router>
        <Header />
        <Menu/>
        <Body />
      </Router>
    </div>
  );
};

export default App;
