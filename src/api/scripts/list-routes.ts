import listEndpoints from "express-list-endpoints";
import app from "../app";

console.log("Registered routes:");
console.table(listEndpoints(app));
