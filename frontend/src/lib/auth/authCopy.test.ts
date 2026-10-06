import { describe, it, expect } from "vitest";
import { AUTH_COPY } from "./authCopy";

describe("AUTH_COPY configuration", () => {
  it("provides correct Vietnamese copy for login variant", () => {
    expect(AUTH_COPY.login.formTitle).toBe("Chào mừng trở lại.");
    expect(AUTH_COPY.login.eyebrow).toBe("TỔNG KHO VẬT TƯ CƠ ĐIỆN & VLXD TDT");
    expect(AUTH_COPY.login.submitButtonText).toBe("Đăng nhập");
  });

  it("provides correct Vietnamese copy for register variant", () => {
    expect(AUTH_COPY.register.formTitle).toBe("Tạo tài khoản mới.");
    expect(AUTH_COPY.register.eyebrow).toBe("HỆ THỐNG QUẢN LÝ VẬT LIỆU XÂY DỰNG");
    expect(AUTH_COPY.register.submitButtonText).toBe("Tạo tài khoản");
  });
});
