import app from "./app/index.js";

function init() {
  app.init(document.body);
}

document.addEventListener("DOMContentLoaded", init);