import { getServerSession } from "next-auth";
import { AUTH_OPTIONS } from "../auth/[...nextauth]/options";
import { NextRequest, NextResponse } from "next/server";
import Joi from "joi";
import { prisma } from "@/utils/prisma";
import { Event, UserPosition } from "@prisma/client";
import { Optional } from "@prisma/client/runtime/library";
import { Converter } from "showdown";
import { sendEmail } from "@/utils/mail";
import { generateEmbed, sendMessage } from "@/utils/webhook";

const schema = Joi.object({
  limit: Joi.number().optional().allow(null),
  name: Joi.string().required().max(190),
  description: Joi.string().required().max(4000),
  maxPoints: Joi.number().required().min(0),
  eventTime: Joi.date().iso().required(),
  imageURL: Joi.string().uri().optional(),
  maxHours: Joi.number().required().min(0),
  address: Joi.string().required().max(1000),
  finishTime: Joi.date().iso().optional().allow(null),
  serviceLetters: Joi.string()
    .optional()
    .uri()
    .allow(null)
    .regex(/^https:\/\/drive\.google\.com\/[^\s]*/),
});

type EventPOSTBody = Omit<
  Event,
  "id" | "createdAt" | "description" | "createdAt"
> & {
  description: string;
  eventTime: string;
};

async function handler(method: "GET" | "POST", req: NextRequest) {
  const { searchParams } = new URL(req.nextUrl);
  const skip = Number(searchParams.get("page")) || 0;
  if (skip < 0)
    return NextResponse.json({ error: "Bad page" }, { status: 400 });

  if (method === "GET") {
    let events = (
      await prisma.event.findMany({
        include: {
          attendees: {
            select: {
              earnedHours: true,
            },
          },
        },
        orderBy: { eventTime: "desc" },
        skip: skip * 10,
        take: 10,
      })
    ).map((e) => {
      if (searchParams.has("preview")) {
        delete (e as Optional<Event>).address;
        delete (e as Optional<Event>).description;
        const count = e.attendees.length;
        delete (e as Optional<typeof e>).attendees;
        return { ...e, formCount: count };
      }
      return e;
    });

    return NextResponse.json(searchParams.get("preview") ? events : events, {
      status: 200,
    });
  }

  const [allowed, email]: [boolean, string] = await getServerSession({
    ...AUTH_OPTIONS,
  }).then(async (s) => {
    if (!s?.user.email) return [false, "No email"];
    return await prisma.user
      .findUnique({
        where: { email: s.user.email },
        select: { position: true, email: true },
      })
      .then((u) => [
        ([UserPosition.EXEC, UserPosition.ADMIN] as UserPosition[]).includes(
          u?.position!
        ),
        u?.email as string,
      ]);
  });

  if (!allowed)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  if (!req.body)
    return NextResponse.json({ error: "Missing body" }, { status: 400 });

  const result = req.body
    .getReader()
    .read()
    .then((r) => r.value && new TextDecoder().decode(r.value))
    .then(function (val): [boolean, any] {
      let parsed;
      if (!val) return [false, "Missing body"];
      try {
        parsed = JSON.parse(val);
      } catch (e) {
        return [false, "Bad JSON"];
      }
      let errors = schema.validate(parsed).error;
      return errors ? [false, errors] : [true, parsed as EventPOSTBody];
    });

  if ((await result)[0]) {
    const rawData: EventPOSTBody = (await result)[1];

    const postData: Omit<Event, "createdAt" | "id"> = {
      ...rawData,
      eventTime: new Date(rawData.eventTime!),
      finishTime: rawData.finishTime ? new Date(rawData.finishTime) : null,
    };

    try {
      const [newData, exec] = await Promise.all([
        prisma.event
          .create({
            data: postData,
          })
          .then(async (e) => {
            e.description = e.description.replaceAll(
              "{@link}",
              `https://bthsaction.org/events/${e.id}`
            );
            await prisma.event.update({
              where: { id: e.id },
              data: { description: e.description },
              select: { description: true, id: true },
            });
            return e;
          }),
        prisma.user.findUnique({
          where: { email },
          select: { preferredName: true, execDetails: true },
        }),
      ]);

      const embed = generateEmbed(newData);

      const htmlBody = new Converter({}).makeHtml(
        `Hey Action members!!!\n\nTime to get moving and get some credits and/or hours done!!! On ${newData.eventTime.toLocaleString(
          "en-US",
          {
            timeZone: "America/New_York",
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }
        )} we will be having a new event called **${
          newData.name
        }**!\n#### Description:\n${newData.description
          .split("\n")
          .map((e) => `> ${e}`)
          .join("\n")}\n\n#### Event ${
          newData.finishTime ? "Start " : ""
        }Time: ${newData.eventTime.toLocaleString("en-US", {
          timeZone: "America/New_York",
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}${
          newData.finishTime
            ? `\n#### Event Finish Time: ${newData.finishTime.toLocaleString(
                "en-US",
                {
                  timeZone: "America/New_York",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }
              )}`
            : ""
        }\n${
          newData.limit
            ? `\n#### Max Members (Register Quick!!!): ${newData.limit}`
            : ""
        }\n#### Points: ${newData.maxPoints} | Hours: ${
          newData.maxHours
        }\n#### Location: [${newData.address}](${encodeURI(
          `https://www.google.com/maps/dir/?api=1&destination=${newData.address}&travelmode=transit`
        )})\nView the whole event [here](https://bthsaction.org/events/${
          newData.id
        }).\n\nTo unsubscribe, go edit your profile on the website and uncheck the box that says "Receive Event Alerts".`
      );

      const [hookReturn] = await Promise.all([
        sendMessage({
          content:
            "Tired of events? Go to <#1134529490740064307> to remove <@&1136780952274735266>.\n# New event posted!",
          username: exec?.preferredName,
          avatarURL: exec?.execDetails?.selfieURL,
          embeds: [embed],
        }),
        sendEmail({
          subject: "New BTHS Action Event: " + newData.name,
          html: htmlBody,
        }),
      ]);

      console.log(hookReturn);

      await prisma.event.update({
        where: { id: newData.id },
        data: { messageID: hookReturn.id },
      });

      return NextResponse.json(newData, {
        status: 200,
      });
    } catch (e) {
      console.log(e);
      return NextResponse.json({ error: e }, { status: 500 });
    }
  }
  return NextResponse.json({ error: (await result)[1] }, { status: 400 });
}

export const GET = handler.bind(null, "GET");
export const POST = handler.bind(null, "POST");
