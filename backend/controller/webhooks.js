import {Webhook} from 'svix';
import User from '../model/User.js'
import Stripe from 'stripe';
import { Purchase } from '../model/purchase.js';
import Course from '../model/course.js';

//  API controller function to manage clerk user with database;

export const clerkWebhooks = async(req,res)=>{
    try {
        console.log("Webhook received");  
       const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET) 
        await whook.verify(JSON.stringify(req.body),{
            "svix-id":req.headers["svix-id"],
            "svix-timestamp":req.headers["svix-timestamp"],
             "svix-signature":req.headers["svix-signature"]
        })

        const {data,type} = req.body;
         console.log("recived data",data);
        switch(type){
             case 'user.created':{
                 const  userData ={
                    _id:data.id,
                    email:data.email_addresses[0].email_address,
                    name:data.first_name+" "+data.last_name,
                    imageUrl:data.image_url,
                 }
                 await User.create(userData);
                 res.json({})
                 break;
             }
             case 'user.updated':{
                   const  userData ={
                    
                    email:data.email_addresses[0].email_address,
                    name:data.first_name+" "+data.last_name,
                    imageUrl:data.image_url,
                 }
                 await User.findByIdAndUpdate(data.id,userData)
                  res.json({})
                  break;
             }

             case 'user.deleted':{
                await User.findByIdAndDelete(data.id)
                res.json({})
                break;
             }
             default:
                break;
        }
    } catch (error) {
        res.json({success:false,message:error.message})
        
    }
}



export const stripeWebhooks = async(req,res)=>{
    const stripeInstance = new Stripe(process.env.STRIPE_SECRETE_KEY)
   const sig = req.headers['stripe-signature'];

  let event;
  console.log("Hello")
  try {
    event = Stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
     
    );
        // ✅ Handle events (THIS is your converted code)
             
        console.log(event.type)
    switch (event.type) {

      case "payment_intent.succeeded":{

         const paymentIntent = event.data.object;
         const paymentIntentId = paymentIntent.id;
         const  session = await stripeInstance.checkout.sessions.list({
            payment_intent:paymentIntentId,
         })

         const {purchaseId} = session.data[0].metadata;

          const purchaseData = await Purchase.findById(purchaseId)
          const userData = await User.findById(purchaseData.userId)


        const  courseData = await Course.findById(purchaseData.courseId.toString())
        console.log(courseData,userData)

         courseData.enrolledStudents.push(userData._id)
         await courseData.save()

         userData.enrolledCourses.push(courseData._id)
          await userData.save()
        
         purchaseData.status = "completed"
            await purchaseData.save()
         break;
      }
       
        

      case "payment_intent.payment_failed":{
           const paymentIntent = event.data.object;
         const paymentIntentId = paymentIntent.id;
         const  session = await stripeInstance.checkout.sessions.list({
            payment_intent:paymentIntentId,
         })

         const {purchaseId} = session.data[0].metadata;
         const purchaseData = await Purchase.findById(purchaseId)
         purchaseData.status = "failed"
         await purchaseData.save()
         break;
      }
       

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // ✅ status 200
    res.status(200).json({ received: true });
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
}

