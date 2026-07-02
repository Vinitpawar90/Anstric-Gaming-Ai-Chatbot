import { Router } from "express";
import Route from "../../interfaces/route.interface";
import validationMiddleware from "../../middlewares/validation.middleware";
import AgentController from "./agent.controller";
import { CreateAgentDto, UpdateAgentDto, AgentParamsDto } from "./agent.dto";
import { TrainAgentDto } from "../train/agent-training.dto";

class AgentRoute implements Route {
  public path = "/agents";
  public router = Router();
  public agentController = new AgentController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Create a new agent
    this.router.post(
      `${this.path}`,
      validationMiddleware(CreateAgentDto, "body", false, []),
      this.agentController.createAgent
    );

    // Get all agents for the authenticated user
    this.router.get(`${this.path}`, this.agentController.getAgents);

    // Get active system agent
    this.router.get(
      `${this.path}/active`,
      this.agentController.getActiveAgent
    );

    // Get ALL active agents (for employee agent dropdown in chat)
    this.router.get(
      `${this.path}/active-all`,
      this.agentController.getAllActiveAgents
    );

    // Get agent by ID
    this.router.get(
      `${this.path}/:id`,
      validationMiddleware(AgentParamsDto, "params", false, []),
      this.agentController.getAgent
    );

    // Update agent
    this.router.put(
      `${this.path}/:id`,
      validationMiddleware(AgentParamsDto, "params", false, []),
      validationMiddleware(UpdateAgentDto, "body", true, []), // skipMissingProperties: true for partial updates
      this.agentController.updateAgent
    );

    // Delete agent
    this.router.delete(
      `${this.path}/:id`,
      validationMiddleware(AgentParamsDto, "params", false, []),
      this.agentController.deleteAgent
    );

    // Training operations
    this.router.post(
      `${this.path}/:agentId/train`,
      validationMiddleware(TrainAgentDto, "body", false, []),
      this.agentController.trainAgent
    );

    this.router.post(
      `${this.path}/:agentId/retrain`,
      validationMiddleware(TrainAgentDto, "body", false, []),
      this.agentController.retrainAgent
    );

    this.router.delete(
      `${this.path}/:agentId/clear-training`,
      this.agentController.clearTraining
    );

    this.router.get(
      `${this.path}/:agentId/training-status`,
      this.agentController.getTrainingStatus
    );

    this.router.get(
      `${this.path}/:agentId/training-analytics`,
      this.agentController.getTrainingAnalytics
    );

    // Get all documents linked to an agent (for training UI pre-selection)
    this.router.get(
      `${this.path}/:agentId/documents`,
      this.agentController.getAgentDocuments
    );

    // Unlink a specific document from an agent
    this.router.delete(
      `${this.path}/:agentId/documents/:documentId`,
      this.agentController.unlinkDocument
    );
  }
}

export default AgentRoute;
