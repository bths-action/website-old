"use client";
import { useAccount } from "@/components/AccountContext";
import { POSITION_MAP } from "@/utils/constants";
import { FC, useState } from "react";
import { BiUserCircle } from "react-icons/bi";
import { ExecsDetails } from "./server-components";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import reactGemoji from "remark-gemoji";

export const ExecCard: FC<{ info: ExecsDetails[number] }> = ({
  info: {
    name,
    preferredName,
    gradYear,
    pronouns,
    email,
    execDetails: initialExecDetails,
  },
}) => {
  const { data } = useAccount();
  const [execDetails, setExecDetails] = useState(initialExecDetails);
  const [formOpen, setFormOpen] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden">
      <div
        className="flex flex-col flex-wrap relative justify-center items-center p-2 w-full"
        style={{
          background: "linear-gradient(0deg, #757575 30%, #5ac8fa 0%)",
        }}
      >
        {execDetails ? (
          <>
            <h3 className="text-orange-600">
              {POSITION_MAP[execDetails.position]}
            </h3>
            <div className="mt-2 rounded-full overflow-hidden relative w-[200px] h-[200px]">
              <Image
                src={execDetails.selfieURL}
                alt=""
                fill
                className="object-cover"
              />
            </div>
          </>
        ) : (
          <BiUserCircle size={200} className="mt-10 rounded-full" />
        )}
      </div>
      <div key={email} className="bg-gray-600 p-4">
        <h3 className="text-2xl font-bold">
          {preferredName}
          {preferredName === name || ` (${name})`}
        </h3>
        <h6 className="text-lg">
          Pronouns: {pronouns.toLowerCase()} | Class of {gradYear}
        </h6>
        {execDetails ? (
          <div>
            <div className="w-full">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, reactGemoji]}
                linkTarget="_blank"
                components={{
                  h1: (props) => (
                    <h1 {...props} className="text-[35px] font-[700]" />
                  ),
                  h2: (props) => (
                    <h2 {...props} className="text-[32.5px] font-[650]" />
                  ),
                  h3: (props) => (
                    <h3 {...props} className="text-[30px] font-[600]" />
                  ),
                  h4: (props) => (
                    <h4 {...props} className="text-[27.5px] font-[550]" />
                  ),
                  h5: (props) => (
                    <h5 {...props} className="text-[25px] font-[500]" />
                  ),
                  h6: (props) => (
                    <h6 {...props} className="text-[22.5px] font-[450]" />
                  ),
                }}
              >
                {execDetails.description}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          "The exec has not provided details about themselves."
        )}
      </div>
    </div>
  );
};
