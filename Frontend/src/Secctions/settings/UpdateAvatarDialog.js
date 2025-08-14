import React, { useState, useCallback, useRef } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Stack, Typography, Box, Tabs, Tab, IconButton
} from '@mui/material';
import { Camera, UploadSimple, X } from 'phosphor-react';
import { useDropzone } from 'react-dropzone';
import Webcam from 'react-webcam';
import { useAuth } from '../../Login/Component/Context/AuthContext';

const UpdateAvatarDialog = ({ open, handleClose }) => {
    const { updateAvatar } = useAuth(); // The new function from context
    const [tab, setTab] = useState(0); // 0 for Upload, 1 for Webcam
    const [imageFile, setImageFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const webcamRef = useRef(null);

    const onDrop = useCallback(acceptedFiles => {
        const file = acceptedFiles[0];
        if (file) {
            setImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setPreview(previewUrl);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.png', '.jpg'] },
        multiple: false,
    });

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
            fetch(imageSrc)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], "webcam-photo.jpg", { type: "image/jpeg" });
                    setImageFile(file);
                    setPreview(imageSrc);
                });
        }
    }, [webcamRef]);

    const handleTabChange = (event, newValue) => {
        setTab(newValue);
        // Clear previous selections when changing tabs
        setImageFile(null);
        setPreview(null);
    };

    const handleSave = () => {
        if (imageFile) {
            updateAvatar(imageFile);
            handleDialogClose();
        } else {
            alert("لطفا یک تصویر را انتخاب یا ثبت کنید.");
        }
    };
    
    const handleDialogClose = () => {
        setImageFile(null);
        setPreview(null);
        setTab(0);
        handleClose();
    };

    return (
        <Dialog open={open} onClose={handleDialogClose} fullWidth maxWidth="sm">
            <DialogTitle>تغییر تصویر پروفایل</DialogTitle>
            <DialogContent>
                <Tabs value={tab} onChange={handleTabChange} centered>
                    <Tab label="آپلود تصویر" icon={<UploadSimple />} />
                    <Tab label="استفاده از وب‌کم" icon={<Camera />} />
                </Tabs>
                <Box sx={{ mt: 3, p: 2, border: '1px dashed grey', borderRadius: 2 }}>
                    {tab === 0 && (
                        <div {...getRootProps()} style={{ textAlign: 'center', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <input {...getInputProps()} />
                            {preview ? (
                                <img src={preview} alt="Preview" style={{ maxHeight: '100%', maxWidth: '100%', height: 200 }} />
                            ) : (
                                <p>{isDragActive ? 'تصویر را اینجا رها کنید...' : 'تصویر خود را اینجا بکشید یا برای انتخاب کلیک کنید'}</p>
                            )}
                        </div>
                    )}
                    {tab === 1 && (
                        <Stack alignItems="center" spacing={2}>
                             {preview ? (
                                <img src={preview} alt="Preview" style={{ maxHeight: '100%', maxWidth: '100%', height: 200 }} />
                            ) : (
                                <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" width="100%" />
                            )}
                            <Button variant="outlined" onClick={preview ? () => setPreview(null) : capture}>
                                {preview ? 'گرفتن عکس جدید' : 'ثبت عکس'}
                            </Button>
                        </Stack>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleDialogClose}>انصراف</Button>
                <Button variant="contained" onClick={handleSave} disabled={!preview}>ذخیره تغییرات</Button>
            </DialogActions>
        </Dialog>
    );
};

export default UpdateAvatarDialog;
