import dotenv from 'dotenv';
dotenv.config();
import { createTransport } from "nodemailer";

class XL_GOI_THU_DIEN_TU {
    Goi_Thu(from, to, subject, body) {
        let transporter = createTransport({
            service: 'gmail',
            auth: {
                user: process.env.USER_GMAIL, // User gmail 
                pass: process.env.PWD_GMAIL // Pwd ứng dụng của gmail
            }
        });

        let mailOptions = {
            from: `Shop 303 <${from}>`,
            to: to,
            subject: subject,
            html: body
        };
        // Gọi phương thức sendMail -> trả về dạng promise
        return transporter.sendMail(mailOptions)
    }

}

var Goi_thu = new XL_GOI_THU_DIEN_TU()
export default Goi_thu