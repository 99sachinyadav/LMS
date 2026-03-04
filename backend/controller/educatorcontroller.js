import {clerkClient} from '@clerk/express'
import Course from '../model/course.js';
import {v2 as cloudinary} from 'cloudinary';
import { Purchase } from '../model/purchase.js';
import User from '../model/User.js';
import crypto from 'node:crypto';
 
// update role to educator 
export const updateRoleToEducator = async (req,res)=>{
    try {
        const userId = req.auth.userId;

        await clerkClient.users.updateUserMetadata(userId,{
              publicMetadata:{
                role:'educator',
              }
        })
        res.json({sucess:true,message:'You can publish a course now'})
        
    } catch (error) {
        res.json({sucess:false,message:error.message})
    }
}

//  Add New Course
export const addCourse = async(req,res)=>{
     try {
        const {courseData} = req.body
        const imageFile = req.file
        const educatorId = req.auth.userId

        if(!imageFile){
           return res.json({sucess:false,message:'Thumbnail Not Attached'}) 
        }

        const parsedCouseData = await JSON.parse(courseData)
        parsedCouseData.educator= educatorId
        // Ensure programming fields have safe defaults if not provided
        if (typeof parsedCouseData.isProgrammingCourse === "undefined") {
            parsedCouseData.isProgrammingCourse = false;
        }
        if (!Array.isArray(parsedCouseData.programmingQuestions)) {
            parsedCouseData.programmingQuestions = [];
        } else {
            parsedCouseData.programmingQuestions = parsedCouseData.programmingQuestions.map((q) => {
                const functionName = String(q?.functionName || "solve")
                    .trim()
                    .replace(/[^a-zA-Z0-9_]/g, "") || "solve";
                const argumentNames = Array.isArray(q?.argumentNames)
                    ? q.argumentNames
                        .map((arg) => String(arg || "").trim().replace(/[^a-zA-Z0-9_]/g, ""))
                        .filter(Boolean)
                    : [];
                const testCases = Array.isArray(q?.testCases)
                    ? q.testCases.map((tc) => ({
                        input: String(tc?.input ?? ""),
                        expectedOutput: String(tc?.expectedOutput ?? ""),
                    }))
                    : [];

                return {
                    ...q,
                    questionId: q?.questionId || crypto.randomUUID(),
                    functionName,
                    argumentNames,
                    testCases,
                };
            });
        }
        const newCourse = await Course.create(parsedCouseData)
        const imageUpload = await cloudinary.uploader.upload(imageFile.path)
        newCourse.courseThumbnail = imageUpload.secure_url
        await newCourse.save()
        res.json({sucess:true,message:'Course Added'})
     } catch (error) {
        res.json({success:false,message:error.message})
       
     }
}

