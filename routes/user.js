const { response } = require('express');
var express = require('express');
const res = require('express/lib/response');
var moment =require('moment')
var router = express.Router();
const userhelpers = require('../helpers/userhelpers')
var carsHelpers = require('../helpers/carshelpers');
const { Client } = require('twilio/lib/twiml/VoiceResponse');
const serviceSID = process.env.serviceSID
const accountSID = process.env.accountSID
const authTockon = process.env.authToken
const req = require('express/lib/request');
const async = require('hbs/lib/async');
const client = require('twilio')(accountSID, authTockon);

const verifyUser = async (req,res,next)=>{
  if(req.session.Mobilenum){
    let userblocked = await userhelpers.getuserdetails(req.session.Mobilenum)
    if(userblocked){
      if(userblocked.blocked){
        req.session.user=false
      }else{
        req.session.userDetails=userblocked
      }
    }else{
      req.session.user=false
    }
  }
  next()
}

/* GET home page. */
router.get('/',verifyUser, function (req, res, next) {
  res.render('user/home', { 'loggedIn': req.session.user, user: true, userdetails:req.session.userdetails });
});

//loading user login page
router.get('/loginpage',verifyUser, (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/login', { loginerr: req.session.loginerr, user: true })
  }
})

//user login
router.post('/userlogin', (req, res) => {
  userhelpers.userlogin(req.body).then((response) => {
    if (response.status) {
      req.session.user = true
      req.session.userdetails=response.user
      req.session.Mobilenum = response.user.mobileNumber
      req.session.loginerr = false
      res.redirect('/')
    } else {
      req.session.loginerr = true
      res.redirect('/loginpage')
    }
  })

})


//loading user login with otp page
router.get('/loginotp', (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/loginotp', { invalidnumber: req.session.invalidnumber, user: true })
  }
})
//otp logging in
router.post('/userloginotp', (req, res) => {
  let mobile = req.body.mobileNumber
  req.session.number = mobile
  userhelpers.getuserdetails(mobile).then((user) => {
    if (user) {
      req.session.invalidnumber = false
      req.session.temp = req.body
      client.verify
        .services(serviceSID)
        .verifications.create({
          to: `+91${req.body.mobileNumber}`,
          channel: "sms"
        }).then((resp) => {
          res.redirect('/otplogin');
        }).catch((err) => {
          console.log(err);
        })
    } else {
      req.session.invalidnumber = true
      res.redirect('/loginotp')

    }
  })
})


//resend button
router.get('/resendotp', (req, res) => {

  client.verify
    .services(serviceSID)
    .verifications.create({
      to: `+91${req.session.number}`,
      channel: "sms"
    }).then((resp) => {
      res.redirect('/otplogin');
    }).catch((err) => {
      console.log(err);
    })
})

router.get('/otplogin', (req, res) => {
  res.render('user/userloginotp', { invalidloginotp: req.session.invalidloginotp, user: true })
})

router.post('/loginotp', (req, res) => {
  let OTP = req.body.otp
  let number = req.session.number

  client.verify
    .services(serviceSID)
    .verificationChecks.create({
      to: `+91${number}`,
      code: OTP
    }).then(async (resp) => {
      if (resp.valid) {
        req.session.Mobilenum = number
        req.session.invalidloginotp = false
        // let user = await userHelper.getuserdetails(number)
        req.session.user = true
        res.redirect('/')
      } else {
        req.session.invalidloginotp = true
        res.redirect('/otplogin')
      }
    }).catch((err) => {
      req.session.invalidloginotp = true
      res.redirect('/otplogin')
    })
})
//end login with otp

//otp signup

router.get('/signuppage', (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/signup', { user: true })
  }
})



router.post('/usersignup', (req, res) => {
  let mobile = req.body.mobileNumber
  req.session.number = mobile
  userhelpers.getuserdetails(mobile).then((user) => {
    if (user) {
      res.redirect('/signuppage')
    } else {
      req.session.temp = req.body
      client.verify
        .services(serviceSID)
        .verifications.create({
          to: `+91${req.body.mobileNumber}`,
          channel: "sms"
        }).then((resp) => {
          res.redirect('/otp');
        }).catch((err) => {
          console.log(err);
        })

    }
  })
})


router.get('/resendotpsignup', (req, res) => {

  client.verify
    .services(serviceSID)
    .verifications.create({
      to: `+91${req.session.number}`,
      channel: "sms"
    }).then((resp) => {
      res.redirect('/otp');
    }).catch((err) => {
      console.log(err);
    })
})

router.get('/otp', (req, res) => {
  res.render('user/signupotp.hbs', { user: true })
})


