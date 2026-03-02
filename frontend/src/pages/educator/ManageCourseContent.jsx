import React, { useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import Loading from "../../components/student/Loading";

const toGviewUrl = (url) =>
  `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`;

const ManageCourseContent = () => {
  const { backendUrl, getToken } = useContext(AppContext);
  const { courseId } = useParams();

  const [course, setCourse] = useState(null);
  const [openChapter, setOpenChapter] = useState({});
  const [thumbnailUploading, setThumbnailUploading] = useState(false);

  const [showChapterPopup, setShowChapterPopup] = useState(false);
  const [chapterTitleInput, setChapterTitleInput] = useState("");

  const [showLecturePopup, setShowLecturePopup] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState(null);
  const [lectureDetails, setLectureDetails] = useState({
    lectureTitle: "",
    lectureDuration: "",
    lectureUrl: "",
    isPreviewFree: false,
    lectureNotesUrl: "",
  });
  const [notesUploading, setNotesUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showQuestionPopup, setShowQuestionPopup] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    title: "",
    description: "",
    starterCode: "",
    language: "javascript",
    testCases: [
      { input: "", expectedOutput: "" },
      { input: "", expectedOutput: "" },
      { input: "", expectedOutput: "" },
      { input: "", expectedOutput: "" },
    ],
  });

  const courseTitle = useMemo(() => course?.courseTitle || "Course", [course]);

  const fetchCourse = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(
        backendUrl + `/api/educator/course/${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data.success) setCourse(data.course);
      else toast.error(data.message);
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const toggleChapter = (chapterId) => {
    setOpenChapter((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  const handleNotesFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNotesUploading(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("notesFile", file);
      const { data } = await axios.post(
        backendUrl + "/api/educator/upload-notes",
        formData,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data.success) {
        setLectureDetails((prev) => ({ ...prev, lectureNotesUrl: data.url }));
        toast.success("Notes uploaded");
      } else {
        toast.error(data.message || "Upload failed");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setNotesUploading(false);
      e.target.value = "";
    }
  };

  const addChapter = async () => {
    const title = chapterTitleInput.trim();
    if (!title) return toast.error("Enter chapter title");

    setSaving(true);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        backendUrl + `/api/educator/course/${courseId}/chapters`,
        { chapterTitle: title },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data.success) {
        setCourse(data.course);
        setChapterTitleInput("");
        setShowChapterPopup(false);
        toast.success("Chapter added");
      } else toast.error(data.message);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateThumbnail = async (file) => {
    if (!file) return;
    setThumbnailUploading(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("image", file);
      const { data } = await axios.put(
        backendUrl + `/api/educator/course/${courseId}/thumbnail`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data.success) {
        setCourse(data.course);
        toast.success("Thumbnail updated");
      } else {
        toast.error(data.message || "Failed to update thumbnail");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setThumbnailUploading(false);
    }
  };

  const openAddLecture = (chapterId) => {
    setCurrentChapterId(chapterId);
    setLectureDetails({
      lectureTitle: "",
      lectureDuration: "",
      lectureUrl: "",
      isPreviewFree: false,
      lectureNotesUrl: "",
    });
    setShowLecturePopup(true);
  };

  const addLecture = async () => {
    if (!currentChapterId) return;
    if (!lectureDetails.lectureTitle.trim()) return toast.error("Enter lecture title");
    if (!lectureDetails.lectureUrl.trim()) return toast.error("Enter lecture URL");
    if (!lectureDetails.lectureDuration) return toast.error("Enter duration");

    setSaving(true);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        backendUrl + `/api/educator/course/${courseId}/lectures`,
        {
          chapterId: currentChapterId,
          lectureTitle: lectureDetails.lectureTitle,
          lectureDuration: Number(lectureDetails.lectureDuration),
          lectureUrl: lectureDetails.lectureUrl,
          isPreviewFree: lectureDetails.isPreviewFree,
          lectureNotesUrl: lectureDetails.lectureNotesUrl || null,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data.success) {
        setCourse(data.course);
        setShowLecturePopup(false);
        toast.success("Lecture added");
      } else toast.error(data.message);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const replaceNotes = async (lectureId, notesUrl) => {
    setSaving(true);
    try {
      const token = await getToken();
      const { data } = await axios.put(
        backendUrl + `/api/educator/course/${courseId}/lectures/${lectureId}`,
        { lectureNotesUrl: notesUrl || null },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data.success) {
        setCourse(data.course);
        toast.success("Notes updated");
      } else toast.error(data.message);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const uploadAndReplaceNotes = async (lectureId, file) => {
    if (!file) return;
    setSaving(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("notesFile", file);
      const up = await axios.post(backendUrl + "/api/educator/upload-notes", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!up.data.success) return toast.error(up.data.message || "Upload failed");
      await replaceNotes(lectureId, up.data.url);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestCaseChange = (index, field, value) => {
    setQuestionForm((prev) => {
      const next = { ...prev };
      const cases = [...next.testCases];
      cases[index] = { ...cases[index], [field]: value };
      next.testCases = cases;
      return next;
    });
  };

  const addTestCaseRow = () => {
    setQuestionForm((prev) => ({
      ...prev,
      testCases: [...prev.testCases, { input: "", expectedOutput: "" }],
    }));
  };

  const addProgrammingQuestion = async () => {
    const { title, description, testCases, starterCode, language } = questionForm;
    if (!title.trim() || !description.trim()) {
      toast.error("Enter question title and description");
      return;
    }
    const filledCases = testCases.filter(
      (tc) => tc.input.trim() && tc.expectedOutput.trim(),
    );
    if (filledCases.length < 4) {
      toast.error("Please provide at least 4 complete test cases");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        backendUrl + `/api/educator/course/${courseId}/programming-questions`,
        {
          title,
          description,
          starterCode,
          language,
          testCases: filledCases,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data.success) {
        setCourse(data.course);
        setShowQuestionPopup(false);
        toast.success("Programming question added");
        setQuestionForm({
          title: "",
          description: "",
          starterCode: "",
          language: "javascript",
          testCases: [
            { input: "", expectedOutput: "" },
            { input: "", expectedOutput: "" },
            { input: "", expectedOutput: "" },
            { input: "", expectedOutput: "" },
          ],
        });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const removeProgrammingQuestion = async (questionId) => {
    if (!questionId) return;
    setSaving(true);
    try {
      const token = await getToken();
      const { data } = await axios.delete(
        backendUrl + `/api/educator/course/${courseId}/programming-questions/${questionId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data.success) {
        setCourse(data.course);
        toast.success("Question removed");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!course) return <Loading />;

  return (
    <div className="h-screen overflow-scroll flex flex-col md:p-8 p-4 pt-8 pb-16">
      <div className="max-w-4xl w-full">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{courseTitle}</h2>
            <p className="text-sm text-gray-500">
              Manage chapters, lectures, notes, and programming questions (works even if
              published).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="bg-white border px-4 py-2 rounded cursor-pointer text-sm text-gray-900 disabled:opacity-60">
              {thumbnailUploading ? "Updating..." : "Update Thumbnail"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={thumbnailUploading}
                onChange={(e) => updateThumbnail(e.target.files?.[0])}
              />
            </label>
            <button
              type="button"
              onClick={() => setShowChapterPopup(true)}
              className="bg-black text-white px-4 py-2 rounded"
            >
              + Add Chapter
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          {course.courseThumbnail && (
            <img
              src={course.courseThumbnail}
              alt="Course Thumbnail"
              className="w-24 h-16 object-cover rounded border bg-white"
            />
          )}
          <div className="text-xs text-gray-500">
            Thumbnail can be updated anytime (even after publishing).
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {course.courseContent?.map((chapter, idx) => (
            <div key={chapter.chapterId} className="bg-white border rounded-lg">
              <div className="flex items-center justify-between p-4 border-b gap-4">
                <div className="flex items-center gap-2">
                  <img
                    onClick={() => toggleChapter(chapter.chapterId)}
                    src={assets.dropdown_icon}
                    width={14}
                    alt=""
                    className={`cursor-pointer transition-all ${
                      openChapter[chapter.chapterId] ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                  <div>
                    <div className="font-semibold text-gray-900">
                      {idx + 1}. {chapter.chapterTitle}
                    </div>
                    <div className="text-xs text-gray-500">
                      {chapter.chapterContent?.length || 0} lectures
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openAddLecture(chapter.chapterId)}
                  className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded border border-indigo-100"
                >
                  + Add Lecture
                </button>
              </div>

              {openChapter[chapter.chapterId] && (
                <div className="p-4">
                  {chapter.chapterContent?.length ? (
                    <div className="space-y-2">
                      {chapter.chapterContent.map((lec) => (
                        <div
                          key={lec.lectureId}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded border bg-gray-50"
                        >
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {lec.lectureTitle}
                            </div>
                            <div className="text-xs text-gray-500">
                              {lec.lectureDuration} mins •{" "}
                              {lec.isPreviewFree ? "Free preview" : "Paid"}
                              {lec.lectureNotesUrl ? " • Notes attached" : ""}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <a
                              href={lec.lectureUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded border bg-white text-blue-600"
                            >
                              Video
                            </a>

                            {lec.lectureNotesUrl ? (
                              <a
                                href={toGviewUrl(lec.lectureNotesUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded border bg-white text-green-700"
                              >
                                Notes (inline)
                              </a>
                            ) : (
                              <span className="text-xs text-gray-500 px-3 py-1.5 border rounded bg-white">
                                No notes
                              </span>
                            )}

                            <label className="px-3 py-1.5 rounded border bg-white cursor-pointer text-gray-800">
                              Replace notes
                              <input
                                type="file"
                                accept=".pdf,application/pdf"
                                className="hidden"
                                disabled={saving}
                                onChange={(e) =>
                                  uploadAndReplaceNotes(lec.lectureId, e.target.files?.[0])
                                }
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      No lectures yet. Click “Add Lecture”.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 border rounded-lg bg-white">
          <div className="flex items-center justify-between p-4 border-b gap-4">
            <div>
              <div className="font-semibold text-gray-900 text-sm">
                Programming Questions
              </div>
              <div className="text-xs text-gray-500">
                Add coding questions students will solve inside the player.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowQuestionPopup(true)}
              className="bg-indigo-600 text-white px-3 py-1.5 rounded text-xs"
            >
              + Add Question
            </button>
          </div>
          <div className="p-4">
            {course.programmingQuestions?.length ? (
              <ul className="space-y-2 text-sm text-gray-800">
                {course.programmingQuestions.map((q, idx) => (
                  <li
                    key={q.questionId || idx}
                    className="border rounded p-2 bg-gray-50 text-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium">
                          {idx + 1}. {q.title}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          {(q.language || "javascript").toString().toUpperCase()} •{" "}
                          {q.testCases?.length || 0} test cases
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => removeProgrammingQuestion(q.questionId)}
                        className="px-3 py-1.5 rounded border bg-white text-red-600 text-[11px] disabled:opacity-60"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-gray-500">
                No programming questions yet. Click “Add Question”.
              </div>
            )}
          </div>
        </div>
      </div>

      {showChapterPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-black text-gray-700 p-4 rounded relative w-full max-w-96">
            <h2 className="text-lg font-semibold mb-1">Add Chapter</h2>
            <p className="text-sm text-gray-500 mb-4">
              You can add chapters even after publishing.
            </p>
            <div className="mb-3">
              <p className="text-sm">Chapter Title</p>
              <input
                type="text"
                className="mt-1 block w-full border rounded py-2 px-3 outline-none"
                value={chapterTitleInput}
                onChange={(e) => setChapterTitleInput(e.target.value)}
                placeholder="e.g. Getting Started"
              />
            </div>
            <button
              onClick={addChapter}
              type="button"
              disabled={saving}
              className="w-full bg-blue-500 disabled:opacity-60 text-white px-4 py-2 rounded"
            >
              {saving ? "Saving..." : "Add Chapter"}
            </button>
            <img
              src={assets.cross_icon}
              onClick={() => {
                setShowChapterPopup(false);
                setChapterTitleInput("");
              }}
              className="absolute top-4 right-4 w-4 cursor-pointer"
              alt=""
            />
          </div>
        </div>
      )}

      {showLecturePopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-black text-gray-700 p-4 rounded relative w-full max-w-md">
            <h2 className="text-lg font-semibold mb-1">Add Lecture</h2>
            <p className="text-sm text-gray-500 mb-4">
              Upload notes now or add them later.
            </p>

            <div className="space-y-3">
              <div>
                <p className="text-sm">Lecture Title</p>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded py-2 px-3 outline-none"
                  value={lectureDetails.lectureTitle}
                  onChange={(e) =>
                    setLectureDetails((p) => ({ ...p, lectureTitle: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-sm">Duration (minutes)</p>
                  <input
                    type="number"
                    className="mt-1 block w-full border rounded py-2 px-3 outline-none"
                    value={lectureDetails.lectureDuration}
                    onChange={(e) =>
                      setLectureDetails((p) => ({ ...p, lectureDuration: e.target.value }))
                    }
                  />
                </div>

                <label className="flex items-end gap-2 pb-1 select-none">
                  <input
                    type="checkbox"
                    className="scale-125"
                    checked={lectureDetails.isPreviewFree}
                    onChange={(e) =>
                      setLectureDetails((p) => ({ ...p, isPreviewFree: e.target.checked }))
                    }
                  />
                  <span className="text-sm">Free Preview</span>
                </label>
              </div>

              <div>
                <p className="text-sm">Lecture URL</p>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded py-2 px-3 outline-none"
                  value={lectureDetails.lectureUrl}
                  onChange={(e) =>
                    setLectureDetails((p) => ({ ...p, lectureUrl: e.target.value }))
                  }
                  placeholder="YouTube URL"
                />
              </div>

              <div>
                <p className="text-sm">Lecture Notes (PDF)</p>
                <div className="mt-1 border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-gray-600">
                      {lectureDetails.lectureNotesUrl ? (
                        <span className="text-green-700 font-medium">Notes attached</span>
                      ) : (
                        "Drag/drop not required — choose a PDF"
                      )}
                    </div>
                    {lectureDetails.lectureNotesUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setLectureDetails((p) => ({ ...p, lectureNotesUrl: "" }))
                        }
                        className="text-sm text-red-600 underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="mt-2 block w-full text-sm text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700"
                    onChange={handleNotesFileChange}
                    disabled={notesUploading || saving}
                  />
                  {notesUploading && (
                    <div className="text-xs text-gray-500 mt-2">Uploading…</div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={addLecture}
              type="button"
              disabled={saving || notesUploading}
              className="w-full mt-4 bg-blue-500 disabled:opacity-60 text-white px-4 py-2 rounded"
            >
              {saving ? "Saving..." : "Add Lecture"}
            </button>

            <img
              src={assets.cross_icon}
              onClick={() => setShowLecturePopup(false)}
              className="absolute top-4 right-4 w-4 cursor-pointer"
              alt=""
            />
          </div>
        </div>
      )}

      {showQuestionPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-black text-gray-700 p-4 rounded relative w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-1">Add Programming Question</h2>
            <p className="text-xs text-gray-500 mb-3">
              You can add questions any time, even after publishing. Students will see
              them inside the course player with a code editor.
            </p>

            <div className="space-y-3">
              <div>
                <p className="text-sm">Title</p>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded py-2 px-3 outline-none text-sm"
                  value={questionForm.title}
                  onChange={(e) =>
                    setQuestionForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="Two Sum, Reverse String, etc."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-sm">Description</p>
                  <textarea
                    className="mt-1 block w-full border rounded py-2 px-3 outline-none text-sm min-h-[80px]"
                    value={questionForm.description}
                    onChange={(e) =>
                      setQuestionForm((p) => ({ ...p, description: e.target.value }))
                    }
                    placeholder="Explain the problem, constraints, and what the function should return."
                  />
                </div>
                <div>
                  <p className="text-sm">Language</p>
                  <select
                    className="mt-1 block w-full border rounded py-2 px-3 outline-none text-sm bg-white"
                    value={questionForm.language}
                    onChange={(e) =>
                      setQuestionForm((p) => ({ ...p, language: e.target.value }))
                    }
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>
              </div>

              <div>
                <p className="text-sm">
                  Starter Code (optional,{" "}
                  {questionForm.language === "cpp" ? "C++" : "JavaScript"})
                </p>
                <textarea
                  className="mt-1 block w-full border rounded py-2 px-3 outline-none text-xs font-mono min-h-[80px]"
                  value={questionForm.starterCode}
                  onChange={(e) =>
                    setQuestionForm((p) => ({ ...p, starterCode: e.target.value }))
                  }
                  placeholder={
                    questionForm.language === "cpp"
                      ? `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  ios::sync_with_stdio(false);\n  cin.tie(nullptr);\n\n  string input;\n  if (!getline(cin, input)) return 0;\n  // write your code using input\n  cout << input;\n  return 0;\n}`
                      : `async function solve(input) {\n  // write your code\n  return '';\n}`
                  }
                />
              </div>

              <div>
                <p className="text-sm mb-1">Test Cases (min 4)</p>
                <div className="space-y-2">
                  {questionForm.testCases.map((tc, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs"
                    >
                      <div>
                        <p className="mb-0.5 text-[11px] text-gray-600">Input #{idx + 1}</p>
                        <input
                          type="text"
                          className="block w-full border rounded py-1.5 px-2 outline-none"
                          value={tc.input}
                          onChange={(e) =>
                            handleTestCaseChange(idx, "input", e.target.value)
                          }
                          placeholder='e.g. "2 3" or "5"'
                        />
                      </div>
                      <div>
                        <p className="mb-0.5 text-[11px] text-gray-600">
                          Expected Output #{idx + 1}
                        </p>
                        <input
                          type="text"
                          className="block w-full border rounded py-1.5 px-2 outline-none"
                          value={tc.expectedOutput}
                          onChange={(e) =>
                            handleTestCaseChange(idx, "expectedOutput", e.target.value)
                          }
                          placeholder='e.g. "5"'
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addTestCaseRow}
                  className="mt-2 text-[11px] text-indigo-700 underline"
                >
                  + Add another test case
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowQuestionPopup(false)}
                className="px-4 py-2 rounded border text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addProgrammingQuestion}
                disabled={saving}
                className="px-4 py-2 rounded bg-blue-500 text-white text-sm disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Question"}
              </button>
            </div>

            <img
              src={assets.cross_icon}
              onClick={() => setShowQuestionPopup(false)}
              className="absolute top-4 right-4 w-4 cursor-pointer"
              alt=""
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCourseContent;

