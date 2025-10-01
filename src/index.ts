import express, { Express, Request, Response } from "express";
import apiRoutes from "./routes/api";

const app: Express = express();
const port: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware to parse JSON bodies
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.send("Hello World");
});

// Usar las rutas de la API
app.use("/api", apiRoutes);

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
