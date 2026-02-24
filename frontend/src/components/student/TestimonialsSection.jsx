import React from 'react'
import {  assets, dummyTestimonial } from '../../assets/assets'

const TestimonialsSection = () => {
  return (
    <div className='pb-14 px-8 md:px-0'>
      <h2 className='text-3xl font-medium text-gray-800'>Testimonials</h2>
      <p  className='md:text-base text-gray-500 mt-3'>Here from our learners as they share their journeys of transformation ,sucess, and how our <br/> platform has made a diffrence in there lives.</p>
       <div className='grid grid-cols-auto gap-8 mt-14'>
         {dummyTestimonial.map((test,i)=>(
          <div key={i} className='text-sm text-left border border-gray-500/30 pb-6 rounded-lg bg-white shadow-[0px_4px_15px_0px] shadow-black/5 overflow-hidden'>
             <div className='fex items-center gap-4 px-5 py-4 bg-gray-500/10'>
                <img  src={test.image} alt={test.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                   <h1 className='text-lg font-medium text-gray-800'>
                    {test.name}
                   </h1>
                   <p className='text-gray-800/80'>{test.role}</p>
                </div>
                <div className='p-5 pb-7'>
                     <div className='flex gap=0.5'>
                      {
                        [...Array(5)].map((_,i)=>(
                          <img  className ='h-5' key={i} src={i< Math.floor(test.rating)? assets.star:assets.star_blank} alt=""/>
                        ))
                      }
                     </div>
                     <p className="text-gray-500 mt-5">{test.feedback}</p>
                </div>
                 <a href="#" className='text-blue-500 underline px-5'>Read More</a>
             </div>
          </div>
         ))}
       </div>
    </div>
  )
}

export default TestimonialsSection