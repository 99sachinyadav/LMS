import React from "react";
import { assets } from "../../assets/assets";
import SearchBar from "./SearchBar";

const Hero = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full md:pt-32 pt-20 px-7 md:px-0 space-y-7 text-center bg-gradient-to-b ">
      <h1 className="md:text-5xl text-3xl text-home-heading-small relative font-extrabold text-slate-900 max-w-3xl mx-auto leading-tight">
        Level up your skills with{" "}
        <span className="bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400 bg-clip-text text-transparent">
          Sdemy
        </span>
        <img
          src={assets.sketch}
          alt="Sketch"
          className="md:block hidden absolute -bottom-7 right-0"
        />
      </h1>
      <p className="md:block hidden text-slate-600 max-w-2xl mx-auto">
        Learn from top instructors with hands-on projects, beautiful lecture notes, and a
        smooth player experience—built for the next generation of learners.
      </p>
      <p className="md:hidden text-slate-600 max-w-sm mx-auto">
        Learn from top instructors with hands-on projects, beautiful notes, and a smooth
        player experience.
      </p>
       <SearchBar/>
    </div>
  );
};

export default Hero;
