import nodemailer from "nodemailer"
import env from "dotenv"
env.config()




function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString()
}


async function sendVerificationEmail(email, otp) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        })
        // console.log("trs",transporter);
        

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Verify your account",
            text: `Your verification OTP is ${otp}`,
            html: `<b>Your OTP :${otp}</b>`
        })

        // console.log("info",info);
        
        return info.accepted.length > 0

    } catch (error) {
        console.error("Error sending email", error)
        return false
    }

}

export { sendVerificationEmail, generateOtp }