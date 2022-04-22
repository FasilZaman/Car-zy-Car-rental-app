const fs = require('fs')
const S3 = require('aws-sdk/clients/s3')
const AWS = require('aws-sdk');

const bucketName = process.env.aws_bucket_name
const region = process.env.aws_bucket_region
const accesskey = process.env.aws_access_key 
const secretkey = process.env.aws_secret_key 

AWS.config.update({
    accessKeyId: accesskey,
    secretAccessKey: secretkey,
    "region": region   
})

const s3 = new S3()

module.exports={
    upload:(file)=>{
        const fileStream = fs.createReadStream(file.path)
        
        const uploadParams = {
            Bucket : bucketName,
            Body :fileStream,
            Key : file.filename
    
        }
    
        return s3.upload(uploadParams).promise()
    }

}



//uploading a file