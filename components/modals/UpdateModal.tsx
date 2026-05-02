import { UpdateService } from '@/services/Update.service';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useToast } from '../ToastProvider';

// ✨ 1. Renamed to UpdateModal
export default function UpdateModal() {
  const { showSuccess, showError } = useToast();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [downloadInfo, setDownloadInfo] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check for update on mount
    UpdateService.checkForUpdate().then((updateData) => {
      
      if (updateData) {
        setDownloadInfo(updateData.data);
        setUpdateAvailable(true);
      }
    });
  }, []);

  const handleUpdate = async () => {
    setIsDownloading(true);
    await UpdateService.downloadAndInstall(downloadInfo.downloadUrl);
    // Reset state if they back out of the install prompt
    setIsDownloading(false);
    setUpdateAvailable(false);
  };

  // ✨ 2. If there's no update, render absolutely nothing! This prevents layout shifting.
  if (!updateAvailable) return null;

  // ✨ 3. Return the Modal directly without the extra flex: 1 wrapper
  return (
    <Modal visible={updateAvailable} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Update Available</Text>
          <Text style={styles.notes}>Version: {downloadInfo?.latestVersion}</Text>
          <Text style={styles.notes}>APK Notes: {downloadInfo?.releaseNotes}</Text>
          <Text style={styles.notes}>URL: {downloadInfo?.downloadUrl}</Text>

          

          
          {isDownloading ? (
            <View style={styles.progressContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.progressText}>{Math.round(progress * 100)}% Downloaded</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
              <Text style={styles.buttonText}>Download & Update</Text>
            </TouchableOpacity>
          )}
          
          {/* Optional: Add a Cancel button if forceUpdate is false */}
          {!downloadInfo?.forceUpdate && !isDownloading && (
             <TouchableOpacity onPress={() => setUpdateAvailable(false)}>
               <Text style={styles.cancelText}>cancel</Text>
             </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', padding: 24, borderRadius: 16, width: '80%', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  notes: { fontSize: 14, color: '#666', marginBottom: 24, textAlign: 'center' },
  updateButton: { backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, width: '100%', alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  cancelText: { color: '#666', marginTop: 16, fontSize: 14 },
  progressContainer: { alignItems: 'center', padding: 20 },
  progressText: { marginTop: 12, fontSize: 16, fontWeight: '500' }
});