router.post('/otp', (req, res) => {
  let OTP = req.body.otp
  let number = req.session.number
  console.log(number);
  client.verify
    .services(serviceSID)
    .verificationChecks.create({
      to: `+91${number}`,
      code: OTP
    }).then(async (resp) => {
      if (resp.valid) {
        req.session.Mobilenum = number
        userhelpers.usersignup(req.session.temp).then((user) => {
          // let user = await userHelper.getuserdetails(number)
          req.session.user = true
          res.redirect('/')
        })
      } else {
        userhelpers.
          req.session.inavlidloginOtp = true
        res.redirect('/otp')
      }
    }).catch((err) => {
      req.session.inavlidloginOtp = true
      res.redirect('/otp')
    })
})

//end otp signup

router.get('/logout', (req, res) => {
  req.session.user = false
  res.redirect('/')
})

router.post('/carslist', (req, res) => {
  //date and time
  var pickup=new Date(`${req.body.pickupDate} ${req.body.pickuptime}`)
  console.log('IST :',pickup.toString());
  console.log("pickup date and time :",pickup);
  var dropoff=new Date(`${req.body.dropoffDate} ${req.body.dropofftime}`)
  console.log('IST :',dropoff.toString());
  console.log('dropoff date and time :', dropoff);

  var timediff = dropoff.getTime() - pickup.getTime()
  console.log('sec :',timediff);

  hourdiff = timediff /(1000*60*60)
  
  req.session.totalhours = hourdiff 

  console.log('diff :', hourdiff);
  var diff = parseInt(hourdiff)
  console.log(diff);
  //end date and time

  req.session.bookingdetail = req.body
  bookingdetails = req.session.bookingdetail
  carsHelpers.getusercars(diff,req.body).then((Cars) => {
    // carsHelpers.getavailablecars(Cars).then((availableCars)=>{
    //   console.log(availableCars);
      res.render('user/carslist', { Cars, user: true, bookingdetails })
    // })
    // for(const abc of Cars ){
    //   console.log(abc.location);
    // }

    // console.log(Cars);
    // res.render('user/carslist', { Cars, user: true, bookingdetails })
  })
})
router.get('/carslistpage', (req, res) => {
  location=bookingdetails.location
  carsHelpers.getcardetails().then((Cars) => {
    res.render('user/carslist', { Cars, user: true})
  })
})

router.get('/carsdetails/:id', (req, res) => {
  let carId = req.params.id
  carsHelpers.carDetails(carId).then((Car) => {
    Car.Price= parseInt(Car.Price * req.session.totalhours)
    req.session.car = Car
    console.log(Car);
    res.render('user/carsdetails', { Car, user: true })
  })
})

router.get('/Bookcar/', (req, res) => {
  let carId = req.query.id
  carsHelpers.carDetails(carId).then((Car) => {
    Car.Price= parseInt(Car.Price * req.session.totalhours)
    req.session.car = Car
    console.log(Car);
    res.render('user/userbooking', { Car, user: true ,bookingdetails})
  })
})

router.post('/searchCar',(req,res)=>{
  let carname = req.body.search
  console.log(carname);
  location=bookingdetails.location
  console.log(location);
  carsHelpers.getCars(carname,location).then((Cars)=>{
    if(Cars!=""){
      Cars.Price= parseInt(Cars.Price * req.session.totalhours)
      req.session.nocarfound=false
      console.log(Cars);
      match=req.session.allmatchcars
      res.render('user/carslist', { Cars, user: true, bookingdetails , match })
    }
  else{
    req.session.nocarfound=true
    carsHelpers.getcarinlocation(location).then((Cars)=>{
      Cars.Price= parseInt(Cars.Price * req.session.totalhours)
      res.render('user/carslist',{Cars, user: true, bookingdetails})
    })

    // if(carname=""){
    //   req.session.nocarfound=false
    //   res.redirect('/carslistpage')
    // }else{
    //   req.session.nocarfound=true
    //   res.redirect('/carslistpage')
    // }
    
  }
})
})
//Booking
router.post('/Booknow',(req,res)=>{
  let deliverytype = req.body.bookingtype
  console.log(req.body);
  if(deliverytype=="delivery"){
    res.render('user/delivery.hbs')
  }else{
    if(req.session.user)
    {
      userId=req.session.userDetails._id
      carId=req.session.car._id
      Price=req.session.car.Price
      
      userhelpers.bookacar(userId,carId,bookingdetails,Price)
      res.send("Booking successfull")
    }else{
      res.redirect('/loginpage')
    }
    
  }
})

router.get('/userrides', (req, res) => {
  if (req.session.user) {
    res.render('user/bookinghistory',{user:true})
  } else {
    res.redirect('/')
  }
})

module.exports = router;