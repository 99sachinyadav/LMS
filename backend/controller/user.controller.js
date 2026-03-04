import Course from "../model/course.js"
import { CourseProgress } from "../model/courseprogress.js"
import { Purchase } from "../model/purchase.js"
import User from "../model/User.js"
import Stripe from 'stripe'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { v2 as cloudinary } from "cloudinary"

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

let genAIClient = null;
const getGenAIClient = () => {
  if (genAIClient) return genAIClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  genAIClient = new GoogleGenerativeAI(apiKey);
  return genAIClient;
};

// AI chat for debugging and study help
export const aiChat = async (req, res) => {
    try {
        const userId = req.auth.userId;
        if (!userId) {
            return res.json({ success: false, message: "Unauthorized" });
        }

        const client = getGenAIClient();
        if (!client) {
            return res.json({
                success: false,
                message:
                    "GEMINI_API_KEY is not set in the backend environment. Please add it to your .env and restart the server.",
            });
        }

        const { message, code, language, courseId } = req.body || {};
        if (!message || !String(message).trim()) {
            return res.json({ success: false, message: "Message is required" });
        }

        let attachmentInfo = "";
        if (req.file) {
            const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                resource_type: "auto",
                folder: "lms-ai-attachments",
            });
            attachmentInfo = `\nThe user also attached a file for reference: ${uploadResult.secure_url}\n`;
        }

        const systemPrompt = `
You are an AI tutor inside a   platform (LMS).
Your purpose:
- you have to also give the answer related to anything related to study in any field 
-if anyone give you a pdf then give the answer according to the question of student based on pdf or ducument uploaded
- Help students debug code in a supportive way.
- Explain programming concepts related to the course.
- Give step-by-step hints instead of just full solutions when possible.
- if a student still ask for solution then give a code solution
-give the solution in the student  desired programing language
-and talk to student in the language in which student is talking to you
- Stay on study/programming topics only; give the crisp and consise but full answer politely decline unrelated questions.`;

        const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

        const contents = [
            {
                role: "user",
                parts: [
                    { text: systemPrompt },
                    {
                        text:
                            `User message:\n${String(message).trim()}\n\n` +
                            (language ? `Language: ${language}\n` : "") +
                            (code ? `Code:\n${code}\n\n` : "") +
                            (courseId ? `CourseId: ${courseId}\n` : "") +
                            attachmentInfo,
                    },
                ],
            },
        ];

        const result = await model.generateContent({ contents });
        const replyText = result?.response?.text?.() || "I couldn't generate a response.";

        return res.json({ success: true, reply: replyText });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// Run code for a programming question with custom stdin/stdout (compiler mode)
export const runProgrammingQuestion = async (req, res) => {
    try {
        const userId = req.auth.userId;
        if (!userId) {
            return res.json({ success: false, message: "Unauthorized" });
        }

        const { courseId, questionId } = req.params;
        const { code, language: bodyLanguage, stdin = "" } = req.body;

        if (!code || !code.trim()) {
            return res.json({ success: false, message: "Code is required" });
        }

        const course = await Course.findById(courseId);
        if (!course || !course.isProgrammingCourse) {
            return res.json({ success: false, message: "Programming course or question not found" });
        }

        const question = (course.programmingQuestions || []).find(
            (q) => q.questionId === questionId,
        );
        if (!question) {
            return res.json({ success: false, message: "Question not found" });
        }
        const lang = (bodyLanguage || question.language || "javascript")
            .toLowerCase()
            .replace("c++", "cpp");

        const languageMap = {
            javascript: 63, // JavaScript (Node.js 12+)
            js: 63,
            cpp: 54, // C++ (GCC 9.2.0)
            c: 50, // C (GCC 9.2.0)
            java: 62, // Java (OpenJDK 13.0.1)
            python: 71, // Python (3.8.1)
            python3: 71,
            go: 60, // Go (1.13.5)
            rust: 73, // Rust (1.40.0)
            csharp: 51, // C# (Mono 6.6.0.161)
            php: 68, // PHP (7.4.1)
            ruby: 72, // Ruby (2.7.0)
            kotlin: 78, // Kotlin (1.3.70)
            swift: 83, // Swift (5.2.3)
            typescript: 74, // TypeScript (3.7.4)
        };

        const languageId = languageMap[lang];
        if (!languageId) {
            return res.json({
                success: false,
                message: `Language "${lang}" is not supported.`,
            });
        }

        const judgeBaseUrl = (process.env.JUDGE0_URL || "https://ce.judge0.com").replace(/\/+$/, "");
        const submissionsUrl = `${judgeBaseUrl}/submissions?base64_encoded=true&wait=true`;
        const b64 = (s) => Buffer.from(String(s ?? ""), "utf8").toString("base64");
        const unb64 = (s) => (s ? Buffer.from(String(s), "base64").toString("utf8") : "");

        const body = {
            source_code: b64(code),
            language_id: languageId,
            stdin: b64(String(stdin ?? "")),
        };

        const response = await fetch(submissionsUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errText = await response.text().catch(() => "");
            throw new Error(
                `Judge service error: ${response.status}${errText ? ` - ${errText}` : ""}`,
            );
        }

        const result = await response.json();
        const status = result.status || {};
        const stdout = unb64(result.stdout || "");
        const stderr = unb64(result.stderr || "");
        const compileOutput = unb64(result.compile_output || "");
        const terminalOutput = [compileOutput, stderr, stdout]
            .filter((part) => String(part || "").length > 0)
            .join("\n");

        return res.json({
            success: true,
            runResult: {
                statusId: status.id,
                status: status.description || "Unknown",
                stdout,
                stderr,
                compileOutput,
                terminalOutput,
                time: result.time || null,
                memory: result.memory || null,
            },
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
