import express from 'express'
import { addUserRating, getCourseProgress, getUserdata, getuserEnrolledCourses, purchaseCourse, updateCourseProgress } from '../controller/user.controller.js'

const userRouter = express.Router()
userRouter.get('/data',getUserdata)
userRouter.get('/enrolled-courses',getuserEnrolledCourses)
userRouter.post('/purchase',purchaseCourse)
userRouter.post('/update-course-progress',updateCourseProgress)
userRouter.get('/get-course-progress',getCourseProgress)
userRouter.post('/add-rating',addUserRating)

export default userRouter
