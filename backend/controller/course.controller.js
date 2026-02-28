 
import Course from "../model/course.js"
import { Purchase } from "../model/purchase.js"


// get all courses 
 export const getAllCourses = async(req,res)=>{
    try {
        const courses = await  Course.find({isPublished:true}).select(['-courseContent','-enrolledStudents']).populate({path:'educator'})
        // console.log(courses)
         res.json({success:true,courses})
    } catch (error) {
        res.json({success:false,message:error.message})
    }


 }


//   Get Course by Id

export const getCourseId = async (req,res)=>{
    const {id}= req.params
    try {
        const courseData = await Course.findById(id).populate({path:'educator'})
        //  remove lectureurl if ispreview is false;
        courseData.courseContent.forEach((chapter =>{
              chapter.chapterContent.forEach(lecture=>{
                if(!lecture.isPreviewFree){
                     lecture.lectureUrl=""
                }
              })
        }))

        res.json({sucess:true,courseData})
    } catch (error) {
        res.json({sucess:false,message:error.message})
    }
}

