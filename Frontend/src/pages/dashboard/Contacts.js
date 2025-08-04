import React, { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Avatar,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
} from "@mui/material";
import { Plus, Users } from "phosphor-react";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

// تصاویر محلی برای تست
const MembersList = [
  {
    id: "1",
    img: "/avatar1.png", // می‌توانید از پوشه public استفاده کنید
    name: "علی",

  },
  {
    id: "2",
    img: "/avatar2.png",
    name: "زهرا",

  },
  {
    id: "3",
    img: "/avatar3.png",
    name: "رضا",

  },
    {
        id: "4",
        img: "/avatar4.png",
        name: "parham",
    }
];

const ContactElement = ({ img, name, online, id }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleContactClick = () => {
    navigate(`/app/chat/${name}`);
  };

  return (
      <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            width: "93%",
            cursor: "pointer",
            marginLeft: "100px",
            "&:hover": {
              backgroundColor: theme.palette.action.hover,
            },
            p: 1.5,
            borderRadius: 1,
          }}
          onClick={handleContactClick}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar alt={name} src={img} />
          <Typography variant="subtitle2">{name}</Typography>
        </Stack>
        <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              alert(`حذف مخاطب: ${name}`);
            }}
        >
          حذف
        </Button>
      </Stack>
  );
};

const AddContactDialog = ({ open, handleClose }) => {
  return (
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>افزودن مخاطب جدید</DialogTitle>
        <DialogContent>
          <TextField
              autoFocus
              margin="dense"
              label="نام کاربری"
              type="text"
              fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>لغو</Button>
          <Button onClick={handleClose}>افزودن</Button>
        </DialogActions>
      </Dialog>
  );
};

const Contacts = () => {
  const theme = useTheme();
  const [openDialog, setOpenDialog] = useState(false);

  return (
      <>
        <Stack direction="row" sx={{ width: "100%" }}>
          {/* پنل سمت چپ */}
          <Box
              sx={{
                height: "100vh",
                backgroundColor:
                    theme.palette.mode === "light"
                        ? "#F8FAFF"
                        : theme.palette.background.paper,
                width: 320,
                boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
              }}
          >
            <Stack p={3} spacing={2} sx={{ maxHeight: "100vh" }}>
              <Stack alignItems="center" justifyContent="space-between" direction="row">
                <Typography variant="h5">مخاطبان</Typography>
                <IconButton>
                  <Users />
                </IconButton>
              </Stack>

              <Button
                  variant="contained"
                  startIcon={<Plus />}
                  onClick={() => setOpenDialog(true)}
              >
                افزودن مخاطب
              </Button>

              <Divider />

              <Stack spacing={2} sx={{ flexGrow: 1, overflowY: "auto" }}>
                <Typography variant="subtitle2" sx={{ color: "#676767" }}>
                  همه مخاطبان
                </Typography>
                {MembersList.map((el) => (
                    <ContactElement key={el.id} {...el} />
                ))}
              </Stack>
            </Stack>
          </Box>

          {/* پنل سمت راست */}
          <Box
              sx={{
                height: "100%",
                width: "calc(100vw - 320px)",
                backgroundColor:
                    theme.palette.mode === "light"
                        ? "#FFF"
                        : theme.palette.background.default,
              }}
          >
            <Stack
                spacing={2}
                sx={{ height: "100%", width: "100%" }}
                alignItems="center"
                justifyContent="center"
            >
              <Typography variant="h6">یک مخاطب را انتخاب کنید</Typography>
            </Stack>
          </Box>
        </Stack>

        <AddContactDialog
            open={openDialog}
            handleClose={() => setOpenDialog(false)}
        />
      </>
  );
};

export default Contacts;