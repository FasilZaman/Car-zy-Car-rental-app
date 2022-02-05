var db=require('../config/connections')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
const { response } = require('../app')
const async = require('hbs/lib/async')
const { ObjectId } = require('mongodb')

module.exports={
    usersignup:(userData)=>{
        return new Promise (async(resolve,reject)=>{
            let response={}
            let user=await db.get().collection(collection.USERCOLLECTION).findOne({email:userData.email})
            if(user){
                console.log("User already exist");
                resolve(response)
            }else{
                userData.password=await bcrypt.hash(userData.password,10)
                userData.confirmPassword=userData.password
                db.get().collection(collection.USERCOLLECTION).insertOne(userData)
                resolve(response)
            }
        })
    },
    userlogin:(userData)=>{
        return new Promise (async(resolve,reject)=>{
            let response={}
            let user=await db.get().collection(collection.USERCOLLECTION).findOne({email:userData.email})
            if(user){
                bcrypt.compare(userData.password,user.password).then((status)=>{
                    if(status){
                        console.log('loginSuccessfull');
                        response.status=true
                        response.user=user
                        resolve(response)
                    }else{
                        console.log("Login failed");
                        response.status=false
                        resolve(response)

                    }

                })
            }else{
                console.log("login Failed");
                response.status=false
                resolve(response)
            }
        })
    },
    getuserdetails:(mobile)=>{
        return new Promise(async(resolve,reject)=>{
            let user=await db.get().collection(collection.USERCOLLECTION).findOne({mobileNumber:mobile})
            resolve(user)
        })
    },
    bookacar:(userId,carId,bookingdetails,Price)=>{
        return new Promise((resolve,reject)=>{
           let bookingobj={
               user:ObjectId(userId),
               car:ObjectId(carId),
               pickuplocation:bookingdetails.location,
               pickupdate:bookingdetails.pickupDate,
               pickuptime:bookingdetails.pickuptime,
               dropoffdate:bookingdetails.dropoffDate,
               dropofftime:bookingdetails.dropofftime,
               price:Price
           }
           db.get().collection(collection.BOOKINGSCOLLECTION).insertOne(bookingobj)
           resolve(response) 
        })
    }

}