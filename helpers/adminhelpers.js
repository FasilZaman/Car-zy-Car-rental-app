var db = require('../config/connections')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { promise } = require('bcrypt/promises')
const async = require('hbs/lib/async')
const { ObjectId } = require('mongodb')
const { resolve, reject } = require('promise')
const { response } = require('../app')
const userhelpers = require('./userhelpers')
const collections = require('../config/collections')

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
    getcancelledbookings: () => {
        return new Promise(async (resolve, reject) => {
            let Bookings = await db.get().collection(collection.BOOKINGSCOLLECTION).aggregate([{ $match: { status: 'cancelled' } },
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
    endatrip: (bookingid,userid) => {
        return new Promise(async (resolve, reject) => {
            let details = await db.get().collection(collection.BOOKINGSCOLLECTION).findOne({ _id: ObjectId(bookingid) })

            console.log(details);
            let dropoff = details.dropoffdate
            console.log("ddaasdarsad", dropoff);
            dropofftime = new Date(dropoff)

            console.log("date : ", dropofftime);
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

            if (date > dropofftime) {

                console.log("timediffsafjsaifjsigbhhuu");
                var timediff = date.getTime() - dropofftime.getTime()
                hourdiff = timediff / (1000 * 60 * 60)

                console.log(hourdiff);

                let fine = 250 + (hourdiff * 100)
                fine = parseInt(fine)
                console.log("with or without",userid);
                await db.get().collection(collection.USERCOLLECTION).updateOne({_id:ObjectId(userid)},{$set:{fine:true}})
                
                await db.get().collection(collection.BOOKINGSCOLLECTION).updateOne({ _id: ObjectId(bookingid) }, { $set: { status: 'ended', dropoffdate: today, fineamount: fine, fineamountstatus: 'notpaid' } }).then((response) => {
                    resolve(response)
                })


            } else {
                await db.get().collection(collection.BOOKINGSCOLLECTION).updateOne({ _id: ObjectId(bookingid) }, { $set: { status: 'ended', dropoffdate: today } }).then((response) => {
                    resolve(response)
                })

            }


        })
    },
    addcoupon: (details) => {
        console.log('===================++++++++++++++++++', details);
        return new Promise(async (resolve, reject) => {
            let response = {}
            let coupons = await db.get().collection(collection.COUPONCOLLECTION).findOne({couponCode : details.couponCode})
            if(coupons){
                console.log("coupon already exist");
                response.couponfound = true
                resolve(response)
                
            }else{
                await db.get().collection(collection.COUPONCOLLECTION).insertOne(details).then((response) => {
                    resolve(response)
                })
            }
            
            
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
    },

    getbrand: () => {
        return new Promise(async (resolve, reject) => {
            let Brands = await db.get().collection(collection.CARSCOLLECTION).aggregate([{ $group: { _id: "$Brand" } }]).toArray()



            console.log(Brands);
            resolve(Brands)

        })
    },

    getType: () => {
        return new Promise(async (resolve, reject) => {
            let Brands = await db.get().collection(collection.CARSCOLLECTION).aggregate([{ $group: { _id: "$Type" } }]).toArray()



            console.log(Brands);
            resolve(Brands)

        })
    },
    addoffer: (offer) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            carBrand = offer.Brand
            carType = offer.Type
            caroffer = offer.offerPercentage
            let alloffers = await db.get().collection(collection.OFFERCOLLECTION).findOne({ Brand: "carBrand", Type: "carType" })
            console.log(alloffers);
            if (alloffers) {
                console.log("asdfghjkl");
                response.alreadyexist = true
                resolve(response)

            } else {
                await db.get().collection(collection.OFFERCOLLECTION).insertOne(offer).then(async (response) => {
                    console.log("zamanzaman");
                    await db.get().collection(collection.CARSCOLLECTION).update({ Brand: carBrand, Type: carType }, { $set: { discount: caroffer } })
                    response.alreadyexist = false
                    resolve(response)
                })
            }
        })
    },
    getoffers: () => {
        return new Promise(async (resolve, reject) => {
            let offers = await db.get().collection(collection.OFFERCOLLECTION).find().toArray()

            let date = new Date()
            date.setHours(5)
            date.setMinutes(30)
            date.setMilliseconds(0)
            date.setSeconds(0)
            console.log(date);
            for (let i of offers) {
                console.log(i);
                if (date >= new Date(i.offerExpiry)) {
                    console.log("Expired");
                    db.get().collection(collection.OFFERCOLLECTION).deleteOne({ _id: i._id })
                }
            }

            resolve(offers)
        })
    },
    deleteoffer: (id) => {
        return new Promise(async (resolve, reject) => {
            console.log(id);
            let offers = await db.get().collection(collection.OFFERCOLLECTION).findOne({ _id: ObjectId(id) })
            console.log("qwerty", offers);
            await db.get().collection(collection.OFFERCOLLECTION).deleteOne({ _id: ObjectId(id) }).then((response) => {
                db.get().collection(collection.CARSCOLLECTION).update({ Brand: offers.Brand, Type: offers.Type }, { $unset: { discount: "" } })
                resolve(response)
            })
        })
    },
    getalluserscount: () => {
        return new Promise(async (resolve, reject) => {
            let usercount = await db.get().collection(collection.USERCOLLECTION).count()
            console.log("all users count :", usercount);
            resolve(usercount)
        })
    },
    getallapprovedusercount: () => {
        return new Promise(async (resolve, reject) => {
            let approvedusercount = await db.get().collection(collection.USERCOLLECTION).count({ approved: true })
            console.log("all approved users :", approvedusercount);
            resolve(approvedusercount)
        })
    },
    getallcarscount: () => {
        return new Promise(async (resolve, reject) => {
            let allcarscount = await db.get().collection(collection.CARSCOLLECTION).count()
            console.log("all Cars Count :", allcarscount);
            resolve(allcarscount)
        })
    },
    getallavailablecarscount: () => {
        return new Promise(async (resolve, reject) => {
            let allcars = await db.get().collection(collection.CARSCOLLECTION).aggregate([
                {
                    $lookup: {
                        from: collection.BOOKINGSCOLLECTION,
                        localField: '_id',
                        foreignField: 'car',
                        as: 'bookings'
                    }
                }
            ]).toArray()

            let allcarscount = await db.get().collection(collection.CARSCOLLECTION).count()

            // console.log(allcars);

            let bookedcount = 0

            for (let i of allcars) {
                for (let j of i.bookings) {
                    let start = new Date(j.pickupdate)
                    let end = new Date(j.dropoffdate)
                    // console.log("qwers:", start, "qwere", end);
                    date = new Date()
                    date.setHours(5)
                    date.setMilliseconds(0)
                    date.setMinutes(30)
                    date.setSeconds(0)

                    // console.log("todaydate", date);

                    if (start.getTime() <= date.getTime() && date.getTime() <= end.getTime()) {
                        bookedcount++
                    }

                }
            }

            availablecount = allcarscount - bookedcount

            console.log("availablecars : ", availablecount);
            resolve(availablecount)

        })
    },
    getchartdata: () => {
        return new Promise(async (resolve, reject) => {
            let bookings = await db.get().collection(collection.BOOKINGSCOLLECTION).aggregate([{ $project: { _id: 0, pickupdate: 1, price: 1 } }]).toArray()
            // console.log("qwertyuiop",bookings);
            let date = new Date()
            let response = {}
            response.jan = 0
            response.feb = 0
            response.mar = 0
            response.apr = 0
            response.may = 0
            response.jun = 0
            response.jul = 0
            response.aug = 0
            response.sep = 0
            response.oct = 0
            response.nov = 0
            response.dec = 0
            let year = date.getFullYear()
            for (let i of bookings) {
                let from = new Date(i.pickupdate)
                fromYear = from.getFullYear()
                fromMonth = from.getMonth() + 1
                // console.log(from);
                // console.log("month=" + fromMonth);
                if (year == fromYear) {
                    if (fromMonth == 1) {
                        response.jan = parseInt(response.jan + 1)
                    }
                    else if (fromMonth == 2) {
                        response.feb = response.feb + i.price
                    } else if (fromMonth == 3) {
                        response.mar = response.mar + i.price
                    } else if (fromMonth == 4) {
                        response.apr = response.apr + i.price
                    } else if (fromMonth == 5) {
                        response.may = response.may + i.price
                    } else if (fromMonth == 6) {
                        response.jun = response.jun + i.price
                    } else if (fromMonth == 7) {
                        response.jul = response.jul + i.price
                    } else if (fromMonth == 8) {
                        response.aug = response.aug + i.price
                    } else if (fromMonth == 9) {
                        response.sep = response.sep + i.price
                    } else if (fromMonth == 10) {
                        response.oct = response.oct + i.price

                    } else if (fromMonth == 11) {
                        response.nov = response.nov + i.price
                    } else {
                        response.dec = response.dec + i.price
                    }
                }
            }
            // console.log(response);
            resolve(response)
        })
    },
    getpricebyType: () => {
        return new Promise(async (resolve, reject) => {
            let bookings = await db.get().collection(collection.BOOKINGSCOLLECTION).aggregate([{
                $lookup: {
                    from: collection.CARSCOLLECTION,
                    localField: 'car',
                    foreignField: '_id',
                    as: 'cars'
                }
            }]).toArray()

            console.log(bookings);

            let date = new Date()
            let response = {}
            response.SUV = 0
            response.HATCHBACK = 0
            response.SEDAN = 0

            let year = date.getFullYear()
            let month = date.getMonth() + 1

            for (let i of bookings) {
                let from = new Date(i.pickupdate)
                fromYear = from.getFullYear()
                fromMonth = from.getMonth() + 1

                for (let j of i.cars) {
                    console.log("qweqweqwe",i);
                    if (year == fromYear) {
                        if (month = fromMonth) {
                            if (j.Type == 'SUV') {
                                response.SUV = response.SUV + i.price
                                console.log(response.SUV);
                            }
                             if (j.Type == 'HATCHBACK') {
                                response.HATCHBACK = response.HATCHBACK + i.price
                            }
                             if(j.Type == 'SEDAN') {
                                response.SEDAN = response.SEDAN + i.price
                            }
                        }
                    }
                }
            }
            console.log("SUV",response.SUV,"sedan",response.SEDAN,"Hatchback",response.HATCHBACK);
            resolve(response)
        })
    },
    getmostbookedcar: () => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let mostbooked = await db.get().collection(collection.BOOKINGSCOLLECTION).aggregate([{
                $group: { _id: '$car', count: { $sum: 1 } }
            }, {
                $sort: { count: -1 }
            }, { $limit: 1 }, {
                $lookup: {
                    from: collection.CARSCOLLECTION,
                    localField: '_id',
                    foreignField: '_id',
                    as: "cars"
                }
            }, {
                $project: { carname: '$cars.Name', carBrand: '$cars.Brand', _id: 0 }
            }
            ]).toArray()
            console.log("mostbooked car :", mostbooked);
            let mostbookedcarname = mostbooked[0].carname[0]
            let mostbookedcarBrand = mostbooked[0].carBrand[0]
            console.log("mostname =", mostbookedcarname);
            console.log("mostbrand = ", mostbookedcarBrand)
            response.name = mostbookedcarname
            response.Brand = mostbookedcarBrand
            resolve(response)
        })
    },
    getmostbookedbrand: () => {
        return new Promise(async (resolve, reject) => {
            let bookedCategory = await db.get().collection(collection.BOOKINGSCOLLECTION).aggregate([{
                $lookup: {
                    from: collection.CARSCOLLECTION,
                    localField: 'car',
                    foreignField: '_id',
                    as: 'cardata'

                }
            },
            {
                $project: {
                    category: '$cardata.Brand'
                }
            }, {
                $group: { _id: '$category', count: { $sum: 1 } }
            }, {
                $sort: { count: -1 }
            },
            {
                $limit: 1
            }
            ]).toArray()

            mostbookedbrand = bookedCategory[0]._id[0]

            console.log("Brand : ", mostbookedbrand);

            console.log("any", bookedCategory);
            resolve(mostbookedbrand)
        })
    },
    getmostbookedtype: () => {
        return new Promise(async (resolve, reject) => {
            let bookedType = await db.get().collection(collection.BOOKINGSCOLLECTION).aggregate([{
                $lookup: {
                    from: collection.CARSCOLLECTION,
                    localField: 'car',
                    foreignField: '_id',
                    as: 'cardata'

                }
            },
            {
                $project: {
                    category: '$cardata.Type'
                }
            }, {
                $group: { _id: '$category', count: { $sum: 1 } }
            }, {
                $sort: { count: -1 }
            },
            {
                $limit: 1
            }
            ]).toArray()

            mostbookedtype = bookedType[0]._id[0]

            console.log("Type : ", mostbookedtype);

            console.log("any", bookedType);
            resolve(mostbookedtype)
        })
    },
    getallbookingscount: () => {
        return new Promise(async (resolve, reject) => {
            let allbookingscount = db.get().collection(collection.BOOKINGSCOLLECTION).count()
            resolve(allbookingscount)
        })
    },
    getallbookingsthismonth: () => {
        return new Promise(async (resolve, reject) => {
            let date = new Date()
            let month = date.getMonth() + 1
            let year = date.getFullYear()
            let bookings = await db.get().collection(collection.BOOKINGSCOLLECTION).find().toArray()

            // console.log("ALLLLLLL",bookings);

            let bookingsthismonth = 0

            for (i of bookings) {
                let pickup = new Date(i.pickupdate)
                let pickupmonth = pickup.getMonth() + 1
                let pickupyear = pickup.getFullYear()
                if (month == pickupmonth && year == pickupyear) {
                    bookingsthismonth++
                }
            }
            console.log("This month :", bookingsthismonth);
            resolve(bookingsthismonth)
        })
    },
    getallbookingstoday: () => {
        return new Promise(async (resolve, reject) => {
            let date = new Date()
            let month = date.getMonth() + 1
            let year = date.getFullYear()
            let day = date.getDay()
            let bookings = await db.get().collection(collection.BOOKINGSCOLLECTION).find().toArray()

            // console.log("ALLLLLLL",bookings);

            let bookingstoday = 0

            for (i of bookings) {
                let pickup = new Date(i.pickupdate)
                let pickupmonth = pickup.getMonth() + 1
                let pickupyear = pickup.getFullYear()
                let pickupday = pickup.getDay()
                if (month == pickupmonth && year == pickupyear && day == pickupday) {
                    bookingstoday++
                }
            }
            console.log("This day :", bookingstoday);
            resolve(bookingstoday)
        })

    },
    getallrecentbookings: () => {
        return new Promise(async (resolve, reject) => {
            let Bookings = await db.get().collection(collection.BOOKINGSCOLLECTION).aggregate([
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
            ]).sort({ _id: -1 }).limit(10).toArray()

            console.log("allbookings : ", Bookings);
            resolve(Bookings)

        })
    },

    getbookingsreport: (dates) => {
        return new Promise(async (resolve, reject) => {
            let datesbetween = []
            let startdate = new Date(dates.startDate)
            let enddate = new Date(dates.endDate)

            let currentDate = new Date(startdate)
            let bookings = await db.get().collection(collection.BOOKINGSCOLLECTION).aggregate([
                {
                    $project: { pickupdate: 1, cars: 1, price: { $toInt: "$price" } }
                }, {
                    $group: { _id: '$pickupdate', count: { $sum: 1 }, amount: { $sum: "$price" } }
                }
            ]).toArray()
            console.log(bookings);

            let bookedcars = await db.get().collection(collection.BOOKINGSCOLLECTION).aggregate([{
                $lookup: {
                    from: collection.CARSCOLLECTION,
                    localField: 'car',
                    foreignField: '_id',
                    as: 'cars'
                }
            }, {
                $project: { pickupdate: 1, type: '$cars.Type', price: { $toInt: "$price" } }
            }
            ]).toArray()


            console.log("jj", bookings, 'kk', bookedcars);

            while (currentDate <= enddate) {
                datesbetween.push(currentDate);
                currentDate = new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth(),
                    currentDate.getDate() + 1, // Will increase month if over range
                    currentDate.getHours(),
                    currentDate.getMinutes()
                );
            }
            console.log(datesbetween);

            let report = []


            for (let dates of datesbetween) {
                flag = 0
                for (let data of bookings) {
                    suvcount = 0
                    Hatchbackcount = 0
                    sedancount = 0
                    for (let i of bookedcars) {
                        if(data._id == i.pickupdate){
                            if(i.type[0] == 'SUV'){
                                suvcount++
                            }
                            if(i.type[0] == 'HATCHBACK'){
                                Hatchbackcount++
                            }
                            if(i.type[0] == 'SEDAN'){
                                sedancount++
                            }
                        }
                    }
                    bookingdate = new Date(data._id)
                    bookingdate.setHours(5)
                    bookingdate.setMinutes(30)
                    if (dates.getTime() === bookingdate.getTime()) {
                        var month = dates.getMonth() + 1;
                        var day = dates.getDate();
                        var year = dates.getFullYear();
                        if (month < 10)
                            month = '0' + month.toString();
                        if (day < 10)
                            day = '0' + day.toString();

                        formattedDate = day + "-" + month + "-" + year
                        report.push({ date: formattedDate, count: data.count,SUV:suvcount, HATCHBACK:Hatchbackcount,SEDAN:sedancount, revenue: data.amount })
                        flag = 1
                    }
                }
                if (flag === 0) {
                    var month = dates.getMonth() + 1;
                    var day = dates.getDate();
                    var year = dates.getFullYear();
                    if (month < 10)
                        month = '0' + month.toString();
                    if (day < 10)
                        day = '0' + day.toString();

                    formattedDate = day + "-" + month + "-" + year
                    report.push({ date: formattedDate, count: 0,SUV:0, HATCHBACK:0,SEDAN:0, revenue: 0 })
                }
            }
            console.log(report);

            resolve(report)



        })
    },
    getbookings: (id) => {
        return new Promise(async (resolve, reject) => {
            console.log(id);
            let bookings = await db.get().collection(collection.BOOKINGSCOLLECTION).findOne({ _id: ObjectId(id) })
            resolve(bookings)
        })

    },
    getuserreport: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.BOOKINGSCOLLECTION).aggregate([{
                $project: { user: 1, amount: { $toInt: "$price" } }
            },
            {
                $group: { _id: "$user", count: { $sum: 1 }, amount: { $sum: "$amount" } }
            }, {
                $project: { _id: { $toObjectId: "$_id" }, count: 1, amount: 1 }
            },
            {
                $lookup: {
                    from: collections.USERCOLLECTION,
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            }, {
                $project: { _id: 1, count: 1, amount: 1, userName: "$user.username", userMobile: "$user.mobileNumber", userEmail: "$user.email" }
            }]).toArray()
            console.log(users);
            resolve(users)
        })
    },

}