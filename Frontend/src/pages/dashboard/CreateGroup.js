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
import { useNavigate } from 'react-router-dom';


const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});


const CreateGroupForm = ({ onCancel }) => {
    const navigate = useNavigate()
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
            //  API Call
            console.log("DATA", data);
            onCancel && onCancel();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <FormProvider methods={methods} >
            {/* onSubmit={handleSubmit(onSubmit)} */}
            <Stack spacing={3}>
                <RHFTextField name="title" label="Title" />
                <RHFAutocomplete
                    name="members"
                    label="Members"
                    multiple
                    freeSolo
                    // options={TAGS_OPTION.map((option) => option)}
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