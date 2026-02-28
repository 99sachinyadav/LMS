import Course from "../model/course.js"
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
            res.json({success:true,session_url:session.url})
       } catch (error) {
           res.json({success:false,message:error.message    })
       }
}