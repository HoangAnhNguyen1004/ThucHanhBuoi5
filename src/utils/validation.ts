export type AuthFields = {
  displayName?: string;
  email: string;
  password: string;
  confirmPassword?: string;
};
export type AuthErrors = Partial<Record<keyof AuthFields, string>>;

export function validateAuth(
  fields: AuthFields,
  registration = false,
): AuthErrors {
  const errors: AuthErrors = {};
  if (registration && !(fields.displayName ?? '').trim()) {
    errors.displayName = 'Vui lòng nhập họ và tên.';
  }
  if (registration && (fields.displayName ?? '').trim().length > 80) {
    errors.displayName = 'Họ tên không được quá 80 ký tự.';
  }
  if (!fields.email.trim()) {
    errors.email = 'Vui lòng nhập email.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
    errors.email = 'Địa chỉ email chưa đúng định dạng.';
  }
  if (!fields.password) {
    errors.password = 'Vui lòng nhập mật khẩu.';
  } else if (fields.password.length < 6) {
    errors.password = 'Mật khẩu cần ít nhất 6 ký tự.';
  }
  if (registration && fields.confirmPassword !== fields.password) {
    errors.confirmPassword = 'Mật khẩu nhập lại chưa khớp.';
  }
  return errors;
}
