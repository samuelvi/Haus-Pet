import express, { Express, Request, Response } from "express";
import apiRoutes from "./routes";

const app: Express = express();
const port: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.get("/", (_req: Request, res: Response) => {
  res.send("Hello World");
});

app.use("/api", apiRoutes);

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
