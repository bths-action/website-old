"use client";

import {
  FC,
  MouseEvent,
  ReactNode,
  createElement,
  useEffect,
  useState,
} from "react";
import {
  Button,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Avatar,
  Collapse,
} from "@material-tailwind/react";
import Link from "next/link";
import Image from "next/image";
import { signIn, signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { FiLogOut } from "react-icons/fi";
import { IconType } from "react-icons";
import { RiAccountCircleLine } from "react-icons/ri";
import { BiCalendarCheck, BiChevronDown, BiCode, BiCube } from "react-icons/bi";
import { FaDiscord } from "react-icons/fa";
import UserForm from "./UserForm";

// profile menu component

const profileMenuItems: {
  label: ReactNode;
  icon: IconType;
  onClick?:
  | ((
    event:
      | MouseEvent<HTMLLIElement, globalThis.MouseEvent>
      | MouseEvent<HTMLButtonElement, globalThis.MouseEvent>,
  ) => any)
  | "openProfile";
}[] = [
    {
      label: "Edit Profile",
      icon: RiAccountCircleLine,
      onClick: "openProfile",
    },
    {
      label: "Sign Out",
      icon: FiLogOut,
      onClick: () => {
        signOut();
      },
    },
  ];

function ProfileMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const { data } = useSession();

  return (
    <Menu open={isMenuOpen} handler={setIsMenuOpen} placement="bottom-end">
      {editProfileOpen && <UserForm mode="edit" setOpen={setEditProfileOpen} />}
      <MenuHandler>
        <Button
          ripple
          variant="text"
          color="blue-gray"
          className="flex gap-1 items-center py-0.5 pr-2 pl-0.5 mr-1 ml-auto text-white rounded-full"
        >
          <Avatar
            variant="circular"
            size="sm"
            alt="candice wu"
            className="p-0.5 w-8 h-8 rounded-full border border-blue-500"
            src={
              data?.user?.image ||
              "https://www.tenforums.com/geek/gars/images/2/types/thumb_15951118880user.png"
            }
          />
          <BiChevronDown
            strokeWidth={2.5}
            className={`h-4 w-4 transition-transform ${isMenuOpen ? "rotate-180" : ""
              }`}
          />
        </Button>
      </MenuHandler>
      <MenuList className="z-40 p-2 bg-gray-700 border-none">
        {profileMenuItems.map(({ label, icon, onClick }, key) => {
          const isLastItem = key === profileMenuItems.length - 1;
          return (
            <MenuItem
              key={key}
              onClick={(event) => {
                closeMenu();
                if (onClick === "openProfile") {
                  setEditProfileOpen(true);
                  return;
                }
                onClick?.(event);
              }}
              className={`flex transition-all text-white items-end gap-2 ${isLastItem
                  ? "hover:bg-red-500/10 focus:bg-red-500/10 active:bg-red-500/10 bg-red-200"
                  : "mb-2 hover:text-black bg-blue-300"
                }`}
            >
              {createElement(icon, {
                className: `h-5 w-5 ${isLastItem ? "text-red-500" : ""}`,
              })}
              <span className={` ${isLastItem ? "text-red-500" : ""}`}>
                {label}
              </span>
            </MenuItem>
          );
        })}
      </MenuList>
    </Menu>
  );
}

// nav list menu
// nav list component
const navListLinks: {
  label: string;
  icon: IconType;
  url: string;
}[] = [
    {
      label: "Events",
      icon: BiCalendarCheck,
      url: "/events",
    },
    {
      label: "Blocks",
      icon: BiCube,
      url: "",
    },
    {
      label: "Docs",
      icon: BiCode,
      url: "",
    },
  ];

const socialLinks: {
  icon: IconType;
  url: string;
}[] = [
    {
      icon: FaDiscord,
      url: "https://discord.gg/zTDeqZd6ne",
    },
  ];

const NavList: FC = () => {
  return (
    <ul className="flex flex-col gap-4 items-center mt-1 mb-1 lg:flex-row lg:gap-10 lg:mt-0 lg:mb-0">
      {navListLinks.map(({ label, icon, url }) => (
        <motion.span
          key={label}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="w-5/6 text-white lg:w-auto"
        >
          <Link href={url} className="flex justify-center items-center w-full">
            {createElement(icon, {
              className: "w-8 h-8 inline mr-2",
            })}
            <h6>{label}</h6>
          </Link>
        </motion.span>
      ))}
      <span>
        {socialLinks.map(({ icon, url }) => (
          <motion.span
            key={url}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="w-5/6 text-white lg:w-auto"
          >
            <Link
              href={url}
              target="_blank"
              className="flex justify-center items-center w-full"
            >
              {createElement(icon, {
                className: "w-8 h-8 inline mr-2",
              })}
            </Link>
          </motion.span>
        ))}
      </span>
    </ul>
  );
};

interface Props {
  isNavActive: boolean;
}

const Navbar: FC<Props> = ({ isNavActive }) => {
  const genericHamburgerLine = `absolute h-0.5 rounded-full bg-gray-300 w-6 rounded-full border-white transition ease transform duration-300 -translate-x-1/2 left-1/2`;
  const [isNavOpen, setIsNavOpen] = useState(false);
  const toggleIsNavOpen = () => setIsNavOpen((cur) => !cur);

  const { data, status } = useSession();

  if (!isNavActive && isNavOpen) {
    setIsNavOpen(false);
  }

  useEffect(() => {
    addEventListener(
      "resize",
      () => window.innerWidth >= 960 && setIsNavOpen(false),
    );
  }, []);

  return (
    <nav
      className={`transition-all delay-150 duration-300 ease-in-out fixed left-0 z-30 p-2 w-screen bg-gray-700 bg-opacity-90 border-none lg:pl-6 ${isNavActive ? "top-0" : "-top-16"
        }`}
    >
      <div className="flex relative items-center mx-auto text-blue-gray-900">
        <Link href="/" className="font-medium cursor-pointer">
          <Image
            src="/favicon.ico"
            width={48}
            height={48}
            alt="logo"
            className="rounded-full"
          />
        </Link>
        <div className="hidden absolute top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4 lg:block">
          <NavList />
        </div>
        <Button
          color="blue-gray"
          onClick={toggleIsNavOpen}
          className="relative p-0 mr-2 ml-auto w-10 h-10 rounded-full lg:hidden"
          ripple
        >
          <div
            className={`-translate-y-1/2 ${genericHamburgerLine} ${isNavOpen ? "rotate-45" : "opacity-100 top-1/3"
              }`}
          />
          <div
            className={`${genericHamburgerLine}  ${isNavOpen ? "opacity-0" : "-translate-y-1/2 top-1/2 opacity-100"
              }`}
          />
          <div
            className={`-translate-y-1/2 ${genericHamburgerLine} ${isNavOpen ? "-rotate-45 " : "opacity-100 top-2/3"
              }`}
          />
        </Button>
        {status === "authenticated" ? (
          <ProfileMenu />
        ) : (
          <Button
            className="flex flex-col justify-center items-center p-2 mr-2 ml-auto text-xl bg-lime-400 rounded-full font-raleway group"
            onClick={() => {
              signIn("auth0");
            }}
            color="yellow"
          >
            Login
          </Button>
        )}
      </div>
      <Collapse open={isNavActive && isNavOpen}>
        <NavList />
      </Collapse>
    </nav>
  );
};

export default Navbar;
