import React, { useRef, useState, useCallback, useEffect } from 'react';
import './WebCamera.css';
import { View, Platform } from 'react-native';
import { YStack, XStack, Button, Text } from 'tamagui';
import { Camera, X, Check, RefreshCw } from '@tamagui/lucide-icons';
import { COLORS } from '../../constants/theme';

interface WebCameraProps {
  onCapture: (dataUri: string) => void;
  onCancel: () => void;
}

export const WebCamera: React.FC<WebCameraProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isCaptured, setIsCaptured] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string>('');

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = mediaStream;
      setIsCaptured(false);
      setCapturedImage('');
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError("Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      // Cleanup stream when unmounting
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]); // Run only once on mount

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!video.videoWidth || !video.videoHeight) {
        console.error("Video dimensions are not available yet.");
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUri = canvas.toDataURL('image/jpeg', 0.9);
          setCapturedImage(dataUri);
          setIsCaptured(true);
        } catch (err) {
          console.error("Failed to capture image:", err);
        }
      }
    }
  };

  const handleRetake = () => {
    setIsCaptured(false);
    setCapturedImage('');
  };

  const handleConfirm = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onCapture(capturedImage);
  };

  const handleCancelClick = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onCancel();
  };

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <YStack 
      position="absolute" 
      top={0} left={0} right={0} bottom={0} 
      backgroundColor="#000" 
      zIndex={10000} 
      justifyContent="center" 
      alignItems="center"
    >
      {error ? (
        <YStack ai="center" gap="$4" padding="$4">
          <Text color={COLORS.danger} textAlign="center" fontSize={16}>{error}</Text>
          <Button onPress={handleCancelClick} theme="alt1">Kembali</Button>
        </YStack>
      ) : (
        <YStack flex={1} width="100%" maxWidth={800} position="relative">
          <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', display: isCaptured ? 'none' : 'flex' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="web-camera-video"
            />
          </View>
          
          {isCaptured && (
            <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', display: 'flex' }}>
              <img 
                src={capturedImage} 
                alt="Captured" 
                className="web-camera-preview" 
              />
            </View>
          )}

          {/* Hidden Canvas for processing */}
          <canvas ref={canvasRef} className="web-camera-hidden-canvas" />

          {/* Controls Overlay */}
          <XStack 
            position="absolute" 
            bottom={0} left={0} right={0} 
            padding="$6" 
            backgroundColor="rgba(0,0,0,0.5)" 
            justifyContent="space-around" 
            alignItems="center"
          >
            <Button circular size="$5" theme="alt1" icon={X} onPress={handleCancelClick} />
            
            {!isCaptured ? (
              <Button 
                circular 
                size="$7" 
                backgroundColor={COLORS.primary} 
                icon={<Camera size={32} color="white" />} 
                onPress={handleCapture} 
              />
            ) : (
              <XStack gap="$4">
                <Button circular size="$6" theme="active" icon={RefreshCw} onPress={handleRetake} />
                <Button circular size="$6" backgroundColor={COLORS.success} icon={Check} onPress={handleConfirm} />
              </XStack>
            )}
            
            <View style={{ width: 50 }} /> {/* Spacer to balance the X button */}
          </XStack>
        </YStack>
      )}
    </YStack>
  );
};
