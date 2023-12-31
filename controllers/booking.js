const bookingModel = require("../models/booking");
const carModel = require("../models/carModel");
const tempBooking = require("../models/tempbooking");
const userModel = require("../models/userModel");
const mail = require("../utils/mailer");
let id;
const getAllBookings = async(req, res) => {
    try {
        await bookingModel.find().then(bookings => {
          if(bookings.length >0){
            res.status(200).json(bookings)
          }else{
            res.status(400).json({"msg": "no bookings"})
          }
        })
    } catch (error) {
        console.log(error)
    }
} 

const getBookings = async (req, res) => {
  try {
    const email = req.body.email;
    await bookingModel.findOne({userId: email}).then(async(booking) => {
      await carModel.findById(booking.carId).then(async(car) => {
        res.status(200).json({"booking": booking, "car": car})
      })
    })
  } catch (error) {
    console.log(error);
  }
}; 

const confirmBook = async(req, res) => {
    try {
        console.log(req.body)
        const newTempBooking = new tempBooking({
          data: req.body.data,
          carId: req.body.id,
        });
        id = newTempBooking._id;
        await newTempBooking.save().then(() => {
          res.status(200).json({"msg": newTempBooking._id})
        });
    } catch (error) {
        console.log(error)
    }
}

const getTempData = async(req, res) => {
    try {
        const id = req.params.id;
        await tempBooking.findById(id).then(async(data) => {
            await carModel.findById(data.carId).then(car => {
                let resp = {
                  carId: car._id,
                  email: req.body.email,
                  brand: car.brand,
                  price: car.amount,
                  time: data.data[3],
                  location: data.data[0],
                  date: data.data[1],
                  ddate: data.data[2]
                };
                res.status(200).json(resp);
            })
        })
    } catch (error) {
        console.log(error)
    }
}

const bookCar = async(req, res) => {
    if(req.method == "GET"){
        const id = req._parsedUrl.query.split("=")[1];
        res.render("confirmBook.ejs", {id});
    }else if(req.method == "POST"){
        try {
          const body = req.body;
          await bookingModel
            .findOne({ carId: body.carId, startDate: body.startDate })
            .then(async (booking) => {
              console.log(booking);
              if (booking == null) {
                await carModel.findById(body.carId).then((car) => {
                    console.log(car.carStatus)
                  if (car.carStatus != true) {
                    car.carStatus = true;
                    let diff =
                      parseInt(body.dropDate.split("-")[2]) -
                      parseInt(body.startDate.split("-")[2]);
                    car.save().then(async () => {
                      const newBooking = new bookingModel({
                        time: body.time,
                        userId: body.email,
                        carId: body.carId,
                        price: diff * car.amount,
                        startDate: body.startDate,
                        dropDate: body.dropDate,
                      });
                      await tempBooking.findOneAndDelete({carId: body.carId});
                      await newBooking.save().then(async() => {
                        let html = `
                        <div><b style="display: inline-block;">Booking By:</b> <p>${body.email}</p></div> 
                        </br>
                        <div>
                          <b style="display: inline-block;">User phone:</b> <p>${body.phone}</p>
                        </div> 
                        </br> 
                          <div>
                            <b style="display: inline-block;">Booking date:</b> <p>${body.startDate}</p> 
                          </div>
                        </br>
                          <div>
                            <b style="display: inline-block;">Drop date:</b> <p>${body.dropDate}</p>
                          </div>
                        </br> 
                          <div>
                            <b style="display: inline-block;">Booking time:</b> <p>${body.time}</p> 
                          </div>
                        </br> 
                          <div>
                            <b style="display: inline-block;">Car brand:</b> <p>${car.brand}</p> 
                          </div>
                        </br> 
                          <div>
                          <b style="display: inline-block;">Total Amount:</b> <p>${diff * car.amount}</p> 
                          </div>
                          `;
                        let executiveMail = "sidhardhchandra141@gmail.com"
                        await mail("New Booking", html, executiveMail).catch();
                        await mail("Booking placed", `<p> Your booking has been placed. Our executive will be shortly calling you about the payment and other details</p></br><b style="display: inline-block;">Total Amount:</b> <p>${diff * car.amount}</p>`, body.email).catch();
                        res.status(200).json({ msg: "car booked" });
                      });
                    });
                  } else {
                    res.status(400).json({ msg: "car already booked" });
                  }
                });
              } else {
                res.status(400).json({ msg: "Car already Booked" });
              }
            });
        } catch (error) {
          console.log(error);
        }
    }
}

const updatePayment = async(req, res) => {
    try {
      const body = req.body;
      await userModel.findOne({email: req.body.email}).then(async(user) => {
        if(user.role === "admin" || user.role === "exec"){
          await bookingModel.findById(body.bookingId).then((bill) => {
            if(bill != null){
              bill.time = body.time;
              bill.paymentStatus = body.paymentStatus;
              bill.startDate = body.startDate;
              bill.dropDate = body.dropDate;
              bill.save().then(() => {
                res.status(200).json({ msg: "Changes Saved" });
              });
            }
          });
        }
      })
    } catch (error) {
        console.log(error)
    }
}


const payment = async(req, res) => {
  try {
    if(req.method == "GET"){
      res.render("bill.ejs");
    }else if(req.method == "POST"){
      console.log(req.body)
      await bookingModel.findOne({userId: req.body.email}).then(booking => {
        console.log(booking)
        if(booking != null){
          res.status(200).json({"price": booking.price})
        }
      })
    }
  } catch (error) {
    console.log(error)
  }
}

module.exports = {
  bookCar,
  confirmBook,
  getTempData,
  getAllBookings,
  payment,
  getBookings,
  updatePayment,
};