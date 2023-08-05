import { Button, Collapse } from "@material-tailwind/react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import Joi from "joi";
import { signOut } from "next-auth/react";
import { Dispatch, FC, MouseEvent, SetStateAction, useState } from "react";
import { BsExclamationOctagon } from "react-icons/bs";
import { useAccount } from "./AccountContext";
import { UserFull } from "@/types/user";

const Error: FC<{ name: string }> = (props) => {
  return (
    <ErrorMessage name={props.name}>
      {(msg: string) => (
        <div className="flex justify-center items-center text-red-500">
          <BsExclamationOctagon size={24} className="mr-2" /> {msg}
        </div>
      )}
    </ErrorMessage>
  );
};

type Props =
  | {
    mode: "register";
    setOpen?: undefined;
  }
  | {
    mode: "edit";
    setOpen: Dispatch<SetStateAction<boolean>>;
  };

const GRAD_YEARS = [0, 2024, 2025, 2026, 2027];
const PRONOUNS = ["He/Him", "She/Her", "They/Them", "Ze/Zir", "It/Its"];

const UserForm: FC<Props> = ({ mode, setOpen }) => {
  const [prefectDetails, setPrefectDetails] = useState(false);
  const { data, setData, setStatus } = useAccount();
  if (mode === "edit" && !data) return;
  return (
    <div className="flex fixed inset-0 z-40 flex-row justify-center items-center w-screen h-screen text-black bg-black bg-opacity-50">
      <div className="overflow-auto max-w-5xl max-h-full text-center bg-blue-100 rounded-lg lg:p-8 p-[3.2vw]">
        <h5 className="font-bold">
          {mode === "register"
            ? "Wait! You have to register!!!"
            : "Editing info"}
        </h5>
        <h6>
          {mode === "register" && "Not expecting this?"}
          <a
            onClick={() => {
              if (mode === "register") signOut();
              else setOpen(false);
            }}
            className="ml-2"
          >
            {mode === "register" ? "Sign Out" : "Discard Changes And Exit"}
          </a>
        </h6>
        <hr />
        <Formik
          initialValues={{
            name: data?.name || "",
            preferredName: data?.preferredName || ("" as string | undefined),
            prefect: data?.prefect || "",
            pronouns: data?.pronouns || "",
            gradYear: data?.gradYear || ("" as number | string),
            birthday: data?.birthday as string | undefined,
            sgoSticker: data?.sgoSticker || false,
            referredBy: data?.referredBy || ("" as string | undefined),
            tos: false as boolean | undefined,
            eventAlerts: data?.eventAlerts || true,
          }}
          onSubmit={async (values) => {
            delete values.tos;
            if (!values.referredBy) delete values.referredBy;
            if (!values.preferredName) delete values.preferredName;
            values.gradYear = parseInt(values.gradYear as string);
            const finalValues =
              mode === "register"
                ? values
                : Object.fromEntries(
                  Object.keys(values)
                    .filter(
                      (k) =>
                        values[k as keyof typeof values] !==
                        data![k as keyof typeof data]
                    )
                    .map((k) => [k, values[k as keyof typeof values]])
                );

            const [status, res]: [number, UserFull] = await fetch(
              "/api/users/@me",
              {
                method: mode === "register" ? "POST" : "PATCH",
                body: JSON.stringify(finalValues),
              }
            ).then(async (req) => [req.status, await req.json()]);
            if (status === 200) {
              setData(res);
              setStatus("registered");
              if (mode === "edit") setOpen(false);
            } else {
              alert(
                `Report the error to the developer. Error: ${status} ${res}`
              );
            }
          }}
          validate={(values) => {
            const errors: any = {};
            if (!values.name) {
              errors.name = "Name is required.";
            }
            if (values.name?.length > 180) {
              errors.name = "Name is too long.";
            }

            if (values.preferredName && values.preferredName?.length > 180) {
              errors.preferredName = "Preferred name is too long.";
            }
            if (!values.prefect) {
              errors.prefect = "Prefect is required.";
            } else {
              if (values.prefect.length !== 3) {
                errors.prefect = "Prefect must be 3 characters";
              }
              if (!values.prefect.match(/^[A-Za-z]\d[A-Za-z]$/)) {
                if (!errors.prefect) {
                  errors.prefect = "Prefect must be in the format A1B.";
                } else {
                  errors.prefect += " and in the format A1B.";
                }
              }
            }
            if (!values.pronouns) {
              errors.pronouns = "Pronouns are required.";
            }

            if (values.pronouns?.length > 180) {
              errors.pronouns = "Pronouns are absurdly long.";
            }

            if (!values.gradYear) {
              errors.gradYear = "Graduation year is required.";
            }

            if (!values.birthday) {
              errors.birthday = "Birthday is required.";
            } else {
              const birthDate = new Date(values.birthday);
              if (birthDate.valueOf() >= new Date().valueOf()) {
                errors.birthday = "Birthday must be in the past.";
              }
              if (birthDate.getFullYear() > 2012) {
                errors.birthday = "You seem to young to be in high school.";
              }
            }

            if (
              values.referredBy &&
              Joi.string()
                .email({
                  tlds: false,
                })
                .regex(/@nycstudents.net$/)

                .validate(values.referredBy).error
            ) {
              errors.referredBy =
                "Email must be a valid nycstudents.net email.";
            }
            if (!values.tos) {
              errors.tos = "You must agree to the terms of service.";
            }

            return errors;
          }}
        >
          {({ isSubmitting, values, setFieldValue, errors }) => (
            <Form autoComplete="off">
              <label htmlFor="name">Full Name: </label>
              <Field
                id="name"
                name="name"
                type="text"
                maxLength={180}
                placeholder="Your name"
              />
              <br />
              <Error name="name" />
              <label htmlFor="preferredName">Preferred Name (Optional): </label>
              <Field
                id="preferredName"
                name="preferredName"
                type="text"
                maxLength={180}
                placeholder={values.name || "Your preferred name"}
              />
              <br />
              <Error name="preferredName" />
              <label htmlFor="prefect">Prefect: </label>
              <Field
                className="w-16"
                id="prefect"
                name="prefect"
                type="text"
                maxLength={3}
                placeholder="A1B"
              />
              <a
                className="mx-1"
                onClick={() => setPrefectDetails(!prefectDetails)}
              >
                {prefectDetails ? "Close help" : "Need help?"}
              </a>
              <Collapse open={prefectDetails}>
                <div className="text-lg">
                  Go get your transcript via teachhub, and look for something
                  that says "Offical Class", input the 3 digit code, that looks
                  like this "A1B"
                </div>
              </Collapse>
              <Error name="prefect" />
              <label htmlFor="pronouns">Pronouns: </label>
              <Field
                id="pronouns"
                name="pronouns"
                type="text"
                maxLength={180}
                placeholder="Your pronouns"
              />
              <br />
              <div>
                <span className="text-lg">Quick Suggestions:</span>
                {PRONOUNS.map((suggestion) => (
                  <Button
                    type="button"
                    className="p-1 mx-1 text-base normal-case font-figtree"
                    key={suggestion}
                    onClick={() =>
                      setFieldValue(
                        "pronouns",
                        suggestion,
                        Boolean(errors.pronouns || false)
                      )
                    }
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
              <Error name="pronouns" />
              <label htmlFor="gradYear">Graduation Year: </label>
              <Field id="gradYear" name="gradYear" as="select">
                {GRAD_YEARS.map((year) => (
                  <option value={year || ""} key={year}>
                    {year || "Not Selected"}
                  </option>
                ))}
              </Field>
              <br />
              <Error name="gradYear" />
              <label htmlFor="birthday">Birthday: </label>
              <Field id="birthday" name="birthday" type="date" />
              <br />
              <Error name="birthday" />
              <label className="flex justify-center items-center w-full">
                <Field
                  id="sgoSticker"
                  name="sgoSticker"
                  type="checkbox"
                  className="mr-2"
                />
                Check the box if you have a SGO sticker.
              </label>
              <label htmlFor="referredBy">
                Your referrer's email (Optional):
              </label>
              <Field
                id="referredBy"
                name="referredBy"
                type="text"
                maxLength={180}
                placeholder="Referrer will get 5 points!"
              />
              <Error name="referredBy" />
              <label className="flex justify-center items-center w-full">
                <Field
                  id="eventAlerts"
                  name="eventAlerts"
                  type="checkbox"
                  className="mr-2"
                />
                Uncheck the box if you do not want to receive event alerts.
              </label>

              <hr />
              <label className="flex justify-center items-center">
                <Field id="tos" name="tos" type="checkbox" className="mr-2" />
                <span className="max-w-xl text-base">
                  By{" "}
                  {mode === "register"
                    ? "submitting this form"
                    : "editing your information"}
                  , you agree that this information is accurate, as well as
                  abiding to the club rules. Failure to comply will result in
                  termination of your account, as well as seizure of credits.
                </span>
              </label>

              <Error name="tos" />

              <Button
                type="submit"
                disabled={isSubmitting}
                ripple
                className="text-xl font-tyros"
                color="light-blue"
              >
                Submit
              </Button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default UserForm;