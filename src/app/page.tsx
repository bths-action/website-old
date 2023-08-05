"use client";

import Layout from "@/components/Layout";
import { Button } from "@material-tailwind/react";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { FC } from "react";
import Typewriter from "typewriter-effect";
import { BsPencilSquare } from "react-icons/bs";
import { useKeenSlider } from "keen-slider/react";
import { AutoPlayPlugin } from "@/utils/keen-utils";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { HashLoader } from "react-spinners";

const HomePage: FC = () => {
  const [sliderRef, instanceRef] = useKeenSlider(
    {
      loop: true,
    },
    [
      AutoPlayPlugin(2000),
      // add plugins here
    ]
  );
  const { status } = useSession();
  const rangeList = [...Array(4).keys()];
  return (
    <Layout>
      <h1 className="title">BTHS Repair the World</h1>
      <h4>
        <Typewriter
          options={{
            strings: [
              "Inspiring BTHS youth to make change in a unjust society.",
              "Empowering everyone to make a difference.",
              "Mobilizing productivity for a better tomorrow.",
              "Setting the stage for change.",
              "Repairing the world, one step at a time.",
            ],
            autoStart: true,
            loop: true,
          }}
        />
      </h4>
      <div className="relative">
        <div
          className="inline-block relative my-3 w-full rounded-2xl h-[50vw] keen-slider lg:h-[600px]"
          ref={sliderRef}
        >
          <div className="flex absolute justify-center items-center w-full h-full">
            <HashLoader color="#2563EB" size={100} />
          </div>
          {rangeList.map((i) => (
            <div className="keen-slider__slide">
              <Image
                src={`/images/home${i + 1}.jpg`}
                fill
                className="object-cover"
                alt=""
              />
            </div>
          ))}
        </div>
        <button
          className="absolute left-0 top-1/2 bg-transparent -translate-y-1/2"
          onClick={(e) => {
            e.stopPropagation();
            instanceRef.current?.prev();
          }}
        >
          <FaChevronLeft className="lg:w-10 lg:h-10 w-[4vw] h-[4vw]" />
        </button>
        <button
          className="absolute right-0 top-1/2 bg-transparent -translate-y-1/2"
          onClick={(e) => {
            e.stopPropagation();
            instanceRef.current?.next();
          }}
        >
          <FaChevronRight className="lg:w-10 lg:h-10 w-[4vw] h-[4vw]" />
        </button>
      </div>

      {status === "unauthenticated" && (
        <Button
          ripple
          onClick={() => signIn("auth0")}
          className="bg-blue-700 lg:p-4 p-[1.6vw]"
        >
          <h5>
            <BsPencilSquare className="inline-block mr-2 lg:w-9 w-[3.6vw]" />
            Join us now!
          </h5>
        </Button>
      )}
    </Layout>
  );
};

export default HomePage;
