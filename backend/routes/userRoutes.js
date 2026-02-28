import express from 'express'
import { getUserdata, getuserEnrolledCourses, purchaseCourse } from '../controller/user.controller.js'

const userRouter = express.Router()
userRouter.get('/data',getUserdata)
userRouter.get('/enrolled-courses',getuserEnrolledCourses)
userRouter.post('/purchase',purchaseCourse)

export default userRouter
