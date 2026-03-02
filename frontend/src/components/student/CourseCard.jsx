import React, { useContext } from 'react'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'
import { Link } from 'react-router-dom';

const CourseCard = ({ course }) => {


   const {currency,calculateRating} = useContext(AppContext);
  return (
    <Link  to={'/course/'+ course._id}   onClick={()=>scrollTo(0,0)} 
     className='group bg-white/80 border border-slate-200 pb-5 overflow-hidden rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200'>
      <div className="relative overflow-hidden">
        <img  className="w-full h-40 object-cover transform group-hover:scale-105 transition-transform duration-300" src={course.courseThumbnail} alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
        <div className='p-3.5 text-left space-y-1.5'>
          <h3 className='text-sm font-semibold text-slate-900 line-clamp-2'>{course.courseTitle}</h3>
          <p className=" text-xs text-slate-500">by {course.educator.name}</p>
          <div className='flex items-center space-x-2 text-xs'>
             <p className="font-semibold text-slate-800">{calculateRating(course)}</p>
              <div className='flex'>
                {[...Array(5)].map((_,i)=>(<img  className="w-3.5 h-3.5" key={i} src={i< Math.floor(calculateRating(course))? assets.star:assets.star_blank} alt='star'/>))}
              </div>
              <p className="text-slate-500">({course.courseRating.length})</p>
          </div>
          <p className='text-base font-semibold text-slate-900'>
            {currency} {(course.coursePrice-course.discount*course.coursePrice/100).toFixed(2)}
          </p>
        </div>
    </Link>
  )
}

export default CourseCard