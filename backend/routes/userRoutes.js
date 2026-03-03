import express from 'express'
import upload from '../config/multer.js'
import { addUserRating, aiChat, getCourseProgress, getUserdata, getuserEnrolledCourses, purchaseCourse, runProgrammingQuestion, updateCourseProgress } from '../controller/user.controller.js'

const userRouter = express.Router()
userRouter.get('/data',getUserdata)
userRouter.get('/enrolled-courses',getuserEnrolledCourses)
userRouter.post('/purchase',purchaseCourse)
userRouter.post('/update-course-progress',updateCourseProgress)
userRouter.get('/get-course-progress',getCourseProgress)
userRouter.post('/add-rating',addUserRating)
userRouter.post('/course/:courseId/programming-questions/:questionId/run', runProgrammingQuestion)
userRouter.post('/ai/chat', upload.single('attachment'), aiChat)

export default userRouter
