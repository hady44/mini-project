var mongoose = require('mongoose');

var projectSchema = mongoose.Schema({
    title:{
        type:String,
        required:true,
        unique:true
    },
    URL:{type:String, default:"N/A"},
    createdAt: { type: Date, default: Date.now },
    createdBy:{type:String, required:true},
    img:{type:String, default:"n/a"},
    description: {type:String},
    repo:{type:String, default:"n/a"}
})

var Project = mongoose.model("project", projectSchema);

module.exports = Project;
