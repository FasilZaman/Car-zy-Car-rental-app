var db=require('../config/connections')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
const { promise } = require('bcrypt/promises')
const async = require('hbs/lib/async')

module.exports={
    adminLogin:(adminData)=>{
        return new Promise(async(resolve,reject)=>{
            let response={}
            let admin=await db.get().collection(collection.ADMINCOLLECTION).findOne({email:adminData.email})
            if(admin){
                bcrypt.compare(adminData.password,admin.password).then((adminstatus)=>{
                    if(adminstatus){
                        console.log("login successfull");
                        response.adminstatus=true
                        resolve(response)
                    }else{
                        console.log(('login Failed'));
                        response.adminstatus=false
                        resolve(response)
                    }
                })
            }else{
                console.log('loginfailed');
                response.adminstatus=false
                resolve(response)
            }
        })
    }
}