var db = require('../config/connections')
var collection = require('../config/collections')
const { reject, resolve } = require('promise')
const { response } = require('express')
const async = require('hbs/lib/async')
const { ObjectId } = require('mongodb')


module.exports = {

    addcardetails: (carDetails) => {
        return new Promise(async (resolve, reject) => {
            let car = await db.get().collection(collection.CARSCOLLECTION).findOne({ Carnumber: carDetails.Carnumber })
            let response = {}
            if (car) {
                response.carfound = true
                resolve(response)
            } else {
                carDetails.Price = parseInt(carDetails.Price)
                db.get().collection(collection.CARSCOLLECTION).insertOne(carDetails).then((details) => {
                    console.log(details);
                    response.carfound = false
                    response.id = details.insertedId
                    resolve(response)
                })
            }
        })
    },
    getcardetails: () => {
        return new Promise(async (resolve, reject) => {
            let Cars = await db.get().collection(collection.CARSCOLLECTION).find().toArray()
            resolve(Cars)
        })
    },
    deletecar: (carId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.CARSCOLLECTION).deleteOne({ _id: ObjectId(carId) }).then((response) => {
                resolve(response)
            })
        })

    },
    carDetails: (carId) => {
        return new Promise(async (resolve, reject) => {
            let car = await db.get().collection(collection.CARSCOLLECTION).findOne({ _id: ObjectId(carId) })
            resolve(car)
        })
    },
    editCarDetails: (carId, carDetails) => {
        return new Promise(async (resolve, reject) => {
            let car = await db.get().collection(collection.CARSCOLLECTION).findOne({ Carnumber: carDetails.Carnumber })
            let response = {}
            if (car) {
                carDetails.Price = parseInt(carDetails.Price)
                db.get().collection(collection.CARSCOLLECTION).updateOne({ _id: ObjectId(carId) }, {
                    $set: {
                        Name: carDetails.Name,
                        Brand: carDetails.Brand,
                        Fuel: carDetails.Fuel,
                        Type: carDetails.Type,
                        Transmission: carDetails.Transmission,
                        Seats: carDetails.Seats,
                        Mileage: carDetails.Mileage,
                        Price: carDetails.Price,
                        location: carDetails.location
                    }
                }).then((details) => {
                    console.log(details);
                    resolve(response)
                })
            } else {
                carDetails.Price = parseInt(carDetails.Price)
                db.get().collection(collection.CARSCOLLECTION).updateOne({ _id: ObjectId(carId) }, { carDetails }).then((details) => {
                    response.id = details.insertedId
                    resolve(response)
                })
            }
        })
    },
    getCars: (carname, pickup) => {
        return new Promise(async (resolve, reject) => {
            console.log(pickup.location);
            let Cars = await db.get().collection(collection.CARSCOLLECTION).find({ $and: [{ location: pickup }, { $text: { $search: carname } }] }).toArray()
            console.log(Cars);
            resolve(Cars)
        })
    },
    getusercars: (hourdiff, body) => {
        return new Promise(async (resolve, reject) => {
            let Cars = await db.get().collection(collection.CARSCOLLECTION).aggregate([{ $match: { location: body.location } }, {
                $lookup: {
                    from: collection.BOOKINGSCOLLECTION,
                    foreignField: "car",
                    localField: "_id",
                    as: 'bookings'
                }
            }, {
                $project: {
                    _id: 1, Name: 1, Brand: 1, Fuel: 1, Type: 1, Transmission: 1, Seats: 1, Carnumber: 1, Mileage: 1, Status: 1, location: 1, bookings: 1, discount: 1,
                    Price: { $multiply: [hourdiff, '$Price'] }
                }
            },]).toArray()


            //start checking the dates

            const car = []
            const carbooking = []
            for (let i of Cars) {
                car.push(i)
                // console.log(i);
            }

            // for (let i of car) {
            //     console.log("qqqqqqq : ",i.bookings);
            // }
            // console.log("qwertyuiop");

            for (let i of Cars) {
                for (let j of i.bookings) {
                    carbooking.push(j)
                    console.log("all :", j);
                }
            }

            // console.log("thebookings : ", carbooking);

            // console.log("qwerrtrrerqerqewrqewrqewrqerqewrqe");

            // for(let i of carbooking){
            //     console.log(i.pickupdate);
            // }

            for (let i in car) {
                for (let j in carbooking) {
                    console.log("one :", car[i]._id, "+++++", carbooking[j].car);
                    if (car[i]._id.toString() === carbooking[j].car.toString()) {
                        console.log("qwertyytyty");
                        var pickup = body.pickupDate
                        var dropoff = body.dropoffDate
                        var searchpickup = new Date(pickup)
                        var searchdropoff = new Date(dropoff)
                        var checkpickup = new Date(carbooking[j].pickupdate)
                        var checkdropoff = new Date(carbooking[j].dropoffdate)
                        console.log(pickup);
                        console.log(dropoff);

                        if (checkpickup <= searchpickup && searchpickup <= checkdropoff) {
                            console.log("qwerty1");
                            car.splice(i, 1)
                        } else if (checkpickup <= searchdropoff && searchdropoff <= checkdropoff) {
                            console.log("qwerty2");
                            car.splice(i, 1)
                        } else if (searchpickup <= checkpickup && checkdropoff <= searchdropoff) {
                            console.log("qwerty3");
                            car.splice(i, 1)
                        }
                    }
                }
            }


            // for (let i of carbooking) {
            //     console.log("qwererer",i.car);
            //     console.log(car._id);

            //         var pickup = body.pickupDate
            //         var dropoff = body.dropoffDate
            //         var searchpickup = new Date(pickup)
            //         var searchdropoff = new Date(dropoff)
            //         var checkpickup = new Date(i.pickupdate)
            //         var checkdropoff = new Date(i.dropoffdate)
            //         if (checkpickup <= searchpickup && searchpickup <= checkdropoff) {
            //             car.splice(i, 1)
            //         } else if (checkpickup <= searchdropoff && searchdropoff <= checkdropoff) {
            //             car.splice(i, 1)
            //         } else if (searchpickup <= checkpickup && checkdropoff <= searchdropoff) {
            //             car.splice(i, 1)
            //         }


            // }

            // console.log("qqqqqqqqqqqqqqqqqqqqqqqqqqq", car);
            // console.log("qwqwqwqwqwqwqwqwq");

            resolve(car)

        })

    },
    getcarinlocation: (pickup) => {
        console.log(pickup);
        return new Promise(async (resolve, reject) => {
            let Cars = await db.get().collection(collection.CARSCOLLECTION).find({ location: pickup }).toArray()
            resolve(Cars)
        })
    },

    // getuserbookings: (userDetails) => {
    //     return new Promise(async (resolve, reject) => {
    //         console.log(userDetails._id);
    //         let userdata = await db.get().collection(collection.BOOKINGSCOLLECTION).aggregate([
    //             { $match: { user: ObjectId(userDetails._id) } }, {
    //                 $lookup: {
    //                     from: collection.CARSCOLLECTION,
    //                     localField: 'car',
    //                     foreignField: '_id',
    //                     as: 'cars'
    //                 }
    //             }
    //         ]).toArray()
    //         console.log(userdata);
    //         resolve(userdata)
    //     })
    // },
    getupcomingbookings: (userdetails) => {
        return new Promise(async (resolve, reject) => {
            console.log(userdetails._id);
            let userdata = await db.get().collection(collection.BOOKINGSCOLLECTION).aggregate([
                { $match: { $and: [{ user: ObjectId(userdetails._id) }, { status: 'upcoming' }] } }, {
                    $lookup: {
                        from: collection.CARSCOLLECTION,
                        localField: 'car',
                        foreignField: '_id',
                        as: 'cars'
                    }
                }
            ]).toArray()
            console.log(userdata);
            resolve(userdata)
        })

    },
    getongoingbookings: (userdetails) => {
        return new Promise(async (resolve, reject) => {
            console.log(userdetails._id);
            let userdata = await db.get().collection(collection.BOOKINGSCOLLECTION).aggregate([
                { $match: { $and: [{ user: ObjectId(userdetails._id) }, { status: 'ongoing' }] } }, {
                    $lookup: {
                        from: collection.CARSCOLLECTION,
                        localField: 'car',
                        foreignField: '_id',
                        as: 'cars'
                    }
                }
            ]).toArray()
            console.log(userdata);
            resolve(userdata)
        })

    },
    getendedbookings: (userdetails) => {
        return new Promise(async (resolve, reject) => {
            console.log(userdetails._id);
            let userdata = await db.get().collection(collection.BOOKINGSCOLLECTION).aggregate([
                { $match: { $and: [{ user: ObjectId(userdetails._id) }, { status: 'ended' }] } }, {
                    $lookup: {
                        from: collection.CARSCOLLECTION,
                        localField: 'car',
                        foreignField: '_id',
                        as: 'cars'
                    }
                }
            ]).toArray()
            console.log(userdata);
            resolve(userdata)
        })

    },
    getbookingdetails: (userId) => {
        return new Promise(async (resolve, reject) => {
            let userdata = await db.get().collection(collection.BOOKINGSCOLLECTION).aggregate([
                { $match: { _id: ObjectId(userId) } }, {
                    $lookup: {
                        from: collection.CARSCOLLECTION,
                        localField: 'car',
                        foreignField: '_id',
                        as: 'cars'
                    }
                }
            ]).toArray()
            console.log(userdata);
            resolve(userdata)
        })
    },
    getbookingdata: (bookingId) => {
        return new Promise(async (resolve, reject) => {
            console.log(bookingId);
            let booking = await db.get().collection(collection.BOOKINGSCOLLECTION).findOne({ _id: ObjectId(bookingId) })
            console.log("your Booking is", booking);
            resolve(booking)
        })
    },
    cancelbooking: (bookingId) => {
        return new Promise(async (resolve, reject) => {
            let date = new Date()
            console.log(date);
            let month = date.getMonth() + 1
            let year = date.getFullYear()
            let day = date.getDate()
            if (month < 10)
                month = '0' + month.toString();
            if (day < 10)
                day = '0' + day.toString();
            console.log(day);
            let today = year + '-' + month + '-' + day;

            console.log("today : ", today);
            await db.get().collection(collection.BOOKINGSCOLLECTION).updateOne({ _id: ObjectId(bookingId) }, { $set: { status: 'cancelled', dropoffdate: today } }).then((response) => {
                resolve(response)
            })
        })
    },
    updateuserwallet: (userid, walletprice) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USERCOLLECTION).findOne({ _id: ObjectId(userid) })
            console.log("user:", user);

            if (user.wallet) {
                let wallet = parseInt(user.wallet) + parseInt(walletprice)
                db.get().collection(collection.USERCOLLECTION).updateOne({ _id: ObjectId(userid) }, { $set: { wallet: wallet } }).then((response) => {
                    resolve(response)
                })
            } else {
                db.get().collection(collection.USERCOLLECTION).updateOne({ _id: ObjectId(userid) }, { $set: { wallet: walletprice } }).then((response) => {
                    console.log(response);
                    resolve(response)
                })
            }
        })
    }
}