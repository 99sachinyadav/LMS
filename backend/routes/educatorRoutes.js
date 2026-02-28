import express from 'express'
import { addCourse, educatordashboarddata, geteducatorCourses, getEnrolledStudentsData, updateRoleToEducator } from '../controller/educatorcontroller.js'
import upload from '../config/multer.js'
import { protectEducator } from '../mddelware/authMiddelware.js'


const educatorRouter  = express.Router()


educatorRouter.get('/update-role',updateRoleToEducator)
educatorRouter.post('/add-course',upload.single('image'), protectEducator,addCourse)
educatorRouter.get('/courses',protectEducator ,geteducatorCourses)
educatorRouter.get('/dashboard',protectEducator ,educatordashboarddata)
educatorRouter.get('/enrolled-students',protectEducator ,getEnrolledStudentsData)

export default educatorRouter;