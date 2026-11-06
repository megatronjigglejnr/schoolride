/**
 * Profile photo (the photo sheet in the prototype), for the parent or a child: take one, pick one, a Memoji on
 * Apple devices, or back to initials (the default). Photos are cropped square and stay on this device.
 */
import * as ImagePicker from 'expo-image-picker';
import { StyleSheet, View } from 'react-native';

import { RowItem, RowList } from '@/components/account/Rows';
import { Avatar } from '@/components/Avatar';
import { Sheet } from '@/components/Sheet';
import { children } from '@/data/children';
import { initialsOf, isAppleDevice } from '@/lib/account';
import { useAccount } from '@/state/AccountContext';
import { useShell } from '@/state/ShellContext';

const options: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.6,
};

export function PhotoSheet() {
  const { sheet, closeSheet, showToast } = useShell();
  const { photoTarget: who, photos, setPhoto, profile } = useAccount();
  const isMe = who === 'me';
  const initials = isMe ? initialsOf(profile.name) : children[who].firstName[0];
  const title = isMe ? 'Profile photo' : `${children[who].firstName}'s photo`;

  const done = (uri: string | null) => {
    setPhoto(who, uri);
    closeSheet();
    setTimeout(() => showToast(uri ? 'Photo updated' : 'Photo removed'), 200);
  };

  const take = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      showToast('Camera access is off. You can turn it on in Settings.');
      return;
    }
    const r = await ImagePicker.launchCameraAsync({ ...options, cameraType: ImagePicker.CameraType.front });
    if (!r.canceled) done(r.assets[0].uri);
  };
  // The system photo picker needs no permission on iOS 14+ and Android 13+.
  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync(options);
    if (!r.canceled) done(r.assets[0].uri);
  };

  return (
    <Sheet open={sheet === 'photo'} title={title} onClose={closeSheet}>
      <View style={styles.preview}>
        <Avatar
          initials={initials}
          uri={photos[who]}
          size={88}
          tone={!isMe && children[who].avatar === 'muted' ? 'muted' : 'ink'}
        />
      </View>
      <RowList style={styles.list}>
        <RowItem icon="camera" label="Take a photo" onPress={take} />
        <RowItem icon="image" label="Choose from library" onPress={pick} last={!isAppleDevice() && !photos[who]} />
        {isAppleDevice() && (
          <RowItem
            icon="smile"
            label="Use a Memoji"
            sub="Pick one you've saved to Photos"
            onPress={pick}
            last={!photos[who]}
          />
        )}
        {!!photos[who] && <RowItem icon="close" label="Remove photo, use initials" onPress={() => done(null)} last />}
      </RowList>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  preview: { alignItems: 'center', marginTop: 2, marginBottom: 16 },
  list: { marginBottom: 0, boxShadow: 'none' },
});
