import React from 'react'

import { assets, dummyEducatorData } from '../../assets/assets'
import {UserButton,useUser} from '@clerk/clerk-react'
import {Link} from 'react-router-dom'
const Navbar = () => {
  const educatorData = dummyEducatorData;
  const {user} = useUser()
  return (
    <div className='flex items-center justify-between px-4 md:px-8 border-b border-gray-500 py-3'>
     <Link to='/'>  
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
     </Link>
     <div className='flex items-center gap-5 text-gray-500 relative'>
         <p>Hi! {user? user.fullName:'Developers'}</p>
         {user? <UserButton/>:<img className='max-w-8' src={assets.profile_img}/>}
     </div>
    </div>
  )
}

export default Navbar