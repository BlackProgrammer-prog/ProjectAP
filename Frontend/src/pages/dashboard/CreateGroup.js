import {
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    Slide,
    Stack,
    Avatar,
    IconButton,
    Typography,
} from "@mui/material";
import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import FormProvider from "../../components/hook-form/FormProvider";
import { RHFTextField } from "../../components/hook-form";
import { Camera } from 'phosphor-react';
import RHFAutocomplete from "../../components/hook-form/RHFAutocomplete";
// import { TAGS_OPTION } from 'path/to/your/file';
import React from 'react'
import Swal from "sweetalert2";
import { useAuth } from "../../Login/Component/Context/AuthContext";
import webSocketService from "../../Login/Component/Services/WebSocketService";
import { useContacts } from "../../contexts/ContactsContext";


const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});


const CreateGroupForm = ({ onCancel }) => {
    const { token } = useAuth();
    const { contacts } = useContacts();
    const handleBack = () => {
        onCancel && onCancel();
    };

    const NewGroupSchema = Yup.object().shape({
        title: Yup.string().required("Title is required"),
        members: Yup.array().min(0),
        icon: Yup.mixed().nullable(),
    });
    const defaultValues = {
        title: "",
        members: [],
        icon: null,
    };

    const methods = useForm({
        resolver: yupResolver(NewGroupSchema),
        defaultValues,
    });

    const {
        reset,
        watch,
        setValue,
        handleSubmit,
        formState: { isSubmitting, isValid },
    } = methods;

    const onSubmit = async (data) => {
        try {
            if (!token) {
                Swal.fire({ icon: 'error', title: 'وارد نشده‌اید', text: 'ابتدا وارد حساب کاربری شوید.' });
                return;
            }

            const payload = {
                type: 'create_group',
                token,
                name: data?.title?.trim() || 'New Group',
                members: Array.isArray(data?.members) ? data.members.map((m) => (typeof m === 'string' ? m : String(m))).filter(Boolean) : [],
            };

            let resolved = false;
            const off = webSocketService.addGeneralListener((raw) => {
                try {
                    const res = JSON.parse(raw);
                    // Accept either a typed response or a bare success payload
                    const looksLikeCreateGroup = (res && (res.type === 'create_group_response' || (res.status && (res.group_id || res.custom_url))));
                    if (!looksLikeCreateGroup) return;

                    resolved = true;
                    off && off();
                    clearTimeout(timerId);

                    if (res.status === 'success') {
                        Swal.fire({ toast: true, position: 'bottom-start', icon: 'success', title: 'گروه با موفقیت ساخته شد', showConfirmButton: false, timer: 1800, timerProgressBar: true });
                        onCancel && onCancel();
                    } else {
                        Swal.fire({ icon: 'error', title: 'خطا در ساخت گروه', text: res.message || 'لطفا دوباره تلاش کنید.' });
                    }
                } catch {}
            });

            const timerId = setTimeout(() => {
                if (resolved) return;
                off && off();
                Swal.fire({ icon: 'warning', title: 'پاسخی دریافت نشد', text: 'اتصال را بررسی کرده و مجدد تلاش کنید.' });
            }, 10000);

            webSocketService.send(payload);
        } catch (error) {
            console.error(error);
            Swal.fire({ icon: 'error', title: 'خطای غیرمنتظره', text: 'مشکلی پیش آمد. دوباره تلاش کنید.' });
        }
    };

    return (
        <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
                <RHFTextField name="title" label="Title" />
                <RHFAutocomplete
                    name="members"
                    label="Members"
                    multiple
                    freeSolo
                    options={(contacts || []).map((c) => c?.email).filter(Boolean)}
                    filterSelectedOptions
                    ChipProps={{ size: "medium" }}
                />
                {/* Optional group icon upload */}
                <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar src={methods.getValues('icon') ? URL.createObjectURL(methods.getValues('icon')) : undefined} />
                    <IconButton component="label" color="primary">
                        <input hidden accept="image/*" type="file" onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            methods.setValue('icon', file);
                        }} />
                        <Camera />
                    </IconButton>
                    <Typography variant="caption" color="text.secondary">Icon (optional)</Typography>
                </Stack>
                <Stack
                    spacing={2}
                    direction={"row"}
                    alignItems="center"
                    justifyContent={"end"}
                >
                    <Button onClick={handleBack} >Cancel</Button>
                    {/* onClick={handleClose} */}
                    <Button type="submit" variant="contained">
                        Create
                    </Button>
                </Stack>
            </Stack>
        </FormProvider>
    );
};


const CreateGroup = ({ open, handleClose }) => {
    return (
        <Dialog fullWidth maxWidth='xs' open={open} TransitionComponent={Transition} onClose={handleClose}>
            {/* Title */}
            <DialogTitle sx={{ p: 2 }}>
                Create New Group
            </DialogTitle>
            {/* Content */}
            <DialogContent>
                <CreateGroupForm onCancel={handleClose} />
            </DialogContent>
        </Dialog>
    )
}

export default CreateGroup