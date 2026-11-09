export function errorMessage(error: unknown): string {
  const code = String((error as { code?: string })?.code ?? '').toLowerCase();
  const messages: Record<string, string> = {
    'auth/invalid-credential':
      'Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.',
    'auth/invalid-login-credentials':
      'Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.',
    'auth/user-not-found':
      'Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.',
    'auth/wrong-password':
      'Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.',
    'auth/email-already-in-use':
      'Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.',
    'auth/invalid-email': 'Địa chỉ email chưa đúng định dạng.',
    'auth/weak-password': 'Mật khẩu cần ít nhất 6 ký tự.',
    'auth/too-many-requests':
      'Bạn đã thử quá nhiều lần. Vui lòng đợi một lát rồi thử lại.',
    'auth/network-request-failed':
      'Không thể kết nối. Hãy kiểm tra Internet rồi thử lại.',
    'auth/operation-not-allowed':
      'Đăng nhập Email/Password chưa được bật trên Firebase.',
    'auth/user-disabled': 'Tài khoản này đã bị vô hiệu hóa.',
    'auth/invalid-api-key': 'Cấu hình kết nối Firebase chưa hợp lệ.',
    permission_denied:
      'Chưa có quyền truy cập dữ liệu. Hãy kiểm tra Rules của Realtime Database.',
    'database/permission-denied':
      'Chưa có quyền truy cập dữ liệu. Hãy kiểm tra Rules của Realtime Database.',
  };
  if (messages[code]) {
    return messages[code];
  }
  if (error instanceof Error && !code) {
    return error.message;
  }
  return 'Thao tác chưa thành công. Vui lòng thử lại.';
}
