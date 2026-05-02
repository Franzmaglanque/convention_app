// ✨ 1. Import everything but alias it to "ExpoFileSystem" to prevent TS clashes!
import Constants from 'expo-constants';
// import * as FileSystem from 'expo-file-system';
// import { File, Paths } from 'expo-file-system';
// import * as IntentLauncher from 'expo-intent-launcher';
// import { Alert, Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';

// ✨ NEW: Import the legacy API specifically for the URI conversion
import * as LegacyFileSystem from 'expo-file-system/legacy';

import * as IntentLauncher from 'expo-intent-launcher';
import { Alert, Platform } from 'react-native';

export class UpdateService {
  static async checkForUpdate() {
    if (Platform.OS !== 'android') return false; 

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/app-version`);
      const data = await response.json();
      console.log('data', data);
      console.log('url', `${process.env.EXPO_PUBLIC_API_URL}/api/app-version`);

      
      const currentVersion = Constants.expoConfig?.version || '1.0.0';
      console.log('currentVersion', currentVersion);

      if (data.version !== currentVersion) {
        return data; 
      }
      return null; 
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return null;
    }
  }

  // static async downloadAndInstall(downloadUrl: string, onProgress?: (progress: number) => void) {
  //   try {
  //       // ✨ 2. Use the alias for documentDirectory
  //       if (!ExpoFileSystem.documentDirectory) {
  //           throw new Error("File system is not available on this device.");
  //       }

  //       const fileUri = `${ExpoFileSystem.documentDirectory}update.apk`;

  //       // ✨ 3. Use the alias to create the resumable download
  //       const downloadResumable = ExpoFileSystem.createDownloadResumable(
  //           downloadUrl,
  //           fileUri,
  //           {},
  //           (downloadProgress: any) => {
  //               const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
  //               if (onProgress) onProgress(progress);
  //           }
  //       );

  //       const result = await downloadResumable.downloadAsync();
        
  //       if (result?.uri) {
  //           // ✨ 4. Use the alias to get the Content URI
  //           const contentUri = await ExpoFileSystem.getContentUriAsync(result.uri);

  //           await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
  //               data: contentUri,
  //               flags: 1, 
  //               type: 'application/vnd.android.package-archive',
  //           });
  //       }
  //   } catch (error) {
  //     console.error('Update failed:', error);
  //     Alert.alert('Update Failed', 'Could not download the update. Please try again later.');
  //   }
  // }


//   static async downloadAndInstall(downloadUrl: string) {
//     try {


//         console.log('Paths.document',Paths.document);
//         console.log('downloadUrl',downloadUrl);

//         // 1. Use the new Paths object to reference the document directory
//         // 2. Instantiate a modern File object
//         const updateFile = new File(Paths.document, 'update.apk');

//         // 3. Download directly to the file instance
//         await File.downloadFileAsync(downloadUrl,updateFile); 

//         // 4. Trigger the Android Package Installer
//         await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
//             // Note: Depending on your Android target, you may still need a content:// URI here
//             data: updateFile.uri, 
//             flags: 1, 
//             type: 'application/vnd.android.package-archive',
//         });
        
//     } catch (error) {
//       console.error('Update failed:', error);
//       Alert.alert('Update Failed', 'Could not download the update. Please try again later.');
//     }
//   }
// }

  // static async downloadAndInstall(downloadUrl: string) {
  //   try {
  //       console.log('Paths.document', Paths.document);
  //       console.log('downloadUrl', downloadUrl);

  //       // 1. Create the File reference
  //       const updateFile = new File(Paths.document, 'update.apk');

  //       // ✨ THE FIX: Check if the file exists and delete it if it does
  //       if (updateFile.exists) {
  //           console.log('Old update file found, deleting...');
  //           await updateFile.delete();
  //       }

  //       // 2. Download now that the path is clear
  //       console.log('Starting download...');
  //       await File.downloadFileAsync(downloadUrl, updateFile); 

  //       // 3. Trigger the Android Package Installer
  //       // NOTE: We use getContentUriAsync to ensure Android has permission to read the file
  //       const contentUri = await FileSystem.getContentUriAsync(updateFile.uri);

  //       await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
  //           data: contentUri, 
  //           flags: 1, 
  //           type: 'application/vnd.android.package-archive',
  //       });
        
  //   } catch (error) {
  //     console.error('Update failed:', error);
  //     Alert.alert('Update Failed', 'Could not download the update. Please try again later.');
  //   }
  // }


  static async downloadAndInstall(downloadUrl: string) {
    try {
        const updateFile = new File(Paths.document, 'update.apk');

        if (updateFile.exists) {
            updateFile.delete(); 
        }

        console.log('Starting download...');
        await File.downloadFileAsync(downloadUrl, updateFile); 

        // ✨ THE FIX: Use the legacy API just to convert the URI
        const contentUri = await LegacyFileSystem.getContentUriAsync(updateFile.uri);

        console.log('Successfully converted to Content URI:', contentUri);

        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri, 
            flags: 1, 
            type: 'application/vnd.android.package-archive',
        });
        
    } catch (error) {
      console.error('Update failed:', error);
      Alert.alert('Update Failed', 'Could not download or install the update.');
    }
  }

}