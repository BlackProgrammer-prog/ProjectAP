import React from "react";
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
import {
  CircleDashed,
  MagnifyingGlass,
  Plus,
  Users,
} from "phosphor-react";
import { useTheme } from "@mui/material/styles";
import { SimpleBarStyle } from "../../components/Scrollbar";
import { faker } from "@faker-js/faker";
import { useNavigate } from "react-router-dom";

// Mock data for contacts
const MembersList = [
  {
    id: faker.string.uuid(),
    img: faker.image.avatar(),
    name: faker.person.firstName(),
    online: true,
  },
  {
    id: faker.string.uuid(),
    img: faker.image.avatar(),
    name: faker.person.firstName(),
    online: false,
  },
  {
    id: faker.string.uuid(),
    img: faker.image.avatar(),
    name: faker.person.firstName(),
    online: true,
  },
  {
    id: faker.string.uuid(),
    img: faker.image.avatar(),
    name: faker.person.firstName(),
    online: false,
  },
  {
    id: faker.string.uuid(),
    img: faker.image.avatar(),
    name: faker.person.firstName(),
    online: true,
  },
];

const ContactElement = ({ img, name, online, id }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleContactClick = () => {
    // Navigate to the chat page for this contact
    navigate(`/app/chat/${name}`);
  };

  return (
    <Stack
      direction="row"
      alignItems={"center"}
      justifyContent="space-between"
      sx={{
        width: "100%",
        cursor: "pointer",
        "&:hover": {
          backgroundColor: theme.palette.action.hover,
        },
        p: 1.5,
        borderRadius: 1,
      }}
      onClick={handleContactClick}
    >
      <Stack direction="row" alignItems={"center"} spacing={2}>
        <Avatar alt={name} src={img} />
        <Stack spacing={0.5}>
          <Typography variant="subtitle2">{name}</Typography>
        </Stack>
      </Stack>
      <Stack direction={"row"} spacing={2} alignItems={"center"}>
        <Button
          variant="outlined"
          color="error"
          onClick={(e) => {
            e.stopPropagation(); // Prevent navigation
            alert(`Removing contact: ${name}`);
          }}
        >
          Remove
        </Button>
      </Stack>
    </Stack>
  );
};

const AddContactDialog = ({ open, handleClose }) => {
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">Add New Contact</DialogTitle>
      <DialogContent>
        <DialogContentText>
          To add a contact, please enter their username here.
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          label="Username"
          type="text"
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleClose} color="primary">
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const Contacts = () => {
  const theme = useTheme();
  const [openDialog, setOpenDialog] = React.useState(false);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  return (
    <>
      <Stack direction="row" sx={{ width: "100%" }}>
        {/* Left Panel */}
        <Box
          sx={{
            height: "100vh",
            backgroundColor: (theme) =>
              theme.palette.mode === "light"
                ? "#F8FAFF"
                : theme.palette.background.paper,
            width: 320,
            boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
          }}
        >
          <Stack p={3} spacing={2} sx={{ maxHeight: "100vh" }}>
            <Stack
              alignItems={"center"}
              justifyContent="space-between"
              direction="row"
            >
              <Typography variant="h5">Contacts</Typography>
              <IconButton>
                <Users />
              </IconButton>
            </Stack>

            <Stack sx={{ width: "100%" }}>
              <Button
                variant="contained"
                startIcon={<Plus />}
                onClick={handleOpenDialog}
              >
                Add New Contact
              </Button>
            </Stack>
            <Divider />
            <Stack
              spacing={2}
              direction="column"
              sx={{ flexGrow: 1, overflowY: "auto", height: "100%" }}
            >
              <SimpleBarStyle timeout={500} clickOnTrack={false}>
                <Stack spacing={2.4}>
                  <Typography variant="subtitle2" sx={{ color: "#676767" }}>
                    All Contacts
                  </Typography>
                  {/* Contact List */}
                  {MembersList.map((el) => (
                    <ContactElement key={el.id} {...el} />
                  ))}
                </Stack>
              </SimpleBarStyle>
            </Stack>
          </Stack>
        </Box>

        {/* Right Panel */}
        <Box
          sx={{
            height: "100%",
            width: "calc(100vw - 420px)",
            backgroundColor:
              theme.palette.mode === "light"
                ? "#FFF"
                : theme.palette.background.default,
          }}
        >
          {/* Placeholder for when no contact is selected */}
          <Stack
            spacing={2}
            sx={{ height: "100%", width: "100%" }}
            alignItems="center"
            justifyContent="center"
          >
            <CircleDashed size={100} />
            <Typography variant="subtitle1">
              Select a contact to start a conversation
            </Typography>
          </Stack>
        </Box>
      </Stack>
      {openDialog && (
        <AddContactDialog open={openDialog} handleClose={handleCloseDialog} />
      )}
    </>
  );
};

export default Contacts;
