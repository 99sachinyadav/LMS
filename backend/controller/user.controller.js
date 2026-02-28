import Course from "../model/course.js"
import { CourseProgress } from "../model/courseprogress.js"
import { Purchase } from "../model/purchase.js"
import User from "../model/User.js"
import Stripe from 'stripe'

export  const getUserdata = async(req,res)=>{
    try {
        const userId = req.auth.userId

        const user = await User.findById(userId)
        if(!user){
            return res.json({success:false,message:'User Not Found'})
        }
        
        res.json({success:true,user})
    } catch (error) {
        res.json({success:false,message:error.message})
    }
}

// User Enrolled Courses  with lecture link
 export const getuserEnrolledCourses = async(req,res)=>{
    try {
  const userId = req.auth.userId

        const userdata = await User.findById(userId).populate('enrolledCourses')
        console.log(userdata.  enrolledCourses.length)

        res.json({success:true ,enrolledCourses:userdata})
        
    } catch (error) {
         res.json({success:false,message:error.message})
    }
 }



 // FUNCTION TO PURCHASE COURSE

export const purchaseCourse = async(req,res)=>{
       try {
        const {courseId} = req.body

        const {origin}=req.headers
        const userId = req.auth.userId
        const userData = await User.findById(userId)
        const courseData = await Course.findById(courseId)
        if(!userData || !courseData){
            return res.json({success:false,message:'Invalid Course or User'})
        }
        const purchasedata ={
            courseId : courseData._id,
            userId,
            amount:(courseData.coursePrice -courseData.discount*courseData.coursePrice/100).toFixed(2),

        }

            const newPurchase = await Purchase.create(purchasedata)
            // Stripe Payment Integration can be done here and after successful payment 
            // we can add course to user enrolled courses and add user to course enrolled students

            const stripeinstance = new Stripe(process.env.STRIPE_SECRETE_KEY)
            const currency = process.env.CURRENCY.toLowerCase()
            //   Creating line items to for stripe

            const line_items = [
                {
                    price_data:{
                    currency,
                    product_data:{
                        name:courseData.courseTitle,
                    },
                    unit_amount:Math.floor(newPurchase.amount )*100,
                },
                quantity:1,
                }
            ]

            const session = await stripeinstance.checkout.sessions.create({
                success_url:`${origin}/loading/my-enrollments`,
                cancel_url:`${origin}/`,
                line_items:line_items,
                mode:'payment',
                metadata:{
                    purchaseId:newPurchase._id.toString(),
                }
            })
            // console.log(session.url)
            res.json({success:true,session_url:session.url})
       } catch (error) {
           res.json({success:false,message:error.message    })
       }
}


// Update User Course Progress

export const updateCourseProgress = async(req,res)=>{
    try {
        const userId = req.auth.userId
        const {courseId,lectureId} = req.body
        const progressData = await CourseProgress.findOne({userId,courseId})

        if(progressData){
            if(progressData.lectureCompleted.includes(lectureId)){
                return res.json({success:true,message:'Lecture already marked as completed'})
            }
            progressData.lectureCompleted.push(lectureId)
            await progressData.save()
        }
        else{
             await CourseProgress.create({
                userId,
                courseId,
                lectureCompleted:[lectureId]
        
             })
        }

        res.json({success:true,message:'Course Progress Updated'})


    } catch (error) {
        res.json({success:false,message:error.message})
    }
}

// get user course progress
export const getCourseProgress = async(req,res)=>{

    try {
        const userId = req.auth.userId
        const {courseId} = req.query
        // console.log(courseId,userId)
        const progressData = await CourseProgress.findOne({userId,courseId})
        //  console.log(progressData)
        
        if(!progressData){
            return res.json({success:false,message:'No Progress Found'})
        }
        res.json({success:true,progress:progressData})
    } catch (error) {
        res.json({success:false,message:error.message})
    }
}

// add user rating to the cource

export const addUserRating = async(req,res)=>{
    try {
        const userId = req.auth.userId
        const {courseId,rating}=req.body;
        // console.log(courseId,rating)
        if(!courseId || !userId||!rating || rating<1|| rating>5){
            return res.json({success:false,message:"Invalid Details"})
        }

        const course = await Course.findById(courseId)
        if(!course){
             return res.json({success:false,message:"Course not found"})
        }

        const user = await User.findById(userId)
        if(!user || !user.enrolledCourses.includes(courseId)){
             return res.json({success:false,message:"User has not purchased this course"})
        }

        const existingRatingIndex= course.courseRating.findIndex(r=>r.userId===userId)

        if(existingRatingIndex>-1){
            course.courseRating[existingRatingIndex].rating = rating;
        }
        else{
            course.courseRating.push({userId,rating})
        }

        await course.save();
          
        return res.json({success:true,message:"Rating Added"})
       
    } catch (error) {
        res.json({success:false,message:error.message})
    }
}