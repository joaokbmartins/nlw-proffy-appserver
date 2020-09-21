import { Request, Response } from "express";

import db from "../database/connection";
import convertHourToMinutes from "../utils/convertHourToMinutes";

interface ScheduleItem {
  week_day: number;
  from: string;
  to: string;
}

export default class ClassesController {
  async index(request: Request, response: Response) {
    const filters = request.query;

    if (!filters.week_day || !filters.subject || !filters.time) {
      return response.json({
        error: "Missing filters to class search",
      });
    }

    const week_day = filters.week_day as string;
    const subject = filters.subject as string;
    const time = filters.time as string;

    const timeInMinutes = convertHourToMinutes(time);

    const classes = await db("classes")
      .where("subject", "=", subject)
      .whereExists(function () {
        this.select("class_schedule.*")
          .from("class_schedule")
          .whereRaw("`class_schedule`.`class_id` = `classes`.`id`")
          .whereRaw("`class_schedule`.`week_day` = ??", [Number(week_day)])
          .whereRaw("`class_schedule`.`from` <= ??", [Number(timeInMinutes)])
          .whereRaw("`class_schedule`.`to` > ??", [Number(timeInMinutes)]);
      })
      .innerJoin("users", "users.id", "=", "classes.user_id")
      // .innerJoin('class_schedule', 'class_schedule.class_id', '=', 'classes.id')
      .select(["classes.*", "users.*"]);

    response.status(200).json(classes);
  }

  async create(request: Request, response: Response) {
    const {
      // desestruturacao
      name,
      avatar,
      whatsapp,
      bio,
      subject,
      cost,
      schedule,
    } = request.body;

    const trx = await db.transaction();

    try {
      const insertedUsersId = await trx("users").insert({
        name,
        avatar,
        whatsapp,
        bio,
      });

      const user_id = insertedUsersId[0];

      const insertedClassesId = await trx("classes").insert({
        subject,
        cost,
        user_id,
      });

      const class_id = insertedClassesId[0];

      const classSchedule = schedule.map((scheduleItem: ScheduleItem) => {
        return {
          class_id,
          week_day: scheduleItem.week_day,
          from: convertHourToMinutes(scheduleItem.from),
          to: convertHourToMinutes(scheduleItem.to),
        };
      });

      await trx("class_schedule").insert(classSchedule);

      await trx.commit();

      return response.status(201).send();
    } catch (err) {
      await trx.rollback();

      console.log(err);

      return response.status(400).json({
        error: "Unexpected error while creating the class.",
      });
    }
  }
}
