const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL,
    pass: process.env.APP_PASS,
  },
});


async function mail(sub, html, toMail) {
  const info = await transporter.sendMail({
    from: process.env.MAIL,
    to: toMail,
    subject: sub,
    html: html,
  });

  console.log("Message sent: %s", info);
}


module.exports = mail

