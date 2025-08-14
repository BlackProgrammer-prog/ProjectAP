import {
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    Slide,
    Stack,
} from "@mui/material";
import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import FormProvider from "../../components/hook-form/FormProvider";
import { RHFTextField } from "../../components/hook-form";
import RHFAutocomplete from "../../components/hook-form/RHFAutocomplete";
// import { TAGS_OPTION } from 'path/to/your/file';
import React from 'react'
import { useNavigate } from 'react-router-dom';


const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});


const CreateGroupForm = ({ handleClose , onClose}) => {
    const navigate = useNavigate()
    const handleBack = () => {
        onClose(); // بستن صفحه تنظیمات
        // navigate(-1); // بازگشت به صفحه قبل در تاریخچه مرورگر
    };

    const NewGroupSchema = Yup.object().shape({
        title: Yup.string().required("Title is required"),

        members: Yup.array().min(2, "Must have at least 2 members"),
    });
    const defaultValues = {
        title: "",

        tags: [],
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
        <Dialog fullWidth maxWidth='xs' open={open} TransitionComponent={Transition} >
            {/* Title */}
            <DialogTitle sx={{ p: 2 }}>
                Create New Group
            </DialogTitle>
            {/* Content */}
            <DialogContent>
                <CreateGroupForm />
            </DialogContent>
        </Dialog>
    )
}

export default CreateGroup