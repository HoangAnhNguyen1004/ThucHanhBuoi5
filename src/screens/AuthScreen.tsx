import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  Mail,
  MessageCircle,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParams } from '../types';
import { colors, layout, typography } from '../theme';
import FormInput from '../components/common/FormInput';
import AppButton from '../components/common/AppButton';
import ErrorView from '../components/common/ErrorView';
import { loginAccount, registerAccount } from '../services/auth';
import { errorMessage } from '../services/errors';
import {
  validateAuth,
  type AuthErrors,
  type AuthFields,
} from '../utils/validation';

export default function AuthScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParams, 'Login' | 'Register'>) {
  const registration = route.name === 'Register';
  const [fields, setFields] = useState<AuthFields>({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<AuthErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const change = (field: keyof AuthFields, value: string) => {
    const next = { ...fields, [field]: value };
    setFields(next);
    setError('');
    if (submitted) {
      setErrors(validateAuth(next, registration));
    }
  };
  const submit = async () => {
    setSubmitted(true);
    const validation = validateAuth(fields, registration);
    setErrors(validation);
    if (Object.keys(validation).length || busy) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (registration) {
        await registerAccount(
          fields.displayName!,
          fields.email,
          fields.password,
        );
      } else {
        await loginAccount(fields.email, fields.password);
      }
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  };
  return (
    <SafeAreaView style={layout.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <View style={styles.topRow}>
            {registration ? (
              <Pressable
                accessibilityLabel="Quay lại đăng nhập"
                onPress={() => navigation.goBack()}
                style={styles.back}
              >
                <ArrowLeft size={23} color={colors.primary} />
              </Pressable>
            ) : (
              <View />
            )}
            <Text style={styles.brand}>
              HELLO CHAT<Text style={styles.brandDot}> ●</Text>
            </Text>
          </View>
          <View style={[styles.hero, registration && styles.smallHero]}>
            <View style={styles.logo}>
              <MessageCircle size={42} color="white" strokeWidth={1.8} />
              <View style={styles.logoDot} />
            </View>
            <Text style={styles.eyebrow}>
              {registration
                ? 'THÊM MỘT NGƯỜI BẠN MỚI'
                : 'MỖI CUỘC TRÒ CHUYỆN, MỘT KẾT NỐI'}
            </Text>
            <Text style={typography.largeTitle}>
              {registration ? 'Tạo tài khoản' : 'Chào bạn trở lại.'}
            </Text>
            <Text style={[typography.subhead, styles.heroDescription]}>
              {registration
                ? 'Một bước nhỏ để bắt đầu những cuộc trò chuyện.'
                : 'Đăng nhập để tiếp tục câu chuyện\ncùng những người bạn yêu quý.'}
            </Text>
          </View>
          <View style={styles.form}>
            {registration && (
              <FormInput
                label="Họ và tên"
                icon={UserRound}
                placeholder="Nguyễn Hoàng Anh"
                value={fields.displayName}
                onChangeText={value => change('displayName', value)}
                error={errors.displayName}
                autoCapitalize="words"
                textContentType="name"
                maxLength={80}
                editable={!busy}
              />
            )}
            <FormInput
              label="Email"
              icon={Mail}
              placeholder="ban@example.com"
              value={fields.email}
              onChangeText={value => change('email', value)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              editable={!busy}
            />
            <FormInput
              label="Mật khẩu"
              icon={LockKeyhole}
              placeholder={
                registration ? 'Ít nhất 6 ký tự' : 'Nhập mật khẩu của bạn'
              }
              value={fields.password}
              onChangeText={value => change('password', value)}
              error={errors.password}
              secureTextEntry
              autoCapitalize="none"
              textContentType={registration ? 'newPassword' : 'password'}
              editable={!busy}
            />
            {registration && (
              <FormInput
                label="Nhập lại mật khẩu"
                icon={ShieldCheck}
                placeholder="Nhập lại mật khẩu"
                value={fields.confirmPassword}
                onChangeText={value => change('confirmPassword', value)}
                error={errors.confirmPassword}
                secureTextEntry
                autoCapitalize="none"
                textContentType="newPassword"
                editable={!busy}
              />
            )}
            {!!error && <ErrorView message={error} onRetry={submit} compact />}
            <AppButton
              title={registration ? 'Tạo tài khoản' : 'Đăng nhập'}
              onPress={submit}
              loading={busy}
              style={styles.submit}
            />
          </View>
          <Pressable
            disabled={busy}
            onPress={() =>
              registration
                ? navigation.goBack()
                : navigation.navigate('Register')
            }
            style={styles.switch}
            accessibilityRole="button"
          >
            <Text style={typography.subhead}>
              {registration ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
              <Text style={styles.link}>
                {registration ? 'Đăng nhập' : 'Đăng ký ngay'}
              </Text>
            </Text>
            <ArrowRight size={15} color={colors.primary} />
          </Pressable>
          <View style={styles.footer}>
            <View style={styles.footerLine} />
            <Text style={styles.footerText}>
              KẾT NỐI THẬT. CÂU CHUYỆN THẬT.
            </Text>
            <View style={styles.footerLine} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: 26, paddingBottom: 28 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  brand: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  brandDot: { color: colors.primary },
  back: { padding: 5 },
  hero: { alignItems: 'center', paddingTop: 40, paddingBottom: 35, gap: 12 },
  smallHero: { paddingTop: 12, paddingBottom: 24 },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    transform: [{ rotate: '-6deg' }],
  },
  logoDot: {
    position: 'absolute',
    right: -3,
    top: -3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.green,
    borderWidth: 4,
    borderColor: colors.background,
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 1.6,
    color: colors.secondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  heroDescription: { textAlign: 'center', lineHeight: 22 },
  form: { gap: 17 },
  submit: { marginTop: 8, minHeight: 54 },
  switch: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 25,
    gap: 5,
  },
  link: { color: colors.primary, fontWeight: '600' },
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerText: { fontSize: 8, color: colors.muted, letterSpacing: 1.4 },
  footerLine: { height: 1, backgroundColor: colors.border, flex: 1 },
});
