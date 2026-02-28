import {clerkClient} from '@clerk/express'

//  Midellare for protecting users routes

export const protectEducator = async(req,res,next)=>{
       try { console.log("hello")
          const userId = req.auth.userId
          console.log(userId)
          const response = await clerkClient.users.getUser(userId)

          console.log(response)

          if(response.publicMetadata.role!='educator'){
             return res.json({success:false,message:'Unauthorised Acess'})
          }
           
          next()

       } catch (error) {
           res.json({success:false,message:error.message})
       }
}