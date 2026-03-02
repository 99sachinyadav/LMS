import React, { useContext, useEffect, useState } from "react";
import { assets } from "../../assets/assets";
import { Link } from "react-router-dom";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import { AppContext } from "../../context/AppContext";
 import axios from "axios";
import { toast } from "react-toastify";




const Navbar = () => {
  const isCourseListPage = location.pathname.includes("/course-list");
  const { openSignIn } = useClerk();
  const { user } = useUser();
  const {navigate , iseducator , backendUrl,setiseducator,getToken} = useContext(AppContext)

  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    return localStorage.getItem("sdemy-theme") || "light";
  });

 

    const becomeEducator = async ()=>{
         try {
          if(iseducator){
            navigate('/educator')
            return 
           
          }
           const token = await getToken()
            const {data} = await axios.get(backendUrl+'/api/educator/update-role',{
              headers:{
                  Authorization :`Bearer ${token}`
              }
            })

            if(data.sucess){
               setiseducator(true)
               toast.success(data.message)
               console.log(data)
            }
            else{
               toast.error(data.message)
                console.log(data)
            }
          
         } catch (error) {
             toast.error(error.message)
         }
    }
  return (
    <div
      className={`flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-36 py-3 border-b border-slate-100 shadow-sm ${
        isCourseListPage ? "bg-white/90 dark:bg-slate-900/95" : "bg-white/80 dark:bg-slate-900/95 backdrop-blur-md"
      }`}
    >
      <button
        type="button"
        onClick={() => navigate("/")}
        className="flex items-center gap-3 group"
      >
        <div className="flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 via-sky-500 to-cyan-400 text-white font-extrabold text-lg shadow-md group-hover:scale-105 transition-transform">
          S
        </div>
        <div className="flex flex-col items-start leading-tight">
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Sdemy
          </span>
          <span className="text-[11px] uppercase tracking-[0.2em] text-sky-500 hidden sm:block">
            Learn · Build · Grow
          </span>
        </div>
      </button>
      <div className="hidden md:flex items-center gap-5 text-gray-500 dark:text-slate-200">
        <div className="flex items-center gap-4">
         
        </div>
        <div className="flex items-center gap-5">
          {user && (
            <>
              <button  onClick={becomeEducator}>{iseducator?'Educator Dashboard':'Become Educator'}</button>|
              <Link to="/my-enrollments">My Enrollments</Link>
            </>
          )}
        </div>
        {user ? (
          <UserButton />
        ) : (
          <button
            onClick={() => openSignIn()}
            className="bg-blue-600 text-white px-5 py-2 rounded-full"
          >
            Create Account
          </button>
        )}
      </div>
      {/* for phone screen */}
      <div className="md:hidden flex items-center gap-2  sm:gap-5  text-gray-500 dark:text-slate-200">
        <div  className="flex items-center gap-1 sm:gap-2 max:sm:text-xs">
           {user && (
            <>
                <button  onClick={becomeEducator}>{iseducator?'Educator Dashboard':'Become Educator'}</button>|
              <Link to="/my-enrollments">My Enrollments</Link>
            </>
          )}
        </div>
       
          {user? <UserButton/>:   <button onClick={()=>openSignIn()} className="p-1"><img src={assets.user_icon} alt="" className="w-6 h-6"/></button>}
        
      </div>
    </div>
  );
};

export default Navbar;
