import React from 'react'
import { assets } from '../../assets/assets'

const Footer = () => {
  return (
    <footer className='bg-gray-900 dark:bg-slate-950 md:px-36 text-left w-full mt-10'>
        <div className='flex flex-col md:flex-row items-start px-8 md:px-0 justify-center gap-10 md:gap-20 py-10 border-b border-white/30'>

          <div className='flex flex-col md:items-start items-center w-full'>
             <div className="flex items-center gap-3">
               <div className="flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 via-sky-500 to-cyan-400 text-white font-extrabold text-lg shadow-md">
                 S
               </div>
               <div className="flex flex-col items-start leading-tight">
                 <span className="text-xl font-bold tracking-tight text-white">
                   Sdemy
                 </span>
                 <span className="text-[11px] uppercase tracking-[0.2em] text-sky-300">
                   Learn · Build · Grow
                 </span>
               </div>
             </div>
              <p className='mt-6 text-center md:text-left text-sm text-white/80'>Learn with confidence and build your future skills with industry experts and hands-on projects.</p>
          </div>
          <div className='flex flex-col md:items-start items-center w-full'>
             <h1 className='font-semibold text-white mb-5'>Company</h1>
             <ul className='flex md:flex-col w-full justify-between text-sm text-white/80 md:space-y-2'>
                 <li><a href="#" className="text-white/80 hover:text-white">About Us</a></li>
                 <li><a href="#" className="text-white/80 hover:text-white">Careers</a></li>
                 <li><a href="#" className="text-white/80 hover:text-white">Contact Us</a></li>
                 <li><a href="#" className="text-white/80 hover:text-white">Privacy policy</a></li>
       
             </ul>
          </div>
          <div className=" hidden md:flex flex-col items-start w-full">
              <h1 className='font-semibold text-white mb-5'>Subscribe to our newsletter</h1>
               <p className='text-sm text-white/80'>The latest news ,articles , and resources , sent to your inbox weekly</p>
               <div className='flex item-center gap-2 pt-4'>
                <input  className=" border border-gray-500/30 bg-gray-800 text-gray-500 placeholder-gray-500 outline-none w-64 h-9 rounded px-2 text-sm "type="email" placeholder='Enter Your Email' />
                 <button className='bg-blue-600 w-24 h-9 text-white rounded'>Subscribe</button>
               </div>
          </div>

        </div>
        <p className='py-4 text-center text-xs md:text-sm text-white/60'>Copyright 2025 @ Sdemy. All Right Reserved.</p>
    </footer>
  )
}

export default Footer