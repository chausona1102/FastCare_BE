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
  const sended = await transporter.sendMail({
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
  console.log("Verify email sent:", sended.response);
};

const sendLoginNotification = async ({
  to,
  refreshTokenId,
  deviceInfo,
  ipAddress,
  createdAt,
}) => {
  const loginTime = new Date(createdAt).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>

    <body style="
      margin: 0;
      padding: 0;
      background-color: #f5f6f8;
      font-family: Arial, Helvetica, sans-serif;
      color: #333;
    ">
      <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        style="padding: 40px 15px;"
      >
        <tr>
          <td align="center">

            <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
              style="
                max-width: 560px;
                background: #ffffff;
                border-radius: 14px;
                overflow: hidden;
                box-shadow: 0 4px 18px rgba(0,0,0,0.08);
              "
            >

              <!-- Header -->
              <tr>
                <td style="
                  background: #d70018;
                  padding: 25px;
                  text-align: center;
                ">
                  <div style="
                    color: #ffffff;
                    font-size: 26px;
                    font-weight: bold;
                  ">
                    FastCare
                  </div>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 35px 35px 25px;">

                  <h2 style="
                    margin: 0 0 12px;
                    text-align: center;
                    color: #222;
                    font-size: 22px;
                  ">
                    Có đăng nhập mới
                  </h2>

                  <p style="
                    margin: 0 0 25px;
                    text-align: center;
                    color: #666;
                    font-size: 15px;
                    line-height: 1.6;
                  ">
                    Tài khoản FastCare của bạn vừa được đăng nhập
                    trên một thiết bị mới.
                  </p>

                  <!-- Login information -->
                  <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    style="
                      background: #f8f9fa;
                      border-radius: 10px;
                      margin-bottom: 25px;
                    "
                  >
                    <tr>
                      <td style="
                        padding: 18px 20px;
                        border-bottom: 1px solid #e5e5e5;
                      ">
                        <strong>Thời gian</strong>
                        <div style="
                          margin-top: 6px;
                          color: #666;
                        ">
                          ${loginTime}
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td style="
                        padding: 18px 20px;
                        border-bottom: 1px solid #e5e5e5;
                      ">
                        <strong>Thiết bị / Trình duyệt</strong>
                        <div style="
                          margin-top: 6px;
                          color: #666;
                          word-break: break-word;
                        ">
                          ${deviceInfo}
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding: 18px 20px;">
                        <strong>Địa chỉ IP</strong>
                        <div style="
                          margin-top: 6px;
                          color: #666;
                        ">
                          ${ipAddress}
                        </div>
                      </td>
                    </tr>
                  </table>

                  <p style="
                    margin: 0 0 20px;
                    text-align: center;
                    color: #444;
                    font-size: 15px;
                  ">
                    Bạn có phải là người vừa đăng nhập không?
                  </p>

                  <!-- Buttons -->
                  <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                  >
                    <tr>

                      <td
                        width="48%"
                        align="center"
                        style="padding-right: 5px;"
                      >
                        <a
                          href="${process.env.CLIENT_URL}/"
                          style="
                            display: block;
                            background: #d70018;
                            color: #ffffff;
                            text-decoration: none;
                            padding: 14px 10px;
                            border-radius: 8px;
                            font-weight: bold;
                            font-size: 14px;
                          "
                        >
                          Là tôi - Đi đến trang chủ
                        </a>
                      </td>

                      <td
                        width="48%"
                        align="center"
                        style="padding-left: 5px;"
                      >
                        <a
                          href="${process.env.CLIENT_URL}/security/login-reject/${refreshTokenId}"
                          style="
                            display: block;
                            background: #f1f1f1;
                            color: #333333;
                            text-decoration: none;
                            padding: 14px 10px;
                            border-radius: 8px;
                            font-weight: bold;
                            font-size: 14px;
                            border: 1px solid #ddd;
                          "
                        >
                          Không phải tôi
                        </a>
                      </td>

                    </tr>
                  </table>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="
                  padding: 20px 30px;
                  background: #fafafa;
                  text-align: center;
                  color: #999;
                  font-size: 12px;
                  line-height: 1.6;
                ">
                  Đây là email tự động từ FastCare.<br />
                  Nếu bạn không thực hiện đăng nhập này,
                  hãy chọn <strong>“Không phải tôi”</strong>.
                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await transporter.sendMail({
    to,
    subject: "Cảnh báo đăng nhập mới - FastCare",
    html,
  });
};

const sendPin = async ({ to, pin }) => {
  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>

    <body style="
      margin: 0;
      padding: 0;
      background-color: #f5f6f8;
      font-family: Arial, Helvetica, sans-serif;
      color: #333;
    ">
      <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        style="padding: 40px 15px;"
      >
        <tr>
          <td align="center">

            <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
              style="
                max-width: 560px;
                background: #ffffff;
                border-radius: 14px;
                overflow: hidden;
                box-shadow: 0 4px 18px rgba(0,0,0,0.08);
              "
            >

              <!-- Header -->
              <tr>
                <td style="
                  background: #d70018;
                  padding: 25px;
                  text-align: center;
                ">
                  <div style="
                    color: #ffffff;
                    font-size: 26px;
                    font-weight: bold;
                  ">
                    FastCare
                  </div>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 35px 35px 25px;">

                  <h2 style="
                    margin: 0 0 12px;
                    text-align: center;
                    color: #222;
                    font-size: 22px;
                  ">
                    Mã xác thực của bạn là <span style="color: #d70018; background-color: #f1f1f1; padding: 5px 10px; border-radius: 4px;">${pin}</span>
                  </h2>

                  <p style="
                    margin: 0 0 25px;
                    text-align: center;
                    color: #666;
                    font-size: 15px;
                    line-height: 1.6;
                  ">
                    ⚠️ Đây là mã xác thực của bạn. Mã này sẽ hết hạn sau 5 phút kể từ lúc gửi. Vui lòng không chia sẻ mã này với bất kỳ ai. 
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="
                  padding: 20px 30px;
                  background: #fafafa;
                  text-align: center;
                  color: #999;
                  font-size: 12px;
                  line-height: 1.6;
                ">
                  Đây là email tự động từ FastCare.<br />
                  <strong>“Vui lòng không phản hồi!!!”</strong>.
                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await transporter.sendMail({
    to,
    subject: "Mã xác thực - FastCare",
    html,
  });
};

const sendReturnDecisionEmail = async ({
  email,
  name,
  orderCode,
  status,
  reason,
  instructions,
  deadline,
}) => {
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
  sendLoginNotification,
  sendPin,
};
