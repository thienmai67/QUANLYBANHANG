export interface ValidationError {
  field: string;
  message: string;
}

export interface RegisterFormData {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Spam / fake email pattern detector
export function isFakeOrSpamEmail(email: string): boolean {
  const prefix = email.split("@")[0].toLowerCase();

  // Keyboard spam patterns (e.g. sdasdasd, asdfgh, qwerty, zxcvbn)
  const spamRegex =
    /^(sdasdasd|asdf|qwerty|zxcvbn|123456|test123|abcxyz|dfgdfg|hjkl|aaaaa|bbbbb|ccccc)+$/i;
  if (spamRegex.test(prefix)) return true;

  // Repeated same character 4+ times (e.g. aaaa@gmail.com)
  if (/(.)\1{3,}/.test(prefix)) return true;

  // Less than 3 chars prefix
  if (prefix.length < 3) return true;

  return false;
}

export function validateRegisterForm(data: RegisterFormData): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. Full name validation
  if (!data.fullName?.trim() || data.fullName.trim().length < 2) {
    errors.push({
      field: "fullName",
      message: "Vui lòng nhập họ tên đầy đủ (tối thiểu 2 ký tự).",
    });
    return errors;
  }

  // 2. Email format validation
  if (!EMAIL_REGEX.test(data.email?.trim() || "")) {
    errors.push({
      field: "email",
      message: "Email không hợp lệ. Vui lòng nhập đúng định dạng (ví dụ: ten@gmail.com).",
    });
    return errors;
  }

  // 3. Spam / fake email check
  if (isFakeOrSpamEmail(data.email.trim())) {
    errors.push({
      field: "email",
      message:
        "Email không hợp lệ hoặc chứa chuỗi ký tự ngẫu nhiên/ảo. Vui lòng sử dụng email chính thức của bạn.",
    });
    return errors;
  }

  // 4. Password length validation
  if (!data.password || data.password.length < 6) {
    errors.push({
      field: "password",
      message: "Mật khẩu phải có độ dài ít nhất 6 ký tự.",
    });
    return errors;
  }

  // 5. Password confirmation match
  if (data.password !== data.confirmPassword) {
    errors.push({
      field: "confirmPassword",
      message: "Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.",
    });
    return errors;
  }

  return errors;
}

export function validateLoginForm(data: LoginFormData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.email?.trim()) {
    errors.push({
      field: "email",
      message: "Vui lòng nhập email hoặc tên đăng nhập.",
    });
  } else if (!EMAIL_REGEX.test(data.email.trim())) {
    errors.push({
      field: "email",
      message: "Email không hợp lệ. Vui lòng nhập đúng định dạng (ví dụ: ten@gmail.com).",
    });
  }

  if (!data.password) {
    errors.push({
      field: "password",
      message: "Vui lòng nhập mật khẩu.",
    });
  }

  return errors;
}
