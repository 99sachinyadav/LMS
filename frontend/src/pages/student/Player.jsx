import React, { useContext, useEffect, useRef, useState } from "react";
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
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFile, setAiFile] = useState(null);
  const [aiDisplayAnswer, setAiDisplayAnswer] = useState("");
  const aiAnswerBoxRef = useRef(null);
  const [languageByQuestion, setLanguageByQuestion] = useState({});
  const [codeByQuestion, setCodeByQuestion] = useState({});
  const [stdinByQuestion, setStdinByQuestion] = useState({});
  const [runResultsByQuestion, setRunResultsByQuestion] = useState({});
  const [runningQuestionId, setRunningQuestionId] = useState(null);
  const [isEditorDark, setIsEditorDark] = useState(false);

  const languageOptions = [
    { key: "javascript", label: "JavaScript" },
    { key: "cpp", label: "C++" },
    { key: "python", label: "Python" },
    { key: "java", label: "Java" },
    { key: "c", label: "C" },
    { key: "go", label: "Go" },
    { key: "rust", label: "Rust" },
    { key: "csharp", label: "C#" },
    { key: "php", label: "PHP" },
    { key: "ruby", label: "Ruby" },
    { key: "kotlin", label: "Kotlin" },
    { key: "swift", label: "Swift" },
    { key: "typescript", label: "TypeScript" },
  ];

  const buildDefaultCode = (_question, lang) => {
    const templates = {
      javascript: `const fs = require("fs");\nconst input = fs.readFileSync(0, "utf8").trim();\n\n// write your logic here\nconsole.log(input);\n`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  ios::sync_with_stdio(false);\n  cin.tie(nullptr);\n\n  string input;\n  getline(cin, input);\n  cout << input;\n  return 0;\n}\n`,
      python: `import sys\ninput_data = sys.stdin.read().strip()\n\n# write your logic here\nprint(input_data)\n`,
      java: `import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String input = sc.hasNextLine() ? sc.nextLine() : "";\n    System.out.println(input);\n  }\n}\n`,
      c: `#include <stdio.h>\n\nint main() {\n  char input[1000];\n  if (fgets(input, sizeof(input), stdin)) {\n    printf("%s", input);\n  }\n  return 0;\n}\n`,
      go: `package main\n\nimport (\n  "bufio"\n  "fmt"\n  "os"\n)\n\nfunc main() {\n  in := bufio.NewScanner(os.Stdin)\n  if in.Scan() {\n    fmt.Println(in.Text())\n  }\n}\n`,
      rust: `use std::io::{self, Read};\n\nfn main() {\n    let mut input = String::new();\n    io::stdin().read_to_string(&mut input).unwrap();\n    println!("{}", input.trim());\n}\n`,
      csharp: `using System;\n\npublic class Program {\n  public static void Main() {\n    var input = Console.ReadLine() ?? "";\n    Console.WriteLine(input);\n  }\n}\n`,
      php: `<?php\n$input = trim(stream_get_contents(STDIN));\necho $input . PHP_EOL;\n`,
      ruby: `input = STDIN.read.strip\nputs input\n`,
      kotlin: `fun main() {\n  val input = readLine() ?: ""\n  println(input)\n}\n`,
      swift: `import Foundation\nif let input = readLine() {\n  print(input)\n}\n`,
      typescript: `import * as fs from "fs";\nconst input = fs.readFileSync(0, "utf8").trim();\nconsole.log(input);\n`,
    };
    return templates[lang] || templates.javascript;
  };

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
    const matchedCourse = enrolledCourses.find((course) => course._id === courseId);
    if (!matchedCourse) return;

    setcourseData(matchedCourse);

    if (!userData?._id) {
      setinitialRating(0);
      return;
    }

    const existingRating = matchedCourse.courseRating?.find(
      (item) => item.userId === userData._id,
    );
    setinitialRating(existingRating?.rating || 0);
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

  const handleCodeKeyDown = (questionId, lang, currentValue, e) => {
    const pairs = {
      "{": "}",
      "(": ")",
      "[": "]",
      '"': '"',
      "'": "'",
      "`": "`",
    };

    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!pairs[e.key]) return;

    const input = e.target;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const left = currentValue.slice(0, start);
    const selected = currentValue.slice(start, end);
    const right = currentValue.slice(end);
    const close = pairs[e.key];

    e.preventDefault();

    const nextValue = `${left}${e.key}${selected}${close}${right}`;
    handleCodeChange(questionId, lang, nextValue);

    requestAnimationFrame(() => {
      const cursorPos = selected ? end + 2 : start + 1;
      input.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const handleRunCode = async () => {
    const question = getSelectedQuestion();
    if (!question) return;
    const qid = question.questionId;
    const lang = getSelectedLanguage(question);
    const codeKey = getCodeKey(qid, lang);
    const starter = question.starterCode || buildDefaultCode(question, lang);
    const code = codeByQuestion[codeKey] ?? starter;
    const stdin = stdinByQuestion[qid] ?? "";
    setRunningQuestionId(qid);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/user/course/${courseId}/programming-questions/${qid}/run`,
        { code, language: lang, stdin },
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
          language: lang,
          stdin,
          runResult: data.runResult || null,
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
  }, [enrolledCourses, userData, courseId]);

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

  useEffect(() => {
    if (!aiAnswer) {
      setAiDisplayAnswer("");
      return;
    }
    let index = 0;
    setAiDisplayAnswer("");
    const interval = setInterval(() => {
      index += 1;
      setAiDisplayAnswer(aiAnswer.slice(0, index));
      if (index >= aiAnswer.length) {
        clearInterval(interval);
      }
    }, 15);
    return () => clearInterval(interval);
  }, [aiAnswer]);

  useEffect(() => {
    if (aiAnswerBoxRef.current) {
      aiAnswerBoxRef.current.scrollTop = aiAnswerBoxRef.current.scrollHeight;
    }
  }, [aiDisplayAnswer]);

  const selectedQuestion = courseData?.isProgrammingCourse
    ? getSelectedQuestion()
    : null;

  const currentRunResult =
    selectedQuestion && runResultsByQuestion[selectedQuestion.questionId]
      ? runResultsByQuestion[selectedQuestion.questionId]
      : null;

  return courseData? (
    <>
      <div className="p-4 sm:p-10 flex flex-col-reverse md:grid md:grid-cols-2 gap-10 md:px-36 bg-gradient-to-b from-sky-50 via-white to-sky-50 ">
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
                  const starter = selectedQuestion.starterCode || buildDefaultCode(selectedQuestion, lang);
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
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setIsEditorDark((prev) => !prev)}
                              className="px-3 py-1.5 text-xs rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                            >
                              {isEditorDark ? "Light Editor" : "Dark Editor"}
                            </button>
                            <select
                              value={lang}
                              onChange={(e) => handleLanguageSwitch(qid, e.target.value)}
                              className="px-2 py-1.5 text-xs rounded border border-slate-300 bg-white text-slate-700"
                            >
                              {languageOptions.map((opt) => (
                                <option key={opt.key} value={opt.key}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <textarea
                          spellCheck={false}
                          autoCorrect="off"
                          autoCapitalize="off"
                          className={`w-full border rounded-md text-sm font-mono p-3 min-h-[180px] outline-none focus:outline-none focus:ring-0 ${
                            isEditorDark
                              ? "bg-slate-900 text-white border-slate-700 placeholder:text-slate-400"
                              : "bg-white text-slate-800 border-slate-300"
                          }`}
                          value={codeByQuestion[codeKey] ?? starter}
                          onChange={(e) =>
                            handleCodeChange(qid, lang, e.target.value)
                          }
                          onKeyDown={(e) =>
                            handleCodeKeyDown(
                              qid,
                              lang,
                              codeByQuestion[codeKey] ?? starter,
                              e,
                            )
                          }
                        />
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-slate-700 mb-2">
                          Terminal Input (stdin)
                        </p>
                        <textarea
                          spellCheck={false}
                          autoCorrect="off"
                          autoCapitalize="off"
                          className={`w-full border rounded-md text-sm font-mono p-3 min-h-[90px] outline-none focus:outline-none focus:ring-0 ${
                            isEditorDark
                              ? "bg-slate-900 text-white border-slate-700 placeholder:text-slate-400"
                              : "bg-white text-slate-800 border-slate-300"
                          }`}
                          value={stdinByQuestion[qid] ?? ""}
                          onChange={(e) =>
                            setStdinByQuestion((prev) => ({ ...prev, [qid]: e.target.value }))
                          }
                          placeholder="Type input exactly as stdin."
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-slate-500">
                          Enter input exactly like terminal stdin. Output/errors appear below.
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
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-slate-800">
                              Run Result
                            </p>
                            <span className="text-[11px] font-medium text-slate-600">
                              {currentRunResult.runResult?.status || "Unknown"}
                            </span>
                          </div>
                          <div className="max-h-56 overflow-auto text-[11px] space-y-2">
                            <div className="border border-slate-100 rounded p-2 bg-slate-950 text-slate-100">
                              <div className="font-semibold mb-1 text-slate-300">Terminal Session</div>
                              <pre className="whitespace-pre-wrap break-all">
                                {`${(currentRunResult.stdin || "")
                                  .split("\n")
                                  .filter((line) => line.length > 0)
                                  .map((line) => `> ${line}`)
                                  .join("\n")}${
                                  currentRunResult.stdin ? "\n" : ""
                                }${currentRunResult.runResult?.terminalOutput || "(no output)"}`}
                              </pre>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Time: {currentRunResult.runResult?.time || "-"}s | Memory:{" "}
                              {currentRunResult.runResult?.memory || "-"} KB
                            </div>
                            {currentRunResult.error && (
                              <div className="text-red-600">Error: {currentRunResult.error}</div>
                            )}
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
              </div>
            ) : (
              <img src={courseData ? courseData.courseThumbnail : ""} alt="" />
            )}
          </div>

          {showAiAssistant && (
                  <div className="mt-4 border border-slate-200 rounded-xl bg-white p-3 text-xs max-h-96 md:max-h-[28rem] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-slate-800 text-sm">AI Helper</p>
                      <span className="text-[10px] text-slate-500">
                        Debug code & ask study questions
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2">
                      Ask course-related programming questions or paste code you want to debug.
                      Files (image/PDF) will be sent along with your question.
                    </p>
                    <textarea
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      spellCheck={false}
                      autoCorrect="off"
                      autoCapitalize="off"
                      className="w-full border border-slate-300 rounded-md text-sm p-2 min-h-[140px] outline-none focus:outline-none focus:ring-0"
                      placeholder="Describe your bug or ask a question about this lecture or your code..."
                    />
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <label className="text-[11px] text-slate-600 cursor-pointer">
                        <span className="px-2 py-1 rounded border border-slate-200 bg-slate-50 mr-1">
                          Attach image/PDF
                        </span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => setAiFile(e.target.files?.[0] || null)}
                        />
                      </label>
                      {aiFile && (
                        <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                          {aiFile.name}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          if (!aiQuestion.trim()) return;
                          try {
                            setAiLoading(true);
                            setAiAnswer("");
                            const token = await getToken();
                            const formData = new FormData();
                            formData.append("message", aiQuestion);
                            if (selectedQuestion) {
                              const lang = getSelectedLanguage(selectedQuestion);
                              const codeKey = getCodeKey(selectedQuestion.questionId, lang);
                              const code = codeByQuestion[codeKey] || "";
                              formData.append("language", lang);
                              formData.append("code", code);
                            }
                            formData.append("courseId", courseId);
                            if (aiFile) {
                              formData.append("attachment", aiFile);
                            }
                            const { data } = await axios.post(
                              `${backendUrl}/api/user/ai/chat`,
                              formData,
                              {
                                headers: {
                                  Authorization: `Bearer ${token}`,
                                },
                              },
                            );
                            if (!data.success) {
                              toast.error(data.message || "AI assistant error");
                            }
                            setAiAnswer(data.reply || "");
                            if (data.success && data.reply) {
                              setAiQuestion("");
                            }
                          } catch (error) {
                            toast.error(error.message || "Failed to contact AI assistant");
                          } finally {
                            setAiLoading(false);
                          }
                        }}
                        disabled={!aiQuestion.trim() || aiLoading}
                        className="px-4 py-1.5 rounded bg-blue-600 text-white text-xs disabled:opacity-60"
                      >
                        {aiLoading ? "Asking..." : "Ask AI"}
                      </button>
                    </div>
                    {aiDisplayAnswer && (
                      <div
                        ref={aiAnswerBoxRef}
                        className="mt-3 border border-slate-200 rounded bg-slate-50 p-2 text-sm max-h-80 overflow-auto whitespace-pre-wrap"
                      >
                        {aiDisplayAnswer}
                      </div>
                    )}
                  </div>
                )}

                {playerData && playerData.lectureNotesUrl && (
                
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
                      <div className="mt-3 border border-slate-200 w-full rounded-lg overflow-hidden bg-white h-72 md:h-96">
                        
                        
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


        </div>
      <button
        type="button"
        onClick={() => setShowAiAssistant((prev) => !prev)}
        className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-20 rounded-full   h-28 w-28  md:w-32 md:h-32 flex items-center justify-center text-xs md:text-sm"
      >
        <img className="h-full w-full rounded-full" src={assets.AI2}/>

      </button>
      <Footer />
    </>
  ) : <Loading />;
};

export default Player;

