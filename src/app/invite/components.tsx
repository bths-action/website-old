"use client";
import { useAccount } from "@/components/AccountContext";
import Layout from "@/components/Layout";
import { Button } from "@material-tailwind/react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FC, useEffect } from "react";
import { BsPencilSquare } from "react-icons/bs";

export const Invite: FC = () => {
  const searchParams = useSearchParams();
  const email = searchParams.get("ref");
  const { data } = useAccount();

  useEffect(() => {
    if (email) {
      localStorage.setItem("ref", email);
    }
  }, [email]);

  return (
    <Layout>
      <h1>You have been invited to join BTHS Action!!!</h1>

      {!data ? (
        <>
          <div className="w-full h-0 relative pb-[60%]">
            Join our Discord if you have any issues!
          </div>
          <Button
            ripple
            onClick={() => signIn("auth0")}
            className="bg-blue-500 p-1 text-2xl font-figtree"
          >
            <BsPencilSquare className="inline-block mr-2" />
            Join us now!
          </Button>
        </>
      ) : (
        <>
          You have already joined the club!!! Check out some of our{" "}
          <Link href="/events">events</Link> to earn some points and service
          hours!
        </>
      )}
    </Layout>
  );
};
