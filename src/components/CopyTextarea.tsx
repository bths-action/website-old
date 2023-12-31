import { Button } from "@material-tailwind/react";
import { FC, PropsWithChildren } from "react";

import { useState, useRef } from "react";
import { BsCheck } from "react-icons/bs";
import { MdContentCopy } from "react-icons/md";
import { onlyText } from "react-children-utilities";
import { toast } from "react-toastify";

const CopyTextarea: FC<
  PropsWithChildren<{
    lines?: number;
  }>
> = ({ children, lines }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copyCheck, setCopyCheck] = useState(false);

  function copyToClipboard() {
    textareaRef.current!.select();
    navigator.clipboard
      .writeText(textareaRef.current!.value)
      .then(() => {
        toast.success("Copied to clipboard!");
        setCopyCheck(true);
        setTimeout(() => {
          setCopyCheck(false);
        }, 2000);
      })
      .catch(() => {
        toast.error(
          "Failed to copy to clipboard. Please try again or copy manually."
        );
      });
  }

  return (
    <div className="relative">
      <span className="absolute top-0 right-0">
        <Button
          className=" bg-blue-500 hover:bg-blue-700 text-white font-bold rounded p-1"
          onClick={copyToClipboard}
        >
          {copyCheck ? (
            <BsCheck className="w-6 h-6" />
          ) : (
            <MdContentCopy className="w-6 h-6" />
          )}
        </Button>
      </span>
      <textarea
        ref={textareaRef}
        onClick={copyToClipboard}
        value={onlyText(children)}
        readOnly
        rows={lines || 10}
        cols={100}
        wrap={lines == 1 ? "off" : "soft"}
        className={`w-full p-1 rounded break-all ${
          lines !== 1 ? "resize-y" : "overflow-x-hidden resize-none"
        }`}
      />
    </div>
  );
};

export default CopyTextarea;
