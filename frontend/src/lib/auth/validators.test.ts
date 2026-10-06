import { describe, it, expect } from "vitest";
import {
  isFakeOrSpamEmail,
  validateRegisterForm,
  validateLoginForm,
  combineFullName,
  type RegisterFormData,
  type LoginFormData,
} from "./validators";

describe("combineFullName", () => {
  it("combines last name and first name correctly", () => {
    expect(combineFullName("Nguyễn Văn", "An")).toBe("Nguyễn Văn An");
  });

  it("handles extra whitespace gracefully", () => {
    expect(combineFullName("  Trần  ", "  Bình  ")).toBe("Trần Bình");
  });

  it("handles empty first or last name gracefully", () => {
    expect(combineFullName("Lê", "")).toBe("Lê");
    expect(combineFullName("", "Dũng")).toBe("Dũng");
    expect(combineFullName("", "")).toBe("");
  });
});


describe("isFakeOrSpamEmail", () => {
  it("detects spam / fake email prefixes", () => {
    expect(isFakeOrSpamEmail("asdf@gmail.com")).toBe(true);
    expect(isFakeOrSpamEmail("qwerty@gmail.com")).toBe(true);
    expect(isFakeOrSpamEmail("aaaa@gmail.com")).toBe(true);
    expect(isFakeOrSpamEmail("ab@gmail.com")).toBe(true);
  });

  it("accepts valid realistic emails", () => {
    expect(isFakeOrSpamEmail("nam.tran@gmail.com")).toBe(false);
    expect(isFakeOrSpamEmail("contact@tdt-platform.vn")).toBe(false);
  });
});

describe("validateRegisterForm", () => {
  const validData: RegisterFormData = {
    fullName: "Nguyễn Văn A",
    email: "nguyen.vana@gmail.com",
    phone: "0912345678",
    password: "Password123",
    confirmPassword: "Password123",
  };

  it("returns error if fullName is less than 2 characters", () => {
    const errors = validateRegisterForm({ ...validData, fullName: "A" });
    expect(errors).toEqual([
      {
        field: "fullName",
        message: "Vui lòng nhập họ tên đầy đủ (tối thiểu 2 ký tự).",
      },
    ]);
  });

  it("returns error if email has invalid format", () => {
    const errors = validateRegisterForm({ ...validData, email: "invalid-email" });
    expect(errors).toEqual([
      {
        field: "email",
        message: "Email không hợp lệ. Vui lòng nhập đúng định dạng (ví dụ: ten@gmail.com).",
      },
    ]);
  });

  it("returns error if email is spam or fake", () => {
    const errors = validateRegisterForm({ ...validData, email: "asdf@gmail.com" });
    expect(errors).toEqual([
      {
        field: "email",
        message: "Email không hợp lệ hoặc chứa chuỗi ký tự ngẫu nhiên/ảo. Vui lòng sử dụng email chính thức của bạn.",
      },
    ]);
  });

  it("returns error if password is less than 6 characters", () => {
    const errors = validateRegisterForm({ ...validData, password: "123", confirmPassword: "123" });
    expect(errors).toEqual([
      {
        field: "password",
        message: "Mật khẩu phải có độ dài ít nhất 6 ký tự.",
      },
    ]);
  });

  it("returns error if confirmPassword does not match password", () => {
    const errors = validateRegisterForm({ ...validData, confirmPassword: "DifferentPassword123" });
    expect(errors).toEqual([
      {
        field: "confirmPassword",
        message: "Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.",
      },
    ]);
  });

  it("returns empty array for valid registration data", () => {
    const errors = validateRegisterForm(validData);
    expect(errors).toEqual([]);
  });
});

describe("validateLoginForm", () => {
  const validLogin: LoginFormData = {
    email: "user@example.com",
    password: "securepassword",
  };

  it("returns error if email is empty", () => {
    const errors = validateLoginForm({ ...validLogin, email: "" });
    expect(errors.some((err) => err.field === "email")).toBe(true);
  });

  it("returns error if email format is invalid", () => {
    const errors = validateLoginForm({ ...validLogin, email: "invalid-email" });
    expect(errors.some((err) => err.field === "email")).toBe(true);
  });

  it("returns error if password is empty", () => {
    const errors = validateLoginForm({ ...validLogin, password: "" });
    expect(errors.some((err) => err.field === "password")).toBe(true);
  });

  it("returns empty array for valid login data", () => {
    const errors = validateLoginForm(validLogin);
    expect(errors).toEqual([]);
  });
});