// Upload lecture notes (PDF/document) to Cloudinary
export const uploadLectureNotes = async (req, res) => {
    try {
        const notesFile = req.file;
        if (!notesFile) {
            return res.json({ success: false, message: 'Notes file not attached' });
        }
        const uploadResult = await cloudinary.uploader.upload(notesFile.path, {
            resource_type: 'raw',
            folder: 'lms-lecture-notes',
            formate:"pdf",
        });
        res.json({ success: true, url: uploadResult.secure_url });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get educator course by id (full content)
export const getEducatorCourseById = async (req, res) => {
    try {
        const educator = req.auth.userId;
        const { id } = req.params;
        const course = await Course.findOne({ _id: id, educator });
        if (!course) {
            return res.json({ success: false, message: 'Course not found' });
        }
        res.json({ success: true, course });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Update course thumbnail (works even if published)
export const updateCourseThumbnail = async (req, res) => {
    try {
        const educator = req.auth.userId;
        const { courseId } = req.params;
        const imageFile = req.file;

        if (!imageFile) {
            return res.json({ success: false, message: 'Thumbnail image not attached' });
        }

        const course = await Course.findOne({ _id: courseId, educator });
        if (!course) return res.json({ success: false, message: 'Course not found' });

        const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
            folder: 'lms-course-thumbnails',
        });
        course.courseThumbnail = imageUpload.secure_url;
        await course.save();

        res.json({ success: true, message: 'Thumbnail updated', course });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Add a chapter to an existing course (published or not)
export const addChapterToCourse = async (req, res) => {
    try {
        const educator = req.auth.userId;
        const { courseId } = req.params;
        const { chapterTitle } = req.body;

        if (!chapterTitle || !String(chapterTitle).trim()) {
            return res.json({ success: false, message: 'Chapter title is required' });
        }

        const course = await Course.findOne({ _id: courseId, educator });
        if (!course) return res.json({ success: false, message: 'Course not found' });

        const nextOrder =
            course.courseContent.length > 0
                ? Math.max(...course.courseContent.map((c) => c.chapterOrder || 0)) + 1
                : 1;

        course.courseContent.push({
            chapterId: crypto.randomUUID(),
            chapterOrder: nextOrder,
            chapterTitle: String(chapterTitle).trim(),
            chapterContent: [],
        });

        await course.save();
        res.json({ success: true, message: 'Chapter added', course });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Add a lecture (and optional notes URL) to an existing course chapter
export const addLectureToCourse = async (req, res) => {
    try {
        const educator = req.auth.userId;
        const { courseId } = req.params;
        const {
            chapterId,
            lectureTitle,
            lectureDuration,
            lectureUrl,
            isPreviewFree,
            lectureNotesUrl,
        } = req.body;

        if (!chapterId) return res.json({ success: false, message: 'chapterId is required' });
        if (!lectureTitle || !String(lectureTitle).trim()) {
            return res.json({ success: false, message: 'Lecture title is required' });
        }
        if (!lectureUrl || !String(lectureUrl).trim()) {
            return res.json({ success: false, message: 'Lecture URL is required' });
        }
        const durationNum = Number(lectureDuration);
        if (!Number.isFinite(durationNum) || durationNum <= 0) {
            return res.json({ success: false, message: 'Lecture duration must be a number > 0' });
        }

        const course = await Course.findOne({ _id: courseId, educator });
        if (!course) return res.json({ success: false, message: 'Course not found' });

        const chapter = course.courseContent.find((c) => c.chapterId === chapterId);
        if (!chapter) return res.json({ success: false, message: 'Chapter not found' });

        const nextOrder =
            chapter.chapterContent.length > 0
                ? Math.max(...chapter.chapterContent.map((l) => l.lectureOrder || 0)) + 1
                : 1;

        chapter.chapterContent.push({
            lectureId: crypto.randomUUID(),
            lectureTitle: String(lectureTitle).trim(),
            lectureDuration: durationNum,
            lectureUrl: String(lectureUrl).trim(),
            isPreviewFree: Boolean(isPreviewFree),
            lectureOrder: nextOrder,
            lectureNotesUrl: lectureNotesUrl ? String(lectureNotesUrl).trim() : null,
        });

        await course.save();
        res.json({ success: true, message: 'Lecture added', course });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Update lecture fields (notes URL, URL, duration, title, preview)
export const updateLectureInCourse = async (req, res) => {
    try {
        const educator = req.auth.userId;
        const { courseId, lectureId } = req.params;
        const {
            lectureTitle,
            lectureDuration,
            lectureUrl,
            isPreviewFree,
            lectureNotesUrl,
        } = req.body;

        const course = await Course.findOne({ _id: courseId, educator });
        if (!course) return res.json({ success: false, message: 'Course not found' });

        let lectureRef = null;
        for (const chapter of course.courseContent) {
            const lecture = chapter.chapterContent.find((l) => l.lectureId === lectureId);
            if (lecture) {
                lectureRef = lecture;
                break;
            }
        }
        if (!lectureRef) return res.json({ success: false, message: 'Lecture not found' });

        if (lectureTitle !== undefined) lectureRef.lectureTitle = String(lectureTitle).trim();
        if (lectureUrl !== undefined) lectureRef.lectureUrl = String(lectureUrl).trim();
        if (lectureDuration !== undefined) lectureRef.lectureDuration = Number(lectureDuration);
        if (isPreviewFree !== undefined) lectureRef.isPreviewFree = Boolean(isPreviewFree);
        if (lectureNotesUrl !== undefined) {
            lectureRef.lectureNotesUrl = lectureNotesUrl ? String(lectureNotesUrl).trim() : null;
        }

        await course.save();
        res.json({ success: true, message: 'Lecture updated', course });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Add a programming question to a course (works even if published)
export const addProgrammingQuestionToCourse = async (req, res) => {
    try {
        const educator = req.auth.userId;
        const { courseId } = req.params;
        const {
            title,
            description,
            functionName = "solve",
            argumentNames = [],
            starterCode,
            language = 'javascript',
            testCases = [],
        } = req.body;

        if (!title || !String(title).trim()) {
            return res.json({ success: false, message: 'Question title is required' });
        }
        if (!description || !String(description).trim()) {
            return res.json({ success: false, message: 'Description is required' });
        }

        const normalisedTestCases = (Array.isArray(testCases) ? testCases : []).map((tc) => ({
            input: String(tc.input ?? ''),
            expectedOutput: String(tc.expectedOutput ?? ''),
        }));
        const normalizedFunctionName = String(functionName || "solve")
            .trim()
            .replace(/[^a-zA-Z0-9_]/g, "") || "solve";
        const normalizedArgumentNames = Array.isArray(argumentNames)
            ? argumentNames
                .map((arg) => String(arg || "").trim().replace(/[^a-zA-Z0-9_]/g, ""))
                .filter(Boolean)
            : [];

        const course = await Course.findOne({ _id: courseId, educator });
        if (!course) return res.json({ success: false, message: 'Course not found' });

        const questionId = crypto.randomUUID();

        course.isProgrammingCourse = true;
        course.programmingQuestions = course.programmingQuestions || [];
        course.programmingQuestions.push({
            questionId,
            title: String(title).trim(),
            description: String(description).trim(),
            functionName: normalizedFunctionName,
            argumentNames: normalizedArgumentNames,
            starterCode: starterCode || '',
            language,
            testCases: normalisedTestCases,
        });

        await course.save();

        res.json({
            success: true,
            message: 'Programming question added',
            course,
            questionId,
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Remove a programming question from a course (works even if published)
export const removeProgrammingQuestionFromCourse = async (req, res) => {
    try {
        const educator = req.auth.userId;
        const { courseId, questionId } = req.params;

        const course = await Course.findOne({ _id: courseId, educator });
        if (!course) return res.json({ success: false, message: 'Course not found' });

        const before = course.programmingQuestions?.length || 0;
        course.programmingQuestions = (course.programmingQuestions || []).filter(
            (q) => q.questionId !== questionId,
        );
        const after = course.programmingQuestions.length;

        if (before === after) {
            return res.json({ success: false, message: 'Question not found' });
        }

        if (course.programmingQuestions.length === 0) {
            course.isProgrammingCourse = false;
        }

        await course.save();
        res.json({ success: true, message: 'Question removed', course });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

//  get educator courses

export const  geteducatorCourses = async(req,res)=>{
    try {
        const educator = req.auth.userId
        const courses = await Course.find({educator})
        res.json({success:true,courses})
    } catch (error) {
         res.json({success:false,message:error.message})
    }
}

// Get Educator Dashboard Data (Total earning , enrolled students ,no of courses)


export const educatordashboarddata = async(req,res)=>{
    try {
        const educator= req.auth.userId;
        const courses = await Course.find({educator})
        const totalCourses = courses.length;
        const courseIds= courses.map((course)=>course._id);
        // calculate total earning

        const purchases = await Purchase.find({
            courseId:{$in:courseIds},
            status:'completed'
        })

        const totalearning = purchases.reduce((sum,purchase)=>sum+purchase.amount,0)

        // Collect unique enrolled student Ids with their course titles

        const enrolledStudentsData = [];
         for(const course of courses){
            const students = await User.find({
                _id:{$in:course.enrolledStudents}
            },'name imageUrl')

            students.forEach(student =>{
                enrolledStudentsData.push({
                    courseTitle:course.courseTitle,
                    student
                })
            })
         }

         res.json({success:true,dashboardData:{
            totalearning,enrolledStudentsData,totalCourses
         }})
    } catch (error) {
        res.json({success:false,messge:error.message})
    }
}



//   get enrolled students data with purchase data 
export const getEnrolledStudentsData = async (req,res)=>{

    try {
           const educator= req.auth.userId;
            const courses = await Course.find({educator})
              const courseIds= courses.map((course)=>course._id);
            //   console.log(courses)

              const purchases = await Purchase.find({
                  courseId:{$in:courseIds},
                  status:'completed'
              }).populate('userId','name imageUrl').populate('courseId','courseTitle')


            const enrolledStudents = purchases.map(purchase=>({
                student: purchase.userId,
                courseTitle:purchase.courseId.courseTitle,
                purchaseData:purchase.createdAt
            }));
            console.log(enrolledStudents)
            res.json({success:true,enrolledStudents})
        
    } catch (error) {
         res.json({success:false,messge:error.message})
    }

}




