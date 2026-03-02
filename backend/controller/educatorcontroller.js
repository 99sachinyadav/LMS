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




