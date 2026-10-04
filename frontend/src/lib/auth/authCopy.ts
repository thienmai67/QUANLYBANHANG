export interface AuthVariantCopy {
  eyebrow: string;
  headlineLine1: string;
  headlineLine2: string;
  badge: string;
  imageAlt: string;
  topLinkText: string;
  topLinkHref: string;
  formTitle: string;
  formSubtitle: string;
  submitButtonText: string;
  footerPrompt: string;
  footerActionText: string;
  footerActionHref: string;
  termsNotice?: string;
  forgotPasswordText?: string;
}

export const AUTH_COPY: Record<"login" | "register", AuthVariantCopy> = {
  login: {
    eyebrow: "TỔNG KHO VẬT TƯ ĐIỆN NƯỚC M&E CHÍNH HÃNG",
    headlineLine1: "Quản lý vật tư",
    headlineLine2: "chuẩn nhà thầu",
    badge: "Chiết khấu đại lý đến 22%",
    imageAlt: "Vật tư điện nước M&E chính hãng tại kho TDT Platform",
    topLinkText: "Đăng ký",
    topLinkHref: "/register",
    formTitle: "Đăng nhập",
    formSubtitle: "Truy cập báo giá, BOM và đơn hàng của bạn.",
    submitButtonText: "Đăng nhập",
    footerPrompt: "Chưa có tài khoản?",
    footerActionText: "Đăng ký ngay",
    footerActionHref: "/register",
    forgotPasswordText: "Quên mật khẩu?",
  },
  register: {
    eyebrow: "BÓC TÁCH BOM TỰ ĐỘNG CHO NHÀ THẦU CƠ ĐIỆN",
    headlineLine1: "Tính khối lượng",
    headlineLine2: "trong 60 giây",
    badge: "2.400+ đơn vị quy đổi sẵn",
    imageAlt: "Bóc tách khối lượng BOM vật tư tự động cho nhà thầu",
    topLinkText: "Đăng nhập",
    topLinkHref: "/login",
    formTitle: "Tạo tài khoản",
    formSubtitle: "Đăng ký miễn phí, dùng thử BOM Estimator 14 ngày.",
    submitButtonText: "Tạo tài khoản",
    footerPrompt: "Đã có tài khoản?",
    footerActionText: "Đăng nhập",
    footerActionHref: "/login",
    termsNotice:
      "Bằng việc tạo tài khoản, bạn đồng ý với Điều khoản sử dụng và Chính sách bảo mật.",
  },
};
