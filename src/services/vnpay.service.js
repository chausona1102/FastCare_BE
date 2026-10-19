const crypto = require('crypto');
const qs = require('qs');

const {
    tmnCode,
    hashSecret,
    vnpUrl,
    returnUrl,
} = require('../config/vnpay.config');

const frontendUrl = process.env.VNP_FRONTEND_URL || 'http://localhost:5173';

const getConfiguration = () => {
    if (!tmnCode || !hashSecret || !vnpUrl || !returnUrl) {
        throw new Error('Vui lòng cấu hình đầy đủ thông tin VNPAY');
    }
};

const createPaymentUrl = (orderId, amount, ipAddress) => {
    getConfiguration();

    const date = new Date();
    const formatDate = (value) => {
        const parts = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23',
        }).formatToParts(value);
        const part = (type) => parts.find((item) => item.type === type).value;
        return `${part('year')}${part('month')}${part('day')}${part('hour')}${part('minute')}${part('second')}`;
    };
    
    const createDate = formatDate(date);
    const expireDate = new Date(date.getTime() + 15 * 60 * 1000);
    const vnpExpireDate = formatDate(expireDate);

    const txnRef = `${orderId}-${Date.now()}`;

    let params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Amount: Math.round(amount * 100),
        vnp_CurrCode: 'VND',
        vnp_TxnRef: txnRef,
        vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
        vnp_OrderType: 'other',
        vnp_Locale: 'vn',
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddress || '127.0.0.1',
        vnp_CreateDate: createDate,
        vnp_ExpireDate: vnpExpireDate,
    };
    params = sortObject(params);

    const signData = qs.stringify(params, { encode: false });

    const hmac = crypto.createHmac('sha512', hashSecret);
    const secureHash = hmac.update(Buffer.from(signData, "utf-8")).digest('hex');

    const paymentUrl = `${vnpUrl}?${qs.stringify(params, { encode: false})}` + `&vnp_SecureHash=${secureHash}`;
    return {
        paymentUrl,
        txnRef,
    }
}

const verifyPaymentReturn = (query) => {
    getConfiguration();

    const secureHash = query.vnp_SecureHash;
    if (typeof secureHash !== 'string' || !/^[a-f\d]{128}$/i.test(secureHash)) {
        throw new Error('Chữ ký thanh toán VNPAY không hợp lệ');
    }

    const params = { ...query };
    delete params.vnp_SecureHash;
    delete params.vnp_SecureHashType;

    const signData = qs.stringify(sortObject(params), { encode: false });
    const expectedHash = crypto
        .createHmac('sha512', hashSecret)
        .update(Buffer.from(signData, 'utf-8'))
        .digest('hex');
    const receivedHashBuffer = Buffer.from(secureHash, 'hex');
    const expectedHashBuffer = Buffer.from(expectedHash, 'hex');

    if (
        receivedHashBuffer.length !== expectedHashBuffer.length ||
        !crypto.timingSafeEqual(receivedHashBuffer, expectedHashBuffer)
    ) {
        throw new Error('Chữ ký thanh toán VNPAY không hợp lệ');
    }

    if (query.vnp_TmnCode !== tmnCode) {
        throw new Error('Mã website VNPAY không hợp lệ');
    }
    if (
        typeof query.vnp_TxnRef !== 'string' ||
        !/^\d{2}$/.test(query.vnp_ResponseCode || '') ||
        !/^\d{2}$/.test(query.vnp_TransactionStatus || '')
    ) {
        throw new Error('Thông tin giao dịch VNPAY không hợp lệ');
    }

    const amount = Number(query.vnp_Amount);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
        throw new Error('Số tiền thanh toán VNPAY không hợp lệ');
    }

    return {
        txnRef: query.vnp_TxnRef,
        amount,
        responseCode: query.vnp_ResponseCode,
        transactionStatus: query.vnp_TransactionStatus,
        transactionNo: query.vnp_TransactionNo,
        bankCode: query.vnp_BankCode,
        isSuccess: query.vnp_ResponseCode === '00' && query.vnp_TransactionStatus === '00',
    };
};

const sortObject = (obj) => {
    const sorted = {};

    const keys = Object.keys(obj).sort();

    keys.forEach((key) => {
        sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
    });
    return sorted;
}

module.exports = { createPaymentUrl, verifyPaymentReturn, frontendUrl };