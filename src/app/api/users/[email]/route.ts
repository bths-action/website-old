import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { AUTH_OPTIONS } from "../../auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import Joi from "joi";
import { UserPOSTBody } from "@/types/user";

const prisma = new PrismaClient();

type Params = { params: { email: string } };

export async function GET(_req: NextRequest, { params: { email } }: Params) {
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (email == "@me") {
    const session = await getServerSession({ ...AUTH_OPTIONS });
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    email = session.user.email;
  }

  const [user, referrals] = await Promise.all([
    prisma.user.findUnique({
      where: { email },
    }),
    await prisma.user
      .findMany({
        where: { referredBy: email },
        select: {
          email: true,
        },
      })
      .then((u) => u.map((u) => u.email)),
  ]);

  return NextResponse.json(user && { ...user, referrals }, { status: 200 });
}

const schema = Joi.object({
  name: Joi.string().required().max(190),
  pronouns: Joi.string().required().max(190),
  gradYear: Joi.number().required().min(2024).max(2027),
  osis: Joi.string().required().max(9),
  preferredName: Joi.string().optional().max(190),
  prefect: Joi.string()
    .required()
    .regex(/^[A-Za-z]\d[A-Za-z]$/),
  birthday: Joi.string().regex(
    /\b\d{4}-(?:1[0-2]|0?[1-9])-(?:3[0-1]|[12][0-9]|0?[1-9])\b/
  ),
  referredBy: Joi.string().optional().email(),
});

export async function POST(req: NextRequest, { params: { email } }: Params) {
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  if (email !== "@me" && Joi.string().email().validate(email).error) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const allowed = getServerSession({ ...AUTH_OPTIONS }).then(async (s) => {
    if (!s?.user?.email) return false;
    if (email == "@me" && s.user.email) {
      email = s.user.email;
      return true;
    }

    return await prisma.user
      .findUnique({
        where: { email: s.user.email },
        select: { position: true },
      })
      .then((u) => ["admin", "exec"].includes(u?.position!));
  });

  if (!req.body)
    return NextResponse.json({ error: "Missing body" }, { status: 400 });

  const body = req.body
    .getReader()
    .read()
    .then((r) => r.value && new TextDecoder().decode(r.value))
    .then(function(val): [boolean, any] {
      let parsed;
      if (!val) return [false, "Missing body"];
      try {
        parsed = JSON.parse(val);
      } catch (e) {
        return [false, "Bad JSON"];
      }
      let errors = schema.validate(parsed).error;
      return errors ? [false, errors] : [true, parsed];
    });

  if (!(await allowed))
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  if ((await body)[0]) {
    const data: UserPOSTBody = (await body)[1];
    let referral;
    if (data.hasOwnProperty("referredBy")) {
      referral = data.referredBy as string | undefined;
      delete data.referredBy;
    }
    const existingOSIS = await prisma.user.findUnique({
      where: { osis: data.osis },
      select: { osis: true },
    });

    if (existingOSIS)
      return NextResponse.json(
        { error: "OSIS already exists" },
        { status: 409 }
      );

    try {
      return NextResponse.json(
        await prisma.user.create({
          data: {
            ...data,
            email,
            preferredName: data.preferredName || data.name,
          },
        }),
        {
          status: 200,
        }
      );
    } catch (e) {
      return NextResponse.json({ error: e }, { status: 500 });
    }
  }
  return NextResponse.json({ error: (await body)[1] }, { status: 400 });
}