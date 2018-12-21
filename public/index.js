import app from "./app/index.js";

function init() {
  app.init(document.getElementById("app"));
}

document.addEventListener("DOMContentLoaded", init);