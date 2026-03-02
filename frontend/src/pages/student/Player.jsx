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
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [languageByQuestion, setLanguageByQuestion] = useState({});
  const [codeByQuestion, setCodeByQuestion] = useState({});
  const [runResultsByQuestion, setRunResultsByQuestion] = useState({});
  const [runningQuestionId, setRunningQuestionId] = useState(null);

  const DEFAULT_JS = `async function solve(input) {\n  // write your code here\n  return '';\n}\n`;
  const DEFAULT_CPP = `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  ios::sync_with_stdio(false);\n  cin.tie(nullptr);\n\n  string input;\n  if (!getline(cin, input)) return 0;\n  // write your code using input\n  cout << input;\n  return 0;\n}\n`;

  const getSelectedLanguage = (question) => {
    if (!question) return "javascript";
    return languageByQuestion[question.questionId] ||
      (question.language || "javascript").toLowerCase().replace("c++", "cpp") ||
      "javascript";
  };

  const getCodeKey = (questionId, lang) => `${questionId}:${lang}`;

  const handleLanguageSwitch = (questionId, lang) => {
    setLanguageByQuestion((prev) => ({ ...prev, [questionId]: lang }));
  };
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

  const getSelectedQuestion = () => {
    if (!courseData || !courseData.programmingQuestions) return null;
    return (
      courseData.programmingQuestions.find(
        (q) => q.questionId === selectedQuestionId,
      ) || courseData.programmingQuestions[0]
    );
  };

  const handleSelectQuestion = (questionId) => {
    setSelectedQuestionId(questionId);
  };

  const handleCodeChange = (questionId, lang, value) => {
    setCodeByQuestion((prev) => ({
      ...prev,
      [getCodeKey(questionId, lang)]: value,
    }));
  };

  const handleRunCode = async () => {
    const question = getSelectedQuestion();
    if (!question) return;
    const qid = question.questionId;
    const lang = getSelectedLanguage(question);
    const codeKey = getCodeKey(qid, lang);
    const qLang = (question.language || "javascript").toLowerCase().replace("c++", "cpp");
    const starter = lang === "cpp"
      ? (question.starterCode && qLang === "cpp" ? question.starterCode : DEFAULT_CPP)
      : (question.starterCode && qLang !== "cpp" ? question.starterCode : DEFAULT_JS);
    const code = codeByQuestion[codeKey] ?? starter;
    setRunningQuestionId(qid);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/user/course/${courseId}/programming-questions/${qid}/run`,
        { code, language: lang },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!data.success) {
        toast.error(data.message || "Failed to run code");
      }
      setRunResultsByQuestion((prev) => ({
        ...prev,
        [qid]: {
          code,
          allPassed: data.allPassed,
          testResults: data.testResults || [],
          error: !data.success ? data.message : null,
        },
      }));
      setCodeByQuestion((prev) => ({
        ...prev,
        [codeKey]: code,
      }));
    } catch (error) {
      toast.error(error.message || "Failed to run code");
    } finally {
      setRunningQuestionId(null);
    }
  };

  const toggelSection = (index) => {
    setopenSection((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  useEffect(() => {
    if (enrolledCourses.length > 0) {
      getCourseData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // notes are shown via iframe URL directly; preloading not required
  }, [playerData?.lectureNotesUrl]);

 


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

  const selectedQuestion = courseData?.isProgrammingCourse
    ? getSelectedQuestion()
    : null;

  const currentRunResult =
    selectedQuestion && runResultsByQuestion[selectedQuestion.questionId]
      ? runResultsByQuestion[selectedQuestion.questionId]
      : null;

  return courseData? (
    <>
      <div className="p-4 sm:p-10 flex flex-col-reverse md:grid md:grid-cols-2 gap-10 md:px-36   bg-gradient-to-b from-cyan-100/60">
        {/* left column */}
        <div className="text-gray-800 space-y-6">
          <div>
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
          </div>

          {courseData?.isProgrammingCourse && courseData.programmingQuestions?.length > 0 && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    Programming Practice
                  </h3>
                  <p className="text-xs text-slate-500">
                    Solve these coding questions directly in the player.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  {courseData.programmingQuestions.map((q, idx) => (
                    <button
                      key={q.questionId}
                      type="button"
                      onClick={() => handleSelectQuestion(q.questionId)}
                      className={`px-3 py-1.5 rounded-full text-xs border ${
                        (selectedQuestion && selectedQuestion.questionId === q.questionId) ||
                        (!selectedQuestionId && idx === 0)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      {idx + 1}. {q.title}
                    </button>
                  ))}
                </div>

                {selectedQuestion && (() => {
                  const qid = selectedQuestion.questionId;
                  const lang = getSelectedLanguage(selectedQuestion);
                  const codeKey = getCodeKey(qid, lang);
                  const qLang = (selectedQuestion.language || "javascript").toLowerCase().replace("c++", "cpp");
                  const starter = lang === "cpp"
                    ? (selectedQuestion.starterCode && qLang === "cpp" ? selectedQuestion.starterCode : DEFAULT_CPP)
                    : (selectedQuestion.starterCode && qLang !== "cpp" ? selectedQuestion.starterCode : DEFAULT_JS);
                  return (
                  <div className="mt-2 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {selectedQuestion.title}
                      </p>
                      <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">
                        {selectedQuestion.description}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-slate-700">
                          Compiler
                        </p>
                        <div className="flex rounded overflow-hidden border border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleLanguageSwitch(qid, "javascript")}
                            className={`px-3 py-1.5 text-xs font-medium ${
                              lang === "javascript"
                                ? "bg-blue-600 text-white"
                                : "bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            JavaScript
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLanguageSwitch(qid, "cpp")}
                            className={`px-3 py-1.5 text-xs font-medium ${
                              lang === "cpp"
                                ? "bg-blue-600 text-white"
                                : "bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            C++
                          </button>
                        </div>
                      </div>
                      <textarea
                        spellCheck={false}
                        autoCorrect="off"
                        autoCapitalize="off"
                        className="w-full border border-slate-300 rounded-md text-xs font-mono p-2 min-h-[180px] outline-none focus:outline-none focus:ring-0"
                        value={codeByQuestion[codeKey] ?? starter}
                        onChange={(e) =>
                          handleCodeChange(qid, lang, e.target.value)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-slate-500">
                        {lang === "cpp"
                          ? "C++: read input from stdin, print result to stdout."
                          : "JavaScript: define solve(input) or main(input) and return the output string."}{" "}
                        Tested against {selectedQuestion.testCases?.length || 0} test cases.
                      </p>
                      <button
                        type="button"
                        onClick={handleRunCode}
                        disabled={runningQuestionId === selectedQuestion.questionId}
                        className="px-4 py-1.5 rounded bg-blue-600 text-white text-xs disabled:opacity-60"
                      >
                        {runningQuestionId === selectedQuestion.questionId
                          ? "Running..."
                          : "Run Code"}
                      </button>
                    </div>

                    {currentRunResult && (
                      <div className="mt-2 border border-slate-200 rounded-md bg-white p-2">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-slate-800">
                            Test Results
                          </p>
                          <span
                            className={`text-[11px] font-medium ${
                              currentRunResult.allPassed
                                ? "text-green-600"
                                : "text-amber-600"
                            }`}
                          >
                            {currentRunResult.allPassed
                              ? "All test cases passed"
                              : "Some test cases failed"}
                          </span>
                        </div>
                        <div className="max-h-40 overflow-auto text-[11px] space-y-1">
                          {currentRunResult.testResults?.map((t, idx) => (
                            <div
                              key={idx}
                              className="border border-slate-100 rounded p-1 bg-slate-50"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">
                                  Case {idx + 1}{" "}
                                  <span
                                    className={
                                      t.passed ? "text-green-600" : "text-red-600"
                                    }
                                  >
                                    {t.passed ? "✓" : "✕"}
                                  </span>
                                </span>
                              </div>
                              <div>Input: {t.input}</div>
                              <div>Expected: {t.expectedOutput}</div>
                              <div>Output: {t.output}</div>
                              {t.error && (
                                <div className="text-red-600">
                                  Error: {t.error}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })()}
              </div>
            </div>
          )}

          <div className="text-sm md:text-default">
            <h3 className="text-xl font-semibold font-gray-800">
              Course Description
            </h3>
            <p
              className="pt-3 rich-text"
              dangerouslySetInnerHTML={{
                __html: courseData.courseDescription,
              }}
            />
          </div>

          <div className="flex items-center gap-2 py-3">
            <h1 className="text-xl font-bold">Rate this Course:</h1>
            <Rating initialRating={initialRating}  onRate={handleRate}/>
          </div>
        </div>
        {/* right column */}
        <div className="md:mt-10 space-y-6">
          <div>
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
                          src={`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(playerData.lectureNotesUrl)}`}
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
      </div>
      <Footer />
    </>
  ):<Loading/>;
};

export default Player;
