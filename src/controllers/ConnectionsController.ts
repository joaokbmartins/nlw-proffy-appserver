import { Request, Response } from "express";
import db from "../database/connection";

export default class ConnectionsController {
  async index(request: Request, response: Response) {
    const totalConnectinos = await db("connections").count("* as total");
    const { total } = totalConnectinos[0];
    response.status(200).json({
      total,
    });
  }

  async create(request: Request, response: Response) {
    const { user_id } = request.body;
    if (!user_id) {
      return response.status(400).json({
        error: "To connect user not founded.",
      });
    }
    await db("connections").insert({
      user_id,
    });
    return response.status(201).send();
  }
}
