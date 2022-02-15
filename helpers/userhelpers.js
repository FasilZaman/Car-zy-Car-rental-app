var db = require('../config/connections')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('../app')
const async = require('hbs/lib/async')
const { ObjectId } = require('mongodb')
const { resolve, reject } = require('promise')
const razorpaysecret = process.env.razorpaysecret
const Razorpay = require('razorpay')
var instance = new Razorpay({
    key_id: 'rzp_test_eLURsrDuG4E6Yb',
    key_secret: razorpaysecret
});

module.exports = {
    usersignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collection.USERCOLLECTION).findOne({ email: userData.email })
            if (user) {
                console.log("User already exist");
                resolve(response)
            } else {
                userData.password = await bcrypt.hash(userData.password, 10)
                userData.confirmPassword = userData.password
                userData.approved = false
                db.get().collection(collection.USERCOLLECTION).insertOne(userData).then((response) => {
                    resolve(response)
                })

            }
        })
    },
    userlogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collection.USERCOLLECTION).findOne({ email: userData.email })
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        console.log('loginSuccessfull');
                        response.status = true
                        response.user = user
                        resolve(response)
                    } else {
                        console.log("Login failed");
                        response.status = false
                        resolve(response)

                    }

                })
            } else {
                console.log("login Failed");
                response.status = false
                resolve(response)
            }
        })
    },
    getuserdetails: (mobile) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USERCOLLECTION).findOne({ mobileNumber: mobile })
            resolve(user)
        })
    },
    bookacar: (userId, carId, bookingdetails, Price) => {
        return new Promise((resolve, reject) => {
            let bookingobj = {
                user: ObjectId(userId),
                car: ObjectId(carId),
                pickuplocation: bookingdetails.location,
                pickupdate: bookingdetails.pickupDate,
                pickuptime: bookingdetails.pickuptime,
                dropoffdate: bookingdetails.dropoffDate,
                dropofftime: bookingdetails.dropofftime,
                price: Price,
                status: 'upcoming',
                deliverytype: 'pickup'
            }
            db.get().collection(collection.BOOKINGSCOLLECTION).insertOne(bookingobj)
            resolve(response)
        })
    },
    bookacardelivery: (userId, carId, bookingdetails, Price,longitude,lattitude) => {
        return new Promise((resolve, reject) => {
            let bookingobj = {
                user: ObjectId(userId),
                car: ObjectId(carId),
                pickuplocation: bookingdetails.location,
                pickupdate: bookingdetails.pickupDate,
                pickuptime: bookingdetails.pickuptime,
                dropoffdate: bookingdetails.dropoffDate,
                dropofftime: bookingdetails.dropofftime,
                price: Price,
                longitude:longitude,
                lattitude:lattitude,
                status: 'upcoming',
                deliverytype: 'delivery'
            }
            db.get().collection(collection.BOOKINGSCOLLECTION).insertOne(bookingobj)
            resolve(response)
        })
    },
    getdetails: (userdetails) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USERCOLLECTION).findOne({ email: userdetails.email })
            // console.log(user);
            resolve(user)
        })
    },
    license: (userdetails, licenseNumber) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.USERCOLLECTION).updateOne({ email: userdetails.email }, { $set: { licensenumber: licenseNumber, approved: false } })
            resolve(response)
        })
    },
    edituser: (userdetails, editted) => {
        return new Promise(async (resolve, reject) => {
            console.log(userdetails._id);
            id = userdetails._id
            let response = {}
            //    id=userdetails._id
            let email = await db.get().collection(collection.USERCOLLECTION).findOne({ email: editted.email, _id: { $ne: userdetails._id } })
            let number = await db.get().collection(collection.USERCOLLECTION).findOne({ mobileNumber: editted.mobileNumber, _id: { $ne: userdetails._id } })
            if (email && number) {
                console.log("email number error");
                response.emailnumbererror = true
                resolve(response)
            } else if (email) {
                console.log("email error");
                response.emailerror = true
                resolve(response)
            } else if (number) {
                console.log("number error");
                response.numbererror = true
                resolve(response)
            } else {
                await db.get().collection(collection.USERCOLLECTION).updateOne({ email: userdetails.email }, {
                    $set: {
                        username: editted.username,
                        email: editted.email,
                        mobileNumber: editted.mobileNumber
                    }
                })
                resolve(response)
            }


            // if (existuser) {
            // if (editted.password == "") {
            //   await db.get().collection(collection.USERCOLLECTION).updateOne({ email: userdetails.email }, {
            //     $set: {
            //         username: editted.username,
            //     }
            // })
            // resolve(response)
            // } else {
            //     editted.password = await bcrypt.hash(editted.password, 10)
            //     editted.confirmPassword = editted.password
            //     await db.get().collection(collection.USERCOLLECTION).updateOne({ email: userdetails.email }, { $set: { 
            //         username: editted.username,
            //         password: editted.password,
            //         confirmPassword: editted.confirmPassword
            //      } })
            //     resolve(response)
            // }
            // } else {
            // if (editted.password == "") {
            // await db.get().collection(collection.USERCOLLECTION).updateOne({ email: userdetails.email }, {
            //     $set: {
            //         username: editted.username,
            //         email: editted.email,
            //         mobileNumber: editted.mobileNumber
            //     }
            // })
            // resolve(response)
            // } else {
            //     editted.password = await bcrypt.hash(editted.password, 10)
            //     editted.confirmPassword = editted.password
            //     await db.get().collection(collection.USERCOLLECTION).updateOne({ email: userdetails.email }, { $set: { editted } })
            //     resolve(response)
            // }
            // }
        })
    },
    approveduser: () => {
        return new Promise(async (resolve, reject) => {
            let approvedusers = db.get().collection(collection.USERCOLLECTION).find({ approved: true }).toArray()
            console.log(approvedusers);
            resolve(approvedusers)
        })
    },
    notapproveduser: () => {
        return new Promise(async (resolve, reject) => {
            let notapprovedusers = db.get().collection(collection.USERCOLLECTION).find({ approved: false }).toArray()
            console.log(notapprovedusers);
            resolve(notapprovedusers)
        })
    },
    userdetail: (userId) => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.USERCOLLECTION).findOne({ _id: ObjectId(userId) })
            console.log('asdfghjkl');
            // console.log(users);
            resolve(users)
        })
    },
    approveuser: (userId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.USERCOLLECTION).updateOne({ _id: ObjectId(userId) }, { $set: { approved: true } })
            resolve(response)
        })
    },
    editpassword: (userdetails, editted) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            console.log(editted.newpassword);
            console.log(editted.confirmpassword);
            bcrypt.compare(editted.currentpassword, userdetails.password).then(async (status) => {
                if (status) {
                    editted.newpassword = await bcrypt.hash(editted.newpassword, 10)
                    editted.confirmpassword = editted.newpassword
                    await db.get().collection(collection.USERCOLLECTION).updateOne({ _id: ObjectId(userdetails._id) }, { $set: { password: editted.newpassword, confirmPassword: editted.confirmpassword } })
                    resolve(status)
                } else {
                    console.log('passwordincorrect');
                    response.wrongpassword = true
                    resolve(response)
                }
            })
        })
    },
    generateRazorpay: (Price) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: parseInt(Price) * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: "order_rcptid_11"
            };
            instance.orders.create(options, function (err, order) {
                // console.log("order :",order);
                resolve(order)
            });

        })
    },
    verifypayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'razorpaysecret')

            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })

    }

}