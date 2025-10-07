import React from "react";
import ReactDOM from "react-dom/client";
import "./main.css";
import "./index.css";
import MyApp from "./MyApp";


const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Root element not found. Check if <div id='root'> exists in index.html.");
} else {
  console.log("Root element found:", rootElement);
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <MyApp />   
    </React.StrictMode>
  );
}
