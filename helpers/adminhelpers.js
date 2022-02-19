var db = require('../config/connections')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { promise } = require('bcrypt/promises')
const async = require('hbs/lib/async')
const { ObjectId } = require('mongodb')
const { resolve } = require('promise')
const { response } = require('../app')

module.exports = {
    adminLogin: (adminData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let admin = await db.get().collection(collection.ADMINCOLLECTION).findOne({ email: adminData.email })
            if (admin) {
                bcrypt.compare(adminData.password, admin.password).then((adminstatus) => {
                    if (adminstatus) {
                        console.log("login successfull");
                        response.adminstatus = true
                        resolve(response)
                    } else {
                        console.log(('login Failed'));
                        response.adminstatus = false
                        resolve(response)
                    }
                })
            } else {
                console.log('loginfailed');
                response.adminstatus = false
                resolve(response)
            }
        })
    },
    getallupcomingbookings: () => {
        return new Promise(async (resolve, reject) => {
            let Bookings = await db.get().collection(collection.BOOKINGSCOLLECTION).aggregate([{ $match: { status: 'upcoming' } },
            {
                $lookup: {
                    from: collection.CARSCOLLECTION,
                    localField: 'car',
                    foreignField: '_id',
                    as: 'cars'
                }
            },
            {
                $lookup: {
                    from: collection.USERCOLLECTION,
                    localField: 'user',
                    foreignField: '_id',
                    as: 'bookeduser'
                }
            }
            ]).toArray()
            // console.log(Bookings);
            resolve(Bookings)
        })
    },
    getbookingstoday: () => {
        return new Promise(async (resolve, reject) => {
            let Bookings = await db.get().collection(collection.BOOKINGSCOLLECTION).aggregate([{ $match: { $and: [{ deliverytype: "pickup" }, { status: 'upcoming' }] } },
            {
                $lookup: {
                    from: collection.CARSCOLLECTION,
                    localField: 'car',
                    foreignField: '_id',
                    as: 'cars'
                }
            },
            {
                $lookup: {
                    from: collection.USERCOLLECTION,
                    localField: 'user',
                    foreignField: '_id',
                    as: 'bookeduser'
                }
            }
            ]).toArray()
            console.log(Bookings);

            let today = []

            for (let i of Bookings) {
                let start = new Date(i.pickupdate)
                let end = new Date(i.dropoffdate)
                console.log("qwers:", start, "qwere", end);
                date = new Date()
                date.setHours(5)
                date.setMilliseconds(0)
                date.setMinutes(30)
                date.setSeconds(0)

                console.log(start)

                console.log("todaydate", date);

                if (start.getTime() === date.getTime() && i.status == "upcoming") {
                    today.push(i)
                }
            }

            console.log(".", today)
            resolve(today)
        })

    },
    getbookingstodaydelivery: () => {
        return new Promise(async (resolve, reject) => {
            let Bookings = await db.get().collection(collection.BOOKINGSCOLLECTION).aggregate([{ $match: { $and: [{ deliverytype: "delivery" }, { status: 'upcoming' }] } },
            {
                $lookup: {
                    from: collection.CARSCOLLECTION,
                    localField: 'car',
                    foreignField: '_id',
                    as: 'cars'
                }
            },
            {
                $lookup: {
                    from: collection.USERCOLLECTION,
                    localField: 'user',
                    foreignField: '_id',
                    as: 'bookeduser'
                }
            }
            ]).toArray()
            console.log(Bookings);

            let today = []

            for (let i of Bookings) {
                let start = new Date(i.pickupdate)
                let end = new Date(i.dropoffdate)
                console.log("qwers:", start, "qwere", end);
                date = new Date()
                date.setHours(5)
                date.setMilliseconds(0)
                date.setMinutes(30)
                date.setSeconds(0)

                console.log("todaydate", date);

                if (start.getTime() === date.getTime() && i.status == "upcoming") {
                    today.push(i)
                }
            }


            resolve(today)
        })

    },
    getongoingbookings: () => {
        return new Promise(async (resolve, reject) => {
            let Bookings = await db.get().collection(collection.BOOKINGSCOLLECTION).aggregate([{ $match: { status: 'ongoing' } },
            {
                $lookup: {
                    from: collection.CARSCOLLECTION,
                    localField: 'car',
                    foreignField: '_id',
                    as: 'cars'
                }
            },
            {
                $lookup: {
                    from: collection.USERCOLLECTION,
                    localField: 'user',
                    foreignField: '_id',
                    as: 'bookeduser'
                }
            }
            ]).toArray()
            // console.log(Bookings);
            resolve(Bookings)
        })
    },
    getendedbookings: () => {
        return new Promise(async (resolve, reject) => {
            let Bookings = await db.get().collection(collection.BOOKINGSCOLLECTION).aggregate([{ $match: { status: 'ended' } },
            {
                $lookup: {
                    from: collection.CARSCOLLECTION,
                    localField: 'car',
                    foreignField: '_id',
                    as: 'cars'
                }
            },
            {
                $lookup: {
                    from: collection.USERCOLLECTION,
                    localField: 'user',
                    foreignField: '_id',
                    as: 'bookeduser'
                }
            }
            ]).toArray()
            // console.log(Bookings);
            resolve(Bookings)
        })
    },
    startatrip: (bookingid) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.BOOKINGSCOLLECTION).updateOne({ _id: ObjectId(bookingid) }, { $set: { status: 'ongoing' } }).then((response) => {
                resolve(response)
            })
        })
    },
    endatrip: (bookingid) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.BOOKINGSCOLLECTION).updateOne({ _id: ObjectId(bookingid) }, { $set: { status: 'ended' } }).then((response) => {
                resolve(response)
            })
        })
    },
    addcoupon: (details) => {
        console.log('===================++++++++++++++++++', details);
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.COUPONCOLLECTION).insertOne(details).then((response) => {
                resolve(response)
            })
        })
    },
    getcoupons: () => {
        return new Promise(async (resolve, reject) => {
            let coupons = await db.get().collection(collection.COUPONCOLLECTION).find().toArray()
            console.log(coupons);
            let date = new Date()
            date.setHours(5)
            date.setMinutes(30)
            date.setMilliseconds(0)
            date.setSeconds(0)
            console.log(date);
            for (let i of coupons) {
                console.log(i);
                if (date >= new Date(i.couponExpiry)) {
                    console.log("Expired");
                    db.get().collection(collection.COUPONCOLLECTION).deleteOne({ _id: i._id })
                }
            }
            resolve(coupons)
        })
    },

    deletecoupon: (id) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.COUPONCOLLECTION).deleteOne({ _id: ObjectId(id) }).then((response) => {
                resolve(response)
            })
        })
    }

}