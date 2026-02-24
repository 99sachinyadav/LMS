import { createContext, useState } from "react";
import { dummyCourses } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import humanizeDuration from "humanize-duration";
export const AppContext= createContext();

 

export const AppContextProvider = (props)=>{

        const currency = import.meta.env.VITE_CURRENCY;
         const [allCourses,setAllCourses] = useState([]);
         const [iseducator, setiseducator] = useState(true)
         const [enrolledCourses, setenrolledCourses] = useState([])
       //   Fetch all Courses
 
       const fetchAllCourses = async()=>{
              setAllCourses(dummyCourses)
       }

       // function to calculate rating
       const calculateRating = (course)=>{
              if(course.courseRatings.length === 0) return 0;
              let totalrating =0;
              course.courseRatings.forEach(rating=>{
                     totalrating+= rating.rating;
              })
              return (totalrating/course.courseRatings.length);
       }

       //  function to calculate course chapter time

       const calculateChapterTime = (chapter)=>{
              let time=0;
              chapter.chapterContent.map((lecture)=>time+=lecture.lectureDuration)
              return humanizeDuration(time*60 *1000,{units:["h","m"]});
       }

       //  Function to Calculate Course Duration

       const calculateCourseDuration = (course)=>{
              let time=0;
              course.courseContent.map((chapter)=>chapter.chapterContent.map((lecture)=>time+=lecture.lectureDuration))
              return humanizeDuration(time*60 *1000,{units:["h","m"]});
       }


       //  function to calculate no of lecture in the course

       const calculateNoOfLectures = (course)=>{
              let noOfLectures=0;
             course.courseContent.forEach((chapter)=>{
               if(Array.isArray(chapter.chapterContent)){
                    noOfLectures+=chapter.chapterContent.length 
               }
             })
             return noOfLectures;
       }

       // fetch User Enrolled Courses

       const fetchUserEnrolledCources = async()=>{
              setenrolledCourses(dummyCourses)
       }
         useState(()=>{
              fetchAllCourses();
              fetchUserEnrolledCources();
       },[])
       const navigate = useNavigate();
     const value ={
              currency,
              allCourses,
              calculateRating,
              navigate,
              iseducator,
              setiseducator,
              calculateChapterTime,
              calculateCourseDuration,
              calculateNoOfLectures,
              enrolledCourses,
              fetchUserEnrolledCources
     }

       return (
              <AppContext.Provider value={value}>
                     {props.children}
              </AppContext.Provider>
       )
};