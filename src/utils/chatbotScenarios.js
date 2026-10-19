const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const scenarios = [
  {
    name: "greeting",
    keywords: ["xin chao", "chao", "hello", "hi", "alo"],
    reply:
      "Xin chào 👋 Mình là trợ lý mua sắm của FastCare. Bạn đang muốn tìm điện thoại, laptop hay phụ kiện nào không?"
  },

  {
    name: "thanks",
    keywords: ["cam on", "thanks", "thank you", "cảm ơn"],
    reply:
      "Không có gì nha 😄 Nếu cần tìm sản phẩm hoặc tư vấn mua hàng, cứ hỏi mình nhé!"
  },

  {
    name: "payment",
    keywords: ["thanh toan", "tra tien", "phuong thuc thanh toan", "payment"],
    reply:
      "FastCare hỗ trợ các phương thức thanh toán được cung cấp tại bước đặt hàng. Bạn có thể kiểm tra phương thức thanh toán khi tiến hành đặt hàng."
  },

  {
    name: "shipping",
    keywords: ["giao hang", "van chuyen", "ship", "phi ship", "thoi gian giao"],
    reply:
      "FastCare hỗ trợ giao hàng đến địa chỉ của khách hàng. Phí và thời gian giao hàng sẽ được xác định dựa trên thông tin đơn hàng và địa chỉ nhận hàng."
  },

  {
    name: "return",
    keywords: ["doi hang", "tra hang", "hoan hang", "doi tra", "tra san pham"],
    reply:
      "Nếu sản phẩm cần đổi hoặc trả, bạn có thể gửi yêu cầu từ đơn hàng của mình. FastCare sẽ tiếp nhận và xử lý yêu cầu theo quy trình của cửa hàng."
  },

  {
    name: "contact",
    keywords: ["lien he", "hotline", "so dien thoai", "dia chi cua hang", "email", "contact"],
    reply:
      "Bạn có thể liên hệ FastCare thông qua thông tin liên hệ được hiển thị trên website để được hỗ trợ nhé."
  }
];

const findScenario = (message) => {
  const text = normalizeText(message);

  return scenarios.find((scenario) =>
    scenario.keywords.some((keyword) => text.includes(normalizeText(keyword)))
  );
};

module.exports = {
  findScenario,
};