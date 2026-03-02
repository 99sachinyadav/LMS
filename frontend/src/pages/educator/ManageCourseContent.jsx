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

  if (!course) return <Loading />;

  return (
    <div className="h-screen overflow-scroll flex flex-col md:p-8 p-4 pt-8 pb-16">
      <div className="max-w-4xl w-full">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{courseTitle}</h2>
            <p className="text-sm text-gray-500">
              Manage chapters, lectures, and notes (works even if published).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowChapterPopup(true)}
            className="bg-black text-white px-4 py-2 rounded"
          >
            + Add Chapter
          </button>
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
    </div>
  );
};

export default ManageCourseContent;

