import express from 'express'
import { addChapterToCourse, addCourse, addLectureToCourse, addProgrammingQuestionToCourse, educatordashboarddata, getEducatorCourseById, geteducatorCourses, getEnrolledStudentsData, removeProgrammingQuestionFromCourse, updateCourseThumbnail, updateLectureInCourse, updateRoleToEducator, uploadLectureNotes } from '../controller/educatorcontroller.js'
import upload from '../config/multer.js'
import { protectEducator } from '../mddelware/authMiddelware.js'


const educatorRouter  = express.Router()


educatorRouter.get('/update-role',updateRoleToEducator)
educatorRouter.post('/add-course',upload.single('image'), protectEducator,addCourse)
educatorRouter.post('/upload-notes',upload.single('notesFile'), protectEducator, uploadLectureNotes)
educatorRouter.get('/course/:id', protectEducator, getEducatorCourseById)
educatorRouter.post('/course/:courseId/chapters', protectEducator, addChapterToCourse)
educatorRouter.post('/course/:courseId/lectures', protectEducator, addLectureToCourse)
educatorRouter.put('/course/:courseId/lectures/:lectureId', protectEducator, updateLectureInCourse)
educatorRouter.put('/course/:courseId/thumbnail', upload.single('image'), protectEducator, updateCourseThumbnail)
educatorRouter.post('/course/:courseId/programming-questions', protectEducator, addProgrammingQuestionToCourse)
educatorRouter.delete('/course/:courseId/programming-questions/:questionId', protectEducator, removeProgrammingQuestionFromCourse)
educatorRouter.get('/courses',protectEducator ,geteducatorCourses)
educatorRouter.get('/dashboard',protectEducator ,educatordashboarddata)
educatorRouter.get('/enrolled-students',protectEducator ,getEnrolledStudentsData)

export default educatorRouter;