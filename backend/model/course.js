import mongoose from'mongoose'


const lectureSchema = new mongoose.Schema({
    lectureId:{type:String,required:true},
    lectureTitle:{type:String,required:true},
    lectureDuration:{type:Number,required:true},
    lectureUrl:{type:String,required:true},
    isPreviewFree :{type:Boolean ,default:false},
    lectureOrder:{type:Number,required:true},
    lectureNotesUrl:{type:String,default:null}
},{_id:false})

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
  },
  { _id: false },
);

const programmingQuestionSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    starterCode: { type: String, default: "" },
    language: { type: String, default: "javascript" },
    testCases: {
      type: [testCaseSchema],
      validate: {
        validator: function (arr) {
          return Array.isArray(arr) && arr.length >= 4;
        },
        message: "At least 4 test cases are required",
      },
      default: [],
    },
  },
  { _id: false },
);

const chapterSchema = new mongoose.Schema({
    chapterId:{type:String,required:true},
    chapterOrder:{type:Number,required:true},
    chapterTitle:{type:String,required:true},
    chapterContent:[lectureSchema],
},{_id:false});

const courseSchema = new mongoose.Schema({
    courseTitle:{type:String, required:true},
    courseDescription:{type:String, required:true},
    courseThumbnail:{type:String},
    coursePrice:{type:Number, required:true},
    isPublished:{type:Boolean, required:true},
    discount:{type:Number, required:true,min:0,max:100},
     courseContent:[chapterSchema],
     isProgrammingCourse:{type:Boolean,default:false},
     programmingQuestions:[programmingQuestionSchema],
     courseRating:[
        {userId:{type:String},rating:{type:Number,min:1,max:5}}
     ],
     educator:{type:String,ref:'User',required:true},
     enrolledStudents:[
        {type:String,ref:'User'}
     ]
},{timestamps:true,minimize:false})

const Course = mongoose.model('Course',courseSchema)

export default Course;