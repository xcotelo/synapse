import React from "react";

import { HashRouter as Router } from "react-router-dom";

import Body from "./Body";
import Header from "./Header";
import Menu from "./Menu";

const App = () => {
  return (
    <div
      className="global"
      style={{
        minHeight: "100vh",
        width: "100vw",
        margin: 0,
        padding: 0,
        overflowX: "hidden",
        backgroundColor: "#A8DADC" // mismo tono azul claro que el gradiente del login
      }}
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
