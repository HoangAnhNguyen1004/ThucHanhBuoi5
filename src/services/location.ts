import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';

export async function getCurrentLocation(): Promise<{
  latitude: number;
  longitude: number;
}> {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ]);
    if (
      result['android.permission.ACCESS_FINE_LOCATION'] !==
        PermissionsAndroid.RESULTS.GRANTED &&
      result['android.permission.ACCESS_COARSE_LOCATION'] !==
        PermissionsAndroid.RESULTS.GRANTED
    ) {
      throw new Error(
        'Bạn chưa cấp quyền vị trí. Hãy bật quyền Vị trí trong cài đặt ứng dụng rồi thử lại.',
      );
    }
    Geolocation.setRNConfiguration({
      skipPermissionRequests: true,
      locationProvider: 'android',
    });
  } else {
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
    });
  }
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      error =>
        reject(
          new Error(
            error.code === 1
              ? 'Bạn chưa cấp quyền vị trí. Hãy bật quyền trong Cài đặt rồi thử lại.'
              : error.code === 3
              ? 'Lấy vị trí quá lâu. Hãy kiểm tra GPS hoặc đặt vị trí cho máy ảo rồi thử lại.'
              : 'Chưa lấy được vị trí. Hãy bật GPS rồi thử lại.',
          ),
        ),
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 30000 },
    );
  });
}
