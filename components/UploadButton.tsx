'use client';

import { useState, useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface UploadButtonProps {
    onUploadComplete: () => void;
}

import { useAuthenticator } from '@aws-amplify/ui-react';

export default function UploadButton({ onUploadComplete }: UploadButtonProps) {
    const { authStatus } = useAuthenticator(context => [context.authStatus]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                onUploadComplete();
            } else {
                console.error('Upload failed');
                alert('Upload failed. Please try again.');
            }
        } catch (error) {
            console.error('Error uploading:', error);
            alert('An error occurred during upload.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    if (authStatus !== 'authenticated') return null;

    return (
        <div>
            <input
                type="file"
                accept=".txt"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isUploading ? (
                    <Loader2 className="animate-spin" size={20} />
                ) : (
                    <Upload size={20} />
                )}
                {isUploading ? 'Processing...' : 'Import Clippings'}
            </motion.button>
        </div>
    );
}
