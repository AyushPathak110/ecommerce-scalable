import express, { type Application } from "express";
import type { Route } from "../routes/Route.js";
import { errorMiddleware } from "../middlewares/ErrorMiddleware.js";

export class App {
  private app: Application;

  constructor(routes: Route[] = []) {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeErrorHandling();

    // // Health Check Endpoint
    // this.app.get("/health", (_, res) => {
    //     res.json({
    //         pid: process.pid,
    //         port: process.env.PORT
    //     });
    // });
  }

  private initializeMiddlewares(): void {
    this.app.use(express.json());
  }

  private initializeRoutes(routes: Route[]): void {
    routes.forEach((route) => {
      this.app.use(route.path, route.router);
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorMiddleware);
  }

  public listen(port: number): void {
    this.app.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });
  }
}
