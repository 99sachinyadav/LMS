import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { useParams } from "react-router-dom";
import { assets } from "../../assets/assets";
import humanizeDuration from "humanize-duration";
import YouTube from "react-youtube";
import Footer from "../../components/student/Footer";
import Rating from "../../components/student/Rating";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../../components/student/Loading";

const Player = () => {
  const { enrolledCourses, calculateChapterTime ,backendUrl ,getToken,userData,
    fetchUserEnrolledCources
  } = useContext(AppContext);
  const { courseId } = useParams();
  const [courseData, setcourseData] = useState(null);
  const [openSection, setopenSection] = useState({});
  const [playerData, setplayerData] = useState(null);
  const [progressData, setprogressData] = useState(null)
  const [initialRating, setinitialRating] = useState(0)
  const [showNotes, setShowNotes] = useState(true);
  const [pdfBlobUrl, setPdfBlobUrl] = useState("");
  const getCourseData = () => {
    enrolledCourses.map((course) => {
      if (course._id === courseId) {
        setcourseData(course);
        course.courseRating.map((item)=>{
          if(item.userId === userData._id){
            setinitialRating(item.rating)
          }
             
        })
      }
    });
  };

  const toggelSection = (index) => {
    setopenSection((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  useEffect(() => {
    if (enrolledCourses.length > 0) {
      getCourseData();
    }
  }, [enrolledCourses]);

  const markLectureAsCompleted = async (lectureId)=>{
        try {
           const token = await getToken()
           const {data} = await axios.post(backendUrl +'/api/user/update-course-progress',{courseId,lectureId},{
             headers:{
              Authorization: `Bearer ${token}`
             }
           })
     console.log(data)
           if(data.success){
             toast.success(data.message)
             getCourseProgress()
           }
           else{
             toast.error(data.message)
           }
        } catch (error) {
            toast.error(error.message)
        }
  }





  const getCourseProgress = async ()=>{
     try {
        const token = await getToken()
         console.log(courseId)
        const {data} = await axios.get(backendUrl +'/api/user/get-course-progress',{
          params:{courseId},
             headers:{
              Authorization: `Bearer ${token}`
             }
           })
    console.log(data)
           if(data.success){
             setprogressData(data.progress)
           }
           else{
             toast.error(data.message)
           }
     } catch (error) {
          toast.error(error.message)
     }
  }


  useEffect(() => {
  let objectUrl = "";

  const loadPdf = async () => {
    try {
      if (!playerData?.lectureNotesUrl) return;

      const res = await fetch(playerData.lectureNotesUrl);
      if (!res.ok) throw new Error("Failed to fetch notes");

      const blob = await res.blob();
      const pdfBlob =
        blob.type === "application/pdf"
          ? blob
          : new Blob([blob], { type: "application/pdf" });

      objectUrl = URL.createObjectURL(pdfBlob);
      setPdfBlobUrl(objectUrl);
    } catch (err) {
      console.error(err);
      toast.error("Could not load lecture notes");
    }
  };

  loadPdf();

  return () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  };
}, [playerData?.lectureNotesUrl]);

const notesUrl = encodeURIComponent(playerData.lectureNotesUrl);
const iframeSrc = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${notesUrl}`;


const handleDownloadNotes = async () => {
  const res = await fetch(playerData.lectureNotesUrl);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lecture-notes-${playerData.lectureId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

 
  const handleRate =  async(rating)=>{
    try {
      const token = await getToken();
      const {data} = await axios.post(backendUrl+'/api/user/add-rating',{courseId,rating},{
             headers:{
              Authorization: `Bearer ${token}`
             }
           })
           console.log(data)
        if(data.success){
          toast.success(data.message)
          fetchUserEnrolledCources()
        }
        else{
            toast.error(data.message)
        }
    } catch (error) {
       toast.error(error.message)
    }
  }

  useEffect(() => {
    getCourseProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])



  return courseData? (
    <>
      <div className="p-4 sm:p-10 flex flex-col-reverse md:grid md:grid-cols-2 gap-10 md:px-36">
        {/* left column */}
        <div className="text-gray-800">
          <h2 className="text-xl font-semibold">Course Structure</h2>
          <div className="pt-5">
            {courseData &&
              courseData.courseContent.map((chapter, index) => (
                <div
                  key={index}
                  className="border border-gray-300 bg-white mb-2 rounded"
                >
                  <div
                    onClick={() => toggelSection(index)}
                    className="flex items-center justify-between px-4 py-3 cursor-pointer select-none "
                  >
                    <div className="flex items-center gap-2">
                      <img
                        className={`transform transition-transform ${openSection[index] ? "rotate-180" : ""}`}
                        src={assets.down_arrow_icon}
                        alt="arrow_icon"
                      />
                      <p className="font-medium md:text-base text-sm">
                        {" "}
                        {chapter.chapterTitle}
                      </p>
                    </div>
                    <p className="text-sm md:text-default">
                      {chapter.chapterContent.length} lectures -{" "}
                      {calculateChapterTime(chapter)}
                    </p>
                  </div>

                  <div
                    className={`overflow-hidden transition-all duration-300  ${openSection[index] ? "max-h-96" : "max-h-0"}`}
                  >
                    <ul className="list-disc md:pl-10 pl-4 pr-4 py-2 text-gray-600 border-t border-gray-300">
                      {chapter.chapterContent.map((lecture, i) => (
                        <li key={i} className="flex items-start gap-2 py-1">
                          <img
                            src={
                             progressData&& progressData.lectureCompleted.includes(lecture.lectureId) ? assets.blue_tick_icon : assets.play_icon
                            }
                            alt="play_icon"
                            className="w-4 h-4 mt-1"
                          />
                          <div className="flex items-center justify-between w-full text-gray-800 text-xs md:text-default">
                            <p>{lecture.lectureTitle}</p>
                            <div className="flex gap-2">
                              {lecture.lectureUrl && (
                                <p
                                  onClick={() =>
                                    setplayerData({
                                      ...lecture,
                                      chapter: index + 1,
                                      lecture: i + 1,
                                    })
                                  }
                                  className="text-blue-500 cursor-pointer"
                                >
                                  Watch
                                </p>
                              )}
                              <p>
                                {humanizeDuration(
                                  lecture.lectureDuration * 60 * 1000,
                                  { units: ["h", "m"] },
                                )}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
          </div>

          <div className="flex items-center gap-2 py-3 mt-10">
            <h1 className="text-xl font-bold">Rate this Course:</h1>
            <Rating initialRating={initialRating}  onRate={handleRate}/>
          </div>
        </div>
        {/* right column */}
        <div className="md:mt-10">
          {playerData ? (
            <div>
              <YouTube
                videoId={playerData.lectureUrl.split("/").pop()}
                iframeClassName="w-full aspect-video"
              />
              <div className="flex justify-between items-center mt-1">
                <p>
                  {" "}
                  {playerData.chapter}.{playerData.lecture}{" "}
                  {playerData.lectureTitle}
                </p>
                <button onClick={()=>markLectureAsCompleted(playerData.lectureId)}className="text-blue-600">
                  {progressData&& progressData.lectureCompleted.includes(playerData.lectureId)? "Completed" : "Mark Complete"}
                </button>
              </div>
              {playerData.lectureNotesUrl && (
              
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
                    <button className="text-sm text-blue-600 hover:underline bg-transparent border-none p-0"
 onClick={handleDownloadNotes} >Download Notes</button>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        Lecture Notes
                      </h3>
                      <p className="text-xs text-slate-500">
                        View the PDF directly below without leaving the player.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNotes((prev) => !prev)}
                      className="px-3 py-1.5 text-xs rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    >
                      {showNotes ? "Hide notes" : "Show notes"}
                    </button>
                  </div>
                  {showNotes && (
                    <div className="mt-3 border border-slate-200 w-full rounded-lg overflow-hidden bg-white h-72 md:h-80">
                      
                      
                      <iframe
                        src={iframeSrc}
                        title="Lecture Notes"
                        className="w-full h-full"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <img src={courseData ? courseData.courseThumbnail : ""} alt="" />
          )}
        </div>
      </div>
      <Footer />
    </>
  ):<Loading/>;
};

export default Player;
