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
                carDetails.Price=parseInt(carDetails.Price)
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
            let Cars=await db.get().collection(collection.CARSCOLLECTION).find().toArray()
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
                carDetails.Price=parseInt(carDetails.Price)
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
                carDetails.Price=parseInt(carDetails.Price)
                db.get().collection(collection.CARSCOLLECTION).updateOne({ _id: ObjectId(carId) }, { carDetails }).then((details) => {
                    response.id = details.insertedId
                    resolve(response)
                })
            }
        })
    },
    getCars: (carname,pickup) => {
        return new Promise(async (resolve, reject) => {
            console.log(pickup.location);
            let Cars = await db.get().collection(collection.CARSCOLLECTION).find({$and:[{location:pickup}, {$text: { $search: carname } }]}).toArray()
            console.log(Cars);
            resolve(Cars)
        })
    },
    getusercars: (hourdiff,body)=>{
        return new Promise(async(resolve,reject)=>{
            let Cars = await db.get().collection(collection.CARSCOLLECTION).aggregate([{$match:{location:body.location}},{
                $project: {
                    _id: 1,Name: 1, Brand: 1, Fuel:1, Type: 1, Transmission: 1, Seats: 1, Carnumber: 1, Mileage: 1, Status: 1,location: 1,
                    Price: {$multiply: [hourdiff,'$Price']}
                }
            },]).toArray()
            resolve(Cars)
    })
        
    },
    getcarinlocation:(pickup)=>{
        console.log(pickup);
        return new Promise(async(resolve,reject)=>{
            let Cars = await db.get().collection(collection.CARSCOLLECTION).find({location:pickup}).toArray()
            resolve(Cars)
        })
    }
}