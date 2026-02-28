import { createContext, useState } from "react";
import { dummyCourses } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import humanizeDuration from "humanize-duration";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
export const AppContext = createContext();

export const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const currency = import.meta.env.VITE_CURRENCY;
  const [allCourses, setAllCourses] = useState([]);
  const [iseducator, setiseducator] = useState(false);
  const [enrolledCourses, setenrolledCourses] = useState([]);
  const [userData, setUserData] = useState(null)
  const { getToken } = useAuth();
  const { user } = useUser();
  //   Fetch all Courses

  const fetchAllCourses = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/course/all");
       console.log(data)
      if (data.success) {
      
        setAllCourses(data.courses);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

//   fetch user data 

const fetchuserdata = async()=>{
       if(user.publicMetadata.role === 'educator'){
              setiseducator(true)
       }
       try {
              const token = await  getToken();
              const {data} = await axios.get(backendUrl + '/api/user/data',{
                     headers:{
                            Authorization:`Bearer ${token}`
                     }
              })

              //  console.log(data)
              if(data.success){
                     setUserData(data.user)
              }
              else{
                     toast.error(data.message)
              }
       } catch (error) {
              toast.error(error.message)
       }
}

  // function to calculate rating
  const calculateRating = (course) => {
    if (course.courseRating.length === 0) return 0;
    let totalrating = 0;
    course.courseRating.forEach((rating) => {
      totalrating += rating.rating;
    });
    return Math.floor(totalrating / course.courseRating.length);
  };

  //  function to calculate course chapter time

  const calculateChapterTime = (chapter) => {
    let time = 0;
    chapter.chapterContent.map((lecture) => (time += lecture.lectureDuration));
    return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
  };

  //  Function to Calculate Course Duration

  const calculateCourseDuration = (course) => {
    let time = 0;
    course.courseContent.map((chapter) =>
      chapter.chapterContent.map(
        (lecture) => (time += lecture.lectureDuration),
      ),
    );
    return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
  };

  //  function to calculate no of lecture in the course

  const calculateNoOfLectures = (course) => {
    let noOfLectures = 0;
    course.courseContent.forEach((chapter) => {
      if (Array.isArray(chapter.chapterContent)) {
        noOfLectures += chapter.chapterContent.length;
      }
    });
    return noOfLectures;
  };

  // fetch User Enrolled Courses

  const fetchUserEnrolledCources = async () => {
     try {
        const token = await getToken();
  
        const {data}= await axios.get(backendUrl +'/api/user/enrolled-courses',{
          headers:{
                Authorization:`Bearer ${token}`
          }
        })
  
        if(data.success){
              console.log(data.enrolledCourses.enrolledCourses)
          setenrolledCourses(data.enrolledCourses.enrolledCourses.reverse())
        }
        else{
          toast.error(data.message)
        }
     } catch (error) {
        toast.error(error.message)
     }
  };
  useState(() => {
    fetchAllCourses();
    
  }, []);

  const logToken = async () => {
    console.log(await getToken());
  };

  useEffect(() => {
    if (user) {
      
      fetchuserdata();
      fetchUserEnrolledCources();
    }
  }, [user]);
  const navigate = useNavigate();
  const value = {
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
    fetchUserEnrolledCources,
    backendUrl,
    userData,
    setUserData,getToken,fetchAllCourses
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};
