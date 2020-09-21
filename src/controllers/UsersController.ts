import { Request, Response } from "express";

import db from "../database/connection";

export default class UsersController {
  async index(request: Request, response: Response) {
    const teachersList = await db("users").select("*");

    response.status(200).json(teachersList);

    console.log(teachersList);
  }

  async teachersInfo(request: Request, response: Response) {
    const teachersList = await db("users")
      .innerJoin("classes", "users.id", "=", "classes.user_id")
      .select(["users.*", "classes.*"]);

    response.status(200).json(teachersList);

    console.log(teachersList);
  }
}
