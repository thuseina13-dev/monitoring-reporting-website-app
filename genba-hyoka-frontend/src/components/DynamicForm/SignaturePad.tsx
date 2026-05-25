import React, { forwardRef } from 'react';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';

interface SignaturePadProps {
  onOK: (signature: string) => void;
  defaultValue?: string;
}

export const SignaturePad = forwardRef<SignatureViewRef, SignaturePadProps>(({ onOK }, ref) => {
  return (
    <SignatureScreen
      ref={ref}
      onOK={onOK}
      descriptionText="Tanda Tangan"
      clearText="Hapus"
      confirmText="Simpan"
      webStyle={`.m-signature-pad--footer {display: none; margin: 0;}`}
    />
  );
});

SignaturePad.displayName = 'SignaturePad';

export default SignaturePad;
