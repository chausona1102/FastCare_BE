const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendVerifyEmail = async (email, token) => {
  // const link = `${process.env.CLIENT_URL}/api/auth/verify-email?token=${token}`;
  const link = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: `"App Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your email",
    html: `
            <h1>Chào mừng bạn đến với FastCare</h1>
            <p>Nhấn vào liên kết dưới để xác thực tài khoản</p>
            <a href="${link}" style="padding:10px 20px;background:#4F46E5;color:#fff;border-radius:6px;text-decoration:none">Xác thực email</a>
            <p style="color:#888;font-size:12px">Link hết hạn sau 24 giờ.</p>
        `,
  });
};

const sendReturnDecisionEmail = async ({ email, name, orderCode, status, reason, instructions, deadline }) => {
  const approved = status === "return_approved";
  const decisionText = approved ? "đã được duyệt" : "đã bị từ chối";
  const details = approved
    ? `${instructions}\nHạn mang sản phẩm đến: ${new Date(deadline).toLocaleString("vi-VN")}`
    : `Lý do từ chối: ${reason}`;
  await transporter.sendMail({
    from: `"FastCare" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Cập nhật yêu cầu trả hàng đơn ${orderCode}`,
    text: [
      `Xin chào ${name || "Quý khách"},`,
      `Yêu cầu trả hàng cho đơn ${orderCode} ${decisionText}.`,
      details,
      "Quý khách có thể xem lại thông tin trong mục Đơn hàng của tôi trên FastCare.",
    ].join("\n\n"),
  });
};

module.exports = {
  sendVerifyEmail,
  sendReturnDecisionEmail,
};
