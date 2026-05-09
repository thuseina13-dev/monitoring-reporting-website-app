import axiosClient from './axiosClient';
import { Platform } from 'react-native';

export const storageService = {
  upload: async (fileUri: string, modelName: string, isPublic: boolean = false) => {
    const formData = new FormData();
    
    // Check if we are in a browser or native environment
    if (Platform.OS === 'web') {
      // For web, we might need to fetch the blob if fileUri is a blob URL
      const response = await fetch(fileUri);
      const blob = await response.blob();
      formData.append('file', blob, 'upload.jpg');
    } else {
      // For native, we use the URI
      const uriParts = fileUri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      formData.append('file', {
        uri: fileUri,
        name: `upload.${fileType}`,
        type: `image/${fileType}`, // Default to image, though backend handles others
      } as any);
    }
    
    formData.append('model_name', modelName);
    formData.append('is_public', String(isPublic));

    const response = await axiosClient.post('/v1/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};
