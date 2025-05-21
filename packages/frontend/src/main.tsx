import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("루트를 찾을 수 없습니다.");

const root = createRoot(rootElement);
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );

root.render(<App />);
