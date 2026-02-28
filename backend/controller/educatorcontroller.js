import {clerkClient} from '@clerk/express'
import Course from '../model/course.js';
import {v2 as cloudinary} from 'cloudinary';
import { Purchase } from '../model/purchase.js';
 
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
            },'name','imageUrl')

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
        res.json({success:false,messge:error.mesage})
    }
}



//   get enrolled students data with purchase data 
export const getEnrolledStudentsData = async (req,res)=>{

    try {
           const educator= req.auth.userId;
            const courses = await Course.find({educator})
              const courseIds= courses.map((course)=>course._id);

              const purchases = await Purchase.find({
                  courseId:{$in:courseIds},
                  status:'completed'
              }).populate('userId','name','imageUrl').populate('courseId','courseTitle')


            const enrolledStudents = purchases.map(purchase=>({
                student: purchase.userId,
                courseTitle:purchase.courseId.courseTitle,
                purchaseData:purchase.createdAt
            }));
            res.json({success:true,enrolledStudents})
        
    } catch (error) {
         res.json({success:false,messge:error.mesage})
    }

}




